import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { upsertProfile } from '@/api/collaborators';
import { getApiErrorMessage } from '@/api/client';
import { collaboratorKeys } from '@/lib/queryKeys';
import { SPECIALTY_LABELS } from '@/lib/enumLabels';
import type { Collaborator, Specialty } from '@/api/types';

const SPECIALTIES: Specialty[] = [
  'HAIRDRESSER',
  'MANICURE',
  'PEDICURE',
  'MAKEUP_ARTIST',
  'EYEBROW',
  'AESTHETICIAN',
];

const schema = z.object({
  specialty: z.enum([
    'HAIRDRESSER',
    'MANICURE',
    'PEDICURE',
    'MAKEUP_ARTIST',
    'EYEBROW',
    'AESTHETICIAN',
  ]),
  bio: z.string().max(500).optional().or(z.literal('')),
  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: Collaborator;
}

export function CollaboratorProfileDialog({ open, onOpenChange, collaborator }: Props) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { specialty: 'HAIRDRESSER', bio: '', avatarUrl: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        specialty: collaborator.collaboratorProfile?.specialty ?? 'HAIRDRESSER',
        bio: collaborator.collaboratorProfile?.bio ?? '',
        avatarUrl: collaborator.collaboratorProfile?.avatarUrl ?? '',
      });
    }
  }, [open, collaborator, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      upsertProfile(collaborator.id, {
        specialty: values.specialty,
        bio: values.bio?.trim() ? values.bio.trim() : undefined,
        avatarUrl: values.avatarUrl?.trim() ? values.avatarUrl.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success('Perfil atualizado.');
      qc.invalidateQueries({ queryKey: collaboratorKeys.all });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar perfil')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Perfil do colaborador</DialogTitle>
          <DialogDescription>{collaborator.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Controller
              control={control}
              name="specialty"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SPECIALTY_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.specialty ? <p className="text-xs text-destructive">{errors.specialty.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">URL do avatar (opcional)</Label>
            <Input id="avatar" placeholder="https://..." {...register('avatarUrl')} />
            {errors.avatarUrl ? (
              <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (opcional)</Label>
            <Textarea id="bio" rows={3} {...register('bio')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
