import { Link, Outlet } from 'react-router-dom';
import { Scissors } from 'lucide-react';

const SALON_NAME = import.meta.env.VITE_SALON_NAME ?? 'Fashion Hair';
const SALON_CNPJ = import.meta.env.VITE_SALON_CNPJ ?? '';

export function PublicBookingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/agendar" className="flex items-center gap-2 text-foreground no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Scissors className="h-4 w-4" />
            </span>
            <span className="font-semibold">{SALON_NAME}</span>
          </Link>
          <Link
            to="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Área do salão
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>
          {SALON_NAME}
          {SALON_CNPJ ? ` · CNPJ ${SALON_CNPJ}` : null}
        </p>
        <p className="mt-1">
          <Link to="/agendar/privacidade" className="underline-offset-4 hover:underline">
            Política de Privacidade
          </Link>
        </p>
      </footer>
    </div>
  );
}
