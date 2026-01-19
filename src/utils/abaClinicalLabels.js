/**
 * abaClinicalLabels
 * Rótulos clínicos padronizados ABA
 * Utilizado na UI, IA e relatórios
 */

/* ==============================
   CLASSIFICAÇÃO DE PROGRESSO
============================== */
export const PROGRESS_LABELS = {
    PROGRESSO: {
        label: 'Progresso Significativo',
        description:
            'Evolução consistente com aquisição gradual de habilidades.'
    },
    ESTÁVEL: {
        label: 'Desempenho Estável',
        description:
            'Manutenção das habilidades sem ganhos expressivos.'
    },
    ESTAGNAÇÃO: {
        label: 'Estagnação',
        description:
            'Ausência de evolução significativa nas últimas sessões.'
    },
    REGRESSÃO: {
        label: 'Regressão',
        description:
            'Perda ou redução significativa de habilidades previamente adquiridas.'
    }
};

/* ==============================
   NÍVEIS DE IA
============================== */
export const AI_LEVELS = {
    LEVEL_2: {
        label: 'IA Nível 2',
        description: 'Análise estatística descritiva.'
    },
    LEVEL_3: {
        label: 'IA Nível 3',
        description: 'Análise interpretativa com detecção de padrões.'
    },
    LEVEL_4: {
        label: 'IA Nível 4',
        description: 'Previsão de desempenho futuro.'
    }
};

/* ==============================
   DECISÕES CLÍNICAS
============================== */
export const CLINICAL_DECISIONS = {
    CONTINUE: {
        label: 'Manter Programa',
        description:
            'O programa atual apresenta resposta adequada.'
    },
    ADJUST: {
        label: 'Ajustar Estratégia',
        description:
            'Recomenda-se ajuste de prompts, reforçadores ou critérios.'
    },
    REPLACE: {
        label: 'Substituir Programa',
        description:
            'O programa atual não apresenta eficácia clínica.'
    },
    CLOSE: {
        label: 'Encerrar Programa',
        description:
            'Habilidade considerada adquirida ou domínio atingido.'
    }
};

/* ==============================
   TIPOS DE PROMPT
============================== */
export const PROMPT_TYPES = {
    FISICO_TOTAL: 'Físico Total',
    FISICO_PARCIAL: 'Físico Parcial',
    GESTUAL: 'Gestual',
    VERBAL: 'Verbal',
    VISUAL: 'Visual',
    INDEPENDENTE: 'Independente'
};

/* ==============================
   TIPOS DE DADOS ABA
============================== */
export const ABA_DATA_TYPES = {
    DTT: 'Discrete Trial Training (DTT)',
    NET: 'Natural Environment Teaching (NET)',
    MANDOS: 'Treino de Mandos'
};
