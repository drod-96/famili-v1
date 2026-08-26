/**
 * Identifiant lisible dérivé d'un libellé, suffixé s'il est déjà pris.
 * « Jean Michel » → `jean-michel`, puis `jean-michel-2` si besoin.
 *
 * Partagé par les deux dépôts de données : un membre créé en local et le même
 * créé dans Supabase doivent porter le même identifiant.
 */
export function createSlugId(label: string, taken: string[], fallback: string): string {
  const base =
    label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || fallback;

  if (!taken.includes(base)) return base;

  let suffix = 2;
  while (taken.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
