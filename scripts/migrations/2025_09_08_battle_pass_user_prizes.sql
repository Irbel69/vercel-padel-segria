-- Battle Pass user claims: join table + policies + RPC

create table if not exists public.battle_pass_user_prizes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  prize_id bigint not null references public.battle_pass_prizes(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint battle_pass_user_prizes_user_prize_unique unique (user_id, prize_id)
);

create index if not exists idx_battle_pass_user_prizes_user on public.battle_pass_user_prizes(user_id);
create index if not exists idx_battle_pass_user_prizes_prize on public.battle_pass_user_prizes(prize_id);

alter table public.battle_pass_user_prizes enable row level security;

drop policy if exists "select own claims" on public.battle_pass_user_prizes;
create policy "select own claims"
  on public.battle_pass_user_prizes
  for select
  using (auth.uid() = user_id);

drop policy if exists "claim when eligible" on public.battle_pass_user_prizes;
create policy "claim when eligible"
  on public.battle_pass_user_prizes
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.battle_pass_prizes p
      where p.id = prize_id
        and p.is_active = true
        and coalesce((select u.score from public.users u where u.id = auth.uid()), 0) >= p.points_required
    )
  );

create or replace function public.claim_battle_pass_prize(p_prize_id bigint)
returns public.battle_pass_user_prizes
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.battle_pass_user_prizes;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28P01';
  end if;

  insert into public.battle_pass_user_prizes (user_id, prize_id)
  values (v_user_id, p_prize_id)
  on conflict (user_id, prize_id) do nothing
  returning * into v_row;

  if v_row is null then
    select * into v_row
    from public.battle_pass_user_prizes
    where user_id = v_user_id and prize_id = p_prize_id;
  end if;

  return v_row;
end;
$$;

grant execute on function public.claim_battle_pass_prize(bigint) to authenticated;
