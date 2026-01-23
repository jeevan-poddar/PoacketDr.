-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  age int,
  height_cm numeric,
  weight_kg numeric,
  gender text,
  blood_type text,
  allergies text,
  medical_conditions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles Policies (drop first to avoid conflicts)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. ALERTS TABLE
create table if not exists public.alerts (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  description text,
  lat double precision not null,
  lng double precision not null,
  severity text check (severity in ('high', 'medium', 'low')) default 'low',
  radius double precision default 10,
  city text,
  state text,
  status text check (status in ('pending', 'verified', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.alerts enable row level security;

-- Alerts Policies
drop policy if exists "Alerts are viewable by everyone" on public.alerts;
create policy "Alerts are viewable by everyone" on public.alerts
  for select using (true);

drop policy if exists "Authenticated users can create alerts" on public.alerts;
create policy "Authenticated users can create alerts" on public.alerts
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Admins can update alerts" on public.alerts;
create policy "Admins can update alerts" on public.alerts
  for update using (true); -- CAUTION: Restrict this in production!

drop policy if exists "Admins can delete alerts" on public.alerts;
create policy "Admins can delete alerts" on public.alerts
  for delete using (true); -- CAUTION: Restrict this in production!


-- 3. VACCINATIONS TABLE
create table if not exists public.vaccinations (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  status text check (status in ('completed', 'upcoming', 'overdue')),
  date_administered timestamptz,
  next_due_date timestamptz,
  -- 'due_date' is referenced in some legacy dashboard code
  due_date timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.vaccinations enable row level security;

-- Vaccinations Policies
drop policy if exists "Users can view own vaccinations" on public.vaccinations;
create policy "Users can view own vaccinations" on public.vaccinations
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own vaccinations" on public.vaccinations;
create policy "Users can insert own vaccinations" on public.vaccinations
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own vaccinations" on public.vaccinations;
create policy "Users can update own vaccinations" on public.vaccinations
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own vaccinations" on public.vaccinations;
create policy "Users can delete own vaccinations" on public.vaccinations
  for delete using (auth.uid() = user_id);


-- 4. MESSAGES TABLE (Chat History)
create table if not exists public.messages (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  role text check (role in ('user', 'assistant')),
  content text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Messages Policies
drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages" on public.messages
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own messages" on public.messages;
drop policy if exists "Allow message inserts" on public.messages;
create policy "Allow message inserts" on public.messages
  for insert with check (true);

