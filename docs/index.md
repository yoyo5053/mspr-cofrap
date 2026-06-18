---
layout: default
title: Home
nav_order: 1
description: Technical documentation for the COFRAP platform
permalink: /
---

# COFRAP — Technical Documentation
{: .fs-9 }

Serverless authentication platform with automatic password generation, TOTP two-factor authentication, and forced rotation every six months.
{: .fs-6 .fw-300 }

[Quick Start](deploy.html){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[API Reference](api.html){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Overview

COFRAP is an enterprise authentication platform built on four independent OpenFaaS functions, a PostgreSQL database, and a React frontend. The system combines **TOTP** (Time-based One-Time Password, RFC 6238) with three additional defenses: Fernet encryption of the 2FA secret, one-shot backup codes, and rate limiting on login attempts.

## Sections

### [Architecture](architecture.html)
System overview: components, dependencies, and data flow between the frontend, OpenFaaS functions, and PostgreSQL database.

### [Two-Factor Authentication (TOTP)](2fa.html)
Detailed walkthrough of the TOTP protocol: secret generation, 6-digit code computation, server-side verification.

### [Enterprise-Grade Security](security.html)
The three additional defenses that turn a basic TOTP setup into an audit-ready solution.

### [API Reference](api.html)
Interactive documentation for the four OpenFaaS endpoints (Swagger UI).

### [Local Deployment](deploy.html)
Step-by-step procedure to start the full stack on a development machine.

---

## Who is this documentation for?

- **Backend team**: implementing OpenFaaS functions, the database schema, secrets management.
- **Frontend team**: integrating endpoints, session management, user flows.
- **DevOps / SRE team**: Kubernetes deployment, secrets configuration, monitoring.
- **Security auditors**: review of cryptographic choices, protection mechanisms, and known limitations.

## Tech Stack

| Layer | Technology |
|:-------|:------------|
| Frontend | React 18, Vite, React Router, lucide-react |
| Backend | Python 3.11, OpenFaaS Community |
| Cryptography | `cryptography` (Fernet), `bcrypt`, `pyotp` |
| Database | PostgreSQL 16 |
| Infrastructure | Kubernetes K3S, Helm, faas-cli |
