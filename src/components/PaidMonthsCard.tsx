import { MONTHLY_DUE_AR } from '../config/fund';
import type { DisplayCurrency } from '../domain/models';
import type { MemberMonth, MemberSummary } from '../utils/fund';
import { formatAmount, formatMonths } from '../utils/format';
import { getMemberDisplayName } from '../utils/member';
import { Card } from './Card';
import { MemberAvatar } from './MemberAvatar';
import { MemberName } from './MemberName';
import { StatusPill } from './StatusPill';

const LEGEND: Array<{ status: MemberMonth['status']; label: string }> = [
  { status: 'paid', label: 'Payé' },
  { status: 'late', label: 'En retard' },
  { status: 'due', label: 'Mois en cours' },
  { status: 'upcoming', label: 'À venir' },
];

interface PaidMonthsCardProps {
  summary: MemberSummary;
  currency: DisplayCurrency;
  fundStarted: boolean;
}

export function PaidMonthsCard({ summary, currency, fundStarted }: PaidMonthsCardProps) {
  const late = summary.tone === 'late';

  return (
    <Card className={`months-card${late ? ' months-card--late' : ''}`}>
      <div className="months-card__head">
        <div className="months-card__title">
          <p className="eyebrow">Mois payés · {summary.year}</p>
          <div className="months-card__member">
            <MemberAvatar member={summary.member} size="xs" />
            <MemberName member={summary.member} />
          </div>
        </div>

        <StatusPill tone={summary.tone} label={summary.statusLabel} size="md" />
      </div>

      <div className="months-card__figures">
        <p className="months-card__count">
          <strong>{summary.yearFullMonths}</strong>
          <span>/ {summary.months.length} mois de {summary.year}</span>
        </p>

        <dl className="months-card__meta">
          <div>
            <dt>Cotisations</dt>
            <dd>{formatAmount(summary.duesPaidAr, currency)}</dd>
          </div>
          <div>
            <dt>Reste pour {summary.year}</dt>
            <dd>{formatAmount(summary.yearRemainingAr, currency)}</dd>
          </div>

          {/* Discret et seulement s'il y en a : ce n'est pas une échéance. */}
          {summary.oneOffPaidAr > 0 && (
            <div className="months-card__meta-soft">
              <dt>Dont ponctuel</dt>
              <dd>{formatAmount(summary.oneOffPaidAr, currency)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="month-grid" role="list" aria-label={`Mois payés par ${getMemberDisplayName(summary.member)}`}>
        {summary.months.map((month) => (
          <MonthCell key={month.period.key} month={month} currency={currency} />
        ))}
      </div>

      <div className="month-legend" aria-hidden="true">
        {LEGEND.map((item) => (
          <span className="month-legend__item" key={item.status}>
            <span className={`month-legend__dot month-legend__dot--${item.status}`} />
            {item.label}
          </span>
        ))}
      </div>

      <p className="months-card__hint">{buildHint(summary, currency, fundStarted)}</p>
    </Card>
  );
}

interface MonthCellProps {
  month: MemberMonth;
  currency: DisplayCurrency;
}

function MonthCell({ month, currency }: MonthCellProps) {
  const percent = Math.round(month.progress * 100);

  // L'année n'est rappelée qu'au démarrage de la caisse et à chaque janvier.
  const yearMark = month.period.index === 0 || month.period.month === 1 ? month.period.year : '';

  return (
    <div className="month-cell" role="listitem">
      <span
        className={`month-cell__track month-cell__track--${month.status}`}
        title={`${month.period.longLabel} — ${describeCell(month, currency)}`}
      >
        <span className="month-cell__fill" style={{ height: `${percent}%` }} />
      </span>
      <span className={`month-cell__label month-cell__label--${month.status}`}>
        {month.period.shortLabel}
      </span>
      <span className="month-cell__year">{yearMark}</span>
    </div>
  );
}

function describeCell(month: MemberMonth, currency: DisplayCurrency): string {
  if (month.status === 'paid') return 'payé';
  if (month.progress > 0) return `partiel, ${formatAmount(month.amountAr, currency)} sur ${formatAmount(MONTHLY_DUE_AR, currency)}`;
  if (month.status === 'late') return 'non payé — en retard';
  if (month.status === 'due') return 'à payer ce mois-ci';
  return "à venir — payable d'avance";
}

function buildHint(summary: MemberSummary, currency: DisplayCurrency, fundStarted: boolean): string {
  const parts: string[] = [];

  if (!fundStarted) {
    parts.push('La caisse démarre en septembre 2026.');
  } else if (summary.remainingAr > 0) {
    parts.push(`Il reste ${formatAmount(summary.remainingAr, currency)} à verser pour être à jour.`);
  }

  if (summary.yearRemainingAr > 0) {
    const left = summary.yearRemainingMonths;
    const months = left === 1 ? 'le mois qui reste' : `les ${left} mois qui restent`;
    parts.push(`${formatAmount(summary.yearRemainingAr, currency)} couvrent ${months} en ${summary.year}.`);
  } else {
    parts.push(`Les ${summary.months.length} mois de ${summary.year} sont payés.`);
  }

  // Un versement peut dépasser décembre : il est reporté, jamais perdu.
  if (summary.overflowMonths > 0) {
    parts.push(`${formatMonths(summary.overflowMonths)} reportés sur ${summary.year + 1}.`);
  }

  return parts.join(' ');
}
