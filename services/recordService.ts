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
import { PermitRecord } from '../types';

const COLLECTION_NAME = 'records';

export const recordService = {
    /**
     * Obtiene todos los registros de decretos de Firestore
     */
    async getAll(): Promise<PermitRecord[]> {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as PermitRecord));
    },

    /**
     * Suscribirse a cambios en tiempo real
     */
    subscribeAll(callback: (records: PermitRecord[]) => void) {
        return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
            const records = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as PermitRecord));
            callback(records);
        });
    },

    /**
     * Añade un nuevo record
     */
    async add(record: Omit<PermitRecord, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), record);
        return docRef.id;
    },

    /**
     * Actualiza un record existente
     */
    async update(id: string, data: Partial<PermitRecord>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    },

    /**
     * Sincroniza un record con un ID específico
     */
    async upsert(record: PermitRecord): Promise<void> {
        const { id, ...data } = record;
        await setDoc(doc(db, COLLECTION_NAME, id), data);
    },

    /**
     * Elimina un record
     */
    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    }
};
