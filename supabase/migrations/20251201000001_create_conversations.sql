-- Create conversations table
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_saved boolean default false,
  metadata jsonb default '{}'::jsonb
);

-- Create conversation_messages table
create table if not exists public.conversation_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

-- Policies for conversations
create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Policies for conversation_messages
create policy "Users can view messages of their own conversations"
  on public.conversation_messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert messages to their own conversations"
  on public.conversation_messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where id = conversation_messages.conversation_id
      and user_id = auth.uid()
    )
  );

-- Create index for faster lookups
create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversation_messages_conversation_id_idx on public.conversation_messages(conversation_id);
