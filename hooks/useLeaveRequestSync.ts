import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LeaveRequest } from '../types';
import { leaveRequestService } from '../services/leaveRequestService';

export const useLeaveRequestSync = (
    onSyncSuccess?: () => void,
    onSyncError?: (error: string) => void
) => {
    const [hrRequests, setHrRequests] = useState<LeaveRequest[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // Usar refs para los callbacks para evitar re-suscripciones infinitas
    const onSyncSuccessRef = useRef(onSyncSuccess);
    const onSyncErrorRef = useRef(onSyncError);
    
    // Mantener refs actualizadas
    useEffect(() => {
        onSyncSuccessRef.current = onSyncSuccess;
        onSyncErrorRef.current = onSyncError;
    }, [onSyncSuccess, onSyncError]);

    useEffect(() => {
        setIsSyncing(true);
        const unsubscribe = leaveRequestService.subscribeAll((data) => {
            setHrRequests(data.sort((a, b) => b.startDate.localeCompare(a.startDate)));
            setIsSyncing(false);
            onSyncSuccessRef.current?.();
        });

        return () => unsubscribe();
    }, []); // Sin dependencias - solo se suscribe una vez

    const addHrRequest = useCallback(async (data: Omit<LeaveRequest, 'id'>) => {
        await leaveRequestService.add(data);
    }, []);

    const updateHrRequest = useCallback(async (id: string, data: Partial<LeaveRequest>) => {
        await leaveRequestService.update(id, data);
    }, []);

    const deleteHrRequest = useCallback(async (id: string) => {
        await leaveRequestService.delete(id);
    }, []);

    return {
        hrRequests,
        setHrRequests,
        isSyncing,
        addHrRequest,
        updateHrRequest,
        deleteHrRequest
    };
};
