---
layout: default
title: Accueil
nav_order: 1
description: Documentation technique de la plateforme COFRAP
permalink: /
---

# COFRAP — Documentation technique
{: .fs-9 }

Plateforme d'authentification serverless avec génération automatique de mot de passe, double authentification TOTP et rotation forcée tous les six mois.
{: .fs-6 .fw-300 }

[Démarrage rapide](deploy.html){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Référence API](api.html){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Vue d'ensemble

COFRAP est une plateforme d'authentification d'entreprise reposant sur quatre fonctions OpenFaaS indépendantes, une base PostgreSQL et un frontend React. Le système combine **TOTP** (Time-based One-Time Password, RFC 6238) avec trois défenses additionnelles : chiffrement Fernet du secret 2FA, codes de secours one-shot, et rate limiting des tentatives de connexion.

## Sections

### [Architecture](architecture.html)
Vue d'ensemble du système : composants, dépendances, flux de données entre le frontend, les fonctions OpenFaaS et la base PostgreSQL.

### [Double authentification (TOTP)](2fa.html)
Fonctionnement détaillé du protocole TOTP : génération du secret, calcul du code à 6 chiffres, vérification serveur.

### [Sécurité enterprise-grade](security.html)
Les trois défenses additionnelles qui transforment un TOTP classique en solution audit-ready.

### [Référence API](api.html)
Documentation interactive des quatre endpoints OpenFaaS (Swagger UI).

### [Déploiement local](deploy.html)
Procédure pas à pas pour démarrer la stack complète sur un poste de développement.

---

## Pour qui est cette documentation ?

- **Équipe backend** : implémentation des fonctions OpenFaaS, schéma de base de données, gestion des secrets.
- **Équipe frontend** : intégration des endpoints, gestion de la session, parcours utilisateur.
- **Équipe DevOps / SRE** : déploiement Kubernetes, configuration des secrets, monitoring.
- **Auditeurs de sécurité** : revue des choix cryptographiques, des mécanismes de protection et des limites connues.

## Stack technique

| Couche | Technologie |
|:-------|:------------|
| Frontend | React 18, Vite, React Router, lucide-react |
| Backend | Python 3.11, OpenFaaS Community |
| Cryptographie | `cryptography` (Fernet), `bcrypt`, `pyotp` |
| Base de données | PostgreSQL 16 |
| Infrastructure | Kubernetes K3S, Helm, faas-cli |
