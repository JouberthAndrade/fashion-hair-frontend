import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLong(iso: string): string {
  return format(parseISO(iso), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy');
}

export function formatCurrency(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

// Generates HH:00 and HH:30 slots between two HH:MM bounds, e.g. "08:00".."18:00".
export function generateTimeSlots(startTime = '08:00', endTime = '20:00', stepMin = 30): string[] {
  const slots: string[] = [];
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  let total = sH * 60 + sM;
  const end = eH * 60 + eM;
  while (total < end) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    total += stepMin;
  }
  return slots;
}
