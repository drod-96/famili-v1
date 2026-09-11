/**
 * Les comptes Supabase, et comment on leur parle.
 *
 * Supabase authentifie par adresse e-mail. La famille, elle, ne doit voir
 * qu'un mot de passe — et les responsables, qu'un nom. On tient donc les
 * adresses hors de l'écran : elles se déduisent d'un identifiant.
 *
 * Ces adresses ne reçoivent jamais rien et n'ont pas besoin d'exister. Le
 * domaine ci-dessous n'est qu'une convention pour les rendre uniques ; les
 * comptes se créent à la main dans le tableau de bord, avec *Auto Confirm
 * User* coché, ce qui évite toute vérification par mail.
 */

const ACCOUNT_DOMAIN = 'andamboly.fr';

/**
 * Le compte partagé, celui du mot de passe unique.
 *
 * Il ne donne que la lecture : la fonction `is_admin()` de la base l'écarte
 * d'office, et les règles RLS refusent donc toute écriture — même à quelqu'un
 * qui bricolerait la page.
 */
export const FAMILY_ACCOUNT_ID = 'famille';

/** L'adresse d'un compte, à partir de son identifiant. */
export function accountEmail(accountId: string): string {
  return `${accountId}@${ACCOUNT_DOMAIN}`;
}

/**
 * Le compte d'un responsable reprend l'identifiant de sa fiche membre
 * (« naina »), ce qui évite d'avoir à tenir une correspondance à part.
 *
 * La base fait la même déduction dans `is_admin()` : changer le domaine ici
 * demande de le changer aussi dans supabase/migrations/0001_init.sql.
 */
export const memberEmail = accountEmail;

export const FAMILY_EMAIL = accountEmail(FAMILY_ACCOUNT_ID);
