
import React, { useMemo } from 'react';
import { PermitRecord } from '../types';
import { compareRecordsByDateDesc } from '../utils/recordDates';
import { getFLSaldoFinal } from '../utils/flBalance';
import { X, AlertTriangle, TrendingDown, User } from 'lucide-react';

interface LowBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: PermitRecord[];
}

const LowBalanceModal: React.FC<LowBalanceModalProps> = ({ isOpen, onClose, records }) => {
    const lowBalanceEmployees = useMemo(() => {
        const balanceByEmployee: Record<string, {
            nombre: string;
            rut: string;
            saldoPA: number | null;
            saldoFL: number | null;
        }> = {};

        const sorted = [...records].sort((a, b) => compareRecordsByDateDesc(a, b));

        // Procesar PA — saldo final = diasHaber - cantidadDias del último registro
        const seenPA = new Set<string>();
        sorted.filter(r => r.solicitudType === 'PA').forEach(r => {
            if (!seenPA.has(r.rut)) {
                if (!balanceByEmployee[r.rut]) {
                    balanceByEmployee[r.rut] = { nombre: r.funcionario, rut: r.rut, saldoPA: null, saldoFL: null };
                }
                balanceByEmployee[r.rut].saldoPA = r.diasHaber - r.cantidadDias;
                seenPA.add(r.rut);
            }
        });

        // Procesar FL — usar saldo final según 1 o 2 períodos
        const seenFL = new Set<string>();
        sorted.filter(r => r.solicitudType === 'FL').forEach(r => {
            if (!seenFL.has(r.rut)) {
                if (!balanceByEmployee[r.rut]) {
                    balanceByEmployee[r.rut] = { nombre: r.funcionario, rut: r.rut, saldoPA: null, saldoFL: null };
                }
                balanceByEmployee[r.rut].saldoFL = getFLSaldoFinal(r, 0);
                seenFL.add(r.rut);
            }
        });

        // Filtrar solo los que tienen saldo bajo en algún tipo
        return Object.values(balanceByEmployee)
            .filter(e => (e.saldoPA !== null && e.saldoPA < 2) || (e.saldoFL !== null && e.saldoFL < 2))
            .sort((a, b) => {
                const minA = Math.min(a.saldoPA ?? 999, a.saldoFL ?? 999);
                const minB = Math.min(b.saldoPA ?? 999, b.saldoFL ?? 999);
                return minA - minB;
            });
    }, [records]);

    if (!isOpen) return null;

    const getSaldoColor = (saldo: number | null) => {
        if (saldo === null) return 'text-slate-400 dark:text-slate-500';
        if (saldo < 0) return 'text-red-600 dark:text-red-400';
        if (saldo < 1) return 'text-red-500 dark:text-red-400';
        if (saldo < 2) return 'text-amber-600 dark:text-amber-400';
        return 'text-emerald-600 dark:text-emerald-400';
    };

    const getSaldoBg = (saldo: number | null) => {
        if (saldo === null) return 'bg-slate-50 dark:bg-slate-700/50';
        if (saldo < 0) return 'bg-red-50 dark:bg-red-900/30';
        if (saldo < 2) return 'bg-amber-50 dark:bg-amber-900/30';
        return 'bg-emerald-50 dark:bg-emerald-900/30';
    };

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-[#1A2B56]/40 backdrop-blur-[2px]" />

            <div
                className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-800 rounded-[32px] shadow-[0px_20px_60px_rgba(26,43,86,0.15)] overflow-hidden flex flex-col border border-slate-50 dark:border-slate-700 animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#2F4DAA] p-8 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 pointer-events-none">
                        <TrendingDown size={120} />
                    </div>

                    <div className="flex items-center justify-between z-10 relative">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-md shadow-xl ring-1 ring-white/10">
                                <AlertTriangle className="w-6 h-6 text-[#F59121]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">
                                    Alerta de Saldo Bajo
                                </h2>
                                <p className="text-[11px] font-medium uppercase opacity-70 tracking-widest mt-1">
                                    {lowBalanceEmployees.length} funcionarios con menos de 2 días
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {lowBalanceEmployees.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                <TrendingDown className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                ¡Todo en orden!
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                No hay funcionarios con saldo bajo en este momento.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {lowBalanceEmployees.map((emp, i) => (
                                <div
                                    key={emp.rut}
                                    className="bg-slate-50 dark:bg-slate-700/30 rounded-[20px] p-5 border border-slate-100 dark:border-slate-600 group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-600 rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 group-hover:bg-[#2F4DAA] group-hover:text-white transition-all">
                                            <User className="w-6 h-6 text-slate-400 group-hover:text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white uppercase truncate">
                                                {emp.nombre}
                                            </p>
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                                {emp.rut}
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            {emp.saldoPA !== null && emp.saldoPA < 2 && (
                                                <div className={`px-4 py-2.5 rounded-2xl text-center min-w-[64px] ${getSaldoBg(emp.saldoPA)}`}>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">PA</p>
                                                    <p className={`text-xl font-bold ${getSaldoColor(emp.saldoPA)}`}>
                                                        {emp.saldoPA.toFixed(1)}
                                                    </p>
                                                </div>
                                            )}
                                            {emp.saldoFL !== null && emp.saldoFL < 2 && (
                                                <div className={`px-4 py-2.5 rounded-2xl text-center min-w-[64px] ${getSaldoBg(emp.saldoFL)}`}>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">FL</p>
                                                    <p className={`text-xl font-bold ${getSaldoColor(emp.saldoFL)}`}>
                                                        {emp.saldoFL.toFixed(1)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        Los funcionarios listados tienen menos de 2 días hábiles disponibles
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LowBalanceModal;
