import React from 'react';
import { LayoutDashboard, Users, FileText, Settings, Mail, CalendarDays, LogOut, Cloud, BookOpen } from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onLogout: () => void;
  isSyncing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout, isSyncing }) => {
  const menuItems: { id: ViewType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; special?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Funcionarios', icon: Users },
    { id: 'decretos', label: 'Decretos', icon: BookOpen },
    { id: 'calendar', label: 'Calendario', icon: CalendarDays },
    { id: 'requests', label: 'Solicitudes', icon: FileText },
    { id: 'reports', label: 'Reportes', icon: Mail },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-[#1A2B56] text-white overflow-y-auto font-['Source_Sans_Pro']">
      <div className="p-8 border-b border-white/5">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${isSyncing ? 'bg-indigo-500 animate-pulse' : 'bg-[#2F4DAA] ring-4 ring-white/5'}`}>
            <span className="text-xl font-bold text-white tracking-tighter italic">GDP</span>
          </div>
          <div className="mt-1">
            <h1 className="text-xl font-bold tracking-tight">GDP Cloud</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Gestión de Personas</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1" aria-label="Menú principal">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Ir a ${item.label}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="font-semibold text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/5 space-y-2">
        <button
          onClick={() => setView('settings')}
          className={`flex items-center gap-3 px-4 py-3 w-full transition-all rounded-xl ${currentView === 'settings'
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          aria-current={currentView === 'settings' ? 'page' : undefined}
          aria-label="Ir a Configuración"
        >
          <Settings size={18} aria-hidden="true" />
          <span className="font-bold text-sm">Configuración</span>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-white/30 hover:text-rose-400 hover:bg-rose-400/5 transition-all rounded-xl"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="font-bold text-sm">Cerrar Sesión</span>
        </button>

        <div className="mt-8 pt-6 border-t border-white/5 text-center px-4">
          <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
            GDP Cloud v1.0
          </p>
        </div>
      </div>
    </div>
  );
};
