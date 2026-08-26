import { useState } from 'react';
import type { DisplayCurrency, ExpenseCategory, FamilyMember, NewExpense } from '../../domain/models';
import { formatAmount, formatRate, getEurRateAr, toAriary, toDateKey } from '../../utils/format';
import { Card } from '../Card';
import { CurrencyToggle } from '../CurrencyToggle';
import { Field } from './Field';
import { MemberSelect } from './MemberSelect';

const CATEGORIES: Array<{ value: ExpenseCategory; label: string }> = [
  { value: 'event', label: 'Événement familial' },
  { value: 'health', label: 'Santé' },
  { value: 'support', label: 'Entraide' },
  { value: 'admin', label: 'Administration' },
  { value: 'other', label: 'Autre' },
];

interface ExpenseFormProps {
  members: FamilyMember[];
  today: Date;
  onSubmit: (input: NewExpense) => Promise<void>;
}

export function ExpenseForm({ members, today, onSubmit }: ExpenseFormProps) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [inputCurrency, setInputCurrency] = useState<DisplayCurrency>('MGA');
  const [category, setCategory] = useState<ExpenseCategory>('support');
  const [date, setDate] = useState(toDateKey(today));
  const [memberId, setMemberId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const typedAmount = Number(amount);
  const amountAr = toAriary(typedAmount, inputCurrency);
  const valid =
    label.trim().length > 0 &&
    amount.trim() !== '' &&
    Number.isFinite(typedAmount) &&
    amountAr > 0 &&
    Boolean(date);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || saving) return;

    setSaving(true);
    try {
      await onSubmit({
        label: label.trim(),
        amountAr,
        category,
        date,
        memberId: memberId || null,
      });

      setFeedback(`Sortie enregistrée : −${formatAmount(amountAr, 'MGA')}.`);
      setLabel('');
      setAmount('');
      setMemberId('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="admin-card admin-card--out">
      <header className="admin-card__head">
        <span className="admin-card__badge admin-card__badge--out" aria-hidden="true">−</span>
        <div>
          <h2 className="admin-card__title">Nouvelle sortie</h2>
          <p className="admin-card__subtitle">
            Une dépense de la caisse. Elle n’est rattachée à un membre que si tu le souhaites.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <Field label="Motif de la sortie" htmlFor="expense-label">
          <input
            id="expense-label"
            className="input"
            type="text"
            placeholder="Aide médicale, frais de dossier…"
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              setFeedback('');
            }}
            required
          />
        </Field>

        <div className="form__row">
          <Field
            label="Montant"
            htmlFor="expense-amount"
            hint={
              valid
                ? `Enregistré ${formatAmount(amountAr, 'MGA')}`
                : formatRate(getEurRateAr())
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
              id="expense-amount"
              className="input"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder={inputCurrency === 'EUR' ? '7.84' : '40000'}
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setFeedback('');
              }}
              required
            />
          </Field>

          <Field label="Date de la sortie" htmlFor="expense-date">
            <input
              id="expense-date"
              className="input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>
        </div>

        <div className="form__row">
          <Field label="Catégorie" htmlFor="expense-category">
            <select
              id="expense-category"
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Membre concerné" htmlFor="expense-member" optional>
            <MemberSelect
              id="expense-member"
              members={members}
              value={memberId}
              onChange={setMemberId}
              emptyLabel="Aucun — sortie de la caisse"
            />
          </Field>
        </div>

        <div className="form__actions">
          <button type="submit" className="button button--out" disabled={!valid || saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer la sortie'}
          </button>
          {feedback && <p className="form__feedback form__feedback--out">{feedback}</p>}
        </div>
      </form>
    </Card>
  );
}
