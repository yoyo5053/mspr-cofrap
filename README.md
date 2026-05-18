# COFRAP — Plateforme d'Authentification Sécurisée

> MSPR Bloc 2 — RNCP35584 | EPSI 2025/2026

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)
![OpenFaaS](https://img.shields.io/badge/OpenFaaS-Community-0097A7?style=flat)
![Kubernetes](https://img.shields.io/badge/Kubernetes-K3S-326CE5?style=flat&logo=kubernetes)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql)

---

## Présentation

Dans le cadre du MSPR Bloc 2 à l'EPSI, nous avons développé pour la **COFRAP** (Compagnie Française de Réalisation d'Applicatifs Professionnels) une plateforme d'authentification sécurisée en architecture serverless.

Le projet répond à un problème concret : les utilisateurs de la plateforme cloud COFRAP utilisaient des mots de passe trop faibles et n'activaient pas la double authentification, entraînant de nombreuses compromissions de comptes.

La solution met en place une génération automatique des identifiants, une 2FA obligatoire via QR code, et une rotation automatique des credentials tous les 6 mois — le tout déployé sur Kubernetes via OpenFaaS.

---

## Technologies utilisées

### Frontend
- **React 18** + **Vite** — interface utilisateur
- **Tailwind CSS** — styles
- **Lucide React** — icônes
- **React Router DOM** — navigation

### Backend
- **Python 3.11** — langage des fonctions serverless
- **OpenFaaS Community** — plateforme serverless
- **pyotp** — génération TOTP (2FA)
- **qrcode** — génération des QR codes
- **cryptography** — chiffrement AES-256
- **psycopg2** — connexion PostgreSQL

### Infrastructure
- **Kubernetes K3S** — orchestration des conteneurs
- **Helm** — déploiement OpenFaaS
- **PostgreSQL** — base de données
- **Docker Hub** — registre des images

### Gestion de projet
- **Jira** — suivi des tickets (Scrum)
- **GitHub** — versioning et collaboration
- **ClickUp** — Gantt et Kanban
- **Discord** — communication d'équipe

---

## Équipe

| Nom | Rôle |
|---|---|
| **Youssef** | 
| **Cardinal** | 
| **Elauriche** | 
| **Faouz** | 

---

> COFRAP · Solutions logicielles, performance durable.  
> EPSI 2025/2026
