/**
 * Accès à l'espace admin.
 *
 * Le mot de passe n'est pas stocké en clair : seule son empreinte SHA-256 l'est.
 *
 * Pour le changer, générer l'empreinte du nouveau mot de passe :
 *
 *   echo -n "mon-nouveau-mot-de-passe" | sha256sum
 *
 * puis coller le résultat ci-dessous.
 *
 * ⚠️  Cette vérification a lieu dans le navigateur. Elle empêche l'accès
 * accidentel, mais ne protège pas contre quelqu'un qui inspecte le code du site.
 * Seule une authentification côté serveur (Supabase) le fera vraiment.
 */

/** Mot de passe par défaut : « andamboly ». */
export const ADMIN_PASSWORD_SHA256 =
  '9d977df8dc3deda9a9823b37611bebea93844341e293f9a7b320b52f64f6c9d9';

/** Clé de session : l'accès est retenu jusqu'à la fermeture de l'onglet. */
export const ADMIN_SESSION_KEY = 'famili.admin.unlocked';
