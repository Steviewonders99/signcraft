-- Add embed_mode flag to signing_requests
alter table signing_requests
  add column embed_mode boolean not null default false;

-- Index for dashboard queries filtering by embed
create index idx_signing_requests_embed_mode on signing_requests(embed_mode);
