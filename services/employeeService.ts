import { db } from '../lib/firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    setDoc,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import { EmployeeExtended } from '../types';

const COLLECTION_NAME = 'employees';

export const employeeService = {
    /**
     * Obtiene todos los empleados de Firestore
     */
    async getAll(): Promise<EmployeeExtended[]> {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as EmployeeExtended));
    },

    /**
     * Suscribirse a cambios en tiempo real
     */
    subscribeAll(callback: (employees: EmployeeExtended[]) => void, onError?: (error: Error) => void) {
        return onSnapshot(
            collection(db, COLLECTION_NAME),
            (snapshot) => {
                const employees = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                } as EmployeeExtended));
                callback(employees);
            },
            (error) => {
                console.error('Error en subscripción de empleados:', error);
                onError?.(error);
            }
        );
    },

    /**
     * Añade un nuevo empleado
     */
    async add(employee: Omit<EmployeeExtended, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), employee);
        return docRef.id;
    },

    /**
     * Sincroniza un empleado con un ID específico (preservando el ID si viene de otra fuente)
     */
    async upsert(employee: EmployeeExtended): Promise<void> {
        const { id, ...data } = employee;
        await setDoc(doc(db, COLLECTION_NAME, id), data);
    },

    /**
     * Actualiza un empleado existente
     */
    async update(id: string, data: Partial<EmployeeExtended>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    },

    /**
     * Elimina un empleado
     */
    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    },

    /**
     * Sincroniza múltiples empleados usando lotes (batches)
     */
    async batchUpsert(employees: EmployeeExtended[]): Promise<void> {
        const BATCH_SIZE = 500;
        for (let i = 0; i < employees.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const chunk = employees.slice(i, i + BATCH_SIZE);
            chunk.forEach(emp => {
                const { id, ...data } = emp;
                const docRef = doc(db, COLLECTION_NAME, id);
                batch.set(docRef, data);
            });
            await batch.commit();
        }
    }
};
