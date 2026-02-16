
import React, { useMemo, useState } from 'react';
import { PermitRecord, LeaveRequest, EmployeeExtended, LeaveStatus } from '../types';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Users, Calendar, AlertTriangle, ChevronRight, 
    FileDown, Loader2, Activity, Clock, Bell, FileText, CalendarDays,
    Building2, UserCheck, UserX, BookOpen, Briefcase, AlertCircle
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
    PA: '#6366f1',
    FL: '#f59e0b',
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#64748b',
    warning: '#f59e0b',
    info: '#3b82f6',
    purple: '#8b5cf6'
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

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon: Icon, iconBg, iconColor, borderColor = 'border-slate-200 dark:border-slate-700', trend, onClick, highlight }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border ${borderColor} transition-all hover:shadow-md ${onClick ? 'cursor-pointer group' : ''} ${highlight ? 'ring-2 ring-amber-400/60' : ''}`}
    >
        <div className="flex items-start justify-between">
            <div className={`${iconBg} ${iconColor} p-2.5 rounded-xl ${onClick ? 'group-hover:scale-110 transition-transform' : ''}`}>
                <Icon className="w-5 h-5" />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${trend.value >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend.label}
                </div>
            )}
        </div>
        <div className="mt-3">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <div className="flex items-center gap-2 mt-0.5">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                {onClick && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />}
            </div>
            {sub && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
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
        className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg ${onClick ? 'cursor-pointer group' : ''}`}
    >
        <div className="flex items-start gap-4">
            <div className={`${iconBg} ${iconColor} p-3 rounded-xl ${onClick ? 'group-hover:scale-110 transition-transform' : ''}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">{title}</h4>
                    {onClick && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                {stats && stats.length > 0 && (
                    <div className="flex gap-4 mt-3">
                        {stats.map((stat, i) => (
                            <div key={i}>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
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
    onClick?: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ type, title, description, count, onClick }) => {
    const styles = {
        warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle },
        error: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', icon: AlertCircle },
        info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', icon: Bell },
        success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', icon: UserCheck }
    };
    const style = styles[type];
    const Icon = style.icon;

    return (
        <div
            onClick={onClick}
            className={`${style.bg} ${style.border} border rounded-xl p-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
        >
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${style.text} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold ${style.text}`}>{title}</p>
                        {count !== undefined && (
                            <span className={`text-xs font-black ${style.text} px-2 py-0.5 rounded-full ${style.bg}`}>
                                {count}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
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
        const now = new Date();
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

        // --- Decretos del mes ---
        const thisMonthRecords = records.filter(r => {
            if (!r.fechaInicio) return false;
            const d = new Date(r.fechaInicio + 'T12:00:00');
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });
        const lastMonthRecords = records.filter(r => {
            if (!r.fechaInicio) return false;
            const d = new Date(r.fechaInicio + 'T12:00:00');
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
        });

        // --- Ausentismo actual (ausentes hoy) ---
        const today = now.toISOString().split('T')[0];
        const ausentesHoy = records.filter(r => {
            if (!r.fechaInicio) return false;
            const inicio = r.fechaInicio;
            const termino = r.fechaTermino || r.fechaInicio;
            return inicio <= today && termino >= today;
        });

        // --- Proximos eventos (proximas 7 dias) ---
        const next7Days = new Date(now);
        next7Days.setDate(next7Days.getDate() + 7);
        const next7DaysStr = next7Days.toISOString().split('T')[0];
        const proximosEventos = records.filter(r => {
            if (!r.fechaInicio) return false;
            return r.fechaInicio > today && r.fechaInicio <= next7DaysStr;
        }).sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));

        // --- Dias laborales restantes del ano ---
        const endOfYear = new Date(currentYear, 11, 31);
        const diffTime = endOfYear.getTime() - now.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Dias habiles aproximados (excluir fines de semana)
        let diasHabilesRestantes = 0;
        const tempDate = new Date(now);
        while (tempDate <= endOfYear) {
            const dayOfWeek = tempDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) diasHabilesRestantes++;
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // --- Saldos bajos (<2 dias) ---
        const lowBalancePA: Array<{ nombre: string; rut: string; saldo: number }> = [];
        const lowBalanceFL: Array<{ nombre: string; rut: string; saldo: number }> = [];
        
        // Ultimo registro por RUT por tipo
        const lastByRutPA: Record<string, PermitRecord> = {};
        const lastByRutFL: Record<string, PermitRecord> = {};
        const sortedRecords = [...records].sort((a, b) => b.createdAt - a.createdAt);
        
        sortedRecords.forEach(r => {
            if (r.solicitudType === 'PA' && !lastByRutPA[r.rut]) {
                lastByRutPA[r.rut] = r;
            } else if (r.solicitudType === 'FL' && !lastByRutFL[r.rut]) {
                lastByRutFL[r.rut] = r;
            }
        });

        Object.entries(lastByRutPA).forEach(([rut, r]) => {
            const saldo = r.diasHaber - r.cantidadDias;
            if (saldo < 2) {
                lowBalancePA.push({ nombre: r.funcionario, rut, saldo });
            }
        });

        Object.entries(lastByRutFL).forEach(([rut, r]) => {
            const saldo = (r.saldoFinalP1 ?? 0) + (r.saldoFinalP2 ?? 0);
            if (saldo < 2) {
                lowBalanceFL.push({ nombre: r.funcionario, rut, saldo });
            }
        });

        // --- Tendencias mensuales (ano filtrado) ---
        const monthlyData: Record<string, { PA: number; FL: number; total: number }> = {};
        for (let m = 0; m < 12; m++) {
            monthlyData[monthNames[m]] = { PA: 0, FL: 0, total: 0 };
        }
        
        records.filter(r => {
            if (!r.fechaInicio) return false;
            return new Date(r.fechaInicio + 'T12:00:00').getFullYear() === yearFilter;
        }).forEach(r => {
            const m = new Date(r.fechaInicio + 'T12:00:00').getMonth();
            const key = monthNames[m];
            monthlyData[key][r.solicitudType] += r.cantidadDias;
            monthlyData[key].total += r.cantidadDias;
        });

        const chartData = Object.entries(monthlyData).map(([name, data]) => ({ name, ...data }));

        // --- Comparativa ano anterior ---
        const lastYear = yearFilter - 1;
        const thisYearTotal = records.filter(r => {
            if (!r.fechaInicio) return false;
            return new Date(r.fechaInicio + 'T12:00:00').getFullYear() === yearFilter;
        }).reduce((acc, r) => acc + r.cantidadDias, 0);

        const lastYearTotal = records.filter(r => {
            if (!r.fechaInicio) return false;
            return new Date(r.fechaInicio + 'T12:00:00').getFullYear() === lastYear;
        }).reduce((acc, r) => acc + r.cantidadDias, 0);

        const yearTrend = lastYearTotal === 0 ? 0 : ((thisYearTotal - lastYearTotal) / lastYearTotal) * 100;

        // --- Distribucion por departamento ---
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
            
            // Ausentismo
            ausentesHoy: ausentesHoy.length,
            proximosEventos: proximosEventos.slice(0, 3),
            
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
        const now = new Date();
        const currentYear = now.getFullYear();
        const daysToEndYear = stats.diasRestantes;

        // Saldos bajos
        if (stats.totalLowBalance > 0) {
            list.push({
                type: 'warning',
                title: 'Funcionarios con saldo bajo',
                description: `${stats.lowBalancePA.length} PA + ${stats.lowBalanceFL.length} FL con menos de 2 dias`,
                count: stats.totalLowBalance,
                onClick: onViewLowBalance
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

            {/* --- Header --- */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Dashboard General</h2>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Vision general de GDP Cloud
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filtro de ano */}
                    <select
                        value={yearFilter}
                        onChange={e => setYearFilter(Number(e.target.value))}
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-black px-3 py-2 rounded-xl outline-none focus:border-indigo-500 cursor-pointer"
                    >
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Exportar PDF */}
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-black transition-colors shadow-lg"
                    >
                        {isExporting ? (
                            <><Loader2 size={16} className="animate-spin" /> Exportando...</>
                        ) : (
                            <><FileDown size={16} /> Exportar PDF</>
                        )}
                    </button>
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
            {stats.proximosEventos.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-purple-500" />
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Proximas Ausencias (7 dias)
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.proximosEventos.map((evento, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${evento.solicitudType === 'PA' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{evento.funcionario}</p>
                                    <p className="text-[11px] text-slate-500">
                                        {new Date(evento.fechaInicio + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        {' - '}{evento.cantidadDias} dia{evento.cantidadDias !== 1 ? 's' : ''} ({evento.solicitudType})
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
