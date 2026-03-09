-- Run this in your Supabase SQL Editor

-- User monthly goals
create table user_goals (
  user_id uuid references auth.users on delete cascade primary key,
  monthly_goal numeric not null default 1000000,
  updated_at timestamptz default now()
);
alter table user_goals enable row level security;
create policy "Users can manage own goal"
  on user_goals for all using (auth.uid() = user_id);

-- Challenges
create table challenges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text not null unique,
  created_by uuid references auth.users on delete cascade not null,
  target_lbs numeric not null default 1000000,
  created_at timestamptz default now()
);
alter table challenges enable row level security;
create policy "Anyone can read challenges"
  on challenges for select using (true);
create policy "Authenticated users can create challenges"
  on challenges for insert with check (auth.uid() = created_by);

-- Challenge members
create table challenge_members (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references challenges on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamptz default now(),
  unique(challenge_id, user_id)
);
alter table challenge_members enable row level security;
create policy "Anyone can read challenge members"
  on challenge_members for select using (true);
create policy "Users can join challenges"
  on challenge_members for insert with check (auth.uid() = user_id);
