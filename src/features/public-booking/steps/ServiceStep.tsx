import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { listPublicServices } from '@/api/publicBooking';
import { getApiErrorMessage } from '@/api/client';
import { publicBookingKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '../components/ServiceCard';
import type { PublicService } from '@/api/publicBooking';

type Props = {
  onPick: (service: PublicService) => void;
};

export function ServiceStep({ onPick }: Props) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: publicBookingKeys.services(),
    queryFn: listPublicServices,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Erro ao carregar serviços')}</p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data?.map((service) => (
        <ServiceCard key={service.id} service={service} onPick={() => onPick(service)} />
      ))}
    </div>
  );
}
