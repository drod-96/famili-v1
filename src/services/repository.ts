import type { FinanceRepository } from './financeRepository';
import { LocalFinanceRepository } from './localFinanceRepository';
import { SupabaseFinanceRepository } from './supabaseFinanceRepository';
import { getSupabase } from './supabaseClient';

/**
 * L'unique dépôt de données de l'application.
 *
 * Deux implémentations, choisies au démarrage selon la configuration :
 *
 * - **Supabase**, dès que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont
 *   définies. Les données sont partagées : ce que le responsable saisit, tout
 *   le monde le voit.
 * - **Stockage local** sinon, sur une caisse vide. C'est ce qui permet de
 *   lancer `npm run dev` sans compte Supabase, pas un mode de consultation.
 *
 * Les composants ne savent pas laquelle des deux ils utilisent.
 */
function create(): FinanceRepository {
  const client = getSupabase();
  return client ? new SupabaseFinanceRepository(client) : new LocalFinanceRepository();
}

export const repository = create();

/**
 * Le dépôt local, quand c'est lui qui tourne.
 * L'espace admin lui propose la remise à zéro, ce qui n'aurait aucun sens sur
 * une base partagée.
 */
export const localRepository = repository instanceof LocalFinanceRepository ? repository : null;
