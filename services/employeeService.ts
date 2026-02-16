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
    onSnapshot
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
    subscribeAll(callback: (employees: EmployeeExtended[]) => void) {
        return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
            const employees = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as EmployeeExtended));
            callback(employees);
        });
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
    }
};
