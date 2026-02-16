
import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'app-correo-cft'
    });
}

const db = admin.firestore();

async function findDuplicates() {
    const snapshot = await db.collection('employees').get();
    const rutMap = {};
    const duplicates = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        const rut = data.rut;
        if (rut) {
            if (!rutMap[rut]) {
                rutMap[rut] = [];
            }
            rutMap[rut].push({ id: doc.id, ...data });
        }
    });

    for (const rut in rutMap) {
        if (rutMap[rut].length > 1) {
            duplicates.push({
                rut,
                count: rutMap[rut].length,
                docs: rutMap[rut]
            });
        }
    }

    console.log(JSON.stringify(duplicates, null, 2));
}

findDuplicates().catch(console.error);
