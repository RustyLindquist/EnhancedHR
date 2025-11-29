-- Create Embeddings Table
create table course_embeddings (
  id uuid default uuid_generate_v4() primary key,
  course_id bigint references courses(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade, -- Optional
  content text not null,
  embedding vector(768), -- Gemini 1.5 Pro / Flash embedding dimension
  metadata jsonb, -- { "author_id": "...", "source_url": "..." }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table course_embeddings enable row level security;

-- Policies
create policy "Public read access to embeddings" on course_embeddings for select using (true);
create policy "Admins can insert embeddings" on course_embeddings for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'org_admin'))
);

-- Vector Search Function
create or replace function match_course_embeddings (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_course_id bigint default null
)
returns table (
  id uuid,
  course_id bigint,
  content text,
  similarity float,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  select
    course_embeddings.id,
    course_embeddings.course_id,
    course_embeddings.content,
    1 - (course_embeddings.embedding <=> query_embedding) as similarity,
    course_embeddings.metadata
  from course_embeddings
  where 1 - (course_embeddings.embedding <=> query_embedding) > match_threshold
  and (filter_course_id is null or course_embeddings.course_id = filter_course_id)
  order by course_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
