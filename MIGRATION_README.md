# Migración: ASP.NET Core → NestJS + Next.js + PostgreSQL

## Estructura del Proyecto

```
├── backend/          # NestJS API
│   ├── prisma/       # Schema de base de datos
│   └── src/
│       ├── modules/  # Módulos de la aplicación
│       └── prisma/   # Servicio de Prisma
├── frontend/         # Next.js App
│   └── src/
│       ├── app/      # Páginas de Next.js
│       └── lib/      # Cliente API
└── README.md
```

## Requisitos Previos

- Node.js 20+
- Bun (instalado)
- PostgreSQL 14+
- Docker (opcional)

## Configuración

### 1. Base de Datos PostgreSQL

```bash
# Usando Docker
docker run -d \
  --name postgres-cementerio \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cementerio \
  -p 5432:5432 \
  postgres:14
```

### 2. Backend (NestJS)

```bash
cd backend

# Instalar dependencias
bun install

# Generar cliente Prisma
bun prisma generate

# Ejecutar migraciones
bun prisma migrate dev

# Iniciar servidor
bun run start:dev
```

El API estará disponible en: http://localhost:3001

### 3. Frontend (Next.js)

```bash
cd frontend

# Instalar dependencias
bun install

# Iniciar desarrollo
bun run dev
```

La aplicación estará disponible en: http://localhost:3000

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cementerio"
JWT_SECRET="cementerio-secret-key-change-in-production"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario
- `GET /auth/profile` - Perfil del usuario

- `GET /contratos` - Listar contratos
- `GET /contratos/reportes` - Reportes
- `POST /contratos` - Crear contrato
- `PUT /contratos/:id` - Actualizar contrato
- `DELETE /contratos/:id` - Eliminar contrato

- `GET /bovedas` - Listar bóvedas
- `GET /bovedas/bloque/:id` - Bóvedas por bloque
- `POST /bovedas` - Crear bóveda

- `GET /difuntos` - Listar difuntos
- `POST /difuntos` - Crear difunto

- `GET /personas` - Listar personas
- `GET /personas/search?q=term` - Buscar personas

- `GET /pagos` - Listar pagos
- `POST /pagos` - Registrar pago

- `GET /cuotas` - Listar cuotas
- `GET /cuotas/pendientes` - Cuotas pendientes

- `GET /cementerios` - Listar cementerios
- `GET /bloques` - Listar bloques

## Swagger

Documentación disponible en: http://localhost:3001/api/docs

## Migración de Datos

Para migrar datos del sistema anterior:
1. Exportar datos de SQL Server
2. Importar a PostgreSQL usando scripts SQL o herramientas como DBeaver
