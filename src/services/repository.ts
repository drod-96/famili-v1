import { isSupabaseConfigured } from '../config/supabase';
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
 * - **Stockage local** sinon, avec le paquet scellé comme point de départ.
 *   C'est ce qui permet de lancer `npm run dev` sans compte Supabase.
 *
 * Les composants ne savent pas laquelle des deux ils utilisent.
 */
function create(): FinanceRepository {
  const client = getSupabase();
  return client ? new SupabaseFinanceRepository(client) : new LocalFinanceRepository();
}

export const repository = create();

/** Vrai quand les données sont partagées entre tous les appareils. */
export const isShared = isSupabaseConfigured();

/**
 * Le dépôt local, quand c'est lui qui tourne.
 * `FundGate` lui remet les données de départ, et l'espace admin propose la
 * remise à zéro — deux choses qui n'ont aucun sens avec une base partagée.
 */
export const localRepository = repository instanceof LocalFinanceRepository ? repository : null;
