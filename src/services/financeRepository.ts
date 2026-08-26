import type { FundSnapshot, NewContribution, NewExpense, NewMember } from '../domain/models';

/**
 * Frontière de données de la caisse familiale.
 * L'implémentation locale pourra être remplacée par Supabase sans toucher à l'UI.
 *
 * Les méthodes d'écriture renvoient l'état complet après enregistrement,
 * ce qui évite à l'UI de recharger séparément.
 */
export interface FinanceRepository {
  getFundSnapshot(): Promise<FundSnapshot>;
  addContribution(input: NewContribution): Promise<FundSnapshot>;
  addExpense(input: NewExpense): Promise<FundSnapshot>;
  /** Crée le membre, et la famille en même temps si elle n'existe pas encore. */
  addMember(input: NewMember): Promise<FundSnapshot>;

  /** Corrige une entrée existante. L'identifiant, lui, ne change jamais. */
  updateContribution(id: string, input: NewContribution): Promise<FundSnapshot>;
  /** Supprime une entrée saisie par erreur. */
  deleteContribution(id: string): Promise<FundSnapshot>;
  /** Corrige un membre : titre, prénom, nom, couleur. Ses versements ne bougent pas. */
  updateMember(id: string, input: NewMember): Promise<FundSnapshot>;
  /**
   * Change le taux € → Ar en vigueur.
   * Aucun montant déjà enregistré n'est réécrit : tout est stocké en ariary.
   */
  setEurRate(rateAr: number, since: string): Promise<FundSnapshot>;
  /**
   * Efface les saisies de l'appareil et repart des données de départ.
   * Propre au stockage local : une base partagée n'aura pas à l'implémenter.
   */
  reset?(): Promise<FundSnapshot>;
}
