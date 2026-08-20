-- =============================================================
-- KNOTEN - Migration 004: Profile Theme
-- Adds visual theme customization to freelancer_profiles
-- =============================================================

ALTER TABLE public.freelancer_profiles
  ADD COLUMN IF NOT EXISTS profile_theme JSONB DEFAULT '{}';

COMMENT ON COLUMN public.freelancer_profiles.profile_theme IS
  'JSON object storing all visual theme settings for the freelancer profile. '
  'Edited only when the user saves the theme editor — no frequent writes.';
