import { NavLink } from 'react-router-dom';
import {
  Monitor,
  CalendarDays,
  Users as UsersIcon,
  Wallet,
  UserRound,
  BookOpen,
  Plus,
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string; icon: LucideIcon };

// Items are role-aware so collaborators never see admin-only routes.
// Two items sit on each side of the central FAB.
const ADMIN_ITEMS: { left: NavItem[]; right: NavItem[] } = {
  left: [
    { to: '/painel', label: 'Painel', icon: Monitor },
    { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  ],
  right: [
    { to: '/clientes', label: 'Clientes', icon: UsersIcon },
    { to: '/fechamento-caixa', label: 'Caixa', icon: Wallet },
  ],
};

const COLLABORATOR_ITEMS: { left: NavItem[]; right: NavItem[] } = {
  left: [
    { to: '/agenda', label: 'Agenda', icon: CalendarDays },
    { to: '/clientes', label: 'Clientes', icon: UsersIcon },
  ],
  right: [
    { to: '/perfil', label: 'Perfil', icon: UserRound },
    { to: '/tutorial', label: 'Tutorial', icon: BookOpen },
  ],
};

function NavTab({ to, label, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
          isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}

interface BottomNavProps {
  onNewAppointment: () => void;
}

export function BottomNav({ onNewAppointment }: BottomNavProps) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const items = isAdmin ? ADMIN_ITEMS : COLLABORATOR_ITEMS;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[var(--bottom-nav-height)] items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.left.map((item) => (
        <NavTab key={item.to} {...item} />
      ))}

      {/* Central elevated FAB — opens the new-appointment flow */}
      <div className="flex flex-1 items-start justify-center">
        <button
          type="button"
          onClick={onNewAppointment}
          aria-label="Novo agendamento"
          className="-translate-y-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-gold transition-transform hover:bg-gold-light active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {items.right.map((item) => (
        <NavTab key={item.to} {...item} />
      ))}
    </nav>
  );
}
