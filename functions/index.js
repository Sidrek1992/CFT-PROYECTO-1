import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import logger from "firebase-functions/logger";
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Configuración global de la función
setGlobalOptions({
    maxInstances: 10,
    region: 'us-central1' // Ajusta según tu preferencia
});

const app = express();

// Configuración básica del asistente Gemini
const GEMINI_MODEL = 'gemini-3-flash-preview';
const AI_TIMEOUT_MS = 30_000;
const AI_MAX_EMPLOYEES = 300;
const AI_MAX_REQUESTS = 1000;

// Middleware de CORS
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware de autenticación con Firebase
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Autorización requerida.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        logger.error("Auth Error:", error);
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

// --- Helpers de Sanitización (Portados del servidor original) ---
const sanitizeText = (value, maxLength = 120) => {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeEmployees = (employees) => {
    if (!Array.isArray(employees)) return [];
    return employees.slice(0, AI_MAX_EMPLOYEES).map((e) => ({
        id: sanitizeText(e.id, 64),
        firstName: sanitizeText(e.firstName),
        lastName: sanitizeText(e.lastName),
        department: sanitizeText(e.department),
        position: sanitizeText(e.position),
        totalVacationDays: toFiniteNumber(e.totalVacationDays),
        usedVacationDays: toFiniteNumber(e.usedVacationDays),
        totalAdminDays: toFiniteNumber(e.totalAdminDays),
        usedAdminDays: toFiniteNumber(e.usedAdminDays),
        totalSickLeaveDays: toFiniteNumber(e.totalSickLeaveDays),
        usedSickLeaveDays: toFiniteNumber(e.usedSickLeaveDays),
    }));
};

const sanitizeRequests = (requests) => {
    if (!Array.isArray(requests)) return [];
    return requests.slice(0, AI_MAX_REQUESTS).map((r) => ({
        id: sanitizeText(r.id, 64),
        employeeId: sanitizeText(r.employeeId, 64),
        type: sanitizeText(r.type),
        status: sanitizeText(r.status),
        startDate: sanitizeText(r.startDate, 10),
        endDate: sanitizeText(r.endDate, 10),
        reason: sanitizeText(r.reason, 240),
    }));
};

const buildAssistantPrompt = ({ question, employees, requests }) => {
    const contextData = {
        meta: {
            today: new Date().toISOString(),
            employeesCount: employees.length,
            requestsCount: requests.length
        },
        employees: employees.map(e => ({
            name: `${e.firstName} ${e.lastName}`.trim(),
            department: e.department,
            position: e.position,
            vacationBalance: e.totalVacationDays - e.usedVacationDays,
            adminDaysBalance: e.totalAdminDays - e.usedAdminDays,
        })),
        requests: requests.map(r => {
            const emp = employees.find(i => i.id === r.employeeId);
            return {
                employee: emp ? `${emp.firstName} ${emp.lastName}` : 'Desconocido',
                type: r.type,
                status: r.status,
                dates: `${r.startDate} al ${r.endDate}`,
                reason: r.reason
            };
        })
    };

    return `
    Eres un asistente experto de RRHH para una institución educativa.
    
    Contexto JSON:
    ${JSON.stringify(contextData)}
    
    Reglas:
    - Responde solo con base en los datos proporcionados.
    - Si faltan datos, indícalo claramente.
    - Sé profesional y conciso.
    - Responde en español.
    
    Pregunta: ${question}
  `;
};

// --- Endpoints ---

app.get('/health', (req, res) => {
    res.json({ ok: true, source: 'Firebase Functions' });
});

app.post('/ai/ask', authenticate, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || admin.remoteConfig?.(); // Try to get it from somewhere

    if (!apiKey) {
        return res.status(503).json({ error: 'Configuración de IA no disponible en el servidor.' });
    }

    const { question, employees: inputEmployees, requests: inputRequests } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Debes enviar una pregunta.' });
    }

    const employees = sanitizeEmployees(inputEmployees);
    const requests = sanitizeRequests(inputRequests);

    try {
        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = buildAssistantPrompt({ question, employees, requests });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ answer: text });
    } catch (error) {
        logger.error("Gemini Error:", error);
        res.status(500).json({ error: 'Error al procesar la consulta con IA.' });
    }
});

// Exportar como función de Firebase
export const api = onRequest(app);
