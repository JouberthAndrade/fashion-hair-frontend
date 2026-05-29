import { Loader2 } from 'lucide-react';

export function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full min-h-[40vh] items-center justify-center"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
