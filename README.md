# 🔐 Users Microservice

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)](https://kafka.apache.org/)
[![CQRS](https://img.shields.io/badge/CQRS-Architecture-009688?style=for-the-badge)](https://martinfowler.com/bliki/CQRS.html)
[![DDD](https://img.shields.io/badge/DDD-Architecture-FF6B6B?style=for-the-badge)](https://martinfowler.com/bliki/DomainDrivenDesign.html)

Microservicio de gestión de usuarios construido con **NestJS**, implementando **Domain-Driven Design (DDD)**, **CQRS**, **Event Sourcing** y comunicación mediante **Apache Kafka**. Arquitectura optimizada para alta escalabilidad y consistencia eventual.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#️-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Migraciones de Base de Datos](#-migraciones-de-base-de-datos)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Uso](#-uso)
- [Patrones de Mensajes Kafka](#-patrones-de-mensajes-kafka)
- [Testing](#-testing)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## ✨ Características

### Patrones de Diseño

- ✅ **Domain-Driven Design (DDD)** - Separación clara de capas y responsabilidades
- ✅ **CQRS** (Command Query Responsibility Segregation) - Separación de escritura y lectura
- ✅ **Event Sourcing** - Registro completo de eventos de dominio
- ✅ **Event-Driven Architecture** - Comunicación asíncrona mediante eventos
- ✅ **Clean Code Principles** - Código mantenible y legible

### Arquitectura

- 📝 **Write Database** - Base de datos optimizada para escrituras (commands)
- 📖 **Read Database** - Base de datos optimizada para lecturas (queries)
- 🎯 **Event Store** - Almacenamiento de eventos de dominio
- 🔄 **Projection Synchronization** - Sincronización automática de proyecciones
- 🚀 **Event-Driven Projections** - Actualizaciones en tiempo real

### Funcionalidades

- 👤 **Gestión de Usuarios** - CRUD completo con soft delete
- 🔐 **Value Objects** - Email, Password, PersonName, Phone, etc.
- 🎯 **Aggregates** - User como aggregate root
- 📊 **Proyecciones Optimizadas** - Para consultas rápidas
- 🔒 **Seguridad** - Hashing de contraseñas, validaciones
- 📨 **Kafka Integration** - Comunicación mediante message patterns
- 🔄 **Sincronización CQRS** - Consistencia eventual garantizada

---

## 🏗️ Arquitectura

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    Kafka Message Layer                      │
│                  (user.create, user.findAll, etc.)          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Commands   │  │   Queries    │  │    Events    │        │
│  │  Handlers   │  │   Handlers   │  │   Handlers   │        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Aggregates  │  │ Value Objects│  │   Services   │        │
│  │   (User)    │  │ (Email, etc.)│  │   (Domain)   │        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Repositories│  │  Event Store │  │  Projections │        │
│  │  (TypeORM)  │  │  (PostgreSQL)│  │  (PostgreSQL)│        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                           │
│  ┌──────────────────┐          ┌────────────────────┐       │
│  │  Write Database  │          │   Read Database    │       │
│  │  (users_write)   │          │  (users_read)      │       │
│  │  - users         │          │  - user_projections│       │
│  │  - domain_events │          │                    │       │
│  └──────────────────┘          └────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### CQRS Flow

```
Command (Write)                      Query (Read)
     │                                    │
     ├──> CommandHandler                 ├──> QueryHandler
     │         │                          │         │
     │         ├──> Aggregate             │         ├──> Projection
     │         │         │                │         │         │
     │         │         ├──> Event       │         └─────────┤
     │         │         │                │                   │
     │         ├──> Repository            │                   │
     │         │         │                │                   │
     │         └─────────┤                │                   │
     │                   │                │                   │
     ▼                   ▼                ▼                   ▼
Write Database      Event Store    Read Database     User Projection
(users_write)    (domain_events)   (users_read)   (user_projections)
     │                   │                ▲                   ▲
     │                   │                │                   │
     └──> EventBus ──────┼────────────────┼───────────────────┘
                         │                │
                         └──> ProjectionSyncService ───────────┘
```

### Flujo de Eliminación de Usuarios (Ejemplo Implementado)

```
1. Kafka Message (user.delete) → UserController
2. DeleteUserCommand → DeleteUserHandler
3. Soft Delete en Write DB (users.deletedAt = NOW())
4. UserDeletedEvent → EventBus
5. Event Store (domain_events)
6. ProjectionSyncService → Update Read DB (users.deletedAt = NOW())
7. Consistencia eventual alcanzada
```

---

## 🛠️ Tecnologías

### Core

- **[NestJS](https://nestjs.com/)** v11.x - Framework backend progresivo
- **[TypeScript](https://www.typescriptlang.org/)** v5.7.x - Lenguaje de programación
- **[Node.js](https://nodejs.org/)** v18+ - Runtime de JavaScript

### Base de Datos

- **[PostgreSQL](https://www.postgresql.org/)** v14+ - Base de datos relacional
- **[TypeORM](https://typeorm.io/)** v0.3.26 - ORM para TypeScript/JavaScript

### Mensajería

- **[Apache Kafka](https://kafka.apache.org/)** - Sistema de mensajería distribuido
- **[KafkaJS](https://kafka.js.org/)** v2.2.4 - Cliente Kafka para Node.js

### Patrones

- **[@nestjs/cqrs](https://docs.nestjs.com/recipes/cqrs)** v11.0.3 - Implementación de CQRS
- **Event Sourcing** - Patrón de almacenamiento de eventos

### Herramientas

- **[Jest](https://jestjs.io/)** v29.7.0 - Framework de testing
- **[ESLint](https://eslint.org/)** v9.18.0 - Linter de código
- **[Prettier](https://prettier.io/)** v3.4.2 - Formateador de código

---

## 📦 Requisitos Previos

### Software Requerido

1. **Node.js** >= 18.0.0
   ```bash
   node --version
   ```

2. **npm** >= 9.0.0 o **yarn** >= 1.22.0
   ```bash
   npm --version
   ```

3. **PostgreSQL** >= 14.0
   ```bash
   psql --version
   ```

4. **Apache Kafka** >= 3.0.0
   ```bash
   # Con Docker
   docker-compose up -d kafka
   ```

### Servicios Externos

- **Kafka Broker** - localhost:9092 (o configurar en `.env`)
- **PostgreSQL Server** - localhost:5432 (o configurar en `.env`)

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd users
```

### 2. Instalar Dependencias

```bash
# Con npm
npm install

# Con yarn
yarn install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
nano .env
```

### 4. Crear Bases de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear bases de datos
CREATE DATABASE users_write;
CREATE DATABASE users_read;

# Habilitar extensiones
\c users_write
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c users_read
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

### 5. Ejecutar Migraciones

```bash
# Compilar proyecto
npm run build

# Ejecutar migraciones
npm run migration:run
```

### 6. Iniciar Aplicación

```bash
# Modo desarrollo
npm run start:dev

# Modo producción
npm run start:prod
```

---

## ⚙️ Configuración

### Archivo `.env`

Crear un archivo `.env` en la raíz del proyecto (ver `.env.example` para referencia):

```env
# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV=development

# ============================================
# WRITE DATABASE (Commands)
# ============================================
DB_WRITE_HOST=localhost
DB_WRITE_PORT=5432
DB_WRITE_USERNAME=postgres
DB_WRITE_PASSWORD=your_password
DB_WRITE_NAME=users_write

# ============================================
# READ DATABASE (Queries)
# ============================================
DB_READ_HOST=localhost
DB_READ_PORT=5432
DB_READ_USERNAME=postgres
DB_READ_PASSWORD=your_password
DB_READ_NAME=users_read

# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=false
DB_LOGGING=false

# ============================================
# KAFKA CONFIGURATION
# ============================================
URL_BROKER=localhost:9092
KFUSERNAME=your_kafka_username
KFPASSWORD=your_kafka_password
GROUP_ID_KAFKA=users-service-consumer
```

### Docker Compose (Opcional)

> **Nota:** El proyecto no incluye un `docker-compose.yml` preconfigurado. A continuación se proporciona un ejemplo que puedes crear según tus necesidades:

Crear un `docker-compose.yml` para servicios locales:

```yaml
version: '3.8'

services:
  postgres_write:
    image: postgres:14-alpine
    container_name: auth_write_db
    environment:
      POSTGRES_DB: users_write
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_write_data:/var/lib/postgresql/data

  postgres_read:
    image: postgres:14-alpine
    container_name: auth_read_db
    environment:
      POSTGRES_DB: users_read
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres_read_data:/var/lib/postgresql/data

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    container_name: auth_zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:latest
    container_name: auth_kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

volumes:
  postgres_write_data:
  postgres_read_data:
```

Iniciar servicios:

```bash
docker-compose up -d
```

---

## 🗄️ Migraciones de Base de Datos

### Estructura

El proyecto usa **una migración maestra única** que detecta automáticamente en qué base de datos se ejecuta:

- **Write Database**: Crea `users` y `domain_events`
- **Read Database**: Crea `user_projections`

### Comandos

```bash
# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert

# Generar nueva migración
npm run migration:generate -- migrations/NombreMigracion

# Crear migración vacía
npm run migration:create -- migrations/NombreMigracion

# Ver estado de migraciones
npm run migration:show
```

### Estructura de Tablas

#### Write Database (`users_write`)

**Tabla: `users`** (17 campos)
```sql
-- Campos principales
- id (uuid, PK)
- email (varchar, unique)
- password (varchar, hashed)
- first_name (varchar)
- last_name (varchar)
- phone (varchar, nullable)
- status (varchar, default: 'PENDING_VERIFICATION')
- role_id (uuid, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- last_login_at (timestamp, nullable)

-- Campos específicos del negocio
- trade_name (varchar, nullable) - Nombre comercial
- legal_name (varchar, nullable) - Razón social
- dv (int, nullable) - Dígito de verificación
- email_notification (varchar, nullable) - Email de notificaciones
- indicative_contact (varchar, nullable) - Indicativo de contacto
- category_id (int, nullable) - Referencia a categoría de negocio
```

**Índices:**
- `IDX_USERS_EMAIL` - Búsqueda por email
- `IDX_USERS_STATUS` - Filtrado por estado
- `IDX_USERS_CREATED_AT` - Ordenamiento por fecha

**Tabla: `domain_events`** (9 campos - Event Store)
```sql
- id (uuid, PK)
- aggregate_id (uuid) - ID del aggregate root (ej: user ID)
- aggregate_type (varchar) - Tipo de aggregate (ej: User)
- event_type (varchar) - Tipo de evento de dominio
- event_data (jsonb) - Payload completo del evento
- metadata (jsonb, nullable) - Metadatos (user, IP, correlation ID)
- version (int) - Versión del aggregate
- occurred_at (timestamp) - Cuando ocurrió el evento
- created_at (timestamp) - Cuando se almacenó el evento
```

**Índices optimizados:**
- `IDX_DOMAIN_EVENTS_AGGREGATE_ID` - Búsqueda por aggregate
- `IDX_DOMAIN_EVENTS_AGGREGATE_TYPE` - Filtrado por tipo
- `IDX_DOMAIN_EVENTS_EVENT_TYPE` - Filtrado por evento
- `IDX_DOMAIN_EVENTS_OCCURRED_AT` - Ordenamiento temporal
- `IDX_DOMAIN_EVENTS_AGGREGATE_VERSION` (UNIQUE) - Control de versiones
- `IDX_DOMAIN_EVENTS_EVENT_DATA` (GIN) - Búsqueda en JSON
- `IDX_DOMAIN_EVENTS_METADATA` (GIN) - Búsqueda en metadatos

#### Read Database (`users_read`)

**Tabla: `user`** (12 campos - Proyección optimizada para queries)
```sql
- id (uuid, PK) - Mismo ID que en users table
- email (varchar, unique)
- full_name (varchar) - Denormalizado: first_name + last_name
- status (varchar)
- phone (varchar, nullable)
- last_login_at (timestamp, nullable)
- failed_login_attempts (int, default: 0)
- roles (jsonb, nullable) - Array denormalizado de roles
- permissions (jsonb, nullable) - Array aplanado de permisos
- profile_completion (int, default: 0) - Porcentaje 0-100
- created_at (timestamp)
- updated_at (timestamp)
```

**Índices optimizados:**
- `IDX_USER_PROJECTIONS_EMAIL` (UNIQUE) - Búsqueda por email
- `IDX_USER_PROJECTIONS_STATUS` - Filtrado por estado
- `IDX_USER_PROJECTIONS_CREATED_AT` - Ordenamiento
- `IDX_USER_PROJECTIONS_LAST_LOGIN_AT` - Ordenamiento por último login
- `IDX_USER_PROJECTIONS_ROLES` (GIN) - Búsqueda en roles JSON
- `IDX_USER_PROJECTIONS_PERMISSIONS` (GIN) - Búsqueda en permisos JSON

---

## 📁 Estructura del Proyecto

```
users/
├── src/
│   ├── users/                          # Módulo de usuarios (DDD)
│   │   ├── application/                # Capa de aplicación
│   │   │   ├── commands/               # Commands (10 archivos)
│   │   │   ├── queries/                # Queries y handlers (7 archivos)
│   │   │   ├── dtos/                   # Data Transfer Objects (8 archivos)
│   │   │   ├── handlers/               # Command handlers (9 archivos)
│   │   │   ├── projections/            # Projection services
│   │   │   ├── sagas/                  # Sagas (orchestration)
│   │   │   └── services/               # Application services
│   │   ├── domain/                     # Capa de dominio (DDD)
│   │   │   ├── entities/               # Aggregates (User, Role)
│   │   │   ├── events/                 # Domain events (14 archivos)
│   │   │   ├── services/               # Domain services (3 archivos)
│   │   │   └── value-objects/          # Value Objects (Email, Password, etc.)
│   │   ├── infrastructure/             # Capa de infraestructura
│   │   │   ├── controllers/            # Kafka message pattern controller
│   │   │   ├── auth/                   # JWT Strategy
│   │   │   └── entities/               # TypeORM entities
│   │   └── decorators/                 # Custom decorators
│   ├── common/                         # Código compartido
│   │   ├── exceptions/                 # Custom exceptions (Business, Server)
│   │   ├── filters/                    # Exception filters (Global, Validation)
│   │   ├── helpers/                    # Helper functions (Response)
│   │   ├── interceptors/               # Interceptors (Success Response)
│   │   └── utils/                      # Utilidades (Phone utils)
│   ├── config/                         # Configuración
│   │   ├── database-write.config.ts    # Config Write DB (Command Side)
│   │   └── database-read.config.ts     # Config Read DB (Query Side)
│   ├── shared/                         # Recursos compartidos
│   │   ├── domain/                     # Domain compartido
│   │   │   ├── entities/               # User, Role entities
│   │   │   ├── events/                 # Domain event base
│   │   │   ├── repositories/           # Repository interfaces
│   │   │   └── value-objects/          # VOs compartidos (Email, Password, etc.)
│   │   ├── infrastructure/             # Infra compartida
│   │   │   ├── entities/               # TypeORM entities (User, DomainEvent, UserProjection)
│   │   │   ├── event-store/            # Event Store service
│   │   │   ├── projections/            # Projection sync service
│   │   │   └── repositories/           # Repository implementations
│   │   └── user.entity.ts              # User TypeORM entity
│   ├── scripts/                        # Scripts de utilidad
│   │   └── run-migration.ts            # Script de migraciones
│   ├── app.module.ts                   # Módulo raíz con CQRS
│   ├── app.service.ts                  # Application service
│   ├── kafka.server.ts                 # Custom Kafka server strategy
│   └── main.ts                         # Entry point (Kafka microservice)
├── migrations/                         # Database migrations
│   └── 1759100000000-InitializeUsersDatabases.ts  # Migración maestra única
├── test/                               # Tests
│   ├── jest-e2e.json                   # E2E test config
│   └── jest.setup.js                   # Test setup
├── dist/                               # Archivos compilados
├── .env.example                        # Ejemplo de variables de entorno
├── jest.config.js                      # Configuración Jest
├── package.json                        # Dependencias
├── tsconfig.json                       # Configuración TypeScript
├── tsconfig.build.json                 # Configuración build
└── README.md                           # Este archivo
```

**Notas sobre la estructura:**
- Implementa **DDD** con separación clara de capas (Domain, Application, Infrastructure)
- Usa **CQRS** con bases de datos separadas (Write/Read)
- Incluye **Event Sourcing** con Event Store en PostgreSQL
- Controller usa **Kafka Message Patterns** para comunicación asíncrona
- Migración única que detecta automáticamente en qué BD se ejecuta
- **ProjectionSyncService** para sincronización automática entre bases de datos
- **Clean Code** aplicado con métodos auxiliares y comentarios en español
- **Event-Driven Architecture** para actualizaciones en tiempo real

---

## 💻 Uso

### Patrones de Mensajes Kafka

El microservicio se comunica mediante patrones de mensajes Kafka:

#### 1. Crear Usuario

```typescript
// Patrón: user.create
const payload = {
  email: "user@example.com",
  password: "SecurePass123",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890"
};

// Respuesta
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "status": "PENDING_VERIFICATION"
  },
  "timestamp": "2025-10-23T14:15:30.000Z"
}
```

#### 2. Listar Usuarios

```typescript
// Patrón: user.findAll
const payload = {
  page: 1,
  limit: 10,
  status: "ACCEPTED"
};

// Respuesta
{
  "success": true,
  "message": "Usuarios obtenidos exitosamente",
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### 3. Obtener Usuario por ID

```typescript
// Patrón: user.findById
const payload = {
  id: "uuid-here"
};
```

#### 4. Actualizar Usuario

```typescript
// Patrón: user.update
const payload = {
  id: "uuid-here",
  firstName: "Jane",
  lastName: "Smith",
  phone: "+9876543210"
};
```

#### 5. Eliminar Usuario

```typescript
// Patrón: user.delete
const payload = {
  id: "uuid-here",
  hard: false // soft delete
};
```

#### 6. Health Check

```typescript
// Patrón: user.health
const payload = {};
```

### Ejemplo con KafkaJS

```typescript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'my-app-group' });

// Producir mensaje
await producer.connect();
await producer.send({
  topic: 'user.create',
  messages: [
    {
      key: 'user-1',
      value: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User'
      })
    }
  ]
});

// Consumir respuesta
await consumer.connect();
await consumer.subscribe({ topic: 'user.create.reply' });
await consumer.run({
  eachMessage: async ({ message }) => {
    const response = JSON.parse(message.value.toString());
    console.log('Response:', response);
  }
});
```

---

## 📨 Patrones de Mensajes Kafka

### Patrones Disponibles

| Patrón | Descripción | Payload |
|--------|-------------|---------|
| `user.create` | Crear usuario | `{ email, password, firstName, lastName, phone }` |
| `user.findAll` | Listar usuarios | `{ page?, limit?, status? }` |
| `user.findById` | Obtener usuario | `{ id }` |
| `user.update` | Actualizar usuario | `{ id, firstName?, lastName?, phone? }` |
| `user.delete` | Eliminar usuario | `{ id, hard? }` |
| `user.health` | Health check | `{}` |

### Estructura de Respuesta

**Éxito:**
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { ... },
  "timestamp": "ISO 8601"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Mensaje de error",
  "error": "Detalle técnico",
  "timestamp": "ISO 8601"
}
```

Para detalles de implementación, ver el controlador en `src/users/infrastructure/controllers/user.controller.ts`

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Unit tests
npm run test

# Unit tests en modo watch
npm run test:watch

# Unit tests con coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration
```

### Estructura de Tests

```
test/
├── jest-e2e.json                   # Configuración E2E tests
└── jest.setup.js                   # Setup de tests
```

> **Nota:** La estructura de tests está en desarrollo. Los tests unitarios, de integración y e2e se pueden agregar según las necesidades del proyecto.

### Ejecutar Tests con Jest

El proyecto usa Jest para testing. Consulta `jest.config.js` para la configuración completa.

---

## 🚢 Despliegue

### Modo Producción

```bash
# Compilar el proyecto
npm run build

# Ejecutar en producción
npm run start:prod
```

### Variables de Entorno en Producción

```env
NODE_ENV=production
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=false
DB_LOGGING=false

# Configurar conexiones a bases de datos de producción
DB_WRITE_HOST=your-write-db-host
DB_READ_HOST=your-read-db-host

# Configurar Kafka de producción
URL_BROKER=your-kafka-broker:9092
```

### Con Docker

> **Nota:** El proyecto no incluye un `Dockerfile` preconfigurado. Se recomienda crear uno basándose en las necesidades específicas de tu infraestructura.

### Consideraciones de Producción

- ✅ Ejecutar migraciones antes del despliegue: `npm run migration:run`
- ✅ `DB_SYNCHRONIZE` debe estar siempre en `false`
- ✅ Configurar SSL para conexiones a bases de datos
- ✅ Usar variables de entorno seguras (secrets management)
- ✅ Configurar health checks del microservicio Kafka
- ✅ Monitorear el Event Store y las proyecciones

---

## 🤝 Contribución

### Guía de Contribución

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- **ESLint**: Configuración estándar de NestJS
- **Prettier**: Formateo automático
- **Conventional Commits**: Para mensajes de commit
- **Tests**: Cobertura mínima del 80%

### Proceso de Review

1. ✅ Tests pasan
2. ✅ Linter sin errores
3. ✅ Cobertura de tests adecuada
4. ✅ Documentación actualizada
5. ✅ Review de al menos 1 maintainer

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Arquitectura

- **Arquitectura**: Implementación DDD, CQRS y Event Sourcing

---

## 📞 Soporte

- 📧 Contacto: Equipo de desarrollo
- 🐛 Issues: Reporte de bugs y solicitudes de features
- 📚 Documentación: Ver código fuente y comentarios inline

---

## 🔗 Enlaces Útiles

- [NestJS Documentation](https://docs.nestjs.com/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [TypeORM Documentation](https://typeorm.io/)

---

## 📊 Estado del Proyecto

- ✅ **Arquitectura DDD** - Implementada con agregados y value objects
- ✅ **CQRS** - Bases de datos separadas (Write/Read) con sincronización automática
- ✅ **Event Sourcing** - Event Store funcional con ProjectionSyncService
- ✅ **Kafka Integration** - Message patterns implementados
- ✅ **Clean Code** - Principios aplicados con refactorización completa
- ✅ **Sincronización CQRS** - Eliminación de usuarios con consistencia eventual
- ⚠️ **Testing** - En desarrollo
- ✅ **Documentación** - Actualizada con arquitectura implementada

---

**Versión**: 0.0.1
**Última actualización**: 2025-10-26
**Estado**: En desarrollo activo con arquitectura CQRS/DDD implementada

---

<div align="center">
  <p>Hecho por Wartel Velasquez ❤️ usando NestJS y TypeScript</p>
  <p>© 2025. Microservicio de Usuarios con DDD, CQRS y Event Sourcing.</p>
</div>

