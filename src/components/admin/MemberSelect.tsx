import type { FamilyMember } from '../../domain/models';
import { getMemberDisplayName } from '../../utils/member';

interface MemberSelectProps {
  id: string;
  /** Déjà triés par ordre alphabétique. */
  members: FamilyMember[];
  value: string;
  onChange: (memberId: string) => void;
  /** Libellé de l'option vide. Absent = le choix est obligatoire. */
  emptyLabel?: string;
}

export function MemberSelect({ id, members, value, onChange, emptyLabel }: MemberSelectProps) {
  return (
    <select
      id={id}
      className="input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={!emptyLabel}
    >
      <option value="">{emptyLabel ?? 'Choisir un membre…'}</option>

      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {getMemberDisplayName(member)}
        </option>
      ))}
    </select>
  );
}
