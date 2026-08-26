import { FUND_START, MONTHLY_DUE_AR } from '../config/fund';
import type { Contribution, FamilyMember, FundExpense, FundSnapshot } from '../domain/models';

const MONTH_SHORT = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
const MONTH_LONG = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export interface MonthPeriod {
  /** Position du mois depuis le démarrage de la caisse (0 = septembre 2026). */
  index: number;
  key: string;
  year: number;
  /** 1 = janvier … 12 = décembre. */
  month: number;
  shortLabel: string;
  longLabel: string;
}

/** Statut d'un mois pour un membre donné. */
export type MonthStatus = 'paid' | 'late' | 'due' | 'upcoming';

export interface MemberMonth {
  period: MonthPeriod;
  status: MonthStatus;
  /** Part du mois réellement couverte, de 0 à 1 (0.5 = 5 000 Ar sur 10 000 Ar). */
  progress: number;
  /** Montant affecté à ce mois, en ariary. */
  amountAr: number;
}

export type MemberTone = 'ahead' | 'ok' | 'due' | 'late' | 'idle';

export interface MemberSummary {
  member: FamilyMember;
  months: MemberMonth[];
  /** Cotisations + participations ponctuelles, en ariary. */
  totalPaidAr: number;
  /** Cotisations seules : c'est ce montant qui devient des mois payés. */
  duesPaidAr: number;
  /** Participations ponctuelles, hors cotisation (anniversaire, événement). */
  oneOffPaidAr: number;
  /** Nombre de mois couverts, décimales comprises (45 000 Ar = 4,5 mois). */
  monthsCovered: number;
  /** Nombre de mois entiers couverts. */
  fullMonthsCovered: number;
  /** Nombre de mois attendus à ce jour (0 tant que la caisse n'a pas démarré). */
  monthsExpected: number;
  lateCount: number;
  aheadCount: number;
  /** Reste à verser pour être à jour aujourd'hui, en ariary. */
  remainingAr: number;
  /** Année civile affichée dans la grille. */
  year: number;
  /** Mois de l'année affichée entièrement couverts. */
  yearFullMonths: number;
  /** Mois de l'année affichée pas encore couverts (mois en cours compris). */
  yearRemainingMonths: number;
  /** Reste à verser pour couvrir toute l'année affichée, en ariary. */
  yearRemainingAr: number;
  /**
   * Mois déjà couverts au-delà de décembre de l'année affichée, décimales
   * comprises. Rien n'est perdu : ce qui dépasse est reporté sur l'année suivante.
   */
  overflowMonths: number;
  tone: MemberTone;
  statusLabel: string;
}

export type ActivityEntry =
  | {
      kind: 'contribution';
      id: string;
      date: string;
      /** Absent pour un versement rattaché à personne. */
      member?: FamilyMember;
      amountAr: number;
      monthsGranted: number;
      /** Participation ponctuelle : elle ne couvre aucun mois. */
      oneOff: boolean;
      note?: string;
    }
  | {
      kind: 'expense';
      id: string;
      date: string;
      expense: FundExpense;
      amountAr: number;
      /** Renseigné seulement si la sortie concerne un membre. */
      member?: FamilyMember;
    };

const FUND_START_ABS = absoluteMonth(FUND_START.year, FUND_START.month);

function absoluteMonth(year: number, month: number): number {
  return year * 12 + (month - 1);
}

export function periodAt(index: number): MonthPeriod {
  const abs = FUND_START_ABS + index;
  const year = Math.floor(abs / 12);
  const month = (abs % 12) + 1;

  return {
    index,
    key: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
    shortLabel: MONTH_SHORT[month - 1],
    longLabel: `${MONTH_LONG[month - 1]} ${year}`,
  };
}

/**
 * Position du mois courant dans la caisse.
 * Négatif tant que la caisse n'a pas démarré.
 */
export function currentPeriodIndex(today: Date = new Date()): number {
  return absoluteMonth(today.getFullYear(), today.getMonth() + 1) - FUND_START_ABS;
}

/** Année civile affichée : l'année en cours, au plus tôt celle du démarrage. */
export function displayedYear(today: Date = new Date()): number {
  return Math.max(today.getFullYear(), FUND_START.year);
}

/**
 * Les mois de l'année en cours, du démarrage de la caisse jusqu'à décembre.
 *
 * Le calcul se fait année par année : l'avance maximale qu'un membre peut
 * prendre, c'est le nombre de mois qui restent avant la fin de l'année.
 */
export function buildPeriods(today: Date = new Date()): MonthPeriod[] {
  const year = displayedYear(today);
  const first = Math.max(0, absoluteMonth(year, 1) - FUND_START_ABS);
  const last = absoluteMonth(year, 12) - FUND_START_ABS;

  return Array.from({ length: last - first + 1 }, (_, offset) => periodAt(first + offset));
}

export function monthsFromAmount(amountAr: number): number {
  return amountAr / MONTHLY_DUE_AR;
}

/** Une cotisation, par opposition à une participation ponctuelle. */
export function isDue(contribution: Contribution): boolean {
  return contribution.kind !== 'oneOff';
}

const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

/**
 * Trie les membres par ordre alphabétique, comme ils s'affichent : prénom puis nom.
 * Le titre (« tonton », « dr ») n'entre pas dans le tri.
 */
export function sortMembers(members: FamilyMember[]): FamilyMember[] {
  return [...members].sort(
    (a, b) =>
      collator.compare(a.firstName, b.firstName) || collator.compare(a.lastName ?? '', b.lastName ?? ''),
  );
}

/**
 * Les membres du plus gros total versé au plus petit, ceux qui n'ont rien versé
 * en fin de liste. Contrairement à `rankPayers`, personne n'est écarté : c'est
 * l'ordre de la liste de gauche, elle doit rester complète.
 */
export function sortMembersByAmount(
  members: FamilyMember[],
  summaries: Map<string, MemberSummary>,
): FamilyMember[] {
  const paidBy = (member: FamilyMember) => summaries.get(member.id)?.totalPaidAr ?? 0;

  return [...members].sort(
    (a, b) =>
      paidBy(b) - paidBy(a) ||
      collator.compare(a.firstName, b.firstName) ||
      collator.compare(a.lastName ?? '', b.lastName ?? ''),
  );
}

/**
 * Classement des payeurs, du plus gros total au plus petit.
 * Le total additionne les cotisations et les participations ponctuelles : c'est
 * ce que la personne a mis dans la caisse, quelle qu'en soit la raison.
 * À égalité, l'ordre alphabétique tranche.
 *
 * Personne n'est écarté : ceux qui n'ont rien versé ferment le classement, à
 * zéro. Un classement qui cache les absents ne dit pas qui il manque.
 */
export function rankPayers(summaries: MemberSummary[]): MemberSummary[] {
  return [...summaries].sort(
    (a, b) =>
      b.totalPaidAr - a.totalPaidAr ||
      collator.compare(a.member.firstName, b.member.firstName) ||
      collator.compare(a.member.lastName ?? '', b.member.lastName ?? ''),
  );
}

export function summarizeMember(
  member: FamilyMember,
  contributions: Contribution[],
  periods: MonthPeriod[],
  today: Date = new Date(),
): MemberSummary {
  const paid = contributions.filter((contribution) => contribution.memberId === member.id);

  /*
   * Seules les cotisations deviennent des mois payés. Une participation
   * ponctuelle entre dans la caisse mais ne couvre aucune échéance : elle est
   * comptée à part pour ne pas donner de l'avance à qui n'en a pas.
   */
  const duesPaidAr = sum(paid.filter(isDue).map((contribution) => contribution.amountAr));
  const oneOffPaidAr = sum(paid.filter((contribution) => !isDue(contribution)).map((c) => c.amountAr));
  const totalPaidAr = duesPaidAr + oneOffPaidAr;

  const currentIndex = currentPeriodIndex(today);
  const monthsExpected = Math.max(0, currentIndex + 1);
  const monthsCovered = monthsFromAmount(duesPaidAr);
  const fullMonthsCovered = Math.floor(monthsCovered);

  const months: MemberMonth[] = periods.map((period) => {
    const progress = Math.min(1, Math.max(0, monthsCovered - period.index));
    const amountAr = Math.round(progress * MONTHLY_DUE_AR);

    let status: MonthStatus;
    if (progress >= 1) status = 'paid';
    else if (period.index < currentIndex) status = 'late';
    else if (period.index === currentIndex) status = 'due';
    else status = 'upcoming';

    return { period, status, progress, amountAr };
  });

  /*
   * Le retard se compte depuis le démarrage de la caisse, pas depuis le premier
   * mois affiché : un mois impayé de l'année précédente reste un retard.
   */
  const lateCount = Math.max(0, currentIndex - fullMonthsCovered);
  const aheadCount = Math.max(0, fullMonthsCovered - monthsExpected);
  const remainingAr = Math.max(0, monthsExpected * MONTHLY_DUE_AR - duesPaidAr);

  // Tout ce qui est à couvrir d'ici décembre de l'année affichée.
  const lastIndex = periods.length > 0 ? periods[periods.length - 1].index : currentIndex;
  const yearFullMonths = months.filter((month) => month.progress >= 1).length;
  const overflowMonths = Math.max(0, monthsCovered - (lastIndex + 1));

  return {
    member,
    months,
    totalPaidAr,
    duesPaidAr,
    oneOffPaidAr,
    monthsCovered,
    fullMonthsCovered,
    monthsExpected,
    lateCount,
    aheadCount,
    remainingAr,
    year: periods[0]?.year ?? displayedYear(today),
    yearFullMonths,
    yearRemainingMonths: months.length - yearFullMonths,
    yearRemainingAr: Math.max(0, (lastIndex + 1) * MONTHLY_DUE_AR - duesPaidAr),
    overflowMonths,
    ...describeStatus({
      currentIndex,
      lateCount,
      monthsCovered,
      remainingAr,
      yearFullMonths,
      yearMonths: months.length,
      overflowMonths,
      oneOffPaidAr,
    }),
  };
}

/*
 * Le statut se lit toujours sur l'année affichée : « 3 / 4 mois payés ».
 * Compter l'avance depuis septembre 2026 donnerait « 6 mois d'avance » sur une
 * année qui n'en compte que 4 — c'est ce qui prêtait à confusion.
 */
function describeStatus(input: {
  currentIndex: number;
  lateCount: number;
  monthsCovered: number;
  remainingAr: number;
  yearFullMonths: number;
  yearMonths: number;
  overflowMonths: number;
  oneOffPaidAr: number;
}): { tone: MemberTone; statusLabel: string } {
  const { currentIndex, lateCount, monthsCovered, remainingAr, yearFullMonths, yearMonths } = input;

  const paidOfYear = `${yearFullMonths} / ${yearMonths} mois payés`;

  // L'année est bouclée ; le trop-versé est annoncé, pas effacé.
  const carried = Math.floor(input.overflowMonths);
  const yearDone = carried > 0 ? `Année couverte · +${carried} mois` : 'Année couverte';

  if (currentIndex < 0) {
    if (yearFullMonths >= yearMonths) return { tone: 'ahead', statusLabel: yearDone };
    if (yearFullMonths > 0) return { tone: 'ahead', statusLabel: paidOfYear };
    if (monthsCovered > 0) return { tone: 'ahead', statusLabel: 'Versement partiel' };

    // Une participation ponctuelle n'est pas rien : ne pas dire « rien versé ».
    if (input.oneOffPaidAr > 0) return { tone: 'idle', statusLabel: 'Aucune cotisation' };
    return { tone: 'idle', statusLabel: 'Pas encore versé' };
  }

  if (lateCount > 0) {
    return { tone: 'late', statusLabel: `${lateCount} mois de retard` };
  }

  if (remainingAr > 0) {
    return { tone: 'due', statusLabel: 'Mois en cours à payer' };
  }

  if (yearFullMonths >= yearMonths) {
    return { tone: 'ahead', statusLabel: yearDone };
  }

  return { tone: 'ok', statusLabel: paidOfYear };
}

/**
 * Tous les mouvements, du plus récent au plus ancien.
 * `limit` ne sert qu'aux aperçus : l'écran, lui, les affiche tous et laisse
 * défiler — sinon il n'y a aucun moyen de retrouver un vieux versement.
 */
export function buildActivity(snapshot: FundSnapshot, limit?: number): ActivityEntry[] {
  const membersById = new Map(snapshot.members.map((member) => [member.id, member]));

  const contributions: ActivityEntry[] = snapshot.contributions.flatMap((contribution) => {
    const member = contribution.memberId ? membersById.get(contribution.memberId) : undefined;

    // Un versement rattaché à un membre effacé n'a plus rien à dire.
    if (contribution.memberId && !member) return [];

    const due = isDue(contribution);

    return [{
      kind: 'contribution' as const,
      id: contribution.id,
      date: contribution.date,
      ...(member ? { member } : {}),
      amountAr: contribution.amountAr,
      monthsGranted: due ? monthsFromAmount(contribution.amountAr) : 0,
      oneOff: !due,
      note: contribution.note,
    }];
  });

  const expenses: ActivityEntry[] = snapshot.expenses.map((expense) => ({
    kind: 'expense' as const,
    id: expense.id,
    date: expense.date,
    expense,
    amountAr: expense.amountAr,
    ...(expense.memberId ? { member: membersById.get(expense.memberId) } : {}),
  }));

  const all = [...contributions, ...expenses].sort((a, b) => b.date.localeCompare(a.date));

  return limit === undefined ? all : all.slice(0, limit);
}

export interface FundTotals {
  balanceAr: number;
  collectedAr: number;
  spentAr: number;
  monthIncomeAr: number;
  monthExpenseAr: number;
}

export function computeTotals(snapshot: FundSnapshot, today: Date = new Date()): FundTotals {
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const inCurrentMonth = (date: string) => date.startsWith(monthKey);

  const collectedAr = sum(snapshot.contributions.map((item) => item.amountAr));
  const spentAr = sum(snapshot.expenses.map((item) => item.amountAr));

  return {
    collectedAr,
    spentAr,
    balanceAr: collectedAr - spentAr,
    monthIncomeAr: sum(snapshot.contributions.filter((i) => inCurrentMonth(i.date)).map((i) => i.amountAr)),
    monthExpenseAr: sum(snapshot.expenses.filter((i) => inCurrentMonth(i.date)).map((i) => i.amountAr)),
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
