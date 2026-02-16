import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Configuración global de la función
setGlobalOptions({
    maxInstances: 10,
    region: 'us-central1'
});

const app = express();

// Middleware de CORS
app.use(cors({ origin: true }));
app.use(express.json());

// --- Endpoints ---

app.get('/health', (req, res) => {
    res.json({ ok: true, source: 'Firebase Functions' });
});

// Exportar como función de Firebase
export const api = onRequest(app);
