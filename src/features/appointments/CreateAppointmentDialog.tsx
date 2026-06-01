import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientCombobox } from '@/features/clients/ClientCombobox';
import { PhoneInput } from '@/components/shared/PhoneInput';

import { listServices } from '@/api/services';
import { listCollaborators } from '@/api/collaborators';
import { useAuthStore } from '@/stores/authStore';
import { useCreateAppointment } from './useAppointmentMutations';
import { todayISO, formatCurrency } from '@/lib/date';
import { clientKeys, collaboratorKeys, serviceKeys } from '@/lib/queryKeys';
import { isValidBRPhone } from '@/lib/phone';

const schema = z
  .object({
    collaboratorId: z.string().uuid('Selecione um colaborador'),
    serviceId: z.string().uuid('Selecione um serviço'),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido (HH:MM)'),
    notes: z.string().max(500).optional().or(z.literal('')),
    clientMode: z.enum(['existing', 'new']),
    clientId: z.string().optional(),
    newClientName: z.string().optional(),
    newClientPhone: z.string().optional(),
    newClientEmail: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.clientMode === 'existing') {
      if (!val.clientId) {
        ctx.addIssue({ code: 'custom', path: ['clientId'], message: 'Selecione um cliente' });
      }
    } else {
      if (!val.newClientName || val.newClientName.trim().length < 2) {
        ctx.addIssue({ code: 'custom', path: ['newClientName'], message: 'Mínimo 2 caracteres' });
      }
      if (!val.newClientPhone || !isValidBRPhone(val.newClientPhone)) {
        ctx.addIssue({
          code: 'custom',
          path: ['newClientPhone'],
          message: 'Telefone inválido (use 10 ou 11 dígitos)',
        });
      }
      if (val.newClientEmail && val.newClientEmail.length > 0) {
        if (!z.string().email().safeParse(val.newClientEmail).success) {
          ctx.addIssue({ code: 'custom', path: ['newClientEmail'], message: 'E-mail inválido' });
        }
      }
    }
  });

type FormValues = z.infer<typeof schema>;

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCollaboratorId?: string;
  defaultDate?: string;
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  defaultCollaboratorId,
  defaultDate,
}: CreateAppointmentDialogProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const createMut = useCreateAppointment();

  const { data: services = [] } = useQuery({
    queryKey: serviceKeys.active(),
    queryFn: () => listServices(false),
    enabled: open,
  });

  const { data: collaborators = [] } = useQuery({
    queryKey: collaboratorKeys.lists(),
    queryFn: () => listCollaborators(),
    enabled: open && isAdmin,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      collaboratorId: defaultCollaboratorId ?? user?.id ?? '',
      serviceId: '',
      scheduledDate: defaultDate ?? todayISO(),
      startTime: '',
      notes: '',
      clientMode: 'existing',
      clientId: '',
      newClientName: '',
      newClientPhone: '',
      newClientEmail: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        collaboratorId: defaultCollaboratorId ?? user?.id ?? '',
        serviceId: '',
        scheduledDate: defaultDate ?? todayISO(),
        startTime: '',
        notes: '',
        clientMode: 'existing',
        clientId: '',
        newClientName: '',
        newClientPhone: '',
        newClientEmail: '',
      });
    }
  }, [open, defaultCollaboratorId, defaultDate, reset, user?.id]);

  const watchedServiceId = useWatch({ control, name: 'serviceId' });
  const clientMode = useWatch({ control, name: 'clientMode' });
  const selectedService = services.find((s) => s.id === watchedServiceId);

  const onSubmit = (values: FormValues) => {
    const base = {
      collaboratorId: values.collaboratorId,
      serviceId: values.serviceId,
      scheduledDate: values.scheduledDate,
      startTime: values.startTime,
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
    };
    const clientPart =
      values.clientMode === 'existing'
        ? { clientId: values.clientId! }
        : {
            newClient: {
              name: values.newClientName!.trim(),
              phone: values.newClientPhone!.trim(),
              email: values.newClientEmail?.trim() ? values.newClientEmail.trim() : undefined,
            },
          };

    createMut.mutate({ ...base, ...clientPart }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>Preencha os dados para criar um agendamento.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {isAdmin ? (
            <div className="space-y-2">
              <Label htmlFor="collaboratorId">Colaborador</Label>
              <Controller
                control={control}
                name="collaboratorId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="collaboratorId">
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {collaborators.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.collaboratorId ? (
                <p className="text-xs text-destructive">{errors.collaboratorId.message}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="serviceId">Serviço</Label>
            <Controller
              control={control}
              name="serviceId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="serviceId">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} • {s.durationMin}min • {formatCurrency(s.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedService ? (
              <p className="text-xs text-muted-foreground">
                Duração: {selectedService.durationMin} min · Preço do serviço:{' '}
                {formatCurrency(selectedService.price)}
              </p>
            ) : null}
            {errors.serviceId ? (
              <p className="text-xs text-destructive">{errors.serviceId.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Data</Label>
              <Input id="scheduledDate" type="date" {...register('scheduledDate')} />
              {errors.scheduledDate ? (
                <p className="text-xs text-destructive">{errors.scheduledDate.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário</Label>
              <Input id="startTime" type="time" step={60} {...register('startTime')} />
              {errors.startTime ? (
                <p className="text-xs text-destructive">{errors.startTime.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <div className="flex rounded-md border bg-secondary p-1 text-sm">
              <button
                type="button"
                onClick={() => setValue('clientMode', 'existing', { shouldValidate: true })}
                className={`flex-1 rounded px-3 py-1.5 transition ${
                  clientMode === 'existing' ? 'bg-background shadow' : 'text-muted-foreground'
                }`}
              >
                Existente
              </button>
              <button
                type="button"
                onClick={() => setValue('clientMode', 'new', { shouldValidate: true })}
                className={`flex-1 rounded px-3 py-1.5 transition ${
                  clientMode === 'new' ? 'bg-background shadow' : 'text-muted-foreground'
                }`}
              >
                Novo cliente
              </button>
            </div>

            {clientMode === 'existing' ? (
              <Controller
                control={control}
                name="clientId"
                render={({ field }) => (
                  <ClientCombobox
                    value={field.value}
                    onChange={(c) => field.onChange(c?.id ?? '')}
                  />
                )}
              />
            ) : (
              <div className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="newClientName">Nome</Label>
                    <Input id="newClientName" {...register('newClientName')} />
                    {errors.newClientName ? (
                      <p className="text-xs text-destructive">{errors.newClientName.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newClientPhone">Telefone</Label>
                    <Controller
                      control={control}
                      name="newClientPhone"
                      render={({ field }) => (
                        <PhoneInput
                          id="newClientPhone"
                          placeholder="(11) 99999-9999"
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                    {errors.newClientPhone ? (
                      <p className="text-xs text-destructive">{errors.newClientPhone.message}</p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newClientEmail">E-mail (opcional)</Label>
                  <Input id="newClientEmail" type="email" {...register('newClientEmail')} />
                  {errors.newClientEmail ? (
                    <p className="text-xs text-destructive">{errors.newClientEmail.message}</p>
                  ) : null}
                </div>
              </div>
            )}
            {errors.clientId ? (
              <p className="text-xs text-destructive">{errors.clientId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                'Criar agendamento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
