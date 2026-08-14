import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
    Row,
    Col,
    Button,
    Table,
    Alert,
    Form,
    Modal,
    Offcanvas
} from 'react-bootstrap';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    BarChartLine,
    Calendar3,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    ClipboardPulse,
    Controller,
    EmojiSmile,
    ExclamationTriangle,
    FileEarmarkMedical,
    GraphUp,
    HouseDoor,
    JournalText,
    List,
    Mic,
    PersonCircle,
    PlusCircle,
    ShieldCheck,
    Stars,
    Wallet
} from 'react-bootstrap-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Line, Bar, Pie } from 'react-chartjs-2';
import apiClient from './services/api';
import PatientFaceReferencePanel from './emotion-tracking/PatientFaceReferencePanel';
import GamesPanel from './games/GamesPanel';
import GamesReport from './games/GamesReport';
import './games/gamesSection.css';

import logonovo from './assets/logonovo.png';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import './App.css';
import './PatientDetails.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ROUTES = {
    EMOTION_DETECTOR: '/emotion-detector',
    STROKE_RISK_MONITOR: '/stroke-risk-monitor',
    TRIGGER_RECORDER: '/trigger-recorder',
    ABA_MODULE: '/aba/patient'
};

const MONITORING_WINDOW_NAMES = {
    [ROUTES.EMOTION_DETECTOR]: 'autisconnect-emotion-detector',
    [ROUTES.STROKE_RISK_MONITOR]: 'autisconnect-stroke-risk-monitor',
    [ROUTES.TRIGGER_RECORDER]: 'autisconnect-trigger-recorder',
    [ROUTES.ABA_MODULE]: 'autisconnect-aba-patient'
};

const SIDEBAR_STORAGE_KEY = 'ac-patient-sidebar-collapsed';

const PERIOD_LABELS = {
    week: 'Última semana',
    month: 'Último mês',
    quarter: 'Último trimestre',
    year: 'Último ano'
};

const APPOINTMENT_STATUS_OPTIONS = ['Realizada', 'Agendada', 'Confirmada', 'Cancelada', 'Não Realizada', 'Remarcada'];
const PAYMENT_STATUS_OPTIONS = ['Pendente', 'Pago', 'Atrasado', 'Isento'];
const PAYMENT_METHOD_OPTIONS = ['Pix', 'Crédito', 'Débito', 'Dinheiro', 'Plano de Saúde', 'Outros'];
const APPOINTMENT_TYPE_OPTIONS = ['Regular', 'Inicial', 'Acompanhamento', 'Avaliação', 'Terapia'];
const PLAN_NAMES = ['Hapvida', 'Bradesco Saúde', 'SulAmérica', 'Unimed', 'Amil'];

const SECTION_META = {
    overview: {
        eyebrow: 'Patient 360°',
        title: 'Visão Geral',
        description: 'Estado atual, evolução e sinais mais relevantes do acompanhamento.'
    },
    emotion: {
        eyebrow: 'Acompanhamento',
        title: 'Emoções',
        description: 'Distribuição emocional, padrões locais e projeções assistidas por IA.'
    },
    trigger: {
        eyebrow: 'Acompanhamento',
        title: 'Vocalizações',
        description: 'Registros de linguagem, repetições, evolução lexical e tendências.'
    },
    stroke: {
        eyebrow: 'Acompanhamento',
        title: 'Risco de AVC',
        description: 'Indicadores faciais, assimetria e sinais de monitoramento ao longo do tempo.'
    },
    games: {
        eyebrow: 'Desenvolvimento',
        title: 'Games',
        description: 'Painel terapêutico e relatórios de desempenho nos jogos.'
    },
    consultation: {
        eyebrow: 'Clínico',
        title: 'Atendimentos',
        description: 'Histórico completo com edição inline de status e dados financeiros.'
    },
    prescription: {
        eyebrow: 'Clínico',
        title: 'Prescrições',
        description: 'Registro, impressão e acompanhamento das prescrições emitidas.'
    },
    notes: {
        eyebrow: 'Clínico',
        title: 'Notas',
        description: 'Observações registradas durante a evolução do paciente.'
    },
    'monitoring-tools': {
        eyebrow: 'Ferramentas',
        title: 'Monitoramentos',
        description: 'Acesso rápido aos módulos ativos de coleta e acompanhamento.'
    },
    aba: {
        eyebrow: 'Acompanhamento',
        title: 'Acompanhamento ABA',
        description: 'Evolução das habilidades, desempenho e independência do paciente.'
    }
};

const PATIENT_NAVIGATION_GROUPS = [
    {
        label: 'Paciente',
        items: [
            { key: 'overview', label: 'Visão Geral', icon: HouseDoor }
        ]
    },
    {
        label: 'Acompanhamento',
        items: [
            { key: 'emotion', label: 'Emoções', icon: EmojiSmile },
            { key: 'trigger', label: 'Vocalizações', icon: Mic },
            { key: 'stroke', label: 'Risco de AVC', icon: ShieldCheck },
            { key: 'aba', label: 'ABA', icon: ClipboardPulse },
            { key: 'games', label: 'Games', icon: Controller }
        ]
    },
    {
        label: 'Clínico',
        items: [
            { key: 'consultation', label: 'Atendimentos', icon: CalendarCheck },
            { key: 'prescription', label: 'Prescrições', icon: FileEarmarkMedical },
            { key: 'notes', label: 'Notas', icon: JournalText }
        ]
    },
    {
        label: 'Ferramentas',
        items: [
            { key: 'monitoring-tools', label: 'Monitoramentos', icon: Activity }
        ]
    }
];

const EMOTION_LABELS = {
    happy: 'Feliz',
    sad: 'Triste',
    neutral: 'Neutro',
    angry: 'Raiva',
    surprised: 'Surpreso',
    fearful: 'Medo',
    disgusted: 'Desgosto'
};

const STATUS_TONES = {
    Agendada: 'scheduled',
    Confirmada: 'confirmed',
    Realizada: 'completed',
    Cancelada: 'critical',
    'Não Realizada': 'muted',
    Remarcada: 'warning',
    Pendente: 'warning',
    Pago: 'completed',
    Atrasado: 'critical',
    Isento: 'muted',
    Baixo: 'completed',
    Médio: 'warning',
    Alto: 'critical'
};

const decodeBrokenUtf8 = (value) => {
    if (typeof value !== 'string' || !/[ÃÂ]/.test(value)) {
        return value;
    }

    try {
        const bytes = new Uint8Array(Array.from(value).map((character) => character.charCodeAt(0)));
        return new TextDecoder('utf-8').decode(bytes);
    } catch (error) {
        return value;
    }
};

const normalizeText = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    return decodeBrokenUtf8(value).trim();
};

const normalizeAppointmentStatus = (value) => {
    const normalized = normalizeText(value);
    const aliases = {
        'NÃ£o Realizada': 'Não Realizada',
        'NÃƒÂ£o Realizada': 'Não Realizada'
    };

    return aliases[normalized] || normalized || 'Agendada';
};

const normalizePaymentMethod = (value) => {
    const normalized = normalizeText(value);

    if (!normalized) {
        return '';
    }

    if (PAYMENT_METHOD_OPTIONS.includes(normalized)) {
        return normalized;
    }

    if (PLAN_NAMES.includes(normalized)) {
        return 'Plano de Saúde';
    }

    return 'Outros';
};

const normalizePaymentDetails = (value, rawValue) => {
    const normalizedValue = normalizeText(value);
    const normalizedRawValue = normalizeText(rawValue);

    if (normalizedValue) {
        return normalizedValue;
    }

    if (PAYMENT_METHOD_OPTIONS.includes(normalizedRawValue) || !normalizedRawValue) {
        return '';
    }

    return normalizedRawValue;
};

const normalizePaymentStatus = (value) => normalizeText(value) || 'Pendente';
const normalizeRiskLevel = (value) => normalizeText(value) || 'Sem dados';
const normalizeAppointmentType = (value) => normalizeText(value) || 'Regular';

const safeDateFromRecord = (value, timeValue) => {
    if (!value) {
        return null;
    }

    const normalizedDate = typeof value === 'string' ? value.split('T')[0] : value;
    const normalizedTime = typeof timeValue === 'string' && timeValue.length >= 5 ? timeValue.substring(0, 5) : '00:00';
    const date = new Date(`${normalizedDate}T${normalizedTime}:00`);

    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (dateString) => {
    const date = safeDateFromRecord(dateString);
    return date ? date.toLocaleDateString('pt-BR') : 'N/A';
};

const formatTime = (timeString) => (timeString ? String(timeString).substring(0, 5) : 'N/A');

const formatDateTime = (dateString, timeString) => (
    `${formatDate(dateString)} • ${formatTime(timeString)}`
);

const formatAge = (birthDate) => {
    if (!birthDate) {
        return 'N/A';
    }

    const today = new Date();
    const birth = new Date(birthDate);

    if (Number.isNaN(birth.getTime())) {
        return 'N/A';
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
    }

    return `${age} anos`;
};

const formatCurrency = (value) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
        return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericValue);
};

const formatPercentage = (value, digits = 1) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? `${numericValue.toFixed(digits)}%` : 'Sem dados';
};

const toNumberOrNull = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const formatMetricCount = (value) => {
    const numericValue = toNumberOrNull(value);
    return numericValue === null ? 'Sem dados' : new Intl.NumberFormat('pt-BR').format(numericValue);
};

const formatMetricPercent = (value, digits = 0) => {
    const numericValue = toNumberOrNull(value);
    return numericValue === null ? 'Sem dados' : `${numericValue.toFixed(digits)}%`;
};

const formatAbaSessionDate = (value) => {
    if (!value) {
        return 'Sem registro';
    }

    const formatted = formatDate(value);
    return formatted && formatted !== 'N/A' ? formatted : 'Sem registro';
};

const truncateAxisLabel = (value, limit = 18) => {
    const normalized = normalizeText(value) || 'Sem nome';
    if (normalized.length <= limit) {
        return normalized;
    }

    return `${normalized.slice(0, Math.max(limit - 3, 1)).trim()}...`;
};

const getInitials = (value) => {
    if (!value) {
        return 'AC';
    }

    const words = String(value)
        .split(' ')
        .map((word) => word.trim())
        .filter(Boolean);

    if (words.length === 0) {
        return 'AC';
    }

    return words
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
};

const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Bom dia';
    }

    if (hour < 18) {
        return 'Boa tarde';
    }

    return 'Boa noite';
};

const translateEmotion = (emotion) => EMOTION_LABELS[normalizeText(emotion)] || normalizeText(emotion) || 'Sem dados';

const renderRichSummary = (text) => {
    if (!text) {
        return null;
    }

    return String(text).split('**').map((segment, index) => (
        index % 2 === 1
            ? <strong key={`${segment}-${index}`}>{normalizeText(segment)}</strong>
            : <React.Fragment key={`${segment}-${index}`}>{normalizeText(segment)}</React.Fragment>
    ));
};

const filterRecordsByPeriod = (records, periodFilter, getDateValue) => {
    if (!Array.isArray(records) || records.length === 0) {
        return [];
    }

    const now = new Date();
    const periodStart = new Date(now);

    switch (periodFilter) {
    case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
    case 'quarter':
        periodStart.setMonth(now.getMonth() - 3);
        break;
    case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    case 'month':
    default:
        periodStart.setMonth(now.getMonth() - 1);
        break;
    }

    return records.filter((record) => {
        const dateValue = getDateValue(record);
        if (!dateValue) {
            return false;
        }

        const date = new Date(dateValue);
        return !Number.isNaN(date.getTime()) && date >= periodStart && date <= now;
    });
};

const analyzeEmotionPatterns = (emotionRecords) => {
    if (!emotionRecords || emotionRecords.length === 0) {
        return null;
    }

    const sortedRecords = [...emotionRecords].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const todayRecords = sortedRecords.filter((record) => new Date(record.timestamp) > new Date(now - oneDay));
    const yesterdayRecords = sortedRecords.filter((record) => {
        const recordDate = new Date(record.timestamp);
        return recordDate > new Date(now - 2 * oneDay) && recordDate < new Date(now - oneDay);
    });

    const totalCount = sortedRecords.length;
    const counts = sortedRecords.reduce((accumulator, record) => {
        accumulator[record.emotion] = (accumulator[record.emotion] || 0) + 1;
        return accumulator;
    }, {});

    let dominantEmotion = 'Nenhuma';
    let maxCount = 0;

    Object.keys(counts).forEach((emotion) => {
        if (counts[emotion] > maxCount) {
            maxCount = counts[emotion];
            dominantEmotion = emotion;
        }
    });

    const distribution = Object.keys(counts)
        .map((emotion) => ({
            emotion,
            percentage: ((counts[emotion] / totalCount) * 100).toFixed(1)
        }))
        .sort((a, b) => Number(b.percentage) - Number(a.percentage));

    const todayDominant = todayRecords.reduce((accumulator, record) => {
        accumulator[record.emotion] = (accumulator[record.emotion] || 0) + 1;
        return accumulator;
    }, {});

    const yesterdayDominant = yesterdayRecords.reduce((accumulator, record) => {
        accumulator[record.emotion] = (accumulator[record.emotion] || 0) + 1;
        return accumulator;
    }, {});

    const trend = {
        happy: (todayDominant.happy || 0) - (yesterdayDominant.happy || 0),
        sad: (todayDominant.sad || 0) - (yesterdayDominant.sad || 0),
        angry: (todayDominant.angry || 0) - (yesterdayDominant.angry || 0)
    };

    const recordsByDay = sortedRecords.reduce((accumulator, record) => {
        const day = new Date(record.timestamp).toLocaleDateString('pt-BR');
        if (!accumulator[day]) {
            accumulator[day] = [];
        }
        accumulator[day].push(record.emotion);
        return accumulator;
    }, {});

    const averageDetectionsPerDay = totalCount / Math.max(Object.keys(recordsByDay).length, 1);
    const emotionalPeaks = [];

    Object.keys(recordsByDay).forEach((day) => {
        if (recordsByDay[day].length > averageDetectionsPerDay * 1.5) {
            const dayCounts = recordsByDay[day].reduce((accumulator, emotion) => {
                accumulator[emotion] = (accumulator[emotion] || 0) + 1;
                return accumulator;
            }, {});

            const peakEmotion = Object.keys(dayCounts).reduce((current, next) => (
                dayCounts[current] > dayCounts[next] ? current : next
            ));

            emotionalPeaks.push(`Um pico de detecções com predominância de "${translateEmotion(peakEmotion)}" foi observado em ${day}.`);
        }
    });

    let moodSwings = 0;
    for (let index = 1; index < sortedRecords.length; index += 1) {
        if (sortedRecords[index].emotion !== sortedRecords[index - 1].emotion) {
            moodSwings += 1;
        }
    }

    const volatility = (moodSwings / totalCount) * 100;
    let volatilityText = 'estável';
    if (volatility > 30) {
        volatilityText = 'variável';
    }
    if (volatility > 60) {
        volatilityText = 'altamente volátil';
    }

    return {
        dominantEmotion,
        distribution,
        trend,
        emotionalPeaks,
        volatilityText
    };
};

const generateAISummary = (analysis) => {
    if (!analysis) {
        return 'Aguardando dados suficientes para gerar o resumo...';
    }

    const { dominantEmotion, distribution, trend, emotionalPeaks, volatilityText } = analysis;
    let summary = `No período analisado, o paciente demonstrou um estado emocional predominantemente **${translateEmotion(dominantEmotion)}**. `;

    const secondaryEmotion = distribution.find((item) => item.emotion !== dominantEmotion && Number(item.percentage) > 15);
    if (secondaryEmotion) {
        summary += `Houve também uma presença significativa de registros de **${translateEmotion(secondaryEmotion.emotion)}** (${secondaryEmotion.percentage}%). `;
    }

    summary += `O comportamento emocional geral mostrou-se **${volatilityText}**. `;

    if (trend.happy < -2) {
        summary += 'Foi observada uma tendência de **diminuição nos registros de felicidade** nas detecções recentes. ';
    } else if (trend.sad > 2 || trend.angry > 2) {
        summary += 'Foi observada uma tendência de **aumento em emoções negativas** (tristeza/raiva) recentemente. ';
    } else if (trend.happy > 2) {
        summary += 'Observa-se uma **tendência positiva** recente, com aumento nos registros da emoção "feliz". ';
    }

    if (emotionalPeaks.length > 0) {
        const firstPeakDateMatch = emotionalPeaks[0].match(/\d{2}\/\d{2}\/\d{4}/);
        if (firstPeakDateMatch) {
            summary += `**Alertas de pico** foram registrados, sugerindo que dias específicos, como ${firstPeakDateMatch[0]}, podem merecer análise mais aprofundada.`;
        }
    }

    return summary;
};

const analyzeStrokeRiskPatterns = (riskRecords) => {
    if (!riskRecords || riskRecords.length === 0) {
        return null;
    }

    const sortedRecords = [...riskRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    const totalCount = sortedRecords.length;
    const lastRecord = sortedRecords[sortedRecords.length - 1];

    const counts = sortedRecords.reduce((accumulator, record) => {
        accumulator[record.risk_level] = (accumulator[record.risk_level] || 0) + 1;
        return accumulator;
    }, {});

    const distribution = ['Baixo', 'Médio', 'Alto'].map((level) => ({
        level,
        percentage: ((counts[level] || 0) / totalCount * 100).toFixed(1)
    }));

    const recentHighRisk = sortedRecords.filter((record) => (
        record.risk_level === 'Alto'
            && new Date(record.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ));

    return {
        lastRiskLevel: lastRecord.risk_level,
        lastAsymmetryIndex: Number.parseFloat(lastRecord.asymmetry_index).toFixed(2),
        distribution,
        hasRecentHighRisk: recentHighRisk.length > 0
    };
};

const generateStrokeAISummary = (analysis) => {
    if (!analysis) {
        return 'Aguardando dados de risco de AVC para gerar resumo.';
    }

    const { lastRiskLevel, distribution, hasRecentHighRisk } = analysis;
    const highRiskPercentage = distribution.find((item) => item.level === 'Alto')?.percentage || 0;

    let summary = `O nível de risco mais recente do paciente foi classificado como **${lastRiskLevel}**. `;

    if (Number(highRiskPercentage) > 10) {
        summary += `É importante notar que **${highRiskPercentage}%** das medições indicaram risco **alto**, sugerindo necessidade de acompanhamento contínuo. `;
    } else {
        summary += 'A maioria das medições indicou risco baixo a moderado no período analisado. ';
    }

    if (hasRecentHighRisk) {
        summary += '**Alerta:** foram detectados episódios de risco **alto** na última semana, recomendando atenção aos sinais clínicos.';
    } else {
        summary += 'Não foram detectados episódios de risco alto na última semana.';
    }

    return summary;
};

const analyzeVocalizationPatterns = (vocalizationRecords) => {
    if (!vocalizationRecords || vocalizationRecords.length === 0) {
        return null;
    }

    const allAnalyses = vocalizationRecords.map((record) => record.analysis_data || record.analysis || {});
    const totalWordCount = allAnalyses.reduce((sum, analysis) => sum + Number(analysis.wordCount || 0), 0);
    const averageDiversity = allAnalyses.reduce((sum, analysis) => sum + Number(analysis.lexicalDiversity || 0), 0) / allAnalyses.length;

    const allRepeatedWords = allAnalyses.flatMap((analysis) => analysis.repeatedWords || []);
    const mostCommonRepetition = allRepeatedWords.reduce((accumulator, word) => {
        accumulator[word] = (accumulator[word] || 0) + 1;
        return accumulator;
    }, {});

    const repetitionKeys = Object.keys(mostCommonRepetition);
    const dominantRepetition = repetitionKeys.length > 0
        ? repetitionKeys.reduce((current, next) => (
            mostCommonRepetition[current] > mostCommonRepetition[next] ? current : next
        ))
        : 'Nenhuma';

    return {
        totalRecordings: vocalizationRecords.length,
        averageWordCount: (totalWordCount / allAnalyses.length).toFixed(1),
        averageLexicalDiversity: (averageDiversity * 100).toFixed(1),
        dominantRepetition: normalizeText(dominantRepetition)
    };
};

const generateVocalizationAISummary = (analysis) => {
    if (!analysis) {
        return 'Aguardando dados de vocalização para gerar resumo.';
    }

    const { averageWordCount, averageLexicalDiversity, dominantRepetition, totalRecordings } = analysis;
    let summary = `Com base em **${totalRecordings}** gravações, o paciente apresenta média de **${averageWordCount}** palavras por vocalização. `;
    summary += `A diversidade lexical média registrada foi de **${averageLexicalDiversity}%**, sinalizando a complexidade da comunicação observada. `;

    if (dominantRepetition !== 'Nenhuma') {
        summary += `O padrão de repetição mais comum observado foi **"${dominantRepetition}"**, ponto relevante para análise de ecolalia ou perseveração.`;
    } else {
        summary += 'Não foram observados padrões de repetição significativos nas gravações analisadas.';
    }

    return summary;
};

const processChartData = (strokeRisks, emotions, vocalizations) => {
    const strokeChartData = {
        labels: strokeRisks.map((record) => new Date(record.date).toLocaleDateString('pt-BR')),
        datasets: [{
            label: 'Índice de Assimetria Facial',
            data: strokeRisks.map((record) => Number.parseFloat(record.asymmetry_index || 0)),
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            fill: true,
            tension: 0.35
        }]
    };

    const emotionTypes = ['happy', 'sad', 'neutral', 'angry', 'surprised', 'fearful', 'disgusted'];
    const emotionColors = {
        happy: '#16a34a',
        sad: '#2563eb',
        neutral: '#94a3b8',
        angry: '#dc2626',
        surprised: '#f59e0b',
        fearful: '#7c3aed',
        disgusted: '#06b6d4'
    };

    const emotionCounts = emotions.reduce((accumulator, record) => {
        accumulator[record.emotion] = (accumulator[record.emotion] || 0) + 1;
        return accumulator;
    }, {});

    const emotionDistributionData = {
        labels: emotionTypes.map((emotion) => translateEmotion(emotion)),
        datasets: [{
            label: 'Distribuição de Emoções',
            data: emotionTypes.map((emotion) => emotionCounts[emotion] || 0),
            backgroundColor: emotionTypes.map((emotion) => `${emotionColors[emotion]}cc`),
            borderColor: emotionTypes.map((emotion) => emotionColors[emotion]),
            borderWidth: 1
        }]
    };

    const dailyCounts = emotions.reduce((accumulator, record) => {
        const date = new Date(record.timestamp).toLocaleDateString('pt-BR');
        if (!accumulator[date]) {
            accumulator[date] = {};
        }
        accumulator[date][record.emotion] = (accumulator[date][record.emotion] || 0) + 1;
        return accumulator;
    }, {});

    const sortedDates = Object.keys(dailyCounts).sort((a, b) => (
        new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'))
    ));

    const emotionLineChartData = {
        labels: sortedDates,
        datasets: emotionTypes.map((emotion) => ({
            label: translateEmotion(emotion),
            data: sortedDates.map((date) => (dailyCounts[date] && dailyCounts[date][emotion]) || 0),
            borderColor: emotionColors[emotion],
            backgroundColor: `${emotionColors[emotion]}33`,
            fill: false,
            tension: 0.2
        }))
    };

    let vocalizationTrendData = null;
    let repetitionPatternData = null;

    if (vocalizations && vocalizations.length > 0) {
        const sortedVocalizations = [...vocalizations].sort((a, b) => new Date(a.date) - new Date(b.date));

        vocalizationTrendData = {
            labels: sortedVocalizations.map((record) => formatDate(record.date)),
            datasets: [
                {
                    label: 'Diversidade Léxica (%)',
                    data: sortedVocalizations.map((record) => Number(((record.analysis_data?.lexicalDiversity || 0) * 100).toFixed(1))),
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.18)',
                    yAxisID: 'y'
                },
                {
                    label: 'Contagem de Palavras',
                    data: sortedVocalizations.map((record) => Number(record.analysis_data?.wordCount || 0)),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.18)',
                    yAxisID: 'y1'
                }
            ]
        };

        const allRepeatedWords = vocalizations.flatMap((record) => record.analysis?.repeatedWords || []);
        const repetitionCounts = allRepeatedWords.reduce((accumulator, word) => {
            const normalizedWord = normalizeText(word.split(' (')[0]);
            accumulator[normalizedWord] = (accumulator[normalizedWord] || 0) + 1;
            return accumulator;
        }, {});

        const sortedRepetitions = Object.entries(repetitionCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 10);

        repetitionPatternData = {
            labels: sortedRepetitions.map(([word]) => word),
            datasets: [{
                label: 'Frequência de Repetição',
                data: sortedRepetitions.map(([, count]) => count),
                backgroundColor: 'rgba(245, 158, 11, 0.72)',
                borderColor: '#f59e0b',
                borderWidth: 1,
                borderRadius: 10
            }]
        };
    }

    return {
        strokeData: strokeChartData,
        emotionData: emotionLineChartData,
        emotionDistributionData,
        vocalizationTrendData,
        repetitionPatternData
    };
};

const StatusPill = ({ value, className = '' }) => {
    const normalizedValue = normalizeText(value) || 'Sem dados';
    const tone = STATUS_TONES[normalizedValue] || 'info';
    return <span className={`ac-patient-pill ac-patient-pill--${tone} ${className}`.trim()}>{normalizedValue}</span>;
};

const ShellCard = ({ eyebrow, title, subtitle, actions, className = '', bodyClassName = '', children }) => (
    <section className={`ac-patient-card ${className}`.trim()}>
        <header className="ac-patient-card__header">
            <div>
                {eyebrow ? <span className="ac-patient-card__eyebrow">{eyebrow}</span> : null}
                <h3 className="ac-patient-card__title">{title}</h3>
                {subtitle ? <p className="ac-patient-card__subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="ac-patient-card__actions">{actions}</div> : null}
        </header>
        <div className={`ac-patient-card__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
);

const MetricCard = ({ label, value, hint, tone = 'primary', action }) => (
    <article className={`ac-patient-metric ac-patient-metric--${tone}`.trim()}>
        <span className="ac-patient-metric__label">{label}</span>
        <strong className="ac-patient-metric__value">{value}</strong>
        {hint ? <span className="ac-patient-metric__hint">{hint}</span> : null}
        {action ? <div className="ac-patient-metric__action">{action}</div> : null}
    </article>
);

const EmptyState = ({ title, description }) => (
    <div className="ac-patient-empty-state">
        <strong>{title}</strong>
        <p>{description}</p>
    </div>
);

const AlertCard = ({ tone, title, description }) => (
    <article className={`ac-patient-alert-card ac-patient-alert-card--${tone}`.trim()}>
        <div className="ac-patient-alert-card__icon">
            <ExclamationTriangle />
        </div>
        <div>
            <strong>{title}</strong>
            <p>{description}</p>
        </div>
    </article>
);

const MonitoringToolCard = ({ icon: Icon, title, description, buttonLabel, onClick, tone = 'primary' }) => (
    <article className={`ac-patient-tool-card ac-patient-tool-card--${tone}`.trim()}>
        <div className="ac-patient-tool-card__top">
            <span className="ac-patient-tool-card__icon"><Icon /></span>
            <h4>{title}</h4>
        </div>
        <p>{description}</p>
        <Button className="ac-patient-secondary-button" onClick={onClick}>
            {buttonLabel} <ArrowRight className="ms-2" />
        </Button>
    </article>
);

const LoadingSkeleton = () => (
    <div className="ac-patient-page ac-patient-page--loading">
        <aside className="ac-patient-global-shell">
            <div className="ac-patient-global-sidebar">
                <div className="ac-patient-skeleton ac-patient-skeleton--logo" />
                <div className="ac-patient-skeleton ac-patient-skeleton--nav" />
                <div className="ac-patient-skeleton ac-patient-skeleton--nav" />
                <div className="ac-patient-skeleton ac-patient-skeleton--nav" />
            </div>
        </aside>
        <div className="ac-patient-shell">
            <header className="ac-patient-top-header">
                <div className="ac-patient-top-header__inner">
                    <div className="ac-patient-skeleton ac-patient-skeleton--heading" />
                    <div className="ac-patient-skeleton ac-patient-skeleton--toolbar" />
                </div>
            </header>
            <main className="ac-patient-main">
                <section className="ac-patient-identity-card">
                    <div className="ac-patient-skeleton ac-patient-skeleton--avatar" />
                    <div className="ac-patient-identity-card__body">
                        <div className="ac-patient-skeleton ac-patient-skeleton--title" />
                        <div className="ac-patient-skeleton ac-patient-skeleton--text" />
                        <div className="ac-patient-skeleton ac-patient-skeleton--text short" />
                    </div>
                </section>
                <div className="ac-patient-metric-grid">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={`metric-${index}`} className="ac-patient-skeleton ac-patient-skeleton--metric" />
                    ))}
                </div>
                <div className="ac-patient-workspace-grid">
                    <aside className="ac-patient-context-shell">
                        <div className="ac-patient-skeleton ac-patient-skeleton--panel tall" />
                    </aside>
                    <section className="ac-patient-workspace-panel">
                        <div className="ac-patient-skeleton ac-patient-skeleton--card large" />
                        <div className="ac-patient-skeleton ac-patient-skeleton--card large" />
                    </section>
                </div>
            </main>
        </div>
    </div>
);

const PatientDetails = () => {
    const { user } = useContext(AuthContext);
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [notes, setNotes] = useState([]);
    const [strokeRisks, setStrokeRisks] = useState([]);
    const [emotions, setEmotions] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [newPrescription, setNewPrescription] = useState({
        date: '',
        medications: [{ medication: '', dosage: '', indicationssuggestions: '' }],
        observations: ''
    });
    const [searchDate, setSearchDate] = useState('');
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [periodFilter, setPeriodFilter] = useState('month');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [newNoteData, setNewNoteData] = useState({ title: '', content: '' });
    const [successMessage, setSuccessMessage] = useState('');
    const [prediction, setPrediction] = useState('Calculando previsão...');
    const [anomaly, setAnomaly] = useState(null);
    const [strokePrediction, setStrokePrediction] = useState('Calculando previsão...');
    const [strokeAnomaly, setStrokeAnomaly] = useState(null);
    const [vocalizations, setVocalizations] = useState([]);
    const [vocalizationPrediction, setVocalizationPrediction] = useState('Calculando previsão...');
    const [vocalizationAnomaly, setVocalizationAnomaly] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [showConsultationModal, setShowConsultationModal] = useState(false);
    const [abaActivities, setAbaActivities] = useState([]);
    const [abaOverviewData, setAbaOverviewData] = useState(null);
    const [abaChartData, setAbaChartData] = useState([]);
    const [showAbaModal, setShowAbaModal] = useState(false);
    const [abaLoading, setAbaLoading] = useState(false);
    const [abaError, setAbaError] = useState('');
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 1200));
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
        } catch (storageError) {
            return false;
        }
    });
    const [newConsultation, setNewConsultation] = useState({
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'Regular',
        status: 'Realizada',
        payment_method: 'Pix',
        payment_details: '',
        payment_status: 'Pago',
        value: '',
        notes: ''
    });

    const triggers = useMemo(() => [], []);

    const professionalName = normalizeText(user?.nome_completo || user?.name || user?.username || 'Profissional');
    const patientStatus = normalizeText(patient?.status || patient?.patient_status || patient?.situacao || '');
    const patientSupportLevel = normalizeText(patient?.nivel_suporte || patient?.support_level || '');
    const patientAge = formatAge(patient?.birthDate || patient?.birth_date);
    const patientDiagnosis = normalizeText(patient?.diagnosis || '');
    const patientSpecialInfo = normalizeText(patient?.specialInfo || patient?.special_info || '');

    const clearSuccessAfterDelay = useCallback(() => {
        window.setTimeout(() => setSuccessMessage(''), 2800);
    }, []);

    const handleBackToProfessional = useCallback(() => {
        if (user?.id) {
            navigate(`/professional-dashboard/${user.id}`);
            return;
        }

        navigate('/login');
    }, [navigate, user]);

    const fetchConsultations = useCallback(async () => {
        if (!patientId) {
            return;
        }

        try {
            const response = await apiClient.get(`/appointments/patient/${patientId}`);
            const normalizedConsultations = Array.isArray(response.data)
                ? response.data.map((record) => {
                    const normalizedPaymentMethod = normalizePaymentMethod(record.payment_method);
                    return {
                        ...record,
                        appointment_type: normalizeAppointmentType(record.appointment_type),
                        status: normalizeAppointmentStatus(record.status),
                        payment_method: normalizedPaymentMethod,
                        payment_details: normalizePaymentDetails(record.payment_details, record.payment_method),
                        payment_status: normalizePaymentStatus(record.payment_status),
                        notes: normalizeText(record.notes)
                    };
                })
                : [];

            setConsultations(normalizedConsultations);
        } catch (fetchError) {
            setError(normalizeText(fetchError.response?.data?.error || 'Falha ao buscar histórico de atendimentos.'));
        }
    }, [patientId]);

    const fetchAbaOverview = useCallback(async () => {
        if (!patientId) {
            return null;
        }

        const response = await apiClient.get(`/aba/overview/${patientId}`);
        const normalizedOverview = response.data ? {
            ...response.data,
            totalAtividades: toNumberOrNull(response.data.totalAtividades),
            taxaSucessoGeral: toNumberOrNull(response.data.taxaSucessoGeral),
            independenciaMedia: toNumberOrNull(response.data.independenciaMedia),
            ultimaSessao: response.data.ultimaSessao || null
        } : null;

        setAbaOverviewData(normalizedOverview);
        return normalizedOverview;
    }, [patientId]);

    const fetchAbaActivities = useCallback(async () => {
        if (!patientId) {
            return [];
        }

        const response = await apiClient.get(`/aba/activities/${patientId}`);
        const normalizedActivities = Array.isArray(response.data)
            ? response.data.map((activity) => ({
                ...activity,
                nome: normalizeText(activity.nome) || 'Atividade ABA',
                descricao: normalizeText(activity.descricao),
                utilizacao: toNumberOrNull(activity.utilizacao),
                taxaSucesso: toNumberOrNull(activity.taxaSucesso),
                totalTentativas: toNumberOrNull(activity.totalTentativas),
                ultimaSessao: activity.ultimaSessao || null
            }))
            : [];

        const chartPayload = normalizedActivities.map((activity) => ({
            id: activity.id,
            fullName: activity.nome,
            shortName: truncateAxisLabel(activity.nome, 16),
            sucesso: activity.taxaSucesso,
            utilizacao: activity.utilizacao,
            tentativas: activity.totalTentativas
        }));

        setAbaActivities(normalizedActivities);
        setAbaChartData(chartPayload);

        return normalizedActivities;
    }, [patientId]);

    const fetchAbaSectionData = useCallback(async () => {
        if (!patientId) {
            setAbaActivities([]);
            setAbaOverviewData(null);
            setAbaChartData([]);
            setAbaError('');
            return;
        }

        setAbaLoading(true);
        setAbaError('');

        const [overviewResult, activitiesResult] = await Promise.allSettled([
            fetchAbaOverview(),
            fetchAbaActivities()
        ]);

        if (overviewResult.status === 'rejected') {
            setAbaOverviewData(null);
        }

        if (activitiesResult.status === 'rejected') {
            setAbaActivities([]);
            setAbaChartData([]);
        }

        if (overviewResult.status === 'rejected' && activitiesResult.status === 'rejected') {
            setAbaError('Não foi possível carregar o acompanhamento ABA neste momento.');
        } else if (overviewResult.status === 'rejected' || activitiesResult.status === 'rejected') {
            setAbaError('Parte dos dados ABA não pôde ser atualizada. O restante foi exibido normalmente.');
        }

        setAbaLoading(false);
    }, [fetchAbaActivities, fetchAbaOverview, patientId]);

    const fetchPatientData = useCallback(async () => {
        if (!user || !patientId) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const [
                patientRes,
                notesRes,
                consultationsRes,
                vocalizationsRes,
                strokeRes,
                emotionsRes
            ] = await Promise.all([
                apiClient.get(`/professional/${user.id}/patients/${patientId}`),
                apiClient.get(`/professional/${user.id}/patients/${patientId}/notes`),
                apiClient.get(`/appointments/patient/${patientId}`),
                apiClient.get(`/vocalizations/${patientId}`),
                apiClient.get(`/stroke-risk/${patientId}`),
                apiClient.get(`/emotions/${patientId}`)
            ]);

            const normalizedConsultations = Array.isArray(consultationsRes.data)
                ? consultationsRes.data.map((record) => {
                    const normalizedPaymentMethod = normalizePaymentMethod(record.payment_method);
                    return {
                        ...record,
                        appointment_type: normalizeAppointmentType(record.appointment_type),
                        status: normalizeAppointmentStatus(record.status),
                        payment_method: normalizedPaymentMethod,
                        payment_details: normalizePaymentDetails(record.payment_details, record.payment_method),
                        payment_status: normalizePaymentStatus(record.payment_status),
                        notes: normalizeText(record.notes)
                    };
                })
                : [];

            const normalizedNotes = Array.isArray(notesRes.data)
                ? notesRes.data.map((note) => ({
                    ...note,
                    title: normalizeText(note.title),
                    content: normalizeText(note.content)
                }))
                : [];

            const normalizedVocalizations = Array.isArray(vocalizationsRes.data)
                ? vocalizationsRes.data.map((record) => {
                    let parsedAnalysis = {};

                    try {
                        if (record.analysis_data && typeof record.analysis_data === 'string' && record.analysis_data.startsWith('{')) {
                            parsedAnalysis = JSON.parse(record.analysis_data);
                        } else if (typeof record.analysis_data === 'object' && record.analysis_data !== null) {
                            parsedAnalysis = record.analysis_data;
                        }
                    } catch (parsingError) {
                        console.error('Falha ao fazer parse do JSON da vocalização:', record.analysis_data, parsingError);
                    }

                    return {
                        ...record,
                        analysis: parsedAnalysis,
                        analysis_data: parsedAnalysis
                    };
                })
                : [];

            const normalizedStrokeRisks = Array.isArray(strokeRes.data)
                ? strokeRes.data.map((record) => ({
                    ...record,
                    risk_level: normalizeRiskLevel(record.risk_level)
                }))
                : [];

            const normalizedEmotions = Array.isArray(emotionsRes.data)
                ? emotionsRes.data.map((record) => ({
                    ...record,
                    emotion: normalizeText(record.emotion)
                }))
                : [];

            setPatient(patientRes.data ? {
                ...patientRes.data,
                name: normalizeText(patientRes.data.name),
                diagnosis: normalizeText(patientRes.data.diagnosis),
                nivel_suporte: normalizeText(patientRes.data.nivel_suporte),
                specialInfo: normalizeText(patientRes.data.specialInfo),
                parent: normalizeText(patientRes.data.parent),
                status: normalizeText(patientRes.data.status)
            } : null);
            setNotes(normalizedNotes);
            setConsultations(normalizedConsultations);
            setVocalizations(normalizedVocalizations);
            setStrokeRisks(normalizedStrokeRisks);
            setEmotions(normalizedEmotions);
        } catch (fetchError) {
            console.error('Erro ao carregar dados do paciente:', fetchError);
            const errorMessage = normalizeText(fetchError.response?.data?.error || fetchError.message || 'Ocorreu um erro desconhecido.');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [navigate, patientId, user]);

    const handleFieldUpdate = async (appointmentId, field, value) => {
        const normalizedValue = field === 'status'
            ? normalizeAppointmentStatus(value)
            : field === 'payment_method'
                ? normalizePaymentMethod(value)
                : field === 'payment_status'
                    ? normalizePaymentStatus(value)
                    : normalizeText(value);

        setConsultations((previous) => previous.map((record) => (
            record.id === appointmentId ? { ...record, [field]: normalizedValue } : record
        )));

        try {
            await apiClient.put(`/appointments/${appointmentId}`, { field, value: normalizedValue });
            setSuccessMessage('Campo atualizado com sucesso!');
            clearSuccessAfterDelay();
        } catch (updateError) {
            setError(`Erro ao atualizar: ${normalizeText(updateError.response?.data?.error || updateError.message)}`);
            fetchConsultations();
        }
    };

    const handleConsultationInputChange = (event) => {
        const { name, value } = event.target;
        setNewConsultation((previous) => ({ ...previous, [name]: value }));
    };

    const handleSaveConsultation = async (event) => {
        event.preventDefault();

        if (!newConsultation.appointment_date || !newConsultation.appointment_time || !newConsultation.value) {
            setError('Data, hora e valor são campos obrigatórios.');
            return;
        }

        try {
            const consultationToSave = {
                ...newConsultation,
                patient_id: patientId,
                professional_id: user.id,
                payment_method: ['Outros', 'Plano de Saúde'].includes(newConsultation.payment_method)
                    ? newConsultation.payment_details
                    : newConsultation.payment_method
            };

            await apiClient.post('/appointments', consultationToSave);
            await fetchConsultations();
            setSuccessMessage('Atendimento registrado com sucesso!');
            setShowConsultationModal(false);
            setNewConsultation({
                appointment_date: '',
                appointment_time: '',
                appointment_type: 'Regular',
                status: 'Realizada',
                payment_method: 'Pix',
                payment_details: '',
                payment_status: 'Pago',
                value: '',
                notes: ''
            });
            setError('');
            clearSuccessAfterDelay();
        } catch (saveError) {
            setError(normalizeText(saveError.response?.data?.error || 'Falha ao registrar atendimento.'));
        }
    };

    const handleSaveNote = async () => {
        if (!newNoteData.title || !newNoteData.content) {
            setError('Por favor, preencha o título e o conteúdo da nota.');
            return;
        }

        try {
            const response = await apiClient.post(`/professional/${user.id}/patients/${patientId}/notes`, newNoteData);
            const normalizedNote = {
                ...response.data,
                title: normalizeText(response.data.title),
                content: normalizeText(response.data.content)
            };

            setNotes((previous) => [...previous, normalizedNote]);
            setShowNoteModal(false);
            setNewNoteData({ title: '', content: '' });
            setError('');
            setSuccessMessage('Nota gravada com sucesso!');
            clearSuccessAfterDelay();
        } catch (saveError) {
            setError(normalizeText(saveError.response?.data?.error || 'Falha ao salvar nota.'));
        }
    };

    const handleOpenMonitoringTool = useCallback((route) => {
        const monitoringToolUrl = new URL(window.location.origin);
        monitoringToolUrl.pathname = route;
        monitoringToolUrl.searchParams.append('patientId', patientId);
        const targetWindowName = MONITORING_WINDOW_NAMES[route]
            || `autisconnect-${route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`;
        const openedWindow = window.open(monitoringToolUrl.toString(), targetWindowName);

        if (openedWindow) {
            openedWindow.focus();
        }
    }, [patientId]);

    const handleOpenAbaModule = useCallback(() => {
        if (!patientId) {
            return;
        }

        handleOpenMonitoringTool(`${ROUTES.ABA_MODULE}/${patientId}`);
    }, [handleOpenMonitoringTool, patientId]);

    const handlePrescriptionChange = (event, index) => {
        const { name, value } = event.target;

        if (name === 'observations') {
            setNewPrescription((previous) => ({ ...previous, observations: value }));
            return;
        }

        const updatedMedications = [...newPrescription.medications];
        updatedMedications[index] = { ...updatedMedications[index], [name]: value };
        setNewPrescription((previous) => ({ ...previous, medications: updatedMedications }));
    };

    const handleAddMedication = () => {
        setNewPrescription((previous) => ({
            ...previous,
            medications: [...previous.medications, { medication: '', dosage: '', indicationssuggestions: '' }]
        }));
    };

    const handleRemoveMedication = (index) => {
        setNewPrescription((previous) => ({
            ...previous,
            medications: previous.medications.filter((_, currentIndex) => currentIndex !== index)
        }));
    };

    const handleSavePrescription = () => {
        if (!newPrescription.date || newPrescription.medications.some((medication) => !medication.medication || !medication.dosage)) {
            setError('Por favor, preencha todos os campos obrigatórios da prescrição.');
            return;
        }

        const newPrescriptionData = {
            id: prescriptions.length + 1,
            date: newPrescription.date,
            medications: newPrescription.medications.map((medication) => ({
                ...medication,
                medication: normalizeText(medication.medication),
                dosage: normalizeText(medication.dosage),
                indicationssuggestions: normalizeText(medication.indicationssuggestions)
            })),
            observations: normalizeText(newPrescription.observations)
        };

        setPrescriptions((previous) => [...previous, newPrescriptionData]);
        setNewPrescription({
            date: '',
            medications: [{ medication: '', dosage: '', indicationssuggestions: '' }],
            observations: ''
        });
        setSuccessMessage('Prescrição registrada com sucesso!');
        clearSuccessAfterDelay();
    };

    const handleDeletePrescription = (prescriptionId) => {
        setPrescriptions((previous) => previous.filter((prescription) => prescription.id !== prescriptionId));
        setSuccessMessage('Prescrição removida com sucesso!');
        clearSuccessAfterDelay();
    };

    const handleSearchDate = (event) => {
        setSearchDate(event.target.value);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleActiveTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setShowMobileSidebar(false);
    };

    useEffect(() => {
        fetchPatientData();
    }, [fetchPatientData]);

    useEffect(() => {
        fetchAbaSectionData();
    }, [fetchAbaSectionData]);

    useEffect(() => {
        if (patientId && emotions.length > 0) {
            const fetchAIAnalysis = async () => {
                try {
                    const aiResponse = await apiClient.get(`/iaemotions/analysis/${patientId}?type=emotion`);
                    setPrediction(normalizeText(aiResponse.data.predictionText || 'Previsão gerada com sucesso.'));
                    setAnomaly(aiResponse.data.anomaly || null);
                } catch (aiError) {
                    console.error('Erro ao buscar análise de IA de emoções:', aiError);
                    setPrediction('Não foi possível conectar ao serviço de análise de emoções.');
                }
            };

            fetchAIAnalysis();
        }
    }, [emotions.length, patientId]);

    useEffect(() => {
        if (patientId && strokeRisks.length > 0) {
            const fetchStrokeAIAnalysis = async () => {
                try {
                    const aiResponse = await apiClient.get(`/iaemotions/analysis/${patientId}?type=stroke`);
                    setStrokePrediction(normalizeText(aiResponse.data.predictionText || 'Previsão de risco gerada.'));
                    setStrokeAnomaly(aiResponse.data.anomaly || null);
                } catch (aiError) {
                    console.error('Erro ao buscar análise de IA para risco de AVC:', aiError);
                    setStrokePrediction('Não foi possível conectar ao serviço de análise de risco.');
                }
            };

            fetchStrokeAIAnalysis();
        }
    }, [patientId, strokeRisks.length]);

    useEffect(() => {
        if (patientId && vocalizations.length > 0) {
            const fetchVocalizationAI = async () => {
                try {
                    const response = await apiClient.get(`/iavocalizations/analysis/${patientId}`);
                    setVocalizationPrediction(normalizeText(response.data.predictionText || 'Previsão gerada.'));
                    setVocalizationAnomaly(response.data.anomaly || null);
                } catch (aiError) {
                    console.error('Erro ao buscar IA de vocalizações:', aiError);
                    setVocalizationPrediction('Não foi possível conectar ao serviço de análise de vocalizações.');
                }
            };

            fetchVocalizationAI();
        }
    }, [patientId, vocalizations.length]);

    useEffect(() => {
        if (searchDate) {
            setFilteredPrescriptions(prescriptions.filter((prescription) => prescription.date === searchDate));
            return;
        }

        setFilteredPrescriptions(prescriptions);
    }, [prescriptions, searchDate]);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1200);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
        } catch (storageError) {
            console.warn('Não foi possível salvar a preferência da sidebar.', storageError);
        }
    }, [isSidebarCollapsed]);

    const filteredEmotions = useMemo(
        () => filterRecordsByPeriod(emotions, periodFilter, (record) => record.timestamp),
        [emotions, periodFilter]
    );
    const filteredStrokeRisks = useMemo(
        () => filterRecordsByPeriod(strokeRisks, periodFilter, (record) => record.date),
        [periodFilter, strokeRisks]
    );
    const filteredVocalizations = useMemo(
        () => filterRecordsByPeriod(vocalizations, periodFilter, (record) => record.date),
        [periodFilter, vocalizations]
    );
    const filteredConsultations = useMemo(
        () => filterRecordsByPeriod(consultations, periodFilter, (record) => record.appointment_date),
        [consultations, periodFilter]
    );

    const sortedNotes = useMemo(() => (
        [...notes].sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    ), [notes]);

    const sortedConsultations = useMemo(() => (
        [...consultations].sort((a, b) => {
            const dateA = safeDateFromRecord(a.appointment_date || a.date, a.appointment_time || a.time);
            const dateB = safeDateFromRecord(b.appointment_date || b.date, b.appointment_time || b.time);

            return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
        })
    ), [consultations]);

    const recentConsultations = useMemo(() => (
        [...filteredConsultations].sort((a, b) => {
            const dateA = safeDateFromRecord(a.appointment_date || a.date, a.appointment_time || a.time);
            const dateB = safeDateFromRecord(b.appointment_date || b.date, b.appointment_time || b.time);

            return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        }).slice(0, 5)
    ), [filteredConsultations]);

    const nextConsultation = useMemo(() => {
        const now = new Date();
        const upcoming = sortedConsultations.filter((consultation) => {
            const appointmentDate = safeDateFromRecord(
                consultation.appointment_date || consultation.date,
                consultation.appointment_time || consultation.time
            );
            return appointmentDate && appointmentDate >= now;
        });

        return upcoming[0] || sortedConsultations[0] || null;
    }, [sortedConsultations]);

    const latestEmotionRecord = useMemo(() => (
        [...filteredEmotions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null
    ), [filteredEmotions]);

    const latestStrokeRecord = useMemo(() => (
        [...filteredStrokeRisks].sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null
    ), [filteredStrokeRisks]);

    const latestVocalizationRecord = useMemo(() => (
        [...filteredVocalizations].sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null
    ), [filteredVocalizations]);

    const emotionAnalysis = useMemo(() => analyzeEmotionPatterns(filteredEmotions), [filteredEmotions]);
    const strokeRiskAnalysis = useMemo(() => analyzeStrokeRiskPatterns(filteredStrokeRisks), [filteredStrokeRisks]);
    const vocalizationAnalysis = useMemo(() => analyzeVocalizationPatterns(filteredVocalizations), [filteredVocalizations]);

    const chartData = useMemo(
        () => processChartData(filteredStrokeRisks, filteredEmotions, filteredVocalizations),
        [filteredEmotions, filteredStrokeRisks, filteredVocalizations]
    );

    const lineOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: false }
        },
        scales: {
            x: {
                grid: { color: 'rgba(148, 163, 184, 0.12)' },
                ticks: { color: '#64748b' }
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(148, 163, 184, 0.16)' }
            }
        }
    }), []);

    const barOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(148, 163, 184, 0.16)' }
            },
            y: {
                ticks: { color: '#64748b' },
                grid: { display: false }
            }
        }
    }), []);

    const pieOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    color: '#475569',
                    padding: 18
                }
            }
        }
    }), []);

    const vocalizationLineOptions = useMemo(() => ({
        ...lineOptions,
        scales: {
            x: lineOptions.scales.x,
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Diversidade Léxica (%)' },
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(148, 163, 184, 0.16)' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Contagem de Palavras' },
                ticks: { color: '#64748b' },
                grid: { drawOnChartArea: false }
            }
        }
    }), [lineOptions]);

    const abaActivityCount = useMemo(() => {
        const overviewTotal = toNumberOrNull(abaOverviewData?.totalAtividades);
        if (overviewTotal !== null) {
            return overviewTotal;
        }

        return abaActivities.length;
    }, [abaActivities.length, abaOverviewData?.totalAtividades]);

    const sortedAbaActivities = useMemo(() => (
        [...abaActivities].sort((left, right) => {
            const leftDate = left.ultimaSessao ? new Date(left.ultimaSessao).getTime() : 0;
            const rightDate = right.ultimaSessao ? new Date(right.ultimaSessao).getTime() : 0;

            if (rightDate !== leftDate) {
                return rightDate - leftDate;
            }

            return String(left.nome || '').localeCompare(String(right.nome || ''), 'pt-BR');
        })
    ), [abaActivities]);

    const abaSuccessRate = toNumberOrNull(abaOverviewData?.taxaSucessoGeral);
    const abaIndependenceRate = toNumberOrNull(abaOverviewData?.independenciaMedia);
    const abaLastSessionLabel = formatAbaSessionDate(abaOverviewData?.ultimaSessao);

    const abaBestActivity = useMemo(() => (
        [...sortedAbaActivities]
            .filter((activity) => toNumberOrNull(activity.taxaSucesso) !== null)
            .sort((left, right) => (
                (toNumberOrNull(right.taxaSucesso) || 0) - (toNumberOrNull(left.taxaSucesso) || 0)
            ))[0] || null
    ), [sortedAbaActivities]);

    const abaAttentionActivity = useMemo(() => (
        [...sortedAbaActivities]
            .filter((activity) => (
                toNumberOrNull(activity.taxaSucesso) !== null
                && (toNumberOrNull(activity.totalTentativas) || 0) > 0
            ))
            .sort((left, right) => (
                (toNumberOrNull(left.taxaSucesso) || 0) - (toNumberOrNull(right.taxaSucesso) || 0)
            ))[0] || null
    ), [sortedAbaActivities]);

    const abaMostUsedActivity = useMemo(() => (
        [...sortedAbaActivities]
            .filter((activity) => (
                toNumberOrNull(activity.totalTentativas) !== null
                || toNumberOrNull(activity.utilizacao) !== null
            ))
            .sort((left, right) => {
                const rightVolume = toNumberOrNull(right.totalTentativas) ?? toNumberOrNull(right.utilizacao) ?? 0;
                const leftVolume = toNumberOrNull(left.totalTentativas) ?? toNumberOrNull(left.utilizacao) ?? 0;
                return rightVolume - leftVolume;
            })[0] || null
    ), [sortedAbaActivities]);

    const abaRecentHistory = useMemo(() => sortedAbaActivities.slice(0, 4), [sortedAbaActivities]);

    const abaSummaryText = useMemo(() => {
        if (abaActivityCount === 0) {
            return 'Ainda não há atividades ABA registradas para este paciente. Assim que o acompanhamento começar, os indicadores e o histórico aparecerão aqui.';
        }

        if (abaBestActivity && abaAttentionActivity && abaBestActivity.id !== abaAttentionActivity.id) {
            return `${abaBestActivity.nome} concentra o melhor desempenho registrado, enquanto ${abaAttentionActivity.nome} merece leitura mais próxima pelas métricas atuais da ABA.`;
        }

        if (abaBestActivity) {
            return `${abaBestActivity.nome} é a atividade com melhor resposta registrada neste recorte, com leitura baseada somente nos dados já coletados pela ABA.`;
        }

        return 'Use este painel para acompanhar evolução, volume de tentativas e sinais de independência sem sair da central do paciente.';
    }, [abaActivityCount, abaAttentionActivity, abaBestActivity]);

    const abaSuccessChartData = useMemo(() => {
        const validRows = abaChartData.filter((item) => toNumberOrNull(item.sucesso) !== null);

        if (validRows.length === 0) {
            return null;
        }

        return {
            labels: validRows.map((item) => item.fullName),
            datasets: [
                {
                    label: 'Taxa de sucesso',
                    data: validRows.map((item) => item.sucesso),
                    backgroundColor: 'rgba(37, 99, 235, 0.82)',
                    borderColor: '#2563EB',
                    borderWidth: 1,
                    borderRadius: 14,
                    maxBarThickness: 26
                }
            ]
        };
    }, [abaChartData]);

    const abaVolumeMetricKey = useMemo(() => (
        abaChartData.some((item) => toNumberOrNull(item.tentativas) !== null)
            ? 'tentativas'
            : 'utilizacao'
    ), [abaChartData]);

    const abaVolumeMetricLabel = abaVolumeMetricKey === 'tentativas' ? 'Tentativas registradas' : 'Utilização das atividades';

    const abaVolumeChartData = useMemo(() => {
        const validRows = abaChartData.filter((item) => toNumberOrNull(item[abaVolumeMetricKey]) !== null);

        if (validRows.length === 0) {
            return null;
        }

        return {
            labels: validRows.map((item) => item.fullName),
            datasets: [
                {
                    label: abaVolumeMetricLabel,
                    data: validRows.map((item) => item[abaVolumeMetricKey]),
                    backgroundColor: abaVolumeMetricKey === 'tentativas' ? 'rgba(6, 182, 212, 0.78)' : 'rgba(124, 58, 237, 0.76)',
                    borderColor: abaVolumeMetricKey === 'tentativas' ? '#06B6D4' : '#7C3AED',
                    borderWidth: 1,
                    borderRadius: 12,
                    maxBarThickness: 44
                }
            ]
        };
    }, [abaChartData, abaVolumeMetricKey, abaVolumeMetricLabel]);

    const abaSuccessChartOptions = useMemo(() => ({
        ...barOptions,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `Sucesso: ${formatMetricPercent(context.parsed.x, 1)}`
                }
            }
        },
        scales: {
            x: {
                ...barOptions.scales.x,
                max: 100,
                ticks: {
                    color: '#64748b',
                    callback: (value) => `${value}%`
                }
            },
            y: {
                ...barOptions.scales.y,
                ticks: {
                    color: '#64748b',
                    callback: function tickCallback(value) {
                        return truncateAxisLabel(this.getLabelForValue(value), 18);
                    }
                }
            }
        }
    }), [barOptions]);

    const abaVolumeChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${abaVolumeMetricLabel}: ${context.parsed.y}`
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#64748b',
                    maxRotation: 0,
                    callback: function tickCallback(value) {
                        return truncateAxisLabel(this.getLabelForValue(value), 12);
                    }
                },
                grid: { display: false }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#64748b',
                    precision: 0
                },
                grid: { color: 'rgba(148, 163, 184, 0.16)' }
            }
        }
    }), [abaVolumeMetricLabel]);

    const overviewAlerts = useMemo(() => {
        const alerts = [];

        if (anomaly?.detected) {
            alerts.push({
                tone: 'info',
                title: 'Anomalia emocional detectada',
                description: normalizeText(anomaly.message)
            });
        }

        if (strokeRiskAnalysis?.hasRecentHighRisk) {
            alerts.push({
                tone: 'critical',
                title: 'Risco elevado na última semana',
                description: 'Foram identificados registros de risco alto no período recente e o caso merece atenção clínica.'
            });
        }

        if (strokeAnomaly?.detected) {
            alerts.push({
                tone: 'critical',
                title: 'Anomalia no monitoramento facial',
                description: normalizeText(strokeAnomaly.message)
            });
        }

        if (vocalizationAnomaly?.detected) {
            alerts.push({
                tone: 'warning',
                title: 'Anomalia em vocalizações',
                description: normalizeText(vocalizationAnomaly.message)
            });
        }

        if (triggers.length > 0) {
            alerts.push({
                tone: 'warning',
                title: 'Gatilhos registrados',
                description: `${triggers.length} gatilho(s) identificado(s) no histórico atual.`
            });
        }

        if ((toNumberOrNull(abaAttentionActivity?.taxaSucesso) || 0) > 0 && (toNumberOrNull(abaAttentionActivity?.taxaSucesso) || 0) <= 45) {
            alerts.push({
                tone: 'warning',
                title: 'ABA com menor taxa de resposta',
                description: `${abaAttentionActivity.nome} registrou ${formatMetricPercent(abaAttentionActivity.taxaSucesso, 1)} de sucesso nas atividades já lançadas.`
            });
        }

        return alerts;
    }, [abaAttentionActivity, anomaly, strokeAnomaly, strokeRiskAnalysis, triggers.length, vocalizationAnomaly]);

    const emotionSummary = useMemo(() => generateAISummary(emotionAnalysis), [emotionAnalysis]);
    const strokeSummary = useMemo(() => generateStrokeAISummary(strokeRiskAnalysis), [strokeRiskAnalysis]);
    const vocalizationSummary = useMemo(() => generateVocalizationAISummary(vocalizationAnalysis), [vocalizationAnalysis]);

    const mobileNavValue = activeTab;
    const workspaceMeta = SECTION_META[activeTab] || SECTION_META.overview;
    const greeting = getGreeting();
    const todayLabel = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
    }).format(new Date());

    const renderGlobalSidebar = (mobile = false) => {
        const collapsed = !mobile && isDesktop && isSidebarCollapsed;

        return (
            <div className={`ac-patient-global-sidebar${collapsed ? ' ac-patient-global-sidebar--collapsed' : ''}${mobile ? ' ac-patient-global-sidebar--mobile' : ''}`}>
                <div className="ac-patient-global-sidebar__brand">
                    <div className="ac-patient-global-sidebar__brand-row">
                        <img src={logonovo} alt="AutisConnect" className="ac-patient-global-sidebar__logo" />
                        {!mobile ? (
                            <button
                                type="button"
                                className="ac-patient-global-sidebar__collapse"
                                aria-label={collapsed ? 'Expandir navegação global' : 'Recolher navegação global'}
                                onClick={() => setIsSidebarCollapsed((previous) => !previous)}
                            >
                                {collapsed ? <ChevronRight /> : <ChevronLeft />}
                            </button>
                        ) : null}
                    </div>
                    <div className="ac-patient-global-sidebar__ribbon" aria-hidden="true" />
                </div>

                <div className="ac-patient-global-sidebar__body">
                    <div className="ac-patient-global-sidebar__group">
                        {!collapsed ? <span className="ac-patient-global-sidebar__label">Navegação</span> : null}
                        <button type="button" className="ac-patient-global-sidebar__item" onClick={handleBackToProfessional}>
                            <span className="ac-patient-global-sidebar__icon"><ArrowLeft /></span>
                            {!collapsed ? <span>Dashboard Profissional</span> : null}
                        </button>
                        <div className="ac-patient-global-sidebar__item is-active">
                            <span className="ac-patient-global-sidebar__icon"><PersonCircle /></span>
                            {!collapsed ? <span>Patient Intelligence</span> : null}
                        </div>
                    </div>

                    <div className="ac-patient-global-sidebar__group">
                        {!collapsed ? <span className="ac-patient-global-sidebar__label">Contexto</span> : null}
                        <div className="ac-patient-global-sidebar__context">
                            <strong>{patient?.name || 'Paciente'}</strong>
                            {!collapsed ? <span>{PERIOD_LABELS[periodFilter]}</span> : null}
                        </div>
                    </div>
                </div>

                <div className="ac-patient-global-sidebar__footer">
                    <div className="ac-patient-global-sidebar__user">
                        <span className="ac-patient-global-sidebar__avatar">{getInitials(professionalName)}</span>
                        {!collapsed ? (
                            <div>
                                <strong>{professionalName}</strong>
                                <span>Profissional responsável</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    const renderPatientNavigation = () => (
        <div className="ac-patient-context-nav">
            {PATIENT_NAVIGATION_GROUPS.map((group) => (
                <div key={group.label} className="ac-patient-context-nav__group">
                    <span className="ac-patient-context-nav__label">{group.label}</span>
                    <div className="ac-patient-context-nav__items">
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.key;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    className={`ac-patient-context-nav__item${isActive ? ' is-active' : ''}`}
                                    onClick={() => handleActiveTabChange(item.key)}
                                >
                                    <span className="ac-patient-context-nav__icon"><Icon /></span>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderOverview = () => (
        <div className="ac-patient-overview">
            <div className="ac-patient-metric-grid">
                <MetricCard
                    label="Estado Emocional"
                    value={emotionAnalysis ? translateEmotion(emotionAnalysis.dominantEmotion) : 'Sem dados'}
                    hint={latestEmotionRecord ? `Última detecção • ${formatDate(latestEmotionRecord.timestamp)}` : 'Nenhum registro emocional disponível'}
                    tone="emotion"
                />
                <MetricCard
                    label="Assimetria Facial"
                    value={strokeRiskAnalysis ? strokeRiskAnalysis.lastRiskLevel : 'Sem dados'}
                    hint={strokeRiskAnalysis ? `Índice ${strokeRiskAnalysis.lastAsymmetryIndex}` : 'Nenhuma medição disponível'}
                    tone="risk"
                />
                <MetricCard
                    label="Vocalizações"
                    value={vocalizationAnalysis ? vocalizationAnalysis.totalRecordings : 'Sem dados'}
                    hint={vocalizationAnalysis ? `Média ${vocalizationAnalysis.averageWordCount} palavras` : 'Nenhuma gravação disponível'}
                    tone="voice"
                />
                <MetricCard
                    label="Próximo Atendimento"
                    value={nextConsultation ? formatDate(nextConsultation.appointment_date || nextConsultation.date) : 'Sem agenda'}
                    hint={nextConsultation ? `${formatTime(nextConsultation.appointment_time || nextConsultation.time)} • ${nextConsultation.status}` : 'Nenhum atendimento futuro registrado'}
                    tone="schedule"
                    action={nextConsultation ? <StatusPill value={nextConsultation.appointment_type} /> : null}
                />
            </div>

            {overviewAlerts.length > 0 ? (
                <div className="ac-patient-alert-grid">
                    {overviewAlerts.map((alertItem) => (
                        <AlertCard
                            key={`${alertItem.title}-${alertItem.description}`}
                            tone={alertItem.tone}
                            title={alertItem.title}
                            description={alertItem.description}
                        />
                    ))}
                </div>
            ) : null}

            <div className="ac-patient-overview-grid">
                <div className="ac-patient-overview-main">
                    <ShellCard
                        eyebrow="Resumo Inteligente"
                        title="Leitura 360° do Paciente"
                        subtitle="Síntese dos insights já existentes no sistema, sem criar conclusões clínicas fictícias."
                    >
                        <div className="ac-patient-insight-stack">
                            <article className="ac-patient-insight-card">
                                <header>
                                    <div>
                                        <span className="ac-patient-insight-card__badge">IA • Emoções</span>
                                        <h4>Emoções</h4>
                                    </div>
                                    <EmojiSmile />
                                </header>
                                <p>{renderRichSummary(emotionSummary)}</p>
                            </article>
                            <article className="ac-patient-insight-card">
                                <header>
                                    <div>
                                        <span className="ac-patient-insight-card__badge">IA • Risco</span>
                                        <h4>Monitoramento Facial</h4>
                                    </div>
                                    <ShieldCheck />
                                </header>
                                <p>{renderRichSummary(strokeSummary)}</p>
                            </article>
                            <article className="ac-patient-insight-card">
                                <header>
                                    <div>
                                        <span className="ac-patient-insight-card__badge">IA • Vocalizações</span>
                                        <h4>Comunicação</h4>
                                    </div>
                                    <Mic />
                                </header>
                                <p>{renderRichSummary(vocalizationSummary)}</p>
                            </article>
                        </div>
                    </ShellCard>

                    <div className="ac-patient-chart-grid">
                        <ShellCard
                            eyebrow="Evolução"
                            title="Emoções ao Longo do Tempo"
                            subtitle={`Leitura do período selecionado: ${PERIOD_LABELS[periodFilter]}.`}
                            bodyClassName="ac-patient-chart-card"
                        >
                            {chartData.emotionData?.labels?.length > 0 ? (
                                <div className="ac-patient-chart">
                                    <Line data={chartData.emotionData} options={lineOptions} />
                                </div>
                            ) : (
                                <EmptyState
                                    title="Nenhum registro emocional"
                                    description="Nenhum registro emocional disponível para o período selecionado."
                                />
                            )}
                        </ShellCard>

                        <ShellCard
                            eyebrow="Evolução"
                            title="Índice de Assimetria Facial"
                            subtitle="Indicadores de monitoramento não substituem avaliação médica."
                            bodyClassName="ac-patient-chart-card"
                        >
                            {chartData.strokeData?.labels?.length > 0 ? (
                                <div className="ac-patient-chart">
                                    <Line data={chartData.strokeData} options={lineOptions} />
                                </div>
                            ) : (
                                <EmptyState
                                    title="Nenhuma medição disponível"
                                    description="Nenhum registro de risco facial foi encontrado para o período selecionado."
                                />
                            )}
                        </ShellCard>
                    </div>
                </div>

                <div className="ac-patient-overview-side">
                    <ShellCard
                        eyebrow="Agenda"
                        title="Próximo Atendimento"
                        subtitle="Resumo rápido do próximo compromisso clínico registrado."
                    >
                        {nextConsultation ? (
                            <div className="ac-patient-summary-block">
                                <div className="ac-patient-summary-block__top">
                                    <strong>{formatDate(nextConsultation.appointment_date || nextConsultation.date)}</strong>
                                    <StatusPill value={nextConsultation.status} />
                                </div>
                                <p>{formatTime(nextConsultation.appointment_time || nextConsultation.time)} • {nextConsultation.appointment_type}</p>
                                <small>{nextConsultation.notes || 'Sem observações adicionais registradas.'}</small>
                            </div>
                        ) : (
                            <EmptyState
                                title="Sem agendamento futuro"
                                description="Nenhum atendimento futuro foi identificado para este paciente."
                            />
                        )}
                    </ShellCard>

                    <ShellCard
                        eyebrow="Acompanhamento"
                        title="Acompanhamento ABA"
                        subtitle="Resumo contextual da evolução ABA dentro da central do paciente."
                        actions={(
                            <Button className="ac-patient-secondary-button" onClick={() => handleActiveTabChange('aba')}>
                                Ver evolução
                            </Button>
                        )}
                    >
                        {abaLoading ? (
                            <div className="ac-patient-aba-loading">
                                <div className="ac-patient-aba-summary-grid">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={`aba-overview-skeleton-${index}`} className="ac-patient-skeleton ac-patient-skeleton--metric" />
                                    ))}
                                </div>
                            </div>
                        ) : abaActivityCount > 0 ? (
                            <div className="ac-patient-aba-summary-card">
                                <div className="ac-patient-aba-summary-grid">
                                    <article className="ac-patient-aba-summary-stat">
                                        <span>Atividades</span>
                                        <strong>{formatMetricCount(abaActivityCount)}</strong>
                                    </article>
                                    <article className="ac-patient-aba-summary-stat">
                                        <span>Sucesso geral</span>
                                        <strong>{formatMetricPercent(abaSuccessRate, 1)}</strong>
                                    </article>
                                    <article className="ac-patient-aba-summary-stat">
                                        <span>Independência</span>
                                        <strong>{formatMetricPercent(abaIndependenceRate, 0)}</strong>
                                    </article>
                                </div>
                                <p className="ac-patient-summary-text">{abaSummaryText}</p>
                                <div className="ac-patient-aba-summary-footer">
                                    <small>Última sessão ABA: {abaLastSessionLabel}</small>
                                    <button type="button" className="ac-patient-aba-link" onClick={() => handleActiveTabChange('aba')}>
                                        Ver ABA
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="Nenhuma atividade ABA registrada"
                                description="Os dados aparecerão quando atividades forem adicionadas ao acompanhamento."
                            />
                        )}
                    </ShellCard>

                    <ShellCard
                        eyebrow="Notas recentes"
                        title="Últimas Observações"
                        subtitle="Acompanhe rapidamente os últimos registros escritos do paciente."
                        actions={(
                            <Button className="ac-patient-secondary-button" onClick={() => setShowNoteModal(true)}>
                                Adicionar nota
                            </Button>
                        )}
                    >
                        {sortedNotes.length > 0 ? (
                            <div className="ac-patient-note-stack">
                                {sortedNotes.slice(0, 3).map((note) => (
                                    <article key={note.id} className="ac-patient-note-card">
                                        <strong>{note.title}</strong>
                                        <p>{note.content}</p>
                                        <small>{formatDate(note.createdAt || note.created_at)}</small>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Nenhuma nota registrada"
                                description="As notas clínicas aparecerão aqui assim que forem adicionadas."
                            />
                        )}
                    </ShellCard>

                    <ShellCard
                        eyebrow="Ferramentas"
                        title="Monitoramentos Ativos"
                        subtitle="Atalhos diretos para os módulos de coleta e observação."
                    >
                        <div className="ac-patient-quick-tools">
                            <button type="button" className="ac-patient-quick-tool" onClick={() => handleOpenMonitoringTool(ROUTES.EMOTION_DETECTOR)}>
                                <EmojiSmile />
                                <span>Emoções</span>
                            </button>
                            <button type="button" className="ac-patient-quick-tool" onClick={() => handleOpenMonitoringTool(ROUTES.STROKE_RISK_MONITOR)}>
                                <ShieldCheck />
                                <span>AVC</span>
                            </button>
                            <button type="button" className="ac-patient-quick-tool" onClick={() => handleOpenMonitoringTool(ROUTES.TRIGGER_RECORDER)}>
                                <Mic />
                                <span>Vocalizações</span>
                            </button>
                            <button type="button" className="ac-patient-quick-tool" onClick={() => handleOpenMonitoringTool(`${ROUTES.ABA_MODULE}/${patientId}`)}>
                                <ClipboardPulse />
                                <span>ABA</span>
                            </button>
                        </div>
                    </ShellCard>
                </div>
            </div>
        </div>
    );

    const renderEmotionSection = () => (
        <div className="ac-patient-detail-grid">
            <ShellCard
                eyebrow="IA Nível 2"
                title="Resumo Inteligente de Emoções"
                subtitle="Leitura assistida baseada nos padrões locais identificados neste período."
            >
                <p className="ac-patient-summary-text">{renderRichSummary(emotionSummary)}</p>
            </ShellCard>

            <div className="ac-patient-chart-grid">
                <ShellCard
                    eyebrow="Visualização"
                    title="Evolução de Emoções"
                    subtitle="Distribuição temporal dos registros emocionais."
                    bodyClassName="ac-patient-chart-card"
                >
                    {chartData.emotionData?.labels?.length > 0 ? (
                        <div className="ac-patient-chart">
                            <Line data={chartData.emotionData} options={lineOptions} />
                        </div>
                    ) : (
                        <EmptyState
                            title="Sem dados emocionais"
                            description="Nenhum registro emocional disponível para este período."
                        />
                    )}
                </ShellCard>

                <ShellCard
                    eyebrow="Visualização"
                    title="Distribuição de Emoções"
                    subtitle="Participação percentual das emoções registradas."
                    bodyClassName="ac-patient-chart-card"
                >
                    {chartData.emotionDistributionData?.datasets?.[0]?.data?.some((item) => item > 0) ? (
                        <div className="ac-patient-chart">
                            <Pie data={chartData.emotionDistributionData} options={pieOptions} />
                        </div>
                    ) : (
                        <EmptyState
                            title="Sem distribuição disponível"
                            description="Não há dados para exibir a distribuição emocional neste período."
                        />
                    )}
                </ShellCard>
            </div>

            <div className="ac-patient-two-column">
                <ShellCard
                    eyebrow="IA Nível 1"
                    title="Padrões Emocionais"
                    subtitle="Distribuição percentual, tendências diárias e picos observados."
                >
                    {emotionAnalysis ? (
                        <div className="ac-patient-two-column">
                            <div>
                                <h4 className="ac-patient-subsection-title">Distribuição Percentual</h4>
                                <Table responsive className="ac-patient-table ac-patient-table--compact">
                                    <tbody>
                                        {emotionAnalysis.distribution.map((item) => (
                                            <tr key={item.emotion}>
                                                <td>{translateEmotion(item.emotion)}</td>
                                                <td className="text-end"><strong>{item.percentage}%</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            <div className="ac-patient-insight-list">
                                <div className="ac-patient-insight-list__item">
                                    <span>Emoção predominante</span>
                                    <StatusPill value={translateEmotion(emotionAnalysis.dominantEmotion)} />
                                </div>
                                <div className="ac-patient-insight-list__item">
                                    <span>Tendência feliz</span>
                                    <strong>{emotionAnalysis.trend.happy >= 0 ? '+' : ''}{emotionAnalysis.trend.happy}</strong>
                                </div>
                                <div className="ac-patient-insight-list__item">
                                    <span>Tendência tristeza</span>
                                    <strong>{emotionAnalysis.trend.sad >= 0 ? '+' : ''}{emotionAnalysis.trend.sad}</strong>
                                </div>
                                <div className="ac-patient-insight-list__item">
                                    <span>Tendência raiva</span>
                                    <strong>{emotionAnalysis.trend.angry >= 0 ? '+' : ''}{emotionAnalysis.trend.angry}</strong>
                                </div>
                                <div className="ac-patient-insight-list__item">
                                    <span>Volatilidade</span>
                                    <strong>{emotionAnalysis.volatilityText}</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyState
                            title="Sem análise de padrões"
                            description="Ainda não há dados suficientes para gerar a leitura de padrões emocionais."
                        />
                    )}
                </ShellCard>

                <ShellCard
                    eyebrow="IA Nível 3"
                    title="Projeções e Anomalias"
                    subtitle="Sinais preditivos assistivos para suporte à interpretação."
                >
                    <div className="ac-patient-summary-block">
                        <strong>Próximas 24 horas</strong>
                        <p>{normalizeText(prediction)}</p>
                    </div>
                    {anomaly?.detected ? (
                        <AlertCard
                            tone="critical"
                            title="Anomalia detectada"
                            description={normalizeText(anomaly.message)}
                        />
                    ) : (
                        <EmptyState
                            title="Nenhuma anomalia sinalizada"
                            description="Até o momento, a análise de IA não destacou anomalias emocionais relevantes."
                        />
                    )}
                </ShellCard>
            </div>

            {emotionAnalysis?.emotionalPeaks?.length > 0 ? (
                <ShellCard
                    eyebrow="Alertas"
                    title="Picos Emocionais"
                    subtitle="Datas com volume acima do padrão esperado para o período."
                >
                    <div className="ac-patient-alert-grid">
                        {emotionAnalysis.emotionalPeaks.map((peak) => (
                            <AlertCard key={peak} tone="warning" title="Pico identificado" description={peak} />
                        ))}
                    </div>
                </ShellCard>
            ) : null}
        </div>
    );

    const renderVocalizationSection = () => (
        <div className="ac-patient-detail-grid">
            <ShellCard
                eyebrow="IA Nível 2"
                title="Resumo Inteligente de Vocalizações"
                subtitle="Leitura textual a partir dos registros coletados e análises locais."
            >
                <p className="ac-patient-summary-text">{renderRichSummary(vocalizationSummary)}</p>
            </ShellCard>

            <ShellCard
                eyebrow="IA Nível 3"
                title="Projeção de Tendência de Comunicação"
                subtitle="Sinal preditivo assistivo sobre a evolução das vocalizações."
            >
                <div className="ac-patient-summary-block">
                    <strong>Tendência observada</strong>
                    <p>{normalizeText(vocalizationPrediction)}</p>
                </div>
                {vocalizationAnomaly?.detected ? (
                    <AlertCard
                        tone="warning"
                        title="Anomalia em vocalização"
                        description={normalizeText(vocalizationAnomaly.message)}
                    />
                ) : null}
            </ShellCard>

            <div className="ac-patient-chart-grid">
                <ShellCard
                    eyebrow="Visualização"
                    title="Evolução da Complexidade da Linguagem"
                    subtitle="Diversidade lexical e contagem de palavras por sessão."
                    bodyClassName="ac-patient-chart-card"
                >
                    {chartData.vocalizationTrendData?.labels?.length > 0 ? (
                        <div className="ac-patient-chart">
                            <Line data={chartData.vocalizationTrendData} options={vocalizationLineOptions} />
                        </div>
                    ) : (
                        <EmptyState
                            title="Nenhuma vocalização registrada"
                            description="Não há dados suficientes para exibir a evolução da linguagem."
                        />
                    )}
                </ShellCard>

                <ShellCard
                    eyebrow="Visualização"
                    title="Padrões de Repetição"
                    subtitle="Top 10 repetições com maior frequência no período."
                    bodyClassName="ac-patient-chart-card"
                >
                    {chartData.repetitionPatternData?.labels?.length > 0 ? (
                        <div className="ac-patient-chart">
                            <Bar data={chartData.repetitionPatternData} options={barOptions} />
                        </div>
                    ) : (
                        <EmptyState
                            title="Sem repetições relevantes"
                            description="Nenhum padrão de repetição significativo foi encontrado."
                        />
                    )}
                </ShellCard>
            </div>

            <ShellCard
                eyebrow="Métricas"
                title="Histórico de Vocalizações"
                subtitle="Volume total, média lexical e registros individuais com transcrição."
            >
                {vocalizationAnalysis ? (
                    <div className="ac-patient-stats-row">
                        <div className="ac-patient-stat">
                            <span>Total de gravações</span>
                            <strong>{vocalizationAnalysis.totalRecordings}</strong>
                        </div>
                        <div className="ac-patient-stat">
                            <span>Média de palavras</span>
                            <strong>{vocalizationAnalysis.averageWordCount}</strong>
                        </div>
                        <div className="ac-patient-stat">
                            <span>Diversidade lexical</span>
                            <strong>{vocalizationAnalysis.averageLexicalDiversity}%</strong>
                        </div>
                        <div className="ac-patient-stat">
                            <span>Repetição dominante</span>
                            <strong>{vocalizationAnalysis.dominantRepetition}</strong>
                        </div>
                    </div>
                ) : null}

                <div className="ac-patient-table-wrap">
                    <Table responsive className="ac-patient-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Contagem de Palavras</th>
                                <th>Palavras Únicas</th>
                                <th>Diversidade</th>
                                <th>Texto Transcrito</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVocalizations.length > 0 ? filteredVocalizations.map((record) => (
                                <tr key={record.id}>
                                    <td>{formatDate(record.date)}</td>
                                    <td>{record.analysis_data?.wordCount ?? '—'}</td>
                                    <td>{record.analysis_data?.uniqueWords ?? '—'}</td>
                                    <td>{record.analysis_data?.lexicalDiversity !== undefined ? formatPercentage((record.analysis_data.lexicalDiversity || 0) * 100) : 'Sem dados'}</td>
                                    <td className="ac-patient-table__text">{normalizeText(record.analysis_data?.fullText || 'Sem transcrição disponível')}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="ac-patient-table__empty">
                                        Nenhuma vocalização registrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </ShellCard>
        </div>
    );

    const renderStrokeSection = () => (
        <div className="ac-patient-detail-grid">
            <ShellCard
                eyebrow="IA Nível 2"
                title="Resumo Inteligente de Risco de AVC"
                subtitle="Indicadores de monitoramento não substituem avaliação médica."
            >
                <p className="ac-patient-summary-text">{renderRichSummary(strokeSummary)}</p>
            </ShellCard>

            <div className="ac-patient-chart-grid">
                <ShellCard
                    eyebrow="Visualização"
                    title="Evolução do Índice de Assimetria Facial"
                    subtitle="Leitura histórica das medições disponíveis no período."
                    bodyClassName="ac-patient-chart-card"
                >
                    {chartData.strokeData?.labels?.length > 0 ? (
                        <div className="ac-patient-chart">
                            <Line data={chartData.strokeData} options={lineOptions} />
                        </div>
                    ) : (
                        <EmptyState
                            title="Nenhuma medição disponível"
                            description="Nenhum registro de risco facial foi encontrado para este período."
                        />
                    )}
                </ShellCard>

                <ShellCard
                    eyebrow="IA Nível 1"
                    title="Distribuição Geral de Risco"
                    subtitle="Leitura do último risco registrado e da distribuição geral do período."
                >
                    {strokeRiskAnalysis ? (
                        <>
                            <div className="ac-patient-summary-block">
                                <div className="ac-patient-summary-block__top">
                                    <strong>Risco mais recente</strong>
                                    <StatusPill value={strokeRiskAnalysis.lastRiskLevel} />
                                </div>
                                <p>Índice de assimetria: {strokeRiskAnalysis.lastAsymmetryIndex}</p>
                            </div>
                            <div className="ac-patient-insight-list">
                                {strokeRiskAnalysis.distribution.map((item) => (
                                    <div key={item.level} className="ac-patient-insight-list__item">
                                        <span>{item.level}</span>
                                        <strong>{item.percentage}%</strong>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            title="Sem análise disponível"
                            description="Ainda não há dados suficientes para gerar a análise de risco."
                        />
                    )}
                </ShellCard>
            </div>

            <ShellCard
                eyebrow="IA Nível 3"
                title="Projeções e Anomalias de Risco"
                subtitle="Sinais preditivos assistivos para apoio à avaliação profissional."
            >
                <div className="ac-patient-summary-block">
                    <strong>Tendência observada</strong>
                    <p>{normalizeText(strokePrediction)}</p>
                </div>
                {strokeAnomaly?.detected ? (
                    <AlertCard
                        tone="critical"
                        title="Anomalia detectada"
                        description={normalizeText(strokeAnomaly.message)}
                    />
                ) : (
                    <EmptyState
                        title="Sem anomalias sinalizadas"
                        description="Até o momento, a análise de IA não destacou anomalias faciais relevantes."
                    />
                )}
            </ShellCard>
        </div>
    );

    const renderGamesSection = () => (
        <div className="ac-games-container">
            <div className="ac-games-header">
                <div className="ac-games-header-content">
                    <div>
                        <h3 className="ac-games-title">Games Terapêuticos</h3>
                        <p className="ac-games-subtitle">Desempenho, evolução e atividades aplicadas ao paciente.</p>
                    </div>
                    <span className="ac-games-badge">Workspace ativo</span>
                </div>
            </div>
            <div className="ac-games-body">
                <GamesReport patientId={patientId} />
                <div className="my-4" />
                <GamesPanel patientId={patientId} />
            </div>
        </div>
    );

    const renderAbaSection = () => (
        <div className="ac-patient-detail-grid ac-patient-aba-workspace">
            <ShellCard
                eyebrow="Acompanhamento"
                title="Acompanhamento ABA"
                subtitle="Evolução das habilidades, desempenho e independência do paciente."
                actions={(
                    <div className="ac-patient-aba-actions">
                        {abaActivityCount > 0 ? (
                            <Button className="ac-patient-secondary-button" onClick={() => setShowAbaModal(true)}>
                                Ver histórico recente
                            </Button>
                        ) : null}
                        <Button className="ac-patient-primary-button" onClick={handleOpenAbaModule}>
                            Abrir módulo ABA completo
                        </Button>
                    </div>
                )}
            >
                <div className="ac-patient-aba-hero">
                    <div className="ac-patient-aba-hero__content">
                        <span className="ac-patient-insight-card__badge">ABA summary + drill-down</span>
                        <h3>Como este paciente está evoluindo na ABA?</h3>
                        <p>{abaSummaryText}</p>
                    </div>
                    <div className="ac-patient-aba-highlight-grid">
                        <article className="ac-patient-aba-highlight">
                            <span>Melhor desempenho</span>
                            <strong>{abaBestActivity?.nome || 'Sem dados'}</strong>
                            <small>{abaBestActivity ? formatMetricPercent(abaBestActivity.taxaSucesso, 1) : 'Sem registros suficientes'}</small>
                        </article>
                        <article className="ac-patient-aba-highlight">
                            <span>Maior volume</span>
                            <strong>{abaMostUsedActivity?.nome || 'Sem dados'}</strong>
                            <small>
                                {abaMostUsedActivity
                                    ? `${formatMetricCount(toNumberOrNull(abaMostUsedActivity.totalTentativas) ?? toNumberOrNull(abaMostUsedActivity.utilizacao) ?? 0)} ${abaVolumeMetricKey === 'tentativas' ? 'tentativas' : 'registros'}`
                                    : 'Sem registros suficientes'}
                            </small>
                        </article>
                    </div>
                </div>
            </ShellCard>

            {abaError ? (
                <Alert variant="warning" className="mb-0">
                    {abaError}
                </Alert>
            ) : null}

            {abaLoading ? (
                <div className="ac-patient-aba-loading">
                    <div className="ac-patient-metric-grid">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={`aba-kpi-skeleton-${index}`} className="ac-patient-skeleton ac-patient-skeleton--metric" />
                        ))}
                    </div>
                    <div className="ac-patient-chart-grid">
                        <div className="ac-patient-skeleton ac-patient-skeleton--card large" />
                        <div className="ac-patient-skeleton ac-patient-skeleton--card large" />
                    </div>
                    <div className="ac-patient-overview-grid ac-patient-overview-grid--aba">
                        <div className="ac-patient-skeleton ac-patient-skeleton--card large" />
                        <div className="ac-patient-skeleton ac-patient-skeleton--card large" />
                    </div>
                </div>
            ) : (
                <>
                    <div className="ac-patient-metric-grid">
                        <MetricCard
                            label="Atividades"
                            value={formatMetricCount(abaActivityCount)}
                            hint={abaActivityCount > 0 ? `${abaActivityCount} atividade(s) com acompanhamento ABA.` : 'Nenhuma atividade ABA registrada até o momento.'}
                            tone="schedule"
                        />
                        <MetricCard
                            label="Taxa de sucesso"
                            value={formatMetricPercent(abaSuccessRate, 1)}
                            hint="Percentual agregado informado pelo módulo ABA."
                            tone="emotion"
                        />
                        <MetricCard
                            label="Independência média"
                            value={formatMetricPercent(abaIndependenceRate, 0)}
                            hint="Métrica relacionada às atividades ABA registradas."
                            tone="voice"
                        />
                        <MetricCard
                            label="Última sessão"
                            value={abaLastSessionLabel}
                            hint="Último registro disponibilizado pelo acompanhamento ABA."
                            tone="risk"
                        />
                    </div>

                    <div className="ac-patient-chart-grid">
                        <ShellCard
                            eyebrow="Evolução"
                            title="Desempenho por atividade"
                            subtitle="Percentual agregado informado pelo módulo ABA, sem extrapolações clínicas."
                            bodyClassName="ac-patient-chart-card"
                        >
                            {abaSuccessChartData ? (
                                <div className="ac-patient-chart">
                                    <Bar data={abaSuccessChartData} options={abaSuccessChartOptions} />
                                </div>
                            ) : (
                                <EmptyState
                                    title="Sem dados de desempenho"
                                    description="A taxa de sucesso por atividade aparecerá quando houver registros suficientes."
                                />
                            )}
                        </ShellCard>

                        <ShellCard
                            eyebrow="Volume"
                            title={abaVolumeMetricLabel}
                            subtitle={abaVolumeMetricKey === 'tentativas'
                                ? 'Leitura do volume de tentativas registradas por atividade.'
                                : 'Leitura da frequência de utilização das atividades registradas.'}
                            bodyClassName="ac-patient-chart-card"
                        >
                            {abaVolumeChartData ? (
                                <div className="ac-patient-chart">
                                    <Bar data={abaVolumeChartData} options={abaVolumeChartOptions} />
                                </div>
                            ) : (
                                <EmptyState
                                    title="Sem histórico de volume"
                                    description="Os registros de tentativas ou utilização aparecerão aqui assim que o módulo ABA receber lançamentos."
                                />
                            )}
                        </ShellCard>
                    </div>

                    <div className="ac-patient-overview-grid ac-patient-overview-grid--aba">
                        <ShellCard
                            eyebrow="Atividades"
                            title="Atividades em acompanhamento"
                            subtitle={`${abaActivityCount} atividade(s) disponíveis nesta leitura resumida.`}
                        >
                            {sortedAbaActivities.length > 0 ? (
                                <div className="ac-patient-aba-activity-list">
                                    {sortedAbaActivities.map((activity) => (
                                        <article key={activity.id || activity.nome} className="ac-patient-aba-activity-card">
                                            <div className="ac-patient-aba-activity-card__header">
                                                <div>
                                                    <h4>{activity.nome}</h4>
                                                    {activity.descricao ? <p>{activity.descricao}</p> : null}
                                                </div>
                                                <div className="ac-patient-aba-activity-card__score">
                                                    <span>Sucesso</span>
                                                    <strong>{formatMetricPercent(activity.taxaSucesso, 1)}</strong>
                                                </div>
                                            </div>
                                            <div className="ac-patient-aba-activity-card__stats">
                                                <div>
                                                    <span>Última sessão</span>
                                                    <strong>{formatAbaSessionDate(activity.ultimaSessao)}</strong>
                                                </div>
                                                <div>
                                                    <span>Tentativas</span>
                                                    <strong>{formatMetricCount(activity.totalTentativas)}</strong>
                                                </div>
                                                <div>
                                                    <span>Utilização</span>
                                                    <strong>{formatMetricCount(activity.utilizacao)}</strong>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="ac-patient-aba-empty-state">
                                    <EmptyState
                                        title="Nenhuma atividade ABA registrada"
                                        description="Os dados aparecerão quando atividades forem adicionadas ao acompanhamento."
                                    />
                                    <div className="mt-3">
                                        <Button className="ac-patient-primary-button" onClick={handleOpenAbaModule}>
                                            Abrir módulo ABA completo
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </ShellCard>

                        <div className="ac-patient-overview-side">
                            <ShellCard
                                eyebrow="Leituras rápidas"
                                title="Insights e histórico recente"
                                subtitle="Sinais extraídos apenas dos registros ABA já existentes no sistema."
                            >
                                {abaActivityCount > 0 ? (
                                    <div className="ac-patient-aba-insight-stack">
                                        <article className="ac-patient-insight-card">
                                            <header>
                                                <div>
                                                    <span className="ac-patient-insight-card__badge">Melhor desempenho</span>
                                                    <h4>{abaBestActivity?.nome || 'Sem dados'}</h4>
                                                </div>
                                                <GraphUp />
                                            </header>
                                            <p>{abaBestActivity ? `${formatMetricPercent(abaBestActivity.taxaSucesso, 1)} de sucesso registrado nas atividades ABA.` : 'Ainda não há dados suficientes para identificar a atividade com melhor desempenho.'}</p>
                                        </article>
                                        <article className="ac-patient-insight-card">
                                            <header>
                                                <div>
                                                    <span className="ac-patient-insight-card__badge">Ponto de atenção</span>
                                                    <h4>{abaAttentionActivity?.nome || 'Sem dados'}</h4>
                                                </div>
                                                <ExclamationTriangle />
                                            </header>
                                            <p>{abaAttentionActivity ? `${formatMetricPercent(abaAttentionActivity.taxaSucesso, 1)} de sucesso nas métricas atuais. Vale aprofundar a leitura no módulo completo.` : 'Nenhum ponto de atenção pôde ser identificado com segurança a partir dos registros atuais.'}</p>
                                        </article>
                                        <div className="ac-patient-insight-list">
                                            {abaRecentHistory.map((activity) => (
                                                <div key={`aba-history-${activity.id || activity.nome}`} className="ac-patient-insight-list__item">
                                                    <div>
                                                        <strong>{activity.nome}</strong>
                                                        <span>{formatAbaSessionDate(activity.ultimaSessao)}</span>
                                                    </div>
                                                    <strong>{formatMetricPercent(activity.taxaSucesso, 1)}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="Sem histórico recente"
                                        description="Assim que a ABA registrar atividades, o histórico recente aparecerá aqui."
                                    />
                                )}
                            </ShellCard>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    const renderMonitoringToolsSection = () => (
        <div className="ac-patient-detail-grid">
            <div className="ac-patient-tools-grid">
            <MonitoringToolCard
                icon={EmojiSmile}
                title="Monitoramento Emocional"
                description="Abra o detector emocional com o contexto do paciente já conectado ao fluxo de avaliação."
                buttonLabel="Abrir detector"
                onClick={() => handleOpenMonitoringTool(ROUTES.EMOTION_DETECTOR)}
                tone="primary"
            />
            <MonitoringToolCard
                icon={ShieldCheck}
                title="Monitoramento de Risco de AVC"
                description="Acesse o monitor facial para registrar medições de assimetria e sinais observacionais."
                buttonLabel="Abrir monitor"
                onClick={() => handleOpenMonitoringTool(ROUTES.STROKE_RISK_MONITOR)}
                tone="warning"
            />
            <MonitoringToolCard
                icon={Mic}
                title="Gravador de Voz"
                description="Colete vocalizações do paciente e envie novas gravações para análise."
                buttonLabel="Abrir gravador"
                onClick={() => handleOpenMonitoringTool(ROUTES.TRIGGER_RECORDER)}
                tone="success"
            />
            <MonitoringToolCard
                icon={ClipboardPulse}
                title="Acompanhamento ABA"
                description="Abra o módulo completo de ABA para gestão detalhada de habilidades, sessões e registros comportamentais."
                buttonLabel="Abrir módulo completo"
                onClick={handleOpenAbaModule}
                tone="info"
            />
            </div>
            <ShellCard
                eyebrow="Biometria"
                title="Referencia facial"
                subtitle="Cadastre a foto do paciente para que o monitoramento emocional valide a face correta antes de iniciar."
            >
                <PatientFaceReferencePanel
                    patientId={patientId}
                    onOpenMonitor={() => handleOpenMonitoringTool(ROUTES.EMOTION_DETECTOR)}
                />
            </ShellCard>
        </div>
    );

    const renderConsultationsSection = () => (
        <ShellCard
            eyebrow="Clínico"
            title="Histórico de Atendimentos"
            subtitle={`${filteredConsultations.length} atendimento(s) exibido(s) no período atual.`}
            actions={(
                <Button className="ac-patient-primary-button" onClick={() => setShowConsultationModal(true)}>
                    <PlusCircle className="me-2" /> Novo Atendimento
                </Button>
            )}
        >
            {filteredConsultations.length > 0 ? (
                <div className="ac-patient-table-wrap">
                    <Table responsive className="ac-patient-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Hora</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Valor</th>
                                <th>Forma de Pagamento</th>
                                <th>Detalhes</th>
                                <th>Status do Pagamento</th>
                                <th>Observações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredConsultations.map((consultation) => (
                                <tr key={consultation.id}>
                                    <td>{formatDate(consultation.appointment_date)}</td>
                                    <td>{formatTime(consultation.appointment_time)}</td>
                                    <td>{consultation.appointment_type}</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={consultation.status}
                                            onChange={(event) => handleFieldUpdate(consultation.id, 'status', event.target.value)}
                                        >
                                            {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </td>
                                    <td>{formatCurrency(consultation.value || 0)}</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={consultation.payment_method || ''}
                                            onChange={(event) => handleFieldUpdate(consultation.id, 'payment_method', event.target.value)}
                                        >
                                            <option value="">N/A</option>
                                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </td>
                                    <td>
                                        {consultation.payment_method === 'Plano de Saúde' || consultation.payment_method === 'Outros' ? (
                                            <Form.Control
                                                type="text"
                                                size="sm"
                                                defaultValue={consultation.payment_details || ''}
                                                onBlur={(event) => handleFieldUpdate(consultation.id, 'payment_details', event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        event.currentTarget.blur();
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span className="ac-patient-table__muted">—</span>
                                        )}
                                    </td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={consultation.payment_status}
                                            onChange={(event) => handleFieldUpdate(consultation.id, 'payment_status', event.target.value)}
                                        >
                                            {PAYMENT_STATUS_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </td>
                                    <td className="ac-patient-table__text">{consultation.notes || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            ) : (
                <EmptyState
                    title="Nenhum atendimento registrado"
                    description="Ainda não há atendimentos disponíveis para o período selecionado."
                />
            )}
        </ShellCard>
    );

    const renderNotesSection = () => (
        <ShellCard
            eyebrow="Clínico"
            title="Notas do Paciente"
            subtitle="Registros textuais usados para acompanhar evolução, contexto e decisões clínicas."
            actions={(
                <Button className="ac-patient-primary-button" onClick={() => setShowNoteModal(true)}>
                    <PlusCircle className="me-2" /> Adicionar Nota
                </Button>
            )}
        >
            {sortedNotes.length > 0 ? (
                <div className="ac-patient-note-stack">
                    {sortedNotes.map((note) => (
                        <article key={note.id} className="ac-patient-note-card">
                            <div className="ac-patient-note-card__top">
                                <strong>{note.title}</strong>
                                <small>{formatDate(note.createdAt || note.created_at)}</small>
                            </div>
                            <p>{note.content}</p>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Nenhuma nota registrada"
                    description="Nenhuma nota foi registrada para este paciente até o momento."
                />
            )}
        </ShellCard>
    );

    const renderPrescriptionSection = () => (
        <div className="ac-patient-detail-grid">
            <div className="printable-prescription">
                <div className="ac-patient-print-header">
                    <h4>Prescrição Médica</h4>
                    <p><strong>Paciente:</strong> {patient?.name || 'N/A'}</p>
                    <p><strong>Responsável:</strong> {patient?.parent || 'N/A'}</p>
                    <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                {filteredPrescriptions.length > 0 ? filteredPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="ac-patient-print-block">
                        <Table responsive className="ac-patient-table">
                            <thead>
                                <tr>
                                    <th>Prescrição ou Medicamento</th>
                                    <th>Quantidade ou Dosagem</th>
                                    <th>Indicações ou Sugestões</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prescription.medications.map((medication, index) => (
                                    <tr key={`${prescription.id}-${index}`}>
                                        <td>{medication.medication}</td>
                                        <td>{medication.dosage}</td>
                                        <td>{medication.indicationssuggestions || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {prescription.observations ? (
                            <div className="ac-patient-print-observations">
                                <strong>Observações:</strong> {prescription.observations}
                            </div>
                        ) : null}
                    </div>
                )) : (
                    <p className="text-center">Nenhuma prescrição registrada.</p>
                )}

                <div className="ac-patient-print-footer">
                    <p><strong>Médico:</strong> {professionalName || 'Profissional não identificado'}</p>
                    <p><strong>Inscrição:</strong> {normalizeText(user?.registration) || 'Inscrição não disponível'}</p>
                    <p><strong>Assinatura:</strong></p>
                    <div className="ac-patient-signature-line" />
                </div>
            </div>

            <ShellCard
                eyebrow="Clínico"
                title="Nova Prescrição"
                subtitle="Registre medicamentos, dosagem, indicações e observações do paciente."
            >
                <Form>
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group controlId="prescriptionDate">
                                <Form.Label>Data</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="date"
                                    value={newPrescription.date}
                                    onChange={(event) => setNewPrescription((previous) => ({ ...previous, date: event.target.value }))}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {newPrescription.medications.map((medication, index) => (
                        <div key={`medication-${index}`} className="ac-patient-prescription-item">
                            <Row className="mb-3 align-items-end">
                                <Col md={3}>
                                    <Form.Group controlId={`prescriptionMedication-${index}`}>
                                        <Form.Label>Prescrição ou Medicamento</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="medication"
                                            value={medication.medication}
                                            onChange={(event) => handlePrescriptionChange(event, index)}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group controlId={`prescriptionDosage-${index}`}>
                                        <Form.Label>Quantidade ou Dosagem</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="dosage"
                                            value={medication.dosage}
                                            onChange={(event) => handlePrescriptionChange(event, index)}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group controlId={`prescriptionIndications-${index}`}>
                                        <Form.Label>Indicações e Sugestões</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="indicationssuggestions"
                                            value={medication.indicationssuggestions}
                                            onChange={(event) => handlePrescriptionChange(event, index)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    {newPrescription.medications.length > 1 ? (
                                        <Button
                                            className="ac-patient-danger-button"
                                            size="sm"
                                            onClick={() => handleRemoveMedication(index)}
                                        >
                                            Remover
                                        </Button>
                                    ) : null}
                                </Col>
                            </Row>

                            {index === newPrescription.medications.length - 1 ? (
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group controlId="prescriptionObservations">
                                            <Form.Label>Observações</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                name="observations"
                                                value={newPrescription.observations}
                                                onChange={handlePrescriptionChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            ) : null}
                        </div>
                    ))}

                    <div className="ac-patient-inline-actions">
                        <Button className="ac-patient-secondary-button" onClick={handleAddMedication}>
                            + Adicionar Medicamento
                        </Button>
                        <Button className="ac-patient-primary-button" onClick={handleSavePrescription}>
                            Salvar Prescrição
                        </Button>
                    </div>
                </Form>
            </ShellCard>

            <ShellCard
                eyebrow="Clínico"
                title="Prescrições Registradas"
                subtitle="Histórico local de prescrições com filtro por data e opção de impressão."
                actions={(
                    <Button className="ac-patient-secondary-button" onClick={handlePrint}>
                        Imprimir
                    </Button>
                )}
            >
                <Row className="mb-3">
                    <Col md={3}>
                        <Form.Group controlId="searchDate">
                            <Form.Label>Filtrar por Data</Form.Label>
                            <Form.Control type="date" value={searchDate} onChange={handleSearchDate} />
                        </Form.Group>
                    </Col>
                </Row>

                <div className="ac-patient-table-wrap">
                    <Table responsive className="ac-patient-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Prescrição ou Medicamento</th>
                                <th>Quantidade ou Dosagem</th>
                                <th>Indicações e Sugestões</th>
                                <th>Observações</th>
                                <th className="no-print">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPrescriptions.length > 0 ? (
                                filteredPrescriptions.flatMap((prescription) => (
                                    prescription.medications.map((medication, index) => (
                                        <tr key={`${prescription.id}-${index}`}>
                                            {index === 0 ? (
                                                <td rowSpan={prescription.medications.length}>
                                                    {formatDate(prescription.date)}
                                                </td>
                                            ) : null}
                                            <td>{medication.medication}</td>
                                            <td>{medication.dosage}</td>
                                            <td>{medication.indicationssuggestions || 'N/A'}</td>
                                            {index === 0 ? (
                                                <td rowSpan={prescription.medications.length}>
                                                    {prescription.observations || 'N/A'}
                                                </td>
                                            ) : null}
                                            {index === 0 ? (
                                                <td rowSpan={prescription.medications.length} className="no-print">
                                                    <Button
                                                        className="ac-patient-danger-button"
                                                        size="sm"
                                                        onClick={() => handleDeletePrescription(prescription.id)}
                                                    >
                                                        Excluir
                                                    </Button>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="ac-patient-table__empty">
                                        Nenhuma prescrição registrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </ShellCard>
        </div>
    );

    const renderActiveWorkspace = () => {
        switch (activeTab) {
        case 'emotion':
            return renderEmotionSection();
        case 'trigger':
            return renderVocalizationSection();
        case 'stroke':
            return renderStrokeSection();
        case 'games':
            return renderGamesSection();
        case 'consultation':
            return renderConsultationsSection();
        case 'prescription':
            return renderPrescriptionSection();
        case 'notes':
            return renderNotesSection();
        case 'monitoring-tools':
            return renderMonitoringToolsSection();
        case 'aba':
            return renderAbaSection();
        case 'overview':
        default:
            return renderOverview();
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error && !patient) {
        return (
            <div className="ac-patient-state-page">
                <div className="ac-patient-state-card">
                    <img src={logonovo} alt="AutisConnect" className="ac-patient-state-card__logo" />
                    <StatusPill value="Erro de carregamento" className="ac-patient-state-card__pill" />
                    <h2>Não foi possível carregar os dados do paciente.</h2>
                    <p>{error}</p>
                    <div className="ac-patient-state-card__actions">
                        <Button className="ac-patient-primary-button" onClick={fetchPatientData}>
                            Tentar novamente
                        </Button>
                        <Button className="ac-patient-secondary-button" onClick={handleBackToProfessional}>
                            Voltar ao Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="ac-patient-state-page">
                <div className="ac-patient-state-card">
                    <img src={logonovo} alt="AutisConnect" className="ac-patient-state-card__logo" />
                    <StatusPill value="Paciente não encontrado" className="ac-patient-state-card__pill" />
                    <h2>Paciente não encontrado</h2>
                    <p>O paciente solicitado não está disponível ou você não possui acesso.</p>
                    <div className="ac-patient-state-card__actions">
                        <Button className="ac-patient-secondary-button" onClick={handleBackToProfessional}>
                            Voltar ao Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`ac-patient-page${isDesktop && isSidebarCollapsed ? ' ac-patient-page--collapsed' : ''}`}>
            <aside className="ac-patient-global-shell no-print">
                {renderGlobalSidebar(false)}
            </aside>

            <Offcanvas
                show={showMobileSidebar}
                onHide={() => setShowMobileSidebar(false)}
                placement="start"
                className="ac-patient-offcanvas no-print"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>AutisConnect</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    {renderGlobalSidebar(true)}
                </Offcanvas.Body>
            </Offcanvas>

            <div className="ac-patient-shell">
                <header className="ac-patient-top-header no-print">
                    <div className="ac-patient-top-header__inner">
                        <div className="ac-patient-top-header__left">
                            {!isDesktop ? (
                                <Button className="ac-patient-secondary-button" onClick={() => setShowMobileSidebar(true)}>
                                    <List className="me-2" /> Menu
                                </Button>
                            ) : null}
                            <div>
                                <span className="ac-patient-top-header__eyebrow">Paciente / {patient?.name}</span>
                                <h1>{workspaceMeta.title}</h1>
                                <p>{workspaceMeta.description}</p>
                            </div>
                        </div>
                        <div className="ac-patient-top-header__actions">
                            <Form.Select
                                className="ac-patient-period-select"
                                value={periodFilter}
                                onChange={(event) => setPeriodFilter(event.target.value)}
                                aria-label="Selecionar período"
                            >
                                <option value="week">Última Semana</option>
                                <option value="month">Último Mês</option>
                                <option value="quarter">Último Trimestre</option>
                                <option value="year">Último Ano</option>
                            </Form.Select>
                            <Button className="ac-patient-secondary-button" onClick={() => setShowNoteModal(true)}>
                                <JournalText className="me-2" /> Nota
                            </Button>
                            <Button className="ac-patient-primary-button" onClick={() => setShowConsultationModal(true)}>
                                <PlusCircle className="me-2" /> Novo Atendimento
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="ac-patient-main">
                    <section className="ac-patient-identity-card">
                        <div className="ac-patient-identity-card__avatar">{getInitials(patient?.name)}</div>
                        <div className="ac-patient-identity-card__body">
                            <div className="ac-patient-identity-card__top">
                                <div>
                                    <span className="ac-patient-identity-card__eyebrow">Central Inteligente do Paciente</span>
                                    <h2>{patient?.name || 'Paciente'}</h2>
                                </div>
                                {patientStatus ? <StatusPill value={patientStatus} /> : null}
                            </div>
                            <p className="ac-patient-identity-card__facts">
                                {[patientAge !== 'N/A' ? patientAge : null, patientDiagnosis || null, patientSupportLevel ? `Suporte ${patientSupportLevel}` : null]
                                    .filter(Boolean)
                                    .join(' • ') || 'Informações principais ainda não disponíveis'}
                            </p>
                            {patientSpecialInfo ? <p className="ac-patient-identity-card__note">{patientSpecialInfo}</p> : null}
                        </div>
                        <div className="ac-patient-identity-card__aside">
                            <div className="ac-patient-identity-card__mini">
                                <span>Próximo atendimento</span>
                                <strong>{nextConsultation ? formatDate(nextConsultation.appointment_date || nextConsultation.date) : 'Sem agenda'}</strong>
                                <small>{nextConsultation ? `${formatTime(nextConsultation.appointment_time || nextConsultation.time)} • ${nextConsultation.appointment_type}` : 'Nenhum horário futuro registrado'}</small>
                            </div>
                            <div className="ac-patient-identity-card__mini">
                                <span>Profissional responsável</span>
                                <strong>{professionalName}</strong>
                                <small>{greeting} • {todayLabel}</small>
                            </div>
                        </div>
                    </section>

                    {(successMessage || error) && (
                        <div className="ac-patient-feedback-stack no-print">
                            {successMessage ? (
                                <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="mb-0">
                                    {successMessage}
                                </Alert>
                            ) : null}
                            {error ? (
                                <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-0">
                                    {error}
                                </Alert>
                            ) : null}
                        </div>
                    )}

                    {!isDesktop ? (
                        <div className="ac-patient-mobile-nav no-print">
                            <Form.Select value={mobileNavValue} onChange={(event) => handleActiveTabChange(event.target.value)}>
                                {PATIENT_NAVIGATION_GROUPS.map((group) => (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.items.map((item) => (
                                            <option key={item.key} value={item.key}>{item.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </Form.Select>
                        </div>
                    ) : null}

                    <div className="ac-patient-workspace-grid">
                        <aside className="ac-patient-context-shell no-print">
                            {renderPatientNavigation()}
                        </aside>

                        <section className="ac-patient-workspace-panel">
                            {renderActiveWorkspace()}
                        </section>
                    </div>
                </main>
            </div>

            <Modal show={showAbaModal} onHide={() => setShowAbaModal(false)} size="lg" className="ac-patient-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Histórico ABA recente</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="ac-patient-aba-modal-grid">
                        {sortedAbaActivities.length > 0 ? (
                            sortedAbaActivities.map((activity) => (
                                <article key={`aba-modal-${activity.id || activity.nome}`} className="ac-patient-aba-activity-card">
                                    <div className="ac-patient-aba-activity-card__header">
                                        <div>
                                            <h4>{activity.nome}</h4>
                                            {activity.descricao ? <p>{activity.descricao}</p> : null}
                                        </div>
                                        <div className="ac-patient-aba-activity-card__score">
                                            <span>Sucesso</span>
                                            <strong>{formatMetricPercent(activity.taxaSucesso, 1)}</strong>
                                        </div>
                                    </div>
                                    <div className="ac-patient-aba-activity-card__stats">
                                        <div>
                                            <span>Última sessão</span>
                                            <strong>{formatAbaSessionDate(activity.ultimaSessao)}</strong>
                                        </div>
                                        <div>
                                            <span>Tentativas</span>
                                            <strong>{formatMetricCount(activity.totalTentativas)}</strong>
                                        </div>
                                        <div>
                                            <span>Utilização</span>
                                            <strong>{formatMetricCount(activity.utilizacao)}</strong>
                                        </div>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <EmptyState
                                title="Sem histórico ABA"
                                description="As atividades ABA registradas aparecerão aqui assim que o acompanhamento tiver lançamentos."
                            />
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button className="ac-patient-secondary-button" onClick={() => setShowAbaModal(false)}>
                        Fechar
                    </Button>
                    <Button className="ac-patient-primary-button" onClick={handleOpenAbaModule}>
                        Abrir módulo ABA completo
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} className="ac-patient-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Adicionar Nota</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSaveNote();
                        }}
                    >
                        <Form.Group controlId="noteTitle" className="mb-3">
                            <Form.Label>Título</Form.Label>
                            <Form.Control
                                type="text"
                                value={newNoteData.title}
                                onChange={(event) => setNewNoteData({ ...newNoteData, title: event.target.value })}
                                required
                                placeholder="Digite o título da nota"
                            />
                        </Form.Group>
                        <Form.Group controlId="noteContent">
                            <Form.Label>Conteúdo</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={newNoteData.content}
                                onChange={(event) => setNewNoteData({ ...newNoteData, content: event.target.value })}
                                required
                                placeholder="Digite o conteúdo da nota"
                            />
                        </Form.Group>
                        <Modal.Footer>
                            <Button className="ac-patient-secondary-button" onClick={() => setShowNoteModal(false)}>
                                Cancelar
                            </Button>
                            <Button className="ac-patient-primary-button" type="submit">
                                Salvar
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showConsultationModal} onHide={() => setShowConsultationModal(false)} size="lg" className="ac-patient-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Registrar Novo Atendimento</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveConsultation}>
                    <Modal.Body>
                        <section className="ac-patient-form-block">
                            <div className="ac-patient-form-block__header">
                                <h4>Atendimento</h4>
                                <p>Defina data, hora, tipo, status e observações do atendimento.</p>
                            </div>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="consultationDate">
                                        <Form.Label>Data do Atendimento *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="appointment_date"
                                            value={newConsultation.appointment_date}
                                            onChange={handleConsultationInputChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="consultationTime">
                                        <Form.Label>Hora do Atendimento *</Form.Label>
                                        <Form.Control
                                            type="time"
                                            name="appointment_time"
                                            value={newConsultation.appointment_time}
                                            onChange={handleConsultationInputChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="consultationType">
                                        <Form.Label>Tipo de Atendimento</Form.Label>
                                        <Form.Select
                                            name="appointment_type"
                                            value={newConsultation.appointment_type}
                                            onChange={handleConsultationInputChange}
                                        >
                                            {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="consultationStatus">
                                        <Form.Label>Status do Atendimento</Form.Label>
                                        <Form.Select
                                            name="status"
                                            value={newConsultation.status}
                                            onChange={handleConsultationInputChange}
                                        >
                                            {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-0" controlId="consultationNotes">
                                <Form.Label>Observações</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="notes"
                                    value={newConsultation.notes}
                                    onChange={handleConsultationInputChange}
                                    placeholder="Digite observações sobre o atendimento"
                                />
                            </Form.Group>
                        </section>

                        <section className="ac-patient-form-block">
                            <div className="ac-patient-form-block__header">
                                <h4>Pagamento</h4>
                                <p>Registre valor, status financeiro e detalhes do método de pagamento.</p>
                            </div>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="consultationValue">
                                        <Form.Label>Valor do Atendimento (R$) *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            name="value"
                                            placeholder="Ex: 150.00"
                                            value={newConsultation.value}
                                            onChange={handleConsultationInputChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="paymentStatus">
                                        <Form.Label>Status do Pagamento</Form.Label>
                                        <Form.Select
                                            name="payment_status"
                                            value={newConsultation.payment_status}
                                            onChange={handleConsultationInputChange}
                                        >
                                            {PAYMENT_STATUS_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="paymentMethod">
                                        <Form.Label>Forma de Pagamento</Form.Label>
                                        <Form.Select
                                            name="payment_method"
                                            value={newConsultation.payment_method}
                                            onChange={handleConsultationInputChange}
                                        >
                                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                {newConsultation.payment_method === 'Plano de Saúde' || newConsultation.payment_method === 'Outros' ? (
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="paymentDetails">
                                            <Form.Label>
                                                {newConsultation.payment_method === 'Plano de Saúde' ? 'Qual plano de saúde?' : 'Especifique a forma de pagamento'}
                                            </Form.Label>
                                            {newConsultation.payment_method === 'Plano de Saúde' ? (
                                                <Form.Select
                                                    name="payment_details"
                                                    value={newConsultation.payment_details}
                                                    onChange={handleConsultationInputChange}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {PLAN_NAMES.map((plan) => (
                                                        <option key={plan} value={plan}>{plan}</option>
                                                    ))}
                                                </Form.Select>
                                            ) : (
                                                <Form.Control
                                                    type="text"
                                                    name="payment_details"
                                                    placeholder="Ex: Transferência bancária"
                                                    value={newConsultation.payment_details}
                                                    onChange={handleConsultationInputChange}
                                                />
                                            )}
                                        </Form.Group>
                                    </Col>
                                ) : null}
                            </Row>
                        </section>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="ac-patient-secondary-button" onClick={() => setShowConsultationModal(false)}>
                            Cancelar
                        </Button>
                        <Button className="ac-patient-primary-button" type="submit">
                            Salvar Atendimento
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default PatientDetails;
