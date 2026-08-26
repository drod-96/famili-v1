import { useState } from 'react';
import type { DisplayCurrency } from '../domain/models';
import type { MemberSummary } from '../utils/fund';
import { formatAmount } from '../utils/format';
import { getMemberDisplayName } from '../utils/member';
import { Card } from './Card';
import { MemberAvatar } from './MemberAvatar';
import { MemberName } from './MemberName';

/** Nombre de payeurs montrés tant qu'on n'a pas déplié la liste. */
const PREVIEW = 5;

interface TopPayersCardProps {
  /** Déjà classés, du plus gros total au plus petit. */
  ranking: MemberSummary[];
  currency: DisplayCurrency;
  selectedId: string;
  onSelect: (memberId: string) => void;
}

/**
 * Qui a le plus mis dans la caisse, cotisations et participations ponctuelles
 * confondues. C'est un classement de générosité, pas d'assiduité : être en tête
 * ici ne veut pas dire être à jour de ses cotisations.
 */
export function TopPayersCard({ ranking, currency, selectedId, onSelect }: TopPayersCardProps) {
  const [expanded, setExpanded] = useState(false);

  const leaderAr = ranking[0]?.totalPaidAr ?? 0;
  const shown = expanded ? ranking : ranking.slice(0, PREVIEW);
  const hidden = ranking.length - shown.length;

  const payers = ranking.filter((summary) => summary.totalPaidAr > 0).length;
  const collectedAr = ranking.reduce((total, item) => total + item.totalPaidAr, 0);

  return (
    <Card className="top-card">
      <div className="top-card__head">
        <p className="eyebrow">Top payeurs</p>
        <span className="top-card__count">
          {payers} / {ranking.length} ont versé · {formatAmount(collectedAr, currency)}
        </span>
      </div>

      {ranking.length === 0 ? (
        <p className="top-card__empty">Aucun membre dans la caisse.</p>
      ) : (
        <>
          <ol className="top-list">
            {shown.map((summary, position) => (
              <li key={summary.member.id}>
                <TopRow
                  summary={summary}
                  rank={position + 1}
                  leaderAr={leaderAr}
                  currency={currency}
                  selected={summary.member.id === selectedId}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ol>

          {(hidden > 0 || expanded) && (
            <button
              type="button"
              className="top-card__more"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Réduire' : `Voir les ${hidden} autres`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

interface TopRowProps {
  summary: MemberSummary;
  rank: number;
  leaderAr: number;
  currency: DisplayCurrency;
  selected: boolean;
  onSelect: (memberId: string) => void;
}

function TopRow({ summary, rank, leaderAr, currency, selected, onSelect }: TopRowProps) {
  // La barre se lit par rapport au premier, pas par rapport au total collecté.
  const share = leaderAr > 0 ? Math.round((summary.totalPaidAr / leaderAr) * 100) : 0;
  const empty = summary.totalPaidAr === 0;

  // Or, argent, cuivre — mais seulement pour qui a réellement versé.
  const podium = rank <= 3 && !empty ? ` top-row__rank--${rank}` : '';

  return (
    <button
      type="button"
      className={`top-row${selected ? ' top-row--selected' : ''}${empty ? ' top-row--empty' : ''}`}
      onClick={() => onSelect(summary.member.id)}
      aria-current={selected ? 'true' : undefined}
      title={`${getMemberDisplayName(summary.member)} — ${formatAmount(summary.totalPaidAr, currency)}`}
    >
      <span className={`top-row__rank${podium}`} aria-hidden="true">{rank}</span>
      <MemberAvatar member={summary.member} size="sm" />

      <span className="top-row__text">
        <MemberName member={summary.member} className="top-row__name" />
        <span className="top-row__bar" aria-hidden="true">
          <span className="top-row__fill" style={{ width: `${share}%` }} />
        </span>
      </span>

      <span className="top-row__value">
        <strong>{formatAmount(summary.totalPaidAr, currency)}</strong>
        {empty && <span className="top-row__split">rien versé</span>}
        {!empty && summary.oneOffPaidAr > 0 && summary.duesPaidAr > 0 && (
          <span className="top-row__split">
            {formatAmount(summary.duesPaidAr, currency)} + ponctuel
          </span>
        )}
        {!empty && summary.oneOffPaidAr > 0 && summary.duesPaidAr === 0 && (
          <span className="top-row__split">ponctuel</span>
        )}
      </span>
    </button>
  );
}
