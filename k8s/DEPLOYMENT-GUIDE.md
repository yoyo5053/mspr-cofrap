# Déploiement COFRAP — Kubernetes vs OpenFaaS
{: .no_toc }

## Deux approches de déploiement

Vous avez le choix entre deux architectures :

### Option A : Architecture Kubernetes classique (recommandée pour dev/test)
- Backend = Deployment Kubernetes standard (FastAPI)
- Frontend = Deployment Kubernetes
- PostgreSQL = StatefulSet Kubernetes
- OpenFaaS = optionnel (pour orchestration avancée)

**Avantages** : simple, déploiement rapide, facile à déboguer
**Inconvénients** : moins serverless, pas d'autoscaling par fonction

### Option B : Architecture OpenFaaS (recommandée pour prod)
- Backend = 4 fonctions OpenFaaS indépendantes
- Frontend = Deployment Kubernetes
- PostgreSQL = StatefulSet Kubernetes
- OpenFaaS = contrôle la scalabilité et le déploiement des fonctions

**Avantages** : true serverless, autoscaling par fonction, isolation des fonctions
**Inconvénients** : plus complexe à déployer, nécessite OpenFaaS

## Option A : Kubernetes classique (quickstart)

### 1. Construire les images Docker

```bash
cd frontend && docker build -t cofrap/frontend:latest .
cd ../backend && docker build -t cofrap/backend:latest .
```

Ou pousser vers un registry:
```bash
# Exemple avec Docker Hub
docker tag cofrap/frontend:latest votre-hub/cofrap/frontend:latest
docker push votre-hub/cofrap/frontend:latest

docker tag cofrap/backend:latest votre-hub/cofrap/backend:latest
docker push votre-hub/cofrap/backend:latest
```

### 2. Déployer sur Kubernetes

```bash
# Créer namespace et secrets
kubectl apply -f k8s/00-openfaas-namespace.yaml
kubectl apply -f k8s/01-namespace.yaml
kubectl apply -f k8s/02-secrets.yaml

# Déployer PostgreSQL
kubectl apply -f k8s/03-postgres-configmap.yaml
kubectl apply -f k8s/04-postgres-pvc.yaml
kubectl apply -f k8s/05-postgres-service.yaml
kubectl apply -f k8s/06-postgres-statefulset.yaml

# Attendre que PostgreSQL soit prêt
kubectl wait --for=condition=ready pod -n cofrap -l app=postgres --timeout=300s

# Déployer backend
kubectl apply -f k8s/10-backend-deployment.yaml
kubectl apply -f k8s/11-backend-service.yaml

# Déployer frontend
kubectl apply -f k8s/07-frontend-deployment.yaml
kubectl apply -f k8s/08-frontend-service.yaml
kubectl apply -f k8s/09-frontend-ingress.yaml
```

### 3. Accéder à l'application

Port-forward :
```bash
# Frontend
kubectl port-forward -n cofrap svc/frontend 8080:80

# Backend
kubectl port-forward -n cofrap svc/backend 8000:8000

# Puis ouvrir http://localhost:8080
```

Ou via Ingress (voir configuration dans `09-frontend-ingress.yaml`).

## Option B : Architecture OpenFaaS (production)

### 1. Installer OpenFaaS

```bash
helm repo add openfaas https://openfaas.github.io/faas-netes/
helm repo update

helm install openfaas openfaas/openfaas \
  --namespace openfaas \
  --set functionNamespace=openfaas-fn \
  --set basic_auth=true \
  --set generateBasicAuth=true
```

Récupérer le mot de passe :
```bash
PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode)
echo $PASSWORD
```

### 2. Convertir le backend en fonctions OpenFaaS

Les 4 fonctions indépendantes doivent être créées :

```
functions/
├── generate-password/
│   ├── handler.py        (appelle auth_service.generate_password_qr)
│   └── requirements.txt
├── generate-2fa/
│   ├── handler.py        (appelle auth_service.generate_2fa)
│   └── requirements.txt
├── authenticate/
│   ├── handler.py        (appelle auth_service.authenticate)
│   └── requirements.txt
└── recover-with-backup-code/
    ├── handler.py        (appelle auth_service.recover_with_backup_code)
    └── requirements.txt
```

Chaque handler.py doit être un point d'entrée OpenFaaS (voir template python3).

### 3. Mettre à jour stack.yml

```yaml
version: 1.0
provider:
  name: openfaas
  gateway: http://gateway.openfaas:8080

functions:
  generate-password:
    lang: python3
    handler: ./functions/generate-password
    image: cofrap/generate-password:latest
    environment:
      DATABASE_URL: "postgresql://cofrap:cofrap@postgres.cofrap.svc.cluster.local:5432/cofrap"
    secrets:
      - encryption-key

  generate-2fa:
    lang: python3
    handler: ./functions/generate-2fa
    image: cofrap/generate-2fa:latest
    environment:
      DATABASE_URL: "postgresql://cofrap:cofrap@postgres.cofrap.svc.cluster.local:5432/cofrap"
    secrets:
      - encryption-key

  # ... et les deux autres fonctions ...
```

### 4. Déployer les fonctions

```bash
faas-cli up -f stack.yml
```

Vérifier :
```bash
faas-cli list
```

### 5. Déployer les services de support

PostgreSQL et frontend comme en Option A :
```bash
kubectl apply -f k8s/01-namespace.yaml
kubectl apply -f k8s/02-secrets.yaml
kubectl apply -f k8s/03-postgres-configmap.yaml
kubectl apply -f k8s/04-postgres-pvc.yaml
kubectl apply -f k8s/05-postgres-service.yaml
kubectl apply -f k8s/06-postgres-statefulset.yaml
kubectl apply -f k8s/07-frontend-deployment.yaml
kubectl apply -f k8s/08-frontend-service.yaml
kubectl apply -f k8s/09-frontend-ingress.yaml
```

## Configuration des secrets

### Générer une nouvelle clé Fernet

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Appliquer les secrets

```bash
# Option 1 : via kubectl
kubectl create secret generic cofrap-secrets -n cofrap \
  --from-literal=encryption-key='votre-cle-fernet' \
  --from-literal=database-url='postgresql://cofrap:cofrap@postgres.cofrap.svc.cluster.local:5432/cofrap' \
  -o yaml | kubectl apply -f -

# Option 2 : mettre à jour k8s/02-secrets.yaml et faire
kubectl apply -f k8s/02-secrets.yaml
```

### Sécuriser les secrets (production)

Ne jamais committer les secrets en clair. Utiliser :
- **Sealed Secrets** (https://github.com/bitnami-labs/sealed-secrets)
- **HashiCorp Vault**
- **AWS Secrets Manager**
- **Azure Key Vault**
- **Google Cloud Secret Manager**

Exemple avec Sealed Secrets :
```bash
# Installer controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Créer un secret sealed
echo -n 'votre-cle' | kubectl create secret generic tmp --dry-run=client --from-file=encryption-key=/dev/stdin -o yaml | \
  kubeseal -f - > cofrap-secrets-sealed.yaml

kubectl apply -f cofrap-secrets-sealed.yaml
```

## Variables d'environnement

### Pour le frontend
- `VITE_GATEWAY_URL` — URL du backend ou gateway OpenFaaS
  - Local : `http://localhost:8000`
  - K8s : `http://backend.cofrap.svc.cluster.local:8000` (Option A) ou `http://gateway.openfaas:8080` (Option B)

### Pour le backend / OpenFaaS
- `DATABASE_URL` — URL PostgreSQL
- `ENCRYPTION_KEY` — clé Fernet (secrets Kubernetes)

## Vérification de la santé

### Pods

```bash
# Afficher tous les pods
kubectl get pods -n cofrap -o wide

# Afficher les détails d'un pod
kubectl describe pod -n cofrap <pod-name>

# Logs
kubectl logs -n cofrap <pod-name> -f
```

### Services

```bash
# Afficher les services
kubectl get svc -n cofrap

# Tester un service depuis un pod de débogage
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://backend.cofrap.svc.cluster.local:8000/health
```

### Fonctions OpenFaaS

```bash
# Lister les fonctions
faas-cli list

# Logs en temps réel
faas-cli logs generate-password --follow

# Tester une fonction
curl http://gateway.openfaas:8080/function/generate-password \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com"}'
```

## Scaling

### Option A (Kubernetes)

```bash
# Scale le backend
kubectl scale deployment backend -n cofrap --replicas=3

# Scale le frontend
kubectl scale deployment frontend -n cofrap --replicas=5

# Autoscaling (HPA)
kubectl autoscale deployment backend -n cofrap --min=2 --max=10 --cpu-percent=70
```

### Option B (OpenFaaS)

```bash
# OpenFaaS gère l'autoscaling des fonctions automatiquement
# Configurer via stack.yml :

functions:
  generate-password:
    lang: python3
    handler: ./functions/generate-password
    image: cofrap/generate-password:latest
    labels:
      com.openfaas.scale.min: 1
      com.openfaas.scale.max: 20
    # ... reste de la config ...
```

## Nettoyage

```bash
# Supprimer tout (Option A)
kubectl delete namespace cofrap

# Supprimer tout (Option B)
kubectl delete namespace cofrap
faas-cli remove -f stack.yml
helm uninstall openfaas -n openfaas
kubectl delete namespace openfaas openfaas-fn
```

## Ressources utiles

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [OpenFaaS Documentation](https://docs.openfaas.com/)
- [Helm Documentation](https://helm.sh/docs/)
- [PostgreSQL on Kubernetes](https://www.postgresql.org/docs/current/)
- [COFRAP Security Guide](../docs/security.md)
