import { useEffect, useState, useCallback } from 'react';
import abaService from '../services/abaService';

/**
 * useAbaSessions
 * Hook para gerenciamento de sessões ABA
 * - Listagem
 * - Criação
 * - Atualização
 * - Remoção
 */
const useAbaSessions = (patientId) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /* ==============================
       Carregar sessões
    ============================== */
    const loadSessions = useCallback(async () => {
        if (!patientId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await abaService.getSessions(patientId);
            setSessions(response.data);

        } catch (err) {
            console.error(err);
            setError('Erro ao carregar sessões ABA.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    /* ==============================
       Criar sessão
    ============================== */
    const createSession = async (data) => {
        try {
            setLoading(true);
            setError(null);

            await abaService.createSession({
                patientId,
                ...data
            });

            await loadSessions();

        } catch (err) {
            console.error(err);
            setError('Erro ao criar sessão ABA.');
        } finally {
            setLoading(false);
        }
    };

    /* ==============================
       Atualizar sessão
    ============================== */
    const updateSession = async (sessionId, data) => {
        try {
            setLoading(true);
            setError(null);

            await abaService.updateSession(sessionId, data);
            await loadSessions();

        } catch (err) {
            console.error(err);
            setError('Erro ao atualizar sessão ABA.');
        } finally {
            setLoading(false);
        }
    };

    /* ==============================
       Remover sessão
       (uso restrito)
    ============================== */
    const deleteSession = async (sessionId) => {
        try {
            setLoading(true);
            setError(null);

            await abaService.deleteSession(sessionId);
            await loadSessions();

        } catch (err) {
            console.error(err);
            setError('Erro ao remover sessão ABA.');
        } finally {
            setLoading(false);
        }
    };

    /* ==============================
       Effects
    ============================== */
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    return {
        sessions,
        loading,
        error,
        reload: loadSessions,
        createSession,
        updateSession,
        deleteSession
    };
};

export default useAbaSessions;
