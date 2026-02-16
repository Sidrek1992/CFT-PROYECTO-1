import { EmployeeExtended as Employee, LeaveRequest, LeaveStatus, LeaveType, PermitRecord, WorkShift } from '../types';
import { calculateBusinessDays, parseISODate, toLocalDateString } from './dateUtils';

interface UsageCounters {
  vacation: number;
  administrative: number;
  sickLeave: number;
}

const createCounters = (): UsageCounters => ({
  vacation: 0,
  administrative: 0,
  sickLeave: 0,
});

/**
 * Rebuilds employee used-day counters from approved requests and official decrees.
 * Totals remain unchanged; only consumed balances are recalculated.
 */
export const recalculateEmployeeUsage = (
  employees: Employee[],
  requests: LeaveRequest[],
  records: PermitRecord[] = [],
  referenceYear: number = new Date().getFullYear()
): Employee[] => {
  const usageByEmployee = new Map<string, UsageCounters>();
  const periodStart = new Date(referenceYear, 0, 1);
  const periodEnd = new Date(referenceYear, 11, 31);

  // Helper to add usage to the map
  const addUsage = (empId: string, type: string, days: number) => {
    const counters = usageByEmployee.get(empId) || createCounters();

    if (type === LeaveType.LEGAL_HOLIDAY || type === 'FL') {
      counters.vacation += days;
    } else if (type === LeaveType.ADMINISTRATIVE || type === 'PA') {
      counters.administrative += days;
    } else if (type === LeaveType.SICK_LEAVE) {
      counters.sickLeave += days;
    }

    usageByEmployee.set(empId, counters);
  };

  // We use a set of keys to avoid double counting if a request and a decree exist for the same thing
  // Key format: "rut-type-startDate"
  const processedEvents = new Set<string>();

  // 1. Process Official Decretos (Higher priority for truth)
  records.forEach((record) => {
    if (!record.fechaInicio || !record.rut) return;

    const requestStart = parseISODate(record.fechaInicio);
    const requestEnd = parseISODate(record.fechaTermino || record.fechaInicio);

    if (Number.isNaN(requestStart.getTime()) || Number.isNaN(requestEnd.getTime())) return;
    if (requestStart > periodEnd || requestEnd < periodStart) return;

    const overlapStart = requestStart < periodStart ? periodStart : requestStart;
    const overlapEnd = requestEnd > periodEnd ? periodEnd : requestEnd;

    // Decretos usually store business days directly in cantidadDias, 
    // but for the sake of consistency with intervals and shifts:
    const overlapDays = calculateBusinessDays(
      toLocalDateString(overlapStart),
      toLocalDateString(overlapEnd),
      record.solicitudType === 'PA' ? LeaveType.ADMINISTRATIVE : LeaveType.LEGAL_HOLIDAY,
      WorkShift.JC // Decretos typically represent full days unless specified
    );

    if (overlapDays <= 0) return;

    // Find the employee by RUT
    const employee = employees.find(e => e.rut === record.rut);
    if (!employee) return;

    addUsage(employee.id, record.solicitudType, overlapDays);
    processedEvents.add(`${record.rut}-${record.solicitudType}-${record.fechaInicio}`);
  });

  // 2. Process Approved Requests (Only if not already covered by a decree)
  requests.forEach((request) => {
    if (request.status !== LeaveStatus.APPROVED) return;

    const employee = employees.find(e => e.id === request.employeeId);
    if (!employee) return;

    // Skip if we already processed a decree for this same start date and type
    const eventKey = `${employee.rut}-${request.type === LeaveType.LEGAL_HOLIDAY ? 'FL' : 'PA'}-${request.startDate}`;
    if (processedEvents.has(eventKey)) return;

    const requestStart = parseISODate(request.startDate);
    const requestEnd = parseISODate(request.endDate);

    if (Number.isNaN(requestStart.getTime()) || Number.isNaN(requestEnd.getTime())) return;
    if (requestStart > periodEnd || requestEnd < periodStart) return;

    const overlapStart = requestStart < periodStart ? periodStart : requestStart;
    const overlapEnd = requestEnd > periodEnd ? periodEnd : requestEnd;

    const overlapDays = calculateBusinessDays(
      toLocalDateString(overlapStart),
      toLocalDateString(overlapEnd),
      request.type,
      request.shift
    );

    if (overlapDays <= 0) return;

    addUsage(request.employeeId, request.type, overlapDays);
  });

  return employees.map((employee) => {
    const counters = usageByEmployee.get(employee.id) || createCounters();

    return {
      ...employee,
      usedVacationDays: counters.vacation,
      usedAdminDays: counters.administrative,
      usedSickLeaveDays: counters.sickLeave,
    };
  });
};
