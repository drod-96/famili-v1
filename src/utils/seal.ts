import type { FundSnapshot } from '../domain/models';

/*
 * Les données de la caisse sont scellées avant d'entrer dans le dépôt.
 *
 * Le site est public : sans ça, n'importe qui tombant sur l'adresse — ou sur le
 * dépôt — lirait les noms de la famille et ce que chacun a donné. Le paquet
 * publié ne contient donc que du chiffré, et il faut la phrase de la famille
 * pour l'ouvrir.
 *
 * AES-GCM 256 bits, clé dérivée de la phrase par PBKDF2-SHA256. Chiffrement
 * symétrique et non RSA : on protège un fichier, on n'échange pas de clés.
 * Tout vient de l'API Web Crypto du navigateur, aucune dépendance.
 */

/** Coût de la dérivation : assez élevé pour rendre l'essai en masse pénible. */
export const PBKDF2_ITERATIONS = 310_000;

export const SALT_BYTES = 16;
export const IV_BYTES = 12;

export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Ouvre le paquet scellé.
 * Renvoie `null` si la phrase est fausse : AES-GCM authentifie ce qu'il
 * déchiffre, une mauvaise clé fait échouer l'opération plutôt que de rendre
 * n'importe quoi.
 */
export async function unseal(sealed: string, passphrase: string): Promise<FundSnapshot | null> {
  try {
    const bytes = base64ToBytes(sealed);
    const salt = bytes.slice(0, SALT_BYTES);
    const iv = bytes.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const payload = bytes.slice(SALT_BYTES + IV_BYTES);

    const key = await deriveKey(passphrase, salt);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      payload as BufferSource,
    );

    return JSON.parse(new TextDecoder().decode(plain)) as FundSnapshot;
  } catch {
    return null;
  }
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
