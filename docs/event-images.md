# Event cover images — DB, Storage and UI

This document explains the database change, Supabase Storage setup, and how to use the new admin UI to add a cover image to events.

## 1) Database migration (events.image_url)

Add a nullable `image_url` column to `public.events` to store the public URL of the image in Supabase Storage.

Run this in the Supabase SQL editor (or your migrations flow):

```sql
alter table public.events
  add column if not exists image_url text null;
```

Notes:
- No backfill needed. Existing events will have `image_url = null`.
- API and UI already tolerate `null`.

## 2) Supabase Storage bucket

Create a bucket named `event-images` to store the files.

- In Storage → Create bucket → Name: `event-images` → Public bucket: enabled
- Optional: Define simple folder structure, e.g. `covers/<eventId>/<uuid>.<ext>` (this is what the code uses)

If you prefer to keep the bucket private, you can leave it private and rely on signed URLs. The current implementation uses public URLs for simplicity and performance with `next/image`.

### Storage RLS policies (recommended even for public buckets)

```sql
-- Allow public read for just this bucket
create policy if not exists "Public read for event-images"
  on storage.objects for select
  using (bucket_id = 'event-images');

-- Allow admins to write (insert/update/delete) in this bucket
create policy if not exists "Admins write event-images"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'event-images'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_admin = true
    )
  )
  with check (
    bucket_id = 'event-images'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_admin = true
    )
  );
```

If your bucket is set to public, the `select` policy is not strictly necessary, but keeping it helps when you change bucket visibility later.

## 3) App configuration

- `next.config.js` already allows Supabase Storage images via `images.remotePatterns` for `https://**.supabase.co/storage/v1/object/public/**`.
- CSP (middleware) already allows your Supabase host for `img-src` based on `NEXT_PUBLIC_SUPABASE_URL`.

Ensure these env vars are set in your `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4) UI and workflow

- Admin → Dashboard → Events → Create or Edit.
- In the modal form, there is now an "Imatge de portada" section.
  - On create: you can select an image; it will preview immediately. After the event is created, the image is uploaded and the event is updated with the resulting `image_url`.
  - On edit: selecting an image uploads it right away and sets `image_url`.
  - "Treure imatge" clears `image_url` on save (the storage object is not deleted yet; see below).

Constraints enforced client-side:
- Max 5MB
- Allowed types: JPEG, PNG, WEBP

## 5) API behavior

- POST /api/admin/events — accepts optional `image_url` (string | null).
- PUT /api/admin/events/[id] — supports partial updates.
  - Only fields present in request body are changed.
  - `image_url` can be set to a URL or explicitly to `null` to remove the image.

## 6) Known follow-ups

- When removing/changing an image, consider deleting the old file in Storage to avoid orphans.
- Optionally generate responsive variants or use `supabase/storage-transformations` for resizing.
- Add e2e test to validate the upload flow and visibility in Event cards.
