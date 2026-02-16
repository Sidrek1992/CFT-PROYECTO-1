// ============================================================
// GDP CLOUD - APLICACION UNIFICADA
// Sistema de Gestion de Personas v3.0
// ============================================================

import React, { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './hooks/useTheme';
import { useDarkMode } from './hooks/useDarkMode';
import { useModals } from './hooks/useModals';
import { useCloudSync } from './hooks/useCloudSync';
import { useEmployeeSync } from './hooks/useEmployeeSync';
import { useKeyboardShortcuts, ShortcutsHelpModal } from './hooks/useKeyboardShortcuts';
import { ToastContainer, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './components/LoginPage';
import ScrollToTop from './components/ScrollToTop';

// Decretos Components
import PermitForm from './components/PermitForm';
import PermitTable from './components/PermitTable';
import StatsCards from './components/StatsCards';
import NotificationCenter from './components/NotificationCenter';
import ConfirmModal from './components/ConfirmModal';
import AdminPanel from './components/AdminPanel';
import CommandPalette from './components/CommandPalette';
import WelcomeBanner from './components/WelcomeBanner';

// Lazy loaded components
const EmployeeListModal = lazy(() => import('./components/EmployeeListModal'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const LowBalanceModal = lazy(() => import('./components/LowBalanceModal'));
const DecreeBookModal = lazy(() => import('./components/DecreeBookModal'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const ThemeSelector = lazy(() => import('./components/ThemeSelector'));

// New integrated modules from CFT-Permiso
const Settings = lazy(() => import('./components/Settings').then((m) => ({ default: m.Settings })));
const Reports = lazy(() => import('./components/Reports').then((m) => ({ default: m.Reports })));
const LeaveRequests = lazy(() => import('./components/LeaveRequests').then((m) => ({ default: m.LeaveRequests })));
const EmployeeList = lazy(() => import('./components/EmployeeList').then((m) => ({ default: m.EmployeeList })));

import { PermitRecord, PermitFormData, SolicitudType, Employee, ViewType, AppConfig, EmployeeExtended, LeaveRequest, LeaveStatus } from './types';
import { INITIAL_EMPLOYEES, INITIAL_REQUESTS, DEFAULT_APP_CONFIG } from './constants';
import { exportToExcel } from './services/excelExport';
import { calculateNextCorrelatives } from './utils/formatters';
import { getFLSaldoFinal } from './utils/flBalance';
import { appendAuditLog } from './utils/audit';
import { recalculateEmployeeUsage } from './utils/balanceUtils';
import { CONFIG } from './config';

import {
  Cloud, FileSpreadsheet, RefreshCw, LayoutDashboard, BookOpen, BarChart3,
  CheckCircle, AlertCircle, Moon, Sun, Undo2, Keyboard, CalendarDays, Palette, LogOut, Settings as SettingsIcon, Menu, X, Search
} from 'lucide-react';

// Loading fallback component
const ModalLoader = () => (
  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-md notification-backdrop-enter">
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl page-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
      </div>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-4 text-center">Cargando</p>
      <div className="flex justify-center gap-1.5 mt-2">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full loading-dot" />
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full loading-dot" />
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full loading-dot" />
      </div>
    </div>
  </div>
);

// View Skeleton for loading states
const ViewSkeleton = ({ view }: { view: string }) => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
  </div>
);

const getOperationalYear = (): number => new Date().getFullYear();

// ============================================================
// DEDUPLICATION HELPERS
// Normalize names for comparison and merge duplicate employees
// ============================================================
const normalizeName = (name: string): string =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

const isSamePerson = (nameA: string, nameB: string): boolean => {
  const a = normalizeName(nameA);
  const b = normalizeName(nameB);
  if (a === b) return true;
  // One name starts with the other (e.g. "MAX TAPIA" vs "MAX TAPIA MUNOZ")
  if (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a))) return true;
  const pA = a.split(' ');
  const pB = b.split(' ');
  // First name + first surname match
  if (pA.length >= 2 && pB.length >= 2 && pA[0] === pB[0] && pA[1] === pB[1]) return true;
  // All words of the shorter name appear in the longer name
  // e.g. "JORGE GUILLEN" matches "JORGE ANDRES GUILLEN ALVAREZ"
  const [shorter, longer] = pA.length <= pB.length ? [pA, pB] : [pB, pA];
  if (shorter.length >= 2 && shorter.every(w => longer.includes(w))) return true;
  return false;
};

const deduplicateEmployees = (list: EmployeeExtended[]): EmployeeExtended[] => {
  const result: EmployeeExtended[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < list.length; i++) {
    if (consumed.has(i)) continue;
    let merged = { ...list[i] };
    const nameI = `${list[i].firstName} ${list[i].lastNamePaternal} ${list[i].lastNameMaternal}`.trim();

    for (let j = i + 1; j < list.length; j++) {
      if (consumed.has(j)) continue;
      const nameJ = `${list[j].firstName} ${list[j].lastNamePaternal} ${list[j].lastNameMaternal}`.trim();

      if ((merged.rut && list[j].rut && merged.rut === list[j].rut) || isSamePerson(nameI, nameJ)) {
        consumed.add(j);
        const other = list[j];
        // Prefer the entry that has a RUT
        if (!merged.rut && other.rut) merged.rut = other.rut;
        // Prefer the longer (more complete) name
        const mergedFull = `${merged.firstName} ${merged.lastNamePaternal} ${merged.lastNameMaternal}`.trim();
        const otherFull = `${other.firstName} ${other.lastNamePaternal} ${other.lastNameMaternal}`.trim();
        if (otherFull.length > mergedFull.length) {
          merged.firstName = other.firstName;
          merged.lastNamePaternal = other.lastNamePaternal;
          merged.lastNameMaternal = other.lastNameMaternal;
          merged.avatarUrl = other.avatarUrl;
        }
        // Keep non-default field values
        if (merged.position === 'Funcionario' && other.position !== 'Funcionario') merged.position = other.position;
        if (merged.department === 'General' && other.department !== 'General') merged.department = other.department;
        if (merged.email.includes('@institucion.cl') && !other.email.includes('@institucion.cl')) merged.email = other.email;
        // Keep actual tracked usage (non-zero = real data)
        if (other.usedVacationDays > merged.usedVacationDays) {
          merged.totalVacationDays = other.totalVacationDays;
          merged.usedVacationDays = other.usedVacationDays;
        }
        if (other.usedAdminDays > merged.usedAdminDays) {
          merged.totalAdminDays = other.totalAdminDays;
          merged.usedAdminDays = other.usedAdminDays;
        }
        if (other.usedSickLeaveDays > merged.usedSickLeaveDays) {
          merged.totalSickLeaveDays = other.totalSickLeaveDays;
          merged.usedSickLeaveDays = other.usedSickLeaveDays;
        }
      }
    }
    merged.firstName = merged.firstName.toUpperCase();
    merged.lastNamePaternal = merged.lastNamePaternal.toUpperCase();
    merged.lastNameMaternal = merged.lastNameMaternal.toUpperCase();
    result.push(merged);
  }
  return result;
};

const AppContent: React.FC = () => {
  const USER_PROFILES_STORAGE_KEY = 'gdp_user_profiles';

  // Authentication & Permissions
  const { user, signOut, permissions, role, roleLabel, roleColors } = useAuth();

  // Current view state
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ============================================================
  // UNIFIED STATE - Single source of truth for employees
  // Persisted in localStorage. Derived Employee[] for decreto system.
  // ============================================================
  const [hrEmployees, setHrEmployees] = useState<EmployeeExtended[]>(() => {
    try {
      const saved = localStorage.getItem('gdp_unified_employees_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return deduplicateEmployees(parsed);
      }
    } catch { /* use defaults */ }
    return recalculateEmployeeUsage(INITIAL_EMPLOYEES, INITIAL_REQUESTS, getOperationalYear());
  });

  const [hrRequests, setHrRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('gdp_unified_requests_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* use defaults */ }
    return INITIAL_REQUESTS;
  });

  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem('gdp_unified_config_v2');
      if (saved) return { ...DEFAULT_APP_CONFIG, ...JSON.parse(saved) };
    } catch { /* use defaults */ }
    return DEFAULT_APP_CONFIG;
  });

  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Derived Employee[] (simplified format) for the decreto system
  const employees: Employee[] = useMemo(() => {
    return hrEmployees
      .map(emp => ({
        nombre: `${emp.firstName} ${emp.lastNamePaternal} ${emp.lastNameMaternal}`.trim().toUpperCase(),
        rut: emp.rut || ''
      }))
      .filter(e => e.nombre)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [hrEmployees]);

  // Google Sheets sync (import employees from cloud, merge into unified list)
  const {
    employees: sheetEmployees,
    isSyncing: isEmployeeSyncing,
    fetchEmployeesFromCloud
  } = useEmployeeSync(
    () => { },
    (error) => console.warn('Error empleados:', error)
  );

  // Merge sheet employees into unified hrEmployees (with fuzzy dedup)
  const hasMergedSheetRef = useRef(false);
  useEffect(() => {
    if (sheetEmployees.length === 0 || hasMergedSheetRef.current) return;
    hasMergedSheetRef.current = true;

    setHrEmployees(current => {
      let changed = false;

      for (const sheetEmp of sheetEmployees) {
        if (!sheetEmp.rut || !sheetEmp.nombre) continue;

        // Check if already exists by RUT
        const byRut = current.find(e => e.rut === sheetEmp.rut);
        if (byRut) continue;

        // Check if exists by fuzzy name match
        const byName = current.find(e =>
          isSamePerson(`${e.firstName} ${e.lastNamePaternal} ${e.lastNameMaternal}`.trim(), sheetEmp.nombre)
        );

        if (byName) {
          // Attach RUT to existing employee
          if (!byName.rut) {
            byName.rut = sheetEmp.rut;
            changed = true;
          }
          continue;
        }

        // Truly new employee from cloud
        const parts = sheetEmp.nombre.split(' ');
        const firstName = parts[0] || '';
        const lastNamePaternal = parts[1] || '';
        const lastNameMaternal = parts.slice(2).join(' ') || '';
        current = [...current, {
          id: crypto.randomUUID(),
          firstName,
          lastNamePaternal,
          lastNameMaternal,
          rut: sheetEmp.rut,
          email: `${firstName.toLowerCase()}.${lastNamePaternal.toLowerCase().replace(/ /g, '')}@institucion.cl`,
          emailPersonal: '',
          birthDate: '1990-01-01',
          hireDate: '2024-01-01',
          jefaturaNombre: '',
          jefaturaEmail: '',
          emergencyContact: '',
          position: 'Funcionario',
          department: 'General',
          totalVacationDays: appConfig.defaultVacationDays,
          usedVacationDays: 0,
          totalAdminDays: appConfig.defaultAdminDays,
          usedAdminDays: 0,
          totalSickLeaveDays: appConfig.defaultSickLeaveDays,
          usedSickLeaveDays: 0,
          avatarUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastNamePaternal}&background=random&color=fff`
        }];
        changed = true;
      }

      return changed ? deduplicateEmployees([...current]) : current;
    });
  }, [sheetEmployees, appConfig]);

  const [editingRecord, setEditingRecord] = useState<PermitRecord | null>(null);
  const [activeTab, setActiveTab] = useState<SolicitudType | 'ALL'>('ALL');
  const [showDashboard, setShowDashboard] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [requestedSolicitudType, setRequestedSolicitudType] = useState<SolicitudType | null>(null);

  // Centralized modal hook
  const { modals, openModal, closeModal } = useModals();

  const formRef = useRef<HTMLElement>(null);

  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { toasts, toast, removeToast } = useToast();

  const {
    records,
    setRecords,
    isSyncing,
    syncError,
    lastSync,
    isOnline,
    syncWarnings,
    pendingSync,
    isRetryScheduled,
    moduleSync,
    fetchFromCloud,
    fetchModuleFromCloud,
    syncToCloud,
    undo,
    canUndo
  } = useCloudSync(
    () => toast.success('Sincronizado', 'Datos actualizados correctamente'),
    (error) => toast.error('Error de sincronizacion', error)
  );

  const lastWarningsRef = useRef('');

  useEffect(() => {
    if (syncWarnings.length === 0) return;
    const key = syncWarnings.join('|');
    if (key === lastWarningsRef.current) return;
    lastWarningsRef.current = key;
    const preview = syncWarnings.slice(0, 3).join(' . ');
    const extra = syncWarnings.length > 3 ? ` (+${syncWarnings.length - 3} mas)` : '';
    toast.warning('Datos con formato inesperado', `${preview}${extra}`);
  }, [syncWarnings, toast]);

  // Load session token from sessionStorage
  useEffect(() => {
    const savedToken = sessionStorage.getItem('hrAppToken');
    if (savedToken) {
      setSessionToken(savedToken);
    }
  }, []);

  // Persist unified state to localStorage
  useEffect(() => {
    try { localStorage.setItem('gdp_unified_employees_v2', JSON.stringify(hrEmployees)); } catch { /* ignore */ }
  }, [hrEmployees]);

  useEffect(() => {
    try { localStorage.setItem('gdp_unified_requests_v2', JSON.stringify(hrRequests)); } catch { /* ignore */ }
  }, [hrRequests]);

  useEffect(() => {
    try { localStorage.setItem('gdp_unified_config_v2', JSON.stringify(appConfig)); } catch { /* ignore */ }
  }, [appConfig]);

  // Independent correlatives for PA and FL
  const nextCorrelatives = useMemo(() => {
    const year = new Date().getFullYear();
    return calculateNextCorrelatives(records, year);
  }, [records]);

  // Critical alert count for WelcomeBanner
  const notifications_criticalCount = useMemo(() => {
    let count = 0;
    employees.forEach(emp => {
      const paRecs = records.filter(r => r.rut === emp.rut && r.solicitudType === 'PA');
      if (paRecs.length > 0) {
        const sorted = [...paRecs].sort((a, b) => b.createdAt - a.createdAt);
        const saldo = sorted[0].diasHaber - sorted[0].cantidadDias;
        if (saldo <= 0) count++;
      }
      const flRecs = records.filter(r => r.rut === emp.rut && r.solicitudType === 'FL');
      if (flRecs.length > 0) {
        const sorted = [...flRecs].sort((a, b) => b.createdAt - a.createdAt);
        const saldoFL = getFLSaldoFinal(sorted[0], 0);
        if (saldoFL <= 0) count++;
      }
    });
    return count;
  }, [records, employees]);

  // Decretos handlers
  const handleSubmit = (formData: PermitFormData) => {
    const actor = user?.email || 'sistema';
    let updated: PermitRecord[];
    if (editingRecord) {
      updated = records.map(r =>
        r.id === editingRecord.id ? { ...formData, id: r.id, createdAt: r.createdAt } : r
      );
      setEditingRecord(null);
      toast.success('Decreto actualizado', `${formData.acto} modificado correctamente`);
      appendAuditLog({
        scope: 'decree',
        action: 'update_decree',
        actor,
        target: `${formData.solicitudType} ${formData.acto}`,
        details: `Funcionario: ${formData.funcionario}`
      });
    } else {
      updated = [...records, { ...formData, id: crypto.randomUUID(), createdAt: Date.now() }];
      toast.success('Decreto emitido', `Resolucion ${formData.acto} creada exitosamente`);
      appendAuditLog({
        scope: 'decree',
        action: 'create_decree',
        actor,
        target: `${formData.solicitudType} ${formData.acto}`,
        details: `Funcionario: ${formData.funcionario}`
      });
    }
    setRecords(updated);
    syncToCloud(updated);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    openModal('confirmDelete');
  };

  const confirmDelete = useCallback(() => {
    if (deleteTargetId) {
      const deleted = records.find(r => r.id === deleteTargetId);
      const updated = records.filter(r => r.id !== deleteTargetId);
      setRecords(updated);
      syncToCloud(updated);
      toast.warning('Decreto eliminado', 'Puedes deshacer esta accion');
      appendAuditLog({
        scope: 'decree',
        action: 'delete_decree',
        actor: user?.email || 'sistema',
        target: deleted ? `${deleted.solicitudType} ${deleted.acto}` : deleteTargetId,
        details: deleted ? `Funcionario: ${deleted.funcionario}` : 'Eliminado por ID'
      });
      setDeleteTargetId(null);
    }
  }, [deleteTargetId, records, setRecords, syncToCloud, toast, user?.email]);

  const handleUndo = () => {
    undo();
    toast.info('Accion deshecha', 'Se restauro el estado anterior');
  };

  const handleFilterByEmployee = (funcionario: string) => {
    setSearchFilter(funcionario);
    setCurrentView('decretos');
  };

  const handleViewEmployeeFromNotification = (rut: string) => {
    const match = employees.find(e => e.rut === rut);
    setSearchFilter(match?.nombre || rut);
    openModal('employeeList');
  };

  const handleQuickDecree = (employee: Employee) => {
    setCurrentView('decretos');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast.info('Nuevo decreto', `Preparando decreto para ${employee.nombre}`);
  };

  const handleExportData = useCallback(async () => {
    if (!permissions.canExportExcel) {
      toast.warning('Sin permiso', 'Tu rol no permite exportar a Excel');
      return;
    }
    const result = await exportToExcel(records);
    if (result.success) {
      toast.success('Exportado', 'Excel generado');
    } else {
      toast.error('Error', result.error || 'No se pudo exportar');
    }
  }, [permissions.canExportExcel, records, toast]);

  const handleNewDecreeFromPalette = (type?: SolicitudType) => {
    if (!permissions.canCreateDecree) {
      toast.warning('Sin permiso', 'Tu rol no permite crear decretos');
      return;
    }
    setCurrentView('decretos');
    if (type) {
      setRequestedSolicitudType(type);
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast.info('Nuevo decreto', type ? `Preparando ${type === 'PA' ? 'Permiso Administrativo' : 'Feriado Legal'}` : 'Preparando nuevo decreto');
  };

  const handleSelectRecordFromPalette = (record: PermitRecord) => {
    setCurrentView('decretos');
    setActiveTab(record.solicitudType);
    setSearchFilter(record.acto || record.funcionario);
  };

  // HR Module handlers
  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'success') toast.success('Exito', message);
    else if (type === 'error') toast.error('Error', message);
    else toast.info('Info', message);
  }, [toast]);

  // Bridge handlers: EmployeeListModal (Employee {nombre,rut}) → unified hrEmployees (EmployeeExtended)
  const handleAddEmployeeFromModal = useCallback((employee: Employee) => {
    const parts = employee.nombre.toUpperCase().split(' ');
    const firstName = parts[0] || '';
    const lastNamePaternal = parts[1] || '';
    const lastNameMaternal = parts.slice(2).join(' ') || '';
    const newEmp: EmployeeExtended = {
      id: crypto.randomUUID(),
      firstName,
      lastNamePaternal,
      lastNameMaternal,
      rut: employee.rut,
      email: `${firstName.toLowerCase()}.${lastNamePaternal.toLowerCase().replace(/ /g, '')}@institucion.cl`,
      emailPersonal: '',
      birthDate: '1990-01-01',
      hireDate: '2024-01-01',
      jefaturaNombre: '',
      jefaturaEmail: '',
      emergencyContact: '',
      position: 'Funcionario',
      department: 'General',
      totalVacationDays: appConfig.defaultVacationDays,
      usedVacationDays: 0,
      totalAdminDays: appConfig.defaultAdminDays,
      usedAdminDays: 0,
      totalSickLeaveDays: appConfig.defaultSickLeaveDays,
      usedSickLeaveDays: 0,
      avatarUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastNamePaternal}&background=random&color=fff`
    };
    setHrEmployees(curr => [...curr, newEmp]);
    addNotification('Funcionario agregado exitosamente', 'success');
  }, [appConfig, addNotification]);

  const handleUpdateEmployeeFromModal = useCallback((oldRut: string, updatedEmployee: Employee) => {
    const parts = updatedEmployee.nombre.toUpperCase().split(' ');
    const firstName = parts[0] || '';
    const lastNamePaternal = parts[1] || '';
    const lastNameMaternal = parts.slice(2).join(' ') || '';
    setHrEmployees(curr => curr.map(emp => {
      if (emp.rut === oldRut) {
        return {
          ...emp,
          firstName,
          lastNamePaternal,
          lastNameMaternal,
          rut: updatedEmployee.rut,
          avatarUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastNamePaternal}&background=random&color=fff`
        };
      }
      return emp;
    }));
    addNotification('Funcionario actualizado', 'success');
  }, [addNotification]);

  const handleDeleteEmployeeFromModal = useCallback((rut: string) => {
    const empToDelete = hrEmployees.find(e => e.rut === rut);
    if (!empToDelete) return;
    setHrEmployees(curr => curr.filter(e => e.rut !== rut));
    setHrRequests(curr => curr.filter(req => req.employeeId !== empToDelete.id));
    addNotification('Funcionario eliminado', 'info');
  }, [hrEmployees, addNotification]);

  const handleAddHrEmployee = (data: Partial<EmployeeExtended>) => {
    const newEmployee: EmployeeExtended = {
      id: crypto.randomUUID(),
      firstName: data.firstName?.toUpperCase() || '',
      lastNamePaternal: data.lastNamePaternal?.toUpperCase() || '',
      lastNameMaternal: data.lastNameMaternal?.toUpperCase() || '',
      rut: data.rut || '',
      email: data.email || '',
      emailPersonal: data.emailPersonal || '',
      position: data.position || 'Funcionario',
      department: data.department || 'General',
      birthDate: data.birthDate || '1990-01-01',
      hireDate: data.hireDate || new Date().toISOString().split('T')[0],
      jefaturaNombre: data.jefaturaNombre || '',
      jefaturaEmail: data.jefaturaEmail || '',
      emergencyContact: data.emergencyContact || '',
      totalVacationDays: appConfig.defaultVacationDays,
      usedVacationDays: 0,
      totalAdminDays: appConfig.defaultAdminDays,
      usedAdminDays: 0,
      totalSickLeaveDays: appConfig.defaultSickLeaveDays,
      usedSickLeaveDays: 0,
      avatarUrl: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastNamePaternal}&background=random&color=fff`
    };
    setHrEmployees(curr => [...curr, newEmployee]);
    addNotification('Funcionario registrado con exito', 'success');
  };

  const handleEditHrEmployee = (id: string, data: Partial<EmployeeExtended>) => {
    setHrEmployees(curr => curr.map(emp =>
      emp.id === id ? {
        ...emp,
        ...data,
        firstName: data.firstName?.toUpperCase() || emp.firstName,
        lastNamePaternal: data.lastNamePaternal?.toUpperCase() || emp.lastNamePaternal,
        lastNameMaternal: data.lastNameMaternal?.toUpperCase() || emp.lastNameMaternal,
        avatarUrl: `https://ui-avatars.com/api/?name=${data.firstName || emp.firstName}+${data.lastNamePaternal || emp.lastNamePaternal}&background=random&color=fff`
      } : emp
    ));
    addNotification('Datos del funcionario actualizados', 'success');
  };

  const handleDeleteHrEmployee = (id: string) => {
    if (window.confirm('Estas seguro de que deseas eliminar este funcionario?')) {
      setHrRequests(curr => {
        const nextRequests = curr.filter(req => req.employeeId !== id);
        setHrEmployees(currEmps => recalculateEmployeeUsage(
          currEmps.filter(emp => emp.id !== id),
          nextRequests,
          getOperationalYear()
        ));
        return nextRequests;
      });
      addNotification('Funcionario eliminado', 'info');
    }
  };

  const updateRequestStatus = (id: string, status: LeaveStatus) => {
    setHrRequests(curr => {
      const next = curr.map(req => req.id === id ? { ...req, status } : req);
      setHrEmployees(currEmps => recalculateEmployeeUsage(currEmps, next, getOperationalYear()));
      return next;
    });
    addNotification(`Solicitud ${status === LeaveStatus.APPROVED ? 'aprobada' : 'rechazada'}`, status === LeaveStatus.APPROVED ? 'success' : 'info');
  };

  const addNewRequest = (newRequestData: Omit<LeaveRequest, 'id' | 'status'>) => {
    const newRequest: LeaveRequest = {
      ...newRequestData,
      id: crypto.randomUUID(),
      status: LeaveStatus.PENDING
    };
    setHrRequests(curr => {
      const next = [newRequest, ...curr];
      setHrEmployees(currEmps => recalculateEmployeeUsage(currEmps, next, getOperationalYear()));
      return next;
    });
    addNotification('Solicitud creada correctamente', 'success');
  };

  const handleSaveConfig = (newConfig: AppConfig, applyToAll: boolean) => {
    setAppConfig(newConfig);
    if (applyToAll) {
      setHrEmployees(curr =>
        curr.map(emp => ({
          ...emp,
          totalVacationDays: newConfig.defaultVacationDays,
          totalAdminDays: newConfig.defaultAdminDays,
          totalSickLeaveDays: newConfig.defaultSickLeaveDays
        }))
      );
      addNotification('Configuracion aplicada a todos los funcionarios', 'success');
    } else {
      addNotification('Configuracion guardada', 'success');
    }
  };

  const handleImportData = (data: { employees: EmployeeExtended[], requests: LeaveRequest[], config: AppConfig }) => {
    setHrRequests(data.requests || hrRequests);
    setAppConfig(data.config || appConfig);
    setHrEmployees(recalculateEmployeeUsage(data.employees || hrEmployees, data.requests || hrRequests, getOperationalYear()));
    addNotification('Datos importados correctamente', 'success');
  };

  const handleLogout = useCallback(async () => {
    sessionStorage.removeItem('hrAppToken');
    setSessionToken(null);
    signOut();
  }, [signOut]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: 'n', ctrlKey: true, action: () => { setCurrentView('decretos'); formRef.current?.scrollIntoView({ behavior: 'smooth' }); }, description: 'Nuevo decreto' },
    { key: 's', ctrlKey: true, action: () => fetchFromCloud(), description: 'Sincronizar' },
    { key: 'e', ctrlKey: true, action: handleExportData, description: 'Exportar Excel' },
    { key: 'd', ctrlKey: true, action: toggleDarkMode, description: 'Cambiar tema' },
    { key: 'b', ctrlKey: true, action: () => openModal('decreeBook'), description: 'Libro de decretos' },
    { key: 'g', ctrlKey: true, action: () => setShowDashboard(p => !p), description: 'Ver graficos' },
    { key: 'c', ctrlKey: true, action: () => openModal('calendar'), description: 'Calendario' },
    { key: 'z', ctrlKey: true, action: handleUndo, description: 'Deshacer' },
    { key: 'k', ctrlKey: true, action: () => setCommandPaletteOpen(true), description: 'Buscar comandos' },
    { key: '?', action: () => openModal('shortcuts'), description: 'Mostrar atajos' },
  ], [fetchFromCloud, handleExportData, toggleDarkMode, openModal, handleUndo]);

  useKeyboardShortcuts(shortcuts);

  const syncStatusLabel = isSyncing
    ? 'Sincronizando...'
    : !isOnline
      ? pendingSync ? 'Pendiente (offline)' : 'Offline'
      : syncError
        ? 'Error de sincronizacion'
        : pendingSync
          ? isRetryScheduled ? 'Reintentando...' : 'Pendiente'
          : 'Sincronizado';

  const syncStatusDotClass = isSyncing
    ? 'bg-indigo-500 animate-ping'
    : pendingSync
      ? 'bg-amber-500'
      : syncError
        ? 'bg-red-500'
        : isOnline
          ? 'bg-emerald-500'
          : 'bg-red-500';

  const welcomeUserName = useMemo(() => {
    if (user?.displayName) return user.displayName;
    return user?.email;
  }, [user]);

  // Render current view content
  const renderContent = () => {
    switch (currentView) {
      case 'decretos':
        return (
          <div className="space-y-10 sm:space-y-12">
            {/* Stats */}
            <StatsCards records={records} totalDatabaseEmployees={employees.length} />

            {/* Dashboard conditional */}
            {showDashboard && (
              <Suspense fallback={<ViewSkeleton view="dashboard" />}>
                <Dashboard
                  records={records}
                  employees={employees}
                  hrEmployees={hrEmployees}
                  hrRequests={hrRequests}
                  onViewLowBalance={() => openModal('lowBalance')}
                  onNavigate={(view) => setCurrentView(view as ViewType)}
                  baseDaysPA={appConfig.defaultAdminDays}
                />
              </Suspense>
            )}

            {/* Form - Only for admins */}
            {permissions.canCreateDecree && (
              <section ref={formRef}>
                <PermitForm
                  onSubmit={handleSubmit}
                  editingRecord={editingRecord}
                  onCancelEdit={() => setEditingRecord(null)}
                  nextCorrelatives={nextCorrelatives}
                  employees={employees}
                  records={records}
                  requestedSolicitudType={requestedSolicitudType}
                  onRequestedSolicitudTypeHandled={() => setRequestedSolicitudType(null)}
                  baseDaysPA={appConfig.defaultAdminDays}
                />
              </section>
            )}

            {/* Reader message */}
            {!permissions.canCreateDecree && (
              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${roleColors.bg} ${roleColors.text}`}>
                    {roleLabel}
                  </div>
                  <p className="text-sm text-sky-700 dark:text-sky-300">
                    Tu rol es de <strong>lectura</strong>. Puedes consultar los registros y generar documentos PDF, pero no crear ni modificar decretos.
                  </p>
                </div>
              </div>
            )}

            {/* Table */}
            <section className="space-y-6 sm:space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      Registro de Decretos
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Historial Institucional
                      </span>
                      {lastSync && !isSyncing && (
                        <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-full text-[8px] font-black uppercase tracking-tighter">
                          <CheckCircle className="w-2.5 h-2.5" /> Sincronizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur p-1.5 rounded-2xl gap-1 border border-slate-200/50 dark:border-slate-700 shadow-inner w-full sm:w-auto">
                  {(['ALL', 'PA', 'FL'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-none px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black tracking-wider sm:tracking-widest transition-all duration-300 uppercase ${activeTab === tab
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                      {tab === 'ALL' ? 'Todos' : tab === 'PA' ? 'Permisos' : 'Feriados'}
                    </button>
                  ))}
                </div>
              </div>

              <PermitTable
                data={records}
                activeTab={activeTab}
                onDelete={handleDelete}
                onEdit={setEditingRecord}
                searchTerm={searchFilter}
                onSearchTermChange={setSearchFilter}
                canEdit={permissions.canEditDecree}
                canDelete={permissions.canDeleteDecree}
              />
            </section>
          </div>
        );

      case 'dashboard':
        return (
          <Suspense fallback={<ViewSkeleton view="dashboard" />}>
            <Dashboard
              records={records}
              employees={employees}
              hrEmployees={hrEmployees}
              hrRequests={hrRequests}
              onViewLowBalance={() => openModal('lowBalance')}
              onNavigate={(view) => setCurrentView(view as ViewType)}
              baseDaysPA={appConfig.defaultAdminDays}
            />
          </Suspense>
        );

      case 'calendar':
        return (
          <Suspense fallback={<ViewSkeleton view="calendar" />}>
            <CalendarView
              isOpen={true}
              onClose={() => setCurrentView('decretos')}
              records={records}
            />
          </Suspense>
        );

      case 'employees':
        return (
          <Suspense fallback={<ViewSkeleton view="employees" />}>
            <EmployeeList
              employees={hrEmployees}
              onAddEmployee={handleAddHrEmployee}
              onEditEmployee={handleEditHrEmployee}
              onDeleteEmployee={handleDeleteHrEmployee}
              onViewProfile={() => { }}
            />
          </Suspense>
        );

      case 'requests':
        return (
          <Suspense fallback={<ViewSkeleton view="requests" />}>
            <LeaveRequests
              requests={hrRequests}
              employees={hrEmployees}
              updateRequestStatus={updateRequestStatus}
              addNewRequest={addNewRequest}
              onError={(msg) => addNotification(msg, 'error')}
            />
          </Suspense>
        );

      case 'reports':
        return (
          <Suspense fallback={<ViewSkeleton view="reports" />}>
            <Reports
              employees={hrEmployees}
              requests={hrRequests}
              config={appConfig}
            />
          </Suspense>
        );

      case 'settings':
        return (
          <Suspense fallback={<ViewSkeleton view="settings" />}>
            <Settings
              config={appConfig}
              employees={hrEmployees}
              requests={hrRequests}
              onSave={handleSaveConfig}
              onImport={handleImportData}
            />
            {role === 'admin' && (
              <div className="max-w-5xl mx-auto mt-8 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <SettingsIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">Panel de Administración</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Gestión de usuarios y roles</p>
                    </div>
                  </div>
                  <AdminPanel isOpen={true} onClose={() => { }} mode="inline" />
                </div>
              </div>
            )}
          </Suspense>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          currentView={currentView}
          setView={(view) => {
            setCurrentView(view);
            setMobileMenuOpen(false);
          }}
          onLogout={handleLogout}
          isSyncing={isSyncing}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Premium Glassmorphism Interface */}
        <header className="sticky top-0 z-[100] w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl transition-all duration-300">
          <div className="px-4 sm:px-8 h-20 flex items-center justify-between gap-4">

            {/* Left Side: Mobile Toggle & Context */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="hidden lg:flex flex-col">
                <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {currentView === 'decretos' ? 'Gestión de Decretos' :
                    currentView === 'dashboard' ? 'Panel de Control' :
                      currentView === 'employees' ? 'Nómina de Funcionarios' : 'Sistema GDP Cloud'}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${syncStatusDotClass}`} />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{syncStatusLabel}</span>
                </div>
              </div>
            </div>

            {/* Right Side: Action Matrix & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Utility Actions Group */}
              <div className="hidden md:flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 gap-1">
                {/* Sync */}
                <button
                  onClick={() => fetchFromCloud()}
                  disabled={isSyncing}
                  className={`p-2 rounded-xl transition-all active:scale-90 ${isSyncing
                    ? 'text-slate-300 dark:text-slate-600'
                    : syncError
                      ? 'text-red-500 hover:bg-red-100/50'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 shadow-sm'
                    }`}
                  title="Sincronizar datos"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>

                {/* Search / Palette Trigger (Visual only for now) */}
                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
                  title="Comandos (Cmd+K)"
                >
                  <Keyboard className="w-4 h-4" />
                </button>

                {/* Export */}
                <button
                  onClick={handleExportData}
                  className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 transition-all"
                  title="Exportar a Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>

                {/* Dark Mode */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700 transition-all font-bold"
                  title={isDark ? 'Modo claro' : 'Modo oscuro'}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              {/* Notification Center Integrated */}
              <NotificationCenter
                records={records}
                employees={employees}
                onViewEmployee={handleViewEmployeeFromNotification}
              />

              {/* User Profile Capsule */}
              <div className="flex items-center gap-3 pl-3 ml-1 border-l border-slate-200 dark:border-slate-700">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-black text-slate-800 dark:text-white leading-none">
                    {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 px-1.5 py-0.5 rounded ${roleColors.bg} ${roleColors.text}`}>
                    {roleLabel}
                  </span>
                </div>
                <div className="relative group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer overflow-hidden">
                    <img
                      src={`https://ui-avatars.com/api/?name=${user?.email}&background=fff&color=4F46E5&bold=true`}
                      alt="Profile"
                      className="w-full h-full rounded-[14px] bg-white object-cover"
                    />
                  </div>
                  {/* Mini Status Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>

                {/* Logout Trigger (Minimalist) */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all md:ml-2"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Progress/Status Line */}
          {isSyncing && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-50 dark:bg-indigo-900/30 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-transparent via-indigo-600 to-transparent bg-[length:200%_100%] animate-sync-progress" />
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto page-fade-in">
            {/* Welcome Banner - Only on Decretos view */}
            {currentView === 'decretos' && (
              <div className="mb-8">
                <WelcomeBanner
                  userName={welcomeUserName}
                  totalRecords={records.length}
                  totalEmployees={employees.length}
                  criticalAlerts={notifications_criticalCount}
                  onClickDecrees={() => { }}
                  onClickEmployees={() => openModal('employeeList')}
                  onClickUrgent={() => openModal('lowBalance')}
                />

                {/* --- Global Action Search Bar --- */}
                <div className="relative mt-6 max-w-2xl mx-auto">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-indigo-400 dark:text-indigo-300" />
                  </div>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Consultar estado de funcionario o buscar decreto..."
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[20px] py-4 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-xl shadow-indigo-500/5"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="hidden sm:block text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">Cmd + K</span>
                  </div>
                </div>
              </div>
            )}

            {renderContent()}
          </div>
        </main>

        {/* Footer - Only on Decretos view */}
        {currentView === 'decretos' && (
          <footer className="px-4 sm:px-6 py-6 border-t border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 hover:opacity-100 transition-all">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-indigo-600" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">
                  GDP Cloud Engine 2026
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => openModal('shortcuts')}
                  className="hidden sm:flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                >
                  <Keyboard className="w-3 h-3" /> Atajos
                </button>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] text-center">
                  Desarrollado por Maximiliano Guzman
                </p>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Modals */}
      {modals.employeeList && (
        <Suspense fallback={<ModalLoader />}>
          <EmployeeListModal
            isOpen={modals.employeeList}
            onClose={() => closeModal('employeeList')}
            employees={employees}
            records={records}
            onAddEmployee={permissions.canManageEmployees ? handleAddEmployeeFromModal : undefined}
            onUpdateEmployee={permissions.canManageEmployees ? handleUpdateEmployeeFromModal : undefined}
            onDeleteEmployee={permissions.canManageEmployees ? handleDeleteEmployeeFromModal : undefined}
            onFilterByEmployee={handleFilterByEmployee}
            onQuickDecree={permissions.canCreateDecree ? handleQuickDecree : undefined}
          />
        </Suspense>
      )}

      {modals.lowBalance && (
        <Suspense fallback={<ModalLoader />}>
          <LowBalanceModal
            isOpen={modals.lowBalance}
            onClose={() => closeModal('lowBalance')}
            records={records}
          />
        </Suspense>
      )}

      {modals.decreeBook && (
        <Suspense fallback={<ModalLoader />}>
          <DecreeBookModal
            isOpen={modals.decreeBook}
            onClose={() => closeModal('decreeBook')}
            records={records}
          />
        </Suspense>
      )}

      <ShortcutsHelpModal
        isOpen={modals.shortcuts}
        onClose={() => closeModal('shortcuts')}
        shortcuts={shortcuts}
      />

      {modals.calendar && (
        <Suspense fallback={<ModalLoader />}>
          <CalendarView
            isOpen={modals.calendar}
            onClose={() => closeModal('calendar')}
            records={records}
          />
        </Suspense>
      )}

      <ConfirmModal
        isOpen={modals.confirmDelete}
        onClose={() => {
          closeModal('confirmDelete');
          setDeleteTargetId(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar decreto"
        message="Estas seguro de que deseas eliminar este decreto? Esta accion se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />



      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        records={records}
        employees={employees}
        onNavigate={(view) => {
          if (view === 'dashboard') setCurrentView('dashboard');
          else if (view === 'calendar') setCurrentView('calendar');
          else if (view === 'employees') setCurrentView('employees');
          else if (view === 'settings') setCurrentView('settings');
        }}
        onNewDecree={handleNewDecreeFromPalette}
        onSelectEmployee={(employee) => handleFilterByEmployee(employee.nombre)}
        onSelectRecord={handleSelectRecordFromPalette}
        onExportData={handleExportData}
      />

      {modals.themeSelector && (
        <Suspense fallback={<ModalLoader />}>
          <ThemeSelector
            isOpen={modals.themeSelector}
            onClose={() => closeModal('themeSelector')}
          />
        </Suspense>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Scroll to Top */}
      <ScrollToTop />
    </div>
  );
};

// Authentication wrapper
const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center page-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl">
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-4">Verificando sesion</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AppContent />;
};

// Main App with providers
const App: React.FC = () => (
  <ThemeProvider>
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  </ThemeProvider>
);

export default App;
