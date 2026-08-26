import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_EUR_RATE_AR, DEFAULT_EUR_RATE_SINCE } from '../config/fund';
import type {
  Contribution,
  ExpenseCategory,
  FamilyMember,
  FundExpense,
  FundSnapshot,
  MemberColor,
  NewContribution,
  NewExpense,
  NewMember,
} from '../domain/models';
import { createSlugId } from '../utils/id';
import type { FinanceRepository } from './financeRepository';

/*
 * Les données de la caisse, dans Postgres.
 *
 * Ce qui change par rapport au stockage local : tout le monde voit la même
 * chose, et c'est la base — pas le navigateur — qui décide qui a le droit
 * d'écrire (règles RLS, voir supabase/migrations/0001_init.sql).
 *
 * Les colonnes sont en snake_case côté base et en camelCase côté application :
 * la traduction se fait ici, et nulle part ailleurs.
 */

interface MemberRow {
  id: string;
  title: string | null;
  first_name: string;
  last_name: string | null;
  color: string;
  avatar_url: string | null;
  is_admin: boolean;
}

interface ContributionRow {
  id: string;
  member_id: string | null;
  amount_ar: number;
  date: string;
  kind: string;
  note: string | null;
}

interface ExpenseRow {
  id: string;
  label: string;
  amount_ar: number;
  date: string;
  category: string;
  member_id: string | null;
}

interface EurRateRow {
  rate_ar: number;
  since: string;
}

export class SupabaseFinanceRepository implements FinanceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getFundSnapshot(): Promise<FundSnapshot> {
    const [members, contributions, expenses, rates] = await Promise.all([
      this.client.from('members').select('*'),
      this.client.from('contributions').select('*').order('date', { ascending: false }),
      this.client.from('expenses').select('*').order('date', { ascending: false }),
      this.client.from('eur_rates').select('rate_ar, since').order('created_at', { ascending: false }),
    ]);

    fail(members.error ?? contributions.error ?? expenses.error ?? rates.error);

    const eurRates = ((rates.data ?? []) as EurRateRow[]).map((row) => ({
      rateAr: row.rate_ar,
      since: row.since,
    }));

    return {
      members: ((members.data ?? []) as MemberRow[]).map(toMember),
      contributions: ((contributions.data ?? []) as ContributionRow[]).map(toContribution),
      expenses: ((expenses.data ?? []) as ExpenseRow[]).map(toExpense),
      // Une base neuve n'a pas encore de taux : on repart de celui du code.
      eurRates: eurRates.length > 0
        ? eurRates
        : [{ rateAr: DEFAULT_EUR_RATE_AR, since: DEFAULT_EUR_RATE_SINCE }],
    };
  }

  async addContribution(input: NewContribution): Promise<FundSnapshot> {
    const { error } = await this.client.from('contributions').insert(fromContribution(input));
    fail(error);
    return this.getFundSnapshot();
  }

  async updateContribution(id: string, input: NewContribution): Promise<FundSnapshot> {
    const { error } = await this.client
      .from('contributions')
      .update(fromContribution(input))
      .eq('id', id);
    fail(error);
    return this.getFundSnapshot();
  }

  async deleteContribution(id: string): Promise<FundSnapshot> {
    const { error } = await this.client.from('contributions').delete().eq('id', id);
    fail(error);
    return this.getFundSnapshot();
  }

  async addExpense(input: NewExpense): Promise<FundSnapshot> {
    const { error } = await this.client.from('expenses').insert({
      label: input.label,
      amount_ar: input.amountAr,
      date: input.date,
      category: input.category,
      member_id: input.memberId ?? null,
    });
    fail(error);
    return this.getFundSnapshot();
  }

  async addMember(input: NewMember): Promise<FundSnapshot> {
    // L'identifiant est calculé côté application : la base n'a pas à connaître
    // la règle de nommage, et le même membre porte le même identifiant partout.
    const existing = await this.client.from('members').select('id');
    fail(existing.error);

    const id = createSlugId(
      [input.firstName, input.lastName].filter(Boolean).join('-'),
      ((existing.data ?? []) as Array<{ id: string }>).map((row) => row.id),
      'membre',
    );

    const { error } = await this.client.from('members').insert({ id, ...fromMember(input) });
    fail(error);
    return this.getFundSnapshot();
  }

  async updateMember(id: string, input: NewMember): Promise<FundSnapshot> {
    const { error } = await this.client.from('members').update(fromMember(input)).eq('id', id);
    fail(error);
    return this.getFundSnapshot();
  }

  /** Le taux s'empile, il ne se modifie jamais : l'historique reste lisible. */
  async setEurRate(rateAr: number, since: string): Promise<FundSnapshot> {
    const { error } = await this.client.from('eur_rates').insert({ rate_ar: rateAr, since });
    fail(error);
    return this.getFundSnapshot();
  }
}

/** Une erreur de la base doit remonter telle quelle : l'écran l'affiche. */
function fail(error: { message: string } | null | undefined): void {
  if (error) throw new Error(error.message);
}

function toMember(row: MemberRow): FamilyMember {
  return {
    id: row.id,
    ...(row.title ? { title: row.title } : {}),
    firstName: row.first_name,
    ...(row.last_name ? { lastName: row.last_name } : {}),
    color: row.color as MemberColor,
    avatarUrl: row.avatar_url,
    ...(row.is_admin ? { isAdmin: true } : {}),
  };
}

function fromMember(input: NewMember) {
  return {
    title: input.title ?? null,
    first_name: input.firstName,
    last_name: input.lastName ?? null,
    color: input.color,
    avatar_url: input.avatarUrl ?? null,
    is_admin: input.isAdmin ?? false,
  };
}

function toContribution(row: ContributionRow): Contribution {
  return {
    id: row.id,
    ...(row.member_id ? { memberId: row.member_id } : {}),
    amountAr: row.amount_ar,
    date: row.date,
    ...(row.kind === 'oneOff' ? { kind: 'oneOff' as const } : {}),
    ...(row.note ? { note: row.note } : {}),
  };
}

function fromContribution(input: NewContribution) {
  return {
    member_id: input.memberId ?? null,
    amount_ar: input.amountAr,
    date: input.date,
    kind: input.kind ?? 'monthly',
    note: input.note ?? null,
  };
}

function toExpense(row: ExpenseRow): FundExpense {
  return {
    id: row.id,
    label: row.label,
    amountAr: row.amount_ar,
    date: row.date,
    category: row.category as ExpenseCategory,
    memberId: row.member_id,
  };
}
