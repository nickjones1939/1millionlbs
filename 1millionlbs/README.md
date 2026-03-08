# 1M Lb Club — Strength Tracker
### 1millionlbs.com

Track your journey to lifting 1,000,000 lbs. Log sets, cardio, view history, and chase the goal.
Supports Google, Apple, Spotify, and Email login. Guest mode available.

---

## Full Setup Guide

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, give it a name (e.g. `1millionlbs`), set a database password, click **Create**
3. Once created, go to **Project Settings → API**
4. Copy your **Project URL** and **anon public** key — you'll need these shortly

### Step 2 — Set Up the Database Tables

In Supabase, go to the **SQL Editor** and run this:

```sql
-- Profiles table (display names)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view and edit own profile"
  on profiles for all using (auth.uid() = id);

-- Workouts table
create table workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  muscle_group text not null,
  sets integer not null,
  reps integer not null,
  weight numeric not null,
  total_lbs numeric not null,
  logged_at timestamptz default now()
);
alter table workouts enable row level security;
create policy "Users can manage own workouts"
  on workouts for all using (auth.uid() = user_id);

-- Cardio sessions table
create table cardio_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  cardio_type text not null,
  minutes integer not null,
  difficulty text not null,
  logged_at timestamptz default now()
);
alter table cardio_sessions enable row level security;
create policy "Users can manage own cardio"
  on cardio_sessions for all using (auth.uid() = user_id);
```

### Step 3 — Enable Auth Providers

In Supabase → **Authentication → Providers**, enable:

**Google**
1. Enable Google in Supabase
2. Go to console.cloud.google.com → APIs & Services → Credentials
3. Create an OAuth 2.0 Client ID (Web application)
4. Add `https://your-project-id.supabase.co/auth/v1/callback` as redirect URI
5. Paste the Client ID and Secret into Supabase

**Apple**
1. Enable Apple in Supabase
2. Requires an Apple Developer account ($99/yr)
3. Follow Supabase docs: docs.supabase.com/docs/guides/auth/social-login/auth-apple

**Spotify**
1. Enable Spotify in Supabase
2. Go to developer.spotify.com/dashboard → Create App
3. Add `https://your-project-id.supabase.co/auth/v1/callback` as redirect URI
4. Paste Client ID and Secret into Supabase

**Email/Password** — already enabled by default in Supabase

### Step 4 — Configure Environment Variables

```bash
cp .env.example .env
```

Fill in your Supabase values:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/1millionlbs.git
git push -u origin main
```

### Step 6 — Deploy on Netlify

1. Go to netlify.com → Add new site → Import from Git
2. Select your repo — Vite is auto-detected
3. Go to Site settings → Environment variables, add:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Deploy — live in ~1 minute

### Step 7 — Connect 1millionlbs.com

In Netlify → Domain settings → Add custom domain → 1millionlbs.com

Add these in Spaceship DNS:
- A record: @ → 75.2.60.5
- CNAME: www → your-site-name.netlify.app

In Supabase → Authentication → URL Configuration:
- Site URL: https://1millionlbs.com
- Redirect URLs: https://1millionlbs.com

---

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 (requires .env with Supabase credentials)
