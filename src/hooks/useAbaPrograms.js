import { useEffect, useState, useCallback } from 'react';
import abaAiService from '../services/abaAiService';
import abaProgramService from '../services/abaProgramService';

/**
 * useAbaPrograms
 * Hook para gestão de programas ABA
 * - Sugestões automáticas
 * - Monitoramento
 * - Substituição
 * - Encerramento
 */
const useAbaPrograms = (patientId) => {
    const [suggestions, setSuggestions] = useState([]);
    const [monitoring, setMonitoring] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /* ==============================
       Carregar dados IA
    ============================== */
    const loadProgramsData = useCallback(async () => {
        if (!patientId) return;

        try {
            setLoading(true);
            setError(null);

            const suggestionsRes =
                await abaAiService.getProgramSuggestions(patientId);
            setSuggestions(suggestionsRes.data);

            const monitoringRes =
                await abaAiService.getMonitoring(patientId);
            setMonitoring(monitoringRes.data);

        } catch (err) {
            console.error(err);
            setError('Erro ao carregar programas ABA.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    /* ==============================
       Ações clínicas
    ============================== */
    const replaceProgram = async (data) => {
        try {
            setLoading(true);
            setError(null);

            await abaProgramService.replaceProgram(data);
            await loadProgramsData();

        } catch (err) {
            console.error(err);
            setError('Erro ao substituir programa ABA.');
        } finally {
            setLoading(false);
        }
    };

    const closeProgram = async (data) => {
        try {
            setLoading(true);
            setError(null);

            await abaProgramService.closeProgram(data);
            await loadProgramsData();

        } catch (err) {
            console.error(err);
            setError('Erro ao encerrar programa ABA.');
        } finally {
            setLoading(false);
        }
    };

    /* ==============================
       Effects
    ============================== */
    useEffect(() => {
        loadProgramsData();
    }, [loadProgramsData]);

    return {
        suggestions,
        monitoring,
        loading,
        error,
        reload: loadProgramsData,
        replaceProgram,
        closeProgram
    };
};

export default useAbaPrograms;
