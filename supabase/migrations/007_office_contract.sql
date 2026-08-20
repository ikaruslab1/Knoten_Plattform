-- =============================================================
-- Migration 007: Add contrato_contenido to offices table
-- =============================================================

-- Add contrato_contenido column to offices table to store the single office contract
ALTER TABLE public.offices
ADD COLUMN IF NOT EXISTS contrato_contenido TEXT;
