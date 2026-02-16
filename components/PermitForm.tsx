import React, { useState, useEffect, useRef } from 'react';
import { PermitFormData, PermitRecord, EmployeeExtended as Employee, SolicitudType } from '../types';
import { JORNADA_OPTIONS, SOLICITUD_TYPES } from '../constants';
import { validateRut, validateDate, CONFIG } from '../config';
import {
  PlusCircle, Save, X, FileUp, Loader2, Sparkles, User, Fingerprint,
  Calendar, Info, ChevronDown, CheckCircle2, AlertCircle, AlertTriangle, Clock, Sun
} from 'lucide-react';
import { formatRut, toProperCase } from '../utils/formatters';
import { compareRecordsByDateDesc } from '../utils/recordDates';
import { getFLSaldoFinal } from '../utils/flBalance';

// Función para verificar si una fecha es fin de semana
const isWeekend = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString + 'T12:00:00');
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Obtener nombre del día
const getDayName = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T12:00:00');
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
};

interface PermitFormProps {
  onSubmit: (data: PermitFormData) => void;
  editingRecord: PermitRecord | null;
  onCancelEdit: () => void;
  nextCorrelatives: { PA: string; FL: string };
  employees: Employee[];
  records: PermitRecord[];
  requestedSolicitudType?: SolicitudType | null;
  onRequestedSolicitudTypeHandled?: () => void;
  /** Base de días PA definido en Configuración */
  baseDaysPA: number;
}

interface FormErrors {
  funcionario?: string;
  rut?: string;
  fechaInicio?: string;
  fechaTermino?: string;
  cantidadDias?: string;
}

const PermitForm: React.FC<PermitFormProps> = ({
  onSubmit,
  editingRecord,
  onCancelEdit,
  nextCorrelatives,
  employees,
  records,
  requestedSolicitudType,
  onRequestedSolicitudTypeHandled,
  baseDaysPA
}) => {
  const currentYear = new Date().getFullYear();
  const defaultPeriodo1 = `${currentYear - 1}-${currentYear}`;
  const defaultPeriodo2 = `${currentYear}-${currentYear + 1}`;

  const initialState: PermitFormData = {
    solicitudType: 'PA',
    decreto: '',
    materia: 'Decreto Exento',
    acto: nextCorrelatives.PA,
    funcionario: '',
    rut: '',
    employeeId: '',
    periodo: currentYear.toString(),
    cantidadDias: 1,
    fechaInicio: '',
    tipoJornada: 'Jornada completa',
    diasHaber: baseDaysPA,
    fechaDecreto: new Date().toISOString().split('T')[0],
    ra: 'MGA',
    emite: 'mga',
    observaciones: '',
    fechaTermino: '',
    periodo1: defaultPeriodo1,
    saldoDisponibleP1: 0,
    solicitadoP1: 0,
    saldoFinalP1: 0,
    periodo2: defaultPeriodo2,
    saldoDisponibleP2: 0,
    solicitadoP2: 0,
    saldoFinalP2: 0
  };

  const [formData, setFormData] = useState<PermitFormData>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detectedSaldo, setDetectedSaldo] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const skipAutoSaldoRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingRecord) {
      const { id, createdAt, ...rest } = editingRecord;
      setFormData(rest);
      setErrors({});
    } else {
      // Usar el correlativo correspondiente al tipo de solicitud actual
      setFormData(prev => ({
        ...prev,
        acto: nextCorrelatives[prev.solicitudType as 'PA' | 'FL']
      }));
    }
  }, [editingRecord, nextCorrelatives]);

  // Actualizar el acto cuando cambie el tipo de solicitud (solo si no estamos editando)
  useEffect(() => {
    if (!editingRecord) {
      setFormData(prev => ({
        ...prev,
        acto: nextCorrelatives[prev.solicitudType as 'PA' | 'FL']
      }));
    }
  }, [formData.solicitudType, nextCorrelatives, editingRecord]);

  useEffect(() => {
    if (!requestedSolicitudType) return;
    if (editingRecord) {
      onRequestedSolicitudTypeHandled?.();
      return;
    }

    setFormData(prev => {
      if (prev.solicitudType === requestedSolicitudType) return prev;
      return { ...prev, solicitudType: requestedSolicitudType };
    });
    onRequestedSolicitudTypeHandled?.();
  }, [requestedSolicitudType, editingRecord, onRequestedSolicitudTypeHandled]);

  useEffect(() => {
    if (skipAutoSaldoRef.current) {
      skipAutoSaldoRef.current = false;
      return;
    }

    if (!editingRecord && formData.rut) {
      const empRecords = records
        .filter(r => r.rut === formData.rut && r.solicitudType === formData.solicitudType)
        .sort((a, b) => compareRecordsByDateDesc(a, b));

      if (empRecords.length > 0) {
        const last = empRecords[0];

        if (formData.solicitudType === 'PA') {
          // PA: saldo = diasHaber - cantidadDias del último registro (saldo final de ese decreto)
          const saldoPA = last.diasHaber - last.cantidadDias;
          setFormData(prev => ({ ...prev, diasHaber: saldoPA }));
          setDetectedSaldo(saldoPA);
        } else {
          // FL: tomar saldo final según 1 o 2 períodos
          const saldoFL = getFLSaldoFinal(last, 0);
          setFormData(prev => ({ ...prev, saldoDisponibleP1: saldoFL }));
          setDetectedSaldo(saldoFL);
        }
      } else {
        if (formData.solicitudType === 'PA') {
          const base = baseDaysPA;
          setFormData(prev => ({ ...prev, diasHaber: base }));
        } else {
          setFormData(prev => ({ ...prev, saldoDisponibleP1: 0 }));
        }
        setDetectedSaldo(null);
      }
    }
  }, [formData.solicitudType, formData.rut, records, editingRecord]);

  const validateField = (name: string, value: string | number): string | undefined => {
    switch (name) {
      case 'rut':
        if (value && !validateRut(String(value))) return 'RUT inválido';
        break;
      case 'fechaInicio':
      case 'fechaTermino':
        if (value && !validateDate(String(value))) return 'Fecha fuera de rango válido';
        break;
      case 'cantidadDias':
        if (Number(value) <= 0) return 'Debe ser mayor a 0';
        if (Number(value) > 30) return 'Máximo 30 días';
        break;
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['cantidadDias', 'diasHaber', 'saldoDisponibleP1', 'solicitadoP1', 'saldoDisponibleP2', 'solicitadoP2'];
    const newValue = numericFields.includes(name) ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    const error = validateField(name, newValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const selectEmployee = (emp: Employee) => {
    const formattedRut = formatRut(emp.rut);
    const fullName = `${emp.firstName} ${emp.lastNamePaternal} ${emp.lastNameMaternal}`.trim();
    setFormData(prev => ({
      ...prev,
      funcionario: toProperCase(fullName),
      rut: formattedRut,
      employeeId: emp.id
    }));
    setShowSuggestions(false);
    const rutError = validateField('rut', formattedRut);
    setErrors(prev => ({ ...prev, rut: rutError }));
  };

  const filteredEmployees = employees.filter(e => {
    const fullName = `${e.firstName} ${e.lastNamePaternal} ${e.lastNameMaternal}`.toLowerCase();
    return fullName.includes(formData.funcionario.toLowerCase()) || e.rut.includes(formData.funcionario);
  });

  const saldoFinal = (formData.diasHaber - formData.cantidadDias).toFixed(1);
  const isNegative = parseFloat(saldoFinal) < 0;
  const saldoFinalP1 = (formData.saldoDisponibleP1 || 0) - (formData.solicitadoP1 || 0);
  const saldoFinalP2 = (formData.saldoDisponibleP2 || 0) - (formData.solicitadoP2 || 0);

  const parseDateValue = (value: string): Date | null => {
    if (!value) return null;
    const parsed = new Date(value + 'T12:00:00');
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getDateRange = (payload: Pick<PermitRecord, 'solicitudType' | 'fechaInicio' | 'fechaTermino' | 'cantidadDias'>): { start: Date; end: Date } | null => {
    const start = parseDateValue(payload.fechaInicio || '');
    if (!start) return null;

    let end: Date | null = null;
    if (payload.solicitudType === 'FL' && payload.fechaTermino) {
      end = parseDateValue(payload.fechaTermino) || null;
    }

    if (!end || end < start) {
      const days = Math.max(Math.ceil(payload.cantidadDias || 1), 1);
      end = new Date(start);
      end.setDate(start.getDate() + days - 1);
    }

    return { start, end };
  };

  // Función para detectar conflictos de fechas
  const checkDateConflict = (
    candidate: Pick<PermitRecord, 'solicitudType' | 'fechaInicio' | 'fechaTermino' | 'cantidadDias'>,
    rut: string,
    editingId?: string
  ): PermitRecord | null => {
    const candidateRange = getDateRange(candidate);
    if (!candidateRange) return null;

    // Buscar registros del mismo funcionario
    const existingRecords = records.filter(r =>
      r.rut === rut &&
      r.id !== editingId // Excluir el registro que estamos editando
    );

    for (const record of existingRecords) {
      if (!record.fechaInicio) continue;

      const recordRange = getDateRange({
        solicitudType: record.solicitudType,
        fechaInicio: record.fechaInicio,
        fechaTermino: record.fechaTermino || '',
        cantidadDias: record.cantidadDias,
      });

      if (!recordRange) continue;

      // Verificar overlap
      const hasOverlap = candidateRange.start <= recordRange.end && candidateRange.end >= recordRange.start;
      if (hasOverlap) {
        return record;
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    if (!formData.funcionario) newErrors.funcionario = 'Requerido';
    if (!formData.rut) newErrors.rut = 'Requerido';
    else if (!validateRut(formData.rut)) newErrors.rut = 'RUT inválido';
    if (!formData.fechaInicio) newErrors.fechaInicio = 'Requerido';
    else if (!validateDate(formData.fechaInicio)) newErrors.fechaInicio = 'Fecha inválida';
    else if (isWeekend(formData.fechaInicio)) newErrors.fechaInicio = 'Fin de semana';

    if (formData.solicitudType === 'FL') {
      if (!formData.fechaTermino) newErrors.fechaTermino = 'Requerido';
      else if (!validateDate(formData.fechaTermino)) newErrors.fechaTermino = 'Fecha inválida';
    }

    // ★ VALIDACIÓN DE SALDO INSUFICIENTE (PA)
    if (formData.solicitudType === 'PA') {
      if (formData.cantidadDias > formData.diasHaber) {
        newErrors.cantidadDias = 'Saldo insuficiente';
        setFormError(`Saldo insuficiente: solicitas ${formData.cantidadDias} días pero solo tienes ${formData.diasHaber} disponibles.`);
        setErrors(newErrors);
        return;
      }
    }

    // ★ VALIDACIONES AVANZADAS FL
    if (formData.solicitudType === 'FL') {
      const hasPeriod2 = Boolean(formData.periodo2 && formData.periodo2.trim() !== '');
      const saldoP1 = (formData.saldoDisponibleP1 || 0) - (formData.solicitadoP1 || 0);
      const saldoP2 = (formData.saldoDisponibleP2 || 0) - (formData.solicitadoP2 || 0);

      if (!formData.periodo1 || !formData.periodo1.trim()) {
        setFormError('El período 1 es obligatorio para Feriado Legal.');
        setErrors({ ...newErrors, fechaInicio: 'Periodo 1 requerido' });
        return;
      }

      if (!hasPeriod2 && ((formData.solicitadoP2 || 0) > 0 || (formData.saldoDisponibleP2 || 0) > 0)) {
        setFormError('Si no hay Período 2, los campos de Período 2 deben quedar en 0.');
        setErrors({ ...newErrors, cantidadDias: 'Período 2 inconsistente' });
        return;
      }

      if (formData.fechaInicio && formData.fechaTermino && formData.fechaTermino < formData.fechaInicio) {
        setFormError('La fecha de término no puede ser anterior a la fecha de inicio.');
        setErrors({ ...newErrors, fechaTermino: 'Rango inválido' });
        return;
      }

      if (saldoP1 < 0 || (hasPeriod2 && saldoP2 < 0)) {
        setFormError(`Saldo FL insuficiente. Resultado: P1 ${saldoP1.toFixed(1)}${hasPeriod2 ? ` | P2 ${saldoP2.toFixed(1)}` : ''}.`);
        setErrors({ ...newErrors, cantidadDias: 'Saldo FL insuficiente' });
        return;
      }
    }

    // ★ VALIDACIÓN DE CONFLICTO DE FECHAS
    if (formData.fechaInicio && formData.rut) {
      const conflictingRecord = checkDateConflict({
        solicitudType: formData.solicitudType,
        fechaInicio: formData.fechaInicio,
        fechaTermino: formData.fechaTermino,
        cantidadDias: formData.cantidadDias,
      }, formData.rut, editingRecord?.id);

      if (conflictingRecord) {
        newErrors.fechaInicio = 'Conflicto de fechas';
        const conflictType = conflictingRecord.solicitudType === 'PA' ? 'Permiso Administrativo' : 'Feriado Legal';
        const conflictDate = new Date(conflictingRecord.fechaInicio + 'T12:00:00').toLocaleDateString('es-CL');
        setFormError(`⚠️ Conflicto: ${formData.funcionario} ya tiene un ${conflictType} registrado desde el ${conflictDate} (${conflictingRecord.cantidadDias} días). Las fechas se superponen.`);
        setErrors(newErrors);
        return;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const weekendError = newErrors.fechaInicio === 'Fin de semana';
      const fechaTerminoError = newErrors.fechaTermino;
      setFormError(weekendError
        ? `El ${getDayName(formData.fechaInicio)} es fin de semana. Selecciona un día hábil.`
        : fechaTerminoError
          ? 'La fecha de término es obligatoria para Feriado Legal.'
          : 'Por favor, corrige los campos marcados en rojo.');
      return;
    }

    const dataToSubmit = { ...formData, saldoFinalP1, saldoFinalP2 };
    onSubmit(dataToSubmit);
    if (!editingRecord) {
      // Resetear con el correlativo correspondiente al tipo por defecto (PA)
      setFormData({ ...initialState, acto: nextCorrelatives.PA });
      setErrors({});
    }
    setFormError(null);
  };

  // Componente de sección con título
  const SectionTitle = ({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) => (
    <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${color}`}>
      <div className={`p-2 rounded-xl ${color.includes('blue') || color.includes('indigo') ? 'bg-blue-50 dark:bg-blue-900/40' : 'bg-orange-50 dark:bg-orange-900/40'}`}>
        <Icon className={`w-5 h-5 ${color.includes('blue') || color.includes('indigo') ? 'text-[#2F4DAA] dark:text-blue-400' : 'text-[#F59121] dark:text-orange-400'}`} />
      </div>
      <h3 className={`text-[11px] font-bold uppercase tracking-widest ${color.includes('blue') || color.includes('indigo') ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
        {title}
      </h3>
    </div>
  );

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-sky-500/10 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />

      <form
        onSubmit={handleSubmit}
        className={`relative bg-white dark:bg-slate-800 rounded-[32px] shadow-[0px_20px_60px_rgba(26,43,86,0.06)] border overflow-hidden transition-all duration-500 ${editingRecord
          ? 'border-[#F59121]/30 ring-1 ring-[#F59121]/10'
          : 'border-slate-100 dark:border-slate-700'
          }`}
      >
        {/* Header Premium */}
        <div className={`p-8 sm:p-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-white relative overflow-hidden ${editingRecord ? 'bg-gradient-to-br from-[#F59121] to-[#d4791a]' : formData.solicitudType === 'PA' ? 'bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56]' : 'bg-gradient-to-br from-[#F59121] to-[#d4791a]'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-5 scale-150 rotate-12 pointer-events-none">
            {formData.solicitudType === 'PA' ? <Calendar size={180} /> : <Sun size={180} />}
          </div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="flex items-center gap-6 z-10">
            <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/10 ring-1 ring-white/20 shadow-2xl">
              {editingRecord ? <Save className="w-7 h-7" /> : <PlusCircle className="w-7 h-7" />}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {editingRecord ? 'Editar Resolución' : 'Nueva Resolución'}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Sistema GDP Cloud</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Gestión de Personal</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 z-10 w-full sm:w-auto">
            {editingRecord && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20 text-xs font-bold uppercase tracking-wider active:scale-95"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-10 md:p-12 space-y-8 sm:space-y-12">
          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/50 p-6 rounded-[20px] flex items-start gap-4 animate-in slide-in-from-top-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertCircle className="text-red-600 dark:text-red-400 w-5 h-5 flex-shrink-0" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Error de validación</p>
                <p className="text-sm font-bold text-red-800 dark:text-red-200">{formError}</p>
              </div>
            </div>
          )}

          {/* Selector de Tipo Moderno */}
          <div className="flex justify-center">
            <div className="inline-flex gap-2 bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-[24px] border border-slate-200/50 dark:border-slate-700 shadow-inner">
              {SOLICITUD_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, solicitudType: t.value }))}
                  className={`px-8 sm:px-14 py-4 rounded-[18px] text-[11px] font-black transition-all duration-500 uppercase tracking-widest ${formData.solicitudType === t.value
                    ? 'bg-white dark:bg-slate-800 text-[#2F4DAA] dark:text-blue-400 shadow-[0px_10px_25px_rgba(0,0,0,0.06)] ring-1 ring-slate-100 dark:ring-slate-700'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                >
                  {t.value === 'PA' ? 'Permisos (PA)' : 'Feriados (FL)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Columna Izquierda: Datos del Funcionario y Administrativos */}
            <div className="lg:col-span-12 space-y-10">

              {/* Sección Funcionario */}
              <div className="bg-slate-50/50 dark:bg-slate-900/20 p-8 sm:p-10 rounded-[24px] border border-slate-100 dark:border-slate-800 relative group/section transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30">
                <SectionTitle icon={User} title="Identificación del Funcionario" color="border-slate-200 dark:border-slate-700 text-slate-700" />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
                  <div className="md:col-span-8 relative" ref={dropdownRef}>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 mb-3 block">
                      Nombre Completo {errors.funcionario && <span className="text-red-500 ml-2 animate-pulse">• {errors.funcionario}</span>}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-sm transition-all group-focus-within/section:text-[#2F4DAA]">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        name="funcionario"
                        value={formData.funcionario}
                        onChange={(e) => { handleChange(e); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        autoComplete="off"
                        placeholder="Escriba para buscar por nombre o RUT..."
                        className={`w-full pl-18 pr-12 py-5 bg-white dark:bg-slate-800 border-2 rounded-[14px] font-bold text-slate-800 dark:text-white uppercase focus:border-[#2F4DAA] focus:ring-[8px] focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all text-sm ${errors.funcionario ? 'border-red-200 ring-red-50' : 'border-slate-50 dark:border-slate-700 shadow-sm'}`}
                      />
                      <button type="button" onClick={() => setShowSuggestions(!showSuggestions)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2F4DAA] p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                        <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${showSuggestions ? 'rotate-180' : ''}`} />
                      </button>

                      {showSuggestions && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] shadow-[0px_20px_60px_rgba(0,0,0,0.15)] z-[100] overflow-hidden animate-in slide-in-from-top-4 duration-500">
                          <div className="p-3 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Resultados de búsqueda</p>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                            {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                              <div key={emp.rut} onClick={() => selectEmployee(emp)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl cursor-pointer group/item transition-all active:scale-[0.98]">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover/item:bg-[#2F4DAA] group-hover/item:text-white transition-all">
                                  <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-black text-slate-800 dark:text-white group-hover/item:text-[#2F4DAA] dark:group-hover/item:text-blue-400 transition-colors uppercase whitespace-nowrap overflow-hidden text-ellipsis">{emp.firstName} {emp.lastNamePaternal} {emp.lastNameMaternal}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Cédula: {emp.rut}</p>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-0 group-hover/item:opacity-100 transition-all transform scale-50 group-hover/item:scale-100" />
                              </div>
                            )) : (
                              <div className="px-6 py-12 text-center">
                                <AlertTriangle className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No se encontraron funcionarios</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 mb-3 block">
                      RUT Asociado {errors.rut && <span className="text-red-500 ml-2 animate-pulse">• {errors.rut}</span>}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <input
                        readOnly
                        value={formData.rut || 'Pendiente...'}
                        className={`w-full pl-18 pr-10 py-5 bg-slate-50/50 dark:bg-slate-900/30 border-2 rounded-[14px] font-mono font-bold text-slate-500 dark:text-slate-600 outline-none text-sm border-dashed border-slate-200 dark:border-slate-700`}
                      />
                      {formData.rut && validateRut(formData.rut) && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">N° correlativo decreto</label>
                    <div className="relative">
                      <input
                        name="acto"
                        value={formData.acto}
                        onChange={handleChange}
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 px-6 py-4 rounded-[14px] font-black text-[#2F4DAA] dark:text-blue-400 outline-none focus:border-[#2F4DAA] focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/10 text-center text-[16px] shadow-sm transition-all"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">ACTO</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">Materia del acto</label>
                    <select
                      name="materia"
                      value={formData.materia}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 px-6 py-4 rounded-[14px] font-bold text-slate-700 dark:text-slate-300 text-sm outline-none focus:border-[#2F4DAA] focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/10 cursor-pointer shadow-sm transition-all appearance-none"
                    >
                      <option value="Decreto Exento">Decreto Exento</option>
                      <option value="Resolución Exenta">Resolución Exenta</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ===================== SECCIÓN PA ===================== */}
              {formData.solicitudType === 'PA' && (
                <div className="bg-blue-50/30 dark:bg-blue-900/10 p-8 sm:p-10 rounded-[24px] border border-blue-100 dark:border-blue-900/40 animate-in fade-in slide-in-from-bottom-4 transition-all hover:bg-blue-50/50">
                  <SectionTitle icon={Clock} title="Configuración del Permiso (PA)" color="border-blue-200 dark:border-blue-800 text-[#2F4DAA]" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
                    <div className="relative group/field">
                      <label className="text-[10px] font-black text-[#2F4DAA] dark:text-blue-400 uppercase tracking-[0.2em] block mb-3">Saldo Previo</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          name="diasHaber"
                          value={formData.diasHaber}
                          onChange={handleChange}
                          className="w-full bg-white dark:bg-slate-800 border-2 border-blue-50 dark:border-slate-700 px-4 py-4 rounded-[14px] font-black text-slate-800 dark:text-white outline-none focus:border-[#2F4DAA] text-center text-lg shadow-sm group-hover/field:border-blue-200 transition-all"
                        />
                        {detectedSaldo !== null && (
                          <div className="absolute -top-2 -right-2 bg-[#2F4DAA] text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg border border-white/20">AUTOSYNC</div>
                        )}
                      </div>
                    </div>

                    <div className="group/field">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">
                        Días a utilizar {errors.cantidadDias && <span className="text-red-500 animate-pulse">•</span>}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        name="cantidadDias"
                        value={formData.cantidadDias}
                        onChange={handleChange}
                        min="0.5"
                        className={`w-full bg-white dark:bg-slate-800 border-2 px-4 py-4 rounded-[14px] font-black text-slate-900 dark:text-white outline-none focus:border-[#2F4DAA] text-center text-lg shadow-sm transition-all ${errors.cantidadDias ? 'border-red-200 bg-red-50/30' : 'border-slate-50 dark:border-slate-700 group-hover/field:border-blue-100'}`}
                      />
                    </div>

                    <div className="group/field">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">
                        Día de Inicio {errors.fechaInicio && <span className="text-red-500 animate-pulse">•</span>}
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="fechaInicio"
                          value={formData.fechaInicio}
                          onChange={handleChange}
                          className={`w-full bg-white dark:bg-slate-800 border-2 px-5 py-4 rounded-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#2F4DAA] text-sm shadow-sm transition-all ${errors.fechaInicio ? 'border-red-200 bg-red-50/30' : 'border-slate-50 dark:border-slate-700 group-hover/field:border-blue-100'}`}
                        />
                        {formData.fechaInicio && (
                          <div className={`absolute -bottom-6 left-1 text-[10px] font-black uppercase tracking-tight ${isWeekend(formData.fechaInicio) ? 'text-red-500' : 'text-emerald-600'}`}>
                            {getDayName(formData.fechaInicio)} {isWeekend(formData.fechaInicio) && '(⚠️ FIN DE SEMANA)'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="group/field">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Fecha Emisión</label>
                      <input
                        type="date"
                        name="fechaDecreto"
                        value={formData.fechaDecreto}
                        onChange={handleChange}
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 px-5 py-4 rounded-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#2F4DAA] text-sm shadow-sm transition-all group-hover/field:border-blue-100"
                      />
                    </div>
                  </div>

                  <div className="mt-12">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4 ml-1">Modalidad de Jornada</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {JORNADA_OPTIONS.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, tipoJornada: option }))}
                          className={`px-5 py-4 rounded-[16px] text-[11px] font-black transition-all duration-300 uppercase tracking-widest border-2 ${formData.tipoJornada === option
                            ? 'bg-[#2F4DAA] text-white border-[#2F4DAA] shadow-[0px_10px_20px_rgba(47,77,170,0.2)]'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-50 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                            }`}
                        >
                          {option === 'Jornada completa' ? 'Completa' : option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Balance Premium PA */}
                  <div className={`mt-10 p-6 rounded-[24px] flex items-center justify-between gap-6 border-2 shadow-sm transition-all ${isNegative ? 'bg-red-50/30 border-red-100 dark:border-red-900/20' : 'bg-emerald-50/30 border-emerald-100 dark:border-emerald-900/20'}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center transition-all ${isNegative ? 'bg-red-100 dark:bg-red-900/50 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'}`}>
                        {isNegative ? <AlertTriangle className="w-8 h-8" /> : <Info className="w-8 h-8" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Post-Operación</p>
                        <p className={`text-3xl font-black tracking-tight ${isNegative ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-400'}`}>{saldoFinal} <span className="text-sm font-bold opacity-60 ml-0.5">DÍAS</span></p>
                      </div>
                    </div>
                    {isNegative && (
                      <div className="hidden sm:block text-right">
                        <p className="text-xs font-bold text-red-800 dark:text-red-300">⚠️ Advertencia: Saldo insuficiente</p>
                        <p className="text-[9px] font-black text-red-500/70 uppercase tracking-widest mt-1">Requiere regularización posterior</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===================== SECCIÓN FL ===================== */}
              {formData.solicitudType === 'FL' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                  {/* Datos Maestros FL */}
                  <div className="bg-orange-50/20 dark:bg-orange-900/10 p-8 sm:p-10 rounded-[24px] border border-orange-100 dark:border-orange-900/40 transition-all hover:bg-orange-50/40">
                    <SectionTitle icon={Sun} title="Configuración del Feriado (FL)" color="border-orange-200 dark:border-orange-800 text-[#F59121]" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
                      <div className="group/field">
                        <label className="text-[10px] font-black text-[#F59121] uppercase tracking-[0.2em] block mb-3 leading-none">Días de feriado</label>
                        <input
                          type="number"
                          step="0.5"
                          name="cantidadDias"
                          value={formData.cantidadDias}
                          onChange={handleChange}
                          className={`w-full bg-white dark:bg-slate-800 border-2 px-4 py-4 rounded-[14px] font-black text-slate-900 dark:text-white outline-none focus:border-[#F59121] text-center text-lg shadow-sm transition-all ${errors.cantidadDias ? 'border-red-200' : 'border-slate-50 dark:border-slate-700 group-hover/field:border-orange-200'}`}
                        />
                      </div>

                      <div className="group/field">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 leading-none">Inicio del feriado</label>
                        <div className="relative">
                          <input
                            type="date"
                            name="fechaInicio"
                            value={formData.fechaInicio}
                            onChange={handleChange}
                            className={`w-full bg-white dark:bg-slate-800 border-2 px-5 py-4 rounded-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#F59121] text-sm shadow-sm transition-all ${errors.fechaInicio ? 'border-red-200' : 'border-slate-50 dark:border-slate-700 group-hover/field:border-orange-100'}`}
                          />
                          {formData.fechaInicio && (
                            <div className="absolute -bottom-6 left-1 text-[10px] font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                              {getDayName(formData.fechaInicio)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="group/field">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 leading-none">Fin del feriado</label>
                        <div className="relative">
                          <input
                            type="date"
                            name="fechaTermino"
                            value={formData.fechaTermino || ''}
                            onChange={handleChange}
                            className={`w-full bg-white dark:bg-slate-800 border-2 px-5 py-4 rounded-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#F59121] text-sm shadow-sm transition-all ${errors.fechaTermino ? 'border-red-200' : 'border-slate-50 dark:border-slate-700 group-hover/field:border-orange-100'}`}
                          />
                          {formData.fechaTermino && (
                            <div className="absolute -bottom-6 left-1 text-[10px] font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                              {getDayName(formData.fechaTermino)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="group/field">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 leading-none">Fecha Emisión</label>
                        <input
                          type="date"
                          name="fechaDecreto"
                          value={formData.fechaDecreto}
                          onChange={handleChange}
                          className="w-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 px-5 py-4 rounded-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#F59121] text-sm shadow-sm transition-all group-hover/field:border-orange-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Perímetros de Balance FL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Período 1 */}
                    <div className="bg-sky-50/30 dark:bg-sky-900/10 p-8 rounded-[24px] border border-sky-100 dark:border-sky-900/40 relative group/p1">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-sky-600 text-white rounded-xl flex items-center justify-center text-[18px] font-black shadow-lg shadow-sky-500/20">1</div>
                          <div>
                            <h4 className="text-[13px] font-black text-sky-700 dark:text-sky-300 uppercase tracking-widest">Saldo Período A</h4>
                            <p className="text-[9px] font-bold text-sky-500/60 uppercase tracking-widest mt-0.5">Prioridad de descuento</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Etiq. Período</label>
                            <input name="periodo1" value={formData.periodo1 || ''} onChange={handleChange} placeholder="2023-2024" className="w-full bg-white dark:bg-slate-800 border-2 border-sky-50/50 dark:border-sky-900/40 px-4 py-3.5 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:border-sky-500 text-sm text-center shadow-sm" />
                          </div>
                          <div className="space-y-3 relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Disp. Inicial</label>
                            <input type="number" step="0.5" name="saldoDisponibleP1" value={formData.saldoDisponibleP1 || 0} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border-2 border-sky-50/50 dark:border-sky-900/40 px-4 py-3.5 rounded-xl font-black text-slate-800 dark:text-white outline-none focus:border-sky-500 text-sm text-center shadow-sm" />
                            {detectedSaldo !== null && (
                              <div className="absolute -top-1 -right-1 bg-sky-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-sm">SYNC</div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Soli. Período</label>
                            <input type="number" step="0.5" name="solicitadoP1" value={formData.solicitadoP1 || 0} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border-2 border-sky-50/50 dark:border-sky-900/40 px-4 py-3.5 rounded-xl font-black text-slate-800 dark:text-white outline-none focus:border-sky-500 text-sm text-center shadow-sm" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block ml-1">Resultante Final</label>
                            <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800/50 px-4 py-3.5 rounded-xl font-black text-emerald-700 dark:text-emerald-400 text-lg text-center shadow-sm transition-all">
                              {saldoFinalP1.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Período 2 */}
                    <div className="bg-purple-50/30 dark:bg-purple-900/10 p-8 rounded-[24px] border border-purple-100 dark:border-purple-900/40 relative group/p2">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center text-[18px] font-black shadow-lg shadow-purple-500/20">2</div>
                          <div>
                            <h4 className="text-[13px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest">Saldo Período B</h4>
                            <p className="text-[9px] font-bold text-purple-500/60 uppercase tracking-widest mt-0.5">Opcional / Segundo tramo</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Etiq. Período</label>
                            <input name="periodo2" value={formData.periodo2 || ''} onChange={handleChange} placeholder="2024-2025" className="w-full bg-white dark:bg-slate-800 border-2 border-purple-50/50 dark:border-purple-900/40 px-4 py-3.5 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:border-purple-500 text-sm text-center shadow-sm" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Disp. Inicial</label>
                            <input type="number" step="0.5" name="saldoDisponibleP2" value={formData.saldoDisponibleP2 || 0} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border-2 border-purple-50/50 dark:border-purple-900/40 px-4 py-3.5 rounded-xl font-black text-slate-800 dark:text-white outline-none focus:border-purple-500 text-sm text-center shadow-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Soli. Período</label>
                            <input type="number" step="0.5" name="solicitadoP2" value={formData.solicitadoP2 || 0} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border-2 border-purple-50/50 dark:border-purple-900/40 px-4 py-3.5 rounded-xl font-black text-slate-800 dark:text-white outline-none focus:border-purple-500 text-sm text-center shadow-sm" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block ml-1">Resultante Final</label>
                            <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800/50 px-4 py-3.5 rounded-xl font-black text-emerald-700 dark:text-emerald-400 text-lg text-center shadow-sm transition-all">
                              {saldoFinalP2.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Premium FL */}
                  <div className="bg-orange-100/30 dark:bg-orange-900/20 p-8 rounded-[32px] border border-orange-200 dark:border-orange-800/50 flex items-center justify-between gap-8 transition-all hover:bg-orange-100/40 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-orange-400/10 to-transparent" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-[20px] flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100 dark:ring-orange-800">
                        <Sparkles className="w-9 h-9" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-orange-700/60 dark:text-orange-400/60 uppercase tracking-[0.2em] mb-1.5">Duración Total de Feriado</p>
                        <p className="text-4xl font-black text-orange-700 dark:text-orange-300 tracking-tight">{formData.cantidadDias} <span className="text-base font-black opacity-60 ml-1">DÍAS HÁBILES</span></p>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right relative z-10">
                      <p className="text-xs font-bold text-orange-800 dark:text-orange-200">Decreto validado institucionalmente</p>
                      <p className="text-[10px] font-bold text-orange-600/60 dark:text-orange-400/60 uppercase tracking-widest mt-1">GDP Cloud Certification Motor</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===================== ÁREA DE ACCIÓN ===================== */}
          <div className="pt-10 sm:pt-14 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex-1 max-w-sm">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center sm:text-left">
                Esta acción generará un acto administrativo oficial. Asegúrese de que los datos sean correctos antes de proceder.
              </p>
            </div>

            <button
              type="submit"
              className={`w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-6 rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-95 shadow-2xl relative overflow-hidden group/submit ${editingRecord
                ? 'bg-gradient-to-r from-[#F59121] to-[#d4791a] text-white shadow-orange-500/30'
                : formData.solicitudType === 'PA'
                  ? 'bg-gradient-to-r from-[#2F4DAA] to-[#1A2B56] text-white shadow-blue-500/30'
                  : 'bg-gradient-to-r from-[#F59121] to-[#d4791a] text-white shadow-orange-500/30'
                }`}
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover/submit:scale-x-100 transition-transform duration-700 origin-left" />
              {editingRecord ? <Save className="w-6 h-6 animate-pulse" /> : <PlusCircle className="w-6 h-6 group-hover/submit:rotate-90 transition-transform duration-500" />}
              <span>{editingRecord ? 'Actualizar Resolución' : 'Emitir Resolución'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PermitForm;
