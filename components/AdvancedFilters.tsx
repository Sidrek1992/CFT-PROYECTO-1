
import React, { useState } from 'react';
import { Filter, X, Calendar, RotateCcw, ChevronDown, SlidersHorizontal, Trash2 } from 'lucide-react';

export interface FilterState {
    dateFrom: string;
    dateTo: string;
    minDays: string;
    maxDays: string;
    materia: string;
}

interface AdvancedFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onReset: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ filters, onFiltersChange, onReset }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    const handleChange = (key: keyof FilterState, value: string) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-[32px] border transition-all duration-700 overflow-hidden ${isExpanded ? 'shadow-[0px_25px_70px_rgba(26,43,86,0.06)] border-slate-200/60 dark:border-slate-700' : 'shadow-[0px_10px_40px_rgba(26,43,86,0.03)] border-slate-100 dark:border-slate-800'}`}>
            {/* Toggle button Buk Premium */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-8 py-6 transition-all duration-500 group relative ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-900/10' : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/30'}`}
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className={`w-12 h-12 rounded-[18px] transition-all duration-500 flex items-center justify-center ${hasActiveFilters ? 'bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56] text-white shadow-xl shadow-blue-500/20 active:scale-95' : 'bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-blue-900'}`}>
                        {hasActiveFilters ? <SlidersHorizontal size={22} strokeWidth={2.5} /> : <Filter size={22} strokeWidth={2} />}
                    </div>
                    <div className="text-left">
                        <span className="text-[15px] font-black text-slate-800 dark:text-slate-200 block tracking-tight uppercase">
                            Panel de Filtros Avanzados
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            {hasActiveFilters ? (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#F59121] animate-pulse" />
                                    <span className="text-[9px] font-black text-[#F59121] uppercase tracking-[0.2em]">Parámetros de Auditoría Activos</span>
                                </>
                            ) : (
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Explora la base de datos institucional</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`flex items-center gap-3 transition-all duration-500 ${isExpanded ? 'text-[#2F4DAA]' : 'text-slate-300'}`}>
                    {hasActiveFilters && !isExpanded && (
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-[#2F4DAA] dark:text-blue-400 text-[9px] font-black rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800 ring-4 ring-blue-50/50 dark:ring-blue-900/10">Activo</span>
                    )}
                    <div className={`w-8 h-8 rounded-full border border-slate-100 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm transition-transform duration-700 ${isExpanded ? 'rotate-180 border-blue-200 dark:border-blue-900' : ''}`}>
                        <ChevronDown className={`w-4 h-4 transition-colors ${isExpanded ? 'text-[#2F4DAA]' : 'text-slate-400'}`} />
                    </div>
                </div>
            </button>

            {/* Filters panel transition */}
            <div className={`transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="px-8 pb-10 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Rango de Fechas */}
                        <div className="lg:col-span-12">
                            <h4 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <span className="w-10 h-[1px] bg-slate-100 dark:bg-slate-700"></span>
                                Segmentación Temporal
                                <span className="flex-grow h-[1px] bg-slate-100 dark:bg-slate-700"></span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 block">
                                        Fecha Inicial (Desde)
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/field:text-[#2F4DAA] group-focus-within/field:scale-110 transition-all duration-500" />
                                        <input
                                            type="date"
                                            value={filters.dateFrom}
                                            onChange={(e) => handleChange('dateFrom', e.target.value)}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50/30 dark:bg-slate-900/20 border-2 border-slate-50 dark:border-slate-700/50 rounded-[16px] text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white focus:border-[#2F4DAA] focus:ring-[10px] focus:ring-blue-100 dark:focus:ring-blue-900/10 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 block">
                                        Fecha Final (Hasta)
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/field:text-[#2F4DAA] group-focus-within/field:scale-110 transition-all duration-500" />
                                        <input
                                            type="date"
                                            value={filters.dateTo}
                                            onChange={(e) => handleChange('dateTo', e.target.value)}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50/30 dark:bg-slate-900/20 border-2 border-slate-50 dark:border-slate-700/50 rounded-[16px] text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white focus:border-[#2F4DAA] focus:ring-[10px] focus:ring-blue-100 dark:focus:ring-blue-900/10 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Parámetros de Solicitud */}
                        <div className="lg:col-span-12">
                            <h4 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <span className="w-10 h-[1px] bg-slate-100 dark:bg-slate-700"></span>
                                Atributos de Búsqueda
                                <span className="flex-grow h-[1px] bg-slate-100 dark:bg-slate-700"></span>
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 block">
                                        Magnitud Mín.
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={filters.minDays}
                                        onChange={(e) => handleChange('minDays', e.target.value)}
                                        placeholder="0"
                                        className="w-full px-6 py-4 bg-slate-50/30 dark:bg-slate-900/20 border-2 border-slate-50 dark:border-slate-700/50 rounded-[16px] text-sm font-black text-slate-800 dark:text-white outline-none focus:bg-white focus:border-[#2F4DAA] focus:ring-[10px] focus:ring-blue-100 transition-all text-center shadow-sm"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 block">
                                        Magnitud Máx.
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={filters.maxDays}
                                        onChange={(e) => handleChange('maxDays', e.target.value)}
                                        placeholder="30"
                                        className="w-full px-6 py-4 bg-slate-50/30 dark:bg-slate-900/20 border-2 border-slate-50 dark:border-slate-700/50 rounded-[16px] text-sm font-black text-slate-800 dark:text-white outline-none focus:bg-white focus:border-[#2F4DAA] focus:ring-[10px] focus:ring-blue-100 transition-all text-center shadow-sm"
                                    />
                                </div>
                                <div className="col-span-2 space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 block">
                                        Categoría de Acto
                                    </label>
                                    <select
                                        value={filters.materia}
                                        onChange={(e) => handleChange('materia', e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50/30 dark:bg-slate-900/20 border-2 border-slate-50 dark:border-slate-700/50 rounded-[16px] text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white focus:border-[#2F4DAA] focus:ring-[10px] focus:ring-blue-100 dark:focus:ring-blue-900/10 transition-all cursor-pointer shadow-sm appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value="">Consolidado total de materias</option>
                                        <option value="Decreto Exento">Decreto Exento</option>
                                        <option value="Resolución Exenta">Resolución Exenta</option>
                                        <option value="Decreto">Decreto</option>
                                        <option value="Resolución">Resolución</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-gradient-to-b from-[#2F4DAA] to-[#F59121] rounded-full hidden sm:block" />
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">
                                Optimización de búsqueda por inteligencia institucional
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={onReset}
                                className="group/btn flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-slate-500 dark:text-slate-300 hover:text-[#F59121] rounded-[20px] border border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-900/50 transition-all duration-500 text-[11px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95"
                            >
                                <Trash2 size={16} className="transition-transform group-hover/btn:scale-110 group-hover/btn:rotate-12" />
                                Restaurar Valores
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilters;

