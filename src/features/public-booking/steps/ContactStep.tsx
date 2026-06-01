import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { isValidBRPhone } from '@/lib/phone';
import { formatCurrency, formatDateLong } from '@/lib/date';
import type { PublicCollaborator, PublicService } from '@/api/publicBooking';

const schema = z.object({
  name: z.string().min(2, 'Informe seu nome completo').max(120),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  phone: z.string().refine(isValidBRPhone, 'Telefone inválido'),
  privacyConsent: z.boolean().refine((v) => v, 'Aceite a Política de Privacidade'),
  marketingOptIn: z.boolean(),
});

export type ContactFormValues = z.infer<typeof schema>;

type Props = {
  service: PublicService;
  collaborator: PublicCollaborator;
  scheduledDate: string;
  startTime: string;
  defaultValues: Pick<ContactFormValues, 'name' | 'email' | 'phone' | 'marketingOptIn'>;
  isSubmitting: boolean;
  onSubmit: (values: ContactFormValues) => void;
  onBack: () => void;
};

export function ContactStep({
  service,
  collaborator,
  scheduledDate,
  startTime,
  defaultValues,
  isSubmitting,
  onSubmit,
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      privacyConsent: false,
      marketingOptIn: defaultValues.marketingOptIn ?? false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <h2 className="text-xl font-semibold">Seus dados</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Usaremos estas informações para confirmar seu agendamento. Se já agendou antes, use o
          mesmo nome, e-mail e telefone do cadastro.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4 text-sm">
        <p className="font-medium">{service.name}</p>
        <p className="text-muted-foreground">
          {formatDateLong(scheduledDate)} às {startTime} · {collaborator.name}
        </p>
        <p className="mt-1 font-semibold text-primary">{formatCurrency(service.price)}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-name">Nome completo</Label>
          <Input id="client-name" autoComplete="name" {...register('name')} />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-email">E-mail</Label>
          <Input id="client-email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-phone">Telefone</Label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="client-phone"
                value={field.value}
                onChange={field.onChange}
                aria-invalid={errors.phone ? 'true' : 'false'}
              />
            )}
          />
          {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-input"
            {...register('privacyConsent')}
          />
          <span>
            Li e aceito a{' '}
            <Link to="/agendar/privacidade" className="text-primary underline-offset-4 hover:underline">
              Política de Privacidade
            </Link>
            . Seus dados serão usados para agendar e contato sobre o horário.
          </span>
        </label>
        {errors.privacyConsent ? (
          <p className="text-xs text-destructive">{errors.privacyConsent.message}</p>
        ) : null}

        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-input"
            {...register('marketingOptIn')}
          />
          <span>Quero receber novidades e promoções por e-mail (opcional).</span>
        </label>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={isSubmitting}>
          Voltar
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Confirmando...
            </>
          ) : (
            'Confirmar agendamento'
          )}
        </Button>
      </div>
    </form>
  );
}
