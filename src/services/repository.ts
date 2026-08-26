import { LocalFinanceRepository } from './localFinanceRepository';

/**
 * L'unique dépôt de données de l'application.
 *
 * Isolé dans son propre module parce que deux endroits y touchent : `FundGate`,
 * qui lui remet les données de départ une fois le paquet scellé ouvert, et
 * `App`, qui lit et écrit ensuite. Le jour où Supabase remplace le stockage
 * local, c'est cette ligne qui change, et elle seule.
 */
export const repository = new LocalFinanceRepository();
