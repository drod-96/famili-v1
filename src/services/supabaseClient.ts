import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '../config/supabase';

let client: SupabaseClient | null = null;

/**
 * Le client Supabase, créé une seule fois.
 * `null` tant que le projet n'est pas configuré — l'application sait alors
 * qu'elle tourne en local.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  return client;
}
