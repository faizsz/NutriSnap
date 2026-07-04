-- Storage RLS Policies untuk food-photos bucket
-- Copy paste SQL ini ke Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can upload their own food photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view food photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own food photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own food photos" ON storage.objects;

-- Policy: Allow INSERT to food-photos bucket (more permissive for server-side)
CREATE POLICY "Allow upload to food-photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'food-photos');

-- Policy: Anyone can view food photos (public bucket)
CREATE POLICY "Anyone can view food photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'food-photos');

-- Policy: Allow UPDATE in food-photos bucket
CREATE POLICY "Allow update in food-photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'food-photos');

-- Policy: Allow DELETE in food-photos bucket
CREATE POLICY "Allow delete in food-photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'food-photos');
