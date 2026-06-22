import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusTone =
  | 'total'
  | 'scheduled'
  | 'in-progress'
  | 'done'
  | 'cancelled'
  | 'no-show';

// Subtle accent background + a saturated icon/number color per tone.
const TONES: Record<StatusTone, { bg: string; accent: string }> = {
  total: { bg: 'bg-[#FBF7EE]', accent: 'text-gold' },
  scheduled: { bg: 'bg-[#EBF3FF]', accent: 'text-[#3B82F6]' },
  'in-progress': { bg: 'bg-[#FFF8E7]', accent: 'text-[#F59E0B]' },
  done: { bg: 'bg-[#F0FDF4]', accent: 'text-[#22C55E]' },
  cancelled: { bg: 'bg-[#F5F5F5]', accent: 'text-[#9CA3AF]' },
  'no-show': { bg: 'bg-[#FEF2F2]', accent: 'text-[#EF4444]' },
};

interface StatusCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: StatusTone;
}

export function StatusCard({ label, value, icon: Icon, tone }: StatusCardProps) {
  const t = TONES[tone];
  return (
    <div className={cn('rounded-xl border border-border/60 p-3', t.bg)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className={cn('h-4 w-4', t.accent)} />
      </div>
      <p className={cn('mt-1 text-3xl font-semibold tabular-nums leading-none', t.accent)}>
        {value}
      </p>
    </div>
  );
}
