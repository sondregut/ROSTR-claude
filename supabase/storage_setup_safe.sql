-- Storage Setup for RostrDating (Safe to run multiple times)
-- Execute this in Supabase SQL Editor after creating storage buckets

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload date entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view date entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their date entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their date entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat media in their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;
DROP POLICY IF EXISTS "Circle admins can upload circle photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view circle photos" ON storage.objects;
DROP POLICY IF EXISTS "Circle admins can update circle photos" ON storage.objects;
DROP POLICY IF EXISTS "Circle admins can delete circle photos" ON storage.objects;

-- Storage policies for user-photos bucket
CREATE POLICY "Users can upload their own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-photos' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

CREATE POLICY "Anyone can view user photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-photos');

CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for date-entry-images bucket
CREATE POLICY "Users can upload date entry images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'date-entry-images' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );

CREATE POLICY "Users can view date entry images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'date-entry-images' AND
    (
      -- Image is public (can be determined by checking if date entry is public)
      EXISTS (
        SELECT 1 FROM public.date_entries de
        WHERE de.image_uri LIKE '%' || name || '%'
        AND de.is_private = false
      ) OR
      -- User owns the image
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- User is in a circle that has access to the date entry
      EXISTS (
        SELECT 1 FROM public.date_entries de
        JOIN public.circle_members cm ON cm.user_id = auth.uid()
        WHERE de.image_uri LIKE '%' || name || '%'
        AND cm.circle_id = ANY(de.shared_circles)
      )
    )
  );

CREATE POLICY "Users can update their date entry images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'date-entry-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their date entry images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'date-entry-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for chat-media bucket
CREATE POLICY "Users can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov')
  );

CREATE POLICY "Users can view chat media in their conversations" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-media' AND
    (
      -- User owns the media file
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- User is participant in conversation where media was shared
      EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON c.id = m.conversation_id
        WHERE m.media_url LIKE '%' || name || '%'
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete their own chat media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for circle-photos bucket
CREATE POLICY "Circle admins can upload circle photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'circle-photos' AND
    (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif') AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id::text = (storage.foldername(name))[1]
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Anyone can view circle photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'circle-photos');

CREATE POLICY "Circle admins can update circle photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'circle-photos' AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id::text = (storage.foldername(name))[1]
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Circle admins can delete circle photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'circle-photos' AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id::text = (storage.foldername(name))[1]
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Note: The functions from the original storage_setup.sql are not included here
-- as they may need separate handling for updates