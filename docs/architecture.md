---
layout: default
title: Architecture
nav_order: 2
---

# Architecture
{: .no_toc }

## Sommaire
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Vue d'ensemble

L'application est entièrement serverless. Le frontend SPA React communique avec quatre fonctions OpenFaaS indépendantes déployées sur Kubernetes, qui partagent une base PostgreSQL et utilisent un secret de chiffrement géré via Kubernetes Secrets.

```
+-----------------------------------------------------------------+
|                       Navigateur utilisateur                    |
|                  Frontend React 18 (Vite, port 5174)            |
+-----------------------------------------------------------------+
                              |
                              | HTTPS (JSON)
                              v
+-----------------------------------------------------------------+
|              Gateway OpenFaaS (Kubernetes Service)              |
+-----------------------------------------------------------------+
       |                  |                   |                |
       v                  v                   v                v
+-------------+   +--------------+   +---------------+  +-------------+
| generate-   |   | generate-2fa |   | authenticate  |  | recover-    |
| password    |   | (pyotp +     |   | (pyotp +      |  | with-backup |
| (bcrypt +   |   | Fernet +     |   | Fernet +      |  | -code       |
| qrcode)     |   | bcrypt + qr) |   | rate limit)   |  | (bcrypt)    |
+-------------+   +--------------+   +---------------+  +-------------+
       |                  |                   |                |
       +------------------+--+----------------+----------------+
                             |
                             v
                  +----------------------+
                  |   PostgreSQL 16      |
                  |  - users             |
                  |  - backup_codes      |
                  |  - login_attempts    |
                  +----------------------+
```

## Composants

### Frontend (`frontend/`)

Single Page Application React 18 servie en production via NGINX. Les pages principales :

| Route | Composant | Rôle |
|:------|:----------|:-----|
| `/login` | `Login.jsx` | Connexion 2 étapes : credentials → TOTP |
| `/create-account` | `CreateAccount.jsx` | Inscription 4 étapes : username → password → 2FA → backup codes |
| `/dashboard` | `Dashboard.jsx` | Tableau de bord avec timeline de validité |
| `/renew` | `Renew.jsx` | Renouvellement 4 étapes (similaire à création) |
| `/recover` | `Recover.jsx` | Récupération par code de secours, 2 étapes |

La session utilisateur est stockée dans `sessionStorage` (clé `username` et `gendate`). Le hook `useIsMobile` adapte le layout sous 900px.

### Backend (`functions/`)

Quatre fonctions OpenFaaS indépendantes, build via le template `python3`. Chaque fonction est un container Docker isolé.

| Fonction | Endpoint | Description |
|:---------|:---------|:------------|
| `generate-password` | `POST /function/generate-password` | Génère un mot de passe 24 caractères, le hash en bcrypt et retourne un QR code |
| `generate-2fa` | `POST /function/generate-2fa` | Génère un secret TOTP chiffré (Fernet), 10 codes de secours hashés, et retourne un QR code `otpauth://` |
| `authenticate` | `POST /function/authenticate` | Vérifie credentials + TOTP, applique rate limit, retourne expiration |
| `recover-with-backup-code` | `POST /function/recover-with-backup-code` | Vérifie un code de secours, le marque utilisé, régénère le mot de passe |

### Base de données (PostgreSQL)

Trois tables — voir [Schéma DB](#schéma-db).

### Secrets et configuration

Variables d'environnement injectées par Kubernetes Secrets :

| Variable | Géré par | Utilisé par |
|:---------|:---------|:------------|
| `DATABASE_URL` | Secret `cofrap-db-url` | Toutes les fonctions |
| `ENCRYPTION_KEY` | Secret `cofrap-encryption-key` | `generate-2fa`, `authenticate` |

## Schéma DB

```sql
CREATE TABLE users (
    id                      SERIAL PRIMARY KEY,
    username                VARCHAR(64)  NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,    -- bcrypt
    secret_2fa_encrypted    TEXT,                     -- Fernet (AES-128-CBC + HMAC)
    gendate                 BIGINT,                   -- timestamp Unix
    created_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE backup_codes (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   VARCHAR(255) NOT NULL,                -- bcrypt
    used_at     TIMESTAMP,                            -- NULL = code encore valide
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_backup_codes_user ON backup_codes(user_id);

CREATE TABLE login_attempts (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(64) NOT NULL,
    attempted_at  TIMESTAMP DEFAULT NOW(),
    success       BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_attempts_username_time
    ON login_attempts(username, attempted_at);
```

### Décisions de design

- **Aucun stockage en clair.** Mot de passe et codes de secours hashés (bcrypt), secret 2FA chiffré (Fernet).
- **Cascade sur suppression.** Supprimer un user supprime automatiquement ses codes de secours.
- **Index sur (username, attempted_at).** Permet un rate limit O(log n) même avec des millions de lignes.
- **`gendate` en BIGINT.** Timestamp Unix en secondes, format compact, facilement manipulable en Python et JavaScript sans problème de fuseau horaire.
