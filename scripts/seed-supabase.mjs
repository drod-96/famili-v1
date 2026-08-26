/**
 * Verse les données de départ dans Supabase.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run seed:supabase
 *
 * Lit `data/fund.seed.json` — le fichier en clair, jamais versionné — et le
 * pousse dans les tables. À lancer une seule fois, juste après la migration.
 *
 * La clé *service role* contourne les règles RLS : elle ne doit jamais entrer
 * dans le dépôt ni dans le paquet publié. Elle se récupère dans
 * Project Settings → API, et se passe ici par l'environnement.
 */
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { env, exit } from 'node:process';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Il manque SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.');
  exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const seed = JSON.parse(await readFile(new URL('../data/fund.seed.json', import.meta.url), 'utf8'));

function fail(step, error) {
  if (!error) return;
  console.error(`${step} : ${error.message}`);
  exit(1);
}

// Les membres d'abord : les versements et les sorties pointent dessus.
const members = (seed.members ?? []).map((member) => ({
  id: member.id,
  title: member.title ?? null,
  first_name: member.firstName,
  last_name: member.lastName ?? null,
  color: member.color,
  avatar_url: member.avatarUrl ?? null,
  is_admin: member.isAdmin ?? false,
}));

fail('membres', (await client.from('members').upsert(members)).error);
console.log(`${members.length} membres`);

/*
 * Les identifiants des versements et des sorties sont engendrés par la base
 * (uuid) : on ne réutilise pas ceux du fichier, qui étaient des libellés.
 * Relancer ce script créerait donc des doublons — il est fait pour un seul
 * passage, sur une base neuve.
 */
const contributions = (seed.contributions ?? []).map((item) => ({
  member_id: item.memberId ?? null,
  amount_ar: item.amountAr,
  date: item.date,
  kind: item.kind ?? 'monthly',
  note: item.note ?? null,
}));

if (contributions.length > 0) {
  fail('versements', (await client.from('contributions').insert(contributions)).error);
}
console.log(`${contributions.length} versements`);

const expenses = (seed.expenses ?? []).map((item) => ({
  label: item.label,
  amount_ar: item.amountAr,
  date: item.date,
  category: item.category,
  member_id: item.memberId ?? null,
}));

if (expenses.length > 0) {
  fail('sorties', (await client.from('expenses').insert(expenses)).error);
}
console.log(`${expenses.length} sorties`);

// Du plus ancien au plus récent : la base classe ensuite par date d'insertion.
const rates = [...(seed.eurRates ?? [])].reverse().map((rate) => ({
  rate_ar: rate.rateAr,
  since: rate.since,
}));

if (rates.length > 0) {
  fail('taux', (await client.from('eur_rates').insert(rates)).error);
}
console.log(`${rates.length} taux`);

console.log('\nDonnées versées. Pense à te donner le droit d’écrire :');
console.log("  update public.app_users set is_admin = true where email = 'ton@adresse';");
