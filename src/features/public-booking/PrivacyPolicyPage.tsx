import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getPrivacyPolicy } from '@/api/publicBooking';
import { getApiErrorMessage } from '@/api/client';
import { publicBookingKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';

export function PrivacyPolicyPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: publicBookingKeys.privacyPolicy(),
    queryFn: getPrivacyPolicy,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Erro ao carregar política de privacidade')}
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <article className="prose prose-sm max-w-none dark:prose-invert">
      <h1>Política de Privacidade</h1>
      <p className="text-muted-foreground text-sm not-prose">
        Versão {data.version} · Atualizada em {data.updatedAt}
      </p>
      <div className="whitespace-pre-wrap text-sm leading-relaxed not-prose">
        {data.content.replace(/^# .+\n\n/m, '')}
      </div>
    </article>
  );
}
