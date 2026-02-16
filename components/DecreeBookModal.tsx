import React, { useState, useMemo } from 'react';
import { PermitRecord } from '../types';
import { X, FileText, Download, Calendar, Printer } from 'lucide-react';
import { formatNumericDate } from '../utils/formatters';
import { getFLSaldoFinal } from '../utils/flBalance';

interface DecreeBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: PermitRecord[];
}

const DecreeBookModal: React.FC<DecreeBookModalProps> = ({ isOpen, onClose, records }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedType, setSelectedType] = useState<'ALL' | 'PA' | 'FL'>('ALL');

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const years = useMemo(() => {
        const s = new Set<number>([currentYear]);
        records.forEach(r => r.fechaDecreto && s.add(new Date(r.fechaDecreto).getFullYear()));
        return Array.from(s).sort((a, b) => b - a);
    }, [records, currentYear]);

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            if (!r.fechaDecreto) return false;
            const d = new Date(r.fechaDecreto + 'T12:00:00');
            return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth &&
                (selectedType === 'ALL' || r.solicitudType === selectedType);
        }).sort((a, b) => (parseInt(a.acto) || 0) - (parseInt(b.acto) || 0));
    }, [records, selectedYear, selectedMonth, selectedType]);

    const handlePrint = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const html = `<!DOCTYPE html><html><head><title>Libro ${months[selectedMonth]} ${selectedYear}</title>
      <style>body{font-family:system-ui;font-size:11px}h1{text-align:center}table{width:100%;border-collapse:collapse}
      th{background:#1e293b;color:#fff;padding:8px;text-align:left;font-size:9px}td{padding:6px;border-bottom:1px solid #e2e8f0}</style></head>
      <body><h1>Libro de Decretos - ${months[selectedMonth]} ${selectedYear}</h1>
      <table><tr><th>N°</th><th>Tipo</th><th>Funcionario</th><th>RUT</th><th>Días</th><th>Fecha</th><th>Saldo</th></tr>
      ${filteredRecords.map(r => {
            const saldoFinal = r.solicitudType === 'FL'
                ? getFLSaldoFinal(r, 0)
                : (r.diasHaber - r.cantidadDias);
            return `<tr><td>${r.acto}</td><td>${r.solicitudType}</td><td>${r.funcionario}</td><td>${r.rut}</td>
      <td>${r.cantidadDias}</td><td>${formatNumericDate(r.fechaInicio)}</td><td>${Number(saldoFinal).toFixed(1)}</td></tr>`;
        }).join('')}
      </table></body></html>`;
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-[#1A2B56]/40 backdrop-blur-[2px]" />
            <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-800 rounded-[32px] shadow-[0px_20px_60px_rgba(26,43,86,0.15)] overflow-hidden flex flex-col border border-slate-50 dark:border-slate-700 animate-scale-in" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-[#2F4DAA] p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 pointer-events-none">
                        <FileText size={120} />
                    </div>
                    <div className="flex items-center justify-between z-10 relative">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md ring-1 ring-white/10 shadow-xl">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Libro de Decretos</h2>
                                <p className="text-[11px] font-medium uppercase opacity-70 tracking-widest mt-1">Resumen Mensual de Actos Administrativos</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center bg-slate-50/50">
                    <div className="flex gap-3">
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(+e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[12px] text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2F4DAA]/20 transition-all shadow-sm"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(+e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[12px] text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2F4DAA]/20 transition-all shadow-sm"
                        >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-1 bg-white dark:bg-slate-700 p-1 rounded-[14px] border border-slate-200 dark:border-slate-600 shadow-sm">
                        {(['ALL', 'PA', 'FL'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setSelectedType(t)}
                                className={`px-4 py-1.5 rounded-[10px] text-[10px] sm:text-xs font-bold transition-all ${selectedType === t ? 'bg-[#2F4DAA] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                            >
                                {t === 'ALL' ? 'Todos' : t}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    <button
                        onClick={handlePrint}
                        disabled={!filteredRecords.length}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#F59121] text-white rounded-[12px] text-xs font-bold disabled:opacity-50 hover:bg-[#e6841b] transition-all shadow-lg shadow-orange-500/10 uppercase tracking-widest"
                    >
                        <Printer size={16} />
                        <span className="hidden sm:inline">Imprimir Libro</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                    {filteredRecords.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                                <Calendar className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No se encontraron decretos</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No hay registros para este mes y año seleccionados.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-[20px] p-6 border border-slate-100 dark:border-slate-600 text-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                <p className="text-3xl font-bold text-[#2F4DAA] dark:text-blue-400 mb-1">{filteredRecords.length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decretos Generados</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-[20px] p-6 border border-slate-100 dark:border-slate-600 text-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{filteredRecords.reduce((a, r) => a + r.cantidadDias, 0)}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Días Autorizados</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-[20px] p-6 border border-slate-100 dark:border-slate-600 text-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{new Set(filteredRecords.map(r => r.rut)).size}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funcionarios Beneficiarios</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                {filteredRecords.length > 0 && (
                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30">
                        <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                            Mostrando registros correlativos ordenados por número de acto
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DecreeBookModal;
