-- Table to store AI insights about the user
CREATE TABLE IF NOT EXISTS public.user_ai_memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL, -- 'learning_style', 'knowledge_gap', 'goal', 'preference'
  content TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for retrieval
CREATE INDEX IF NOT EXISTS idx_user_ai_memory_user ON public.user_ai_memory(user_id);

-- RLS
ALTER TABLE public.user_ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memory" 
ON public.user_ai_memory FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert (via API)
