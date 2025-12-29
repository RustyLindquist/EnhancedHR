-- Create user_streaks table to track daily activity and consecutive day streaks
-- This table stores one row per user per day they were active

create table if not exists user_streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  activity_date date not null default current_date,
  current_streak integer not null default 1,
  longest_streak integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, activity_date)
);

-- Enable RLS
alter table user_streaks enable row level security;

-- Users can view their own streaks
create policy "Users can view their own streaks" on user_streaks
  for select using (auth.uid() = user_id);

-- Users can insert their own streaks
create policy "Users can insert their own streaks" on user_streaks
  for insert with check (auth.uid() = user_id);

-- Users can update their own streaks
create policy "Users can update their own streaks" on user_streaks
  for update using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists idx_user_streaks_user_id on user_streaks(user_id);
create index if not exists idx_user_streaks_activity_date on user_streaks(user_id, activity_date desc);

-- Function to record daily activity and update streak
create or replace function record_user_activity(p_user_id uuid)
returns integer as $$
declare
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
  v_yesterday_streak integer;
  v_new_streak integer;
  v_longest integer;
  v_existing_today boolean;
begin
  -- Check if we already have an entry for today
  select exists(
    select 1 from user_streaks
    where user_id = p_user_id and activity_date = v_today
  ) into v_existing_today;

  -- If already logged today, just return current streak
  if v_existing_today then
    select current_streak into v_new_streak
    from user_streaks
    where user_id = p_user_id and activity_date = v_today;
    return v_new_streak;
  end if;

  -- Get yesterday's streak (if any)
  select current_streak, longest_streak into v_yesterday_streak, v_longest
  from user_streaks
  where user_id = p_user_id and activity_date = v_yesterday;

  -- Calculate new streak
  if v_yesterday_streak is not null then
    -- Continuing streak from yesterday
    v_new_streak := v_yesterday_streak + 1;
    v_longest := greatest(coalesce(v_longest, 0), v_new_streak);
  else
    -- Starting fresh or streak was broken
    v_new_streak := 1;
    -- Get the longest streak from history
    select coalesce(max(longest_streak), 1) into v_longest
    from user_streaks
    where user_id = p_user_id;
  end if;

  -- Insert today's entry
  insert into user_streaks (user_id, activity_date, current_streak, longest_streak)
  values (p_user_id, v_today, v_new_streak, v_longest);

  return v_new_streak;
end;
$$ language plpgsql security definer;

-- Function to get current streak for a user
create or replace function get_user_streak(p_user_id uuid)
returns integer as $$
declare
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
  v_streak integer;
begin
  -- First check if user was active today
  select current_streak into v_streak
  from user_streaks
  where user_id = p_user_id and activity_date = v_today;

  if v_streak is not null then
    return v_streak;
  end if;

  -- If not active today, check yesterday (streak is still valid but not incremented)
  select current_streak into v_streak
  from user_streaks
  where user_id = p_user_id and activity_date = v_yesterday;

  if v_streak is not null then
    return v_streak;
  end if;

  -- No recent activity, streak is 0
  return 0;
end;
$$ language plpgsql security definer;
