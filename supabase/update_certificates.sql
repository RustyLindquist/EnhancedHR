-- Create Certificates Table
create table if not exists certificates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  course_id bigint references courses(id) on delete cascade not null,
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id) -- One certificate per course per user
);

-- RLS
alter table certificates enable row level security;

create policy "Users can view their own certificates" on certificates for select using (auth.uid() = user_id);
create policy "Public can view certificates by ID" on certificates for select using (true); -- Allow public verification
create policy "System can insert certificates" on certificates for insert with check (auth.uid() = user_id); -- Or use service role
