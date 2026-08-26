import type { FamilyMember } from '../domain/models';
import { formatMemberTitle, getMemberFullName } from '../utils/member';

interface MemberNameProps {
  member: FamilyMember;
  className?: string;
}

/** Titre en gris minuscule, puis prénom et nom. */
export function MemberName({ member, className = '' }: MemberNameProps) {
  const title = formatMemberTitle(member);

  return (
    <span className={`member-name ${className}`.trim()}>
      {title && <span className="member-name__title">{title}</span>}
      <span className="member-name__text">{getMemberFullName(member)}</span>
    </span>
  );
}
