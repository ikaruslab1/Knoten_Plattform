-- =============================================================
-- Migration 006: Add teams to offices and team binding to vacantes
-- =============================================================

-- Add equipos JSONB column to offices table to store team capacities:
-- Example: {"Equipo impreso": 3, "Equipo digital": 2, "Equipo de desarrollo de producto": 4}
ALTER TABLE public.offices
ADD COLUMN IF NOT EXISTS equipos JSONB DEFAULT '{}';

-- Add equipo TEXT column to vacantes table to associate each vacancy with a specific team:
-- Example: 'Equipo impreso'
ALTER TABLE public.vacantes
ADD COLUMN IF NOT EXISTS equipo TEXT;

-- Create index on vacantes.equipo for fast grouping and filtering
CREATE INDEX IF NOT EXISTS vacantes_equipo_idx ON public.vacantes(equipo);
