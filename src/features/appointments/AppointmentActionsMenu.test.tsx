import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentActionsMenu } from './AppointmentActionsMenu';
import type { Appointment } from '@/api/types';

function makeAppointment(status: Appointment['status']): Appointment {
  return {
    id: 'appt-1',
    collaboratorId: 'col-1',
    clientId: 'cli-1',
    serviceId: 'svc-1',
    scheduledDate: '2026-01-01',
    startTime: '10:00',
    endTime: '11:00',
    status,
    notes: null,
  };
}

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('AppointmentActionsMenu', () => {
  it('renders the trigger when there are available transitions', () => {
    renderWithClient(
      <AppointmentActionsMenu appointment={makeAppointment('SCHEDULED')} />,
    );
    expect(screen.getByRole('button', { name: /ações/i })).toBeInTheDocument();
  });

  it('renders nothing for terminal statuses', () => {
    const { container } = renderWithClient(
      <AppointmentActionsMenu appointment={makeAppointment('DONE')} />,
    );
    expect(container).toBeEmptyDOMElement();

    const cancelled = renderWithClient(
      <AppointmentActionsMenu appointment={makeAppointment('CANCELLED')} />,
    );
    expect(cancelled.container).toBeEmptyDOMElement();

    const noShow = renderWithClient(
      <AppointmentActionsMenu appointment={makeAppointment('NO_SHOW')} />,
    );
    expect(noShow.container).toBeEmptyDOMElement();
  });
});
