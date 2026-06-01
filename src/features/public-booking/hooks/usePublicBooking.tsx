import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PublicAppointmentResult, PublicCollaborator, PublicService } from '@/api/publicBooking';

export type BookingStep = 'intro' | 'service' | 'professional' | 'datetime' | 'contact' | 'confirmation';

export type BookingState = {
  service: PublicService | null;
  collaborator: PublicCollaborator | null;
  scheduledDate: string;
  startTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  marketingOptIn: boolean;
  result: PublicAppointmentResult | null;
};

const initialState: BookingState = {
  service: null,
  collaborator: null,
  scheduledDate: '',
  startTime: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  marketingOptIn: false,
  result: null,
};

type BookingContextValue = {
  step: BookingStep;
  state: BookingState;
  setStep: (step: BookingStep) => void;
  updateState: (patch: Partial<BookingState>) => void;
  reset: () => void;
  steps: BookingStep[];
  stepIndex: number;
};

const BookingContext = createContext<BookingContextValue | null>(null);

const WIZARD_STEPS: BookingStep[] = ['service', 'professional', 'datetime', 'contact'];

export function PublicBookingProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<BookingStep>('service');
  const [state, setState] = useState<BookingState>(initialState);

  const value = useMemo<BookingContextValue>(
    () => ({
      step,
      state,
      setStep,
      updateState: (patch) => setState((prev) => ({ ...prev, ...patch })),
      reset: () => {
        setState(initialState);
        setStep('service');
      },
      steps: WIZARD_STEPS,
      stepIndex: WIZARD_STEPS.indexOf(step),
    }),
    [step, state],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function usePublicBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('usePublicBooking must be used within PublicBookingProvider');
  return ctx;
}
