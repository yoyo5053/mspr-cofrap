---
layout: default
title: Déploiement
nav_order: 6
---

# Démarrage et déploiement local
{: .no_toc }

## Sommaire
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Procédure complète pour lancer la stack en local : base de données PostgreSQL, fonctions OpenFaaS, frontend React. Suppose une installation préalable de Docker Desktop, faas-cli et Node.js 18+.

## Prérequis

| Outil | Version | Installation |
|:------|:--------|:-------------|
| Docker Desktop | dernière | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| Kubernetes (intégré à Docker Desktop, K3S ou minikube) | 1.28+ | activable dans Docker Desktop > Settings > Kubernetes |
| `faas-cli` | 0.16+ | `choco install faas-cli` (Windows) ou `brew install faas-cli` (macOS) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Python | 3.11+ | pour générer la clé Fernet |
| `psql` (PostgreSQL client) | 14+ | inclus avec PostgreSQL |

## Étape 1 — Générer la clé Fernet

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Exemple de sortie:
# GqJ4Y6dM9vQ8XzN3Hk7Pa2sBcRfTwUyL5jE0iVoWnZE=
```

{: .danger }
Cette clé est **critique** : sa perte rend tous les secrets 2FA en base irrécupérables. Stockez-la dans un gestionnaire de secrets (Vault, 1Password, AWS Secrets Manager) **avant** de continuer.

## Étape 2 — Démarrer PostgreSQL

```bash
docker compose up -d postgres
```

Cela démarre PostgreSQL sur le port 5432 avec :
- User : `cofrap`
- Mot de passe : `cofrap`
- Base : `cofrap`

## Étape 3 — Initialiser le schéma

```bash
psql -h localhost -U cofrap -d cofrap -f init.sql
```

Cela crée les trois tables : `users`, `backup_codes`, `login_attempts` avec leurs index.

Vérification :
```bash
psql -h localhost -U cofrap -d cofrap -c "\dt"
# Doit afficher 3 tables
```

## Étape 4 — Créer les secrets OpenFaaS

```bash
faas-cli secret create cofrap-encryption-key \
    --from-literal="GqJ4Y6dM9vQ8XzN3Hk7Pa2sBcRfTwUyL5jE0iVoWnZE="

faas-cli secret create cofrap-db-url \
    --from-literal="postgres://cofrap:cofrap@postgres:5432/cofrap"
```

## Étape 5 — Build et déploiement des fonctions

Depuis la racine du projet :

```bash
faas-cli up -f stack.yml

# Cela exécute en séquence:
# - faas-cli build (crée les 4 images Docker)
# - faas-cli push (optionnel, pour cluster distant)
# - faas-cli deploy (déploie sur OpenFaaS)
```

Vérifier que les fonctions sont déployées :

```bash
faas-cli list
# Doit lister:
# Function                      Invocations    Replicas
# generate-password             0              1
# generate-2fa                  0              1
# authenticate                  0              1
# recover-with-backup-code      0              1
```

## Étape 6 — Démarrer le frontend

```bash
cd frontend
npm install
npm run dev

# Le frontend est disponible sur http://localhost:5173 (ou 5174 si le port est occupé)
```

## Étape 7 — Vérification

1. Ouvrir [http://localhost:5174](http://localhost:5174)
2. Cliquer **"Créer un accès"** → entrer un username de test
3. Scanner les deux QR codes successivement (mot de passe + 2FA)
4. Sauvegarder les 10 codes de secours (copier ou télécharger)
5. Se connecter avec le mot de passe scanné + le code TOTP de l'app
6. Vérifier l'apparition du Dashboard avec le statut **"Sécurisé"**

## Tests manuels recommandés

### Rate limiting

1. Entrer un mauvais mot de passe 5 fois → vérifier le message "Trop de tentatives"
2. Attendre 1 minute → réessayer avec le bon mot de passe → succès

### Récupération par code de secours

1. Se connecter une fois normalement
2. Se déconnecter
3. Cliquer **"Mot de passe oublié ?"** sur Login
4. Entrer username + un des 10 codes de secours
5. Vérifier qu'un nouveau QR mot de passe est affiché
6. Vérifier que le code utilisé ne fonctionne plus (essayer une 2e fois → erreur)
7. Se reconnecter avec le nouveau mot de passe + le même code 2FA qu'avant

### Renouvellement forcé

Pour simuler une expiration :

```sql
-- Forcer gendate à 7 mois dans le passé
UPDATE users SET gendate = EXTRACT(EPOCH FROM NOW() - INTERVAL '7 months')::BIGINT
WHERE username = 'votre_test_user';
```

Puis se connecter → redirection automatique vers `/renew`.

## Debug et logs

### Logs OpenFaaS

```bash
# Logs en temps réel d'une fonction
faas-cli logs generate-password --follow

# Logs des dernières N lignes
faas-cli logs authenticate --tail 100
```

### Logs PostgreSQL

```bash
docker logs -f mspr-cofrap-postgres-1
```

### Erreurs courantes

| Symptôme | Cause probable | Solution |
|:---------|:---------------|:---------|
| 500 sur `generate-2fa` | `ENCRYPTION_KEY` manquante ou invalide | Vérifier `faas-cli secret list` |
| 500 sur toutes les fonctions | `DATABASE_URL` invalide ou base inaccessible | Vérifier que PostgreSQL tourne, vérifier le secret |
| Build OpenFaaS échoue | Module Python manquant | Vérifier `requirements.txt` de la fonction |
| Port 5432 déjà occupé | Autre PostgreSQL local | Stopper l'instance locale ou changer le port dans `docker-compose.yml` |
| Frontend ne charge pas les QR | CORS ou gateway URL incorrecte | Vérifier `VITE_GATEWAY_URL` dans `.env` |

## Déploiement en production

Pour un déploiement production, voir aussi [Sécurité — Recommandations production](security.html#recommandations-pour-la-production).

Points obligatoires avant mise en prod :

- TLS sur la passerelle OpenFaaS (cert-manager + Let's Encrypt)
- Clé Fernet en HSM ou KMS géré
- Rate limit IP au niveau de la passerelle
- Backups chiffrés PostgreSQL avec rotation
- Monitoring : alertes sur `login_attempts` avec `success=FALSE` en pic
- Audit RBAC Kubernetes : qui peut lire les secrets ?
