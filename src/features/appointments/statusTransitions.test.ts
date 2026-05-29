import { describe, expect, it } from 'vitest';
import {
  canTransitionTo,
  getStatusTransitions,
  isTerminalStatus,
} from './statusTransitions';
import type { AppointmentStatus } from '@/api/types';

describe('getStatusTransitions', () => {
  it('returns [IN_PROGRESS, CANCELLED, NO_SHOW] for SCHEDULED', () => {
    expect(getStatusTransitions('SCHEDULED')).toEqual([
      'IN_PROGRESS',
      'CANCELLED',
      'NO_SHOW',
    ]);
  });

  it('returns [DONE, CANCELLED] for IN_PROGRESS', () => {
    expect(getStatusTransitions('IN_PROGRESS')).toEqual(['DONE', 'CANCELLED']);
  });

  it('returns [] for terminal states', () => {
    expect(getStatusTransitions('DONE')).toEqual([]);
    expect(getStatusTransitions('CANCELLED')).toEqual([]);
    expect(getStatusTransitions('NO_SHOW')).toEqual([]);
  });

  it('never returns the same status as a transition target (no self-loops)', () => {
    const all: AppointmentStatus[] = [
      'SCHEDULED',
      'IN_PROGRESS',
      'DONE',
      'CANCELLED',
      'NO_SHOW',
    ];
    for (const status of all) {
      expect(getStatusTransitions(status)).not.toContain(status);
    }
  });
});

describe('isTerminalStatus', () => {
  it('flags DONE / CANCELLED / NO_SHOW as terminal', () => {
    expect(isTerminalStatus('DONE')).toBe(true);
    expect(isTerminalStatus('CANCELLED')).toBe(true);
    expect(isTerminalStatus('NO_SHOW')).toBe(true);
  });

  it('does not flag SCHEDULED / IN_PROGRESS as terminal', () => {
    expect(isTerminalStatus('SCHEDULED')).toBe(false);
    expect(isTerminalStatus('IN_PROGRESS')).toBe(false);
  });
});

describe('canTransitionTo', () => {
  it('allows the documented transitions', () => {
    expect(canTransitionTo('SCHEDULED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionTo('SCHEDULED', 'CANCELLED')).toBe(true);
    expect(canTransitionTo('SCHEDULED', 'NO_SHOW')).toBe(true);
    expect(canTransitionTo('IN_PROGRESS', 'DONE')).toBe(true);
    expect(canTransitionTo('IN_PROGRESS', 'CANCELLED')).toBe(true);
  });

  it('rejects skipping IN_PROGRESS (SCHEDULED → DONE is not allowed)', () => {
    expect(canTransitionTo('SCHEDULED', 'DONE')).toBe(false);
  });

  it('rejects re-opening a terminal appointment', () => {
    expect(canTransitionTo('DONE', 'IN_PROGRESS')).toBe(false);
    expect(canTransitionTo('CANCELLED', 'SCHEDULED')).toBe(false);
    expect(canTransitionTo('NO_SHOW', 'SCHEDULED')).toBe(false);
  });

  it('rejects NO_SHOW from IN_PROGRESS (client already arrived)', () => {
    expect(canTransitionTo('IN_PROGRESS', 'NO_SHOW')).toBe(false);
  });
});
