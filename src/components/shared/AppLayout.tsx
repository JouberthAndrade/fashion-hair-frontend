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
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground',
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

export function AppLayout() {
  const { user, clear, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="flex min-h-screen w-full bg-secondary/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <Scissors className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Fashion Hair</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t p-3">
          <div className="mb-2 px-3 text-xs">
            <p className="font-medium leading-tight">{user?.name}</p>
            <p className="text-muted-foreground">{user?.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-card px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-16 items-center gap-2 border-b px-5">
                <Scissors className="h-5 w-5 text-primary" />
                <span className="font-semibold tracking-tight">Fashion Hair</span>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
              <div className="border-t p-3">
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Scissors className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Fashion Hair</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
