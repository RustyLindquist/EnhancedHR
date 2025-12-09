create type context_item_type as enum ('AI_INSIGHT', 'CUSTOM_CONTEXT', 'FILE', 'PROFILE');

create table user_context_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_id text, -- Null for global/personal-context, or specific collection ID
  type context_item_type not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table user_context_items enable row level security;

create policy "Users can view their own context items"
  on user_context_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own context items"
  on user_context_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own context items"
  on user_context_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own context items"
  on user_context_items for delete
  using (auth.uid() = user_id);

-- Indexes
create index user_context_items_user_id_idx on user_context_items(user_id);
create index user_context_items_collection_id_idx on user_context_items(collection_id);
