export type UserRole = 'ADMIN' | 'COLLABORATOR';

export type Specialty =
  | 'HAIRDRESSER'
  | 'MANICURE'
  | 'PEDICURE'
  | 'MAKEUP_ARTIST'
  | 'EYEBROW'
  | 'AESTHETICIAN';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  collaboratorProfile?: {
    specialties: Specialty[];
    avatarUrl: string | null;
  } | null;
}

export interface CollaboratorProfile {
  id: string;
  specialties: Specialty[];
  bio: string | null;
  avatarUrl: string | null;
}

export interface CollaboratorServiceRateItem {
  serviceId: string;
  serviceName: string;
  durationMin: number;
  configuredRate: number | null;
  effectiveRate: number;
}

export interface WorkingHour {
  id: string;
  collaboratorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  collaboratorProfile: CollaboratorProfile | null;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string; // Decimal serialized
  salonFeeRatePercent?: string | null;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  collaboratorId: string;
  clientId: string;
  serviceId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  // Snapshots de preço/taxa (Decimal serializado como string). A taxa é
  // resolvida no servidor; nunca enviada pelo colaborador.
  priceAtBooking?: string | null;
  standardPriceAtBooking?: string | null;
  salonFeeRateAtBooking?: string | null;
  priceSetById?: string | null;
  client?: Pick<Client, 'id' | 'name' | 'phone'>;
  service?: Pick<Service, 'id' | 'name' | 'durationMin' | 'price'>;
  collaborator?: { id: string; name: string };
}

/** Preço negociado de um cliente para um serviço (price book). */
export interface ClientServicePrice {
  serviceId: string;
  serviceName: string;
  price: number;
  standardPrice: number;
  updatedById: string | null;
  updatedAt: string;
}

/** Preço sugerido resolvido para (cliente, serviço): do book ou o padrão. */
export interface ResolvedClientPrice {
  serviceId: string;
  serviceName: string;
  price: number;
  standardPrice: number;
  source: 'book' | 'standard';
}

export interface DailyDashboardResponse {
  date: string;
  generatedAt: string;
  summary: {
    totalAppointments: number;
    scheduled: number;
    inProgress: number;
    done: number;
    cancelled: number;
    noShow: number;
  };
  collaborators: Array<{
    id: string;
    name: string;
    collaboratorProfile: { specialties: Specialty[]; avatarUrl: string | null } | null;
    appointments: Appointment[];
  }>;
}

export interface Pagination<T> {
  users?: T[];
  clients?: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// Mirrors backend STATUS_TRANSITIONS in src/config/constants.ts.
export const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export type CashClosingPeriod = 'day' | 'week' | 'month';

export interface CashClosingSettings {
  defaultSalonFeeRatePercent: number;
  services: Array<{
    id: string;
    name: string;
    price: number;
    salonFeeRatePercent: number | null;
  }>;
  updatedAt: string;
}

export interface CashClosingBreakdownRow {
  id: string;
  name: string;
  count: number;
  gross: number;
  salonShare: number;
  collaboratorShare: number;
}

export interface CashClosingReport {
  period: CashClosingPeriod;
  anchorDate: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    appointmentCount: number;
    totalGross: number;
    totalSalonShare: number;
    totalCollaboratorShare: number;
  };
  byCollaborator: CashClosingBreakdownRow[];
  byService: CashClosingBreakdownRow[];
  appointments: Array<{
    id: string;
    scheduledDate: string;
    startTime: string;
    gross: number;
    salonFeeRatePercent: number;
    salonShare: number;
    collaboratorShare: number;
    clientName: string;
    serviceName: string;
    collaboratorName: string;
  }>;
  isClosed: boolean;
  closing: { id: string; closedAt: string; closedByName: string } | null;
}

export interface CashClosingHistoryItem {
  id: string;
  period: CashClosingPeriod;
  periodStart: string;
  periodEnd: string;
  totalGross: number;
  totalSalonShare: number;
  totalCollaboratorShare: number;
  appointmentCount: number;
  notes: string | null;
  closedAt: string;
  closedByName: string;
}
