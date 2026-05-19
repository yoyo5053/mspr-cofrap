---
layout: default
title: API Reference
nav_order: 5
---

# Référence API
{: .no_toc }

## Sommaire
{: .no_toc .text-delta }

1. TOC
{:toc}

---

L'application expose **quatre fonctions OpenFaaS** indépendantes. Chaque fonction accepte un POST avec un body JSON et retourne du JSON.

[Documentation interactive Swagger UI](api.html){: .btn .btn-primary }

## Endpoints

| Fonction | Endpoint | Body | Réponse |
|:---------|:---------|:-----|:--------|
| `generate-password` | `POST /function/generate-password` | `{username}` | `{qr_code}` |
| `generate-2fa` | `POST /function/generate-2fa` | `{username}` | `{qr_code, backup_codes[10]}` |
| `authenticate` | `POST /function/authenticate` | `{username, password, totp_code}` | `{success, expired, gendate}` |
| `recover-with-backup-code` | `POST /function/recover-with-backup-code` | `{username, backup_code}` | `{success, qr_code}` |

## generate-password

Génère un mot de passe aléatoire de 24 caractères, le hash en bcrypt et le stocke. Crée l'utilisateur si nécessaire (renew si existant). Retourne un QR code contenant le mot de passe en clair.

**Requête**
```http
POST /function/generate-password
Content-Type: application/json

{ "username": "michel.ranu" }
```

**Réponse 200**
```json
{ "qr_code": "iVBORw0KGgoAAAANSU..." }
```

Le `qr_code` est une chaîne base64 d'une image PNG. Affichage frontend : `<img src="data:image/png;base64,${qr_code}"/>`.

## generate-2fa

Génère un secret TOTP, le chiffre avec Fernet, le stocke. Génère 10 codes de secours, les hash avec bcrypt, les stocke. Retourne un QR code TOTP et les 10 codes en clair (à usage unique : retournés une fois, jamais relus).

**Requête**
```http
POST /function/generate-2fa
Content-Type: application/json

{ "username": "michel.ranu" }
```

**Réponse 200**
```json
{
  "qr_code": "iVBORw0KGgoAAAANSU...",
  "backup_codes": [
    "A2B4-C6D8", "E1F3-G5H7", "I9J2-K4L6",
    "M8N0-P2Q4", "R6S8-T1U3", "V5W7-X9Y2",
    "Z4A6-B8C1", "D3E5-F7G9", "H2I4-J6K8", "L1M3-N5P7"
  ]
}
```

{: .warning }
Les `backup_codes` ne seront jamais réaffichés. Le frontend doit forcer l'utilisateur à les sauvegarder (copier, télécharger ou imprimer) avant de continuer.

## authenticate

Vérifie credentials + TOTP avec rate limiting. Retourne le statut d'expiration des credentials (rotation 6 mois).

**Requête**
```http
POST /function/authenticate
Content-Type: application/json

{
  "username": "michel.ranu",
  "password": "AbCdEf1234!@#xyzPQRST567=",
  "totp_code": "847291"
}
```

**Réponse 200 (succès)**
```json
{
  "success": true,
  "expired": false,
  "gendate": 1715000000
}
```

**Réponse 200 (échec)**
```json
{ "success": false, "error": "invalid_credentials" }
```

**Réponse 200 (rate limit)**
```json
{
  "success": false,
  "error": "rate_limited",
  "message": "Trop de tentatives. Réessayez dans 1 minute."
}
```

## recover-with-backup-code

Vérifie un code de secours, le marque comme utilisé, génère un nouveau mot de passe. Le secret 2FA reste inchangé : l'utilisateur peut se reconnecter immédiatement avec le nouveau mot de passe + son code TOTP habituel.

**Requête**
```http
POST /function/recover-with-backup-code
Content-Type: application/json

{
  "username": "michel.ranu",
  "backup_code": "A2B4-C6D8"
}
```

**Réponse 200 (succès)**
```json
{
  "success": true,
  "qr_code": "iVBORw0KGgoAAAANSU..."
}
```

**Réponse 200 (échec)**
```json
{ "success": false, "error": "invalid_code" }
```

## Codes d'erreur normalisés

| Code | Signification | Action UI |
|:-----|:--------------|:----------|
| `missing_fields` | Un champ obligatoire est vide | Afficher "Veuillez remplir tous les champs" |
| `invalid_credentials` | Username, password ou TOTP invalide | Message générique pour ne pas révéler quel champ est faux |
| `rate_limited` | Plus de 5 échecs dans la dernière minute | Afficher le délai d'attente, désactiver le formulaire |
| `invalid_code` | Code de secours inconnu ou déjà utilisé | Inviter à essayer un autre code |
| `2fa_not_configured` | L'utilisateur n'a pas finalisé sa configuration 2FA | Rediriger vers `/create-account` ou contacter support |
| `user_not_found` | Username inexistant pour `generate-2fa` | Erreur générique côté frontend |
| `invalid_json` | Body mal formé | Erreur générique côté frontend |

## Considérations transverses

### Format des QR codes

Tous les `qr_code` retournés sont des **chaînes base64** représentant des images PNG. Le frontend les affiche directement via `data:image/png;base64,...`.

Pour le 2FA, le contenu encodé est un URI `otpauth://totp/COFRAP:{username}?secret=...&issuer=COFRAP` que les applications type Google Authenticator savent parser nativement.

### Idempotence

`generate-password` est idempotent : appeler la fonction plusieurs fois pour le même username régénère simplement le mot de passe (utilisé aussi pour le renouvellement).

`generate-2fa` est idempotent : régénère le secret 2FA et les 10 codes de secours. Les anciens codes sont supprimés.

`authenticate` et `recover-with-backup-code` ne sont **pas** idempotents : chaque appel enregistre une tentative et peut déclencher le rate limiting.

### Headers

Aucune fonction ne nécessite d'header particulier en dehors de `Content-Type: application/json`. La passerelle OpenFaaS gère le routing.

En production, la passerelle devra activer TLS et éventuellement un header `Authorization` si les fonctions sont accessibles directement (sinon, accès via frontend uniquement).
