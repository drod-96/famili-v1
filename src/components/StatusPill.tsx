import type { MemberTone } from '../utils/fund';

interface StatusPillProps {
  tone: MemberTone;
  label: string;
  size?: 'sm' | 'md';
}

export function StatusPill({ tone, label, size = 'sm' }: StatusPillProps) {
  return <span className={`status-pill status-pill--${tone} status-pill--${size}`}>{label}</span>;
}
