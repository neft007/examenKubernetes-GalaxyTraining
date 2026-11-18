# 🏋️ Gimnasio Reservas - API + Frontend + Docker

Sistema de reservas para gimnasio con API REST (Spring Boot), Frontend (React/HTML) y base de datos PostgreSQL, todo dockerizado con Docker Compose.

## 🚀 Stack Tecnológico

- **Backend:** Java 17 + Spring Boot 4.1.1
- **Frontend:** React (o HTML/JS) servido con Nginx
- **Base de Datos:** PostgreSQL 16 (Alpine)
- **Caché:** Redis 7 (Alpine)
- **Administración BD:** Adminer
- **Contenedores:** Docker + Docker Compose
- **Registros:** Docker Hub + GitHub Container Registry

## 🏗️ Arquitectura

```text
┌──────────────────────────────────────────────────────────────────┐
│                     Red: gym-network (bridge)                    │
│                                                                  │
│  ┌──────────────┐     ┌───────────────┐     ┌──────────────┐     │
│  │   Frontend   │────▶│      API      │────▶│  PostgreSQL  │     │
│  │   (Nginx)    │     │ (Spring Boot) │     │     (16)     │     │
│  │    :3000     │     │ :8080, :9090  │     │    :5432     │     │
│  └──────────────┘     └───────┬───────┘     └──────┬───────┘     │
│                               │                    │             │
│                       ┌───────┴───────┐     ┌──────┴───────┐     │
│                       │    Worker     │     │   Adminer    │     │
│                       │ (Spring Boot) │     │   (GUI BD)   │     │
│                       └───────────────┘     └──────────────┘     │
│                                                                  │
│                       ┌───────────────┐                          │
│                       │     Redis     │                          │
│                       │    (Caché)    │                          │
│                       └───────────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

## 📋 Requisitos

- Docker Engine 24+
- Docker Compose v2+
- (Opcional) Docker Scout para escaneo de seguridad

## 🚀 Cómo levantar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/neft007/examenDocker-GalaxyTraining.git
cd examenDocker-GalaxyTraining
```

### 2. Crear el archivo de secreto

```bash
printf "GymPass2024!" > db_password.txt
```

### 3. Levantar el stack

```bash
docker compose up -d --build
```

### 4. Verificar que todo está corriendo

```bash
docker compose ps
```

Deberías ver 6 contenedores:

| Contenedor     | Servicio              | Estado esperado |
|----------------|-----------------------|-----------------|
| `gym-db`       | PostgreSQL            | healthy         |
| `gym-redis`    | Redis                 | running         |
| `gym-api`      | API Spring Boot       | healthy         |
| `gym-worker`   | Worker Spring Boot    | running         |
| `gym-adminer`  | GUI de base de datos  | running         |
| `gym-frontend` | Frontend Nginx        | running         |

### 5. Acceder a los servicios

| Servicio    | URL                                     | Descripción          |
|-------------|-----------------------------------------|----------------------|
| Frontend    | <http://localhost:3000>                 | Interfaz de usuario  |
| API         | <http://localhost:8080>                 | API REST             |
| Swagger UI  | <http://localhost:8080/swagger-ui.html> | Documentación API    |
| Adminer     | <http://localhost:8081>                 | GUI de base de datos |
| Healthcheck | <http://localhost:8080/actuator/health> | Estado de la API     |

## 🔒 Seguridad

- ✅ **Usuario no-root:** el contenedor corre como `appuser` (no root).
- ✅ **Multi-stage build:** imagen final solo con JRE + JAR (sin Maven).
- ✅ **Secretos:** contraseña de BD en Docker Secrets (`/run/secrets/db_password`).
- ✅ **Red interna:** la BD no expone puertos al host.
- ✅ **Healthchecks:** detección temprana de fallos.
- ✅ **Docker Scout:** escaneo de vulnerabilidades.

## 📦 Imágenes publicadas

- **Docker Hub:** [`neft007/gym-reservas-api`](https://hub.docker.com/r/neft007/gym-reservas-api)
- **GitHub Container Registry:** [`ghcr.io/neft007/gym-reservas-api`](https://github.com/neft007/examenDocker-GalaxyTraining/pkgs/container/gym-reservas-api)

## 🧪 Comandos útiles

```bash
# Ver logs de la API
docker compose logs -f gym-api

# Verificar comunicación entre contenedores
docker exec -it gym-api ping -c 2 gym-db

# Escanear vulnerabilidades
docker scout quickview neft007/gym-reservas-api:latest

# Bajar el stack (mantiene volúmenes)
docker compose down

# Bajar y eliminar volúmenes
docker compose down -v
```

## 📄 Documentación adicional

- Docker Cheat Sheet
- Evidencias de sustentación

## 👤 Autor

**Neftalí** - [@neft007](https://github.com/neft007)

## 📅 Fecha

Noviembre 2026 - Examen Final Docker & Docker Compose - Galaxy Training
