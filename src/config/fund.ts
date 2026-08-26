/**
 * Réglages de la caisse familiale.
 * Tout ce qui se règle « à la main » est regroupé ici.
 */

/** Nom complet de la caisse (titre de l'onglet, en-têtes). */
export const FUND_NAME = 'Caisse Familiale Andamboly';

/** Nom court affiché en gros dans l'en-tête. */
export const FUND_SHORT_NAME = 'Andamboly';

/** Ligne secondaire de l'en-tête. */
export const FUND_TAGLINE = 'Caisse familiale';

/**
 * Annonce affichée en haut du tableau de bord, sous la pastille « Actu ».
 * Mettre `null` pour ne rien afficher.
 */
export const FUND_ANNOUNCEMENT: string | null = null;


/** Cotisation due par membre et par mois, en ariary. */
export const MONTHLY_DUE_AR = 10_000;

/** Premier mois de la caisse : septembre 2026. */
export const FUND_START = { year: 2026, month: 9 } as const;

/**
 * Taux de change de départ (pas d'API).
 * 1 € = DEFAULT_EUR_RATE_AR ariary.
 *
 * Ce n'est que la valeur initiale : le taux en vigueur se change ensuite
 * depuis l'espace admin, et il est enregistré avec les données de la caisse.
 */
export const DEFAULT_EUR_RATE_AR = 5_100;

/** Date à laquelle ce taux de départ a pris effet. */
export const DEFAULT_EUR_RATE_SINCE = '2026-08-25';
