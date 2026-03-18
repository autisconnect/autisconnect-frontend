import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import abaSessionController from '../controllers/abaSessionController';
import abaAiController from '../controllers/abaAiController';
import abaProgramController from '../controllers/abaProgramController';
import abaReportController from '../controllers/abaReportController';

const router = express.Router();

/* =========================================================
   SESSÕES ABA (CRUD)
========================================================= */

// Buscar sessões ABA por paciente
router.get(
    '/sessions/:patientId',
    authenticateToken,
    abaSessionController.getSessionsByPatient
);

// Criar sessão ABA
router.post(
    '/sessions',
    authenticateToken,
    abaSessionController.createSession
);

// Buscar sessão específica
router.get(
    '/session/:sessionId',
    authenticateToken,
    abaSessionController.getSessionById
);

// Atualizar sessão ABA
router.put(
    '/session/:sessionId',
    authenticateToken,
    abaSessionController.updateSession
);

// Remover sessão ABA (uso restrito)
router.delete(
    '/session/:sessionId',
    authenticateToken,
    abaSessionController.deleteSession
);

/* =========================================================
   IA ABA – ANALYTICS (NÍVEL 2 e 3)
========================================================= */

// Métricas e classificação clínica
router.get(
    '/ai/analytics/:patientId',
    authenticateToken,
    abaAiController.getAnalytics
);

// Monitoramento (estagnação / regressão)
router.get(
    '/ai/monitoring/:patientId',
    authenticateToken,
    abaAiController.getMonitoring
);

/* =========================================================
   IA ABA – FORECAST (NÍVEL 4)
========================================================= */

// Previsão de desempenho futuro
router.get(
    '/ai/forecast/:patientId',
    authenticateToken,
    abaAiController.getForecast
);

/* =========================================================
   IA ABA – SUGESTÕES DE PROGRAMAS
========================================================= */

// Sugestão automática de programas ABA
router.get(
    '/ai/suggestions/:patientId',
    authenticateToken,
    abaAiController.getProgramSuggestions
);

/* =========================================================
   PROGRAMAS ABA – DECISÕES CLÍNICAS
========================================================= */

// Substituir programa ABA
router.post(
    '/program/replace',
    authenticateToken,
    abaProgramController.replaceProgram
);

// Encerrar programa ABA
router.post(
    '/program/close',
    authenticateToken,
    abaProgramController.closeProgram
);

/* =========================================================
   RELATÓRIO ABA + IA (PDF)
========================================================= */

// Gerar relatório PDF assinável
router.get(
    '/report/pdf/:patientId',
    authenticateToken,
    abaReportController.generatePdf
);

export default router;
