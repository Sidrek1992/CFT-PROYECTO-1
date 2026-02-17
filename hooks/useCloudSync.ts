import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PermitRecord } from '../types';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';
import {
  parsePARecords,
  parseFLRecords,
} from '../utils/parsers';
import { localBackup } from '../services/localBackup';
import { compareRecordsByDateDesc } from '../utils/recordDates';
import { recordService } from '../services/recordService';

const syncLogger = logger.create('CloudSync');

interface UseCloudSyncReturn {
  records: PermitRecord[];
  setRecords: React.Dispatch<React.SetStateAction<PermitRecord[]>>;
  isSyncing: boolean;
  syncError: boolean;
  lastSync: Date | null;
  fetchFromSheets: () => Promise<PermitRecord[] | null>;
  syncToFirestore: (data: PermitRecord[]) => Promise<void>;
  addRecord: (record: Omit<PermitRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateRecord: (id: string, data: Partial<PermitRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  undo: () => void;
  canUndo: boolean;
  fullSyncFromSheets: () => Promise<boolean>;
}

export const useCloudSync = (
  onSyncSuccess?: () => void,
  onSyncError?: (error: string) => void
): UseCloudSyncReturn => {
  const [records, setRecords] = useState<PermitRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [undoStack, setUndoStack] = useState<PermitRecord[][]>([]);

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
    setIsSyncing(true);
    const unsubscribe = recordService.subscribeAll((data) => {
      setRecords(data.sort((a, b) => compareRecordsByDateDesc(a, b)));
      setIsSyncing(false);
      setLastSync(new Date());
      onSyncSuccessRef.current?.();
    });

    return () => unsubscribe();
  }, []); // Sin dependencias - solo se suscribe una vez

  // 2. Importar desde Google Sheets
  const fetchFromSheets = useCallback(async (): Promise<PermitRecord[] | null> => {
    if (!navigator.onLine) {
      onSyncErrorRef.current?.('Sin conexión a internet');
      return null;
    }

    setIsSyncing(true);
    try {
      syncLogger.info('Importando registros desde Google Sheets...');
      const [paResponse, flResponse] = await Promise.all([
        fetch(`${CONFIG.WEB_APP_URL}?sheetId=${CONFIG.DECRETOS_SHEET_ID}`),
        fetch(`${CONFIG.WEB_APP_URL_FL}?sheetId=${CONFIG.FERIADOS_SHEET_ID}`)
      ]);

      const paResult = await paResponse.json();
      const flResult = await flResponse.json();

      let allImported: PermitRecord[] = [];

      if (paResult.success && paResult.data) {
        const { records: paRecords } = parsePARecords(paResult.data);
        allImported = [...allImported, ...paRecords];
      }
      if (flResult.success && flResult.data) {
        const { records: flRecords } = parseFLRecords(flResult.data);
        allImported = [...allImported, ...flRecords];
      }

      return allImported;
    } catch (e) {
      syncLogger.error("Error al importar desde Sheets:", e);
      onSyncErrorRef.current?.("Error al conectar con Google Sheets");
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []); // Sin dependencias - usa refs para callbacks

  // 3. Acciones de Firestore
  const syncToFirestore = useCallback(async (data: PermitRecord[]) => {
    await recordService.batchUpsert(data);
  }, []);

  const addRecord = useCallback(async (data: Omit<PermitRecord, 'id' | 'createdAt'>) => {
    const newRecord = {
      ...data,
      createdAt: Date.now()
    };
    await recordService.add(newRecord);
  }, []);

  const updateRecord = useCallback(async (id: string, data: Partial<PermitRecord>) => {
    await recordService.update(id, data);
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    await recordService.delete(id);
  }, []);

  // Undo logic
  const pushToUndoStack = useCallback((currentRecords: PermitRecord[]) => {
    setUndoStack(prev => [...prev.slice(-9), currentRecords]);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    syncLogger.warn('Deshacer en Firestore requiere revertir documentos específicos.');
  }, [undoStack]);

  const setRecordsWithUndo: React.Dispatch<React.SetStateAction<PermitRecord[]>> = useCallback(
    (action) => {
      setRecords(prev => {
        pushToUndoStack(prev);
        return typeof action === 'function' ? action(prev) : action;
      });
    },
    [pushToUndoStack]
  );

  const fullSyncFromSheets = useCallback(async () => {
    const data = await fetchFromSheets();
    if (data && data.length > 0) {
      await syncToFirestore(data);
      return true;
    }
    return false;
  }, [fetchFromSheets, syncToFirestore]);

  return {
    records,
    setRecords: setRecordsWithUndo,
    isSyncing,
    syncError,
    lastSync,
    fetchFromSheets,
    syncToFirestore,
    addRecord,
    updateRecord,
    deleteRecord,
    undo,
    canUndo: undoStack.length > 0,
    fullSyncFromSheets
  };
};
