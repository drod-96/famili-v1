/**
 * Raccordement à Supabase.
 *
 * Les deux valeurs viennent de l'environnement de compilation, jamais du code :
 * `.env.local` en développement, et les *secrets* du dépôt pour le déploiement.
 *
 * La clé « anon » n'est pas un secret : elle est publique par conception et se
 * retrouve dans le paquet publié. Ce qui protège les données, ce sont les
 * règles RLS de la base, pas le fait de cacher cette clé. La clé *service role*,
 * elle, ne doit jamais approcher le navigateur.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Tant que ce n'est pas configuré, l'application retombe sur le stockage local
 * et le paquet scellé : `npm run dev` marche sans compte Supabase.
 */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
