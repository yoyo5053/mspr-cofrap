"""
Builds the 2FA documentation PDF using Microsoft Edge headless.
One-shot helper script. Output: C:\\Users\\km\\Downloads\\COFRAP-2FA-Documentation.pdf
"""
import base64
import os
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).parent
LOGO = PROJECT / 'frontend' / 'src' / 'assets' / 'logo.png'
HTML_OUT = PROJECT / '.pdf-build.html'
PDF_OUT_TEMP = PROJECT / '.pdf-build.pdf'
DOWNLOADS = Path.home() / 'Downloads'
PDF_FINAL = DOWNLOADS / 'COFRAP-2FA-Documentation.pdf'

EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'


def b64_logo():
    return base64.b64encode(LOGO.read_bytes()).decode()


HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>COFRAP - Documentation 2FA</title>
<style>
@page {
    size: A4;
    margin: 22mm 18mm 22mm 18mm;
    @bottom-center { content: counter(page); }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0f172a; font-size: 11pt; line-height: 1.55; -webkit-font-smoothing: antialiased; }
body { padding: 0; }

/* Cover page */
.cover { page-break-after: always; min-height: 90vh; display: flex; flex-direction: column; justify-content: center; padding: 60px 40px; background: linear-gradient(135deg, #0D2B5E 0%, #1A6FD4 100%); color: #ffffff; margin: -22mm -18mm; padding: 80px 60px; }
.cover img { height: 80px; margin-bottom: 60px; filter: brightness(0) invert(1); }
.cover .eyebrow { font-size: 11pt; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.65; margin-bottom: 16px; font-weight: 600; }
.cover h1 { font-size: 38pt; font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; margin-bottom: 24px; }
.cover h1 .accent { background: linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.cover .lead { font-size: 14pt; opacity: 0.78; max-width: 520px; line-height: 1.5; margin-bottom: 60px; }
.cover .meta { border-top: 1px solid rgba(255,255,255,0.18); padding-top: 24px; font-size: 10pt; opacity: 0.7; }
.cover .meta strong { color: #ffffff; font-weight: 600; }

/* Sections */
h2 { font-size: 22pt; font-weight: 600; letter-spacing: -0.025em; margin: 32px 0 8px; color: #0f172a; page-break-after: avoid; }
h2 .num { color: #1A6FD4; font-weight: 600; margin-right: 12px; }
h3 { font-size: 14pt; font-weight: 600; letter-spacing: -0.015em; margin: 24px 0 8px; color: #0f172a; page-break-after: avoid; }
h4 { font-size: 11.5pt; font-weight: 600; letter-spacing: -0.005em; margin: 18px 0 6px; color: #1A6FD4; }
.section-lead { font-size: 11.5pt; color: #475569; margin-bottom: 16px; line-height: 1.5; }

p { margin-bottom: 10px; }
strong { font-weight: 600; color: #0f172a; }

/* TOC */
.toc { border: 1px solid rgba(15,43,94,0.10); border-radius: 8px; padding: 20px 24px; margin: 24px 0; background: #f8fafc; }
.toc h3 { margin-top: 0; }
.toc ol { list-style: none; counter-reset: toc; }
.toc li { counter-increment: toc; padding: 4px 0; display: flex; justify-content: space-between; font-size: 10.5pt; color: #475569; }
.toc li::before { content: counter(toc, decimal-leading-zero); color: #1A6FD4; font-weight: 600; margin-right: 10px; min-width: 24px; }
.toc li .title { flex: 1; color: #0f172a; }
.toc li .sub { font-size: 9pt; color: #94a3b8; }

/* Callouts */
.callout { padding: 14px 18px; border-radius: 8px; margin: 14px 0; border: 1px solid; font-size: 10.5pt; line-height: 1.55; }
.callout.info { background: rgba(26,111,212,0.05); border-color: rgba(26,111,212,0.20); }
.callout.warn { background: rgba(217,119,6,0.06); border-color: rgba(217,119,6,0.22); }
.callout.danger { background: rgba(220,38,38,0.05); border-color: rgba(220,38,38,0.22); }
.callout.success { background: rgba(22,163,74,0.06); border-color: rgba(22,163,74,0.22); }
.callout .label { font-weight: 600; text-transform: uppercase; font-size: 9pt; letter-spacing: 0.08em; margin-bottom: 4px; }
.callout.info .label { color: #1A6FD4; }
.callout.warn .label { color: #d97706; }
.callout.danger .label { color: #dc2626; }
.callout.success .label { color: #16a34a; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 10pt; }
th { text-align: left; padding: 10px 12px; background: #f1f5f9; font-weight: 600; color: #0f172a; border-bottom: 1px solid rgba(15,43,94,0.18); font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.04em; }
td { padding: 9px 12px; border-bottom: 1px solid rgba(15,43,94,0.08); vertical-align: top; color: #334155; }
td code { font-size: 9pt; }

/* Code blocks */
pre { background: #0f172a; color: #e2e8f0; padding: 14px 16px; border-radius: 6px; font-family: "SF Mono", Menlo, Consolas, "Courier New", monospace; font-size: 9pt; line-height: 1.55; overflow-x: auto; margin: 12px 0; page-break-inside: avoid; }
pre.sql { background: #0d2b5e; }
pre .c { color: #64748b; }
pre .k { color: #93c5fd; }
pre .s { color: #86efac; }
pre .n { color: #fcd34d; }
code { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 9.5pt; background: #f1f5f9; padding: 1px 6px; border-radius: 3px; color: #1A6FD4; }

/* Diagram */
.diagram { background: #f8fafc; border: 1px solid rgba(15,43,94,0.10); border-radius: 8px; padding: 20px; margin: 16px 0; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 8.5pt; line-height: 1.5; white-space: pre; color: #334155; page-break-inside: avoid; }

/* Cards grid */
.cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 14px 0; }
.card { border: 1px solid rgba(15,43,94,0.10); border-radius: 8px; padding: 14px 16px; background: #ffffff; }
.card .badge { display: inline-block; background: rgba(26,111,212,0.10); color: #1A6FD4; font-size: 8.5pt; font-weight: 600; padding: 3px 8px; border-radius: 99px; margin-bottom: 8px; letter-spacing: 0.04em; text-transform: uppercase; }
.card h4 { margin: 0 0 4px; color: #0f172a; font-size: 10.5pt; }
.card p { font-size: 9.5pt; color: #475569; margin: 0; line-height: 1.55; }

/* Step list */
.steps { counter-reset: step; margin: 14px 0; }
.steps .step { counter-increment: step; padding: 14px 0 14px 48px; position: relative; border-bottom: 1px solid rgba(15,43,94,0.08); }
.steps .step:last-child { border-bottom: none; }
.steps .step::before { content: counter(step); position: absolute; left: 0; top: 14px; width: 32px; height: 32px; background: #1A6FD4; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 11pt; }
.steps .step h4 { margin: 0 0 4px; color: #0f172a; }
.steps .step p { margin: 0; font-size: 10pt; color: #475569; }

/* Page break helpers */
.page-break { page-break-before: always; }
.no-break { page-break-inside: avoid; }

/* Lists */
ul, ol { margin: 8px 0 12px 20px; }
li { margin-bottom: 4px; color: #334155; font-size: 10.5pt; }
li strong { color: #0f172a; }

/* Hero of each section */
.section-hero { margin: 40px 0 20px; padding-top: 32px; border-top: 4px solid #1A6FD4; }
.section-hero .label { font-size: 9.5pt; font-weight: 600; color: #1A6FD4; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px; }

footer { text-align: center; font-size: 9pt; color: #94a3b8; margin-top: 60px; padding-top: 20px; border-top: 1px solid rgba(15,43,94,0.10); }
</style>
</head>
<body>

<!-- COVER PAGE -->
<section class="cover">
    <img src="data:image/png;base64,__LOGO_B64__" alt="COFRAP">
    <div class="eyebrow">Documentation technique</div>
    <h1>Double authentification <span class="accent">enterprise-grade</span></h1>
    <p class="lead">Conception, implementation et deploiement du systeme d'authentification multi-facteurs de la plateforme COFRAP, base sur TOTP (RFC 6238) avec chiffrement, codes de secours et rate limiting.</p>
    <div class="meta">
        <p><strong>Plateforme :</strong> OpenFaaS sur Kubernetes - PostgreSQL - React 18 + Vite</p>
        <p><strong>Standards :</strong> RFC 6238 (TOTP) - RFC 4226 (HOTP) - bcrypt - Fernet (AES-128-CBC + HMAC)</p>
        <p><strong>Version :</strong> 1.0 - Mai 2026</p>
    </div>
</section>

<!-- TOC -->
<div class="section-hero">
    <div class="label">Sommaire</div>
    <h2>Plan du document</h2>
</div>
<div class="toc">
    <ol>
        <li><span class="title">Vue d'ensemble du systeme</span><span class="sub">Page 3</span></li>
        <li><span class="title">Architecture technique</span><span class="sub">Page 4</span></li>
        <li><span class="title">Le 2FA - TOTP en detail (RFC 6238)</span><span class="sub">Page 5</span></li>
        <li><span class="title">Les 3 defenses enterprise</span><span class="sub">Page 7</span></li>
        <li><span class="title">Parcours utilisateur de bout en bout</span><span class="sub">Page 9</span></li>
        <li><span class="title">Schema de la base de donnees</span><span class="sub">Page 12</span></li>
        <li><span class="title">Endpoints API et fonctions OpenFaaS</span><span class="sub">Page 13</span></li>
        <li><span class="title">Demarrage et deploiement local</span><span class="sub">Page 15</span></li>
        <li><span class="title">Considerations de securite</span><span class="sub">Page 17</span></li>
    </ol>
</div>

<!-- SECTION 1 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 1</div>
    <h2><span class="num">01</span>Vue d'ensemble du systeme</h2>
</div>

<p class="section-lead">COFRAP impose une authentification a deux facteurs avec rotation forcee des credentials tous les six mois. La V1 implementee combine TOTP (Time-based One-Time Password) avec trois defenses additionnelles transformant le 2FA classique en solution enterprise-grade.</p>

<h3>Pourquoi du 2FA ?</h3>
<p>Un mot de passe seul peut etre intercepte, vole, phishe ou devine. En ajoutant un deuxieme facteur independant du premier, on rend l'attaque exponentiellement plus difficile : l'attaquant doit compromettre <strong>deux choses</strong> simultanement, et non plus une seule.</p>

<h3>Les trois categories de facteurs</h3>
<div class="cards">
    <div class="card">
        <div class="badge">Connaissance</div>
        <h4>Ce que tu sais</h4>
        <p>Mot de passe, code PIN, reponse a une question secrete. Le plus faible, car potentiellement memorisable par d'autres.</p>
    </div>
    <div class="card">
        <div class="badge">Possession</div>
        <h4>Ce que tu possedes</h4>
        <p>Telephone avec app TOTP, cle USB, badge. Necessite un acces physique a l'objet pour fraudere.</p>
    </div>
    <div class="card">
        <div class="badge">Inherence</div>
        <h4>Ce que tu es</h4>
        <p>Empreinte digitale, reconnaissance faciale, retine. Difficilement copiable, mais non-revocable.</p>
    </div>
</div>

<h3>Le choix de COFRAP</h3>
<p>Mot de passe (connaissance) <strong>+</strong> TOTP via application authentificateur sur smartphone (possession). Deux facteurs independants, conformes aux recommandations NIST SP 800-63B niveau AAL2.</p>

<div class="callout info">
    <div class="label">A retenir</div>
    Le SMS n'est pas considere comme un facteur de possession sur par le NIST depuis 2017 (attaques par SIM swap). COFRAP utilise TOTP, qui n'envoie aucun code par reseau apres la configuration initiale.
</div>

<!-- SECTION 2 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 2</div>
    <h2><span class="num">02</span>Architecture technique</h2>
</div>

<p class="section-lead">L'application est entierement serverless. Le frontend SPA React communique avec quatre fonctions OpenFaaS independantes deployees sur Kubernetes, qui partagent une base PostgreSQL et utilisent un secret de chiffrement gere via Kubernetes Secrets.</p>

<div class="diagram">+-----------------------------------------------------------------+
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
</div>

<h3>Pile logicielle</h3>
<table>
    <thead><tr><th>Couche</th><th>Technologie</th><th>Role</th></tr></thead>
    <tbody>
        <tr><td>Frontend</td><td>React 18, Vite, React Router, lucide-react</td><td>SPA avec layout deux panneaux, animations entre etapes, responsive mobile</td></tr>
        <tr><td>Backend</td><td>Python 3.11, OpenFaaS Community</td><td>4 fonctions stateless, build par template python3</td></tr>
        <tr><td>Crypto</td><td>cryptography (Fernet), bcrypt, pyotp</td><td>Chiffrement AES-128, hashage adaptatif, TOTP RFC 6238</td></tr>
        <tr><td>Base</td><td>PostgreSQL 16</td><td>StatefulSet Kubernetes avec PVC</td></tr>
        <tr><td>Infra</td><td>Kubernetes K3S, Helm, faas-cli</td><td>Orchestration, secrets, autoscaling</td></tr>
    </tbody>
</table>

<!-- SECTION 3 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 3</div>
    <h2><span class="num">03</span>Le 2FA - TOTP en detail (RFC 6238)</h2>
</div>

<p class="section-lead">TOTP signifie Time-based One-Time Password. C'est l'algorithme standardise utilise par Google Authenticator, Authy, 1Password et la grande majorite des authentificateurs. Sa force tient en un mot : le temps remplace la communication.</p>

<h3>Le principe en trois etapes</h3>

<h4>Etape A - Inscription (une seule fois)</h4>
<div class="diagram">Serveur:
  secret = random_bytes(20)                          # 160 bits aleatoires
  db.users.save(secret_2fa = encrypt(secret))        # chiffre Fernet
  qr_url = "otpauth://totp/COFRAP:michel
           ?secret=BASE32...&issuer=COFRAP"
  return qr_code(qr_url)

Client (Google Authenticator):
  scan QR
  store { label: "COFRAP", secret: "BASE32..." }
</div>

<p>Le <strong>secret est partage une seule fois</strong> via le QR. A partir de la, le client et le serveur peuvent calculer les memes codes independamment, sans communiquer.</p>

<h4>Etape B - Calcul du code (toutes les 30 secondes)</h4>
<div class="diagram">T = floor(timestamp_unix / 30)         # numero de periode 30s
hash = HMAC-SHA1(secret, T)            # 20 octets
offset = hash[19] AND 0x0f             # 4 derniers bits
truncated = hash[offset..offset+4] AND 0x7fffffff
code = truncated MOD 1_000_000         # 6 chiffres
</div>

<p>Les deux parties (le serveur et l'app du telephone) executent ce calcul independamment, en utilisant la meme entree (le secret partage et l'heure UTC). Si les deux horloges sont synchrones a 30 secondes pres, ils obtiennent le meme code.</p>

<h4>Etape C - Authentification</h4>
<div class="diagram">Client envoie: { username, password, totp_code: "847291" }

Serveur:
  user = db.find(username)
  if not bcrypt.verify(user.password_hash, password):
      return 401
  secret = decrypt(user.secret_2fa)
  expected = compute_totp(secret, now())
  if totp_code != expected:
      return 401
  return success
</div>

<h3>Pourquoi ca fonctionne</h3>
<ul>
    <li><strong>Le temps fait office de canal de synchronisation gratuit.</strong> Pas besoin de connexion permanente entre l'app et le serveur.</li>
    <li><strong>Les codes ont une duree de vie tres courte.</strong> Meme intercepte, un code est inutilisable apres 30 secondes (60 secondes maximum avec la tolerance window=1 utilisee dans authenticate).</li>
    <li><strong>Le secret ne voyage qu'une seule fois.</strong> Apres le scan initial, il reste cote serveur (chiffre) et cote app (dans le stockage securise du telephone). Aucune transmission ulterieure.</li>
</ul>

<h3>Les limites du TOTP</h3>
<div class="callout warn">
    <div class="label">Limites a connaitre</div>
    <strong>1. Phishable.</strong> Un faux site peut demander password + TOTP et les rejouer en temps reel.<br>
    <strong>2. Shared secret cote serveur.</strong> Si la base fuite et que la cle de chiffrement fuite aussi, tous les secrets sont exposes.<br>
    <strong>3. Synchronisation horaire.</strong> Si l'horloge derive de plus de 60 secondes, le code n'est plus valide.
</div>

<p>Pour pallier ces limites, COFRAP combine TOTP avec trois defenses additionnelles, decrites au chapitre suivant.</p>

<!-- SECTION 4 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 4</div>
    <h2><span class="num">04</span>Les 3 defenses enterprise</h2>
</div>

<p class="section-lead">Un TOTP isole reste vulnerable a plusieurs scenarios d'attaque ou d'incident. Les trois mesures suivantes transforment ce 2FA basique en solution de niveau entreprise, defendable en audit.</p>

<h3>4.1 - Chiffrement du secret 2FA en base</h3>

<p>Le secret TOTP est stocke <strong>chiffre</strong> dans la base de donnees PostgreSQL. Si la base fuite (SQL injection, backup vole, dump accidental), l'attaquant ne recupere que des donnees inutilisables sans la cle.</p>

<h4>Implementation : Fernet (cryptography Python)</h4>
<pre><span class="c"># Initialisation au chargement du module</span>
<span class="k">from</span> cryptography.fernet <span class="k">import</span> Fernet
ENCRYPTION_KEY = os.environ[<span class="s">'ENCRYPTION_KEY'</span>].encode()
cipher = Fernet(ENCRYPTION_KEY)

<span class="c"># A la creation du secret 2FA</span>
secret = pyotp.random_base32()
encrypted_secret = cipher.encrypt(secret.encode()).decode()
db.update(user_id, secret_2fa_encrypted=encrypted_secret)

<span class="c"># A l'authentification</span>
encrypted = db.get(user_id).secret_2fa_encrypted
secret = cipher.decrypt(encrypted.encode()).decode()
totp = pyotp.TOTP(secret)
if not totp.verify(totp_code, valid_window=1):
    return error</pre>

<p>Fernet utilise AES-128-CBC pour le chiffrement et HMAC-SHA256 pour l'authentification. Cle de 256 bits, IV aleatoire par chiffrement, signature integree. C'est un format opinionatedly safe, impossible a mal utiliser.</p>

<div class="callout danger">
    <div class="label">Critique</div>
    La cle <code>ENCRYPTION_KEY</code> est <strong>stockee dans un Kubernetes Secret</strong> et injectee comme variable d'environnement dans le pod OpenFaaS. Elle ne doit jamais apparaitre dans le repo Git, ni dans les images Docker. Sa perte rend tous les secrets 2FA irrecuperables.
</div>

<h3>4.2 - Codes de secours (10 codes one-shot)</h3>

<p>A la creation du compte (et a chaque renouvellement), le systeme genere <strong>10 codes au format XXXX-XXXX</strong> que l'utilisateur doit imprimer, telecharger ou copier dans son gestionnaire de mots de passe. Ces codes permettent une auto-recuperation en cas de perte du telephone.</p>

<h4>Generation et stockage</h4>
<pre>BACKUP_CODE_ALPHABET = <span class="s">'ABCDEFGHJKMNPQRSTUVWXYZ23456789'</span>  <span class="c"># sans O/0/I/1/L</span>

<span class="k">def</span> generate_backup_code():
    raw = <span class="s">''</span>.join(secrets.choice(BACKUP_CODE_ALPHABET) <span class="k">for</span> _ <span class="k">in</span> range(8))
    <span class="k">return</span> f<span class="s">"{raw[:4]}-{raw[4:]}"</span>

<span class="c"># A la creation : 10 codes generes en clair, hashes en bcrypt, stockes</span>
codes_plain = [generate_backup_code() <span class="k">for</span> _ <span class="k">in</span> range(10)]
<span class="k">for</span> code <span class="k">in</span> codes_plain:
    code_hash = bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode()
    db.backup_codes.insert(user_id, code_hash)

<span class="c"># Retour au client : codes en CLAIR (une seule fois, jamais relus)</span>
<span class="k">return</span> {<span class="s">"qr_code"</span>: qr, <span class="s">"backup_codes"</span>: codes_plain}</pre>

<h4>Utilisation pour recuperation</h4>
<p>L'utilisateur saisit son username + un code de secours sur <code>/recover</code>. Le backend compare le code soumis avec les hashes en base via <code>bcrypt.checkpw</code>. Si match, le code est <strong>marque comme utilise</strong> (<code>used_at = NOW()</code>) et un nouveau mot de passe est genere. Le code consume ne fonctionnera plus jamais.</p>

<div class="callout success">
    <div class="label">Avantage decisif</div>
    Cela elimine le besoin d'intervention administrative en cas de perte du telephone, tout en preservant le modele de securite (le code de secours est imprime, donc une possession). Pattern utilise par Google, GitHub, AWS, Atlassian.
</div>

<h3>4.3 - Rate limiting (5 echecs/min par username)</h3>

<p>Le code TOTP fait 6 chiffres, soit 1 000 000 combinaisons. Sans protection, un attaquant pourrait theoriquement le brute-forcer. Avec <strong>5 tentatives echouees max par minute par username</strong>, l'attaque devient pratiquement impossible : il faudrait des milliers de jours pour couvrir l'espace.</p>

<h4>Implementation : table login_attempts</h4>
<pre><span class="c"># A chaque tentative d'authentification, AVANT verification du mot de passe</span>
cur.execute(<span class="s">"""SELECT COUNT(*) FROM login_attempts
    WHERE username = %s
      AND success = FALSE
      AND attempted_at > NOW() - INTERVAL '1 minute'"""</span>, (username,))
failed_count = cur.fetchone()[0]

<span class="k">if</span> failed_count &gt;= 5:
    <span class="k">return</span> {<span class="s">"success"</span>: False, <span class="s">"error"</span>: <span class="s">"rate_limited"</span>}

<span class="c"># ... verification du mot de passe et du TOTP ...</span>

<span class="c"># Apres la verification, on enregistre le resultat (success ou failure)</span>
cur.execute(<span class="s">"INSERT INTO login_attempts (username, success) VALUES (%s, %s)"</span>,
            (username, is_valid))</pre>

<p>La table <code>login_attempts</code> sert aussi d'<strong>audit trail</strong>. Tracer toutes les tentatives (reussies et echouees) permet de detecter post-mortem des comportements anormaux.</p>

<!-- SECTION 5 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 5</div>
    <h2><span class="num">05</span>Parcours utilisateur de bout en bout</h2>
</div>

<p class="section-lead">L'application expose quatre parcours principaux : creation de compte, connexion, renouvellement et recuperation. Chacun est structure en etapes guidees avec retour visuel a chaque action.</p>

<h3>5.1 - Creation de compte (4 etapes)</h3>
<div class="steps">
    <div class="step">
        <h4>Saisie du nom d'utilisateur</h4>
        <p>L'utilisateur entre un identifiant unique. Le backend cree l'enregistrement en base et genere un mot de passe aleatoire de 24 caracteres alphanumeriques + symboles. Le mot de passe est hashe avec bcrypt et n'est <strong>jamais stocke en clair</strong>. Un QR code contenant le mot de passe est retourne.</p>
    </div>
    <div class="step">
        <h4>Scan du QR mot de passe</h4>
        <p>L'utilisateur scanne le QR code avec son appareil photo ou son gestionnaire de mots de passe. Il valide via une checkbox "J'ai sauvegarde mon mot de passe" pour continuer.</p>
    </div>
    <div class="step">
        <h4>Configuration de l'application 2FA</h4>
        <p>Le backend appelle <code>generate-2fa</code> qui cree un secret TOTP, le chiffre via Fernet, le stocke en base et retourne un QR code au format <code>otpauth://totp/...</code>. L'utilisateur scanne ce QR avec Google Authenticator ou Authy.</p>
    </div>
    <div class="step">
        <h4>Sauvegarde des 10 codes de secours</h4>
        <p>Les 10 codes generes a l'etape 3 sont affiches en grille 2 colonnes. L'utilisateur peut les copier, telecharger en .txt, ou imprimer. Une checkbox finale "J'ai sauvegarde mes codes en lieu sur" debloque le bouton "Terminer et se connecter" qui redirige vers <code>/login</code>.</p>
    </div>
</div>

<h3>5.2 - Connexion (2 etapes)</h3>
<div class="steps">
    <div class="step">
        <h4>Identifiants</h4>
        <p>Username + mot de passe. Validation cote frontend uniquement (champs non vides). Un lien "Mot de passe oublie ?" pointe vers <code>/recover</code>.</p>
    </div>
    <div class="step">
        <h4>Code TOTP</h4>
        <p>Champ a 6 chiffres avec auto-formatage. Le backend execute : rate limit check, bcrypt verify password, Fernet decrypt secret 2FA, pyotp verify (avec valid_window=1 pour tolerer 30s de drift). Si <code>gendate</code> remonte a plus de 6 mois, redirection automatique vers <code>/renew</code>. Sinon vers <code>/dashboard</code>.</p>
    </div>
</div>

<h3>5.3 - Renouvellement force (4 etapes)</h3>
<p>Identique a la creation, mais le user_id existe deja. Le mot de passe et le secret 2FA sont remplaces, les anciens codes de secours sont supprimes et 10 nouveaux sont generes. Declenche automatiquement quand <code>expired === true</code> au login, ou manuellement depuis le Dashboard.</p>

<h3>5.4 - Recuperation par code de secours (2 etapes)</h3>
<div class="steps">
    <div class="step">
        <h4>Verification de l'identite</h4>
        <p>L'utilisateur entre son username et un de ses 10 codes de secours (auto-formatte en XXXX-XXXX). Le backend cherche tous les codes non utilises de cet utilisateur, compare via <code>bcrypt.checkpw</code> sequentiellement (max 10 hashs). Si match, le code est marque <code>used_at = NOW()</code> et un nouveau mot de passe est genere.</p>
    </div>
    <div class="step">
        <h4>Nouveau mot de passe</h4>
        <p>QR code du nouveau mot de passe affiche. La <strong>2FA n'est PAS reinitialisee</strong> : l'utilisateur garde son secret TOTP existant et peut se reconnecter immediatement avec le nouveau mot de passe + son code 2FA habituel.</p>
    </div>
</div>

<!-- SECTION 6 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 6</div>
    <h2><span class="num">06</span>Schema de la base de donnees</h2>
</div>

<p class="section-lead">Trois tables PostgreSQL stockent les utilisateurs, les codes de secours et les tentatives de connexion. Aucune donnee sensible n'est stockee en clair.</p>

<pre class="sql">CREATE TABLE users (
    id                      SERIAL PRIMARY KEY,
    username                VARCHAR(64)  NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,    <span class="c">-- bcrypt</span>
    secret_2fa_encrypted    TEXT,                     <span class="c">-- Fernet</span>
    gendate                 BIGINT,                   <span class="c">-- timestamp Unix</span>
    created_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE backup_codes (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   VARCHAR(255) NOT NULL,                <span class="c">-- bcrypt</span>
    used_at     TIMESTAMP,                            <span class="c">-- NULL = encore valide</span>
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
    ON login_attempts(username, attempted_at);</pre>

<h3>Decisions de design</h3>
<ul>
    <li><strong>Aucun stockage en clair.</strong> Mot de passe et codes de secours hashes (bcrypt), secret 2FA chiffre (Fernet).</li>
    <li><strong>Cascade sur suppression.</strong> Supprimer un user supprime automatiquement ses codes de secours.</li>
    <li><strong>Index sur (username, attempted_at).</strong> Permet une requete O(log n) pour le rate limit, meme avec des millions de lignes.</li>
    <li><strong>gendate comme BIGINT.</strong> Timestamp Unix en secondes, format compact et facile a manipuler en Python et en JavaScript sans probleme de fuseau horaire.</li>
</ul>

<!-- SECTION 7 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 7</div>
    <h2><span class="num">07</span>Endpoints API et fonctions OpenFaaS</h2>
</div>

<p class="section-lead">L'application expose quatre fonctions independantes via la passerelle OpenFaaS. Chaque fonction est une POST acceptant JSON.</p>

<table>
    <thead><tr><th>Fonction</th><th>Methode</th><th>Body</th><th>Reponse</th></tr></thead>
    <tbody>
        <tr><td><code>generate-password</code></td><td>POST</td><td><code>{username}</code></td><td><code>{qr_code}</code></td></tr>
        <tr><td><code>generate-2fa</code></td><td>POST</td><td><code>{username}</code></td><td><code>{qr_code, backup_codes[10]}</code></td></tr>
        <tr><td><code>authenticate</code></td><td>POST</td><td><code>{username, password, totp_code}</code></td><td><code>{success, expired, gendate}</code></td></tr>
        <tr><td><code>recover-with-backup-code</code></td><td>POST</td><td><code>{username, backup_code}</code></td><td><code>{success, qr_code}</code></td></tr>
    </tbody>
</table>

<h3>Codes d'erreur normalises</h3>
<table>
    <thead><tr><th>Code</th><th>Signification</th><th>Action UI</th></tr></thead>
    <tbody>
        <tr><td><code>missing_fields</code></td><td>Un champ obligatoire est vide</td><td>Afficher "Veuillez remplir tous les champs"</td></tr>
        <tr><td><code>invalid_credentials</code></td><td>Username, password ou TOTP invalide</td><td>Message generique pour ne pas reveler quel champ est faux</td></tr>
        <tr><td><code>rate_limited</code></td><td>Plus de 5 echecs dans la derniere minute</td><td>Afficher le delai d'attente, desactiver le formulaire</td></tr>
        <tr><td><code>invalid_code</code></td><td>Code de secours inconnu ou deja utilise</td><td>Inviter a essayer un autre code</td></tr>
        <tr><td><code>2fa_not_configured</code></td><td>L'utilisateur n'a pas finalise sa configuration 2FA</td><td>Rediriger vers <code>/create-account</code> ou contacter support</td></tr>
        <tr><td><code>user_not_found</code></td><td>Username inexistant pour generate-2fa</td><td>Erreur generique cote frontend</td></tr>
    </tbody>
</table>

<h3>Configuration des secrets et variables</h3>
<p>Chaque fonction declare ses dependances dans <code>stack.yml</code>. Les secrets sont injectes au runtime via Kubernetes Secrets et exposes comme variables d'environnement.</p>

<table>
    <thead><tr><th>Variable</th><th>Fournie par</th><th>Utilisee par</th></tr></thead>
    <tbody>
        <tr><td><code>DATABASE_URL</code></td><td>Secret <code>cofrap-db-url</code></td><td>Toutes les fonctions</td></tr>
        <tr><td><code>ENCRYPTION_KEY</code></td><td>Secret <code>cofrap-encryption-key</code></td><td><code>generate-2fa</code>, <code>authenticate</code></td></tr>
    </tbody>
</table>

<!-- SECTION 8 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 8</div>
    <h2><span class="num">08</span>Demarrage et deploiement local</h2>
</div>

<p class="section-lead">Procedure complete pour lancer la stack en local : base de donnees PostgreSQL, fonctions OpenFaaS, frontend React. Cette procedure suppose une installation prealable de Docker Desktop, faas-cli et Node.js 18+.</p>

<h3>8.1 - Prerequis</h3>
<ul>
    <li><strong>Docker Desktop</strong> avec Kubernetes active (ou minikube / K3S)</li>
    <li><strong>faas-cli</strong> installe (<code>brew install faas-cli</code> ou <code>choco install faas-cli</code>)</li>
    <li><strong>Node.js 18+</strong> et npm</li>
    <li><strong>Python 3.11+</strong> pour generer la cle Fernet</li>
    <li><strong>PostgreSQL client</strong> (<code>psql</code>) pour initialiser la base</li>
</ul>

<h3>8.2 - Etape 1 : generer la cle de chiffrement</h3>
<pre>python3 -c <span class="s">"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"</span>

<span class="c"># Exemple de sortie:</span>
<span class="c"># GqJ4Y6dM9vQ8XzN3Hk7Pa2sBcRfTwUyL5jE0iVoWnZE=</span></pre>
<p>Cette cle est <strong>critique</strong> : sa perte rend tous les secrets 2FA en base irrecuperables. Stockez-la dans un gestionnaire de secrets (Vault, 1Password, AWS Secrets Manager) avant de continuer.</p>

<h3>8.3 - Etape 2 : deployer la base PostgreSQL</h3>
<pre>docker compose up -d postgres</pre>
<p>Cela demarre PostgreSQL sur le port 5432 avec les credentials <code>cofrap:cofrap</code> et la base <code>cofrap</code>.</p>

<h3>8.4 - Etape 3 : initialiser le schema</h3>
<pre>psql -h localhost -U cofrap -d cofrap -f init.sql</pre>
<p>Cela cree les trois tables : <code>users</code>, <code>backup_codes</code>, <code>login_attempts</code> avec leurs index.</p>

<h3>8.5 - Etape 4 : creer les secrets OpenFaaS</h3>
<pre>faas-cli secret create cofrap-encryption-key \
    --from-literal=<span class="s">"GqJ4Y6dM9vQ8XzN3Hk7Pa2sBcRfTwUyL5jE0iVoWnZE="</span>

faas-cli secret create cofrap-db-url \
    --from-literal=<span class="s">"postgres://cofrap:cofrap@postgres:5432/cofrap"</span></pre>

<h3>8.6 - Etape 5 : build et deploiement des fonctions</h3>
<pre><span class="c"># Depuis la racine du projet</span>
faas-cli up -f stack.yml

<span class="c"># Cela execute en sequence:</span>
<span class="c"># - faas-cli build (cree les 4 images Docker)</span>
<span class="c"># - faas-cli push (optionnel, pour cluster distant)</span>
<span class="c"># - faas-cli deploy (deploie sur OpenFaaS)</span></pre>

<h3>8.7 - Etape 6 : demarrer le frontend</h3>
<pre>cd frontend
npm install
npm run dev

<span class="c"># Le frontend est disponible sur http://localhost:5173 (ou 5174 si le port est occupe)</span></pre>

<h3>8.8 - Verification</h3>
<p>Pour verifier que tout fonctionne :</p>
<ol>
    <li>Ouvrir <code>http://localhost:5174</code></li>
    <li>Cliquer "Creer un acces" -> entrer un username de test</li>
    <li>Scanner les deux QR codes successivement</li>
    <li>Sauvegarder les 10 codes de secours</li>
    <li>Se connecter avec le mot de passe scanne + le code TOTP de l'app</li>
    <li>Verifier l'apparition du Dashboard avec le statut "Securise"</li>
</ol>

<div class="callout info">
    <div class="label">Debug</div>
    En cas d'erreur 500 sur un endpoint, consulter les logs OpenFaaS : <code>faas-cli logs &lt;function-name&gt;</code>. Les erreurs les plus frequentes : <code>ENCRYPTION_KEY</code> manquante, base de donnees non initialisee, port 5432 deja occupe.
</div>

<!-- SECTION 9 -->
<div class="section-hero page-break">
    <div class="label">Chapitre 9</div>
    <h2><span class="num">09</span>Considerations de securite</h2>
</div>

<p class="section-lead">Recapitulatif des proprietes de securite, des hypotheses sous-jacentes et des points de vigilance pour le passage en production.</p>

<h3>9.1 - Proprietes de securite garanties</h3>
<table>
    <thead><tr><th>Propriete</th><th>Mecanisme</th></tr></thead>
    <tbody>
        <tr><td>Confidentialite du mot de passe</td><td>bcrypt avec cost 12, sel aleatoire par mot de passe</td></tr>
        <tr><td>Confidentialite du secret TOTP</td><td>Fernet (AES-128-CBC + HMAC-SHA256), cle en Kubernetes Secret</td></tr>
        <tr><td>Integrite du secret 2FA</td><td>HMAC integre dans Fernet, modification = decryption echoue</td></tr>
        <tr><td>Non-repudiation des connexions</td><td>Table <code>login_attempts</code> tracant timestamp + success</td></tr>
        <tr><td>Resistance au brute force</td><td>Rate limiting 5 echecs/min, lockout glissant</td></tr>
        <tr><td>Recuperation autonome</td><td>10 codes de secours one-shot, valides indefiniment jusqu'a utilisation</td></tr>
        <tr><td>Rotation forcee</td><td>Champ <code>gendate</code> + verification 6 mois, redirection automatique vers /renew</td></tr>
    </tbody>
</table>

<h3>9.2 - Limites connues et risques residuels</h3>
<ul>
    <li><strong>Phishing TOTP.</strong> Un site frauduleux peut intercepter et rejouer le code TOTP en temps reel. Mitigation future : migration vers WebAuthn/Passkeys.</li>
    <li><strong>Vol du telephone avec app authentificateur deverrouillee.</strong> Permet a un attaquant de generer les codes legitimes. Mitigation : exiger un PIN ou biometrie dans l'app authentificateur.</li>
    <li><strong>Compromission de la cle Fernet.</strong> Permet a un attaquant ayant aussi acces a la base de regenerer les codes TOTP. Mitigation : rotation periodique de la cle, stockage en HSM pour la production.</li>
    <li><strong>Rate limit par username uniquement.</strong> Un attaquant peut iterer sur differents usernames. Mitigation : ajouter un rate limit par IP au niveau de la passerelle (NGINX, Traefik).</li>
</ul>

<h3>9.3 - Recommandations pour la production</h3>
<div class="callout warn">
    <div class="label">Avant deploiement prod</div>
    1. Activer TLS sur la passerelle OpenFaaS (Let's Encrypt + cert-manager).<br>
    2. Stocker la cle Fernet dans un HSM ou un KMS gere (AWS KMS, GCP KMS, HashiCorp Vault).<br>
    3. Ajouter un rate limit par IP au niveau de la passerelle (5 req/sec).<br>
    4. Configurer des alertes sur les pics de <code>login_attempts</code> avec success=FALSE (potentielle attaque).<br>
    5. Mettre en place une politique de mots de passe pour la base (rotation tous les 90 jours).<br>
    6. Activer les backups chiffres de PostgreSQL.<br>
    7. Auditer regulierement la liste des secrets Kubernetes (RBAC).
</div>

<h3>9.4 - Conformite</h3>
<p>La conception respecte les recommandations suivantes :</p>
<ul>
    <li><strong>NIST SP 800-63B AAL2.</strong> Niveau Authenticator Assurance 2 : 2 facteurs independants, dont au moins un cryptographique.</li>
    <li><strong>RFC 6238 (TOTP).</strong> Implementation conforme via la bibliotheque <code>pyotp</code>.</li>
    <li><strong>RGPD article 32.</strong> Mesures techniques appropriees : chiffrement, hashage, integrite, traceabilite.</li>
    <li><strong>OWASP ASVS v4.0 niveau 2.</strong> Verification Standard pour authentication (chapitre 2).</li>
</ul>

<footer>
    COFRAP - Documentation 2FA enterprise-grade - Genere automatiquement - Mai 2026
</footer>

</body>
</html>"""


def main():
    if not LOGO.exists():
        sys.exit(f'logo not found: {LOGO}')
    if not Path(EDGE).exists():
        sys.exit(f'msedge.exe not found at {EDGE}')

    html = HTML_TEMPLATE.replace('__LOGO_B64__', b64_logo())
    HTML_OUT.write_text(html, encoding='utf-8')
    print(f'HTML written: {HTML_OUT} ({HTML_OUT.stat().st_size // 1024} KB)')

    DOWNLOADS.mkdir(exist_ok=True)
    file_url = HTML_OUT.absolute().as_uri()

    subprocess.run([
        EDGE,
        '--headless=new',
        '--disable-gpu',
        '--no-pdf-header-footer',
        f'--print-to-pdf={PDF_OUT_TEMP}',
        file_url,
    ], check=True, timeout=60)

    shutil.move(str(PDF_OUT_TEMP), str(PDF_FINAL))
    HTML_OUT.unlink(missing_ok=True)

    size_kb = PDF_FINAL.stat().st_size // 1024
    print(f'PDF created: {PDF_FINAL} ({size_kb} KB)')


if __name__ == '__main__':
    main()
