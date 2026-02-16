import { db } from '../lib/firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    setDoc
} from 'firebase/firestore';
import { LeaveRequest } from '../types';

const COLLECTION_NAME = 'leaveRequests';

export const leaveRequestService = {
    /**
     * Obtiene todas las solicitudes de Firestore
     */
    async getAll(): Promise<LeaveRequest[]> {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as LeaveRequest));
    },

    /**
     * Suscribirse a cambios en tiempo real
     */
    subscribeAll(callback: (requests: LeaveRequest[]) => void) {
        return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as LeaveRequest));
            callback(requests);
        });
    },

    /**
     * Añade una nueva solicitud
     */
    async add(request: Omit<LeaveRequest, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), request);
        return docRef.id;
    },

    /**
     * Actualiza una solicitud existente
     */
    async update(id: string, data: Partial<LeaveRequest>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    },

    /**
     * Sincroniza una solicitud con un ID específico
     */
    async upsert(request: LeaveRequest): Promise<void> {
        const { id, ...data } = request;
        await setDoc(doc(db, COLLECTION_NAME, id), data);
    },

    /**
     * Elimina una solicitud
     */
    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    }
};
