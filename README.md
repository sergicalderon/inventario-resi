# Inventario Resi

Aplicación web para control de inventario sanitario en residencia.

## Stack

- React + Vite
- TypeScript
- Supabase PostgreSQL + Auth
- Vercel

## Desarrollo local

```bash
npm install
npm run dev
```

Crea un archivo `.env.local` con:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Base de datos

Los scripts de Supabase están en `supabase/` y deben ejecutarse en este orden:

1. `01_tables.sql`
2. `02_functions.sql`
3. `03_security_policies.sql`
4. `04_api_grants.sql`
