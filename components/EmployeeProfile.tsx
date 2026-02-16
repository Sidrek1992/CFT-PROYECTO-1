import React, { useEffect, useRef } from 'react';
import { EmployeeExtended as Employee, LeaveRequest } from '../types';
import {
  X, Mail, Briefcase, Building, Calendar, Award,
  ShieldCheck, UserCircle, Phone, Info, Timer
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatDate, parseISODate } from '../utils/dateUtils';
import { getLeaveTypeColor, getStatusColor } from '../utils/colorUtils';

interface EmployeeProfileProps {
  employee: Employee;
  requests: LeaveRequest[];
  onClose: () => void;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employee, requests, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fullName = `${employee.firstName} ${employee.lastNamePaternal} ${employee.lastNameMaternal}`.trim();

  // Focus trap: focus the close button on mount, return focus on unmount
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  // Filter requests for this employee
  const employeeRequests = requests
    .filter(req => req.employeeId === employee.id)
    .sort((a, b) => parseISODate(b.startDate).getTime() - parseISODate(a.startDate).getTime());

  const chartData = [
    { name: 'Disponibles', value: Math.max(0, employee.totalVacationDays - employee.usedVacationDays) },
    { name: 'Usados', value: employee.usedVacationDays }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Perfil de ${fullName}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={modalRef} className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0px_40px_100px_rgba(0,0,0,0.2)] w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col scale-100">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          {/* Subtle patterns */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <img
                src={employee.avatarUrl}
                alt={`Avatar de ${fullName}`}
                className="w-32 h-32 rounded-[32px] border-4 border-white/20 shadow-2xl object-cover"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-[#2F4DAA] rounded-full" />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-[#F59121]">Funcionario Institucional</span>
              </div>
              <h2 className="text-4xl font-black tracking-tight">{fullName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-white/70 text-sm font-bold">
                <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl"><Briefcase size={16} className="text-[#F59121]" /> {employee.position}</span>
                <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl"><Building size={16} className="text-[#F59121]" /> {employee.department}</span>
              </div>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-[18px] transition-all group active:scale-95"
            aria-label="Cerrar perfil"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-10 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Left Column: Balances & History */}
            <div className="lg:col-span-8 space-y-10">
              {/* Stats Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Feriado Legal</h3>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-4xl font-black text-slate-800 dark:text-white">{Math.max(0, employee.totalVacationDays - employee.usedVacationDays)}</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-2">disponibles</span>
                      </div>
                      <div className="h-14 w-14">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              innerRadius={18}
                              outerRadius={25}
                              dataKey="value"
                              stroke="none"
                              startAngle={90}
                              endAngle={450}
                            >
                              <Cell fill="#f1f5f9" />
                              <Cell fill="#2F4DAA" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Permiso Administrativo</h3>
                  <div className="flex flex-col">
                    <span className="text-4xl font-black text-slate-800 dark:text-white">{employee.totalAdminDays - employee.usedAdminDays}</span>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mr-4">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-[#F59121] rounded-full transition-all duration-1000"
                          style={{ width: `${(employee.totalAdminDays > 0 ? (employee.totalAdminDays - employee.usedAdminDays) / employee.totalAdminDays : 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{employee.usedAdminDays}/{employee.totalAdminDays}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Licencias Médicas</h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <span className={`text-4xl font-black ${employee.usedSickLeaveDays > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
                        {employee.usedSickLeaveDays}
                      </span>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-2">días año</span>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/10 rounded-2xl flex items-center justify-center text-rose-500">
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Solicitudes History */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/50">
                  <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <Calendar size={20} className="text-[#2F4DAA]" aria-hidden="true" />
                    Historial de Ausencias
                  </h3>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{employeeRequests.length} Solicitudes</span>
                </div>

                {employeeRequests.length === 0 ? (
                  <div className="p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                      <Timer size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em]">Sin registros históricos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-slate-500">
                          <th className="px-8 py-5">Tipo Solicitud</th>
                          <th className="px-8 py-5">Período</th>
                          <th className="px-8 py-5 text-center">Días</th>
                          <th className="px-8 py-5">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {employeeRequests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-8 py-5">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getLeaveTypeColor(req.type)}`}>
                                {req.type}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-2">
                                <span>{formatDate(req.startDate)}</span>
                                <span className="text-[#F59121]">➜</span>
                                <span>{formatDate(req.endDate)}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center font-black text-[#2F4DAA]">
                              {req.daysCount}
                            </td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(req.status)}`}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Institutional Details */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#2F4DAA] p-8 rounded-[32px] text-white shadow-xl shadow-blue-500/10">
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                  <ShieldCheck size={18} className="text-[#F59121]" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Ficha Institucional</h4>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-2">RUT</label>
                    <p className="text-lg font-black">{employee.rut || 'No Registrado'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-2">Email Personal</label>
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-[#F59121]" />
                      <p className="font-bold text-sm truncate">{employee.emailPersonal || 'Sin correo personal'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-2">Fecha Ingreso</label>
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-[#F59121]" />
                      <p className="font-bold text-sm">{employee.hireDate ? formatDate(employee.hireDate) : '01/01/2024'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">
                  <UserCircle size={18} className="text-[#2F4DAA]" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Relaciones & Reporte</h4>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Jefatura Directa</label>
                    <p className="font-black text-slate-800 dark:text-white">{employee.jefaturaNombre || 'Dirección General'}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{employee.jefaturaEmail || 'direccion@institucion.cl'}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Contacto de Emergencia</label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                      <Phone size={16} className="text-[#2F4DAA]" />
                      <p className="text-xs font-black text-slate-600 dark:text-slate-300">{employee.emergencyContact || 'Información no disponible'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-200 dark:border-orange-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <Info size={16} className="text-[#F59121]" />
                  <p className="text-[10px] font-black text-[#F59121] uppercase tracking-widest">Información de Sistema</p>
                </div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                  Todos los balances y registros son actualizados automáticamente según las solicitudes aprobadas en el portal institucional.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
