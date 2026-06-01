import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveClientPrice } from '@/api/clientPrices';
import { useUpdateAppointmentStatus } from './useAppointmentMutations';
import { formatCurrency } from '@/lib/date';
import { clientKeys } from '@/lib/queryKeys';
import type { Appointment } from '@/api/types';

interface Props {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Conclui o atendimento (status DONE) permitindo confirmar/ajustar o preço
 * final cobrado. A taxa do salão NÃO aparece aqui — segura exclusiva do ADMIN.
 */
export function CheckoutDoneDialog({ appointment, open, onOpenChange }: Props) {
  const updateStatus = useUpdateAppointmentStatus();

  const standard =
    appointment.standardPriceAtBooking ?? appointment.service?.price ?? null;

  const { data: resolvedPrice } = useQuery({
    queryKey: clientKeys.priceResolve(appointment.clientId, appointment.serviceId),
    queryFn: () => resolveClientPrice(appointment.clientId, appointment.serviceId),
    enabled: open,
  });

  const [price, setPrice] = useState('');

  useEffect(() => {
    if (!open) return;
    const suggested =
      resolvedPrice?.source === 'book'
        ? resolvedPrice.price
        : (appointment.priceAtBooking ?? appointment.service?.price ?? '');
    setPrice(String(suggested));
  }, [
    open,
    appointment.id,
    appointment.priceAtBooking,
    appointment.service?.price,
    resolvedPrice?.price,
    resolvedPrice?.source,
  ]);

  const num = Number(price);
  const invalid = !price || Number.isNaN(num) || num <= 0;

  const handleConfirm = () => {
    updateStatus.mutate(
      { id: appointment.id, status: 'DONE', price: num },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Concluir atendimento</DialogTitle>
          <DialogDescription>
            Confirme o valor final cobrado de {appointment.client?.name ?? 'cliente'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="checkout-price">Preço final (R$)</Label>
          <Input
            id="checkout-price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            autoFocus
          />
          {standard != null ? (
            <p className="text-xs text-muted-foreground">
              Preço sugerido (padrão): {formatCurrency(standard)}
            </p>
          ) : null}
          {resolvedPrice?.source === 'book' ? (
            <p className="text-xs text-muted-foreground">
              Preço especial deste cliente: {formatCurrency(resolvedPrice.price)}
            </p>
          ) : null}
          {invalid ? (
            <p className="text-xs text-destructive">Informe um valor maior que zero.</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={invalid || updateStatus.isPending} onClick={handleConfirm}>
            {updateStatus.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Concluindo...
              </>
            ) : (
              'Concluir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
