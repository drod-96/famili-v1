-- ═══════════════════════════════════════════════════════════════════════════
-- Caisse Familiale — schéma initial
--
-- À exécuter une fois dans l'éditeur SQL du projet Supabase.
--
-- Principe : personne ne lit quoi que ce soit sans être connecté, et seuls les
-- responsables écrivent. Les montants sont TOUJOURS en ariary, entiers.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Qui utilise l'application ──────────────────────────────────────────────
-- Une ligne par compte, créée automatiquement à la première connexion.
-- `is_admin` se met à la main : c'est la seule chose qui donne le droit d'écrire.
create table if not exists public.app_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/*
 * Utilisée par toutes les règles d'écriture.
 * `security definer` pour qu'elle puisse lire app_users sans que l'appelant
 * ait besoin d'un droit dessus ; `stable` pour qu'elle ne soit évaluée
 * qu'une fois par requête.
 */
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.app_users where user_id = auth.uid()),
    false
  );
$$;

-- ── Les membres de la caisse ───────────────────────────────────────────────
-- L'identifiant reste un texte lisible (« naina ») : c'est lui que pointent
-- les versements, et le garder stable permet de renommer quelqu'un sans rien
-- détacher.
create table if not exists public.members (
  id         text primary key,
  title      text,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name  text,
  color      text not null default 'teal'
             check (color in ('teal', 'blue', 'violet', 'amber', 'coral', 'green')),
  avatar_url text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Les versements ─────────────────────────────────────────────────────────
-- `member_id` peut être nul : un complément de caisse n'est rattaché à personne.
-- `kind` décide si le versement devient des mois payés ou non.
create table if not exists public.contributions (
  id         uuid primary key default gen_random_uuid(),
  member_id  text references public.members (id) on delete set null,
  amount_ar  integer not null check (amount_ar > 0),
  date       date not null,
  kind       text not null default 'monthly' check (kind in ('monthly', 'oneOff')),
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists contributions_member_idx on public.contributions (member_id);
create index if not exists contributions_date_idx on public.contributions (date desc);

-- ── Les sorties ────────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  label      text not null check (length(trim(label)) > 0),
  amount_ar  integer not null check (amount_ar > 0),
  date       date not null,
  category   text not null default 'other'
             check (category in ('event', 'health', 'support', 'admin', 'other')),
  member_id  text references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (date desc);

-- ── Le taux € / Ar ─────────────────────────────────────────────────────────
-- Historique : on empile, on ne modifie jamais. Le plus récent fait foi.
create table if not exists public.eur_rates (
  id         uuid primary key default gen_random_uuid(),
  rate_ar    integer not null check (rate_ar > 0),
  since      date not null,
  created_at timestamptz not null default now()
);

create index if not exists eur_rates_recent_idx on public.eur_rates (created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
--
-- Lecture : toute personne connectée. Écriture : les responsables seulement.
-- Sans connexion, les tables sont muettes — c'est ce qui remplace la phrase
-- de la famille et le mot de passe vérifié dans le navigateur.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.app_users     enable row level security;
alter table public.members       enable row level security;
alter table public.contributions enable row level security;
alter table public.expenses      enable row level security;
alter table public.eur_rates     enable row level security;

-- Chacun voit sa propre ligne, et rien d'autre : la liste des comptes ne se
-- parcourt pas depuis l'application.
drop policy if exists "app_users: se voir soi-même" on public.app_users;
create policy "app_users: se voir soi-même"
  on public.app_users for select
  to authenticated
  using (user_id = auth.uid());

do $$
declare
  target text;
begin
  foreach target in array array['members', 'contributions', 'expenses', 'eur_rates'] loop
    execute format('drop policy if exists "%1$s: lecture connectée" on public.%1$I', target);
    execute format(
      'create policy "%1$s: lecture connectée" on public.%1$I
         for select to authenticated using (true)', target);

    execute format('drop policy if exists "%1$s: écriture responsable" on public.%1$I', target);
    execute format(
      'create policy "%1$s: écriture responsable" on public.%1$I
         for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', target);
  end loop;
end;
$$;
