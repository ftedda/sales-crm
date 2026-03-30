-- Data Room Entries table
create table if not exists public.data_room_entries (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null,
  fund text not null,
  main_contact text,
  other_contacts text,
  nda_status text default '',
  target_access text default '',
  current_access text default '',
  email_addresses text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.data_room_entries enable row level security;

-- RLS policies
create policy "Org members can select data_room_entries" on public.data_room_entries for select
  using (public.is_org_member(org_id));
create policy "Org members can insert data_room_entries" on public.data_room_entries for insert
  with check (public.is_org_member(org_id));
create policy "Org members can update data_room_entries" on public.data_room_entries for update
  using (public.is_org_member(org_id));
create policy "Org members can delete data_room_entries" on public.data_room_entries for delete
  using (public.is_org_member(org_id));

-- Indexes
create index if not exists idx_data_room_entries_user_id on public.data_room_entries(user_id);
create index if not exists idx_data_room_entries_org_id on public.data_room_entries(org_id);

-- Updated_at trigger
create trigger update_data_room_entries_updated_at
  before update on public.data_room_entries
  for each row
  execute function update_updated_at_column();
