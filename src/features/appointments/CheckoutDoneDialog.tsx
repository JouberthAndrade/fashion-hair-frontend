import { useState } from 'react';
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
import { useUpdateAppointmentStatus } from './useAppointmentMutations';
import { formatCurrency } from '@/lib/date';
import type { Appointment } from '@/api/types';

interface Props {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Conclui o atendimento (status DONE) permitindo confirmar/ajustar o preço
 * final cobrado. A taxa do salão NÃO aparece aqui — segue exclusiva do ADMIN.
 */
export function CheckoutDoneDialog({ appointment, open, onOpenChange }: Props) {
  const updateStatus = useUpdateAppointmentStatus();
  const suggested = String(appointment.priceAtBooking ?? appointment.service?.price ?? '');
  const [price, setPrice] = useState(suggested);

  // Reajusta o valor sugerido ao (re)abrir — padrão "ajustar estado quando a
  // prop muda" feito na renderização, sem useEffect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPrice(suggested);
  }

  const num = Number(price);
  const invalid = !price || Number.isNaN(num) || num <= 0;
  const standard = appointment.standardPriceAtBooking ?? appointment.service?.price;

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
              Preço padrão do serviço: {formatCurrency(standard)}
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
