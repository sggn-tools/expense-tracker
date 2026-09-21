# Personal Expense Tracker

Aplicación para automatizar el registro de gastos mediante la lectura de correos de notificaciones bancarias (Banco Agrícola, Tarjeta Simán).

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Base de datos:** MySQL 8 + Prisma ORM
- **Auth:** NextAuth.js v5 con JWT + HttpOnly Cookies
- **UI:** Tailwind CSS + shadcn/ui
- **Email:** imapflow
- **Infra:** Docker + Docker Compose

---

## Inicio rápido

### 1. Clonar y configurar variables de entorno

```bash
git clone <repo>
cd expense-tracker
cp .env.example .env.local
# Editar .env.local con tus valores
```

### 2. Levantar MySQL con Docker

```bash
# Solo la base de datos
docker compose up -d

# Con Adminer (GUI MySQL en :8080)
docker compose --profile tools up -d
```

### 3. Instalar dependencias y migrar

```bash
npm install
npm run db:migrate
npm run db:seed   # carga usuario demo + datos de prueba
```

### 4. Correr la aplicación localmente

```bash
npm run dev
# → http://localhost:3000
```

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Next.js dev server con Turbopack |
| `npm run build` | Build de producción |
| `npm run db:migrate` | Crear/aplicar migraciones |
| `npm run db:studio` | Abrir Prisma Studio (GUI) |
| `npm run db:seed` | Cargar datos de prueba |
| `npm run db:reset` | Resetear BD y volver a migrar |
| `npm run typecheck` | Verificar tipos TypeScript |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── login/               ← Página de login
│   ├── dashboard/           ← Área autenticada
│   │   ├── layout.tsx       ← Header con logout + Footer
│   │   └── page.tsx         ← Dashboard principal
│   └── api/
│       ├── auth/[...nextauth]/  ← NextAuth handlers
│       └── ingest/          ← Email ingestion endpoint
├── components/
│   ├── auth/                ← LoginForm
│   └── dashboard/           ← KPIs, FilterBar, TransactionTable
├── lib/
│   ├── auth.ts              ← NextAuth config (JWT + HttpOnly cookies)
│   └── prisma.ts            ← Prisma client singleton
├── schemas/
│   ├── auth.ts              ← Zod: login, register
│   └── transaction.ts       ← Zod: transactions, filters
├── services/
│   ├── email/               ← IMAP connection + ingestion
│   └── parsers/             ← BankEmailParser + implementaciones
└── middleware.ts             ← Auth guard + route protection
prisma/
├── schema.prisma            ← Modelos: User, Card, Transaction
└── seed.ts                  ← Datos de prueba
docker/
├── Dockerfile.dev
└── mysql-init.sql
```

---

## Seguridad

- **HttpOnly Cookies:** Los tokens JWT nunca son accesibles desde JavaScript del cliente.
- **Server-Side Session:** Toda validación de sesión ocurre en el servidor (`auth()` en Server Components).
- **Middleware de protección:** Rutas bajo `/dashboard/*` requieren sesión válida.
- **Zod en todo:** Toda entrada externa se valida antes de tocar la base de datos.
- **bcrypt:** Las contraseñas se hashean con factor 12 antes de guardarlas.
- **Deduplicación:** El campo `emailMessageId` es `@unique` en Prisma — imposible registrar la misma transacción dos veces.

---

## Fases de desarrollo

- [x] **Fase 1** — Docker, DB Schema, Auth, Estructura base
- [ ] **Fase 2** — Email Parser (Strategy Pattern) para Banco Agrícola y Simán
- [ ] **Fase 3** — Dashboard con KPIs, filtros y tabla de transacciones
- [ ] **Fase 4** — Cron job / sincronización automática
- [ ] **Fase 5** — QA, hardening, tests
