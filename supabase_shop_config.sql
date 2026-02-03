-- Shop config for busy mode (collection time)
-- Run in Supabase SQL Editor if table does not exist

create table if not exists public.shop_config (
  key text primary key,
  value jsonb not null default 'false',
  updated_at timestamptz not null default now()
);

-- Insert default: busy_mode off (25 min collection)
insert into public.shop_config (key, value)
values ('busy_mode', 'false')
on conflict (key) do nothing;

-- RLS: anyone can read (so payment/orders pages can show collection time)
alter table public.shop_config enable row level security;

create policy "Allow read shop_config"
  on public.shop_config for select
  using (true);

-- Only admin can update (role in user_metadata)
create policy "Allow admin update shop_config"
  on public.shop_config for update
  using (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  )
  with check (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- Trigger to refresh updated_at
create or replace function public.shop_config_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists shop_config_updated_at on public.shop_config;
create trigger shop_config_updated_at
  before update on public.shop_config
  for each row execute function public.shop_config_updated_at();
