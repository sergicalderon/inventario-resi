# Puesta en marcha con Supabase

## 1. Crear las tablas

Entra en tu proyecto de Supabase y abre **SQL Editor**.

Copia y ejecuta estos archivos, en este orden:

```txt
supabase/01_tables.sql
supabase/02_functions.sql
supabase/03_security_policies.sql
supabase/04_api_grants.sql
```

Esto crea:

- tablas de residencia, usuarios, productos, lotes, movimientos, proveedores y etiquetas,
- seguridad RLS,
- políticas para que solo usuarios autenticados de la residencia vean los datos,
- función para crear la primera residencia,
- función transaccional para registrar movimientos y actualizar stock.

## 2. Crear usuarios privados

Esta app está pensada para uso privado. No dejes el registro público abierto.

En Supabase:

1. Ve a **Authentication** -> **Sign In / Providers** -> **Email**.
2. Desactiva la opción para permitir nuevas altas de usuarios.
3. Crea o invita usuarios manualmente desde **Authentication** -> **Users**.

Si Supabase tiene confirmación de email activada, revisa el correo antes de iniciar sesión.

## 3. Variables locales

El archivo `.env.local` ya contiene:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Para despliegue en Vercel o Netlify, añade esas mismas variables en el panel del proyecto.

## 4. Probar local

```bash
npm run dev
```

Al entrar:

1. inicia sesión con un usuario creado o invitado en Supabase,
2. crea la residencia,
3. empieza a añadir proveedores, productos, lotes y movimientos.

## 5. Despliegue

Configuración:

```txt
Build command: npm run build
Output directory: dist
```

Variables necesarias:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
