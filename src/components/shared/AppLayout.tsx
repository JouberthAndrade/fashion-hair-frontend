import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  CalendarDays,
  Users as UsersIcon,
  Scissors,
  UserCog,
  ShieldCheck,
  Monitor,
  LogOut,
  Menu,
  UserRound,
  Wallet,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { logout } from '@/api/auth';
import { queryClient } from '@/lib/queryClient';
import { canAccessRoute } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BottomNav } from '@/components/shared/BottomNav';
import { CreateAppointmentDialog } from '@/features/appointments/CreateAppointmentDialog';

type NavItem = { to: string; label: string; icon: typeof CalendarDays };

const navItems: NavItem[] = [
  { to: '/painel', label: 'Painel do salão', icon: Monitor },
  { to: '/fechamento-caixa', label: 'Fechamento de caixa', icon: Wallet },
  { to: '/agenda', label: 'Minha agenda', icon: CalendarDays },
  { to: '/clientes', label: 'Clientes', icon: UsersIcon },
  { to: '/servicos', label: 'Serviços', icon: Scissors },
  { to: '/colaboradores', label: 'Colaboradores', icon: UserCog },
  { to: '/usuarios', label: 'Usuários', icon: ShieldCheck },
  { to: '/tutorial', label: 'Tutorial', icon: BookOpen },
  { to: '/perfil', label: 'Meu perfil', icon: UserRound },
];

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAuthStore((s) => s.user?.role);
  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems
        .filter((i) => canAccessRoute(role, i.to))
        .map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-gold bg-gold-muted text-gold-light'
                  : 'border-transparent text-white/70 hover:bg-white/6 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
    </nav>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <Scissors className="h-5 w-5 text-gold" />
      <span className="font-display text-lg font-semibold tracking-tight">Fashion Hair</span>
    </span>
  );
}

export function AppLayout() {
  const { user, clear, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // ignore — we still clear locally
    } finally {
      queryClient.clear();
      clear();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-surface">
      {/* Desktop sidebar (>= lg) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-dark text-white lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-sm font-medium text-gold-light">
              {initials(user?.name)}
            </span>
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium leading-tight">{user?.name}</p>
              <p className="text-white/60">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:bg-white/6 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile/tablet header (< lg) */}
        <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-none bg-brand-dark p-0 text-white">
                <div className="flex h-16 items-center border-b border-white/10 px-5">
                  <Brand />
                </div>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
                <div className="border-t border-white/10 p-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white/70 hover:bg-white/6 hover:text-white"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Brand />
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm font-medium text-accent-foreground"
            aria-label={user?.name}
            title={user?.name}
          >
            {initials(user?.name)}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(var(--bottom-nav-height)+1.5rem)] lg:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile/tablet bottom navigation (< lg) */}
      <BottomNav onNewAppointment={() => setCreateOpen(true)} />

      <CreateAppointmentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
