import { useEffect, useState, useCallback } from 'react';
import abaAiService from '../services/abaAiService';

/**
 * useAbaAnalytics
 * Hook de Analytics ABA (IA Nível 2 e 3)
 * - Métricas clínicas
 * - Classificação de progresso
 * - Estagnação / regressão
 */
const useAbaAnalytics = (patientId) => {
    const [analytics, setAnalytics] = useState(null);
    const [monitoring, setMonitoring] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /* ==============================
       Carregar analytics
    ============================== */
    const loadAnalytics = useCallback(async () => {
        if (!patientId) return;

        try {
            setLoading(true);
            setError(null);

            const analyticsRes = await abaAiService.getAnalytics(patientId);
            setAnalytics(analyticsRes.data);

            const monitoringRes = await abaAiService.getMonitoring(patientId);
            setMonitoring(monitoringRes.data);

        } catch (err) {
            console.error(err);
            setError('Erro ao carregar análises ABA.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    /* ==============================
       Effects
    ============================== */
    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    return {
        analytics,
        monitoring,
        loading,
        error,
        reload: loadAnalytics
    };
};

export default useAbaAnalytics;
