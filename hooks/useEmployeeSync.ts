import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Employee, EmployeeExtended } from '../types';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';
import { localBackup } from '../services/localBackup';
import { employeeService } from '../services/employeeService';

const employeeLogger = logger.create('EmployeeSync');

interface UseEmployeeSyncReturn {
    employees: Employee[];
    hrEmployees: EmployeeExtended[];
    setHrEmployees: React.Dispatch<React.SetStateAction<EmployeeExtended[]>>;
    isSyncing: boolean;
    syncError: boolean;
    lastSync: Date | null;
    fetchEmployeesFromCloud: () => Promise<EmployeeExtended[] | null>;
    syncEmployeesToFirestore: (data: EmployeeExtended[]) => Promise<void>;
    addEmployee: (employee: Partial<EmployeeExtended>) => Promise<void>;
    updateEmployee: (id: string, updatedEmployee: Partial<EmployeeExtended>) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
    fullSyncFromSheets: () => Promise<boolean>;
}

export const useEmployeeSync = (
    onSyncSuccess?: () => void,
    onSyncError?: (error: string) => void
): UseEmployeeSyncReturn => {
    const [hrEmployees, setHrEmployees] = useState<EmployeeExtended[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    
    // Usar refs para los callbacks para evitar re-suscripciones infinitas
    const onSyncSuccessRef = useRef(onSyncSuccess);
    const onSyncErrorRef = useRef(onSyncError);
    
    // Mantener refs actualizadas
    useEffect(() => {
        onSyncSuccessRef.current = onSyncSuccess;
        onSyncErrorRef.current = onSyncError;
    }, [onSyncSuccess, onSyncError]);

    // 1. Suscribirse a Firestore en tiempo real
    useEffect(() => {
        let isSubscribed = true;
        setIsSyncing(true);
        setSyncError(false);

        const timeoutId = setTimeout(() => {
            if (isSubscribed) {
                console.warn('Timeout de sincronización alcanzado');
                setIsSyncing(false);
                setSyncError(true);
                onSyncErrorRef.current?.('Tiempo de espera agotado. Verifica tu conexión.');
            }
        }, 15000);

        const unsubscribe = employeeService.subscribeAll(
            (data) => {
                if (!isSubscribed) return;
                clearTimeout(timeoutId);
                try {
                    const sortedData = data.sort((a, b) => {
                        const nameA = (a.firstName || '').toUpperCase();
                        const nameB = (b.firstName || '').toUpperCase();
                        return nameA.localeCompare(nameB);
                    });
                    setHrEmployees(sortedData);
                    setIsSyncing(false);
                    setLastSync(new Date());
                    onSyncSuccessRef.current?.();
                } catch (err) {
                    console.error('Error procesando empleados:', err);
                    setIsSyncing(false);
                    setSyncError(true);
                    onSyncErrorRef.current?.('Error al procesar datos de empleados');
                }
            },
            (error) => {
                if (!isSubscribed) return;
                clearTimeout(timeoutId);
                console.error('Error en sincronización:', error);
                setIsSyncing(false);
                setSyncError(true);
                onSyncErrorRef.current?.('Error de conexión con la base de datos');
            }
        );

        return () => {
            isSubscribed = false;
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, []); // Sin dependencias - solo se suscribe una vez

    // Derived simple employees for decretos list
    const employees: Employee[] = React.useMemo(() => {
        return hrEmployees.map(emp => ({
            nombre: `${emp.firstName} ${emp.lastNamePaternal} ${emp.lastNameMaternal}`.trim().toUpperCase(),
            rut: emp.rut || ''
        }));
    }, [hrEmployees]);

    // 2. Fetch desde Google Sheets (ahora como IMPORTACION)
    const fetchEmployeesFromCloud = useCallback(async (): Promise<EmployeeExtended[] | null> => {
        if (!navigator.onLine) {
            onSyncErrorRef.current?.('Sin conexión a internet para importar');
            return null;
        }

        setIsSyncing(true);
        try {
            employeeLogger.info('Importando empleados desde Google Sheets...');
            const response = await fetch(
                `${CONFIG.WEB_APP_URL}?sheetId=${CONFIG.EMPLOYEES_SHEET_ID}&type=employees`
            );
            const result = await response.json();

            if (result.success && result.data) {
                const cloudEmployees: EmployeeExtended[] = result.data
                    .filter((row: any[]) => row && row[1])
                    .map((row: any[], index: number) => {
                        const nombres = String(row[1] || '').trim();
                        const primerApellido = String(row[2] || '').trim();
                        const segundoApellido = String(row[3] || '').trim();
                        const rut = String(row[4] || '').trim();

                        return {
                            id: `import-${Date.now()}-${index}`,
                            firstName: nombres.toUpperCase(),
                            lastNamePaternal: primerApellido.toUpperCase(),
                            lastNameMaternal: segundoApellido.toUpperCase(),
                            rut: rut,
                            email: `${nombres.toLowerCase().split(' ')[0]}.${primerApellido.toLowerCase().replace(/ /g, '')}@institucion.cl`,
                            emailPersonal: '',
                            birthDate: '1990-01-01',
                            hireDate: '2024-01-01',
                            jefaturaNombre: 'Dirección General',
                            jefaturaEmail: 'direccion@institucion.cl',
                            emergencyContact: 'Familiar Directo',
                            position: 'Funcionario',
                            department: 'General',
                            totalVacationDays: 15,
                            usedVacationDays: 0,
                            totalAdminDays: 6,
                            usedAdminDays: 0,
                            totalSickLeaveDays: 30,
                            usedSickLeaveDays: 0,
                            avatarUrl: `https://ui-avatars.com/api/?name=${nombres}+${primerApellido}&background=random&color=fff`
                        } as EmployeeExtended;
                    });

                return cloudEmployees;
            }
            return null;
        } catch (e) {
            employeeLogger.error("Error al importar desde Sheets:", e);
            onSyncErrorRef.current?.("Error al conectar con Google Sheets");
            return null;
        } finally {
            setIsSyncing(false);
        }
    }, []); // Sin dependencias - usa refs para callbacks

    // 3. Acciones de Firestore
    const syncEmployeesToFirestore = useCallback(async (data: EmployeeExtended[]) => {
        await employeeService.batchUpsert(data);
    }, []);

    const addEmployee = useCallback(async (data: Partial<EmployeeExtended>) => {
        await employeeService.add(data as any);
    }, []);

    const updateEmployee = useCallback(async (id: string, data: Partial<EmployeeExtended>) => {
        await employeeService.update(id, data);
    }, []);

    const deleteEmployee = useCallback(async (id: string) => {
        await employeeService.delete(id);
    }, []);

    const fullSyncFromSheets = useCallback(async () => {
        const data = await fetchEmployeesFromCloud();
        if (data && data.length > 0) {
            await syncEmployeesToFirestore(data);
            return true;
        }
        return false;
    }, [fetchEmployeesFromCloud, syncEmployeesToFirestore]);

    return {
        employees,
        hrEmployees,
        setHrEmployees,
        isSyncing,
        syncError,
        lastSync,
        fetchEmployeesFromCloud,
        syncEmployeesToFirestore,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        fullSyncFromSheets
    };
};
