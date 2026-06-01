import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPublicAppointment } from '@/api/publicBooking';
import { getApiErrorMessage } from '@/api/client';
import { BookingStepper } from './components/BookingStepper';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { ContactStep, type ContactFormValues } from './steps/ContactStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { ProfessionalStep } from './steps/ProfessionalStep';
import { ServiceStep } from './steps/ServiceStep';
import { PublicBookingProvider, usePublicBooking } from './hooks/usePublicBooking';
import { todayISO } from '@/lib/date';
import type { PublicCollaborator, PublicService } from '@/api/publicBooking';

function PublicBookingWizard() {
  const { step, setStep, state, updateState, reset, steps, stepIndex } = usePublicBooking();

  const bookingMutation = useMutation({
    mutationFn: createPublicAppointment,
    onSuccess: (result) => {
      updateState({ result });
      setStep('confirmation');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Não foi possível confirmar o agendamento'));
    },
  });

  const handleServicePick = (service: PublicService) => {
    updateState({
      service,
      collaborator: null,
      scheduledDate: '',
      startTime: '',
    });
    setStep('professional');
  };

  const handleProfessionalPick = (collaborator: PublicCollaborator) => {
    updateState({
      collaborator,
      scheduledDate: todayISO(),
      startTime: '',
    });
    setStep('datetime');
  };

  const handleTimePick = (startTime: string) => {
    updateState({ startTime });
    setStep('contact');
  };

  const handleContactSubmit = (values: ContactFormValues) => {
    if (!state.service || !state.collaborator || !state.scheduledDate || !state.startTime) return;

    updateState({
      clientName: values.name,
      clientEmail: values.email,
      clientPhone: values.phone,
      marketingOptIn: values.marketingOptIn,
    });

    bookingMutation.mutate({
      collaboratorId: state.collaborator.id,
      serviceId: state.service.id,
      scheduledDate: state.scheduledDate,
      startTime: state.startTime,
      client: {
        name: values.name,
        email: values.email,
        phone: values.phone,
      },
      privacyConsent: true,
      marketingOptIn: values.marketingOptIn,
    });
  };

  if (step === 'confirmation' && state.result) {
    return <ConfirmationStep result={state.result} onNewBooking={reset} />;
  }

  const showStepper = stepIndex >= 0;

  return (
    <div>
      {showStepper ? <BookingStepper steps={steps} current={step} /> : null}

      {step === 'service' ? (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Agende seu horário</h1>
            <p className="text-sm text-muted-foreground">Toque no serviço para continuar.</p>
          </div>
          <ServiceStep onPick={handleServicePick} />
        </div>
      ) : null}

      {step === 'professional' && state.service ? (
        <ProfessionalStep
          service={state.service}
          onPick={handleProfessionalPick}
          onBack={() => setStep('service')}
        />
      ) : null}

      {step === 'datetime' && state.service && state.collaborator ? (
        <DateTimeStep
          service={state.service}
          collaborator={state.collaborator}
          scheduledDate={state.scheduledDate || todayISO()}
          onDateChange={(scheduledDate) => updateState({ scheduledDate, startTime: '' })}
          onTimePick={handleTimePick}
          onBack={() => setStep('professional')}
          onChangeService={() => setStep('service')}
        />
      ) : null}

      {step === 'contact' && state.service && state.collaborator && state.scheduledDate && state.startTime ? (
        <ContactStep
          service={state.service}
          collaborator={state.collaborator}
          scheduledDate={state.scheduledDate}
          startTime={state.startTime}
          defaultValues={{
            name: state.clientName,
            email: state.clientEmail,
            phone: state.clientPhone,
            marketingOptIn: state.marketingOptIn,
          }}
          isSubmitting={bookingMutation.isPending}
          onSubmit={handleContactSubmit}
          onBack={() => setStep('datetime')}
        />
      ) : null}
    </div>
  );
}

export function PublicBookingPage() {
  return (
    <PublicBookingProvider>
      <PublicBookingWizard />
    </PublicBookingProvider>
  );
}
