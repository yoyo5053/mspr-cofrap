---
layout: default
title: Sécurité
nav_order: 4
---

# Les 3 défenses enterprise
{: .no_toc }

## Sommaire
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Un TOTP isolé reste vulnérable à plusieurs scénarios. Les trois mesures suivantes transforment ce 2FA basique en solution de niveau entreprise, défendable en audit.

## Chiffrement du secret 2FA

Le secret TOTP est stocké **chiffré** dans la base de données PostgreSQL. Si la base fuite (SQL injection, backup volé, dump accidentel), l'attaquant ne récupère que des données inutilisables sans la clé.

### Implémentation : Fernet

[Fernet](https://cryptography.io/en/latest/fernet/) (bibliothèque `cryptography`) utilise AES-128-CBC pour le chiffrement et HMAC-SHA256 pour l'authentification. Clé de 256 bits, IV aléatoire par chiffrement, signature intégrée. C'est un format opinionatedly safe, impossible à mal utiliser.

```python
from cryptography.fernet import Fernet
import os

# Initialisation au chargement du module
ENCRYPTION_KEY = os.environ['ENCRYPTION_KEY'].encode()
cipher = Fernet(ENCRYPTION_KEY)

# À la création du secret 2FA
secret = pyotp.random_base32()
encrypted_secret = cipher.encrypt(secret.encode()).decode()
db.update(user_id, secret_2fa_encrypted=encrypted_secret)

# À l'authentification
encrypted = db.get(user_id).secret_2fa_encrypted
secret = cipher.decrypt(encrypted.encode()).decode()
totp = pyotp.TOTP(secret)
if not totp.verify(totp_code, valid_window=1):
    return error
```

{: .danger }
La clé `ENCRYPTION_KEY` est **stockée dans un Kubernetes Secret** et injectée comme variable d'environnement dans le pod OpenFaaS. Elle ne doit jamais apparaître dans le repo Git, ni dans les images Docker. **Sa perte rend tous les secrets 2FA irrécupérables.** Stockez-la dans un gestionnaire de secrets (Vault, AWS Secrets Manager, HSM).

### Génération de la clé

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Exemple de sortie:
# GqJ4Y6dM9vQ8XzN3Hk7Pa2sBcRfTwUyL5jE0iVoWnZE=
```

---

## Codes de secours

À la création du compte (et à chaque renouvellement), le système génère **10 codes au format `XXXX-XXXX`** que l'utilisateur doit imprimer, télécharger ou copier dans son gestionnaire de mots de passe. Ces codes permettent une **auto-récupération** en cas de perte du téléphone.

### Génération et stockage

```python
import secrets
import bcrypt

# Alphabet sans caractères ambigus (pas de 0, O, 1, I, L)
BACKUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

def generate_backup_code():
    raw = ''.join(secrets.choice(BACKUP_CODE_ALPHABET) for _ in range(8))
    return f"{raw[:4]}-{raw[4:]}"

# À la création : 10 codes en clair, hashés avec bcrypt, stockés
codes_plain = [generate_backup_code() for _ in range(10)]
for code in codes_plain:
    code_hash = bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode()
    db.backup_codes.insert(user_id, code_hash)

# Retour au client : codes en clair UNE SEULE FOIS, jamais relus
return {"qr_code": qr, "backup_codes": codes_plain}
```

### Utilisation pour récupération

L'utilisateur saisit son username + un code de secours sur `/recover`. Le backend compare le code soumis avec les hashes en base via `bcrypt.checkpw`. Si match :

1. Le code est **marqué comme utilisé** (`used_at = NOW()`)
2. Un **nouveau mot de passe** est généré
3. Le code consommé ne fonctionnera **plus jamais**

{: .success }
Ce pattern élimine le besoin d'intervention administrative en cas de perte du téléphone, tout en préservant le modèle de sécurité (le code de secours est imprimé, donc une possession). Pattern utilisé par Google, GitHub, AWS, Atlassian.

---

## Rate limiting

Le code TOTP fait 6 chiffres, soit 1 000 000 combinaisons. Sans protection, un attaquant pourrait théoriquement le brute-forcer.

Avec **5 tentatives échouées max par minute par username**, l'attaque devient pratiquement impossible : il faudrait des milliers de jours pour couvrir l'espace.

### Implémentation

```python
# Avant la vérification du mot de passe
cur.execute(
    "SELECT COUNT(*) FROM login_attempts "
    "WHERE username = %s "
    "  AND success = FALSE "
    "  AND attempted_at > NOW() - INTERVAL '1 minute'",
    (username,)
)
failed_count = cur.fetchone()[0]

if failed_count >= 5:
    return {"success": False, "error": "rate_limited"}

# ... vérification du mot de passe et du TOTP ...

# Après la vérification, on enregistre le résultat (success ou failure)
cur.execute(
    "INSERT INTO login_attempts (username, success) VALUES (%s, %s)",
    (username, is_valid)
)
```

### Audit trail

La table `login_attempts` sert aussi d'**audit trail**. Tracer toutes les tentatives (réussies et échouées) permet de détecter post-mortem des comportements anormaux : pics d'échecs, tentatives groupées sur plusieurs usernames, etc.

---

## Propriétés de sécurité garanties

| Propriété | Mécanisme |
|:----------|:----------|
| Confidentialité du mot de passe | bcrypt avec cost 12, sel aléatoire par mot de passe |
| Confidentialité du secret TOTP | Fernet (AES-128-CBC + HMAC-SHA256), clé en Kubernetes Secret |
| Intégrité du secret 2FA | HMAC intégré dans Fernet, modification = decryption échoue |
| Non-répudiation des connexions | Table `login_attempts` traçant timestamp + success |
| Résistance au brute force | Rate limiting 5 échecs/min, lockout glissant |
| Récupération autonome | 10 codes de secours one-shot, valides indéfiniment jusqu'à utilisation |
| Rotation forcée | Champ `gendate` + vérification 6 mois, redirection automatique vers `/renew` |

## Limites connues et risques résiduels

- **Phishing TOTP.** Un site frauduleux peut intercepter et rejouer le code en temps réel. Mitigation future : migration vers WebAuthn/Passkeys.
- **Vol du téléphone avec app déverrouillée.** Permet à un attaquant de générer les codes légitimes. Mitigation : exiger un PIN ou biométrie dans l'app authentificateur.
- **Compromission de la clé Fernet.** Permet, avec accès à la base, de régénérer les codes TOTP. Mitigation : rotation périodique de la clé, stockage en HSM pour la production.
- **Rate limit par username uniquement.** Un attaquant peut itérer sur différents usernames. Mitigation : ajouter un rate limit par IP au niveau de la passerelle (NGINX, Traefik).

## Recommandations pour la production

{: .warning }
Avant tout déploiement en production, valider les points suivants.

1. Activer TLS sur la passerelle OpenFaaS (Let's Encrypt + cert-manager)
2. Stocker la clé Fernet dans un HSM ou un KMS géré (AWS KMS, GCP KMS, HashiCorp Vault)
3. Ajouter un rate limit par IP au niveau de la passerelle (5 req/sec)
4. Configurer des alertes sur les pics de `login_attempts` avec `success=FALSE`
5. Mettre en place une politique de rotation des mots de passe pour la base (90 jours)
6. Activer les backups chiffrés de PostgreSQL
7. Auditer régulièrement la liste des secrets Kubernetes (RBAC)

## Conformité

La conception respecte les recommandations suivantes :

- **NIST SP 800-63B AAL2.** Niveau Authenticator Assurance 2 : 2 facteurs indépendants, dont au moins un cryptographique.
- **RFC 6238 (TOTP).** Implémentation conforme via la bibliothèque `pyotp`.
- **RGPD article 32.** Mesures techniques appropriées : chiffrement, hashage, intégrité, traçabilité.
- **OWASP ASVS v4.0 niveau 2.** Verification Standard for authentication (chapitre 2).
