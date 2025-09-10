-- Create 'images' bucket only if missing and make it public when created.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'images') THEN
    -- create_bucket supports the 'public' named param in most Supabase installs
    PERFORM storage.create_bucket('images', public := true);
  END IF;
END
$$ LANGUAGE plpgsql;

-- (If your Supabase instance does not support CREATE via RPC, create the bucket in the dashboard)

-- Policies for the 'images' bucket (public read, admin write/update/delete)
-- Public read for objects in 'images'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.polname = 'Public read for images' AND p.schemaname = 'storage' AND p.tablename = 'objects'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Public read for images"
        ON storage.objects FOR SELECT
        TO public
        USING ( bucket_id = 'images' );
    $$;
  END IF;
END
$$ LANGUAGE plpgsql;

-- Allow write only to admins (assuming public.users.is_admin boolean)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.polname = 'Admins can write images' AND p.schemaname = 'storage' AND p.tablename = 'objects'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Admins can write images"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = 'images' AND
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.is_admin = true
          )
        );
    $$;
  END IF;
END
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.polname = 'Admins can update images' AND p.schemaname = 'storage' AND p.tablename = 'objects'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Admins can update images"
        ON storage.objects FOR UPDATE TO authenticated
        USING (
          bucket_id = 'images' AND
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.is_admin = true
          )
        )
        WITH CHECK (
          bucket_id = 'images' AND
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.is_admin = true
          )
        );
    $$;
  END IF;
END
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.polname = 'Admins can delete images' AND p.schemaname = 'storage' AND p.tablename = 'objects'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Admins can delete images"
        ON storage.objects FOR DELETE TO authenticated
        USING (
          bucket_id = 'images' AND
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.is_admin = true
          )
        );
    $$;
  END IF;
END
$$ LANGUAGE plpgsql;
