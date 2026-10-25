begin;

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_cents bigint not null default 0 check (balance_cents >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('deposit', 'booking_debit')),
  amount_cents bigint not null check (amount_cents <> 0),
  currency text not null default 'USD' check (currency = 'USD'),
  reference text not null unique,
  status text not null check (status in ('pending', 'posted', 'failed')),
  provider text not null check (provider in ('paystack', 'wallet')),
  customer_email text,
  balance_after_cents bigint check (balance_after_cents is null or balance_after_cents >= 0),
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  check ((type = 'deposit' and amount_cents > 0 and provider = 'paystack') or (type = 'booking_debit' and amount_cents < 0 and provider = 'wallet'))
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tour_id integer not null,
  tour_title text not null,
  location text not null,
  travel_date date not null,
  guests integer not null check (guests between 1 and 6),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists wallet_transactions_user_created_idx on public.wallet_transactions (user_id, created_at desc);
create index if not exists bookings_user_created_idx on public.bookings (user_id, created_at desc);

alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.bookings enable row level security;
revoke all on public.wallets from anon, authenticated;
revoke all on public.wallet_transactions from anon, authenticated;
revoke all on public.bookings from anon, authenticated;
grant all on public.wallets to service_role;
grant all on public.wallet_transactions to service_role;
grant all on public.bookings to service_role;

create or replace function public.wallet_runtime_ready()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select to_regclass('public.wallets') is not null
    and to_regclass('public.wallet_transactions') is not null
    and to_regclass('public.bookings') is not null;
$$;

create or replace function public.credit_wallet_topup(
  p_user_id uuid,
  p_reference text,
  p_amount_cents bigint,
  p_currency text,
  p_domain text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tx public.wallet_transactions%rowtype;
  v_balance bigint;
begin
  if p_domain <> 'live' or p_currency <> 'USD' or p_amount_cents < 200 then
    raise exception 'live_usd_payment_required' using errcode = 'P0001';
  end if;

  select * into v_tx
  from public.wallet_transactions
  where reference = p_reference and user_id = p_user_id and type = 'deposit'
  for update;
  if not found then raise exception 'pending_deposit_not_found' using errcode = 'P0001'; end if;

  if v_tx.status = 'posted' then
    select balance_cents into v_balance from public.wallets where user_id = p_user_id;
    return jsonb_build_object('credited', false, 'balance_cents', coalesce(v_balance, 0), 'status', 'posted');
  end if;
  if v_tx.status <> 'pending' then raise exception 'deposit_not_pending' using errcode = 'P0001'; end if;
  if v_tx.amount_cents <> p_amount_cents or v_tx.currency <> p_currency then
    raise exception 'deposit_amount_mismatch' using errcode = 'P0001';
  end if;

  insert into public.wallets (user_id, balance_cents, currency)
  values (p_user_id, 0, 'USD') on conflict (user_id) do nothing;
  select balance_cents into v_balance from public.wallets where user_id = p_user_id for update;
  v_balance := v_balance + p_amount_cents;
  update public.wallets set balance_cents = v_balance, updated_at = now() where user_id = p_user_id;
  update public.wallet_transactions
  set status = 'posted', balance_after_cents = v_balance, posted_at = now()
  where id = v_tx.id;

  return jsonb_build_object('credited', true, 'balance_cents', v_balance, 'status', 'posted');
end;
$$;

create or replace function public.book_tour_with_wallet(
  p_user_id uuid,
  p_tour_id integer,
  p_tour_title text,
  p_location text,
  p_travel_date date,
  p_guests integer,
  p_amount_cents bigint,
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_wallet public.wallets%rowtype;
  v_booking public.bookings%rowtype;
  v_balance bigint;
begin
  if p_amount_cents <= 0 or p_guests < 1 or p_guests > 6 or p_travel_date < current_date then
    raise exception 'invalid_booking_details' using errcode = 'P0001';
  end if;

  insert into public.wallets (user_id, balance_cents, currency)
  values (p_user_id, 0, 'USD') on conflict (user_id) do nothing;
  select * into v_wallet from public.wallets where user_id = p_user_id for update;

  select * into v_booking from public.bookings
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_booking.tour_id <> p_tour_id or v_booking.travel_date <> p_travel_date or v_booking.guests <> p_guests or v_booking.amount_cents <> p_amount_cents then
      raise exception 'idempotency_key_conflict' using errcode = 'P0001';
    end if;
    return jsonb_build_object('booking_id', v_booking.id, 'balance_cents', v_wallet.balance_cents, 'duplicate', true);
  end if;

  if v_wallet.balance_cents < p_amount_cents then
    raise exception 'insufficient_wallet_balance' using errcode = 'P0001';
  end if;
  v_balance := v_wallet.balance_cents - p_amount_cents;
  insert into public.bookings (user_id, tour_id, tour_title, location, travel_date, guests, amount_cents, currency, idempotency_key)
  values (p_user_id, p_tour_id, p_tour_title, p_location, p_travel_date, p_guests, p_amount_cents, 'USD', p_idempotency_key)
  returning * into v_booking;

  update public.wallets set balance_cents = v_balance, updated_at = now() where user_id = p_user_id;
  insert into public.wallet_transactions (user_id, type, amount_cents, currency, reference, status, provider, balance_after_cents, posted_at)
  values (p_user_id, 'booking_debit', -p_amount_cents, 'USD', 'BOOK-' || v_booking.id::text, 'posted', 'wallet', v_balance, now());

  return jsonb_build_object('booking_id', v_booking.id, 'balance_cents', v_balance, 'duplicate', false);
end;
$$;

revoke all on function public.wallet_runtime_ready() from public, anon, authenticated;
revoke all on function public.credit_wallet_topup(uuid, text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.book_tour_with_wallet(uuid, integer, text, text, date, integer, bigint, uuid) from public, anon, authenticated;
grant execute on function public.wallet_runtime_ready() to service_role;
grant execute on function public.credit_wallet_topup(uuid, text, bigint, text, text) to service_role;
grant execute on function public.book_tour_with_wallet(uuid, integer, text, text, date, integer, bigint, uuid) to service_role;

commit;
