/**
 * abaChartProcessors
 * Processadores de dados para gráficos ABA
 * Converte sessões em séries gráficas
 */

import {
    calculateAccuracyRate,
    calculatePromptRate,
    calculateSessionScore
} from './abaCalculations';

/* ==============================
   PROCESSAR EVOLUÇÃO DE ACURÁCIA
============================== */
export const processAccuracyChart = (sessions = []) => {
    return sessions.map(session => ({
        date: session.sessionDate,
        accuracy: calculateAccuracyRate(
            session.correctResponses,
            session.totalTrials
        )
    }));
};

/* ==============================
   PROCESSAR USO DE PROMPTS
============================== */
export const processPromptChart = (sessions = []) => {
    return sessions.map(session => ({
        date: session.sessionDate,
        prompts: calculatePromptRate(
            session.promptedResponses,
            session.totalTrials
        )
    }));
};

/* ==============================
   PROCESSAR SCORE ABA
============================== */
export const processScoreChart = (sessions = []) => {
    return sessions.map(session => ({
        date: session.sessionDate,
        score: calculateSessionScore(session)
    }));
};

/* ==============================
   AGRUPAR POR PROGRAMA
============================== */
export const groupSessionsByProgram = (sessions = []) => {
    return sessions.reduce((acc, session) => {
        const key = session.programName || 'Sem Programa';

        if (!acc[key]) acc[key] = [];
        acc[key].push(session);

        return acc;
    }, {});
};

/* ==============================
   PROCESSAR EVOLUÇÃO POR PROGRAMA
============================== */
export const processProgramEvolution = (sessions = []) => {
    const grouped = groupSessionsByProgram(sessions);

    return Object.keys(grouped).map(program => {
        const programSessions = grouped[program];

        return {
            program,
            data: processScoreChart(programSessions)
        };
    });
};
