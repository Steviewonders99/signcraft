-- User profiles: name, company info, services, appearance preferences
create table user_profiles (
  user_id uuid primary key references auth.users,
  full_name text,
  company_name text,
  company_address text,
  company_website text,
  services text[] not null default '{}',
  accent_color text not null default '#22c55e',
  theme text not null default 'dark' check (theme in ('light', 'dark')),
  updated_at timestamptz not null default now()
);

alter table user_profiles enable row level security;
create policy "Users manage own profile" on user_profiles
  for all using (auth.uid() = user_id);
