import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

/*
 * Connexion par lien magique : on saisit son adresse, on reçoit un lien, on
 * clique. Pas de mot de passe à créer, à retenir ni à réinitialiser — pour une
 * famille, c'est ce qui passe le mieux.
 *
 * Les inscriptions doivent être fermées dans le tableau de bord Supabase :
 * sans ça, n'importe qui pourrait se créer un compte et lire la caisse.
 */

/** Envoie le lien de connexion. Renvoie un message d'erreur, ou `null`. */
export async function sendMagicLink(email: string): Promise<string | null> {
  const client = getSupabase();
  if (!client) return 'Supabase n’est pas configuré.';

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      // Le lien ramène sur la page d'où il est parti, sous-répertoire compris.
      emailRedirectTo: window.location.href.split('#')[0],
      shouldCreateUser: false,
    },
  });

  if (!error) return null;

  /*
   * Supabase distingue « compte inconnu » d'une erreur technique. On le dit
   * clairement : la famille est invitée à la main, une adresse inconnue est
   * presque toujours une faute de frappe.
   */
  return /signups? not allowed|user not found/i.test(error.message)
    ? 'Cette adresse n’est pas encore invitée. Demande au responsable de la caisse.'
    : error.message;
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  return data.session;
}

/** Prévient à chaque connexion ou déconnexion. Renvoie de quoi se désabonner. */
export function onAuthChange(listener: (session: Session | null) => void): () => void {
  const client = getSupabase();
  if (!client) return () => {};

  const { data } = client.auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Est-ce que ce compte a le droit d'écrire ?
 *
 * La réponse fait autorité côté base (règles RLS) : ici, elle sert seulement à
 * ne pas afficher un écran de saisie dont chaque bouton échouerait.
 */
export async function fetchIsAdmin(): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { data, error } = await client.from('app_users').select('is_admin').maybeSingle();
  return !error && Boolean(data?.is_admin);
}
