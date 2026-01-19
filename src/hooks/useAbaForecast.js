import { useEffect, useState, useCallback } from 'react';
import abaAiService from '../services/abaAiService';

/**
 * useAbaForecast
 * Hook de Previsão ABA (IA Nível 4)
 * - Previsão de desempenho futuro
 * - Tendência clínica
 */
const useAbaForecast = (patientId) => {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /* ==============================
       Carregar previsão
    ============================== */
    const loadForecast = useCallback(async () => {
        if (!patientId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await abaAiService.getForecast(patientId);
            setForecast(response.data);

        } catch (err) {
            console.error(err);
            setError('Erro ao carregar previsão ABA.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    /* ==============================
       Effects
    ============================== */
    useEffect(() => {
        loadForecast();
    }, [loadForecast]);

    return {
        forecast,
        loading,
        error,
        reload: loadForecast
    };
};

export default useAbaForecast;
