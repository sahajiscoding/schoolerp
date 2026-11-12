-- 0006_storage_buckets.sql
-- Private Supabase Storage buckets for report parity (spec 2026-11-07, section 5).
-- All buckets are private; reads go through signed URLs after an RLS-authorized row check.
-- Object path convention: <bucket>/<owner_uuid>/<uuid>-<filename>
-- Upload limits: 10 MB per file; MIME allowlist: PDF, JPEG, PNG, DOCX.
--
-- Safe when the `storage` schema is absent (local verifier creates it manually).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- homework-files
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('homework-files','homework-files',false,10485760,
            ARRAY['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

    -- submission-files
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('submission-files','submission-files',false,10485760,
            ARRAY['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

    -- gallery-media
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('gallery-media','gallery-media',false,10485760,
            ARRAY['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

    -- avatars
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('avatars','avatars',false,10485760,
            ARRAY['image/jpeg','image/png'])
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

    -- circular-files
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('circular-files','circular-files',false,10485760,
            ARRAY['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

    -- Enable RLS on storage.objects if not already enabled
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE t.schemaname = 'storage' AND t.tablename = 'objects'
        AND c.relrowsecurity
    ) THEN
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

-- Object insert policy: first path segment must equal auth.uid() (owner-upload only).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    DROP POLICY IF EXISTS storage_owner_insert ON storage.objects;
    CREATE POLICY storage_owner_insert ON storage.objects
      FOR INSERT WITH CHECK (
        auth.uid()::text = (string_to_array(name, '/'))[1]
      );

    -- Object select policy: owner reads own objects.
    DROP POLICY IF EXISTS storage_owner_select ON storage.objects;
    CREATE POLICY storage_owner_select ON storage.objects
      FOR SELECT USING (
        auth.uid()::text = (string_to_array(owner_id, '/'))[1]
        OR auth.uid()::text = (string_to_array(name, '/'))[1]
      );

    -- Object delete policy: owner deletes own objects.
    DROP POLICY IF EXISTS storage_owner_delete ON storage.objects;
    CREATE POLICY storage_owner_delete ON storage.objects
      FOR DELETE USING (
        auth.uid()::text = (string_to_array(name, '/'))[1]
      );
  END IF;
END $$;
