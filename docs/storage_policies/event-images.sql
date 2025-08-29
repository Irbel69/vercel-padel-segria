-- Create bucket (run once in Supabase SQL editor)
-- Note: Buckets are created via storage API or dashboard; this SQL is illustrative if using RPC.
select storage.create_bucket('event-images', public := true);

-- Make bucket public (if it already exists)
select storage.update_bucket('event-images', public := true);

-- Example policies for storage.objects restricted by bucket
-- Public read for objects in 'event-images'
CREATE POLICY "Public read for event-images"
  ON storage.objects FOR SELECT
  TO public
  USING ( bucket_id = 'event-images' );

-- Allow write only to admins (assuming users table with is_admin boolean)
CREATE POLICY "Admins can write event-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

CREATE POLICY "Admins can update event-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  )
  WITH CHECK (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

CREATE POLICY "Admins can delete event-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );
