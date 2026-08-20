# Knoten

Plataforma web de contratación por proyectos y gestión de equipos transdisciplinarios de diseño gráfico.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Base de datos y Auth:** Supabase (PostgreSQL + Row Level Security)
- **Emails:** Resend + React Email
- **Editor de contratos:** Tiptap
- **Despliegue:** Vercel

---

## Configuración inicial

### 1. Variables de entorno

Copia `.env.local` y llena las variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Solo en servidor, nunca NEXT_PUBLIC_
RESEND_API_KEY=re_your_api_key
NEXT_PUBLIC_APP_URL=https://knoten.vercel.app
```

### 2. Base de datos Supabase

En el **SQL Editor** de tu proyecto Supabase, ejecuta el archivo completo:

```
supabase/migrations/001_initial_schema.sql
```

Esto crea:
- Todas las tablas (profiles, offices, freelancer_profiles, work_history, certifications, vacantes, postulaciones)
- Políticas de Row Level Security en todas las tablas
- Trigger para crear el perfil automáticamente al registrarse
- Funciones `accept_freelancer` y `reject_freelancer` (estado inmutable)

### 3. Storage bucket para logos (SVG)

En Supabase → **Storage**, crea un bucket público llamado `logos`.

Luego ejecuta en el SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "logos_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "logos_owner_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Configurar Resend

1. Crea una cuenta en [resend.com](https://resend.com)
2. Verifica tu dominio (o usa `onboarding@resend.dev` para pruebas)
3. Copia la API key a `.env.local`
4. Actualiza el campo `from` en las rutas de email (`app/api/email/`) con tu dominio

### 5. Configurar Auth en Supabase

En Supabase → **Authentication → URL Configuration**:
- Site URL: `https://knoten.vercel.app` (o `http://localhost:3000` para dev)
- Redirect URLs: agrega `https://knoten.vercel.app/confirm`

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Despliegue en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Agrega todas las variables de entorno en Settings → Environment Variables
3. Actualiza `NEXT_PUBLIC_APP_URL` con tu URL de producción
4. Deploy automático en cada push a `main`

---

## Arquitectura

```
app/
  (auth)/          → Login, registro, confirmación de email
  (onboarding)/    → Selección de rol (permanente)
  (dashboard)/     → Rutas protegidas por rol
    freelancer/    → Perfil, vacantes, postulaciones
    director/      → Oficina, vacantes, contratos, postulaciones
  api/email/       → Route Handlers para envío de emails
components/
  auth/            → Formularios de login y registro
  freelancer/      → Formulario de perfil (con localStorage), vista publicada
  director/        → Formulario de oficina, vacantes, editor de contrato
  postulaciones/   → Formulario de postulación, panel del director
  emails/          → Templates de React Email
  ui/              → MultiSelect, RichTextEditor
  shared/          → DashboardNav
lib/
  supabase/        → Clientes browser y server
  constants/       → Especialidades, software, roles
  validations/     → Esquemas Zod
middleware.ts      → Protección de rutas por sesión y rol
supabase/migrations/  → Schema SQL completo
```

## Flujos de negocio

| Acción | Estado resultante |
|--------|-------------------|
| Freelancer se registra | `estado: disponible` |
| Director acepta freelancer | `estado: aceptado`, `oficina_id` asignado |
| Freelancer aceptado | No puede postularse a otras vacantes |
| Estado aceptado | **Inmutable** — solo vía función SQL `accept_freelancer()` |
