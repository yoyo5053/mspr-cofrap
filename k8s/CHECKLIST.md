# COFRAP — Checklist Déploiement Kubernetes

## ✅ Prérequis

- [ ] Cluster Kubernetes 1.28+ actif (`kubectl version`)
- [ ] Helm 3+ installé
- [ ] faas-cli 0.16+ installé (pour OpenFaaS)
- [ ] Docker installé (pour builder les images)
- [ ] Accès registry Docker (Docker Hub, ECR, GCR, etc.)

## ✅ Configuration des clés et secrets

- [ ] Générer une clé Fernet pour ENCRYPTION_KEY
- [ ] Mettre à jour `k8s/02-secrets.yaml` avec la clé
- [ ] Vérifier DATABASE_URL pointe vers PostgreSQL correct
- [ ] **NE PAS committer les secrets en clair** — utiliser Sealed Secrets ou Vault

## ✅ Construction des images Docker

```bash
# Frontend
cd frontend
docker build -t cofrap/frontend:latest .
docker tag cofrap/frontend:latest your-registry/cofrap/frontend:latest
docker push your-registry/cofrap/frontend:latest

# Backend
cd backend
docker build -t cofrap/backend:latest .
docker tag cofrap/backend:latest your-registry/cofrap/backend:latest
docker push your-registry/cofrap/backend:latest
```

- [ ] Frontend image construite et disponible
- [ ] Backend image construite et disponible
- [ ] Images poussées vers registry (ou disponibles localement)

## ✅ Déploiement Option A : Kubernetes classique

```bash
# 1. Créer les namespaces et secrets
kubectl apply -f k8s/01-namespace.yaml
kubectl apply -f k8s/02-secrets.yaml

# 2. Déployer PostgreSQL
kubectl apply -f k8s/03-postgres-configmap.yaml
kubectl apply -f k8s/04-postgres-pvc.yaml
kubectl apply -f k8s/05-postgres-service.yaml
kubectl apply -f k8s/06-postgres-statefulset.yaml

# 3. Vérifier PostgreSQL
kubectl wait --for=condition=ready pod -n cofrap -l app=postgres --timeout=300s

# 4. Déployer backend
kubectl apply -f k8s/10-backend-deployment.yaml
kubectl apply -f k8s/11-backend-service.yaml

# 5. Déployer frontend
kubectl apply -f k8s/07-frontend-deployment.yaml
kubectl apply -f k8s/08-frontend-service.yaml
kubectl apply -f k8s/09-frontend-ingress.yaml

# 6. Vérifier que tout est prêt
kubectl get pods -n cofrap
kubectl get svc -n cofrap
```

- [ ] Namespace `cofrap` créé
- [ ] Secrets appliqués
- [ ] PostgreSQL StatefulSet prêt (1/1 Running)
- [ ] Backend Deployment prêt (2/2 Running)
- [ ] Frontend Deployment prêt (2/2 Running)
- [ ] Services accessibles

## ✅ Déploiement Option B : Architecture OpenFaaS

### A. Installer OpenFaaS

```bash
helm repo add openfaas https://openfaas.github.io/faas-netes/
helm repo update

helm install openfaas openfaas/openfaas \
  --namespace openfaas \
  --set functionNamespace=openfaas-fn \
  --set basic_auth=true \
  --set generateBasicAuth=true
```

- [ ] OpenFaaS installé
- [ ] Gateway accessible
- [ ] admin/password sauvegardé

### B. Convertir le backend en 4 fonctions OpenFaaS

Créer les handlers pour :
- `functions/generate-password/handler.py`
- `functions/generate-2fa/handler.py`
- `functions/authenticate/handler.py`
- `functions/recover-with-backup-code/handler.py`

- [ ] Tous les handlers créés
- [ ] `stack.yml` complété et testé
- [ ] Images OpenFaaS construites

### C. Déployer les fonctions

```bash
faas-cli up -f stack.yml
faas-cli list
```

- [ ] Les 4 fonctions déployées
- [ ] Toutes les fonctions ont 1+ replicas
- [ ] Logs propres (pas d'erreurs)

## ✅ Tests post-déploiement

### Connectivité

```bash
# Test backend → PostgreSQL
kubectl exec -it deployment/backend -n cofrap -- curl http://localhost:8000/health

# Test frontend → Backend
kubectl port-forward -n cofrap svc/backend 8000:8000
curl http://localhost:8000/function/generate-password -H "Content-Type: application/json" -d '{"username":"test@example.com"}'
```

- [ ] Backend /health retourne OK
- [ ] Backend peut créer les tables PostgreSQL
- [ ] Frontend peut appeler le backend

### Flux complet

1. [ ] Accéder au frontend (http://localhost:5173 ou port-forward)
2. [ ] Créer un compte → scanner QR password
3. [ ] Générer 2FA → scanner QR TOTP
4. [ ] Se connecter avec password + TOTP
5. [ ] Voir le Dashboard
6. [ ] Utiliser un code de secours pour recover
7. [ ] Se reconnecter avec le nouveau password

## ✅ Monitoring

### Logs

```bash
# PostgreSQL
kubectl logs -n cofrap statefulset/postgres -f

# Backend
kubectl logs -n cofrap deployment/backend -f

# Frontend
kubectl logs -n cofrap deployment/frontend -f

# OpenFaaS functions (si Option B)
faas-cli logs generate-password --follow
```

- [ ] Logs PostgreSQL propres
- [ ] Logs backend montrent les requêtes
- [ ] Logs frontend disponibles
- [ ] Pas d'erreurs ou warnings critiques

### Health checks

```bash
# Pods
kubectl get pods -n cofrap --watch

# Persistent volumes
kubectl get pvc -n cofrap

# Secrets
kubectl get secrets -n cofrap
```

- [ ] Tous les pods en Running/Ready
- [ ] PVC bound
- [ ] Secrets présents et accessibles

## ✅ Sécurité

- [ ] TLS/HTTPS configuré sur Ingress
- [ ] RBAC appliqué (roles, rolebindings)
- [ ] Network policies configurées
- [ ] Secrets chiffrés au repos (etcd encryption)
- [ ] Audit logging activé
- [ ] Pod security policies appliquées

## ✅ Production readiness

- [ ] Backups PostgreSQL configurés
- [ ] Monitoring/alerting mis en place (Prometheus, etc.)
- [ ] Autoscaling HPA configuré
- [ ] Resource quotas définis
- [ ] Budget de pod interruptions (PDB)
- [ ] Service mesh considéré (Istio, Linkerd)
- [ ] GitOps configuré (ArgoCD, Flux)

## 🔧 Troubleshooting rapide

| Problème | Diagnostic | Solution |
|----------|-----------|----------|
| Pod ImagePullBackOff | `kubectl describe pod <pod>` | Vérifier registry/permissions |
| Backend ne joint pas PostgreSQL | `kubectl logs deployment/backend` | Vérifier DATABASE_URL secret |
| Frontend ne charge pas | `kubectl logs deployment/frontend` | Vérifier VITE_GATEWAY_URL |
| CORS errors | Frontend console (F12) | Ajouter origin à CORS config |
| 500 errors OpenFaaS | `faas-cli logs <function>` | Vérifier dépendances function |
| Données PostgreSQL disparaissent | `kubectl get pvc` | Vérifier PVC et storage class |

## 📋 Checklist avant production

- [ ] Encryption key générée et sécurisée
- [ ] Database backups automatiques
- [ ] TLS/HTTPS configuré
- [ ] Monitoring et alerting actifs
- [ ] Secrets manager intégré (Vault, Sealed Secrets)
- [ ] Logs centralisés (ELK, Datadog, etc.)
- [ ] Disaster recovery plan écrit
- [ ] Capacity planning fait
- [ ] Security audit complété
- [ ] Load testing réussi

---

Voir aussi :
- [k8s/DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) — guide détaillé
- [docs/security.md](../docs/security.md) — recommandations sécurité
- [docs/deploy.md](../docs/deploy.md) — déploiement local Docker
