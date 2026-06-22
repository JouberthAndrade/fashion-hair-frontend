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
import { Checkbox } from '@/components/ui/checkbox';
import { upsertProfile } from '@/api/collaborators';
import { getApiErrorMessage } from '@/api/client';
import { collaboratorKeys } from '@/lib/queryKeys';
import { SPECIALTY_LABELS } from '@/lib/enumLabels';
import type { Collaborator, Specialty } from '@/api/types';

const ALL_SPECIALTIES: Specialty[] = [
  'HAIRDRESSER',
  'MANICURE',
  'PEDICURE',
  'MAKEUP_ARTIST',
  'EYEBROW',
  'AESTHETICIAN',
];

const schema = z.object({
  specialties: z.array(z.enum([
    'HAIRDRESSER', 'MANICURE', 'PEDICURE', 'MAKEUP_ARTIST', 'EYEBROW', 'AESTHETICIAN',
  ] as const)).min(1, 'Selecione ao menos uma especialidade'),
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { specialties: ['HAIRDRESSER'], bio: '', avatarUrl: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        specialties:
          collaborator.collaboratorProfile?.specialties?.length
            ? collaborator.collaboratorProfile.specialties
            : ['HAIRDRESSER'],
        bio: collaborator.collaboratorProfile?.bio ?? '',
        avatarUrl: collaborator.collaboratorProfile?.avatarUrl ?? '',
      });
    }
  }, [open, collaborator, reset]);

  const selectedSpecialties = watch('specialties');

  const toggleSpecialty = (s: Specialty) => {
    if (selectedSpecialties.includes(s)) {
      setValue(
        'specialties',
        selectedSpecialties.filter((x) => x !== s),
        { shouldValidate: true },
      );
    } else {
      setValue('specialties', [...selectedSpecialties, s], { shouldValidate: true });
    }
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      upsertProfile(collaborator.id, {
        specialties: values.specialties,
        bio: values.bio?.trim() ? values.bio.trim() : undefined,
        avatarUrl: values.avatarUrl?.trim() ? values.avatarUrl.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success('Perfil atualizado.');
      qc.invalidateQueries({ queryKey: collaboratorKeys.all });
      qc.invalidateQueries({ queryKey: collaboratorKeys.detail(collaborator.id) });
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
            <Label>Especialidades</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_SPECIALTIES.map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 hover:bg-secondary"
                >
                  <Checkbox
                    checked={selectedSpecialties.includes(s)}
                    onCheckedChange={() => toggleSpecialty(s)}
                  />
                  <span className="text-sm">{SPECIALTY_LABELS[s]}</span>
                </label>
              ))}
            </div>
            {errors.specialties ? (
              <p className="text-xs text-destructive">{errors.specialties.message}</p>
            ) : null}
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
