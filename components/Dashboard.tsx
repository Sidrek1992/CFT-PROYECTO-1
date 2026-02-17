
import React, { useMemo, useState } from 'react';
import { PermitRecord, LeaveRequest, EmployeeExtended, LeaveStatus } from '../types';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    TrendingUp, TrendingDown, Users, Calendar, AlertTriangle, ChevronRight,
    FileDown, Loader2, Activity, Clock, Bell, FileText, CalendarDays,
    Building2, UserCheck, UserX, BookOpen, Briefcase, AlertCircle,
    Cake, Palmtree, Stethoscope, Gift, Search, Send, Sparkles
} from 'lucide-react';
import { exportDashboardToPDF } from '../services/batchPdfGenerator';

interface DashboardProps {
    records: PermitRecord[];
    employees: { nombre: string; rut: string }[];
    hrEmployees?: EmployeeExtended[];
    hrRequests?: LeaveRequest[];
    onViewLowBalance: () => void;
    onNavigate?: (view: string) => void;
    baseDaysPA: number;
}

const COLORS = {
    PA: '#2F4DAA',
    FL: '#F59121',
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#64748b',
    warning: '#F59121',
    info: '#2F4DAA',
    purple: '#4F46E5'
};

// ---------------------------------------------------------------------------
// Componentes auxiliares reutilizables
// ---------------------------------------------------------------------------

interface KpiCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    borderColor?: string;
    trend?: { value: number; label: string };
    onClick?: () => void;
    highlight?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon: Icon, iconBg, iconColor, borderColor = 'border-slate-100 dark:border-slate-800', trend, onClick, highlight }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden bg-white dark:bg-slate-800 rounded-[24px] p-6 border ${borderColor} shadow-[0px_8px_24px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0px_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 ${onClick ? 'cursor-pointer group' : ''} ${highlight ? 'ring-2 ring-orange-500/30' : ''}`}
    >
        {/* Abstract Background Decoration */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.05] transition-transform group-hover:scale-110 ${iconBg}`} />

        <div className="flex items-start justify-between relative z-10">
            <div className={`${iconBg} ${iconColor} p-3.5 rounded-2xl shadow-sm ${onClick ? 'group-hover:rotate-6 transition-transform' : ''}`}>
                <Icon className="w-6 h-6" />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${trend.value >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend.label}
                </div>
            )}
        </div>
        <div className="mt-5 relative z-10">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1.5">{label}</p>
            <div className="flex items-center gap-2">
                <p className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
                {onClick && <ChevronRight className="w-5 h-5 text-slate-200 group-hover:translate-x-1 transition-transform" />}
            </div>
            {sub && <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                {sub}
            </p>}
        </div>
    </div>
);

// Tarjeta de acceso rápido a vista
interface QuickAccessCardProps {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    stats?: { label: string; value: string | number }[];
    onClick?: () => void;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, description, icon: Icon, iconBg, iconColor, stats, onClick }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 dark:border-slate-700/40 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:bg-white/60 dark:hover:bg-slate-800/60 ${onClick ? 'cursor-pointer group' : ''}`}
    >
        {/* Glowing edge effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <div className="flex items-start gap-5 relative z-10">
            <div className={`${iconBg} ${iconColor} p-4 rounded-2xl shadow-sm ${onClick ? 'group-hover:rotate-6 transition-transform' : ''}`}>
                <Icon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-slate-800 dark:text-white group-hover:text-[#2F4DAA] dark:group-hover:text-blue-400 transition-colors">{title}</h4>
                    {onClick && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />}
                </div>
                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
                {stats && stats.length > 0 && (
                    <div className="flex gap-6 mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                        {stats.map((stat, i) => (
                            <div key={i}>
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
);

// Alerta individual
interface AlertItemProps {
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    description: string;
    count?: number;
    urgency?: number; // 0-100 for a progress bar
    onClick?: () => void;
    onNotify?: (e: React.MouseEvent) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ type, title, description, count, urgency, onClick, onNotify }) => {
    const styles = {
        warning: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle, dot: 'bg-amber-500' },
        error: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-100 dark:border-red-800/50', text: 'text-red-700 dark:text-red-400', icon: AlertCircle, dot: 'bg-red-500' },
        info: { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-800/50', text: 'text-blue-700 dark:text-blue-400', icon: Bell, dot: 'bg-blue-500' },
        success: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-100 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-400', icon: UserCheck, dot: 'bg-emerald-500' }
    };
    const style = styles[type];
    const Icon = style.icon;

    return (
        <div
            onClick={onClick}
            className={`${style.bg} ${style.border} border rounded-[24px] p-5 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-95' : ''} group`}
        >
            <div className="flex items-start gap-4">
                <div className={`mt-1 p-2.5 rounded-2xl ${style.bg} ${style.text} shadow-sm group-hover:rotate-12 transition-transform`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className={`text-[14px] font-black ${style.text} tracking-tight truncate`}>{title}</p>
                        <div className="flex items-center gap-2">
                            {onNotify && (
                                <button
                                    onClick={onNotify}
                                    className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400 hover:text-indigo-500 transition-colors"
                                    title="Notificar funcionario"
                                >
                                    <Send size={14} />
                                </button>
                            )}
                            <div className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
                        </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{description}</p>

                    {urgency !== undefined && (
                        <div className="mt-3 w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${style.dot} transition-all duration-1000`}
                                style={{ width: `${urgency}%` }}
                            />
                        </div>
                    )}

                    {count !== undefined && (
                        <div className="mt-3 flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${style.text} shadow-sm`}>
                                {count} {count === 1 ? 'evento' : 'eventos'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Tooltip personalizado para graficos
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 rounded-xl p-3 shadow-xl">
            <p className="text-[11px] font-black text-slate-300 mb-2 uppercase tracking-wider">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[11px] font-bold text-slate-400">{entry.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-white">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Dashboard principal
// ---------------------------------------------------------------------------

const Dashboard: React.FC<DashboardProps> = ({
    records,
    employees,
    hrEmployees = [],
    hrRequests = [],
    onViewLowBalance,
    onNavigate,
    baseDaysPA
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [yearFilter, setYearFilter] = useState<number>(() => new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState('');
    const now = useMemo(() => new Date(), []);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await exportDashboardToPDF('dashboard-content', 'GDP Cloud - Dashboard General');
        } catch (error) {
            console.error('Error al exportar Dashboard:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Anos disponibles para filtro
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        records.forEach(r => {
            if (r.fechaInicio) {
                const y = new Date(r.fechaInicio + 'T12:00:00').getFullYear();
                if (y) years.add(y);
            }
        });
        years.add(new Date().getFullYear());
        return [...years].sort((a, b) => b - a);
    }, [records]);

    // ---------------------------------------------------------------------------
    // Calculos centralizados
    // ---------------------------------------------------------------------------
    const stats = useMemo(() => {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // --- Estadisticas HR ---
        const totalFuncionarios = hrEmployees.length || employees.length;
        const funcionariosActivos = new Set(records.map(r => r.rut)).size;

        // Solicitudes pendientes
        const pendingRequests = hrRequests.filter(r => r.status === LeaveStatus.PENDING);
        const approvedRequests = hrRequests.filter(r => r.status === LeaveStatus.APPROVED);
        const rejectedRequests = hrRequests.filter(r => r.status === LeaveStatus.REJECTED);

        // Departamentos unicos
        const departments = new Set(hrEmployees.map(e => e.department).filter(Boolean));

        // --- Pre-categorize data to avoid O(N*M) filters ---
        const thisMonthRecords: PermitRecord[] = [];
        const lastMonthRecords: PermitRecord[] = [];
        const startsToday: any[] = [];
        const onLeaveToday: any[] = [];
        const next7DaysRecs: PermitRecord[] = [];
        const monthlyData: Record<string, { PA: number; FL: number; total: number }> = {};
        for (let m = 0; m < 12; m++) monthlyData[monthNames[m]] = { PA: 0, FL: 0, total: 0 };

        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const next7Days = new Date(now);
        next7Days.setDate(next7Days.getDate() + 7);
        const next7DaysStr = next7Days.toISOString().split('T')[0];
        const todayStr = now.toISOString().split('T')[0];

        let thisYearTotal = 0;
        let lastYearTotal = 0;
        const lastYear = yearFilter - 1;

        // Process records in a single pass
        records.forEach(r => {
            if (!r.fechaInicio) return;
            const d = new Date(r.fechaInicio + 'T12:00:00');
            const y = d.getFullYear();
            const m = d.getMonth();
            const dateStr = r.fechaInicio;

            // This/Last Month
            if (y === currentYear && m === currentMonth) thisMonthRecords.push(r);
            if (y === prevYear && m === prevMonth) lastMonthRecords.push(r);

            // Today
            if (dateStr === todayStr) startsToday.push({ nombre: r.funcionario, tipo: r.solicitudType });
            const termino = r.fechaTermino || r.fechaInicio;
            if (dateStr <= todayStr && termino >= todayStr) onLeaveToday.push({ nombre: r.funcionario, tipo: r.solicitudType });

            // Next 7 days
            if (dateStr > todayStr && dateStr <= next7DaysStr) next7DaysRecs.push(r);

            // Chart data & Trends
            if (y === yearFilter) {
                const key = monthNames[m];
                if (monthlyData[key]) {
                    monthlyData[key][r.solicitudType as 'PA' | 'FL'] += r.cantidadDias;
                    monthlyData[key].total += r.cantidadDias;
                }
                thisYearTotal += r.cantidadDias;
            }
            if (y === lastYear) lastYearTotal += r.cantidadDias;
        });

        // 1. Birthdays (Next 7 days)
        const cumpleanosSemana = hrEmployees.filter(emp => {
            if (!emp.birthDate) return false;
            const b = new Date(emp.birthDate + 'T12:00:00');
            const bDate = new Date(now.getFullYear(), b.getMonth(), b.getDate(), 12, 0, 0);
            if (bDate < new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)) {
                bDate.setFullYear(now.getFullYear() + 1);
            }
            const diff = (bDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diff >= -1 && diff <= 7;
        }).sort((a, b) => {
            const dateA = new Date(a.birthDate + 'T12:00:00');
            const dateB = new Date(b.birthDate + 'T12:00:00');
            return dateA.getMonth() - dateB.getMonth() || dateA.getDate() - dateB.getDate();
        });

        // Add Requests to Today/OnLeave
        hrRequests.forEach(req => {
            if (req.status !== LeaveStatus.APPROVED) return;
            const emp = hrEmployees.find(e => e.id === req.employeeId);
            const nombre = emp ? `${emp.firstName} ${emp.lastNamePaternal}` : 'Funcionario';

            if (req.startDate === todayStr) startsToday.push({ nombre, tipo: req.type });
            if (req.startDate <= todayStr && req.endDate >= todayStr) onLeaveToday.push({ nombre, tipo: req.type });
        });

        // --- Stats Calculations (Summary) ---


        // --- Time Calculations ---
        const endOfYear = new Date(currentYear, 11, 31);
        const diffTime = endOfYear.getTime() - now.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let diasHabilesRestantes = 0;
        const tempDate = new Date(now);
        while (tempDate <= endOfYear) {
            if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) diasHabilesRestantes++;
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // --- Low Balances ---
        const lowBalancePA: any[] = [];
        const lowBalanceFL: any[] = [];
        const lastByRutPA = new Map<string, PermitRecord>();
        const lastByRutFL = new Map<string, PermitRecord>();

        // Use a single loop to find latest records
        records.forEach(r => {
            if (r.solicitudType === 'PA') {
                const existing = lastByRutPA.get(r.rut);
                if (!existing || r.createdAt > existing.createdAt) lastByRutPA.set(r.rut, r);
            } else if (r.solicitudType === 'FL') {
                const existing = lastByRutFL.get(r.rut);
                if (!existing || r.createdAt > existing.createdAt) lastByRutFL.set(r.rut, r);
            }
        });

        lastByRutPA.forEach((r, rut) => {
            if (r.diasHaber - r.cantidadDias < 2) lowBalancePA.push({ nombre: r.funcionario, rut, saldo: r.diasHaber - r.cantidadDias });
        });
        lastByRutFL.forEach((r, rut) => {
            const saldo = (r.saldoFinalP1 ?? 0) + (r.saldoFinalP2 ?? 0);
            if (saldo < 2) lowBalanceFL.push({ nombre: r.funcionario, rut, saldo });
        });

        const chartData = Object.entries(monthlyData).map(([name, data]) => ({ name, ...data }));
        const yearTrend = lastYearTotal === 0 ? 0 : ((thisYearTotal - lastYearTotal) / lastYearTotal) * 100;

        const byDepartment: Record<string, number> = {};
        hrEmployees.forEach(emp => {
            const dept = emp.department || 'Sin asignar';
            byDepartment[dept] = (byDepartment[dept] || 0) + 1;
        });
        const departmentData = Object.entries(byDepartment)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // --- Conteos totales ---
        const totalDecretos = records.length;
        const decretosPA = records.filter(r => r.solicitudType === 'PA').length;
        const decretosFL = records.filter(r => r.solicitudType === 'FL').length;

        return {
            // HR General
            totalFuncionarios,
            funcionariosActivos,
            departmentsCount: departments.size,

            // Solicitudes HR
            pendingCount: pendingRequests.length,
            approvedCount: approvedRequests.length,
            rejectedCount: rejectedRequests.length,

            // Decretos
            totalDecretos,
            decretosPA,
            decretosFL,
            thisMonthCount: thisMonthRecords.length,
            lastMonthCount: lastMonthRecords.length,

            // Ausentismo & Eventos
            enPermisoHoy: onLeaveToday,
            cumpleanosSemana,
            iniciaHoy: startsToday,
            ausentesHoy: onLeaveToday.length,
            proximosEventos: next7DaysRecs.slice(0, 3).sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)),

            // Tiempo
            diasRestantes,
            diasHabilesRestantes,

            // Saldos bajos
            lowBalancePA,
            lowBalanceFL,
            totalLowBalance: lowBalancePA.length + lowBalanceFL.length,

            // Graficos
            chartData,
            departmentData,

            // Tendencias
            thisYearTotal,
            lastYearTotal,
            yearTrend
        };
    }, [records, employees, hrEmployees, hrRequests, yearFilter, baseDaysPA]);

    // ---------------------------------------------------------------------------
    // Alertas activas
    // ---------------------------------------------------------------------------
    const alerts = useMemo(() => {
        const list: AlertItemProps[] = [];
        const currentYear = now.getFullYear();
        const daysToEndYear = stats.diasRestantes;

        // Cierre de ano (si quedan menos de 45 dias)
        if (daysToEndYear <= 45 && daysToEndYear > 0) {
            list.push({
                type: 'warning',
                title: `Días por Vencer (${currentYear})`,
                description: 'Los saldos de PA expiran el 31 de dic.',
                urgency: Math.max(0, 100 - (daysToEndYear * 2)), // Higher urgency as date nears
                onClick: () => onNavigate?.('decretos')
            });
        }

        // Saldos bajos
        if (stats.totalLowBalance > 0) {
            list.push({
                type: 'error',
                title: 'Alerta de Saldo Mínimo',
                description: `${stats.lowBalancePA.length} PA y ${stats.lowBalanceFL.length} FL agotándose`,
                count: stats.totalLowBalance,
                onClick: onViewLowBalance,
                onNotify: (e) => {
                    e.stopPropagation();
                    console.log('Notificando a funcionarios con saldo bajo...');
                }
            });
        }

        // Solicitudes pendientes
        if (stats.pendingCount > 0) {
            list.push({
                type: 'info',
                title: 'Solicitudes pendientes',
                description: 'Requieren revision y aprobacion',
                count: stats.pendingCount,
                onClick: () => onNavigate?.('requests')
            });
        }

        // Cierre de ano (si quedan menos de 30 dias)
        if (daysToEndYear <= 30 && daysToEndYear > 0) {
            list.push({
                type: 'warning',
                title: `Cierre de ano en ${daysToEndYear} dias`,
                description: 'Revisar saldos de PA que expiran el 31 de diciembre'
            });
        }

        // Ausentes hoy
        if (stats.ausentesHoy > 0) {
            list.push({
                type: 'info',
                title: 'Funcionarios ausentes hoy',
                description: 'Con permiso o feriado legal vigente',
                count: stats.ausentesHoy
            });
        }

        return list;
    }, [stats, onViewLowBalance, onNavigate]);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <div id="dashboard-content" className="space-y-6">

            {/* --- Premium Welcome Banner --- */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#2F4DAA] to-[#1e3271] rounded-[32px] p-8 text-white shadow-2xl shadow-blue-900/20">
                {/* Abstract Patterns */}
                <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full rotate-12 scale-150">
                        <circle cx="200" cy="200" r="150" stroke="white" strokeWidth="2" strokeDasharray="20 20" />
                        <circle cx="200" cy="200" r="100" stroke="white" strokeWidth="1" />
                        <rect x="100" y="100" width="200" height="200" stroke="white" strokeWidth="0.5" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[24px] flex items-center justify-center border border-white/20 shadow-inner">
                            <Activity className="w-10 h-10 text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight leading-tight">Gestión Estratégica</h2>
                            <p className="text-blue-100/80 font-medium max-w-md mt-1 italic">
                                Visualice el estado actual de su institución y tome decisiones basadas en datos financieros y humanos.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex flex-col items-center bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex-1 md:flex-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Año Operativo</span>
                            <select
                                value={yearFilter}
                                onChange={e => setYearFilter(Number(e.target.value))}
                                className="bg-transparent text-xl font-black outline-none cursor-pointer appearance-none text-center"
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y} className="text-slate-900">{y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="flex items-center gap-3 px-8 py-4 bg-[#F59121] hover:bg-[#e07f10] active:scale-95 disabled:bg-slate-400 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-orange-900/20 uppercase tracking-widest whitespace-nowrap"
                        >
                            {isExporting ? (
                                <><Loader2 size={18} className="animate-spin" /> Exportando...</>
                            ) : (
                                <><FileDown size={18} /> Informe Ejecutivo</>
                            )}
                        </button>
                    </div>
                </div>

                {/* --- Proactive Search Bar (Glassmorphism) --- */}
                <div className="relative mt-6 max-w-2xl">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-blue-300" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Consultar estado de funcionario..."
                        className="w-full bg-white/10 dark:bg-slate-800/20 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-[20px] py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-lg"
                    />
                    {searchQuery && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[50] overflow-hidden overflow-y-auto max-h-60 p-2 animate-in fade-in slide-in-from-top-2">
                            {hrEmployees
                                .filter(e => `${e.firstName} ${e.lastNamePaternal}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                .slice(0, 5)
                                .map((e, i) => {
                                    const isAbsent = stats.enPermisoHoy.some(a => a.nombre.includes(e.firstName));
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                onNavigate?.('employees');
                                                setSearchQuery('');
                                            }}
                                            className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img src={e.avatarUrl} className="w-8 h-8 rounded-lg" alt="" />
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{e.firstName} {e.lastNamePaternal}</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isAbsent ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {isAbsent ? 'Ausente' : 'Presente'}
                                            </span>
                                        </div>
                                    );
                                })
                            }
                            {hrEmployees.filter(e => `${e.firstName} ${e.lastNamePaternal}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                <p className="text-center py-4 text-xs font-bold text-slate-400 italic">No se encontraron resultados</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- KPIs Principales (6 cards) --- */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiCard
                    label="Total Funcionarios"
                    value={stats.totalFuncionarios}
                    sub={`${stats.funcionariosActivos} con registros`}
                    icon={Users}
                    iconBg="bg-indigo-50 dark:bg-indigo-900/40"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                    onClick={() => onNavigate?.('employees')}
                />
                <KpiCard
                    label="Solicitudes Pendientes"
                    value={stats.pendingCount}
                    sub={`${stats.approvedCount} aprobadas`}
                    icon={FileText}
                    iconBg="bg-amber-50 dark:bg-amber-900/40"
                    iconColor="text-amber-600 dark:text-amber-400"
                    highlight={stats.pendingCount > 0}
                    onClick={() => onNavigate?.('requests')}
                />
                <KpiCard
                    label="Decretos del Mes"
                    value={stats.thisMonthCount}
                    sub={`vs ${stats.lastMonthCount} mes anterior`}
                    icon={BookOpen}
                    iconBg="bg-purple-50 dark:bg-purple-900/40"
                    iconColor="text-purple-600 dark:text-purple-400"
                    trend={stats.lastMonthCount > 0 ? {
                        value: ((stats.thisMonthCount - stats.lastMonthCount) / stats.lastMonthCount) * 100,
                        label: `${stats.thisMonthCount >= stats.lastMonthCount ? '+' : ''}${(((stats.thisMonthCount - stats.lastMonthCount) / stats.lastMonthCount) * 100).toFixed(0)}%`
                    } : undefined}
                    onClick={() => onNavigate?.('decretos')}
                />
                <KpiCard
                    label="Ausentes Hoy"
                    value={stats.ausentesHoy}
                    sub="Con permiso vigente"
                    icon={UserX}
                    iconBg="bg-slate-100 dark:bg-slate-700/50"
                    iconColor="text-slate-600 dark:text-slate-300"
                    onClick={() => onNavigate?.('calendar')}
                />
                <KpiCard
                    label="Saldo Bajo"
                    value={stats.totalLowBalance}
                    sub="Menos de 2 dias"
                    icon={AlertTriangle}
                    iconBg={stats.totalLowBalance > 0 ? 'bg-red-50 dark:bg-red-900/40' : 'bg-slate-100 dark:bg-slate-700/50'}
                    iconColor={stats.totalLowBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}
                    highlight={stats.totalLowBalance > 0}
                    onClick={onViewLowBalance}
                />
                <KpiCard
                    label="Dias Habiles Restantes"
                    value={stats.diasHabilesRestantes}
                    sub={`${stats.diasRestantes} dias calendario`}
                    icon={Clock}
                    iconBg="bg-emerald-50 dark:bg-emerald-900/40"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                />
            </div>

            {/* --- Eventos de Hoy (New Highlights Section) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cumpleaños */}
                <div className="bg-white dark:bg-slate-800 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-[0px_8px_24px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-pink-50 dark:bg-pink-900/30 text-pink-500 rounded-xl">
                            <Cake className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Cumpleaños de la Semana</h3>
                    </div>
                    {stats.cumpleanosSemana.length > 0 ? (
                        <div className="space-y-4 max-h-60 overflow-auto pr-1">
                            {stats.cumpleanosSemana.map((emp, i) => {
                                const b = new Date(emp.birthDate + 'T12:00:00');
                                const isToday = b.getMonth() === now.getMonth() && b.getDate() === now.getDate();
                                return (
                                    <div key={i} className="flex items-center gap-3 group">
                                        <div className={`w-10 h-10 rounded-full border-2 ${isToday ? 'border-pink-500 animate-pulse' : 'border-slate-100 dark:border-slate-700'} overflow-hidden`}>
                                            <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-black text-slate-900 dark:text-white leading-none truncate">{emp.firstName} {emp.lastNamePaternal}</p>
                                                {isToday && (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-pink-500 text-[8px] font-black text-white uppercase animate-bounce">Hoy</span>
                                                )}
                                            </div>
                                            <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest flex items-center gap-1 ${isToday ? 'text-pink-500' : 'text-slate-400'}`}>
                                                <Gift className="w-3 h-3" /> {b.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs font-bold text-slate-400 py-4 text-center italic">Sin cumpleaños esta semana</p>
                    )}
                </div>

                {/* Inician Hoy */}
                <div className="bg-white dark:bg-slate-800 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-[0px_8px_24px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl">
                            <Palmtree className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Inician Permiso Hoy</h3>
                    </div>
                    {stats.iniciaHoy.length > 0 ? (
                        <div className="space-y-3 max-h-40 overflow-auto pr-1">
                            {stats.iniciaHoy.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                                    <p className="text-xs font-black text-slate-800 dark:text-white truncate">{item.nombre}</p>
                                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        {item.tipo}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs font-bold text-slate-400 py-4 text-center italic">Nadie inicia permiso hoy</p>
                    )}
                </div>

                {/* Actualmente Ausentes */}
                <div className="bg-white dark:bg-slate-800 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-[0px_8px_24px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Ausencias Vigentes</h3>
                    </div>
                    {stats.enPermisoHoy.length > 0 ? (
                        <div className="space-y-3 max-h-40 overflow-auto pr-1">
                            {stats.enPermisoHoy.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-l-4 border-indigo-400">
                                    <p className="text-xs font-black text-slate-800 dark:text-white truncate">{item.nombre}</p>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 italic">
                                        {item.tipo}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs font-bold text-slate-400 py-4 text-center italic">Nadie está ausente hoy</p>
                    )}
                </div>
            </div>

            {/* --- Panel de Alertas + Accesos Rapidos --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Alertas */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Alertas y Notificaciones
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {alerts.length > 0 ? (
                            alerts.map((alert, i) => (
                                <AlertItem key={i} {...alert} />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <UserCheck className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-500">Sin alertas pendientes</p>
                                <p className="text-[11px] text-slate-400">Todo en orden</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Accesos rapidos a vistas */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickAccessCard
                        title="Decretos PA/FL"
                        description="Gestionar permisos administrativos y feriados legales"
                        icon={BookOpen}
                        iconBg="bg-indigo-50 dark:bg-indigo-900/40"
                        iconColor="text-indigo-600 dark:text-indigo-400"
                        stats={[
                            { label: 'PA', value: stats.decretosPA },
                            { label: 'FL', value: stats.decretosFL },
                            { label: 'Total', value: stats.totalDecretos }
                        ]}
                        onClick={() => onNavigate?.('decretos')}
                    />
                    <QuickAccessCard
                        title="Calendario"
                        description="Ver ausencias programadas y proximos eventos"
                        icon={CalendarDays}
                        iconBg="bg-purple-50 dark:bg-purple-900/40"
                        iconColor="text-purple-600 dark:text-purple-400"
                        stats={[
                            { label: 'Proximos 7d', value: stats.proximosEventos.length }
                        ]}
                        onClick={() => onNavigate?.('calendar')}
                    />
                    <QuickAccessCard
                        title="Funcionarios"
                        description="Base de datos de personal institucional"
                        icon={Users}
                        iconBg="bg-emerald-50 dark:bg-emerald-900/40"
                        iconColor="text-emerald-600 dark:text-emerald-400"
                        stats={[
                            { label: 'Total', value: stats.totalFuncionarios },
                            { label: 'Deptos', value: stats.departmentsCount || '-' }
                        ]}
                        onClick={() => onNavigate?.('employees')}
                    />
                    <QuickAccessCard
                        title="Solicitudes HR"
                        description="Gestionar solicitudes de permisos y licencias"
                        icon={Briefcase}
                        iconBg="bg-amber-50 dark:bg-amber-900/40"
                        iconColor="text-amber-600 dark:text-amber-400"
                        stats={[
                            { label: 'Pendientes', value: stats.pendingCount },
                            { label: 'Aprobadas', value: stats.approvedCount }
                        ]}
                        onClick={() => onNavigate?.('requests')}
                    />
                </div>
            </div>

            {/* --- Graficos: Tendencia + Comparativa --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Area chart - Tendencia mensual */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Dias otorgados por mes - {yearFilter}
                        </h3>
                        <div className="flex gap-3">
                            {[{ key: 'PA', label: 'Permisos', color: COLORS.PA }, { key: 'FL', label: 'Feriados', color: COLORS.FL }].map(t => (
                                <div key={t.key} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradPA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.PA} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={COLORS.PA} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradFL" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.FL} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={COLORS.FL} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="PA" name="Permisos" stroke={COLORS.PA} strokeWidth={2.5} fill="url(#gradPA)" />
                                <Area type="monotone" dataKey="FL" name="Feriados" stroke={COLORS.FL} strokeWidth={2.5} fill="url(#gradFL)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Comparativa anual + Departamentos */}
                <div className="space-y-6">
                    {/* Comparativa anual */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">
                            Comparativa Anual
                        </h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{yearFilter}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.thisYearTotal} dias</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{yearFilter - 1}</p>
                                <p className="text-lg font-bold text-slate-500">{stats.lastYearTotal} dias</p>
                            </div>
                        </div>
                        {stats.lastYearTotal > 0 && (
                            <div className={`mt-3 flex items-center gap-2 text-sm font-bold ${stats.yearTrend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {stats.yearTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {stats.yearTrend >= 0 ? '+' : ''}{stats.yearTrend.toFixed(1)}% vs ano anterior
                            </div>
                        )}
                    </div>

                    {/* Distribucion por departamento */}
                    {stats.departmentData.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">
                                Por Departamento
                            </h3>
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.departmentData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Funcionarios" fill={COLORS.purple} radius={[0, 4, 4, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Proximos eventos --- */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 mt-6 overflow-hidden relative">
                {/* Decorative blob */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full" />

                <div className="flex items-center gap-2 mb-6 relative z-10">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Próximas Ausencias Programadas
                    </h3>
                </div>

                {stats.proximosEventos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                        {stats.proximosEventos.map((evento, i) => (
                            <div key={i} className="group relative overflow-hidden flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 rounded-2xl border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-10 rounded-full ${evento.solicitudType === 'PA' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{evento.funcionario}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(evento.fechaInicio + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </p>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <p className="text-[10px] font-black text-slate-500">{evento.cantidadDias}D</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${evento.solicitudType === 'PA' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30'}`}>
                                        {evento.solicitudType}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 relative z-10">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-slate-200 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 italic">No hay ausencias programadas próximamente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
