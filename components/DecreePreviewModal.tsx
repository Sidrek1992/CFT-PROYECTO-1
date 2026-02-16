import React from 'react';
import { PermitRecord } from '../types';
import { X, FileText, User, Calendar, Clock, Hash, Building, Award, ShieldCheck, Sparkles, Printer, FileDown } from 'lucide-react';
import { formatLongDate, toProperCase } from '../utils/formatters';
import { hasFLSecondPeriod } from '../utils/flBalance';

interface DecreePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: PermitRecord | null;
    onConfirm: () => void;
}

const DecreePreviewModal: React.FC<DecreePreviewModalProps> = ({ isOpen, onClose, record, onConfirm }) => {
    if (!isOpen || !record) return null;

    const isFL = record.solicitudType === 'FL';
    const saldoDisponibleP1 = record.saldoDisponibleP1 ?? 0;
    const solicitadoP1 = record.solicitadoP1 ?? record.cantidadDias ?? 0;
    const saldoFinalP1 = record.saldoFinalP1 ?? (saldoDisponibleP1 - solicitadoP1);
    const saldoDisponibleP2 = record.saldoDisponibleP2 ?? 0;
    const solicitadoP2 = record.solicitadoP2 ?? 0;
    const saldoFinalP2 = record.saldoFinalP2 ?? (saldoDisponibleP2 - solicitadoP2);
    const hasPeriod2 = hasFLSecondPeriod(record);

    const saldoFinalValue = isFL
        ? (hasPeriod2 ? saldoFinalP2 : saldoFinalP1)
        : (record.diasHaber - record.cantidadDias);
    const saldoFinal = saldoFinalValue.toFixed(1);
    const nombreProperCase = toProperCase(record.funcionario);

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop con Blur Premium */}
            <div
                className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md transition-opacity duration-700 animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-[40px] shadow-[0px_32px_120px_rgba(15,23,42,0.2)] overflow-hidden flex flex-col border border-white/20 dark:border-slate-700/50 animate-in zoom-in-95 fade-in slide-in-from-bottom-12 duration-700 ease-out" onClick={e => e.stopPropagation()}>

                {/* Header Premium Buk */}
                <div className="bg-gradient-to-br from-[#2F4DAA] via-[#1E3A8A] to-[#1A2B56] p-8 sm:p-10 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 pointer-events-none group-hover:scale-125 transition-transform duration-[3000ms]">
                        <FileText size={200} />
                    </div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#F59121]/10 rounded-full blur-[80px]" />

                    <div className="flex items-center justify-between z-10 relative">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-[22px] flex items-center justify-center backdrop-blur-xl ring-1 ring-white/20 shadow-2xl relative overflow-hidden group/icon">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                                <Sparkles className="w-8 h-8 text-white relative" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight leading-none">Previsualización</h2>
                                <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.25em] mt-3 flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-[#F59121]" />
                                    Auditoría Institucional GDP Cloud
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-[18px] transition-all duration-300 active:scale-90 border border-white/5"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar relative">
                    {/* Watermark Section */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center -rotate-12 select-none">
                        <p className="text-[120px] font-black uppercase tracking-widest whitespace-nowrap">BUK CLOUD SYSTEM</p>
                    </div>

                    {/* Document Info */}
                    <div className="text-center mb-12 relative z-10">
                        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-full border border-slate-100 dark:border-slate-800">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Documento Digitalizado</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight px-4 mb-8 uppercase">
                            {record.materia}
                        </h3>
                        <div className="inline-flex items-center gap-4 px-8 py-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/40 shadow-sm relative group/acto">
                            <div className="absolute -inset-1 bg-blue-500/10 rounded-3xl blur opacity-0 group-hover/acto:opacity-100 transition-opacity" />
                            <Hash className="w-5 h-5 text-[#2F4DAA] relative" />
                            <span className="text-2xl font-black text-[#2F4DAA] dark:text-blue-400 relative tracking-tighter">{record.acto}</span>
                        </div>
                    </div>

                    {/* Information Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        {/* Funcionario Identity Card */}
                        <div className="col-span-full bg-slate-50/50 dark:bg-slate-900/40 p-6 sm:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800/60 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-slate-200 group/card">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 transition-transform group-hover/card:scale-105 duration-500">
                                    <User className="w-8 h-8 text-[#2F4DAA]" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Identidad de Funcionario</p>
                                    <p className="text-[20px] font-black text-slate-800 dark:text-white leading-none">{nombreProperCase}</p>
                                    <p className="text-xs font-black text-slate-400 dark:text-slate-600 mt-2 tracking-widest border-t border-slate-100 dark:border-slate-800 pt-2 inline-block">{record.rut}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Grid Components */}
                        <div className="space-y-6">
                            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/60 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${record.solicitudType === 'PA' ? 'bg-blue-600 text-white' : 'bg-[#F59121] text-white'}`}>
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Acto de Origen</p>
                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm">{record.solicitudType === 'PA' ? 'Permiso Administrativo' : 'Feriado Legal'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/60 flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Inicio Vigencia</p>
                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm">{formatLongDate(record.fechaInicio)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/60 flex items-center gap-4">
                                <div className="w-12 h-12 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-md">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Temporalidad</p>
                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm">{record.cantidadDias} día(s) ({isFL ? 'Corrido' : record.tipoJornada})</p>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/60 flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-md">
                                    <Building className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{isFL ? 'Período Maestro' : 'Período Presup.'}</p>
                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight">{isFL ? (record.periodo1 || '—') : record.periodo}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance & Final Summary Card */}
                    <div className="mt-10 p-8 bg-gradient-to-br from-[#2F4DAA]/5 to-[#F59121]/5 dark:from-slate-900 dark:to-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group/summary shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 dark:bg-slate-700/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                        <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            Resumen de Balance Post-Operación
                        </h4>

                        {isFL ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white dark:border-slate-700 shadow-xl">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-4">Tramo Período A</p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-center">
                                            <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">Stock</p>
                                            <p className="text-lg font-black text-slate-700 dark:text-slate-300">{saldoDisponibleP1.toFixed(1)}</p>
                                        </div>
                                        <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700" />
                                        <div className="text-center">
                                            <p className="text-[8px] text-red-500 font-bold uppercase mb-1">Uso</p>
                                            <p className="text-lg font-black text-red-500">-{solicitadoP1.toFixed(1)}</p>
                                        </div>
                                        <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700" />
                                        <div className="text-center">
                                            <p className="text-[8px] text-emerald-500 font-bold uppercase mb-1">Final</p>
                                            <p className={`text-lg font-black ${saldoFinalP1 < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{saldoFinalP1.toFixed(1)}</p>
                                        </div>
                                    </div>
                                </div>

                                {hasPeriod2 && (
                                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white dark:border-slate-700 shadow-xl">
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-4">Tramo Período B</p>
                                        <div className="flex items-center justify-between">
                                            <div className="text-center">
                                                <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">Stock</p>
                                                <p className="text-lg font-black text-slate-700 dark:text-slate-300">{saldoDisponibleP2.toFixed(1)}</p>
                                            </div>
                                            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700" />
                                            <div className="text-center">
                                                <p className="text-[8px] text-red-500 font-bold uppercase mb-1">Uso</p>
                                                <p className="text-lg font-black text-red-500">-{solicitadoP2.toFixed(1)}</p>
                                            </div>
                                            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700" />
                                            <div className="text-center">
                                                <p className="text-[8px] text-emerald-500 font-bold uppercase mb-1">Final</p>
                                                <p className={`text-lg font-black ${saldoFinalP2 < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{saldoFinalP2.toFixed(1)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-white dark:border-slate-700 shadow-xl flex items-center justify-between relative z-10">
                                <div className="text-center px-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Disponible Haber</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{record.diasHaber}</p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <div className="w-[1px] h-12 bg-slate-100 dark:bg-slate-700 rotate-12" />
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">Consumo Actual</p>
                                    <p className="text-2xl font-black text-red-500">-{record.cantidadDias}</p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <div className="w-[1px] h-12 bg-slate-100 dark:bg-slate-700 -rotate-12" />
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Resultante Auditoría</p>
                                    <p className={`text-2xl font-black ${parseFloat(saldoFinal) < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {saldoFinal}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dynamic Footer Actions */}
                <div className="p-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-5 relative group/footer backdrop-blur-md">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center justify-center gap-3"
                    >
                        Re-evaluar Datos
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-8 py-5 bg-gradient-to-r from-[#2F4DAA] to-[#1E3A8A] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:shadow-[0px_20px_40px_rgba(47,77,170,0.3)] hover:-translate-y-1 transition-all duration-500 group/btn active:scale-95 flex items-center justify-center gap-4"
                    >
                        <FileDown className="w-5 h-5 group-hover/btn:animate-bounce" />
                        Ejecutar Emisión Digital
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DecreePreviewModal;

