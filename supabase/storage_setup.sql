-- Storage Setup for RostrDating
-- Execute this in Supabase SQL Editor after creating storage buckets in dashboard

-- Storage buckets to create in Supabase Dashboard:
-- 1. user-photos (public: true, file size limit: 5MB)
-- 2. date-entry-images (public: true, file size limit: 10MB)
-- 3. chat-media (public: false, file size limit: 20MB)

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
      -- User is in a circle that the date entry is shared with
      EXISTS (
        SELECT 1 FROM public.date_entries de
        JOIN public.circle_members cm ON cm.circle_id = ANY(de.shared_circles)
        WHERE de.image_uri LIKE '%' || name || '%'
        AND cm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own date entry images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'date-entry-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own date entry images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'date-entry-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for chat-media bucket (private)
CREATE POLICY "Users can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'avi')
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

-- Function to generate unique filename
CREATE OR REPLACE FUNCTION generate_unique_filename(user_id UUID, original_name TEXT, bucket_type TEXT)
RETURNS TEXT AS $$
DECLARE
  extension TEXT;
  timestamp_str TEXT;
  random_str TEXT;
BEGIN
  -- Extract file extension
  extension := lower(split_part(original_name, '.', array_length(string_to_array(original_name, '.'), 1)));
  
  -- Generate timestamp
  timestamp_str := to_char(NOW(), 'YYYYMMDDHH24MISS');
  
  -- Generate random string
  random_str := substr(md5(random()::text || user_id::text), 1, 8);
  
  -- Return formatted filename
  RETURN user_id::text || '/' || bucket_type || '_' || timestamp_str || '_' || random_str || '.' || extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned storage files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
  orphaned_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- This function should be run periodically to clean up files
  -- that are no longer referenced by any database records
  
  -- Clean up user photos not referenced in user_photos table
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'user-photos'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.user_photos 
      WHERE photo_url LIKE '%' || file_record.name || '%'
    ) AND NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE image_uri LIKE '%' || file_record.name || '%'
    ) THEN
      DELETE FROM storage.objects WHERE name = file_record.name AND bucket_id = 'user-photos';
      orphaned_count := orphaned_count + 1;
    END IF;
  END LOOP;
  
  -- Clean up date entry images not referenced in date_entries table
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'date-entry-images'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.date_entries 
      WHERE image_uri LIKE '%' || file_record.name || '%'
    ) THEN
      DELETE FROM storage.objects WHERE name = file_record.name AND bucket_id = 'date-entry-images';
      orphaned_count := orphaned_count + 1;
    END IF;
  END LOOP;
  
  -- Clean up chat media not referenced in messages table
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'chat-media'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.messages 
      WHERE media_url LIKE '%' || file_record.name || '%'
    ) THEN
      DELETE FROM storage.objects WHERE name = file_record.name AND bucket_id = 'chat-media';
      orphaned_count := orphaned_count + 1;
    END IF;
  END LOOP;
  
  -- Clean up circle photos not referenced in circles table
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'circle-photos'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.circles 
      WHERE group_photo_url LIKE '%' || file_record.name || '%'
    ) THEN
      DELETE FROM storage.objects WHERE name = file_record.name AND bucket_id = 'circle-photos';
      orphaned_count := orphaned_count + 1;
    END IF;
  END LOOP;
  
  RETURN orphaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signed URL for private files
CREATE OR REPLACE FUNCTION get_signed_url(bucket_name TEXT, file_path TEXT, expires_in INTEGER DEFAULT 3600)
RETURNS TEXT AS $$
BEGIN
  -- This is a placeholder - actual implementation would use Supabase storage API
  -- In practice, you'd call this from your application code using the Supabase client
  RETURN 'https://your-project.supabase.co/storage/v1/object/sign/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;