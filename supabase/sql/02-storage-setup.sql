-- Storage Setup for ChorOS
-- Creates buckets for file uploads

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('sheet-music-files', 'sheet-music-files', false, 52428800, ARRAY['application/pdf', 'application/xml', 'text/xml']),
    ('audio-files', 'audio-files', false, 104857600, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('choir-logos', 'choir-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sheet-music-files bucket
CREATE POLICY "Authenticated users can view sheet music"
ON storage.objects FOR SELECT
USING (bucket_id = 'sheet-music-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload sheet music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sheet-music-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sheet-music-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'sheet-music-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for audio-files bucket
CREATE POLICY "Authenticated users can view audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own audio uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket (public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for choir-logos bucket (public)
CREATE POLICY "Anyone can view choir logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'choir-logos');

CREATE POLICY "Authenticated users can upload choir logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'choir-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update choir logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'choir-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete choir logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'choir-logos' AND auth.role() = 'authenticated');