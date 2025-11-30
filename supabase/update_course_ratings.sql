-- Create Course Ratings Table
create table if not exists course_ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  course_id bigint references courses(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

-- RLS
alter table course_ratings enable row level security;

create policy "Users can insert their own ratings" on course_ratings for insert with check (auth.uid() = user_id);
create policy "Users can update their own ratings" on course_ratings for update using (auth.uid() = user_id);
create policy "Users can view all ratings" on course_ratings for select using (true);
