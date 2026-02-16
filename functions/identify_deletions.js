
import fs from 'fs';

const filePath = "/Users/maximilianoguzman/.gemini/antigravity/brain/9732280b-ea93-4abd-9d67-bba998bf11c2/.system_generated/steps/51/output.txt";
const content = fs.readFileSync(filePath, 'utf8');

// Simple parser for the YAML-like output
const docs = [];
let currentDoc = null;

content.split('\n').forEach(line => {
    if (line.startsWith('- __path__:')) {
        if (currentDoc) docs.push(currentDoc);
        currentDoc = { '__path__': line.replace('- __path__:', '').trim() };
    } else if (line.startsWith('  ') && currentDoc) {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            currentDoc[key] = value;
        }
    }
});
if (currentDoc) docs.push(currentDoc);

const rutMap = {};
docs.forEach(doc => {
    const rut = doc.rut;
    if (rut) {
        if (!rutMap[rut]) rutMap[rut] = [];
        rutMap[rut].push(doc);
    }
});

const toDelete = new Set();
for (const rut in rutMap) {
    const group = rutMap[rut];
    if (group.length > 1) {
        group.sort((a, b) => {
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

        const best = group[0];
        group.slice(1).forEach(other => toDelete.add(other['__path__']));
    }
}

// Also delete any remaining import- ones
docs.forEach(doc => {
    if (doc.id && doc.id.startsWith('import-')) {
        toDelete.add(doc['__path__']);
    }
});

console.log(Array.from(toDelete).join('\n'));
