-- 1) forecast_gwp
create table if not exists public.forecast_gwp (
  id bigint generated always as identity primary key,
  country text not null check (char_length(country) > 0),
  month date not null,                         -- use month-end (e.g., 2025-03-31)
  gwp numeric not null default 0,
  contracts numeric not null default 0,
  growth_rate numeric,                         -- as decimal fraction (0.12 = 12%)
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ux_forecast_gwp_country_month on public.forecast_gwp(country, month);

-- 2) cost_monitoring
create table if not exists public.cost_monitoring (
  id bigint generated always as identity primary key,
  country text,                                -- optional, if you want country split
  department text not null,
  month date not null,
  actuals numeric not null default 0,
  budget numeric not null default 0,
  variance numeric generated always as (actuals - budget) stored,
  variance_pct numeric generated always as (
    case when budget = 0 then null else (actuals - budget)/budget end
  ) stored,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ux_cost_monitoring_dept_month on public.cost_monitoring(department, month);

-- Row Level Security (safe defaults)
alter table public.forecast_gwp enable row level security;
alter table public.cost_monitoring enable row level security;

-- Public read, server write pattern (adjust role names to your setup)
create policy "read_all_forecast_gwp" on public.forecast_gwp for select using (true);
create policy "read_all_cost_monitoring" on public.cost_monitoring for select using (true);

-- Writes only via service role / authenticated server (Edge Function)
create policy "server_writes_forecast_gwp" on public.forecast_gwp
  for insert with check (auth.role() = 'service_role');

create policy "server_writes_cost_monitoring" on public.cost_monitoring
  for insert with check (auth.role() = 'service_role');