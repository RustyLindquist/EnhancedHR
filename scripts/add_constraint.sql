
-- Add Unique Constraint to user_collections
ALTER TABLE user_collections
ADD CONSTRAINT user_collections_user_id_label_key UNIQUE (user_id, label);
