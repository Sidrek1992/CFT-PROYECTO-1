import React, { useMemo, useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight, Calendar, Shield, TrendingUp, Clock } from 'lucide-react';

interface WelcomeBannerProps {
    userName?: string;
    totalRecords: number;
    totalEmployees: number;
    criticalAlerts: number;
    onClickDecrees?: () => void;
    onClickEmployees?: () => void;
    onClickUrgent?: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
    userName,
    totalRecords,
    totalEmployees,
    criticalAlerts,
    onClickDecrees,
    onClickEmployees,
    onClickUrgent,
}) => {
    const [isDismissed, setIsDismissed] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Check if already dismissed today
    useEffect(() => {
        const key = `gdp-banner-dismissed-${new Date().toDateString()}`;
        if (localStorage.getItem(key)) {
            setIsDismissed(true);
        }
    }, []);

    const dismiss = () => {
        setIsAnimating(true);
        const key = `gdp-banner-dismissed-${new Date().toDateString()}`;
        localStorage.setItem(key, 'true');
        setTimeout(() => setIsDismissed(true), 300);
    };

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    }, []);

    const todayStr = useMemo(() => {
        const now = new Date();
        return now.toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }, []);

    const displayName = userName?.trim() || null;

    if (isDismissed) return null;

    return (
        <div className={`relative overflow-hidden rounded-[20px] p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm page-fade-in ${isAnimating ? 'toast-exit' : ''}`}>
            {/* Fondo sutil */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-900/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />

            <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#2F4DAA]" />
                        <span className="text-[10px] font-bold text-[#2F4DAA]/80 dark:text-blue-400/80 uppercase tracking-widest leading-none">
                            {todayStr}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {greeting}{displayName ? `, ${displayName}` : ''}
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-lg">
                        {criticalAlerts > 0
                            ? `Tienes ${criticalAlerts} alerta${criticalAlerts > 1 ? 's' : ''} que requiere${criticalAlerts > 1 ? 'n' : ''} atención inmediata.`
                            : 'Todo en orden. Los saldos y registros han sido validados hoy.'
                        }
                    </p>

                    {/* Quick stats pills */}
                    <div className="flex flex-wrap gap-2.5 mt-5">
                        <button
                            type="button"
                            onClick={onClickDecrees}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-800/50 rounded-xl text-[11px] font-bold text-[#2F4DAA] dark:text-blue-300 hover:bg-blue-100/50 transition-all"
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                            {totalRecords} decretos
                        </button>
                        <button
                            type="button"
                            onClick={onClickEmployees}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"
                        >
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            {totalEmployees} funcionarios
                        </button>
                        {criticalAlerts > 0 && (
                            <button
                                type="button"
                                onClick={onClickUrgent}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-xl text-[11px] font-bold text-[#F59121] dark:text-orange-400 hover:bg-orange-100 transition-all"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                {criticalAlerts} urgente{criticalAlerts > 1 ? 's' : ''}
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={dismiss}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-slate-400 hover:text-slate-600 shrink-0"
                    aria-label="Cerrar banner"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default WelcomeBanner;
