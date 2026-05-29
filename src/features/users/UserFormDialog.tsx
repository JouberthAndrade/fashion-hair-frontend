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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createUser, updateUser } from '@/api/users';
import { getApiErrorMessage } from '@/api/client';
import { collaboratorKeys, userKeys } from '@/lib/queryKeys';
import type { User, UserRole } from '@/api/types';

const baseSchema = {
  name: z.string().min(2, 'Mínimo 2 caracteres').max(120),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['ADMIN', 'COLLABORATOR'] as const),
};

const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const updateSchema = z.object({
  ...baseSchema,
  isActive: z.boolean(),
});

type CreateValues = z.infer<typeof createSchema>;
type UpdateValues = z.infer<typeof updateSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserFormDialog({ open, onOpenChange, user }: Props) {
  const isEditing = Boolean(user);
  const qc = useQueryClient();

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', email: '', password: '', role: 'COLLABORATOR' },
  });

  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { name: '', email: '', role: 'COLLABORATOR', isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    if (user) {
      updateForm.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      createForm.reset({ name: '', email: '', password: '', role: 'COLLABORATOR' });
    }
  }, [open, user, createForm, updateForm]);

  const createMut = useMutation({
    mutationFn: (values: CreateValues) =>
      createUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      }),
    onSuccess: () => {
      toast.success('Usuário criado.');
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: collaboratorKeys.all });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao criar usuário')),
  });

  const updateMut = useMutation({
    mutationFn: (values: UpdateValues) => {
      if (!user) throw new Error('Sem usuário');
      return updateUser(user.id, {
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role as UserRole,
        isActive: values.isActive,
      });
    },
    onSuccess: () => {
      toast.success('Usuário atualizado.');
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: collaboratorKeys.all });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao atualizar')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os dados do usuário.' : 'Cadastre um novo administrador ou colaborador.'}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <form
            onSubmit={updateForm.handleSubmit((v) => updateMut.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="user-name">Nome</Label>
              <Input id="user-name" {...updateForm.register('name')} />
              {updateForm.formState.errors.name ? (
                <p className="text-xs text-destructive">{updateForm.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">E-mail</Label>
              <Input id="user-email" type="email" {...updateForm.register('email')} />
              {updateForm.formState.errors.email ? (
                <p className="text-xs text-destructive">{updateForm.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Controller
                control={updateForm.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <Controller
                control={updateForm.control}
                name="isActive"
                render={({ field }) => (
                  <input
                    id="user-active"
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4"
                  />
                )}
              />
              <Label htmlFor="user-active">Usuário ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMut.isPending}>
                {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form
            onSubmit={createForm.handleSubmit((v) => createMut.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="user-name">Nome</Label>
              <Input id="user-name" {...createForm.register('name')} />
              {createForm.formState.errors.name ? (
                <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">E-mail</Label>
              <Input id="user-email" type="email" {...createForm.register('email')} />
              {createForm.formState.errors.email ? (
                <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Senha inicial</Label>
              <Input id="user-password" type="password" {...createForm.register('password')} />
              {createForm.formState.errors.password ? (
                <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Controller
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Criar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
