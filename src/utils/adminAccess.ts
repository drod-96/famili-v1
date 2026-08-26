import { ADMIN_PASSWORD_SHA256, ADMIN_SESSION_KEY } from '../config/admin';

/** Empreinte SHA-256 d'un texte, en hexadécimal. */
async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

export async function checkPassword(password: string): Promise<boolean> {
  return (await sha256(password)) === ADMIN_PASSWORD_SHA256;
}

/** L'accès reste ouvert tant que l'onglet n'est pas fermé. */
export function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function rememberUnlocked(): void {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  } catch {
    // Stockage indisponible : l'accès vaut alors seulement pour l'affichage en cours.
  }
}

export function forgetUnlocked(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Rien à faire : sans stockage, il n'y avait rien à oublier.
  }
}
