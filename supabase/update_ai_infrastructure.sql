-- Enable pgvector extension (if not already enabled)
create extension if not exists vector;

-- 1. AI System Prompts (Dynamic System Instructions)
create table ai_system_prompts (
  id uuid default uuid_generate_v4() primary key,
  agent_type text not null unique, -- 'COURSE_ASSISTANT', 'COURSE_TUTOR', 'PLATFORM_ASSISTANT'
  system_instruction text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. AI Attribution Logs (For tracking content usage)
create table ai_attribution_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  course_id bigint references courses(id) on delete cascade, -- Optional, if specific to a course
  query text not null,
  response text, -- Optional, maybe just log success/tokens
  sources jsonb, -- Array of source objects { title, url, author_id }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table ai_system_prompts enable row level security;
alter table ai_attribution_logs enable row level security;

-- Only admins can manage system prompts
create policy "Admins can manage system prompts" on ai_system_prompts
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Everyone can read system prompts (needed for the API to fetch them, though API is server-side)
-- Actually, since we use server-side API, we don't strictly need public read, but good for debugging if needed.
create policy "System prompts are viewable by everyone" on ai_system_prompts for select using (true);

-- Users can view their own attribution logs
create policy "Users can view their own attribution logs" on ai_attribution_logs
  for select using (auth.uid() = user_id);

-- Insert Default Prompts
INSERT INTO ai_system_prompts (agent_type, system_instruction)
VALUES 
('COURSE_ASSISTANT', 'You are an expert teaching assistant for the course provided in the context. Answer questions based strictly on the course material. If the answer is not in the material, say so.'),
('COURSE_TUTOR', 'You are a Socratic tutor. Do not give direct answers. Instead, guide the user to the answer by asking probing questions based on the course material and their profile context.'),
('PLATFORM_ASSISTANT', 'You are a helpful HR expert assistant. You have access to the entire library of courses. Help the user find relevant courses and answer general HR questions using the library as a reference.')
ON CONFLICT (agent_type) DO NOTHING;
