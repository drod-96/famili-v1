import { useState } from 'react';
import type { EurRate } from '../../domain/models';
import { MONTHLY_DUE_AR } from '../../config/fund';
import { formatAmount, formatLongDate, formatRate, toDateKey } from '../../utils/format';
import { Card } from '../Card';
import { Field } from './Field';

interface EurRateFormProps {
  /** Taux en vigueur, en tête de l'historique. */
  current: EurRate;
  /** Historique complet, du plus récent au plus ancien. */
  history: EurRate[];
  balanceAr: number;
  today: Date;
  onSubmit: (rateAr: number, since: string) => Promise<void>;
}

/**
 * Change le taux € → Ar.
 *
 * Rien n'est réécrit : les montants sont stockés en ariary et le restent. Le
 * nouveau taux sert à convertir les saisies faites en euros à partir de
 * maintenant, et il donne la contrepartie en euros de tout ce qui est affiché.
 */
export function EurRateForm({ current, history, balanceAr, today, onSubmit }: EurRateFormProps) {
  const [rate, setRate] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const typedRate = Number(rate);
  const valid = rate.trim() !== '' && Number.isFinite(typedRate) && typedRate > 0;
  const changed = valid && typedRate !== current.rateAr;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!changed || saving) return;

    // Le taux prend effet au moment où on l'enregistre : pas de date à saisir.
    const since = toDateKey(today);

    setSaving(true);
    try {
      await onSubmit(typedRate, since);
      setFeedback(`Taux appliqué : ${formatRate(typedRate)} depuis le ${formatIsoDate(since)}.`);
      setRate('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="admin-card admin-card--rate">
      <header className="admin-card__head">
        <span className="admin-card__badge admin-card__badge--rate" aria-hidden="true">€</span>
        <div>
          <h2 className="admin-card__title">Taux de change</h2>
          <p className="admin-card__subtitle">
            Combien d’ariary vaut un euro. Saisi à la main, aucune API n’est appelée.
          </p>
        </div>
      </header>

      <p className="rate-current">
        <strong>{formatRate(current.rateAr)}</strong>
        <span>appliqué depuis le {formatIsoDate(current.since)}</span>
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <Field
          label="Nouveau taux"
          htmlFor="rate-value"
          hint={
            changed
              ? `${formatAmount(MONTHLY_DUE_AR, 'MGA')} vaudront ${eurAt(MONTHLY_DUE_AR, typedRate)} · le solde, ${eurAt(balanceAr, typedRate)}`
              : `Aujourd’hui, ${formatAmount(MONTHLY_DUE_AR, 'MGA')} = ${eurAt(MONTHLY_DUE_AR, current.rateAr)}`
          }
        >
          <div className="rate-input">
            <span className="rate-input__prefix">1 € =</span>
            <input
              id="rate-value"
              className="input"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              placeholder={String(current.rateAr)}
              value={rate}
              onChange={(event) => {
                setRate(event.target.value);
                setFeedback('');
              }}
              required
            />
            <span className="rate-input__suffix">Ar</span>
          </div>
        </Field>

        <div className="form__actions">
          <button type="submit" className="button button--rate" disabled={!changed || saving}>
            {saving ? 'Enregistrement…' : 'Appliquer le taux'}
          </button>
          {feedback && <p className="form__feedback form__feedback--rate">{feedback}</p>}
        </div>
      </form>

      <p className="admin-card__note">
        Les montants déjà enregistrés <strong>ne bougent pas</strong> : ils sont stockés en
        ariary. C’est leur contrepartie en euros qui suit le taux, et les saisies faites en
        euros à partir de maintenant sont converties à ce nouveau taux.
      </p>

      {history.length > 1 && (
        <ul className="rate-history" aria-label="Taux précédents">
          {history.slice(1, 4).map((entry, position) => (
            <li key={`${entry.since}-${entry.rateAr}-${position}`}>
              <span>{formatRate(entry.rateAr)}</span>
              <span>du {formatIsoDate(entry.since)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Ce que vaut un montant en ariary à un taux donné.
 * `formatAmount` ne sait convertir qu'au taux en vigueur : ici on veut montrer
 * l'effet d'un taux qui n'est pas encore appliqué.
 */
function eurAt(amountAr: number, rateAr: number): string {
  return eurFormatter.format(amountAr / rateAr);
}

function formatIsoDate(isoDate: string): string {
  return formatLongDate(new Date(`${isoDate}T12:00:00`));
}
