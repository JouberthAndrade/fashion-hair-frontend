import { describe, expect, it } from 'vitest';
import { digitsOnly, formatBRPhone, isValidBRPhone } from './phone';

describe('digitsOnly', () => {
  it('strips formatting', () => {
    expect(digitsOnly('(11) 99999-9999')).toBe('11999999999');
    expect(digitsOnly('+55 11 9999-9999')).toBe('551199999999');
  });

  it('returns empty for empty/falsy-like input', () => {
    expect(digitsOnly('')).toBe('');
    expect(digitsOnly('---')).toBe('');
  });
});

describe('formatBRPhone', () => {
  it('formats progressively while typing', () => {
    expect(formatBRPhone('1')).toBe('(1');
    expect(formatBRPhone('11')).toBe('(11');
    expect(formatBRPhone('1198')).toBe('(11) 98');
    expect(formatBRPhone('11999991')).toBe('(11) 9999-91');
  });

  it('formats 10-digit landlines', () => {
    expect(formatBRPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('formats 11-digit mobiles', () => {
    expect(formatBRPhone('11999998888')).toBe('(11) 99999-8888');
  });

  it('returns "" for empty input', () => {
    expect(formatBRPhone('')).toBe('');
  });

  it('truncates extra digits beyond 11', () => {
    expect(formatBRPhone('11999998888777')).toBe('(11) 99999-8888');
  });
});

describe('isValidBRPhone', () => {
  it.each([
    ['(11) 3333-4444', true],
    ['(11) 99999-8888', true],
    ['11999998888', true],
    ['1133334444', true],
  ])('accepts %s', (input, expected) => {
    expect(isValidBRPhone(input)).toBe(expected);
  });

  it.each([
    ['', false],
    ['11', false],
    ['(11) 99', false],
    ['11999', false],
    ['11999999999999', false],
  ])('rejects %s', (input, expected) => {
    expect(isValidBRPhone(input)).toBe(expected);
  });
});
