import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { createService, updateService } from '@/api/services';
import { getApiErrorMessage } from '@/api/client';
import { serviceKeys } from '@/lib/queryKeys';
import type { Service } from '@/api/types';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(120),
  durationMin: z
    .number({ error: 'Informe a duração' })
    .int('Use minutos inteiros')
    .min(5, 'Mínimo 5 min')
    .max(480, 'Máximo 8 horas'),
  price: z.number({ error: 'Informe o preço' }).min(0, 'Preço inválido'),
  description: z.string().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
}

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const qc = useQueryClient();
  const isEditing = Boolean(service);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', durationMin: 30, price: 0, description: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: service?.name ?? '',
        durationMin: service?.durationMin ?? 30,
        price: service ? Number(service.price) : 0,
        description: service?.description ?? '',
      });
    }
  }, [open, service, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name.trim(),
        durationMin: values.durationMin,
        price: values.price,
        description: values.description?.trim() ? values.description.trim() : undefined,
      };
      return service ? updateService(service.id, payload) : createService(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Serviço atualizado.' : 'Serviço criado.');
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar serviço')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          <DialogDescription>Defina nome, duração e preço.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="svc-name">Nome</Label>
            <Input id="svc-name" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="svc-duration">Duração (min)</Label>
              <Input
                id="svc-duration"
                type="number"
                min={5}
                step={5}
                {...register('durationMin', { valueAsNumber: true })}
              />
              {errors.durationMin ? (
                <p className="text-xs text-destructive">{errors.durationMin.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-price">Preço (R$)</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                step={0.01}
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price ? <p className="text-xs text-destructive">{errors.price.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="svc-desc">Descrição (opcional)</Label>
            <Textarea id="svc-desc" rows={3} {...register('description')} />
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
      </DialogContent>
    </Dialog>
  );
}
