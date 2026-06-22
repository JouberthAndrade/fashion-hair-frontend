import { Clock, Loader, Check, X, UserX, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/enumLabels';
import type { AppointmentStatus } from '@/api/types';

// A small icon per status so the badge isn't conveyed by color alone (a11y).
const STATUS_ICONS: Record<AppointmentStatus, LucideIcon> = {
  SCHEDULED: Clock,
  IN_PROGRESS: Loader,
  DONE: Check,
  CANCELLED: X,
  NO_SHOW: UserX,
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide',
        styles.badge,
        size === 'sm' && 'px-2 py-0.5 text-[11px]',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm',
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
