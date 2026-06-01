import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { ClientPriceBook } from './ClientPriceBook';
import { createClient, updateClient } from '@/api/clients';
import { getApiErrorMessage } from '@/api/client';
import { clientKeys } from '@/lib/queryKeys';
import { formatBRPhone, isValidBRPhone } from '@/lib/phone';
import type { Client } from '@/api/types';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(120),
  phone: z.string().refine(isValidBRPhone, 'Telefone inválido (use 10 ou 11 dígitos)'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const qc = useQueryClient();
  const isEditing = Boolean(client);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: client?.name ?? '',
        phone: formatBRPhone(client?.phone ?? ''),
        email: client?.email ?? '',
        notes: client?.notes ?? '',
      });
    }
  }, [open, client, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim() ? values.email.trim() : undefined,
        notes: values.notes?.trim() ? values.notes.trim() : undefined,
      };
      return client
        ? updateClient(client.id, payload)
        : createClient(payload as { name: string; phone: string; email?: string; notes?: string });
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Cliente atualizado.' : 'Cliente criado.');
      qc.invalidateQueries({ queryKey: clientKeys.all });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar cliente')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          <DialogDescription>Dados de contato do cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome</Label>
            <Input id="client-name" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-phone">Telefone</Label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  id="client-phone"
                  placeholder="(11) 99999-9999"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">E-mail (opcional)</Label>
            <Input id="client-email" type="email" {...register('email')} />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">Observações (opcional)</Label>
            <Textarea id="client-notes" rows={3} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>

        {isEditing && client ? (
          <div className="mt-2 space-y-3 border-t pt-4">
            <div>
              <h3 className="text-sm font-medium">Preços do cliente</h3>
              <p className="text-xs text-muted-foreground">
                Preço negociado por serviço. Vazio = usa o preço padrão.
              </p>
            </div>
            <ClientPriceBook clientId={client.id} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
