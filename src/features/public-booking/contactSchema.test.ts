import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { isValidBRPhone } from '@/lib/phone';

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().refine(isValidBRPhone, 'Telefone inválido'),
  privacyConsent: z.boolean().refine((v) => v, 'Aceite a Política de Privacidade'),
});

describe('public booking contact schema', () => {
  it('accepts valid contact data', () => {
    const result = contactSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
      phone: '(11) 98765-4321',
      privacyConsent: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone and missing consent', () => {
    const result = contactSchema.safeParse({
      name: 'Maria',
      email: 'maria@exemplo.com',
      phone: '123',
      privacyConsent: false,
    });
    expect(result.success).toBe(false);
  });
});
