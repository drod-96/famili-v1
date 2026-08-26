import type { PropsWithChildren } from 'react';

interface AnnouncementProps extends PropsWithChildren {
  /** Libellé de la pastille. « Actu » par défaut. */
  badge?: string;
}

export function Announcement({ badge = 'Actu', children }: AnnouncementProps) {
  return (
    <p className="notice">
      <span className="notice__badge">{badge}</span>
      <span>{children}</span>
    </p>
  );
}
