# COFRAP — Déploiement Kubernetes
{: .no_toc }

## Vue d'ensemble

Ce répertoire contient tous les manifests YAML pour déployer COFRAP sur Kubernetes.

Structure :
- `00-openfaas-namespace.yaml` — créer les namespaces OpenFaaS
- `01-namespace.yaml` — créer le namespace cofrap
- `02-secrets.yaml` — secrets pour la clé Fernet et accès base de données
- `03-postgres-configmap.yaml` — script d'initialisation PostgreSQL
- `04-postgres-pvc.yaml` — volume persistant pour PostgreSQL
- `05-postgres-service.yaml` — service sans adresse IP (Headless) pour StatefulSet
- `06-postgres-statefulset.yaml` — déploiement PostgreSQL 16
- `07-frontend-deployment.yaml` — déploiement frontend React (2 replicas)
- `08-frontend-service.yaml` — service ClusterIP pour le frontend
- `09-frontend-ingress.yaml` — Ingress pour accès HTTP/HTTPS

## Prérequis

- **Kubernetes 1.28+** (K3S, EKS, GKE, minikube, etc.)
- **Helm 3+** (pour installer OpenFaaS)
- **kubectl** configuré et connecté au cluster
- **Images Docker construites** :
  - `cofrap/frontend:latest`
  - `cofrap/generate-password:latest`
  - `cofrap/generate-2fa:latest`
  - `cofrap/authenticate:latest`
  - `cofrap/recover-with-backup-code:latest`

## Étapes de déploiement

### 1. Installer OpenFaaS (optionnel si déjà installé)

```bash
# Ajouter le repo Helm d'OpenFaaS
helm repo add openfaas https://openfaas.github.io/faas-netes/
helm repo update

# Installer OpenFaaS
helm install openfaas openfaas/openfaas \
  --namespace openfaas \
  --set functionNamespace=openfaas-fn \
  --set basic_auth=true \
  --set generateBasicAuth=true
```

Récupérer le mot de passe OpenFaaS :
```bash
PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode)
echo "OpenFaaS admin password: $PASSWORD"
```

Configurer faas-cli :
```bash
export OPENFAAS_URL=http://localhost:8080
faas-cli login -u admin -p "$PASSWORD"
```

### 2. Créer les ressources Kubernetes

```bash
# Appliquer tous les manifests en ordre
kubectl apply -f k8s/00-openfaas-namespace.yaml
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

Ou en une seule commande :
```bash
kubectl apply -f k8s/
```

### 3. Vérifier que PostgreSQL est prêt

```bash
# Attendre que PostgreSQL soit Running et Ready
kubectl get statefulset -n cofrap postgres -w

# Une fois prêt, vérifier la connexion
kubectl run -it --rm debug --image=postgres:16-alpine --restart=Never -- \
  psql -h postgres.cofrap.svc.cluster.local -U cofrap -d cofrap -c "\dt"

# Doit afficher : users, backup_codes, login_attempts
```

### 4. Déployer les fonctions OpenFaaS

```bash
cd /path/to/mspr-cofrap
faas-cli up -f stack.yml
```

Vérifier le déploiement :
```bash
faas-cli list
# Doit lister les 4 fonctions : generate-password, generate-2fa, authenticate, recover-with-backup-code
```

### 5. Vérifier le frontend

```bash
# Port-forward vers le frontend
kubectl port-forward -n cofrap svc/frontend 8080:80

# Ou via Ingress si configuré
# Ajouter à /etc/hosts : 127.0.0.1 cofrap.local
# Puis ouvrir : http://cofrap.local
```

## Configuration des secrets

Le fichier `02-secrets.yaml` contient :
- `encryption-key` — clé Fernet (modifiez cette valeur!)
- `database-url` — URL PostgreSQL interne
- `postgres-password`, `postgres-user`, `postgres-db`

**⚠️ IMPORTANT** : Ne jamais committez les vraies clés dans Git. Utiliser un gestionnaire de secrets :

```bash
# Exemple avec kubectl
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
kubectl create secret generic cofrap-secrets -n cofrap \
  --from-literal=encryption-key="$ENCRYPTION_KEY" \
  --from-literal=database-url="..." \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

## Monitoring et logs

### Logs OpenFaaS

```bash
# Logs en temps réel d'une fonction
faas-cli logs generate-password --follow

# Ou via kubectl
kubectl logs -n openfaas-fn deployment/generate-password -f
```

### Logs PostgreSQL

```bash
kubectl logs -n cofrap statefulset/postgres -f
```

### Logs du frontend

```bash
kubectl logs -n cofrap deployment/frontend -f
```

### Vérifier la santé des pods

```bash
kubectl get pods -n cofrap
kubectl describe pod -n cofrap <pod-name>
```

## Scaling et autoscaling

### Scale manuellement

```bash
# Frontend : augmenter à 3 replicas
kubectl scale deployment -n cofrap frontend --replicas=3

# Vérifier
kubectl get pods -n cofrap
```

### Autoscaling (HPA)

Pour activer l'autoscaling, créer un manifest `hpa.yaml` :

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: cofrap
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Nettoyage

```bash
# Supprimer tous les ressources COFRAP
kubectl delete namespace cofrap

# Supprimer OpenFaaS (optionnel)
helm uninstall openfaas -n openfaas
kubectl delete namespace openfaas openfaas-fn
```

## Troubleshooting

### Pod ne démarre pas
```bash
kubectl describe pod -n cofrap <pod-name>
kubectl logs -n cofrap <pod-name>
```

### PostgreSQL n'initialise pas les tables
```bash
# Vérifier le ConfigMap
kubectl get configmap -n cofrap postgres-init -o yaml

# Réappliquer
kubectl delete statefulset -n cofrap postgres
kubectl apply -f k8s/06-postgres-statefulset.yaml
```

### Les fonctions OpenFaaS ne joignent pas PostgreSQL
```bash
# Vérifier le secret
kubectl get secret -n cofrap cofrap-secrets -o yaml

# Tester la connectivité réseau
kubectl run -it --rm debug --image=alpine --restart=Never -- sh
# Puis dans le pod:
# apk add postgresql-client
# psql -h postgres.cofrap.svc.cluster.local -U cofrap
```

### Frontend ne charge pas (erreur CORS)
```bash
# Vérifier que VITE_GATEWAY_URL pointe vers OpenFaaS
kubectl get deployment -n cofrap frontend -o yaml | grep VITE_GATEWAY_URL

# Vérifier que OpenFaaS est accessible depuis le pod
kubectl exec -it -n cofrap deployment/frontend -- curl http://gateway.openfaas:8080
```

## Sécurité en production

- [ ] Activer TLS sur Ingress (cert-manager + Let's Encrypt)
- [ ] Utiliser des secrets Kubernetes gérés (ne pas en clair dans YAML)
- [ ] Mettre en place RBAC pour limiter l'accès aux secrets
- [ ] Configurer les network policies
- [ ] Mettre en place des resource quotas par namespace
- [ ] Activer pod security policies
- [ ] Configurer les logs d'audit Kubernetes
- [ ] Faire des sauvegardes régulières de PostgreSQL

Voir `docs/security.md` pour les recommandations détaillées.
