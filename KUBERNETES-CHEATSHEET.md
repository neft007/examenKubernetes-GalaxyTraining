# ☸️ Kubernetes Cheat Sheet — Gimnasio Reservas

Hoja de ayuda personalizada con los comandos usados en el desarrollo del proyecto.
Proyecto: **examenKubernetes-GalaxyTraining** — Examen Final K8s (CURS-000663).

---

## 📑 Índice

- [Namespaces](#-namespaces)
- [Pods](#-pods)
- [Deployments](#-deployments)
- [ReplicaSets](#-replicasets)
- [Services](#-services)
- [Secrets y ConfigMaps](#-secrets-y-configmaps)
- [PersistentVolumes y PersistentVolumeClaims](#-persistentvolumes-y-persistentvolumeclaims)
- [StatefulSets](#️-statefulsets)
- [Ingress](#-ingress)
- [Jobs y CronJobs](#️-jobs-y-cronjobs)
- [HorizontalPodAutoscaler (HPA)](#-horizontalpodautoscaler-hpa)
- [NetworkPolicy](#️-networkpolicy)
- [Debugging](#-debugging)
- [Minikube](#-minikube)
- [Despliegue unificado (all-in-one)](#-despliegue-unificado-all-in-one)
- [Comandos útiles del proyecto](#-comandos-útiles-del-proyecto)
- [Referencias](#-referencias)

---

## 📦 Namespaces

```bash
# Crear namespace (imperativo)
kubectl create namespace dev

# Aplicar namespace (declarativo)
kubectl apply -f manifests/base/namespaces.yaml

# Listar namespaces
kubectl get namespaces

# Establecer namespace predeterminado
kubectl config set-context --current --namespace=dev

# Ver el namespace actual
kubectl config view --minify -o jsonpath='{..namespace}'
```

---

## 🧩 Pods

```bash
# Crear pod imperativo
kubectl run mi-pod --image=busybox:1.36 --restart=Never -n dev --command -- sh -c 'sleep 3600'

# Ver pods
kubectl get pods -n dev
kubectl get pods -n dev -o wide

# Ver logs
kubectl logs mi-pod -n dev
kubectl logs -n dev -l app=gym-api --tail=50

# Ejecutar comando dentro del pod
kubectl exec -it mi-pod -n dev -- sh
kubectl exec -it gym-db-0 -n dev -- psql -U postgres -d gimnasiodb -c "SELECT version();"

# Eliminar pod
kubectl delete pod mi-pod -n dev
```

---

## 🚀 Deployments

```bash
# Aplicar Deployment
kubectl apply -f manifests/base/deployment-api.yaml

# Ver Deployments
kubectl get deployments -n dev
kubectl describe deployment gym-api -n dev

# Escalar manualmente
kubectl scale deployment gym-api --replicas=4 -n dev

# Rollout: ver estado, historial, reiniciar, deshacer
kubectl rollout status deployment/gym-api -n dev
kubectl rollout history deployment/gym-api -n dev
kubectl rollout restart deployment/gym-api -n dev
kubectl rollout undo deployment/gym-api -n dev
```

---

## 🔁 ReplicaSets

```bash
# Aplicar ReplicaSet
kubectl apply -f manifests/base/replicaset-api.yaml

# Ver ReplicaSets
kubectl get replicasets -n dev
kubectl describe replicaset gym-api-rs -n dev

# Escalar ReplicaSet
kubectl scale replicaset gym-api-rs --replicas=4 -n dev
```

> ⚠️ Si un Deployment y un ReplicaSet independiente usan el mismo selector (`app=gym-api`), competirán por los mismos pods. Usa etiquetas distintas o no los apliques a la vez.

---

## 🌐 Services

```bash
# Aplicar Service
kubectl apply -f manifests/base/service-api-nodeport.yaml

# Ver Services
kubectl get services -n dev
kubectl describe service gym-api-nodeport -n dev

# Ver endpoints (pods que reciben tráfico)
kubectl get endpoints gym-api-nodeport -n dev
# Alternativa moderna (Endpoints está deprecado desde K8s 1.33)
kubectl get endpointslices -n dev -l kubernetes.io/service-name=gym-api-nodeport

# Acceder a un NodePort desde Minikube
minikube service gym-api-nodeport -n dev --url

# Activar LoadBalancer en Minikube (dejar corriendo en otra terminal)
minikube tunnel
```

---

## 🔐 Secrets y ConfigMaps

```bash
# Crear Secret imperativo
kubectl create secret generic gym-db-secret \
  --from-literal=POSTGRES_PASSWORD='GymPass2024!' \
  --from-literal=SPRING_DATASOURCE_PASSWORD='GymPass2024!' \
  -n dev

# Ver Secret (sin exponer valores)
kubectl get secret gym-db-secret -n dev
kubectl describe secret gym-db-secret -n dev

# Ver el valor de una clave (en base64)
kubectl get secret gym-db-secret -n dev -o jsonpath='{.data.POSTGRES_PASSWORD}'

# Decodificar el valor
kubectl get secret gym-db-secret -n dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d

# ConfigMap
kubectl apply -f manifests/base/configmap-api.yaml
kubectl get configmap gym-api-config -n dev
kubectl describe configmap gym-api-config -n dev
```

> 💡 Base64 **no es cifrado**: cualquiera con acceso de lectura al Secret puede decodificarlo.

---

## 💾 PersistentVolumes y PersistentVolumeClaims

```bash
# Aplicar PV y PVC
kubectl apply -f manifests/base/pv-db.yaml
kubectl apply -f manifests/base/pvc-db.yaml

# Ver PV/PVC
kubectl get pv
kubectl get pvc -n dev

# Verificar vinculación (debe decir Bound)
kubectl get pv,pvc -n dev

# Destrabar un PV/PVC atascado en Terminating
kubectl patch pv gym-db-pv -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl patch pvc gym-db-pvc -n dev -p '{"metadata":{"finalizers":null}}' --type=merge

# Liberar un PV (estado Released) para que acepte otro PVC
kubectl patch pv gym-db-pv -p '{"spec":{"claimRef":null}}' --type=merge
```

> ℹ️ Los PersistentVolumes son recursos de clúster (no llevan namespace); los PVC sí.

---

## 🗄️ StatefulSets

```bash
# Aplicar StatefulSet
kubectl apply -f manifests/base/statefulset-db.yaml

# Ver StatefulSets
kubectl get statefulsets -n dev
kubectl describe statefulset gym-db -n dev

# Ver pods del StatefulSet (nombre estable: gym-db-0, gym-db-1...)
kubectl get pods -n dev -l app=gym-db
```

---

## 🚪 Ingress

```bash
# Habilitar addon Ingress en Minikube
minikube addons enable ingress

# Ver pods del controlador
kubectl get pods -n ingress-nginx

# Aplicar Ingress
kubectl apply -f manifests/base/ingress-gym.yaml

# Ver Ingress
kubectl get ingress -n dev
kubectl describe ingress gym-ingress -n dev

# Probar Ingress desde el host (con Host header)
curl -s -H "Host: gym.local" http://$(minikube ip)/actuator/health

# Añadir host a /etc/hosts (para navegador)
echo "$(minikube ip) gym.local" | sudo tee -a /etc/hosts
```

> ℹ️ `192.168.49.2` es la IP habitual de Minikube con driver Docker; `$(minikube ip)` la obtiene automáticamente.

---

## ⏱️ Jobs y CronJobs

```bash
# Aplicar Job
kubectl apply -f manifests/base/job-db-wait.yaml

# Ver Job
kubectl get jobs -n dev
kubectl logs -n dev -l job-name=gym-db-wait

# Aplicar CronJob
kubectl apply -f manifests/base/cronjob-health-check.yaml

# Ver CronJob
kubectl get cronjobs -n dev
kubectl describe cronjob gym-health-check -n dev

# Lanzar ejecución manual de un CronJob
kubectl create job --from=cronjob/gym-health-check gym-health-check-manual -n dev
kubectl logs -n dev -l job-name=gym-health-check-manual
```

---

## 📈 HorizontalPodAutoscaler (HPA)

```bash
# Habilitar metrics-server en Minikube
minikube addons enable metrics-server

# Ver métricas de nodos y pods
kubectl top nodes
kubectl top pods -n dev

# Aplicar HPA
kubectl apply -f manifests/base/hpa-api.yaml

# Ver HPA
kubectl get hpa -n dev
kubectl describe hpa gym-api-hpa -n dev

# Monitorear HPA en tiempo real
kubectl get hpa gym-api-hpa -n dev -w
```

> ⚠️ El HPA solo funciona si los contenedores tienen definidos `resources.requests` de CPU/memoria.

---

## 🛡️ NetworkPolicy

```bash
# Aplicar NetworkPolicy
kubectl apply -f manifests/base/networkpolicy-db.yaml

# Ver NetworkPolicy
kubectl get networkpolicy -n dev
kubectl describe networkpolicy gym-db-network-policy -n dev
```

> ⚠️ Las NetworkPolicies solo se aplican si el CNI las soporta. En Minikube inicia con `--cni=calico` para que tengan efecto.

---

## 🐞 Debugging

```bash
# Ver eventos del namespace
kubectl get events -n dev --sort-by='.lastTimestamp'

# Describir un pod (para ver errores, eventos, estado)
kubectl describe pod -n dev -l app=gym-api

# Ver logs en tiempo real
kubectl logs -f -n dev -l app=gym-api

# Ver logs del intento anterior (útil en CrashLoopBackOff)
kubectl logs -n dev <pod> --previous

# Ejecutar un pod temporal para probar DNS/conectividad
kubectl run test --image=busybox:1.36 --restart=Never -n dev --command -- sh -c 'nslookup gym-db; nc -zv gym-db 5432'
kubectl logs test -n dev
kubectl delete pod test -n dev
```

---

## 🐳 Minikube

```bash
# Iniciar/detener/borrar el clúster
minikube start --driver=docker --cpus=2 --memory=4096
minikube stop
minikube delete

# Estado del clúster
minikube status

# IP del nodo
minikube ip

# Habilitar addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons list

# Abrir Service en el navegador
minikube service gym-frontend-service -n dev

# Túnel para LoadBalancer
minikube tunnel

# Cargar imagen local al clúster (si no está en Docker Hub)
minikube image load neft007/gym-reservas-api:latest
```

---

## 📦 Despliegue unificado (all-in-one)

```bash
# Aplicar un entorno completo de una sola vez
kubectl apply -f all-in-one/all-in-one-dev.yaml
kubectl apply -f all-in-one/all-in-one-qa.yaml
kubectl apply -f all-in-one/all-in-one-prod.yaml

# Eliminar un entorno completo
kubectl delete -f all-in-one/all-in-one-qa.yaml
```

---

## 🔍 Comandos útiles del proyecto

```bash
# Ver todos los recursos del proyecto en un namespace
kubectl get all -n dev -l proyecto=gimnasio-reservas

# Ver pods de todos los namespaces
kubectl get pods -A | grep gym

# Ver el estado de todos los entornos
for ns in dev qa prod; do echo "=== $ns ==="; kubectl get pods -n "$ns"; done

# Verificar que la API responde en cada entorno
curl -s -H "Host: gym.local"      http://$(minikube ip)/actuator/health
curl -s -H "Host: qa.gym.local"   http://$(minikube ip)/actuator/health
curl -s -H "Host: prod.gym.local" http://$(minikube ip)/actuator/health
```

---

## 📚 Referencias

- [Kubernetes Docs](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet oficial](https://kubernetes.io/docs/reference/kubectl/quick-reference/)
- [Minikube Docs](https://minikube.sigs.k8s.io/docs/)
- Proyecto base (Docker) <!-- TODO: agregar URL del repositorio -->
