// ============================================================
// TIPOS UNIFICADOS - GDP Cloud + Gestion HR Institucional
// ============================================================

// ------------ DECRETOS (Sistema PA/FL) ------------

export type SolicitudType = 'PA' | 'FL';

/** Employee simplificado para el sistema de decretos */
export interface Employee {
  nombre: string;
  rut: string;
}

export interface PermitRecord {
  id: string; // ID del documento Firestore
  employeeId?: string; // ID del funcionario en el sistema HR
  solicitudType: SolicitudType;
  decreto: string;
  materia: string;
  acto: string;
  funcionario: string;
  rut: string;
  periodo: string;
  cantidadDias: number;
  fechaInicio: string;
  tipoJornada: string;
  diasHaber: number;
  fechaDecreto: string;
  ra: string;
  emite: string;
  observaciones: string;
  createdAt: number;
  // Campos especificos para FL (Feriado Legal)
  fechaTermino?: string;
  periodo1?: string;
  saldoDisponibleP1?: number;
  solicitadoP1?: number;
  saldoFinalP1?: number;
  periodo2?: string;
  saldoDisponibleP2?: number;
  solicitadoP2?: number;
  saldoFinalP2?: number;
}

export type PermitFormData = Omit<PermitRecord, 'id' | 'createdAt'>;

// ------------ GESTION HR (Sistema de Solicitudes) ------------

/**
 * Type of leave/absence a funcionario can request.
 * Each type has different day-counting rules:
 * - LEGAL_HOLIDAY & ADMINISTRATIVE: count only business days (exclude weekends + holidays)
 * - SICK_LEAVE, WITHOUT_PAY, PARENTAL: count calendar days
 */
export enum LeaveType {
  LEGAL_HOLIDAY = 'Feriado Legal',
  ADMINISTRATIVE = 'Permiso Administrativo',
  SICK_LEAVE = 'Licencia Medica',
  WITHOUT_PAY = 'Permiso Sin Goce de Sueldo',
  PARENTAL = 'Permiso Post Natal Parental'
}

/**
 * Work shift during which the leave is taken.
 * Half-day shifts (JM/JT) on a single day count as 0.5 days.
 */
export enum WorkShift {
  JC = 'Jornada Completa',
  JM = 'Jornada Manana',
  JT = 'Jornada Tarde'
}

/**
 * Status lifecycle of a leave request: Pending -> Approved/Rejected.
 * When a request transitions from APPROVED to REJECTED, used days are reversed.
 */
export enum LeaveStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado'
}

/**
 * Application-level configuration for leave day defaults and email templates.
 * Stored in localStorage alongside employee and request data.
 */
export interface AppConfig {
  /** Default annual vacation (feriado legal) days for new employees */
  defaultVacationDays: number;
  /** Default annual administrative permission days for new employees */
  defaultAdminDays: number;
  /** Reference threshold for annual sick leave days */
  defaultSickLeaveDays: number;
  /** Email address where daily reports are sent */
  notificationEmail: string;
  /** General fallback email template. Variables: {NOMBRE}, {CARGO}, {TIPO}, {JORNADA}, {DESDE}, {HASTA}, {MOTIVO} */
  emailTemplate: string;
  /** Template specific to Feriado Legal requests */
  templateLegalHoliday?: string;
  /** Template specific to Permiso Administrativo requests */
  templateAdministrative?: string;
  /** Template specific to Licencia Medica requests */
  templateSickLeave?: string;
  /** Whether vacation remaining days can be carried over to next period */
  carryoverVacationEnabled?: boolean;
  /** Maximum annual periods allowed to accumulate as vacation balance */
  carryoverVacationMaxPeriods?: number;
  /** Whether unused administrative days expire at year-end */
  adminDaysExpireAtYearEnd?: boolean;
  /** Number of days before Dec 31 to warn RRHH about expiring balances */
  yearCloseReminderDays?: number;
}

/**
 * Represents a funcionario (employee) in the institution - Extended version.
 * Day balances are tracked separately for each leave type.
 */
export interface EmployeeExtended {
  /** Unique identifier (generated via Date.now()) */
  id: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  /** RUT del funcionario (obligatorio para el sistema institucional) */
  rut: string;
  /** Job title / role within the institution */
  position: string;
  /** Organizational unit / department */
  department: string;
  /** Fecha de nacimiento */
  birthDate: string;
  /** Fecha de ingreso institucional */
  hireDate: string;
  /** Institutional email address */
  email: string;
  /** Email de contacto personal */
  emailPersonal: string;
  /** Nombre de la jefatura directa */
  jefaturaNombre: string;
  /** Correo de la jefatura directa */
  jefaturaEmail: string;
  /** Información de contacto en caso de emergencia */
  emergencyContact: string;
  /** Total annual vacation (feriado legal) days allocated */
  totalVacationDays: number;
  /** Vacation days consumed this year */
  usedVacationDays: number;
  /** Total annual administrative days allocated */
  totalAdminDays: number;
  /** Administrative days consumed this year */
  usedAdminDays: number;
  /** Reference threshold for sick leave tracking */
  totalSickLeaveDays: number;
  /** Sick leave days consumed this year */
  usedSickLeaveDays: number;
  /** URL for the employee's avatar (ui-avatars.com) */
  avatarUrl: string;
}

/**
 * A leave/absence request submitted on behalf of an employee.
 * Tracks the date range, type, shift, day count, and current status.
 */
export interface LeaveRequest {
  /** Unique identifier (generated via Date.now()) */
  id: string;
  /** Foreign key referencing Employee.id */
  employeeId: string;
  /** Category of leave being requested */
  type: LeaveType;
  /** Start date in YYYY-MM-DD format */
  startDate: string;
  /** End date in YYYY-MM-DD format (inclusive) */
  endDate: string;
  /** Calculated days to deduct (may be 0.5 for half-day shifts) */
  daysCount: number;
  /** Current approval status */
  status: LeaveStatus;
  /** Optional reason or observation for the request */
  reason: string;
  /** Work shift during which the leave occurs */
  shift: WorkShift;
}

/**
 * Summary statistics for the dashboard view.
 */
export interface DashboardStats {
  totalEmployees: number;
  activeLeaves: number;
  pendingRequests: number;
  totalVacationDaysUsed: number;
}

/**
 * In-app notification displayed as a toast message.
 * Auto-dismissed after 4 seconds.
 */
export interface Notification {
  /** Unique identifier (generated via Date.now()) */
  id: string;
  /** Text content of the notification */
  message: string;
  /** Visual style: success (green), error (red), info (blue) */
  type: 'success' | 'error' | 'info';
}

// ------------ TIPOS DE NAVEGACION ------------

export type ViewType =
  | 'decretos'      // Vista principal de decretos PA/FL
  | 'dashboard'     // Dashboard de estadisticas
  | 'calendar'      // Calendario de ausencias
  | 'employees'     // Lista de funcionarios
  | 'requests'      // Solicitudes de permisos
  | 'reports'       // Reportes
  | 'settings';     // Configuracion
