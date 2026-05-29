import { STATUS_TRANSITIONS, type AppointmentStatus } from '@/api/types';

/**
 * Returns the statuses that an appointment in `current` can transition into.
 * Mirrors the backend's STATUS_TRANSITIONS map and is the single source of
 * truth on the frontend for what transition buttons should be enabled.
 */
export function getStatusTransitions(current: AppointmentStatus): AppointmentStatus[] {
  return STATUS_TRANSITIONS[current] ?? [];
}

/** Statuses that cannot be transitioned out of (terminal states). */
export function isTerminalStatus(status: AppointmentStatus): boolean {
  return getStatusTransitions(status).length === 0;
}

/** True if `next` is a valid transition from `current`. */
export function canTransitionTo(
  current: AppointmentStatus,
  next: AppointmentStatus,
): boolean {
  return getStatusTransitions(current).includes(next);
}
