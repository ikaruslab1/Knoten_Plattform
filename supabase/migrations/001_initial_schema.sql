-- =============================================================
-- KNOTEN - Initial Database Schema
-- Run this in Supabase SQL Editor
-- =============================================================

-- =============================================================
-- TABLE: profiles
-- Extends Supabase auth.users with application-specific data
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT NOT NULL,
  numero_cuenta TEXT NOT NULL UNIQUE,
  correo_institucional TEXT NOT NULL,
  correo_personal TEXT NOT NULL,
  telefono TEXT NOT NULL,
  rol TEXT CHECK (rol IN ('freelancer', 'director')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS profiles_rol_idx ON public.profiles(rol);

-- =============================================================
-- TABLE: offices
-- Belongs to a director profile (one-to-one)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  logo_url TEXT,
  manifiesto TEXT CHECK (char_length(manifiesto) <= 4000),
  especialidad TEXT CHECK (especialidad IN ('editorial', 'graficos')),
  links_portafolios TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(director_id)
);

CREATE INDEX IF NOT EXISTS offices_director_id_idx ON public.offices(director_id);

-- =============================================================
-- TABLE: freelancer_profiles
-- Extended profile for freelancer users
-- =============================================================
CREATE TABLE IF NOT EXISTS public.freelancer_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  resumen_profesional TEXT,
  especialidades TEXT[] DEFAULT '{}',
  nivel_experiencia TEXT,
  software TEXT[] DEFAULT '{}',
  habilidades_complementarias TEXT,
  enlace_portafolio TEXT,
  ultimo_grado_estudios TEXT,
  idiomas TEXT[] DEFAULT '{}',
  disponibilidad JSONB DEFAULT '{}',
  estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'aceptado')),
  oficina_id UUID REFERENCES public.offices(id),
  publicado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS freelancer_profiles_estado_idx ON public.freelancer_profiles(estado);
CREATE INDEX IF NOT EXISTS freelancer_profiles_publicado_idx ON public.freelancer_profiles(publicado);

-- =============================================================
-- TABLE: work_history
-- Employment history for freelancers
-- =============================================================
CREATE TABLE IF NOT EXISTS public.work_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES public.freelancer_profiles(id) ON DELETE CASCADE,
  rol TEXT NOT NULL,
  empresa TEXT NOT NULL,
  periodo TEXT NOT NULL,
  modalidad TEXT NOT NULL,
  responsabilidades TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS work_history_freelancer_id_idx ON public.work_history(freelancer_id);

-- =============================================================
-- TABLE: certifications
-- Certifications for freelancers
-- =============================================================
CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES public.freelancer_profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  entidad TEXT NOT NULL,
  anio INTEGER CHECK (anio >= 1990 AND anio <= 2100),
  enlace TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS certifications_freelancer_id_idx ON public.certifications(freelancer_id);

-- =============================================================
-- TABLE: vacantes
-- Job openings created by directors
-- =============================================================
CREATE TABLE IF NOT EXISTS public.vacantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  num_lugares INTEGER NOT NULL CHECK (num_lugares BETWEEN 1 AND 7),
  roles_buscados TEXT[] DEFAULT '{}',
  nivel_requerido TEXT,
  habilidades TEXT[] DEFAULT '{}',
  responsabilidades TEXT,
  modalidad TEXT NOT NULL CHECK (modalidad IN ('en_linea', 'presencial', 'hibrido')),
  horas_semanales INTEGER CHECK (horas_semanales > 0 AND horas_semanales <= 60),
  duracion_semanas INTEGER CHECK (duracion_semanas >= 1 AND duracion_semanas <= 7),
  solicitar_portafolio BOOLEAN DEFAULT FALSE,
  solicitar_extracto BOOLEAN DEFAULT FALSE,
  confirmar_calendario BOOLEAN DEFAULT FALSE,
  preguntas_reclutamiento TEXT[] DEFAULT '{}',
  contrato_contenido TEXT,
  publicada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS vacantes_office_id_idx ON public.vacantes(office_id);
CREATE INDEX IF NOT EXISTS vacantes_publicada_idx ON public.vacantes(publicada);

-- =============================================================
-- TABLE: postulaciones
-- Job applications from freelancers
-- =============================================================
CREATE TABLE IF NOT EXISTS public.postulaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES public.freelancer_profiles(id),
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id),
  portafolio_url TEXT,
  extracto_experiencia TEXT,
  calendario JSONB,
  respuestas_preguntas JSONB DEFAULT '[]',
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(freelancer_id, vacante_id)
);

CREATE INDEX IF NOT EXISTS postulaciones_freelancer_id_idx ON public.postulaciones(freelancer_id);
CREATE INDEX IF NOT EXISTS postulaciones_vacante_id_idx ON public.postulaciones(vacante_id);
CREATE INDEX IF NOT EXISTS postulaciones_estado_idx ON public.postulaciones(estado);

-- =============================================================
-- FUNCTION: Auto-update updated_at timestamps
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER freelancer_profiles_updated_at
  BEFORE UPDATE ON public.freelancer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER vacantes_updated_at
  BEFORE UPDATE ON public.vacantes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER postulaciones_updated_at
  BEFORE UPDATE ON public.postulaciones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================
-- FUNCTION: accept_freelancer (IMMUTABLE state change)
-- Only this function can set freelancer estado to 'aceptado'
-- Called via supabase.rpc('accept_freelancer', {...})
-- =============================================================
CREATE OR REPLACE FUNCTION public.accept_freelancer(
  p_postulacion_id UUID,
  p_director_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_postulacion public.postulaciones%ROWTYPE;
  v_vacante public.vacantes%ROWTYPE;
  v_office public.offices%ROWTYPE;
  v_freelancer public.freelancer_profiles%ROWTYPE;
BEGIN
  -- Get postulacion
  SELECT * INTO v_postulacion FROM public.postulaciones WHERE id = p_postulacion_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Postulación no encontrada');
  END IF;

  -- Verify postulacion is still pending
  IF v_postulacion.estado != 'pendiente' THEN
    RETURN json_build_object('success', false, 'error', 'La postulación ya fue procesada');
  END IF;

  -- Get vacante and verify director owns it
  SELECT v.* INTO v_vacante FROM public.vacantes v WHERE v.id = v_postulacion.vacante_id;
  SELECT o.* INTO v_office FROM public.offices o
    WHERE o.id = v_vacante.office_id AND o.director_id = p_director_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Sin permisos para esta vacante');
  END IF;

  -- Check freelancer is still available
  SELECT * INTO v_freelancer FROM public.freelancer_profiles
    WHERE id = v_postulacion.freelancer_id;
  IF v_freelancer.estado = 'aceptado' THEN
    RETURN json_build_object('success', false, 'error', 'El freelancer ya pertenece a una oficina');
  END IF;

  -- ACCEPT: Update postulacion estado
  UPDATE public.postulaciones SET estado = 'aceptado', updated_at = NOW()
    WHERE id = p_postulacion_id;

  -- IMMUTABLE: Set freelancer estado to aceptado
  UPDATE public.freelancer_profiles
    SET estado = 'aceptado', oficina_id = v_office.id, updated_at = NOW()
    WHERE id = v_postulacion.freelancer_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- FUNCTION: reject_freelancer
-- =============================================================
CREATE OR REPLACE FUNCTION public.reject_freelancer(
  p_postulacion_id UUID,
  p_director_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_postulacion public.postulaciones%ROWTYPE;
  v_vacante public.vacantes%ROWTYPE;
BEGIN
  SELECT * INTO v_postulacion FROM public.postulaciones WHERE id = p_postulacion_id;
  IF NOT FOUND OR v_postulacion.estado != 'pendiente' THEN
    RETURN json_build_object('success', false, 'error', 'Postulación no válida o ya procesada');
  END IF;

  SELECT v.* INTO v_vacante FROM public.vacantes v WHERE v.id = v_postulacion.vacante_id;
  IF NOT EXISTS (
    SELECT 1 FROM public.offices o
    WHERE o.id = v_vacante.office_id AND o.director_id = p_director_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Sin permisos');
  END IF;

  UPDATE public.postulaciones SET estado = 'rechazado', updated_at = NOW()
    WHERE id = p_postulacion_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- TRIGGER: Create profile row on user signup
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, nombre, apellido_paterno, apellido_materno,
    numero_cuenta, correo_institucional, correo_personal, telefono
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido_paterno', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido_materno', ''),
    COALESCE(NEW.raw_user_meta_data->>'numero_cuenta', ''),
    COALESCE(NEW.raw_user_meta_data->>'correo_institucional', ''),
    COALESCE(NEW.raw_user_meta_data->>'correo_personal', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefono', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postulaciones ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- OFFICES policies
CREATE POLICY "offices_select_all" ON public.offices
  FOR SELECT USING (true);

CREATE POLICY "offices_insert_own" ON public.offices
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = director_id);

CREATE POLICY "offices_update_own" ON public.offices
  FOR UPDATE USING ((SELECT auth.uid()) = director_id)
  WITH CHECK ((SELECT auth.uid()) = director_id);

-- FREELANCER PROFILES policies
CREATE POLICY "freelancer_select_published_or_own" ON public.freelancer_profiles
  FOR SELECT USING (publicado = true OR (SELECT auth.uid()) = id);

CREATE POLICY "freelancer_insert_own" ON public.freelancer_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- Allows updating own profile, but estado column is only changed via accept_freelancer RPC
CREATE POLICY "freelancer_update_own" ON public.freelancer_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- WORK HISTORY policies
CREATE POLICY "work_history_select" ON public.work_history
  FOR SELECT USING (
    (SELECT auth.uid()) = freelancer_id
    OR EXISTS (
      SELECT 1 FROM public.freelancer_profiles fp
      WHERE fp.id = freelancer_id AND fp.publicado = true
    )
  );

CREATE POLICY "work_history_insert_own" ON public.work_history
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = freelancer_id);

CREATE POLICY "work_history_update_own" ON public.work_history
  FOR UPDATE USING ((SELECT auth.uid()) = freelancer_id);

CREATE POLICY "work_history_delete_own" ON public.work_history
  FOR DELETE USING ((SELECT auth.uid()) = freelancer_id);

-- CERTIFICATIONS policies
CREATE POLICY "certifications_select" ON public.certifications
  FOR SELECT USING (
    (SELECT auth.uid()) = freelancer_id
    OR EXISTS (
      SELECT 1 FROM public.freelancer_profiles fp
      WHERE fp.id = freelancer_id AND fp.publicado = true
    )
  );

CREATE POLICY "certifications_insert_own" ON public.certifications
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = freelancer_id);

CREATE POLICY "certifications_update_own" ON public.certifications
  FOR UPDATE USING ((SELECT auth.uid()) = freelancer_id);

CREATE POLICY "certifications_delete_own" ON public.certifications
  FOR DELETE USING ((SELECT auth.uid()) = freelancer_id);

-- VACANTES policies
CREATE POLICY "vacantes_select_published_or_own" ON public.vacantes
  FOR SELECT USING (
    publicada = true
    OR EXISTS (
      SELECT 1 FROM public.offices o
      WHERE o.id = office_id AND o.director_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "vacantes_insert_own" ON public.vacantes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.offices o
      WHERE o.id = office_id AND o.director_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "vacantes_update_own" ON public.vacantes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.offices o
      WHERE o.id = office_id AND o.director_id = (SELECT auth.uid())
    )
  );

-- POSTULACIONES policies
CREATE POLICY "postulaciones_select_own" ON public.postulaciones
  FOR SELECT USING (
    (SELECT auth.uid()) = freelancer_id
    OR EXISTS (
      SELECT 1 FROM public.vacantes v
      JOIN public.offices o ON o.id = v.office_id
      WHERE v.id = vacante_id AND o.director_id = (SELECT auth.uid())
    )
  );

-- Only freelancers who are NOT already accepted can apply
CREATE POLICY "postulaciones_insert_own" ON public.postulaciones
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = freelancer_id
    AND NOT EXISTS (
      SELECT 1 FROM public.freelancer_profiles fp
      WHERE fp.id = (SELECT auth.uid()) AND fp.estado = 'aceptado'
    )
  );

-- =============================================================
-- STORAGE BUCKET for office logos (run manually in Supabase Dashboard)
-- =============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
--   ON CONFLICT DO NOTHING;
-- CREATE POLICY "logos_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'logos');
-- CREATE POLICY "logos_authenticated_upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
