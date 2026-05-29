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

## 2. Crear usuario

Puedes crear el primer usuario desde la propia app con **Crear primera cuenta**.

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

1. crea o inicia sesión con un usuario,
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
