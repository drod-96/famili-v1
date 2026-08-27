import type { Session } from '@supabase/supabase-js';
import { FAMILY_EMAIL, memberEmail } from '../config/accounts';
import { getSupabase } from './supabaseClient';

/*
 * Connexion par mot de passe, vérifié par Supabase.
 *
 * Le point important est *où* a lieu la vérification. Un mot de passe comparé
 * dans le navigateur ne protège rien : la clé publique du site permet
 * d'interroger la base sans jamais charger la page. Ici, c'est Supabase qui
 * tranche et qui délivre un jeton — sans ce jeton, la base ne répond pas.
 *
 * Deux niveaux, deux comptes :
 *
 * - le compte **famille**, partagé, qui ouvre la consultation ;
 * - le compte d'un **responsable**, qui ouvre en plus la saisie.
 *
 * Les inscriptions doivent rester fermées dans le tableau de bord : sans ça,
 * n'importe qui se créerait un compte et lirait la caisse.
 */

/** Traduit les erreurs de Supabase, qui arrivent en anglais. */
function readableError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Mot de passe incorrect.';
  if (/email not confirmed/i.test(message)) {
    return 'Ce compte n’est pas confirmé. Coche « Auto Confirm User » dans Supabase.';
  }
  if (/rate limit|too many requests/i.test(message)) {
    return 'Trop de tentatives. Patiente une minute avant de réessayer.';
  }
  return message;
}

/** Connecte, et renvoie un message d'erreur — ou `null` si c'est passé. */
async function signIn(email: string, password: string): Promise<string | null> {
  const client = getSupabase();
  if (!client) return 'Supabase n’est pas configuré.';

  const { error } = await client.auth.signInWithPassword({ email, password });
  return error ? readableError(error.message) : null;
}

/** Le mot de passe unique de la famille : c'est tout ce qui ouvre la caisse. */
export function signInAsFamily(password: string): Promise<string | null> {
  return signIn(FAMILY_EMAIL, password);
}

/**
 * Un responsable, par l'identifiant de sa fiche membre.
 *
 * Un membre marqué responsable mais sans compte donnera « Mot de passe
 * incorrect » : Supabase ne distingue pas les deux cas, exprès, pour ne pas
 * révéler quels comptes existent.
 */
export function signInAsMember(memberId: string, password: string): Promise<string | null> {
  return signIn(memberEmail(memberId), password);
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

/** Est-on connecté avec le compte partagé, plutôt qu'avec celui d'un responsable ? */
export function isFamilySession(session: Session | null): boolean {
  return session?.user.email === FAMILY_EMAIL;
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

/**
 * Les membres marqués responsables, pour la liste déroulante de connexion.
 *
 * Demande le compte partagé : la liste se lit une fois la caisse ouverte.
 */
export async function fetchAdminMembers(): Promise<{ id: string; name: string }[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('members')
    .select('id, first_name, last_name')
    .eq('is_admin', true)
    .order('first_name');

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(' '),
  }));
}
