
import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'app-correo-cft'
    });
}

const db = admin.firestore();

async function cleanupDuplicates() {
    const snapshot = await db.collection('employees').get();
    const rutMap = {};

    snapshot.forEach(doc => {
        const data = doc.data();
        const rut = data.rut;
        if (rut) {
            if (!rutMap[rut]) {
                rutMap[rut] = [];
            }
            rutMap[rut].push({ docId: doc.id, ...data });
        }
    });

    let totalDeleted = 0;
    const batch = db.batch();

    for (const rut in rutMap) {
        const docs = rutMap[rut];
        if (docs.length > 1) {
            console.log(`Found ${docs.length} docs for RUT ${rut}`);

            // Sort docs to pick the best one to keep
            // Criteria: 
            // 1. Prefer doc where email contains 'cftestatal'
            // 2. Prefer doc where id does not start with 'import-'
            // 3. Prefer doc with more fields filled

            docs.sort((a, b) => {
                const aIsGood = a.email && a.email.includes('cftestatal');
                const bIsGood = b.email && b.email.includes('cftestatal');
                if (aIsGood && !bIsGood) return -1;
                if (!aIsGood && bIsGood) return 1;

                const aIsImport = a.id && a.id.startsWith('import-');
                const bIsImport = b.id && b.id.startsWith('import-');
                if (!aIsImport && bIsImport) return -1;
                if (aIsImport && !bIsImport) return 1;

                return Object.keys(b).length - Object.keys(a).length;
            });

            const toKeep = docs[0];
            const toDelete = docs.slice(1);

            console.log(`  Keeping: ${toKeep.docId} (${toKeep.email})`);
            for (const doc of toDelete) {
                console.log(`  Deleting: ${doc.docId} (${doc.email})`);
                batch.delete(db.collection('employees').doc(doc.docId));
                totalDeleted++;
            }
        }
    }

    if (totalDeleted > 0) {
        await batch.commit();
        console.log(`Successfully deleted ${totalDeleted} duplicate documents.`);
    } else {
        console.log("No duplicates found to delete.");
    }
}

cleanupDuplicates().catch(console.error);
