import { useState } from 'react';
import { MONTHLY_DUE_AR } from '../../config/fund';
import type {
  ContributionKind,
  DisplayCurrency,
  FamilyMember,
  NewContribution,
} from '../../domain/models';
import { monthsFromAmount } from '../../utils/fund';
import { formatAmount, formatMonths, toAriary, toDateKey } from '../../utils/format';
import { Card } from '../Card';
import { CurrencyToggle } from '../CurrencyToggle';
import { Field } from './Field';
import { MemberSelect } from './MemberSelect';

interface ContributionFormProps {
  members: FamilyMember[];
  today: Date;
  onSubmit: (input: NewContribution) => Promise<void>;
}

export function ContributionForm({ members, today, onSubmit }: ContributionFormProps) {
  const [memberId, setMemberId] = useState('');
  const [kind, setKind] = useState<ContributionKind>('monthly');
  const [amount, setAmount] = useState('');
  const [inputCurrency, setInputCurrency] = useState<DisplayCurrency>('MGA');
  const [date, setDate] = useState(toDateKey(today));
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const oneOff = kind === 'oneOff';
  const typedAmount = Number(amount);
  const amountAr = toAriary(typedAmount, inputCurrency);
  const valid =
    Boolean(memberId) &&
    amount.trim() !== '' &&
    Number.isFinite(typedAmount) &&
    amountAr > 0 &&
    Boolean(date) &&
    // Une participation ponctuelle sans motif serait incompréhensible plus tard.
    (!oneOff || note.trim() !== '');
  const months = valid ? monthsFromAmount(amountAr) : 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || saving) return;

    setSaving(true);
    try {
      await onSubmit({
        memberId,
        amountAr,
        date,
        ...(oneOff ? { kind } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });

      setFeedback(
        oneOff
          ? `Participation enregistrée : ${formatAmount(amountAr, 'MGA')} (hors cotisation).`
          : `Entrée enregistrée : ${formatAmount(amountAr, 'MGA')} (+${formatMonths(months)}).`,
      );
      setAmount('');
      setNote('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="admin-card admin-card--in">
      <header className="admin-card__head">
        <span className="admin-card__badge admin-card__badge--in" aria-hidden="true">+</span>
        <div>
          <h2 className="admin-card__title">Nouvelle entrée</h2>
          <p className="admin-card__subtitle">
            Un versement d’un membre. Une cotisation devient des mois payés ; une
            participation ponctuelle entre dans la caisse sans couvrir de mois.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__row">
          <Field label="Payeur" htmlFor="contribution-member">
            <MemberSelect
              id="contribution-member"
              members={members}
              value={memberId}
              onChange={(value) => {
                setMemberId(value);
                setFeedback('');
              }}
            />
          </Field>

          <Field
            label="Nature du versement"
            htmlFor="contribution-kind"
            hint={oneOff ? 'Ne compte pas dans les mois payés' : 'Converti en mois payés'}
          >
            <select
              id="contribution-kind"
              className="input"
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as ContributionKind);
                setFeedback('');
              }}
            >
              <option value="monthly">Cotisation mensuelle</option>
              <option value="oneOff">Participation ponctuelle</option>
            </select>
          </Field>
        </div>

        <div className="form__row">
          <Field
            label="Montant versé"
            htmlFor="contribution-amount"
            hint={
              oneOff
                ? `Hors cotisation · enregistré ${formatAmount(amountAr > 0 ? amountAr : 0, 'MGA')}`
                : valid
                  ? `= ${formatMonths(months)} · enregistré ${formatAmount(amountAr, 'MGA')}`
                  : `Cotisation : ${formatAmount(MONTHLY_DUE_AR, inputCurrency)} par mois`
            }
            action={
              <CurrencyToggle
                value={inputCurrency}
                onChange={setInputCurrency}
                size="sm"
                label="Monnaie de saisie"
              />
            }
          >
            <input
              id="contribution-amount"
              className="input"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder={inputCurrency === 'EUR' ? '3.92' : '20000'}
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setFeedback('');
              }}
              required
            />
          </Field>

          <Field label="Date du versement" htmlFor="contribution-date">
            <input
              id="contribution-date"
              className="input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>
        </div>

        <Field
          label={oneOff ? 'Motif' : 'Note'}
          htmlFor="contribution-note"
          optional={!oneOff}
          hint={oneOff ? 'Ce motif est ce qu’on relira dans un an' : undefined}
        >
          <input
            id="contribution-note"
            className="input"
            type="text"
            placeholder={
              oneOff ? 'Anniversaire de tonton Jean Michel' : 'Versement partiel, espèces…'
            }
            value={note}
            onChange={(event) => setNote(event.target.value)}
            required={oneOff}
          />
        </Field>

        <div className="form__actions">
          <button type="submit" className="button button--in" disabled={!valid || saving}>
            {saving
              ? 'Enregistrement…'
              : oneOff
                ? 'Enregistrer la participation'
                : "Enregistrer l’entrée"}
          </button>
          {feedback && <p className="form__feedback form__feedback--in">{feedback}</p>}
        </div>
      </form>
    </Card>
  );
}
