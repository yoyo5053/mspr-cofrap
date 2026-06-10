# COFRAP — Secure Authentication Platform

> MSPR Bloc 2 — RNCP35584 | EPSI 2025/2026

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)
![OpenFaaS](https://img.shields.io/badge/OpenFaaS-Community-0097A7?style=flat)
![Kubernetes](https://img.shields.io/badge/Kubernetes-K3S-326CE5?style=flat&logo=kubernetes)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)

---

## Overview

As part of the MSPR Bloc 2 at EPSI, we developed a secure serverless authentication platform for **COFRAP** (Compagnie Française de Réalisation d'Applicatifs Professionnels).

The project addresses a concrete problem: users of the COFRAP cloud platform were choosing weak passwords and not enabling two-factor authentication, which led to many compromised accounts.

The solution enforces automatic credential generation, mandatory 2FA via QR code, and automatic credential rotation every 6 months. Everything is deployed on Kubernetes through OpenFaaS.

---

## Technologies

### Frontend
- **React 18** + **Vite** — user interface
- **Tailwind CSS** — styling
- **Lucide React** — icons
- **React Router DOM** — navigation

### Backend
- **Python 3.11** — serverless functions language
- **OpenFaaS Community** — serverless platform
- **pyotp** — TOTP generation (2FA)
- **qrcode** — QR code generation
- **cryptography (Fernet)** — encryption
- **bcrypt** — password and backup code hashing
- **psycopg2** — PostgreSQL connection

### Infrastructure
- **Kubernetes K3S** — container orchestration
- **Helm** — OpenFaaS deployment
- **PostgreSQL** — database
- **Docker Hub** — image registry

### Project management
- **Jira** — task tracking (Scrum)
- **GitHub** — version control
- **ClickUp** — Gantt and Kanban
- **Discord** — team communication

---

## Team

| Name | Role |
|---|---|
| **Youssef Taib** | Project management |
| **Cardinal** | Backend development |
| **Elariche** | Infrastructure |
| **Faouz** | Backend & frontend development |

---

> COFRAP · Solutions logicielles, performance durable.  
> EPSI 2025/2026
