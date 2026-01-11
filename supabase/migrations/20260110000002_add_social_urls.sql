-- Add social URL fields to profiles for expert pages
-- twitter_url: X (formerly Twitter) profile URL
-- website_url: Personal/company website URL

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN profiles.twitter_url IS 'X (formerly Twitter) profile URL';
COMMENT ON COLUMN profiles.website_url IS 'Personal or company website URL';
