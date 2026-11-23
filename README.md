# ☸️ Gimnasio Reservas - Kubernetes

Despliegue completo del sistema de reservas para gimnasio en **Kubernetes**, usando **Minikube** para desarrollo local y **AWS EKS** como objetivo de despliegue en la nube.

## 🚀 Stack tecnológico

- **Orquestación:** Kubernetes (v1.37 en local)
- **Backend:** Java 17 + Spring Boot (API + Worker)
- **Frontend:** Nginx (React/HTML)
- **Base de datos:** PostgreSQL 16 (Alpine) con PersistentVolume
- **Caché:** Redis 7 (Alpine)
- **Administración de BD:** Adminer
- **Herramientas locales:** Minikube, kubectl, eksctl, AWS CLI
- **Nube:** AWS EKS (pendiente de validación de cuenta)

## 🏗️ Arquitectura en Kubernetes

```text
                       ┌───────────────────────────────┐
                       │        INGRESS (Nginx)        │
                       │    gym.local (dev) · qa · prod│
                       └──────────────┬────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
     ┌────────▼────────┐                             ┌────────▼────────┐
     │  Frontend Svc   │                             │    API Svc      │
     │  (ClusterIP)    │                             │  (NodePort/LB)  │
     └────────┬────────┘                             └────────┬────────┘
              │                                               │
     ┌────────▼────────┐                             ┌────────▼────────┐
     │   Deployment    │                             │   Deployment    │
     │    Frontend     │                             │    API (x2)     │
     └─────────────────┘                             └────────┬────────┘
                                                              │
                                                     ┌────────▼────────┐
                                                     │  StatefulSet    │
                                                     │  PostgreSQL     │
                                                     │  (PVC 1Gi)      │
                                                     └─────────────────┘
```

## 📂 Estructura del repositorio

```text
examenKubernetes-GalaxyTraining/
├── all-in-one/               # Despliegue unificado (dev, qa, prod)
├── evidencias/k8s/           # Capturas y documento de sustentación
├── manifests/                # Manifiestos individuales
│   └── base/                 # Todos los recursos base
├── src/                      # Código fuente (API + Worker)
├── frontend/                 # Código del frontend
├── eks-cluster.yaml          # Configuración del clúster AWS EKS
├── KUBERNETES-CHEATSHEET.md  # Hoja de ayuda personalizada
└── README.md
```

## 🚀 Cómo levantar el proyecto (local con Minikube)

### 1. Iniciar Minikube

```bash
# --cni=calico es necesario para que las NetworkPolicy se apliquen realmente
minikube start --driver=docker --cpus=2 --memory=4096 --cni=calico
minikube addons enable ingress
minikube addons enable metrics-server
```

### 2. Desplegar el entorno (ej. dev)

```bash
# Crear los namespaces (si no existen)
kubectl apply -f manifests/base/namespaces.yaml

# Crear el Secret de la BD de forma imperativa (no se versiona en el repo)
kubectl create secret generic gym-db-secret \
  --from-literal=POSTGRES_PASSWORD='<tu-password>' \
  --from-literal=SPRING_DATASOURCE_PASSWORD='<tu-password>' \
  -n dev

# Desplegar todo el stack con el archivo unificado
kubectl apply -f all-in-one/all-in-one-dev.yaml
```

### 3. Verificar que todo esté corriendo

```bash
kubectl get pods -n dev
kubectl get services -n dev
```

### 4. Acceder a la aplicación

Primero obtén la IP de Minikube y agrégala a `/etc/hosts`:

```bash
minikube ip                                    # normalmente 192.168.49.2
echo "$(minikube ip) gym.local" | sudo tee -a /etc/hosts
```

| Servicio | URL |
|---|---|
| Frontend | http://gym.local |
| API Health | http://gym.local/actuator/health |
| Adminer (GUI de BD) | http://192.168.49.2:30081 |

> 💡 En macOS o Windows con el driver `docker`, la IP de Minikube no es accesible directamente: ejecuta `minikube tunnel` en otra terminal y usa `127.0.0.1` en `/etc/hosts`.

## ☁️ Despliegue en AWS EKS

El archivo `eks-cluster.yaml` contiene la configuración para crear un clúster EKS con 2 nodos `t3.micro` en la región `us-east-2`.

```bash
# Crear el clúster
eksctl create cluster -f eks-cluster.yaml

# Configurar kubectl para apuntar al clúster
aws eks update-kubeconfig --name gym-cluster --region us-east-2

# Desplegar el entorno de producción
kubectl apply -f all-in-one/all-in-one-prod.yaml
```

> ⚠️ **Nota:** El despliegue en AWS quedó bloqueado por una verificación de identidad de la cuenta. El manifiesto y los logs del intento están documentados en `evidencias/k8s/`.

## 🔒 Seguridad

- ✅ **Secrets:** contraseñas gestionadas con un Secret de Kubernetes, creado fuera del repositorio.
- ✅ **NetworkPolicy:** aislamiento de la BD (solo la API puede conectarse).
- ✅ **Usuario no-root:** imágenes de Docker configuradas con `appuser`.
- ✅ **Probes:** `readinessProbe` y `livenessProbe` en la API y la BD.

## 🧪 Comandos útiles

```bash
# Ver todos los recursos del proyecto
kubectl get all -n dev

# Ver logs de la API
kubectl logs -f -n dev -l app=gym-api

# Escalar la API manualmente
kubectl scale deployment gym-api --replicas=4 -n dev

# Ver el estado del HPA (escalado automático)
kubectl get hpa -n dev

# Destruir un entorno completo
kubectl delete -f all-in-one/all-in-one-dev.yaml
kubectl delete secret gym-db-secret -n dev   # el Secret se creó aparte
```

## 📄 Documentación adicional

- [Kubernetes Cheat Sheet](KUBERNETES-CHEATSHEET.md)
- [Evidencias de sustentación](evidencias/k8s/)

## 👤 Autor

**Neftalí** – [@neft007](https://github.com/neft007)

## 📅 Fecha

Noviembre 2026 – Examen Final *Kubernetes for Developers* – Galaxy Training