import { useMemo, useState } from 'react';
import type { FamilyMember } from '../domain/models';
import { sortMembersByAmount, type MemberSummary } from '../utils/fund';
import { getMemberDisplayName } from '../utils/member';
import { MemberAvatar } from './MemberAvatar';
import { MemberName } from './MemberName';
import { StatusPill } from './StatusPill';

/** Ordre d'affichage de la liste. */
type MemberOrder = 'amount' | 'name';

const ORDERS: Array<{ value: MemberOrder; label: string; hint: string }> = [
  { value: 'amount', label: 'Montant', hint: 'Du plus gros total versé au plus petit' },
  { value: 'name', label: 'A–Z', hint: 'Par ordre alphabétique' },
];

interface MembersSidebarProps {
  /** Déjà triés par ordre alphabétique. */
  members: FamilyMember[];
  summaries: Map<string, MemberSummary>;
  selectedId: string;
  onSelect: (memberId: string) => void;
}

export function MembersSidebar({ members, summaries, selectedId, onSelect }: MembersSidebarProps) {
  const [order, setOrder] = useState<MemberOrder>('amount');

  const listed = useMemo(
    () => (order === 'amount' ? sortMembersByAmount(members, summaries) : members),
    [order, members, summaries],
  );

  return (
    <aside className="sidebar" aria-label="Membres de la caisse">
      <div className="sidebar__head">
        <h2 className="sidebar__title">Membres</h2>
        <span className="sidebar__count">{members.length}</span>
      </div>

      <div className="sidebar__order" role="group" aria-label="Ordre de la liste">
        {ORDERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`sidebar__order-button${
              order === item.value ? ' sidebar__order-button--on' : ''
            }`}
            onClick={() => setOrder(item.value)}
            aria-pressed={order === item.value}
            title={item.hint}
          >
            {item.label}
          </button>
        ))}
      </div>

      <nav className="sidebar__body">
        {listed.length === 0 ? (
          <p className="sidebar__empty">Aucun membre pour le moment.</p>
        ) : (
          <ul className="member-list">
            {listed.map((member) => (
              <li key={member.id}>
                <MemberRow
                  member={member}
                  summary={summaries.get(member.id)}
                  selected={selectedId === member.id}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}

interface MemberRowProps {
  member: FamilyMember;
  summary?: MemberSummary;
  selected: boolean;
  onSelect: (memberId: string) => void;
}

function MemberRow({ member, summary, selected, onSelect }: MemberRowProps) {
  // Retard par rapport au mois en cours : la ligne entière passe en rouge.
  const late = summary?.tone === 'late';

  return (
    <button
      type="button"
      className={`member-row${selected ? ' member-row--selected' : ''}${late ? ' member-row--late' : ''}`}
      onClick={() => onSelect(member.id)}
      aria-current={selected ? 'true' : undefined}
      title={getMemberDisplayName(member)}
    >
      <MemberAvatar member={member} size="sm" />

      <span className="member-row__text">
        <MemberName member={member} className="member-row__name" />
        {member.isAdmin && <span className="member-row__admin">responsable</span>}
      </span>

      {summary && <StatusPill tone={summary.tone} label={shortStatus(summary)} />}
    </button>
  );
}

/**
 * Version compacte du statut, adaptée à la largeur de la barre latérale.
 * Hors retard, on affiche les mois payés de l'année en cours : « 3/4 ».
 */
function shortStatus(summary: MemberSummary): string {
  if (summary.tone === 'late') return `−${summary.lateCount} mois`;
  if (summary.tone === 'due') return 'à payer';
  if (summary.tone === 'idle') return '—';
  if (summary.yearFullMonths === 0) return 'partiel';

  // Le trop-versé reporté sur l'année suivante reste visible : « 4/4 +2 ».
  const carried = Math.floor(summary.overflowMonths);
  return `${summary.yearFullMonths}/${summary.months.length}${carried > 0 ? ` +${carried}` : ''}`;
}
