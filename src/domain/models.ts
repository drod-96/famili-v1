/** Monnaie d'affichage. Les montants sont TOUJOURS stockés en ariary. */
export type DisplayCurrency = 'MGA' | 'EUR';

export type MemberColor = 'teal' | 'blue' | 'violet' | 'amber' | 'coral' | 'green';

export interface FamilyMember {
  id: string;
  /** Titre affiché devant le nom : « Tonton », « Dr », « PDG », « Maire »… */
  title?: string;
  firstName: string;
  lastName?: string;
  color: MemberColor;
  avatarUrl?: string | null;
  /** Responsable de la caisse. */
  isAdmin?: boolean;
}

/**
 * Ce que couvre un versement.
 *
 * - `monthly` : une cotisation, convertie en mois payés.
 * - `oneOff`  : une participation ponctuelle (un anniversaire, un événement).
 *   L'argent entre bien dans la caisse, mais il ne couvre aucun mois.
 */
export type ContributionKind = 'monthly' | 'oneOff';

/** Un versement dans la caisse. */
export interface Contribution {
  id: string;
  /**
   * Absent quand le versement n'est rattaché à aucun membre : un complément de
   * caisse, l'écart entre le total d'un relevé et le détail qui l'accompagne.
   */
  memberId?: string;
  /** Montant versé, en ariary (toujours positif). */
  amountAr: number;
  /** Date ISO `YYYY-MM-DD`. */
  date: string;
  /** Absent = cotisation : c'était le seul cas avant les participations ponctuelles. */
  kind?: ContributionKind;
  note?: string;
}

export type ExpenseCategory = 'event' | 'health' | 'support' | 'admin' | 'other';

/** Une sortie d'argent de la caisse. */
export interface FundExpense {
  id: string;
  label: string;
  /** Montant dépensé, en ariary (toujours positif). */
  amountAr: number;
  /** Date ISO `YYYY-MM-DD`. */
  date: string;
  category: ExpenseCategory;
  /** Une sortie peut concerner un membre, mais ce n'est pas obligatoire. */
  memberId?: string | null;
}

/**
 * Taux de change saisi à la main : 1 € = `rateAr` ariary.
 *
 * Les montants sont stockés en ariary et ne bougent jamais : changer le taux
 * ne change que leur équivalent en euros, et le taux retenu pour convertir une
 * saisie faite en euros à partir de ce moment-là.
 */
export interface EurRate {
  rateAr: number;
  /** Date ISO `YYYY-MM-DD` à laquelle ce taux a pris effet. */
  since: string;
}

export interface FundSnapshot {
  members: FamilyMember[];
  contributions: Contribution[];
  expenses: FundExpense[];
  /** Historique des taux, du plus récent au plus ancien. Le premier est en vigueur. */
  eurRates: EurRate[];
}

/** Saisies de la page admin (l'identifiant est généré par le repository). */
export type NewContribution = Omit<Contribution, 'id'>;
export type NewExpense = Omit<FundExpense, 'id'>;

export type NewMember = Omit<FamilyMember, 'id'>;
