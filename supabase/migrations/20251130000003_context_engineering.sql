-- 1. Create context_embeddings table
CREATE TABLE IF NOT EXISTS public.context_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    item_type text NOT NULL, -- 'COURSE', 'LESSON', 'RESOURCE', 'CONVERSATION', etc.
    item_id text NOT NULL,
    content text NOT NULL,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for vector search (IVFFlat for performance, adjust lists based on data size)
-- Note: IVFFlat requires some data to be effective, but we create it now.
-- IF NOT EXISTS is not supported for CREATE INDEX ON ... USING, so we wrap in DO block or just let it fail if exists (but better to be safe)
-- For simplicity in this migration, we'll skip the index creation here or use a safe approach.
-- Supabase/Postgres usually handles index creation fine.
CREATE INDEX IF NOT EXISTS context_embeddings_embedding_idx ON public.context_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);


-- 2. Modify collection_items to be polymorphic
-- First, add the new columns
ALTER TABLE public.collection_items
ADD COLUMN IF NOT EXISTS item_type text,
ADD COLUMN IF NOT EXISTS item_id text;

-- Migrate existing data (assuming all current items are courses)
UPDATE public.collection_items
SET item_type = 'COURSE', item_id = course_id::text
WHERE item_type IS NULL;

-- Make new columns not null
ALTER TABLE public.collection_items
ALTER COLUMN item_type SET NOT NULL,
ALTER COLUMN item_id SET NOT NULL;

-- Drop old PK and add new one
ALTER TABLE public.collection_items
DROP CONSTRAINT IF EXISTS collection_items_pkey;

ALTER TABLE public.collection_items
ADD CONSTRAINT collection_items_pkey PRIMARY KEY (collection_id, item_type, item_id);

-- Make course_id nullable (for backward compatibility, we keep it but it's not the PK anymore)
ALTER TABLE public.collection_items
ALTER COLUMN course_id DROP NOT NULL;


-- 3. Seed System Prompts
INSERT INTO public.ai_system_prompts (agent_type, system_instruction)
VALUES
('course_assistant', 'You are the Course Assistant. Your goal is to answer questions specifically about the course content. Use the provided Course Context (Lessons, Resources) to answer. If the answer is not in the course, state that clearly.'),
('course_tutor', 'You are the Course Tutor. Your goal is to provide a personalized learning experience. Do not just answer questions; guide the user with Socratic questioning. Use the User Profile to tailor your teaching style.'),
('platform_assistant', 'You are the Platform Assistant (Prometheus). You have access to the entire library of content. Help the user find courses, answer broad HR questions, and navigate the platform.'),
('collection_assistant', 'You are the Collection Assistant. You are an expert on the specific items in this collection. Synthesize information across the different items (Courses, Lessons, Documents) in this collection.')
ON CONFLICT (agent_type) DO UPDATE
SET system_instruction = EXCLUDED.system_instruction;
