-- Fix NULL tokens AND string fields in auth.users causing GoTrue 500 Errors
-- The GoTrue service (v2.183.0) throws "converting NULL to string is unsupported" for multiple columns.

UPDATE auth.users 
SET confirmation_token = '' 
WHERE confirmation_token IS NULL;

UPDATE auth.users 
SET recovery_token = '' 
WHERE recovery_token IS NULL;

UPDATE auth.users 
SET email_change_token_new = '' 
WHERE email_change_token_new IS NULL;

UPDATE auth.users 
SET email_change_token_current = '' 
WHERE email_change_token_current IS NULL;

UPDATE auth.users 
SET email_change = '' 
WHERE email_change IS NULL;

-- Force a refresh just in case
NOTIFY pgrst, 'reload config';
