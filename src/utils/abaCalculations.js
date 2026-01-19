/**
 * abaCalculations
 * Funções utilitárias de cálculo ABA
 * Base para IA, gráficos e relatórios
 */

/* ==============================
   TAXA DE ACERTO (%)
============================== */
export const calculateAccuracyRate = (correct, total) => {
    if (!total || total === 0) return 0;
    return Number(((correct / total) * 100).toFixed(2));
};

/* ==============================
   TAXA DE PROMPTS
============================== */
export const calculatePromptRate = (prompted, total) => {
    if (!total || total === 0) return 0;
    return Number(((prompted / total) * 100).toFixed(2));
};

/* ==============================
   SCORE ABA DA SESSÃO
   (peso clínico)
============================== */
export const calculateSessionScore = (session) => {
    if (!session) return 0;

    const accuracy = calculateAccuracyRate(
        session.correctResponses,
        session.totalTrials
    );

    const promptPenalty = calculatePromptRate(
        session.promptedResponses,
        session.totalTrials
    );

    // Fórmula clínica:
    // precisão alta + menos prompts = score maior
    const score = accuracy - (promptPenalty * 0.5);

    return Number(Math.max(score, 0).toFixed(2));
};

/* ==============================
   SCORE MÉDIO POR PROGRAMA
============================== */
export const calculateProgramAverage = (sessions = []) => {
    if (!sessions.length) return 0;

    const totalScore = sessions.reduce((sum, s) => {
        return sum + calculateSessionScore(s);
    }, 0);

    return Number((totalScore / sessions.length).toFixed(2));
};

/* ==============================
   CLASSIFICAÇÃO CLÍNICA
============================== */
export const classifyProgress = (trend) => {
    if (trend >= 5) return 'PROGRESSO';
    if (trend >= -2 && trend < 5) return 'ESTÁVEL';
    if (trend < -2) return 'REGRESSÃO';
    return 'INDEFINIDO';
};

/* ==============================
   DETECTAR ESTAGNAÇÃO
============================== */
export const detectStagnation = (scores = []) => {
    if (scores.length < 5) return false;

    const lastScores = scores.slice(-5);
    const variation =
        Math.max(...lastScores) - Math.min(...lastScores);

    // Variação muito pequena indica estagnação
    return variation < 3;
};

/* ==============================
   DETECTAR REGRESSÃO
============================== */
export const detectRegression = (scores = []) => {
    if (scores.length < 3) return false;

    const last = scores[scores.length - 1];
    const previous = scores[scores.length - 2];

    return last < previous - 5;
};

/* ==============================
   TENDÊNCIA (SLOPE)
============================== */
export const calculateTrend = (scores = []) => {
    if (scores.length < 2) return 0;

    const first = scores[0];
    const last = scores[scores.length - 1];

    return Number((last - first).toFixed(2));
};

/* ==============================
   PREVISÃO SIMPLES (NÍVEL 4)
============================== */
export const forecastNextScore = (scores = []) => {
    if (scores.length < 3) return null;

    const trend = calculateTrend(scores);
    const last = scores[scores.length - 1];

    return Number((last + trend * 0.5).toFixed(2));
};

/* ==============================
   DECISÃO DE ENCERRAMENTO
============================== */
export const shouldCloseProgram = (scores = []) => {
    if (scores.length < 6) return false;

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Domínio da habilidade
    return average >= 90;
};

/* ==============================
   DECISÃO DE SUBSTITUIÇÃO
============================== */
export const shouldReplaceProgram = (scores = []) => {
    if (scores.length < 6) return false;

    const stagnation = detectStagnation(scores);
    const regression = detectRegression(scores);

    return stagnation || regression;
};
