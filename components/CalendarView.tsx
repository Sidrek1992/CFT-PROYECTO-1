import React, { useState, useMemo } from 'react';
import { PermitRecord } from '../types';
import { ChevronLeft, ChevronRight, Calendar, X, FileText, Search, RotateCcw, Hash, Clock } from 'lucide-react';

interface CalendarViewProps {
    isOpen: boolean;
    onClose: () => void;
    records: PermitRecord[];
}

type TypeFilter = 'todos' | 'PA' | 'FL';

const CalendarView: React.FC<CalendarViewProps> = ({ isOpen, onClose, records }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
    const [employeeSearch, setEmployeeSearch] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Años disponibles
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        records.forEach(r => {
            if (r.fechaInicio) years.add(new Date(r.fechaInicio + 'T12:00:00').getFullYear());
        });
        years.add(today.getFullYear());
        return [...years].sort((a, b) => b - a);
    }, [records]);

    // Filtrar registros según tipo + búsqueda de empleado
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            if (typeFilter !== 'todos' && r.solicitudType !== typeFilter) return false;
            if (employeeSearch.trim()) {
                const q = employeeSearch.trim().toLowerCase();
                if (!r.funcionario.toLowerCase().includes(q) && !r.rut.includes(q)) return false;
            }
            return true;
        });
    }, [records, typeFilter, employeeSearch]);

    // Agrupar por día con info de rango
    const decreesByDay = useMemo(() => {
        const grouped: Record<number, { record: PermitRecord; isStart: boolean; isEnd: boolean; isMid: boolean; dayNumber: number }[]> = {};

        filteredRecords.forEach(r => {
            if (!r.fechaInicio) return;
            const startDate = new Date(r.fechaInicio + 'T12:00:00');
            // Para FL usar fechaTermino si existe para calcular rango real
            let calendarDays: number;
            if (r.solicitudType === 'FL' && r.fechaTermino) {
                const end = new Date(r.fechaTermino + 'T12:00:00');
                calendarDays = Math.round((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            } else {
                calendarDays = Math.max(Math.ceil(r.cantidadDias || 1), 1);
            }

            for (let i = 0; i < calendarDays; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                if (d.getFullYear() === year && d.getMonth() === month) {
                    const day = d.getDate();
                    if (!grouped[day]) grouped[day] = [];
                    grouped[day].push({
                        record: r,
                        isStart: i === 0,
                        isEnd: i === calendarDays - 1,
                        isMid: i > 0 && i < calendarDays - 1,
                        dayNumber: i + 1
                    });
                }
            }
        });
        return grouped;
    }, [filteredRecords, year, month]);

    // Resumen mensual
    const monthlySummary = useMemo(() => {
        let totalPA = 0, totalFL = 0, countPA = 0, countFL = 0;
        const seen = new Set<string>();
        filteredRecords.forEach(r => {
            if (!r.fechaInicio) return;
            const d = new Date(r.fechaInicio + 'T12:00:00');
            if (d.getFullYear() !== year || d.getMonth() !== month) return;
            const key = r.id || `${r.funcionario}-${r.fechaInicio}-${r.solicitudType}`;
            if (seen.has(key)) return;
            seen.add(key);
            if (r.solicitudType === 'PA') { totalPA += r.cantidadDias; countPA++; }
            else { totalFL += r.cantidadDias; countFL++; }
        });
        return { totalPA, totalFL, countPA, countFL };
    }, [filteredRecords, year, month]);

    // Nav
    const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
    const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); };
    const goToday = () => { setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(null); };

    const isWeekend = (day: number) => {
        const d = new Date(year, month, day);
        return d.getDay() === 0 || d.getDay() === 6;
    };
    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    // Badge de rango: esquinas según posición
    const badgeRadius = (isStart: boolean, isEnd: boolean) => {
        if (isStart && isEnd) return 'rounded-md';
        if (isStart) return 'rounded-l-md';
        if (isEnd) return 'rounded-r-md';
        return 'rounded-none';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-[#1A2B56]/40 backdrop-blur-[2px]" />
            <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-800 rounded-[32px] shadow-[0px_20px_60px_rgba(26,43,86,0.15)] overflow-hidden flex flex-col border border-slate-50 dark:border-slate-700 animate-scale-in" onClick={e => e.stopPropagation()}>

                {/* ─── Header ─── */}
                <div className="bg-[#2F4DAA] p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 pointer-events-none">
                        <Calendar size={120} />
                    </div>
                    <div className="flex items-center justify-between z-10 relative">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md ring-1 ring-white/10 shadow-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Calendario de Permisos</h2>
                                <p className="text-[11px] font-medium uppercase opacity-70 tracking-widest mt-1">Vista Mensual y Programación de Decretos</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ─── Filtros + Búsqueda ─── */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Filtro tipo */}
                        <div className="flex bg-white dark:bg-slate-700 p-1 rounded-[14px] border border-slate-200 dark:border-slate-600 shadow-sm">
                            {(['todos', 'PA', 'FL'] as const).map(opt => {
                                const labels: Record<string, string> = { todos: 'Todos', PA: 'PA', FL: 'FL' };
                                const active = typeFilter === opt;
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => { setTypeFilter(opt); setSelectedDay(null); }}
                                        className={`px-4 py-1.5 rounded-[10px] text-[10px] font-bold transition-all ${active ? 'bg-[#2F4DAA] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                                    >
                                        {labels[opt]}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Búsqueda empleado */}
                        <div className="relative group">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#2F4DAA] transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar funcionario..."
                                value={employeeSearch}
                                onChange={e => { setEmployeeSearch(e.target.value); setSelectedDay(null); }}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[12px] text-xs font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#2F4DAA]/10 focus:border-[#2F4DAA] w-56 shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Resumen mensual en linea */}
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-700 px-4 py-2 rounded-[14px] border border-slate-200 dark:border-slate-600 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#2F4DAA]" />
                            <span className="text-[11px] font-bold text-slate-500"><span className="text-[#2F4DAA]">{monthlySummary.countPA}</span> PA</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#F59121]" />
                            <span className="text-[11px] font-bold text-slate-500"><span className="text-[#F59121]">{monthlySummary.countFL}</span> FL</span>
                        </div>
                    </div>
                </div>

                {/* ─── Navigación mes/año ─── */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-100 group">
                            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-[#2F4DAA]" />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-100 group">
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#2F4DAA]" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {monthNames[month]} {year}
                    </h3>

                    <div className="flex items-center gap-3">
                        <select
                            value={year}
                            onChange={e => { setCurrentDate(new Date(Number(e.target.value), month, 1)); setSelectedDay(null); }}
                            className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-[12px] outline-none focus:ring-2 focus:ring-[#2F4DAA]/10 cursor-pointer shadow-sm"
                        >
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button
                            onClick={goToday}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#2F4DAA] dark:text-blue-400 rounded-[12px] transition-all font-bold text-[11px] uppercase tracking-widest"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Hoy</span>
                        </button>
                    </div>
                </div>

                {/* ─── Grid del calendario ─── */}
                <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                    {/* Headers días */}
                    <div className="grid grid-cols-7 gap-3 mb-4 sticky top-0 bg-white dark:bg-slate-800 pb-2 z-10 border-b border-slate-50">
                        {dayNames.map((name, i) => (
                            <div key={name} className={`text-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${i === 0 || i === 6 ? 'text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {name}
                            </div>
                        ))}
                    </div>

                    {/* Celdas */}
                    <div className="grid grid-cols-7 gap-3">
                        {/* Celldas vacías antes del 1 */}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-28 bg-transparent rounded-2xl border border-slate-50 opacity-20" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayRecords = decreesByDay[day] || [];
                            const hasRecords = dayRecords.length > 0;
                            const weekend = isWeekend(day);
                            const isSelected = selectedDay === day;

                            return (
                                <div
                                    key={day}
                                    onClick={() => hasRecords ? setSelectedDay(isSelected ? null : day) : setSelectedDay(null)}
                                    className={[
                                        'min-h-28 p-2 rounded-2xl border transition-all relative group',
                                        isToday(day) ? 'border-[#2F4DAA] bg-blue-50/30 shadow-sm' : weekend ? 'border-transparent bg-slate-50/50' : 'border-slate-50 bg-white dark:bg-slate-800/40',
                                        hasRecords ? 'cursor-pointer hover:border-[#2F4DAA]/30 hover:shadow-xl hover:shadow-[#2F4DAA]/5 active:scale-[0.98]' : '',
                                        isSelected ? 'ring-2 ring-[#2F4DAA] border-transparent shadow-xl' : ''
                                    ].join(' ')}
                                >
                                    {/* Número del día */}
                                    <div className="mb-2">
                                        {isToday(day) ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-[#2F4DAA] text-white rounded-[10px] text-[11px] font-bold shadow-lg shadow-blue-500/20">{day}</span>
                                        ) : (
                                            <span className={`text-sm font-bold ${weekend ? 'text-orange-300' : 'text-slate-400'}`}>{day}</span>
                                        )}
                                    </div>

                                    {/* Badges de permisos */}
                                    {hasRecords && (
                                        <div className="space-y-1">
                                            {dayRecords.slice(0, 3).map((entry, idx) => {
                                                const isPA = entry.record.solicitudType === 'PA';
                                                const bg = isPA ? 'bg-blue-50 dark:bg-blue-900/40 text-[#2F4DAA]' : 'bg-orange-50 dark:bg-orange-900/40 text-[#F59121]';
                                                const radius = badgeRadius(entry.isStart, entry.isEnd);

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`${bg} ${radius} text-[9px] px-2 py-1 truncate font-bold flex items-center gap-1 border border-transparent group-hover:border-current/10`}
                                                    >
                                                        {entry.isStart && <div className="w-1 h-1 rounded-full bg-current" />}
                                                        <span className="truncate">{entry.record.funcionario.split(' ')[0]}</span>
                                                    </div>
                                                );
                                            })}
                                            {dayRecords.length > 3 && (
                                                <div className="text-[9px] text-[#2F4DAA] font-bold px-2 mt-1">
                                                    +{dayRecords.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Panel detalle del día seleccionado ─── */}
                {selectedDay && decreesByDay[selectedDay] && (
                    <div className="border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 animate-slide-up">
                        {/* Header del panel */}
                        <div className="flex items-center justify-between px-8 pt-6 pb-4">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#F59121] rounded-full" />
                                {dayNames[new Date(year, month, selectedDay).getDay()]} {selectedDay} de {monthNames[month]}
                            </h4>
                            <span className="text-xs font-bold text-[#2F4DAA] bg-blue-50 dark:bg-blue-900/40 px-4 py-1.5 rounded-full uppercase tracking-widest">
                                {decreesByDay[selectedDay].length} {decreesByDay[selectedDay].length === 1 ? 'permiso' : 'permisos'}
                            </span>
                        </div>

                        {/* Lista de permisos */}
                        <div className="px-8 pb-8 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                            {decreesByDay[selectedDay].map((entry, idx) => {
                                const isPA = entry.record.solicitudType === 'PA';
                                return (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-5 rounded-[20px] transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 group border border-transparent hover:border-slate-100">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <p className="text-base font-bold text-slate-800 dark:text-white group-hover:text-[#2F4DAA] transition-colors">{entry.record.funcionario}</p>
                                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${isPA ? 'bg-blue-50 text-[#2F4DAA]' : 'bg-orange-50 text-[#F59121]'}`}>
                                                    {entry.record.solicitudType}
                                                </span>
                                                {!entry.isStart && (
                                                    <span className="text-[10px] font-bold bg-white text-slate-400 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                                                        Día {entry.dayNumber}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center gap-4 text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Hash className="w-3.5 h-3.5 opacity-50" />
                                                    <span className="text-xs font-bold">{entry.record.acto}</span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 opacity-50" />
                                                    <span className="text-xs font-bold">{entry.record.cantidadDias} día(s)</span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-xs font-bold uppercase tracking-wider">{entry.record.tipoJornada}</span>
                                                {entry.record.fechaTermino && (
                                                    <>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="text-xs font-bold">Hasta {entry.record.fechaTermino}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-50">
                                            <ChevronRight className="w-5 h-5 text-[#2F4DAA]" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ─── Leyenda ─── */}
                <div className="px-8 py-5 border-t border-slate-50 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-[5px] bg-blue-50 border border-blue-100" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Permiso Admin.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-[5px] bg-orange-50 border border-orange-100" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Feriado Legal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-[5px] bg-slate-50 border border-slate-100" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Inactivo</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-400" /> Inicio</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-[1px] bg-slate-300" /> Continuación</span>
                        <span className="flex items-center gap-2 opacity-50">● Hoy</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
