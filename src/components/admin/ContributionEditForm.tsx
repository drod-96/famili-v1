import { useEffect, useState } from 'react';
import type {
  Contribution,
  ContributionKind,
  DisplayCurrency,
  FamilyMember,
  NewContribution,
} from '../../domain/models';
import { formatAmount, formatMonths, toAriary, toDisplayValue } from '../../utils/format';
import { monthsFromAmount } from '../../utils/fund';
import { getMemberDisplayName } from '../../utils/member';
import { Card } from '../Card';
import { CurrencyToggle } from '../CurrencyToggle';
import { Field } from './Field';

interface ContributionEditFormProps {
  contributions: Contribution[];
  /** Membres triés par ordre alphabétique. */
  members: FamilyMember[];
  onSave: (id: string, input: NewContribution) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Corrige ou supprime une entrée déjà saisie — cotisation comme participation
 * ponctuelle. Tant qu'il n'y a pas de serveur, c'est le seul moyen de rattraper
 * une faute de frappe sans tout remettre à zéro.
 */
export function ContributionEditForm({
  contributions,
  members,
  onSave,
  onDelete,
}: ContributionEditFormProps) {
  const [id, setId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [kind, setKind] = useState<ContributionKind>('monthly');
  const [amount, setAmount] = useState('');
  const [inputCurrency, setInputCurrency] = useState<DisplayCurrency>('MGA');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = contributions.find((item) => item.id === id);

  // Choisir une entrée remplit le formulaire avec ce qu'elle contient déjà.
  useEffect(() => {
    if (!selected) return;

    setMemberId(selected.memberId ?? '');
    setKind(selected.kind ?? 'monthly');
    setAmount(String(toDisplayValue(selected.amountAr, inputCurrency)));
    setDate(selected.date);
    setNote(selected.note ?? '');
    setFeedback('');
    // La monnaie de saisie est un choix de l'utilisateur, pas une donnée de l'entrée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const oneOff = kind === 'oneOff';
  const typedAmount = Number(amount);
  const amountAr = toAriary(typedAmount, inputCurrency);
  const valid =
    Boolean(selected) &&
    amount.trim() !== '' &&
    Number.isFinite(typedAmount) &&
    amountAr > 0 &&
    Boolean(date);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !selected || saving) return;

    setSaving(true);
    try {
      await onSave(selected.id, {
        ...(memberId ? { memberId } : {}),
        amountAr,
        date,
        ...(oneOff ? { kind } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setFeedback(`Entrée corrigée : ${formatAmount(amountAr, 'MGA')}.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected || saving) return;

    const sure = window.confirm(
      `Supprimer définitivement cette entrée de ${formatAmount(selected.amountAr, 'MGA')} ?`,
    );
    if (!sure) return;

    setSaving(true);
    try {
      await onDelete(selected.id);
      setId('');
      setFeedback('Entrée supprimée.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="admin-card admin-card--edit">
      <header className="admin-card__head">
        <span className="admin-card__badge admin-card__badge--edit" aria-hidden="true">✎</span>
        <div>
          <h2 className="admin-card__title">Corriger une entrée</h2>
          <p className="admin-card__subtitle">
            Modifier ou supprimer un versement déjà enregistré — cotisation comme
            participation ponctuelle.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <Field
          label="Entrée à corriger"
          htmlFor="edit-contribution"
          hint={`${contributions.length} entrées enregistrées, de la plus récente à la plus ancienne`}
        >
          <select
            id="edit-contribution"
            className="input"
            value={id}
            onChange={(event) => setId(event.target.value)}
            required
          >
            <option value="">Choisir une entrée…</option>
            {contributions.map((contribution) => (
              <option key={contribution.id} value={contribution.id}>
                {describe(contribution, members)}
              </option>
            ))}
          </select>
        </Field>

        {selected && (
          <>
            <div className="form__row">
              <Field label="Payeur" htmlFor="edit-member">
                <select
                  id="edit-member"
                  className="input"
                  value={memberId}
                  onChange={(event) => setMemberId(event.target.value)}
                >
                  <option value="">Aucun — versement non attribué</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {getMemberDisplayName(member)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Nature du versement"
                htmlFor="edit-kind"
                hint={oneOff ? 'Ne compte pas dans les mois payés' : 'Converti en mois payés'}
              >
                <select
                  id="edit-kind"
                  className="input"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as ContributionKind)}
                >
                  <option value="monthly">Cotisation mensuelle</option>
                  <option value="oneOff">Participation ponctuelle</option>
                </select>
              </Field>
            </div>

            <div className="form__row">
              <Field
                label="Montant versé"
                htmlFor="edit-amount"
                hint={
                  oneOff
                    ? `Hors cotisation · enregistré ${formatAmount(Math.max(0, amountAr), 'MGA')}`
                    : `= ${formatMonths(monthsFromAmount(Math.max(0, amountAr)))} · enregistré ${formatAmount(Math.max(0, amountAr), 'MGA')}`
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
                  id="edit-amount"
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setFeedback('');
                  }}
                  required
                />
              </Field>

              <Field label="Date du versement" htmlFor="edit-date">
                <input
                  id="edit-date"
                  className="input"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </Field>
            </div>

            <Field label={oneOff ? 'Motif' : 'Note'} htmlFor="edit-note" optional>
              <input
                id="edit-note"
                className="input"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>

            <div className="form__actions">
              <button type="submit" className="button button--edit" disabled={!valid || saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer la correction'}
              </button>

              <button
                type="button"
                className="button button--ghost"
                onClick={handleDelete}
                disabled={saving}
              >
                Supprimer
              </button>

              {feedback && <p className="form__feedback form__feedback--edit">{feedback}</p>}
            </div>
          </>
        )}
      </form>
    </Card>
  );
}

/** « Naina — 75 000 Ar — 26/08/2026 — ponctuel » */
function describe(contribution: Contribution, members: FamilyMember[]): string {
  const member = members.find((item) => item.id === contribution.memberId);
  const who = member ? getMemberDisplayName(member) : 'Non attribué';
  const nature = contribution.kind === 'oneOff' ? 'ponctuel' : 'cotisation';
  const day = new Date(`${contribution.date}T12:00:00`).toLocaleDateString('fr-FR');

  return `${who} — ${formatAmount(contribution.amountAr, 'MGA')} — ${day} — ${nature}`;
}
