import { useMemo, useState } from 'react';
import type { DisplayCurrency, ExpenseCategory } from '../domain/models';
import type { ActivityEntry } from '../utils/fund';
import { formatActivityDate, formatMonths, formatSignedAmount } from '../utils/format';
import { getMemberShortName } from '../utils/member';
import { Card } from './Card';
import { MemberAvatar } from './MemberAvatar';

const EXPENSE_SYMBOL: Record<ExpenseCategory, string> = {
  event: '✦',
  health: '✚',
  support: '❥',
  admin: '▤',
  other: '•',
};

/** « 2026-08 » → « août 2026 ». */
function monthLabel(key: string): string {
  return monthFormatter.format(new Date(`${key}-01T12:00:00`));
}

const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  event: 'Événement familial',
  health: 'Santé',
  support: 'Entraide',
  admin: 'Administration',
  other: 'Autre',
};

/** Valeur du filtre « toutes périodes ». */
const ALL = 'all';

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

interface ActivityCardProps {
  /** Tous les mouvements, du plus récent au plus ancien. */
  entries: ActivityEntry[];
  currency: DisplayCurrency;
  today: Date;
  selectedMemberId: string;
}

export function ActivityCard({ entries, currency, today, selectedMemberId }: ActivityCardProps) {
  const [period, setPeriod] = useState(ALL);

  // Les mois réellement présents dans les données, du plus récent au plus ancien.
  const months = useMemo(() => {
    const keys = [...new Set(entries.map((entry) => entry.date.slice(0, 7)))];
    return keys.sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const shown = period === ALL ? entries : entries.filter((entry) => entry.date.startsWith(period));

  return (
    <Card className="activity-card">
      <div className="activity-card__head">
        <div className="activity-card__title">
          <p className="eyebrow">Mouvements</p>
          <span className="activity-card__count">
            {shown.length} sur {entries.length}
          </span>
        </div>

        <select
          className="activity-card__filter"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          aria-label="Filtrer par période"
        >
          <option value={ALL}>Toutes les périodes</option>
          {months.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="activity-card__empty">
          {entries.length === 0
            ? 'Aucun mouvement enregistré pour l’instant.'
            : 'Aucun mouvement sur cette période.'}
        </p>
      ) : (
        <ul className="activity-list">
          {shown.map((entry) =>
            entry.kind === 'contribution' ? (
              <li
                key={entry.id}
                className={`activity-row activity-row--in${
                  entry.member?.id === selectedMemberId ? ' activity-row--highlight' : ''
                }`}
              >
                {entry.member ? (
                  <MemberAvatar member={entry.member} size="sm" />
                ) : (
                  <span className="activity-row__icon" aria-hidden="true">+</span>
                )}

                <div className="activity-row__body">
                  <p className="activity-row__title">
                    {entry.member ? (
                      <>
                        <strong>{getMemberShortName(entry.member)}</strong>
                        <span className="activity-row__verb">
                          {entry.oneOff ? 'a participé' : 'a payé'}
                        </span>
                      </>
                    ) : (
                      /* Versement rattaché à personne : la note tient lieu de titre. */
                      <strong>{entry.note ?? 'Versement à la caisse'}</strong>
                    )}
                  </p>
                  <p className="activity-row__meta">
                    {formatActivityDate(entry.date, today)}
                    {entry.member && entry.note && (
                      <span className="activity-row__note">{entry.note}</span>
                    )}
                  </p>
                </div>

                <div className="activity-row__value">
                  <span className="activity-row__arrow" aria-hidden="true">→</span>
                  <span className="activity-row__amount amount-positive">
                    {formatSignedAmount(entry.amountAr, currency)}
                  </span>
                  {entry.oneOff ? (
                    <span className="chip chip--oneoff">Ponctuel</span>
                  ) : (
                    <span className="chip chip--months">+{formatMonths(entry.monthsGranted)}</span>
                  )}
                </div>
              </li>
            ) : (
              <li key={entry.id} className="activity-row activity-row--out">
                <span className="activity-row__icon" aria-hidden="true">
                  {EXPENSE_SYMBOL[entry.expense.category]}
                </span>

                <div className="activity-row__body">
                  <p className="activity-row__title">
                    <strong>{entry.expense.label}</strong>
                  </p>
                  <p className="activity-row__meta">
                    {formatActivityDate(entry.date, today)}
                    <span className="activity-row__note">{EXPENSE_LABEL[entry.expense.category]}</span>
                    {entry.member && (
                      <span className="activity-row__note">
                        pour {getMemberShortName(entry.member)}
                      </span>
                    )}
                  </p>
                </div>

                <div className="activity-row__value">
                  <span className="activity-row__arrow" aria-hidden="true">→</span>
                  <span className="activity-row__amount amount-negative">
                    {formatSignedAmount(-entry.amountAr, currency)}
                  </span>
                  <span className="chip chip--out">Sortie</span>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}
