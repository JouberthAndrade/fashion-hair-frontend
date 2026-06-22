import { cn } from '@/lib/utils';

// Eight muted tones that sit well next to the brand gold.
const PALETTE = [
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-emerald-100 text-emerald-800',
  'bg-orange-100 text-orange-800',
  'bg-fuchsia-100 text-fuchsia-800',
];

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-14 w-14 text-lg',
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % PALETTE.length;
  return PALETTE[hash];
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, src, size = 'lg', className }: AvatarProps) {
  const base = cn(
    'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium',
    SIZES[size],
    className,
  );

  if (src) {
    return (
      <span className={base}>
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span className={cn(base, toneFor(name))} aria-label={name} title={name}>
      {initials(name)}
    </span>
  );
}
