import type { AppointmentStatus, DayOfWeek, Specialty } from '@/api/types';

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  HAIRDRESSER: 'Cabeleireiro(a)',
  MANICURE: 'Manicure',
  PEDICURE: 'Pedicure',
  MAKEUP_ARTIST: 'Maquiador(a)',
  EYEBROW: 'Design de Sobrancelha',
  AESTHETICIAN: 'Esteticista',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em atendimento',
  DONE: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};

// Tailwind class strings for badge + card backgrounds, used on the salon TV display.
export const STATUS_STYLES: Record<AppointmentStatus, { badge: string; ring: string }> = {
  SCHEDULED: { badge: 'bg-blue-100 text-blue-800 border-blue-300', ring: 'ring-blue-400' },
  IN_PROGRESS: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse', ring: 'ring-yellow-400' },
  DONE: { badge: 'bg-green-100 text-green-800 border-green-300', ring: 'ring-green-400' },
  CANCELLED: { badge: 'bg-gray-100 text-gray-600 border-gray-300 line-through', ring: 'ring-gray-300' },
  NO_SHOW: { badge: 'bg-red-100 text-red-800 border-red-300', ring: 'ring-red-400' },
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export const DAYS_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
