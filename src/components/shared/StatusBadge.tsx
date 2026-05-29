import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/enumLabels';
import type { AppointmentStatus } from '@/api/types';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        styles.badge,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        size === 'lg' && 'px-3 py-1.5 text-base',
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
