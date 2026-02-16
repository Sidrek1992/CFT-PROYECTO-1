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
    <div className="flex flex-col w-full h-full bg-slate-900 dark:bg-slate-950 text-white overflow-y-auto">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isSyncing ? 'bg-indigo-600 animate-pulse' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
            <Cloud className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">GDP Cloud</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Gestion de Personas</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2" aria-label="Menú principal">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? item.special
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50'
                  : 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Ir a ${item.label}`}
            >
              <Icon size={20} className={item.special ? 'text-yellow-200' : ''} aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={() => setView('settings')}
          className={`flex items-center gap-3 px-4 py-3 w-full transition-colors rounded-lg ${currentView === 'settings'
            ? 'bg-slate-800 text-white shadow-md'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          aria-current={currentView === 'settings' ? 'page' : undefined}
          aria-label="Ir a Configuración"
        >
          <Settings size={20} aria-hidden="true" />
          <span>Configuración</span>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-rose-200 hover:bg-rose-900/20 transition-colors rounded-lg"
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} aria-hidden="true" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
