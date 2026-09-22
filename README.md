# 🛒 E-commerce Microservices

Plataforma de e-commerce construida con **arquitectura de microservicios**, contenerizada con **Docker** y con **CI/CD** automatizado mediante GitHub Actions.

## 🏗️ Arquitectura

```
                          ┌─────────────────┐
                          │   API Gateway   │  (Nginx, puerto 8080)
                          │   /api/...      │
                          └────────┬────────┘
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
      ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
      │    users    │       │  products   │       │   orders    │
      │  (FastAPI)  │       │  (FastAPI)  │◄──────│  (FastAPI)  │
      │  JWT auth   │       │   + Redis   │ HTTP  │             │
      └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
             │                     │                     │
      ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
      │  users-db   │       │ products-db │       │  orders-db  │
      │ (Postgres)  │       │ (Postgres)  │       │ (Postgres)  │
      └─────────────┘       └─────────────┘       └─────────────┘
```

Cada servicio tiene **su propia base de datos**. El servicio de pedidos se comunica con el de productos vía HTTP para validar y reservar stock.

## 🧰 Stack técnico

| Componente        | Tecnología                          |
|-------------------|-------------------------------------|
| Lenguaje / API    | Python 3.12 + FastAPI               |
| ORM               | SQLModel (SQLAlchemy + Pydantic)    |
| Bases de datos    | PostgreSQL 16 (una por servicio)    |
| Caché             | Redis 7                             |
| API Gateway       | Nginx                               |
| Contenedores      | Docker + Docker Compose             |
| CI/CD             | GitHub Actions → GHCR               |
| Tests             | pytest                              |

## 🚀 Puesta en marcha

Requisitos: Docker y Docker Compose.

```bash
# 1. Clonar y configurar
git clone https://github.com/alarcomu/ecommerce-microservices.git
cd ecommerce-microservices
cp .env.example .env

# 2. Levantar todo el stack
docker compose up -d --build
# o, si tienes make:
make up
```

El gateway queda en `http://localhost:8080`.

## 📡 Endpoints (a través del gateway)

### Usuarios
```bash
# Registro
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@mail.com","password":"secret123"}'

# Login (devuelve un JWT)
curl -X POST http://localhost:8080/api/users/login \
  -d "username=ana@mail.com&password=secret123"

# Perfil (usa el token del login)
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer <TOKEN>"
```

### Productos
```bash
# Crear producto
curl -X POST http://localhost:8080/api/products/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Camiseta","description":"Algodón","price":19.99,"stock":50}'

# Listar productos (cacheado en Redis)
curl http://localhost:8080/api/products/products
```

### Pedidos
```bash
# Crear pedido (valida y descuenta stock en el servicio de productos)
curl -X POST http://localhost:8080/api/orders/orders \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":2}'

# Listar pedidos
curl http://localhost:8080/api/orders/orders
```

Cada servicio expone su documentación interactiva de Swagger en `/docs`.

## 🧪 Tests

Los tests usan SQLite en memoria y *mocks*, así que corren sin Docker ni bases de datos reales:

```bash
make test
# o servicio a servicio:
cd services/users && pytest -v
```

## 🔄 CI/CD

El pipeline (`.github/workflows/ci.yml`) se ejecuta en cada push y pull request:

1. **test** — ejecuta los tests de los 3 servicios en paralelo (matriz).
2. **build-and-push** — solo en `main`: construye las imágenes Docker y las publica en GitHub Container Registry (GHCR).

