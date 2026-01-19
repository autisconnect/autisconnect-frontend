import api from '../../../services/api';

/**
 * abaProgramService
 * Comunicação frontend ↔ backend
 * Ações clínicas sobre programas ABA
 */
const abaProgramService = {

    /* ==============================
       SUBSTITUIÇÃO DE PROGRAMA
    ============================== */
    /**
     * Substituir programa ABA
     * @param {object} data
     * - programId
     * - suggestedProgram
     */
    replaceProgram(data) {
        return api.post('/aba/program/replace', data);
    },

    /* ==============================
       ENCERRAMENTO DE PROGRAMA
    ============================== */
    /**
     * Encerrar programa ABA
     * @param {object} data
     * - programId
     * - reason
     */
    closeProgram(data) {
        return api.post('/aba/program/close', data);
    }
};

export default abaProgramService;
