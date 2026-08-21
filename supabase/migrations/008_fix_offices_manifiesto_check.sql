-- =============================================================
-- Migration 008: Update offices_manifiesto_check constraint
-- Increase character limit from 400 to 4000 to support HTML formatted text
-- =============================================================

ALTER TABLE public.offices
DROP CONSTRAINT IF EXISTS offices_manifiesto_check;

ALTER TABLE public.offices
ADD CONSTRAINT offices_manifiesto_check CHECK (manifiesto IS NULL OR char_length(manifiesto) <= 4000);
