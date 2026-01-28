-- Create storage bucket for course featured images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-images',
    'course-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for course-images bucket
-- Note: Uploads are done via admin client (service role), so we only need public read access

-- Anyone can view course images (public bucket)
CREATE POLICY "Public can read course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

-- Service role can do everything (handled by default)
-- The uploadCourseImageAction uses createAdminClient() which bypasses RLS
