---
layout: default
title: TOTP en détail
nav_order: 3
---

# La double authentification (TOTP)
{: .no_toc }

## Sommaire
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Vue d'ensemble

TOTP signifie **Time-based One-Time Password**. C'est l'algorithme standardisé par la [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238) et utilisé par Google Authenticator, Authy, 1Password et la grande majorité des applications d'authentification.

Sa force tient en un mot : **le temps remplace la communication**. Une fois le secret partagé à l'inscription, le client et le serveur peuvent calculer le même code indépendamment, sans communiquer.

## Le principe en trois étapes

### Étape A — Inscription (une seule fois)

```
Serveur:
  secret = random_bytes(20)                          # 160 bits aléatoires
  db.users.save(secret_2fa = encrypt(secret))        # chiffré Fernet
  qr_url = "otpauth://totp/COFRAP:michel
           ?secret=BASE32...&issuer=COFRAP"
  return qr_code(qr_url)

Client (Google Authenticator):
  scan QR
  store { label: "COFRAP", secret: "BASE32..." }
```

Le secret est partagé **une seule fois** via le QR. À partir de là, le client et le serveur peuvent calculer les mêmes codes indépendamment.

### Étape B — Calcul du code (toutes les 30 secondes)

```
T = floor(timestamp_unix / 30)         # numéro de période 30s
hash = HMAC-SHA1(secret, T)            # 20 octets
offset = hash[19] AND 0x0f             # 4 derniers bits
truncated = hash[offset..offset+4] AND 0x7fffffff
code = truncated MOD 1_000_000         # 6 chiffres
```

Les deux parties (le serveur et l'app du téléphone) exécutent ce calcul **indépendamment**, en utilisant la même entrée (le secret partagé et l'heure UTC). Si les deux horloges sont synchrones à 30 secondes près, ils obtiennent le même code.

### Étape C — Authentification

```python
# Le client envoie:
{ "username": "michel", "password": "...", "totp_code": "847291" }

# Le serveur:
user = db.find(username)
if not bcrypt.verify(user.password_hash, password):
    return 401

secret = decrypt(user.secret_2fa)
expected = compute_totp(secret, now())
if totp_code != expected:
    return 401

return success
```

## Pourquoi ça fonctionne

- **Le temps fait office de canal de synchronisation gratuit.** Pas besoin de connexion permanente entre l'app et le serveur.
- **Les codes ont une durée de vie très courte.** Même intercepté, un code est inutilisable après 30 secondes (60 secondes maximum avec la tolérance `valid_window=1` utilisée dans `authenticate`).
- **Le secret ne voyage qu'une seule fois.** Après le scan initial, il reste côté serveur (chiffré) et côté app (dans le stockage sécurisé du téléphone). Aucune transmission ultérieure.

## Implémentation côté serveur

La bibliothèque [`pyotp`](https://pyauth.github.io/pyotp/) fournit une implémentation conforme RFC 6238.

```python
import pyotp

# Génération du secret (à l'inscription)
secret = pyotp.random_base32()
totp_uri = pyotp.TOTP(secret).provisioning_uri(
    name="michel", issuer_name="COFRAP"
)
# totp_uri = "otpauth://totp/COFRAP:michel?secret=...&issuer=COFRAP"

# Vérification du code (à la connexion)
totp = pyotp.TOTP(secret)
is_valid = totp.verify(user_input, valid_window=1)
# valid_window=1 tolère ±30 secondes de dérive horaire
```

## Les limites du TOTP

{: .warning }
TOTP a trois faiblesses inhérentes qu'il faut connaître pour pouvoir les mitiger.

### 1. Phishable

Un attaquant qui exploite un faux site COFRAP peut intercepter password + TOTP et les rejouer en temps réel sur le vrai site. TOTP ne sait pas distinguer un site légitime d'un site frauduleux.

**Mitigation** : éducation utilisateur, vérification du domaine, futur passage à WebAuthn/Passkeys.

### 2. Shared secret côté serveur

Le secret 2FA est dans la base PostgreSQL. Si la base fuite (SQL injection, backup volé), tous les secrets pourraient être exposés.

**Mitigation** : le secret est **chiffré avec Fernet** avant stockage. Voir [Sécurité](security.html#chiffrement-du-secret-2fa).

### 3. Synchronisation horaire

Si l'horloge du téléphone dérive de plus de 60 secondes, les codes ne marchent plus.

**Mitigation** : `valid_window=1` (tolère ±30s), et NTP côté serveur.

## Comparaison avec d'autres méthodes 2FA

| Méthode | Sécurité | UX | Complexité | Phishable |
|:--------|:---------|:---|:-----------|:----------|
| SMS OTP | ❌ Faible | Moyen | Facile | Oui (+ SIM swap) |
| Email OTP | Moyenne | Lent | Facile | Oui |
| **TOTP (notre choix)** | **Bonne** | **Bon** | **Moyen** | **Oui** |
| Push notifications | Bonne | Excellent | Élevée | Oui (fatigue attacks) |
| WebAuthn / Passkeys | Excellente | Excellent | Élevée | **Non** |

WebAuthn est l'état de l'art en 2026 (utilisé par Google, GitHub, Microsoft) mais demande un investissement plus important. TOTP reste un choix solide pour une V1.
