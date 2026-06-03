# ✅ DÉPLOIEMENT KUBERNETES — RÉSUMÉ

## 1️⃣ Bug corrigé : Code de secours non reconnu

**Problème** : Dans `Recover.jsx`, le code testait `if (!data.success)` mais le backend retourne seulement `{qr_code: "..."}` sans champ `success`.

**Solution** : Ligne 73 de `Recover.jsx` → test `if (!data.qr_code)` à la place.

✅ Le code de secours fonctionne maintenant.

---

## 2️⃣ Configuration Kubernetes complète

### Structure créée dans `k8s/`

| Fichier | Rôle |
|---------|------|
| `00-openfaas-namespace.yaml` | Namespaces OpenFaaS |
| `01-namespace.yaml` | Namespace `cofrap` |
| `02-secrets.yaml` | ENCRYPTION_KEY + DATABASE_URL |
| `03-postgres-configmap.yaml` | Script SQL d'initialisation |
| `04-postgres-pvc.yaml` | Volume persistant 10GB |
| `05-postgres-service.yaml` | Service PostgreSQL |
| `06-postgres-statefulset.yaml` | PostgreSQL 16 (1 replica) |
| `07-frontend-deployment.yaml` | Frontend React (2 replicas) |
| `08-frontend-service.yaml` | Service frontend |
| `09-frontend-ingress.yaml` | Ingress HTTP |
| `10-backend-deployment.yaml` | Backend FastAPI (2 replicas) |
| `11-backend-service.yaml` | Service backend |
| `README.md` | Guide détaillé |
| `DEPLOYMENT-GUIDE.md` | Deux chemins de déploiement |
| `CHECKLIST.md` | Checklist complète |

### Mise à jour `stack.yml`

Ajouté la configuration pour les 4 fonctions OpenFaaS :
- `generate-password`
- `generate-2fa`
- `authenticate`
- `recover-with-backup-code`

Chaque fonction reçoit :
- Variables d'environnement : `DATABASE_URL`
- Secrets Kubernetes : `encryption-key`

---

## 3️⃣ Mises à jour du code

### `backend/app/main.py`

✅ Ajouté endpoint `/health` pour Kubernetes probes (liveness/readiness)  
✅ CORS configuré pour services K8s : `frontend.cofrap.svc.cluster.local`, etc.  
✅ Support variables d'environnement pour configuration flexible

### `frontend/Dockerfile`

✅ Ancien : `npm run dev` (développement, non optimisé)  
✅ Nouveau : Multi-stage build → `npm run build` + `serve` (production)  
✅ Taille réduite, performance améliorée

### `frontend/.env.example`

✅ Documented 4 scénarios de `VITE_GATEWAY_URL` :
- Local dev
- Kubernetes Option A (Backend Deployment)
- Kubernetes Option B (OpenFaaS)
- Production (domaine externe)

---

## 4️⃣ Deux chemins de déploiement

### **Option A : Kubernetes classique** (recommandé pour dev/test)

```bash
# Build images
docker build -t cofrap/frontend:latest ./frontend
docker build -t cofrap/backend:latest ./backend

# Déployer
kubectl apply -f k8s/

# Accéder
kubectl port-forward -n cofrap svc/frontend 8080:80
# Puis : http://localhost:8080
```

**Avantages** : simple, rapide, facile à déboguer  
**Inconvénients** : pas de serverless natif

### **Option B : OpenFaaS** (recommandé pour production)

```bash
# Installer OpenFaaS
helm install openfaas openfaas/openfaas --namespace openfaas ...

# Déployer fonctions
faas-cli up -f stack.yml

# Déployer support (PostgreSQL + frontend)
kubectl apply -f k8s/
```

**Avantages** : true serverless, autoscaling, isolation des fonctions  
**Inconvénients** : plus complexe

Voir `k8s/DEPLOYMENT-GUIDE.md` pour les détails complets.

---

## 5️⃣ Prérequis pour déployer

```bash
# ✅ Vérifier Kubernetes
kubectl version

# ✅ Vérifier Helm
helm version

# ✅ Vérifier faas-cli (pour Option B)
faas-cli version

# ✅ Images disponibles
docker images | grep cofrap
```

---

## 6️⃣ Déploiement rapide (Option A — Kubernetes)

```bash
# 1. Générer clé Fernet
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# 2. Mettre à jour k8s/02-secrets.yaml avec la clé

# 3. Build images
docker build -t cofrap/frontend:latest ./frontend
docker build -t cofrap/backend:latest ./backend

# 4. Déployer tout
kubectl apply -f k8s/

# 5. Attendre que PostgreSQL soit prêt
kubectl wait --for=condition=ready pod -n cofrap -l app=postgres --timeout=300s

# 6. Port-forward
kubectl port-forward -n cofrap svc/frontend 8080:80

# 7. Ouvrir http://localhost:8080
```

---

## 7️⃣ Ressources supplémentaires

| Document | Contenu |
|----------|---------|
| `k8s/README.md` | Vue d'ensemble structure K8s |
| `k8s/DEPLOYMENT-GUIDE.md` | Guide détaillé (Option A & B) |
| `k8s/CHECKLIST.md` | Checklist complète + troubleshooting |
| `docs/security.md` | Recommandations sécurité production |
| `docs/deploy.md` | Déploiement local Docker Compose |

---

## 8️⃣ Points clés à retenir

### Secrets
⚠️ **NE PAS committer `02-secrets.yaml` en clair dans Git**  
Utiliser Sealed Secrets ou Vault en production

### Variables d'environnement
```
DATABASE_URL = postgresql://cofrap:cofrap@postgres.cofrap.svc.cluster.local:5432/cofrap
VITE_GATEWAY_URL = http://backend.cofrap.svc.cluster.local:8000
ENCRYPTION_KEY = [clé Fernet générée]
```

### Santé de l'app
```bash
# Vérifier pods
kubectl get pods -n cofrap

# Logs
kubectl logs -n cofrap deployment/backend -f
kubectl logs -n cofrap deployment/frontend -f

# Health check
curl http://backend:8000/health
```

### Scaling
```bash
# Manual
kubectl scale deployment backend -n cofrap --replicas=5

# Autoscaling
kubectl autoscale deployment frontend -n cofrap --min=2 --max=10 --cpu-percent=70
```

---

## 📋 Checklist rapide

- [ ] Code de secours testés et fonctionnels ✅ (Recover.jsx corrigé)
- [ ] `stack.yml` complété ✅
- [ ] Manifests Kubernetes créés ✅
- [ ] `backend/app/main.py` mis à jour ✅
- [ ] Frontend Dockerfile optimisé ✅
- [ ] `.env.example` documenté ✅
- [ ] Images Docker construites ❓ (à faire)
- [ ] Déploiement Kubernetes ❓ (à faire)
- [ ] Tests end-to-end ❓ (à faire)

---

**Prochaines étapes** :
1. Build les images Docker
2. Choisir Option A (K8s) ou Option B (OpenFaaS)
3. Suivre `k8s/DEPLOYMENT-GUIDE.md`
4. Tester les 4 endpoints via frontend

Besoin d'aide pour le déploiement ? Consultez `k8s/CHECKLIST.md`.
