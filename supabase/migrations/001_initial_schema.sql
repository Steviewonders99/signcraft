-- Templates
create table templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  content jsonb not null default '{}',
  variables text[] not null default '{}',
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table templates enable row level security;
create policy "Users manage own templates" on templates
  for all using (auth.uid() = user_id);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  template_id uuid references templates,
  title text not null default 'Untitled Contract',
  content jsonb not null default '{}',
  variables_filled jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;
create policy "Users manage own documents" on documents
  for all using (auth.uid() = user_id);

-- Signing Requests
create table signing_requests (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents not null unique,
  sender_id uuid references auth.users not null,
  status text not null default 'sent'
    check (status in ('sent', 'viewed', 'signed', 'countersigned', 'complete')),
  signer_name text not null,
  signer_email text not null,
  access_token text not null unique,
  countersign_token text not null unique,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

alter table signing_requests enable row level security;
create policy "Senders manage own requests" on signing_requests
  for all using (auth.uid() = sender_id);
create policy "Signers read via token" on signing_requests
  for select using (true);
  -- Token validation happens in API layer; RLS allows read for signing pages

-- Signatures
create table signatures (
  id uuid primary key default gen_random_uuid(),
  signing_request_id uuid references signing_requests not null,
  signer_role text not null check (signer_role in ('signer', 'countersigner')),
  signature_data text not null,
  ip_address text not null,
  user_agent text not null,
  geolocation text,
  viewing_duration_sec integer not null default 0,
  signed_at timestamptz not null default now(),
  unique (signing_request_id, signer_role)
);

alter table signatures enable row level security;
create policy "Senders read own signatures" on signatures
  for select using (
    exists (
      select 1 from signing_requests sr
      where sr.id = signatures.signing_request_id
      and sr.sender_id = auth.uid()
    )
  );
create policy "Insert via API" on signatures
  for insert with check (true);

-- Audit Events
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  signing_request_id uuid references signing_requests not null,
  event_type text not null
    check (event_type in ('created', 'sent', 'viewed', 'signed', 'countersigned', 'completed', 'downloaded')),
  ip_address text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table audit_events enable row level security;
create policy "Senders read own audit events" on audit_events
  for select using (
    exists (
      select 1 from signing_requests sr
      where sr.id = audit_events.signing_request_id
      and sr.sender_id = auth.uid()
    )
  );
create policy "Insert via API" on audit_events
  for insert with check (true);

-- Notification Preferences
create table notification_preferences (
  user_id uuid primary key references auth.users,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  phone_number text
);

alter table notification_preferences enable row level security;
create policy "Users manage own preferences" on notification_preferences
  for all using (auth.uid() = user_id);

-- Indexes
create index idx_documents_user_id on documents(user_id);
create index idx_signing_requests_access_token on signing_requests(access_token);
create index idx_signing_requests_countersign_token on signing_requests(countersign_token);
create index idx_signing_requests_sender_id on signing_requests(sender_id);
create index idx_audit_events_request_id on audit_events(signing_request_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger templates_updated_at before update on templates
  for each row execute function update_updated_at();
create trigger documents_updated_at before update on documents
  for each row execute function update_updated_at();
