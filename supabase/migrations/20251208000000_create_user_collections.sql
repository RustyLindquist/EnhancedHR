-- Create user_collections table for persisting saved items
create table if not exists public.user_collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  item_id text not null, -- Can be course ID (number as string) or other ID
  item_type text not null, -- 'COURSE', 'LESSON', 'MODULE', 'CONVERSATION'
  collection_id text not null, -- 'favorites', 'research', 'to_learn', or custom ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicates
  unique(user_id, item_id, item_type, collection_id)
);

-- RLS Policies
alter table public.user_collections enable row level security;

create policy "Users can view their own collections"
  on public.user_collections for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own collections"
  on public.user_collections for insert
  with check (auth.uid() = user_id);

create policy "Users can items from their own collections"
  on public.user_collections for delete
  using (auth.uid() = user_id);

-- Add index for performance
create index user_collections_user_id_idx on public.user_collections(user_id);
create index user_collections_collection_id_idx on public.user_collections(collection_id);
