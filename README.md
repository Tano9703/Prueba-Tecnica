# Prueba Técnica - Admin Panel Ecommerce

Panel administrativo genérico y reutilizable para ecommerce, construido con NestJS + Prisma + PostgreSQL + Next.js + TailwindCSS + componentes tipo shadcn/ui.

## Objetivo de la prueba
Desarrollar un admin panel con CRUDs básicos y login funcional, priorizando:

- organización de código,
- reutilización de componentes,
- escalabilidad,
- prolijidad técnica.

Referencia visual utilizada:

- Figma: `https://www.figma.com/design/2Mt9eNmtL5zelHCBOM6KlP/Prueba-Tecnica-WEB?node-id=0-1&p=f&t=JPrKed999wpruowX-0`

## Tecnologías

- NestJS
- Prisma
- PostgreSQL
- Next.js + React
- TailwindCSS + componentes UI reutilizables

## Puesta en marcha

Todos los comandos se ejecutan desde la raíz del repo.

### 1) Requisitos

- Node.js 20+
- pnpm 10+
- Docker Desktop

### 2) Variables de entorno

- `apps/api/.env` (basado en `apps/api/.env.example`)
- `apps/web/.env.local` (basado en `apps/web/.env.example`)

Valores relevantes:

- API: `http://localhost:3002`
- WEB: `http://localhost:3004`
- PostgreSQL host: `localhost:5433`

### 3) Instalar dependencias

```bash
pnpm install
```

### 4) Levantar base de datos

```bash
pnpm db:up
```

### 5) Prisma (cliente, migraciones, seed)

```bash
pnpm --filter @apps/api prisma:generate
pnpm --filter @apps/api prisma:migrate -- --name init
pnpm --filter @apps/api prisma:seed
```

### 6) Levantar proyecto

```bash
pnpm dev
```

Credenciales demo:

- Email: `admin@tennisstar.com`
- Password: `admin123`

## Requerido y cumplido

### 1) Login básico funcional

- Login con JWT y protección de rutas.
- Sin manejo de roles (según pedido).

### 2) CRUD Categorías (crear, editar, listar, eliminar)

- CRUD completo en frontend + backend.
- Tabla reusable + modal reusable + confirmación de borrado.

### 3) CRUD Productos (sin stock ni pasarela)

- CRUD completo en frontend + backend.
- Sin sistema de stock.
- Sin integración de pagos.

### 4) Ventas conectadas a base de datos

- Listado real de ventas desde DB.
- Botón `Generar Venta` que crea ventas reales.
- Persistencia de `Sale`, `SaleItem` y `SaleHistory`.

### 5) Estructura reusable del panel

- Componentes compartidos para tabla, búsqueda, diálogos, formularios y estados.
- Organización modular por dominio en backend.

## Extras implementados

Además de lo mínimo solicitado, se implementó:

1. Dashboard con datos reales de inventario.
2. Dashboard con `Productos Más Vendidos` reales, calculados desde `SaleItem` (excluyendo ventas canceladas).
3. Generación de venta reforzada: no permite crear venta sin productos válidos.
4. Modal de gestión de orden con detalle completo:
   estado, cliente, pago, envío, productos, historial y acción de completar pedido.
5. Validaciones de categorías mejoradas:
   nombre único case-insensitive, normalización de espacios y mensajes claros de error.
6. Confirmaciones y errores de acciones destructivas visibles en UI (por ejemplo al eliminar categorías con relaciones).


## Vistas implementadas

Vistas funcionales principales:

- Login
- Inicio (dashboard)
- Categorías
- Productos
- Ventas

Rutas adicionales del menú están preparadas en modo placeholder (`Próximamente`) para extender el panel sin romper navegación.

## Componentes reutilizables principales

- `AppLayout`
- `DataTable`
- `SearchInput`
- `StatusBadge`
- `CrudDialog`
- `ConfirmDialog`
- `EntityForm`
- `LoadingState`
- `SectionCard`
- `PageHeader`

## Arquitectura (resumen)

- Monorepo con `pnpm workspaces`.
- API modular por dominio: `auth`, `categories`, `products`, `sales`, `dashboard`, `users`.
- Prisma centralizado mediante `PrismaService`.
- DTOs + `class-validator` en backend.
- App Router + React Query en frontend.
- Formularios con `react-hook-form` + `zod`.

## Scripts útiles

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm db:logs
pnpm db:down
pnpm docker:full:up
pnpm docker:full:down
pnpm docker:full:logs
```
