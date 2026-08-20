-- =============================================================
-- KNOTEN - Migration 005: Setup logos storage bucket and RLS policies
-- Configures storage bucket for office SVG/image logos
-- =============================================================

-- 1. Create or update storage bucket 'logos'
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'logos',
  'logos',
  true,
  ARRAY['image/svg+xml', 'image/svg', 'text/xml', 'image/png', 'image/jpeg', 'image/webp']::text[],
  5242880
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- 2. Storage RLS Policies for logos bucket
DO $$
BEGIN
  -- Public read access to logos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'logos_public_read'
  ) THEN
    CREATE POLICY "logos_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'logos');
  END IF;

  -- Authenticated insert access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'logos_authenticated_insert'
  ) THEN
    CREATE POLICY "logos_authenticated_insert" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;

  -- Authenticated update access (CRITICAL for upsert: true)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'logos_authenticated_update'
  ) THEN
    CREATE POLICY "logos_authenticated_update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated')
      WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;

  -- Authenticated delete access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'logos_authenticated_delete'
  ) THEN
    CREATE POLICY "logos_authenticated_delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;
END $$;
