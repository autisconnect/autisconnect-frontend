import api from '../services/api';

/**
 * abaAiService
 * Comunicação frontend ↔ backend
 * IA do módulo ABA (Níveis 2, 3 e 4)
 */
const abaAiService = {

    /* ==============================
       ANALYTICS – IA NÍVEL 2 / 3
    ============================== */
    /**
     * Retorna métricas e classificação clínica
     * (progresso, estável, estagnação, regressão)
     */
    getAnalytics(patientId) {
        return api.get(`/aba/ai/analytics/${patientId}`);
    },

    /* ==============================
       FORECAST – IA NÍVEL 4
    ============================== */
    /**
     * Retorna previsão de desempenho futuro
     */
    getForecast(patientId) {
        return api.get(`/aba/ai/forecast/${patientId}`);
    },

    /* ==============================
       MONITORAMENTO
    ============================== */
    /**
     * Retorna análise de estagnação / regressão
     * por programa ABA
     */
    getMonitoring(patientId) {
        return api.get(`/aba/ai/monitoring/${patientId}`);
    },

    /* ==============================
       SUGESTÕES DE PROGRAMAS
    ============================== */
    /**
     * Sugestão automática de novos programas ABA
     */
    getProgramSuggestions(patientId) {
        return api.get(`/aba/ai/suggestions/${patientId}`);
    }
};

export default abaAiService;
