import { useState } from 'react';
import type { FamilyMember } from '../domain/models';
import { getMemberDisplayName, getMemberInitials } from '../utils/member';

interface MemberAvatarProps {
  member: FamilyMember;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function MemberAvatar({ member, size = 'md' }: MemberAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(member.avatarUrl) && !imageFailed;

  return (
    <span
      className={`member-avatar member-avatar--${member.color} member-avatar--${size}`}
      role="img"
      aria-label={getMemberDisplayName(member)}
    >
      {showImage ? (
        <img
          className="member-avatar__image"
          src={member.avatarUrl ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="member-avatar__initials" aria-hidden="true">
          {getMemberInitials(member)}
        </span>
      )}
    </span>
  );
}
