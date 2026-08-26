import { DEFAULT_EUR_RATE_AR, DEFAULT_EUR_RATE_SINCE } from '../config/fund';
import type {
  FundSnapshot,
  NewContribution,
  NewExpense,
  NewMember,
} from '../domain/models';
import { createSlugId } from '../utils/id';
import type { FinanceRepository } from './financeRepository';

/*
 * La version fait partie de la clé : la remonter d'un cran fait repartir tous
 * les appareils de zéro, sans quoi les données déjà écrites dans le navigateur
 * survivraient au rechargement.
 */
/** Point de départ : une caisse vide. Les vraies données vivent dans Supabase. */
const EMPTY_FUND: FundSnapshot = {
  members: [],
  contributions: [],
  expenses: [],
  eurRates: [{ rateAr: DEFAULT_EUR_RATE_AR, since: DEFAULT_EUR_RATE_SINCE }],
};

const STORAGE_KEY = 'famili.fund.v2';

/** Anciennes clés, effacées au premier chargement pour ne rien laisser traîner. */
const LEGACY_KEYS = ['famili.fund.v1'];

/**
 * Stockage dans le navigateur, en attendant Supabase.
 *
 * Attention : les données restent sur l'appareil qui les a saisies.
 * Elles ne sont pas partagées entre téléphones tant qu'il n'y a pas de serveur.
 */
export class LocalFinanceRepository implements FinanceRepository {
  async getFundSnapshot(): Promise<FundSnapshot> {
    return this.read();
  }

  async addContribution(input: NewContribution): Promise<FundSnapshot> {
    const snapshot = this.read();
    snapshot.contributions = [...snapshot.contributions, { ...input, id: createId('c') }];
    return this.write(snapshot);
  }

  async addExpense(input: NewExpense): Promise<FundSnapshot> {
    const snapshot = this.read();
    snapshot.expenses = [...snapshot.expenses, { ...input, id: createId('e') }];
    return this.write(snapshot);
  }

  async addMember(input: NewMember): Promise<FundSnapshot> {
    const snapshot = this.read();
    const id = createSlugId(
      [input.firstName, input.lastName].filter(Boolean).join('-'),
      snapshot.members.map((item) => item.id),
      'membre',
    );

    snapshot.members = [...snapshot.members, { ...input, id }];
    return this.write(snapshot);
  }

  /**
   * Remplace les champs saisis, garde l'identifiant.
   * Un champ absent de `input` est effacé : c'est ce qu'on attend d'une
   * correction (vider la note doit bien vider la note).
   */
  async updateContribution(id: string, input: NewContribution): Promise<FundSnapshot> {
    const snapshot = this.read();
    snapshot.contributions = snapshot.contributions.map((contribution) =>
      contribution.id === id ? { ...input, id } : contribution,
    );
    return this.write(snapshot);
  }

  async deleteContribution(id: string): Promise<FundSnapshot> {
    const snapshot = this.read();
    snapshot.contributions = snapshot.contributions.filter((item) => item.id !== id);
    return this.write(snapshot);
  }

  /**
   * Corrige l'identité d'un membre.
   * Les versements pointent sur l'identifiant, qui ne bouge pas : renommer
   * quelqu'un ne détache aucune de ses entrées.
   */
  async updateMember(id: string, input: NewMember): Promise<FundSnapshot> {
    const snapshot = this.read();
    snapshot.members = snapshot.members.map((member) =>
      member.id === id ? { ...member, ...input, id } : member,
    );
    return this.write(snapshot);
  }

  /**
   * Empile le nouveau taux en tête de l'historique.
   * Les versements et les dépenses ne sont pas touchés : ils sont en ariary,
   * seule leur contrepartie en euros suit le nouveau taux.
   */
  async setEurRate(rateAr: number, since: string): Promise<FundSnapshot> {
    const snapshot = this.read();
    snapshot.eurRates = [{ rateAr, since }, ...snapshot.eurRates];
    return this.write(snapshot);
  }

  /** Vide les saisies de cet appareil. */
  async reset(): Promise<FundSnapshot> {
    return this.write(structuredClone(EMPTY_FUND));
  }

  private read(): FundSnapshot {
    try {
      for (const key of LEGACY_KEYS) localStorage.removeItem(key);

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const snapshot = JSON.parse(raw) as FundSnapshot;

        // Données enregistrées avant que le taux ne devienne modifiable.
        if (!snapshot.eurRates?.length) {
          snapshot.eurRates = [{ rateAr: DEFAULT_EUR_RATE_AR, since: DEFAULT_EUR_RATE_SINCE }];
        }

        return snapshot;
      }
    } catch {
      // Stockage indisponible (navigation privée, quota) : on repart du modèle.
    }

    return structuredClone(EMPTY_FUND);
  }

  private write(snapshot: FundSnapshot): FundSnapshot {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // L'enregistrement échoue silencieusement : l'écran reste juste à jour
      // pour la session en cours.
    }

    return snapshot;
  }
}

function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${random}`;
}
