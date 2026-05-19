# MSPR COFRAP — Claude Code Context

## Project Overview
Secure authentication application for COFRAP (Compagnie Française de Réalisation
d'Applicatifs Professionnels). School project at EPSI — Bloc 2 RNCP35584.
The goal is to build a serverless authentication system using OpenFaaS on Kubernetes,
with automatic password generation, QR code delivery, and mandatory 2FA (TOTP).

## Repository Structure
mspr-cofrap/
├── frontend/                  ← React application (active development)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx          ✅ Done
│   │   │   ├── CreateAccount.jsx  ❌ To build
│   │   │   ├── Dashboard.jsx      ❌ To build
│   │   │   └── Renew.jsx          ❌ To build
│   │   ├── services/
│   │   │   └── api.js             ← OpenFaaS API calls
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx ← Session guard
│   │   ├── assets/
│   │   │   └── logo.png           ← COFRAP official logo
│   │   ├── App.jsx                ← Main router
│   │   └── index.css              ← Design system (CSS variables + global classes)
├── functions/                 ← Python OpenFaaS functions (not yet coded)
│   ├── generate-password/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── generate-2fa/
│   │   ├── handler.py
│   │   └── requirements.txt
│   └── authenticate/
│       ├── handler.py
│       └── requirements.txt
├── docker-compose.yml         ← Local PostgreSQL for development
├── init.sql                   ← Database schema
└── stack.yml                  ← OpenFaaS deployment config (later)

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router DOM |
| UI | Tailwind CSS + Lucide React (icons only) |
| Backend | Python 3.11 + OpenFaaS Community |
| Database | PostgreSQL (Kubernetes StatefulSet) |
| Infrastructure | Kubernetes K3S + Helm |
| Project management | GitHub + Jira (Scrum) |

## Design System — STRICT RULES

### Brand Identity
COFRAP colors: deep navy `#0D2B5E` + corporate blue `#1A6FD4`.
Style inspiration: Atlassian, Salesforce, Linear, Vercel.
Feel: enterprise software — premium, calm, trustworthy, polished.

### CSS Variables (defined in frontend/src/index.css)
```css
/* Backgrounds */
--bg: #f8fafc              /* page background */
--bg-2: #ffffff            /* cards, panels, inputs */
--bg-3: #f1f5f9            /* subtle backgrounds */

/* Brand */
--accent: #1A6FD4          /* COFRAP primary blue */
--accent-dark: #0D2B5E     /* COFRAP navy */
--accent-hover: #1560bb    /* hover state */
--accent-light: rgba(26,111,212,0.08)
--accent-muted: rgba(26,111,212,0.12)

/* Text */
--text-1: #0f172a          /* primary text */
--text-2: #475569          /* secondary text */
--text-3: #94a3b8          /* hints, placeholders */

/* Borders */
--border: rgba(15,43,94,0.10)
--border-hover: rgba(15,43,94,0.18)

/* Semantic */
--success: #16a34a
--warning: #d97706
--danger: #dc2626

/* Spacing */
--radius-sm: 6px
--radius: 8px
--radius-lg: 12px
--radius-xl: 16px

/* Shadows */
--shadow-sm: 0 1px 2px rgba(15,43,94,0.06)
--shadow: 0 1px 3px rgba(15,43,94,0.08), 0 1px 2px rgba(15,43,94,0.06)
--shadow-md: 0 4px 6px rgba(15,43,94,0.07), 0 2px 4px rgba(15,43,94,0.06)
```

### Global CSS Classes
```css
.input          /* standard form field, height 36px */
.label          /* form label, 12px, font-weight 500 */
.btn            /* base button */
.btn-primary    /* filled blue button */
.btn-secondary  /* outlined ghost button */
.btn-full       /* full width button, height 36px */
.card           /* white card with border and shadow */
.divider        /* horizontal separator */
```

### Typography
- Font family: **Geist** (Google Fonts) — loaded in index.css
- Scale: 11px (hints) → 12-13px (labels/captions) → 14px (body) → 22px (headings)
- Weights: 400 regular / 500 medium / 600 semibold
- Letter spacing: -0.025em on headings, 0.08em+ on uppercase labels

### Icons — Lucide React ONLY
Never use emojis as icons. Always import from lucide-react.
```jsx
import { ShieldCheck, Smartphone, Zap, ArrowRight } from 'lucide-react'

// Usage
<ShieldCheck size={18} strokeWidth={1.5} color="rgba(255,255,255,0.88)" />
```

### Page Layout — Auth pages (Login, CreateAccount, Renew)
Two-column split layout:

**Left panel** (form side):
- Width: 420px, flex-shrink: 0
- Background: #ffffff
- Border-right: 1px solid var(--border)
- Padding: 36px 48px
- Structure: logo top → form centered (flex:1, justify:center) → footer bottom
- Logo: `<img src={logoUrl} height="34px" objectFit="contain" />`

**Right panel** (brand side):
- Flex: 1
- Background: var(--accent-dark) = #0D2B5E
- Two decorative layers (radial gradients + subtle grid lines)
- Content: feature cards with Lucide icons, centered, max-width 460px

### Page Layout — Dashboard
- Top navbar: white bg, border-bottom, logo left + logout button right
- Content area: max-width 960px, centered, padding 32px
- Cards in 2-column grid on desktop

### Step Indicators (multi-step forms)
```jsx
// Two circles connected by a line — rendered manually, NOT with a loop
// Circle: 26x26px, border-radius 50%
// Active: background var(--accent), box-shadow 0 0 0 3px rgba(26,111,212,0.12)
// Inactive: transparent bg, border var(--border-hover)
// Line: width 40px, height 1.5px, margin 0 8px
// Completed step shows a checkmark SVG instead of number
```

### What to AVOID
- Gradients as primary backgrounds
- Emojis as icons
- Excessive box-shadows
- Too many colors in one page
- Cartoonish or bulky components
- Generic "AI template" looking layouts
- Inline styles for colors that should use CSS variables

## Completed Pages

### Login.jsx ✅
- Two-panel layout (form left / brand right)
- Two-step form: credentials → 2FA code
- Step indicator with circles + connecting line
- Error display with AlertCircle icon
- Show/hide password toggle with Eye/EyeOff
- Loading spinner on submit
- Link to /create-account

## Pages To Build

### CreateAccount.jsx ❌ — Jira: SCRUM-17
**Purpose:** New user registration flow.

**Layout:** Same two-panel as Login.

**Left panel — 3 steps:**
1. Username input → calls `generatePassword(username)`
2. Display password QR code + checkbox "I have scanned the QR code" → calls `generate2FA(username)`
3. Display 2FA QR code + checkbox "I have configured my authenticator app" → redirect to /login

**Right panel:** Visual 3-step process explanation with icons and short descriptions.

**Key rules:**
- Cannot proceed to next step without checking the confirmation checkbox
- QR codes displayed as: `<img src={`data:image/png;base64,${qrCode}`} />`
- Show warning: "This QR code is displayed only once"
- On success: redirect to /login with a success message

### Dashboard.jsx ❌ — Jira: SCRUM-19, SCRUM-20
**Purpose:** Post-login home page showing account status.

**Layout:** Navbar + content area.

**Navbar:** COFRAP logo left, logout button right (clears sessionStorage, redirects /login).

**Content sections:**
1. Welcome card: user initial avatar + username + status badge (Valid / Expiring soon / Expired)
2. Stats grid (2 cols):
    - Creation date card (from sessionStorage `gendate` timestamp)
    - Days remaining card + progress bar (6 months = 183 days)
3. Security card: two checklist items (auto-generated password ✓, 2FA active ✓)
4. Alert banner (only shown if status is orange or red): message + "Renew" button → /renew

**Status logic:**
```js
const sixMonths = 15778800 // seconds
const elapsed = now - gendate
const daysLeft = Math.floor((sixMonths - elapsed) / 86400)
// green: daysLeft > 30
// orange: daysLeft <= 30 && daysLeft > 0
// red: daysLeft <= 0
```

**Session data:** Read from `sessionStorage.getItem('username')` and `sessionStorage.getItem('gendate')`.
If no session → redirect to /login immediately.

### Renew.jsx ❌ — Jira: SCRUM-21
**Purpose:** Renew expired or expiring credentials.

**Layout:** Same two-panel as Login.

**Left panel — 2 steps:**
1. New password QR code (calls `generatePassword(username)`) + confirmation checkbox
2. New 2FA QR code (calls `generate2FA(username)`) + confirmation checkbox → redirect to /login

**Right panel:** Explanation of why renewal is needed + what will change.

**Entry points:**
- Automatic redirect from Login when `data.expired === true`
- Manual button from Dashboard when credentials are expiring

## API Service (frontend/src/services/api.js)

```js
// All functions are async, all call the OpenFaaS gateway
// Gateway URL from env: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080'

generatePassword(username)
// POST /function/generate-password
// Body: { username }
// Returns: { qr_code: "base64string" }

generate2FA(username)
// POST /function/generate-2fa
// Body: { username }
// Returns: { qr_code: "base64string" }

authenticate(username, password, totpCode)
// POST /function/authenticate
// Body: { username, password, totp_code }
// Returns: { success: bool, expired: bool, gendate: int }
```

## Session Management
```js
// Set on login
sessionStorage.setItem('username', username)
sessionStorage.setItem('gendate', data.gendate) // Unix timestamp

// Clear on logout
sessionStorage.clear()

// Guard in ProtectedRoute.jsx
const username = sessionStorage.getItem('username')
if (!username) return <Navigate to="/login" replace />
```

## Git Workflow
```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/SCRUM-XX-short-description

# Commit format — Jira ticket number is mandatory
git commit -m "[SCRUM-XX] Short description in English or French"

# Push and open PR to develop on GitHub
git push origin feature/SCRUM-XX-short-description
```
## Development Commands
```bash
# Start frontend dev server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Install a new package
cd frontend && npm install package-name
```

## Important Notes for Claude Code
1. Always work in the `frontend/` directory for React changes
2. Never hardcode colors — always use CSS variables from index.css
3. Always use Lucide React for icons, never emojis
4. Match the exact style of Login.jsx when building new pages
5. Read Login.jsx first before creating any new page
6. QR codes from the API are base64 PNG strings — display with data URI
7. The `gendate` field in the database is a Unix timestamp (seconds)
8. Kubernetes and OpenFaaS setup is handled separately — focus on frontend for now