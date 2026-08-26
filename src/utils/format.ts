import { DEFAULT_EUR_RATE_AR, DEFAULT_EUR_RATE_SINCE } from '../config/fund';
import type { DisplayCurrency, EurRate, FundSnapshot } from '../domain/models';

const arFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/*
 * Taux en vigueur, tenu à jour par `App` à partir des données enregistrées.
 *
 * Il est gardé ici plutôt que passé à chaque appel : `formatAmount` sert dans
 * presque tous les écrans, et le taux est une donnée unique pour toute
 * l'application. Les montants, eux, restent stockés en ariary : changer le taux
 * ne touche à aucune écriture, il ne change que l'équivalent affiché en euros.
 */
let eurRateAr = DEFAULT_EUR_RATE_AR;

/** Taux appliqué à toutes les conversions : 1 € = X ariary. */
export function getEurRateAr(): number {
  return eurRateAr;
}

/** Change le taux appliqué. Une valeur absurde (≤ 0) est ignorée. */
export function setEurRateAr(rateAr: number): void {
  if (Number.isFinite(rateAr) && rateAr > 0) eurRateAr = rateAr;
}

/** Le taux en vigueur, tel qu'enregistré avec les données de la caisse. */
export function currentEurRate(snapshot: FundSnapshot): EurRate {
  return snapshot.eurRates?.[0] ?? { rateAr: DEFAULT_EUR_RATE_AR, since: DEFAULT_EUR_RATE_SINCE };
}

/** « 1 € = 5 100 Ar ». */
export function formatRate(rateAr: number): string {
  return `1 € = ${arFormatter.format(rateAr)} Ar`;
}

/** Convertit un montant en ariary vers la monnaie d'affichage choisie. */
export function toDisplayValue(amountAr: number, currency: DisplayCurrency): number {
  return currency === 'EUR' ? amountAr / eurRateAr : amountAr;
}

/**
 * Convertit un montant saisi dans une monnaie vers des ariary.
 * Tout est stocké en ariary : la saisie en euros est convertie ici, une fois,
 * au taux en vigueur au moment de l'enregistrement.
 */
export function toAriary(value: number, currency: DisplayCurrency): number {
  return Math.round(currency === 'EUR' ? value * eurRateAr : value);
}

/** Formate un montant stocké en ariary dans la monnaie d'affichage choisie. */
export function formatAmount(amountAr: number, currency: DisplayCurrency): string {
  if (currency === 'EUR') return eurFormatter.format(amountAr / eurRateAr);
  return `${arFormatter.format(amountAr)} Ar`;
}

/** Même chose, mais avec un signe explicite (`+` / `−`). */
export function formatSignedAmount(amountAr: number, currency: DisplayCurrency): string {
  const sign = amountAr > 0 ? '+' : amountAr < 0 ? '−' : '';
  return `${sign}${formatAmount(Math.abs(amountAr), currency)}`;
}

/**
 * « 2 mois », « 2,5 mois ». Le mot « mois » est invariable.
 *
 * Les décimales sont tronquées, jamais arrondies : 9 996 Ar doit afficher
 * « 0,99 mois » et non « 1 mois », sinon on annonce un mois qui n'est pas couvert.
 */
export function formatMonths(months: number): string {
  const truncated = Math.floor(months * 100) / 100;
  const value = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(truncated);
  return `${value} mois`;
}

export function formatActivityDate(isoDate: string, today: Date = new Date()): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isoDate === toDateKey(today)) return "Aujourd'hui";
  if (isoDate === toDateKey(yesterday)) return 'Hier';

  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
