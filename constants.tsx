// ============================================================
// CONSTANTES UNIFICADAS - GDP Cloud + Gestion HR Institucional
// ============================================================

import { EmployeeExtended, LeaveRequest, LeaveType, LeaveStatus, WorkShift } from './types';

// ------------ CONSTANTES DE LA APP ------------

export const APP_TITLE = "GDP Cloud - Gestion de Personas";

export const TABLE_COLUMNS = [
  "#", "Decreto", "Materia", "Acto", "Funcionario", "RUT", "Periodo",
  "Cantidad de dias", "Fecha de inicio", "Tipo de Jornada",
  "Dias a su haber", "Fecha", "Saldo final", "R.A", "Emite"
];

export const JORNADA_OPTIONS = [
  "Jornada manana",
  "Jornada tarde",
  "Jornada completa"
];

export const SOLICITUD_TYPES: { value: 'PA' | 'FL', label: string }[] = [
  { value: 'PA', label: 'PERMISO (PA)' },
  { value: 'FL', label: 'FERIADO (FL)' }
];

// ------------ FERIADOS NACIONALES ------------

// Holidays for 2025 and 2026 (YYYY-MM-DD)
// Source: Biblioteca del Congreso Nacional de Chile
export const HOLIDAYS = [
  // 2025
  '2025-01-01', // Ano Nuevo
  '2025-04-18', // Viernes Santo
  '2025-04-19', // Sabado Santo
  '2025-05-01', // Dia del Trabajo
  '2025-05-21', // Glorias Navales
  '2025-06-20', // Pueblos Indigenas
  '2025-06-29', // San Pedro y San Pablo
  '2025-07-16', // Virgen del Carmen
  '2025-08-15', // Asuncion de la Virgen
  '2025-09-18', // Independencia
  '2025-09-19', // Glorias del Ejercito
  '2025-10-12', // Encuentro de Dos Mundos
  '2025-10-31', // Iglesias Evangelicas
  '2025-11-01', // Todos los Santos
  '2025-12-08', // Inmaculada Concepcion
  '2025-12-25', // Navidad

  // 2026 (Estimated)
  '2026-01-01',
  '2026-04-03', // Viernes Santo
  '2026-04-04',
  '2026-05-01',
  '2026-05-21',
  '2026-06-21',
  '2026-06-29',
  '2026-07-16',
  '2026-08-15',
  '2026-09-18',
  '2026-09-19',
  '2026-10-12',
  '2026-10-31',
  '2026-11-01',
  '2026-12-08',
  '2026-12-25',
];

// ------------ EMPLEADOS INICIALES ------------

// Helper to create employee
const createEmp = (id: string, firstName: string, pLastName: string, mLastName: string = '', rut?: string, birthDate: string = '1990-01-01'): EmployeeExtended => ({
  id,
  firstName,
  lastNamePaternal: pLastName,
  lastNameMaternal: mLastName,
  rut: rut || '',
  birthDate,
  hireDate: '2024-01-01',
  email: `${firstName.split(' ')[0].toLowerCase()}.${pLastName.toLowerCase().replace(/ /g, '')}@institucion.cl`,
  emailPersonal: '',
  jefaturaNombre: 'Dirección General',
  jefaturaEmail: 'direccion@institucion.cl',
  emergencyContact: 'Familiar Directo (+56 9 1234 5678)',
  position: 'Funcionario',
  department: 'General',
  totalVacationDays: 15,
  usedVacationDays: 0,
  totalAdminDays: 6,
  usedAdminDays: 0,
  totalSickLeaveDays: 30,
  usedSickLeaveDays: 0,
  avatarUrl: `https://ui-avatars.com/api/?name=${firstName}+${pLastName}&background=random&color=fff`
});

export const INITIAL_EMPLOYEES: EmployeeExtended[] = [
  createEmp('1', 'Nelida', 'Valderrama', 'Toro', '12345678-9', '1985-02-16'), // CUMPLEANOS HOY (Feb 16)
  createEmp('2', 'Yahivett', 'Tarque', 'Vargas', '', '1992-05-20'),
  createEmp('3', 'Maria Soledad', 'Jarrin', 'Perez', '', '1988-11-12'),
  createEmp('4', 'Max', 'Tapia', 'Munoz', '', '1990-02-16'), // CUMPLEANOS HOY (Feb 16)
  createEmp('5', 'Gloria', 'Bolano', '', '', '1987-08-04'),
  createEmp('6', 'Romina', 'Siau', '', '', '1991-02-17'), // CUMPLEANOS MANANA (Feb 17)
  createEmp('7', 'Sebastian', 'Troncoso', 'Bruna'),
  createEmp('8', 'Alvaro', 'Ron', ''),
  createEmp('9', 'Alejandra', 'Leiva', ''),
  createEmp('10', 'Paola', 'Reyes', ''),
  createEmp('11', 'Rodrigo', 'Marin', ''),
  createEmp('12', 'Karen', 'Diaz', ''),
  createEmp('13', 'Natalia', 'Jofre', ''),
  createEmp('14', 'Angelica', 'Zenis', ''),
  createEmp('15', 'Patricio', 'Tapia', 'Munoz'),
  createEmp('16', 'Sebastian', 'Diaz', ''),
  createEmp('17', 'Benjamin', 'Vega', 'Navarro'),
  createEmp('18', 'Nicolas', 'Labbe', ''),
  createEmp('19', 'Carolina', 'Prieto', ''),
  createEmp('20', 'Marcela', 'Fernandez', ''),
  createEmp('21', 'Silvia', 'Esquivel', ''),
  createEmp('22', 'Jennifer', 'Cancino', ''),
  createEmp('23', 'Jose', 'Montero', ''),
  createEmp('24', 'Jorge', 'Guillen', ''),
  createEmp('25', 'Vanessa', 'Tavali', 'Cortes'),
  createEmp('26', 'Nicol', 'Diaz', ''),
  createEmp('27', 'Claudia', 'Zamorano', ''),
  createEmp('28', 'Fernanda', 'Urrutia', ''),
  createEmp('29', 'Alonso', 'Pereda', ''),
  createEmp('30', 'Maximiliano', 'Guzman', ''),
  createEmp('31', 'Roxany', 'Mery', ''),
  createEmp('32', 'Reinaldo', 'Valencia', ''),
  createEmp('33', 'Gabriela', 'Zorilla', ''),
  createEmp('34', 'Maria Alejandra', 'Saez', ''),
  createEmp('35', 'Romina', 'Ron', ''),
  createEmp('36', 'Ruth', 'Munoz', ''),
  createEmp('37', 'Marcelo', 'Cardenas', ''),
  createEmp('38', 'Anibal', 'Carrasco', ''),
  createEmp('39', 'Yanet', 'Esquivel', ''),
  createEmp('40', 'Nicole', 'Ortega', ''),
  createEmp('41', 'Mercedes', 'Corrales', ''),
  createEmp('42', 'Rosa', 'Jarpa', 'Zamorano'),
  createEmp('43', 'Jeremy', 'Gee', ''),
];

// ------------ SOLICITUDES INICIALES ------------

// Helper to create request
const createReq = (id: string, empId: string, start: string, end: string, days: number, type: LeaveType, shift: WorkShift): LeaveRequest => ({
  id,
  employeeId: empId,
  startDate: start,
  endDate: end,
  daysCount: days,
  type,
  shift,
  status: LeaveStatus.APPROVED,
  reason: 'Solicitud Importada'
});

export const INITIAL_REQUESTS: LeaveRequest[] = [
  createReq('101', '1', '2026-01-05', '2026-01-23', 15.0, LeaveType.LEGAL_HOLIDAY, WorkShift.JC),
  createReq('102', '2', '2026-01-06', '2026-01-12', 5.0, LeaveType.WITHOUT_PAY, WorkShift.JC),
  createReq('103', '3', '2026-01-06', '2026-01-06', 0.5, LeaveType.ADMINISTRATIVE, WorkShift.JM),
  createReq('104', '4', '2026-01-07', '2026-01-07', 1.0, LeaveType.ADMINISTRATIVE, WorkShift.JC),
  createReq('105', '5', '2026-01-06', '2026-01-07', 2.0, LeaveType.SICK_LEAVE, WorkShift.JC),
  createReq('106', '6', '2026-01-06', '2026-01-06', 0.5, LeaveType.ADMINISTRATIVE, WorkShift.JT),
  createReq('107', '7', '2026-01-09', '2026-01-09', 0.5, LeaveType.ADMINISTRATIVE, WorkShift.JM),
  createReq('108', '8', '2026-01-08', '2026-01-08', 1.0, LeaveType.ADMINISTRATIVE, WorkShift.JC),
  createReq('109', '9', '2025-12-08', '2026-02-18', 42.0, LeaveType.SICK_LEAVE, WorkShift.JC),
  createReq('110', '10', '2026-01-09', '2026-01-09', 0.5, LeaveType.ADMINISTRATIVE, WorkShift.JM),
  createReq('111', '11', '2026-01-16', '2026-01-16', 1.0, LeaveType.ADMINISTRATIVE, WorkShift.JC),
  createReq('112', '12', '2026-01-06', '2026-03-30', 84.0, LeaveType.PARENTAL, WorkShift.JC),
  createReq('113', '13', '2026-01-12', '2026-01-12', 0.5, LeaveType.ADMINISTRATIVE, WorkShift.JM),
  createReq('114', '14', '2026-01-12', '2026-01-12', 0.5, LeaveType.ADMINISTRATIVE, WorkShift.JM),
  createReq('115', '15', '2026-01-12', '2026-01-12', 0.5, LeaveType.ADMINISTRATIVE, WorkShift.JT),
  createReq('116', '15', '2026-01-13', '2026-01-14', 2.0, LeaveType.LEGAL_HOLIDAY, WorkShift.JC),
  createReq('117', '10', '2026-01-16', '2026-01-16', 1.0, LeaveType.ADMINISTRATIVE, WorkShift.JC),
  createReq('118', '7', '2026-01-16', '2026-01-16', 0.5, LeaveType.ADMINISTRATIVE, WorkShift.JM),
  createReq('120', '16', '2026-01-16', '2026-01-16', 1.0, LeaveType.ADMINISTRATIVE, WorkShift.JC),
  createReq('121', '17', '2026-01-23', '2026-02-06', 11.0, LeaveType.LEGAL_HOLIDAY, WorkShift.JC),
  createReq('122', '4', '2026-02-16', '2026-02-16', 1.0, LeaveType.ADMINISTRATIVE, WorkShift.JC),
];

// ------------ CONFIGURACION POR DEFECTO ------------

export const DEFAULT_APP_CONFIG = {
  defaultVacationDays: 15,
  defaultAdminDays: 6,
  defaultSickLeaveDays: 30,
  notificationEmail: 'rrhh@institucion.cl',
  emailTemplate: "- {NOMBRE} ({CARGO}): {TIPO} {JORNADA} desde el {DESDE} hasta el {HASTA}.",
  templateLegalHoliday: "- {NOMBRE} ({CARGO}): Hara uso de Feriado Legal {JORNADA} desde el {DESDE} hasta el {HASTA}.",
  templateAdministrative: "- {NOMBRE} ({CARGO}): Solicito Permiso Administrativo {JORNADA} el dia {DESDE} (Retorna: {HASTA}).",
  templateSickLeave: "- {NOMBRE} ({CARGO}): Presenta Licencia Medica desde el {DESDE} hasta el {HASTA}.",
  carryoverVacationEnabled: true,
  carryoverVacationMaxPeriods: 2,
  adminDaysExpireAtYearEnd: true,
  yearCloseReminderDays: 30,
};
