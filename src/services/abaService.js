import api from '../services/api';

/**
 * abaService
 * Comunicação frontend ↔ backend
 * Sessões ABA (CRUD)
 */
const abaService = {
    /**
     * Buscar sessões ABA de um paciente
     * @param {number|string} patientId
     */
    getSessions(patientId) {
        return api.get(`/aba/sessions/${patientId}`);
    },

    /**
     * Criar nova sessão ABA
     * @param {object} data
     */
    createSession(data) {
        return api.post('/aba/sessions', data);
    },

    /**
     * Buscar sessão ABA específica (se necessário futuramente)
     * @param {number|string} sessionId
     */
    getSessionById(sessionId) {
        return api.get(`/aba/session/${sessionId}`);
    },

    /**
     * Atualizar sessão ABA
     * (opcional – útil para correções clínicas)
     */
    updateSession(sessionId, data) {
        return api.put(`/aba/session/${sessionId}`, data);
    },

    /**
     * Remover sessão ABA
     * (uso restrito – auditoria recomendada)
     */
    deleteSession(sessionId) {
        return api.delete(`/aba/session/${sessionId}`);
    }
};

export default abaService;
