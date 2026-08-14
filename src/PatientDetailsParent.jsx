import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
    Row,
    Col,
    Button,
    Table,
    Alert,
    Spinner,
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
import AbaReport from './pages/AbaReport';
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
import './PatientDetailsParent.css';

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

const SIDEBAR_STORAGE_KEY = 'ac-parent-patient-sidebar-collapsed';

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
        eyebrow: 'Central de Acompanhamento',
        title: 'Visão Geral',
        description: 'Entenda rapidamente como o paciente está evoluindo, o próximo atendimento e as orientações mais recentes.'
    },
    emotion: {
        eyebrow: 'Bem-estar',
        title: 'Emoções & Bem-estar',
        description: 'Acompanhe padrões emocionais registrados ao longo do período selecionado.'
    },
    trigger: {
        eyebrow: 'Comunicação',
        title: 'Comunicação & Vocalizações',
        description: 'Entenda padrões de comunicação registrados ao longo do acompanhamento.'
    },
    stroke: {
        eyebrow: 'Monitoramento',
        title: 'Monitoramento Facial',
        description: 'Consulte indicadores de assimetria facial e sinais observados ao longo do período.'
    },
    games: {
        eyebrow: 'Desenvolvimento',
        title: 'Games Terapêuticos',
        description: 'Acompanhe desempenho e atividades terapêuticas dos jogos.'
    },
    consultation: {
        eyebrow: 'Cuidado',
        title: 'Atendimentos',
        description: 'Visualize os atendimentos registrados e acompanhe a agenda do paciente.'
    },
    prescription: {
        eyebrow: 'Cuidado',
        title: 'Prescrições',
        description: 'Consulte prescrições registradas e utilize a impressão quando houver conteúdo disponível.'
    },
    notes: {
        eyebrow: 'Cuidado',
        title: 'Recomendações e Orientações',
        description: 'Acompanhe recomendações compartilhadas com a família durante a evolução.'
    },
    'monitoring-tools': {
        eyebrow: 'Ferramentas',
        title: 'Monitoramentos',
        description: 'Acesso rápido aos módulos ativos de coleta e acompanhamento.'
    },
    'aba-activity': {
        eyebrow: 'Desenvolvimento',
        title: 'Atividade ABA',
        description: 'Laudos e análises ABA disponíveis para acompanhamento da família.'
    }
};

const PATIENT_NAVIGATION_GROUPS = [
    {
        label: 'Acompanhamento',
        items: [
            { key: 'overview', label: 'Visão Geral', icon: HouseDoor }
        ]
    },
    {
        label: 'Monitoramentos',
        items: [
            { key: 'emotion', label: 'Emoções', icon: EmojiSmile },
            { key: 'trigger', label: 'Vocalizações', icon: Mic },
            { key: 'stroke', label: 'Monitoramento Facial', icon: ShieldCheck }
        ]
    },
    {
        label: 'Desenvolvimento',
        items: [
            { key: 'games', label: 'Games', icon: Controller },
            { key: 'aba-activity', label: 'Atividade ABA', icon: ClipboardPulse }
        ]
    },
    {
        label: 'Cuidado',
        items: [
            { key: 'consultation', label: 'Atendimentos', icon: CalendarCheck },
            { key: 'prescription', label: 'Prescrições', icon: FileEarmarkMedical },
            { key: 'notes', label: 'Orientações', icon: JournalText }
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

const PARENT_ROLE_VALUES = ['pais_responsavel', 'pais_responsável'];

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

const normalizeRoleKey = (value) => normalizeText(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_');

const normalizeAppointmentStatus = (value) => {
    const normalized = normalizeText(value);
    const aliases = {
        'NÃ£o Realizada': 'Não Realizada',
        'NÃƒÂ£o Realizada': 'Não Realizada',
        'Nao Realizada': 'Não Realizada'
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
    return <span className={`ac-parent-patient-pill ac-parent-patient-pill--${tone} ${className}`.trim()}>{normalizedValue}</span>;
};

const ShellCard = ({ eyebrow, title, subtitle, actions, className = '', bodyClassName = '', children }) => (
    <section className={`ac-parent-patient-card ${className}`.trim()}>
        <header className="ac-parent-patient-card__header">
            <div>
                {eyebrow ? <span className="ac-parent-patient-card__eyebrow">{eyebrow}</span> : null}
                <h3 className="ac-parent-patient-card__title">{title}</h3>
                {subtitle ? <p className="ac-parent-patient-card__subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="ac-parent-patient-card__actions">{actions}</div> : null}
        </header>
        <div className={`ac-parent-patient-card__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
);

const MetricCard = ({ label, value, hint, tone = 'primary', action }) => (
    <article className={`ac-parent-patient-metric ac-parent-patient-metric--${tone}`.trim()}>
        <span className="ac-parent-patient-metric__label">{label}</span>
        <strong className="ac-parent-patient-metric__value">{value}</strong>
        {hint ? <span className="ac-parent-patient-metric__hint">{hint}</span> : null}
        {action ? <div className="ac-parent-patient-metric__action">{action}</div> : null}
    </article>
);

const EmptyState = ({ title, description }) => (
    <div className="ac-parent-patient-empty-state">
        <strong>{title}</strong>
        <p>{description}</p>
    </div>
);

const AlertCard = ({ tone, title, description }) => (
    <article className={`ac-parent-patient-alert-card ac-parent-patient-alert-card--${tone}`.trim()}>
        <div className="ac-parent-patient-alert-card__icon">
            <ExclamationTriangle />
        </div>
        <div>
            <strong>{title}</strong>
            <p>{description}</p>
        </div>
    </article>
);

const MonitoringToolCard = ({ icon: Icon, title, description, buttonLabel, onClick, tone = 'primary' }) => (
    <article className={`ac-parent-patient-tool-card ac-parent-patient-tool-card--${tone}`.trim()}>
        <div className="ac-parent-patient-tool-card__top">
            <span className="ac-parent-patient-tool-card__icon"><Icon /></span>
            <h4>{title}</h4>
        </div>
        <p>{description}</p>
        <Button className="ac-parent-patient-secondary-button" onClick={onClick}>
            {buttonLabel} <ArrowRight className="ms-2" />
        </Button>
    </article>
);

const LoadingSkeleton = () => (
    <div className="ac-parent-patient-page ac-parent-patient-page--loading">
        <aside className="ac-parent-patient-global-shell">
            <div className="ac-parent-patient-global-sidebar">
                <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--logo" />
                <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--nav" />
                <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--nav" />
                <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--nav" />
            </div>
        </aside>
        <div className="ac-parent-patient-shell">
            <header className="ac-parent-patient-top-header">
                <div className="ac-parent-patient-top-header__inner">
                    <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--heading" />
                    <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--toolbar" />
                </div>
            </header>
            <main className="ac-parent-patient-main">
                <section className="ac-parent-patient-identity-card">
                    <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--avatar" />
                    <div className="ac-parent-patient-identity-card__body">
                        <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--title" />
                        <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--text" />
                        <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--text short" />
                    </div>
                </section>
                <div className="ac-parent-patient-metric-grid">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={`metric-${index}`} className="ac-parent-patient-skeleton ac-parent-patient-skeleton--metric" />
                    ))}
                </div>
                <div className="ac-parent-patient-workspace-grid">
                    <aside className="ac-parent-patient-context-shell">
                        <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--panel tall" />
                    </aside>
                    <section className="ac-parent-patient-workspace-panel">
                        <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--card large" />
                        <div className="ac-parent-patient-skeleton ac-parent-patient-skeleton--card large" />
                    </section>
                </div>
            </main>
        </div>
    </div>
);

const PatientDetailsParent = () => {
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

    const userRole = normalizeText(user?.tipo_usuario || '');
    const userRoleKey = normalizeRoleKey(userRole);
    const isParentRole = PARENT_ROLE_VALUES.includes(userRole) || userRoleKey === 'pais_responsavel';
    const canManageConsultations = !isParentRole;
    const canCreateNotes = !isParentRole;
    const canManagePrescriptions = !isParentRole;
    const viewerName = normalizeText(user?.nome_completo || user?.name || user?.username || (isParentRole ? 'Responsável' : 'Usuário'));
    const patientStatus = normalizeText(patient?.status || patient?.patient_status || patient?.situacao || '');
    const patientSupportLevel = normalizeText(patient?.nivel_suporte || patient?.support_level || '');
    const patientAge = formatAge(patient?.birthDate || patient?.birth_date);
    const patientDiagnosis = normalizeText(patient?.diagnosis || '');
    const patientSpecialInfo = normalizeText(patient?.specialInfo || patient?.special_info || '');
    const patientResponsible = normalizeText(patient?.parent || patient?.responsible_name || viewerName);
    const supportLevelLabel = patientSupportLevel
        ? (/nível|nivel/i.test(patientSupportLevel) ? patientSupportLevel : `Nível ${patientSupportLevel}`)
        : 'Não informado';

    const clearSuccessAfterDelay = useCallback(() => {
        window.setTimeout(() => setSuccessMessage(''), 2800);
    }, []);

    const handleBackToParent = useCallback(() => {
        if (user?.id) {
            navigate(`/parent-dashboard/${user.id}`);
            return;
        }

        navigate('/login');
    }, [navigate, user]);

    const fetchConsultations = useCallback(async () => {
        if (!patientId) {
            return;
        }

        try {
            const response = isParentRole
                ? await apiClient.get(`/parent/patient/${patientId}/upcoming-appointments`)
                : await apiClient.get(`/appointments/patient/${patientId}`);
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
    }, [isParentRole, patientId]);

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
                apiClient.get(`/parent/patient/${patientId}`),
                apiClient.get(`/parent/patient/${patientId}/recommendations`),
                apiClient.get(`/parent/patient/${patientId}/upcoming-appointments`),
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
                parent: normalizeText(patientRes.data.parent || patientRes.data.responsible_name),
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
        if (!canManageConsultations) {
            setError('Perfil de responsável não pode editar atendimentos por esta tela.');
            return;
        }

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

        if (!canManageConsultations) {
            setError('Perfil de responsável não pode criar atendimentos por esta tela.');
            return;
        }

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
        if (!canCreateNotes) {
            setError('Perfil de responsável não pode criar notas clínicas por esta tela.');
            return;
        }

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

    const handleOpenMonitoringTool = (route) => {
        const monitoringToolUrl = new URL(window.location.origin);
        monitoringToolUrl.pathname = route;
        monitoringToolUrl.searchParams.append('patientId', patientId);
        const targetWindowName = MONITORING_WINDOW_NAMES[route]
            || `autisconnect-${route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`;
        const openedWindow = window.open(monitoringToolUrl.toString(), targetWindowName);

        if (openedWindow) {
            openedWindow.focus();
        }
    };

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
        if (!canManagePrescriptions) {
            setError('Perfil de responsável não pode cadastrar prescrições por esta tela.');
            return;
        }

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
        if (!canManagePrescriptions) {
            setError('Perfil de responsável não pode excluir prescrições por esta tela.');
            return;
        }

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
        () => filterRecordsByPeriod(consultations, periodFilter, (record) => record.appointment_date || record.date),
        [consultations, periodFilter]
    );

    const sortedNotes = useMemo(() => (
        [...notes].sort((a, b) => new Date(b.date || b.createdAt || b.created_at) - new Date(a.date || a.createdAt || a.created_at))
    ), [notes]);

    const nextConsultation = useMemo(() => consultations?.[0] || null, [consultations]);

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
                description: 'Foram identificados registros de risco alto no período recente. Vale compartilhar esta leitura com a equipe responsável.'
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

        return alerts;
    }, [anomaly, strokeAnomaly, strokeRiskAnalysis, triggers.length, vocalizationAnomaly]);

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
            <div className={`ac-parent-patient-global-sidebar${collapsed ? ' ac-parent-patient-global-sidebar--collapsed' : ''}${mobile ? ' ac-parent-patient-global-sidebar--mobile' : ''}`}>
                <div className="ac-parent-patient-global-sidebar__brand">
                    <div className="ac-parent-patient-global-sidebar__brand-row">
                        <img src={logonovo} alt="AutisConnect" className="ac-parent-patient-global-sidebar__logo" />
                        {!mobile ? (
                            <button
                                type="button"
                                className="ac-parent-patient-global-sidebar__collapse"
                                aria-label={collapsed ? 'Expandir navegação global' : 'Recolher navegação global'}
                                onClick={() => setIsSidebarCollapsed((previous) => !previous)}
                            >
                                {collapsed ? <ChevronRight /> : <ChevronLeft />}
                            </button>
                        ) : null}
                    </div>
                    <div className="ac-parent-patient-global-sidebar__ribbon" aria-hidden="true" />
                </div>

                <div className="ac-parent-patient-global-sidebar__body">
                    <div className="ac-parent-patient-global-sidebar__group">
                        {!collapsed ? <span className="ac-parent-patient-global-sidebar__label">Navegação</span> : null}
                        <button type="button" className="ac-parent-patient-global-sidebar__item" onClick={handleBackToParent}>
                            <span className="ac-parent-patient-global-sidebar__icon"><ArrowLeft /></span>
                            {!collapsed ? <span>Dashboard dos Pais</span> : null}
                        </button>
                        <div className="ac-parent-patient-global-sidebar__item is-active">
                            <span className="ac-parent-patient-global-sidebar__icon"><PersonCircle /></span>
                            {!collapsed ? <span>Patient Care Center</span> : null}
                        </div>
                    </div>

                    <div className="ac-parent-patient-global-sidebar__group">
                        {!collapsed ? <span className="ac-parent-patient-global-sidebar__label">Contexto</span> : null}
                        <div className="ac-parent-patient-global-sidebar__context">
                            <strong>{patient?.name || 'Paciente'}</strong>
                            {!collapsed ? <span>{PERIOD_LABELS[periodFilter]}</span> : null}
                        </div>
                    </div>
                </div>

                <div className="ac-parent-patient-global-sidebar__footer">
                    <div className="ac-parent-patient-global-sidebar__user">
                        <span className="ac-parent-patient-global-sidebar__avatar">{getInitials(viewerName)}</span>
                        {!collapsed ? (
                            <div>
                                <strong>{viewerName}</strong>
                                <span>{isParentRole ? 'Responsável conectado' : 'Acompanhamento ativo'}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    const renderPatientNavigation = () => (
        <div className="ac-parent-patient-context-nav">
            {PATIENT_NAVIGATION_GROUPS.map((group) => (
                <div key={group.label} className="ac-parent-patient-context-nav__group">
                    <span className="ac-parent-patient-context-nav__label">{group.label}</span>
                    <div className="ac-parent-patient-context-nav__items">
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.key;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    className={`ac-parent-patient-context-nav__item${isActive ? ' is-active' : ''}`}
                                    onClick={() => handleActiveTabChange(item.key)}
                                >
                                    <span className="ac-parent-patient-context-nav__icon"><Icon /></span>
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
        <div className="ac-parent-patient-overview">
            <div className="ac-parent-patient-metric-grid">
                <MetricCard
                    label="Emoção predominante"
                    value={emotionAnalysis ? translateEmotion(emotionAnalysis.dominantEmotion) : 'Sem dados'}
                    hint={latestEmotionRecord ? `Última detecção • ${formatDate(latestEmotionRecord.timestamp)}` : 'Nenhum registro emocional disponível'}
                    tone="emotion"
                />
                <MetricCard
                    label="Risco atual"
                    value={strokeRiskAnalysis ? strokeRiskAnalysis.lastRiskLevel : 'Sem dados'}
                    hint={strokeRiskAnalysis ? `Índice ${strokeRiskAnalysis.lastAsymmetryIndex}` : 'Nenhuma medição disponível'}
                    tone="risk"
                />
                <MetricCard
                    label="Gravações registradas"
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
                <div className="ac-parent-patient-alert-grid">
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

            <div className="ac-parent-patient-overview-grid">
                <div className="ac-parent-patient-overview-main">
                    <ShellCard
                        eyebrow="Resumo do acompanhamento"
                        title="Leitura consolidada do período"
                        subtitle="Síntese dos insights já existentes no sistema, organizada para facilitar o acompanhamento da família."
                    >
                        <div className="ac-parent-patient-insight-stack">
                            <article className="ac-parent-patient-insight-card">
                                <header>
                                    <div>
                                        <span className="ac-parent-patient-insight-card__badge">Análise com IA • Emoções</span>
                                        <h4>Emoções</h4>
                                    </div>
                                    <EmojiSmile />
                                </header>
                                <p>{renderRichSummary(emotionSummary)}</p>
                            </article>
                            <article className="ac-parent-patient-insight-card">
                                <header>
                                    <div>
                                        <span className="ac-parent-patient-insight-card__badge">Análise com IA • Monitoramento</span>
                                        <h4>Monitoramento facial</h4>
                                    </div>
                                    <ShieldCheck />
                                </header>
                                <p>{renderRichSummary(strokeSummary)}</p>
                            </article>
                            <article className="ac-parent-patient-insight-card">
                                <header>
                                    <div>
                                        <span className="ac-parent-patient-insight-card__badge">Análise com IA • Comunicação</span>
                                        <h4>Comunicação</h4>
                                    </div>
                                    <Mic />
                                </header>
                                <p>{renderRichSummary(vocalizationSummary)}</p>
                            </article>
                        </div>
                    </ShellCard>

                    <div className="ac-parent-patient-chart-grid">
                        <ShellCard
                            eyebrow="Evolução"
                            title="Emoções ao Longo do Tempo"
                            subtitle={`Leitura do período selecionado: ${PERIOD_LABELS[periodFilter]}.`}
                            bodyClassName="ac-parent-patient-chart-card"
                        >
                            {chartData.emotionData?.labels?.length > 0 ? (
                                <div className="ac-parent-patient-chart">
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
                            bodyClassName="ac-parent-patient-chart-card"
                        >
                            {chartData.strokeData?.labels?.length > 0 ? (
                                <div className="ac-parent-patient-chart">
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

                <div className="ac-parent-patient-overview-side">
                    <ShellCard
                        eyebrow="Agenda"
                        title="Próximo Atendimento"
                        subtitle="Resumo rápido do próximo compromisso registrado no sistema."
                    >
                        {nextConsultation ? (
                            <div className="ac-parent-patient-summary-block">
                                <div className="ac-parent-patient-summary-block__top">
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
                        eyebrow="Orientações recentes"
                        title="Recomendações e orientações"
                        subtitle="Acompanhe rapidamente os últimos registros compartilhados com a família."
                        actions={canCreateNotes ? (
                            <Button className="ac-parent-patient-secondary-button" onClick={() => setShowNoteModal(true)}>
                                Adicionar orientação
                            </Button>
                        ) : null}
                    >
                        {sortedNotes.length > 0 ? (
                            <div className="ac-parent-patient-note-stack">
                                {sortedNotes.slice(0, 3).map((note) => (
                                    <article key={note.id} className="ac-parent-patient-note-card">
                                        <strong>{note.title}</strong>
                                        <p>{note.content}</p>
                                        <small>{formatDate(note.date || note.createdAt || note.created_at)}</small>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Nenhuma orientação registrada"
                                description="As recomendações compartilhadas com a família aparecerão aqui quando estiverem disponíveis."
                            />
                        )}
                    </ShellCard>

                    <ShellCard
                        eyebrow="Ferramentas"
                        title="Monitoramentos Ativos"
                        subtitle="Atalhos diretos para os módulos de coleta e observação."
                    >
                        <div className="ac-parent-patient-quick-tools">
                            <button type="button" className="ac-parent-patient-quick-tool" onClick={() => handleOpenMonitoringTool(ROUTES.EMOTION_DETECTOR)}>
                                <EmojiSmile />
                                <span>Emoções</span>
                            </button>
                            <button type="button" className="ac-parent-patient-quick-tool" onClick={() => handleOpenMonitoringTool(ROUTES.STROKE_RISK_MONITOR)}>
                                <ShieldCheck />
                                <span>AVC</span>
                            </button>
                            <button type="button" className="ac-parent-patient-quick-tool" onClick={() => handleOpenMonitoringTool(ROUTES.TRIGGER_RECORDER)}>
                                <Mic />
                                <span>Vocalizações</span>
                            </button>
                            <button type="button" className="ac-parent-patient-quick-tool" onClick={() => handleOpenMonitoringTool(`${ROUTES.ABA_MODULE}/${patientId}`)}>
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
        <div className="ac-parent-patient-detail-grid">
            <ShellCard
                eyebrow="Resumo inteligente"
                title="Emoções & Bem-estar"
                subtitle="Leitura assistida baseada nos padrões locais identificados neste período."
            >
                <p className="ac-parent-patient-summary-text">{renderRichSummary(emotionSummary)}</p>
            </ShellCard>

            <div className="ac-parent-patient-chart-grid">
                <ShellCard
                    eyebrow="Visualização"
                    title="Evolução de Emoções"
                    subtitle="Distribuição temporal dos registros emocionais."
                    bodyClassName="ac-parent-patient-chart-card"
                >
                    {chartData.emotionData?.labels?.length > 0 ? (
                        <div className="ac-parent-patient-chart">
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
                    bodyClassName="ac-parent-patient-chart-card"
                >
                    {chartData.emotionDistributionData?.datasets?.[0]?.data?.some((item) => item > 0) ? (
                        <div className="ac-parent-patient-chart">
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

            <div className="ac-parent-patient-two-column">
                <ShellCard
                    eyebrow="Análise"
                    title="Padrões Emocionais"
                    subtitle="Distribuição percentual, tendências diárias e picos observados."
                >
                    {emotionAnalysis ? (
                        <div className="ac-parent-patient-two-column">
                            <div>
                                <h4 className="ac-parent-patient-subsection-title">Distribuição Percentual</h4>
                                <Table responsive className="ac-parent-patient-table ac-parent-patient-table--compact">
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
                            <div className="ac-parent-patient-insight-list">
                                <div className="ac-parent-patient-insight-list__item">
                                    <span>Emoção predominante</span>
                                    <StatusPill value={translateEmotion(emotionAnalysis.dominantEmotion)} />
                                </div>
                                <div className="ac-parent-patient-insight-list__item">
                                    <span>Tendência feliz</span>
                                    <strong>{emotionAnalysis.trend.happy >= 0 ? '+' : ''}{emotionAnalysis.trend.happy}</strong>
                                </div>
                                <div className="ac-parent-patient-insight-list__item">
                                    <span>Tendência tristeza</span>
                                    <strong>{emotionAnalysis.trend.sad >= 0 ? '+' : ''}{emotionAnalysis.trend.sad}</strong>
                                </div>
                                <div className="ac-parent-patient-insight-list__item">
                                    <span>Tendência raiva</span>
                                    <strong>{emotionAnalysis.trend.angry >= 0 ? '+' : ''}{emotionAnalysis.trend.angry}</strong>
                                </div>
                                <div className="ac-parent-patient-insight-list__item">
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
                    eyebrow="Tendência"
                    title="Resumo Inteligente do Período"
                    subtitle="Sinais assistivos para apoiar a interpretação da família e da equipe."
                >
                    <div className="ac-parent-patient-summary-block">
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
                    <div className="ac-parent-patient-alert-grid">
                        {emotionAnalysis.emotionalPeaks.map((peak) => (
                            <AlertCard key={peak} tone="warning" title="Pico identificado" description={peak} />
                        ))}
                    </div>
                </ShellCard>
            ) : null}
        </div>
    );

    const renderVocalizationSection = () => (
        <div className="ac-parent-patient-detail-grid">
            <ShellCard
                eyebrow="Resumo inteligente"
                title="Comunicação & Vocalizações"
                subtitle="Leitura textual a partir dos registros coletados e análises locais."
            >
                <p className="ac-parent-patient-summary-text">{renderRichSummary(vocalizationSummary)}</p>
            </ShellCard>

            <ShellCard
                eyebrow="Tendência"
                title="Resumo Inteligente da Comunicação"
                subtitle="Sinal preditivo assistivo sobre a evolução das vocalizações."
            >
                <div className="ac-parent-patient-summary-block">
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

            <div className="ac-parent-patient-chart-grid">
                <ShellCard
                    eyebrow="Visualização"
                    title="Evolução da Complexidade da Linguagem"
                    subtitle="Diversidade lexical e contagem de palavras por sessão."
                    bodyClassName="ac-parent-patient-chart-card"
                >
                    {chartData.vocalizationTrendData?.labels?.length > 0 ? (
                        <div className="ac-parent-patient-chart">
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
                    bodyClassName="ac-parent-patient-chart-card"
                >
                    {chartData.repetitionPatternData?.labels?.length > 0 ? (
                        <div className="ac-parent-patient-chart">
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
                    <div className="ac-parent-patient-stats-row">
                        <div className="ac-parent-patient-stat">
                            <span>Total de gravações</span>
                            <strong>{vocalizationAnalysis.totalRecordings}</strong>
                        </div>
                        <div className="ac-parent-patient-stat">
                            <span>Média de palavras</span>
                            <strong>{vocalizationAnalysis.averageWordCount}</strong>
                        </div>
                        <div className="ac-parent-patient-stat">
                            <span>Diversidade lexical</span>
                            <strong>{vocalizationAnalysis.averageLexicalDiversity}%</strong>
                        </div>
                        <div className="ac-parent-patient-stat">
                            <span>Repetição dominante</span>
                            <strong>{vocalizationAnalysis.dominantRepetition}</strong>
                        </div>
                    </div>
                ) : null}

                {!isDesktop ? (
                    <div className="ac-parent-patient-note-stack">
                        {filteredVocalizations.length > 0 ? filteredVocalizations.map((record) => (
                            <article key={record.id} className="ac-parent-patient-note-card">
                                <div className="ac-parent-patient-note-card__top">
                                    <strong>{formatDate(record.date)}</strong>
                                    <small>{record.analysis_data?.wordCount ?? 'N/A'} palavras</small>
                                </div>
                                <p>{record.analysis_data?.uniqueWords ?? 'N/A'} únicas • {record.analysis_data?.lexicalDiversity !== undefined ? formatPercentage((record.analysis_data.lexicalDiversity || 0) * 100) : 'Sem dados'}</p>
                                <small>{normalizeText(record.analysis_data?.fullText || 'Sem transcrição disponível')}</small>
                            </article>
                        )) : (
                            <EmptyState
                                title="Nenhuma vocalização registrada"
                                description="Nenhum registro de vocalização foi encontrado para o período selecionado."
                            />
                        )}
                    </div>
                ) : (
                    <div className="ac-parent-patient-table-wrap">
                        <Table responsive className="ac-parent-patient-table">
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
                                        <td className="ac-parent-patient-table__text">{normalizeText(record.analysis_data?.fullText || 'Sem transcrição disponível')}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="ac-parent-patient-table__empty">
                                            Nenhuma vocalização registrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                )}
            </ShellCard>
        </div>
    );

    const renderStrokeSection = () => (
        <div className="ac-parent-patient-detail-grid">
            <ShellCard
                eyebrow="Resumo inteligente"
                title="Monitoramento Facial"
                subtitle="Indicadores de monitoramento não substituem avaliação médica."
            >
                <p className="ac-parent-patient-summary-text">{renderRichSummary(strokeSummary)}</p>
            </ShellCard>

            <div className="ac-parent-patient-chart-grid">
                <ShellCard
                    eyebrow="Visualização"
                    title="Evolução do Índice de Assimetria Facial"
                    subtitle="Leitura histórica das medições disponíveis no período."
                    bodyClassName="ac-parent-patient-chart-card"
                >
                    {chartData.strokeData?.labels?.length > 0 ? (
                        <div className="ac-parent-patient-chart">
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
                    eyebrow="Análise"
                    title="Distribuição Geral de Risco"
                    subtitle="Leitura do último risco registrado e da distribuição geral do período."
                >
                    {strokeRiskAnalysis ? (
                        <>
                            <div className="ac-parent-patient-summary-block">
                                <div className="ac-parent-patient-summary-block__top">
                                    <strong>Risco mais recente</strong>
                                    <StatusPill value={strokeRiskAnalysis.lastRiskLevel} />
                                </div>
                                <p>Índice de assimetria: {strokeRiskAnalysis.lastAsymmetryIndex}</p>
                            </div>
                            <div className="ac-parent-patient-insight-list">
                                {strokeRiskAnalysis.distribution.map((item) => (
                                    <div key={item.level} className="ac-parent-patient-insight-list__item">
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
                eyebrow="Tendência"
                title="Projeções e sinais de atenção"
                subtitle="Sinais preditivos assistivos para apoio à avaliação profissional."
            >
                <div className="ac-parent-patient-summary-block">
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

    const renderMonitoringToolsSection = () => (
        <div className="ac-parent-patient-detail-grid">
            <div className="ac-parent-patient-tools-grid">
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
                title="Módulo ABA"
                description="Gestão de habilidades, atividades e acompanhamento comportamental do paciente."
                buttonLabel="Abrir módulo ABA"
                onClick={() => handleOpenMonitoringTool(`${ROUTES.ABA_MODULE}/${patientId}`)}
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

    const renderAbaSection = () => (
        <ShellCard
            eyebrow="Desenvolvimento"
            title="Atividade ABA"
            subtitle="Os registros ABA são lançados pela equipe profissional e ficam disponíveis aqui para acompanhamento da família."
        >
            <Alert variant="info">
                Os laudos e análises ABA exibidos abaixo preservam a lógica atual do módulo e permanecem em modo de acompanhamento.
            </Alert>
            <AbaReport patientId={patientId} embedded showPdf={false} />
        </ShellCard>
    );

    const renderConsultationsSection = () => (
        <ShellCard
            eyebrow="Agenda"
            title="Histórico de Atendimentos"
            subtitle={canManageConsultations
                ? `${filteredConsultations.length} atendimento(s) exibido(s) no período atual.`
                : `${filteredConsultations.length} atendimento(s) exibido(s) no período atual. A edição permanece exclusiva da equipe clínica.`}
            actions={canManageConsultations ? (
                <Button className="ac-parent-patient-primary-button" onClick={() => setShowConsultationModal(true)}>
                    <PlusCircle className="me-2" /> Novo Atendimento
                </Button>
            ) : null}
        >
            {filteredConsultations.length > 0 ? (
                !isDesktop ? (
                    <div className="ac-parent-patient-note-stack">
                        {filteredConsultations.map((consultation) => (
                            <article key={consultation.id} className="ac-parent-patient-note-card">
                                <div className="ac-parent-patient-note-card__top">
                                    <strong>{formatDate(consultation.appointment_date || consultation.date)}</strong>
                                    <StatusPill value={consultation.status} />
                                </div>
                                <p>{formatTime(consultation.appointment_time || consultation.time)} • {consultation.appointment_type}</p>
                                <small>{consultation.notes || 'Sem observações adicionais.'}</small>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="ac-parent-patient-table-wrap">
                        <Table responsive className="ac-parent-patient-table">
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
                                        <td>{formatDate(consultation.appointment_date || consultation.date)}</td>
                                        <td>{formatTime(consultation.appointment_time || consultation.time)}</td>
                                        <td>{consultation.appointment_type}</td>
                                        <td>
                                            {canManageConsultations ? (
                                                <Form.Select
                                                    size="sm"
                                                    value={consultation.status}
                                                    onChange={(event) => handleFieldUpdate(consultation.id, 'status', event.target.value)}
                                                >
                                                    {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </Form.Select>
                                            ) : (
                                                <StatusPill value={consultation.status} />
                                            )}
                                        </td>
                                        <td>{formatCurrency(consultation.value || 0)}</td>
                                        <td>
                                            {canManageConsultations ? (
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
                                            ) : (
                                                consultation.payment_method || 'N/A'
                                            )}
                                        </td>
                                        <td>
                                            {canManageConsultations ? (
                                                consultation.payment_method === 'Plano de Saúde' || consultation.payment_method === 'Outros' ? (
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
                                                    <span className="ac-parent-patient-table__muted">—</span>
                                                )
                                            ) : (
                                                consultation.payment_details || '—'
                                            )}
                                        </td>
                                        <td>
                                            {canManageConsultations ? (
                                                <Form.Select
                                                    size="sm"
                                                    value={consultation.payment_status}
                                                    onChange={(event) => handleFieldUpdate(consultation.id, 'payment_status', event.target.value)}
                                                >
                                                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </Form.Select>
                                            ) : (
                                                <StatusPill value={consultation.payment_status} />
                                            )}
                                        </td>
                                        <td className="ac-parent-patient-table__text">{consultation.notes || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )
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
            eyebrow="Orientações"
            title="Recomendações e orientações"
            subtitle="Registros textuais usados para compartilhar contexto, combinados e recomendações com a família."
            actions={canCreateNotes ? (
                <Button className="ac-parent-patient-primary-button" onClick={() => setShowNoteModal(true)}>
                    <PlusCircle className="me-2" /> Adicionar orientação
                </Button>
            ) : null}
        >
            {sortedNotes.length > 0 ? (
                <div className="ac-parent-patient-note-stack">
                    {sortedNotes.map((note) => (
                        <article key={note.id} className="ac-parent-patient-note-card">
                            <div className="ac-parent-patient-note-card__top">
                                <strong>{note.title}</strong>
                                <small>{formatDate(note.date || note.createdAt || note.created_at)}</small>
                            </div>
                            <p>{note.content}</p>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Nenhuma orientação registrada"
                    description="Nenhuma recomendação foi registrada para este paciente até o momento."
                />
            )}
        </ShellCard>
    );

    const renderPrescriptionSection = () => (
        <div className="ac-parent-patient-detail-grid">
            <div className="printable-prescription">
                <div className="ac-parent-patient-print-header">
                    <h4>Prescrição Médica</h4>
                    <p><strong>Paciente:</strong> {patient?.name || 'N/A'}</p>
                    <p><strong>Responsável:</strong> {patient?.parent || 'N/A'}</p>
                    <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                {filteredPrescriptions.length > 0 ? filteredPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="ac-parent-patient-print-block">
                        <Table responsive className="ac-parent-patient-table">
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
                            <div className="ac-parent-patient-print-observations">
                                <strong>Observações:</strong> {prescription.observations}
                            </div>
                        ) : null}
                    </div>
                )) : (
                    <p className="text-center">Nenhuma prescrição registrada.</p>
                )}

                <div className="ac-parent-patient-print-footer">
                    <p><strong>Responsável pela impressão:</strong> {viewerName || 'Usuário não identificado'}</p>
                    <p><strong>Registro exibido em:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                    <p><strong>Assinatura:</strong></p>
                    <div className="ac-parent-patient-signature-line" />
                </div>
            </div>

            <ShellCard
                eyebrow="Cuidado"
                title="Prescrições Registradas"
                subtitle="No arquivo atual não há carregamento automático de prescrições; quando houver conteúdo disponível, ele aparecerá aqui."
                actions={(
                    <Button className="ac-parent-patient-secondary-button" onClick={handlePrint}>
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

                {!isDesktop ? (
                    <div className="ac-parent-patient-note-stack">
                        {filteredPrescriptions.length > 0 ? filteredPrescriptions.map((prescription) => (
                            <article key={prescription.id} className="ac-parent-patient-note-card">
                                <div className="ac-parent-patient-note-card__top">
                                    <strong>{formatDate(prescription.date)}</strong>
                                    <small>{prescription.medications?.length || 0} item(ns)</small>
                                </div>
                                <p>{prescription.medications?.[0]?.medication || 'Sem medicamento informado'}</p>
                                <small>{prescription.observations || 'Sem observações adicionais.'}</small>
                            </article>
                        )) : (
                            <EmptyState
                                title="Nenhuma prescrição registrada"
                                description="Ainda não há prescrições carregadas nesta visão."
                            />
                        )}
                    </div>
                ) : (
                    <div className="ac-parent-patient-table-wrap">
                        <Table responsive className="ac-parent-patient-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Prescrição ou Medicamento</th>
                                    <th>Quantidade ou Dosagem</th>
                                    <th>Indicações e Sugestões</th>
                                    <th>Observações</th>
                                    {canManagePrescriptions ? <th className="no-print">Ações</th> : null}
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
                                                {canManagePrescriptions && index === 0 ? (
                                                    <td rowSpan={prescription.medications.length} className="no-print">
                                                        <Button
                                                            className="ac-parent-patient-danger-button"
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
                                        <td colSpan={canManagePrescriptions ? 6 : 5} className="ac-parent-patient-table__empty">
                                            Nenhuma prescrição registrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                )}
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
        case 'aba-activity':
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
            <div className="ac-parent-patient-state-page">
                <div className="ac-parent-patient-state-card">
                    <img src={logonovo} alt="AutisConnect" className="ac-parent-patient-state-card__logo" />
                    <StatusPill value="Erro de carregamento" className="ac-parent-patient-state-card__pill" />
                    <h2>Não foi possível carregar os dados do paciente.</h2>
                    <p>{error}</p>
                    <div className="ac-parent-patient-state-card__actions">
                        <Button className="ac-parent-patient-primary-button" onClick={fetchPatientData}>
                            Tentar novamente
                        </Button>
                        <Button className="ac-parent-patient-secondary-button" onClick={handleBackToParent}>
                            Voltar ao Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="ac-parent-patient-state-page">
                <div className="ac-parent-patient-state-card">
                    <img src={logonovo} alt="AutisConnect" className="ac-parent-patient-state-card__logo" />
                    <StatusPill value="Paciente não encontrado" className="ac-parent-patient-state-card__pill" />
                    <h2>Paciente não encontrado</h2>
                    <p>O paciente solicitado não está disponível ou você não possui acesso.</p>
                    <div className="ac-parent-patient-state-card__actions">
                        <Button className="ac-parent-patient-secondary-button" onClick={handleBackToParent}>
                            Voltar ao Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`ac-parent-patient-page${isDesktop && isSidebarCollapsed ? ' ac-parent-patient-page--collapsed' : ''}`}>
            <aside className="ac-parent-patient-global-shell no-print">
                {renderGlobalSidebar(false)}
            </aside>

            <Offcanvas
                show={showMobileSidebar}
                onHide={() => setShowMobileSidebar(false)}
                placement="start"
                className="ac-parent-patient-offcanvas no-print"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>AutisConnect</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    {renderGlobalSidebar(true)}
                </Offcanvas.Body>
            </Offcanvas>

            <div className="ac-parent-patient-shell">
                <header className="ac-parent-patient-top-header no-print">
                    <div className="ac-parent-patient-top-header__inner">
                        <div className="ac-parent-patient-top-header__left">
                            {!isDesktop ? (
                                <Button className="ac-parent-patient-secondary-button" onClick={() => setShowMobileSidebar(true)}>
                                    <List className="me-2" /> Menu
                                </Button>
                            ) : null}
                            <div>
                                <span className="ac-parent-patient-top-header__eyebrow">Acompanhamento / {patient?.name}</span>
                                <h1>{workspaceMeta.title}</h1>
                                <p>{workspaceMeta.description}</p>
                            </div>
                        </div>
                        <div className="ac-parent-patient-top-header__actions">
                            <Form.Select
                                className="ac-parent-patient-period-select"
                                value={periodFilter}
                                onChange={(event) => setPeriodFilter(event.target.value)}
                                aria-label="Selecionar período"
                            >
                                <option value="week">Última Semana</option>
                                <option value="month">Último Mês</option>
                                <option value="quarter">Último Trimestre</option>
                                <option value="year">Último Ano</option>
                            </Form.Select>
                            {canCreateNotes ? (
                                <Button className="ac-parent-patient-secondary-button" onClick={() => setShowNoteModal(true)}>
                                    <JournalText className="me-2" /> Orientação
                                </Button>
                            ) : null}
                            {canManageConsultations ? (
                                <Button className="ac-parent-patient-primary-button" onClick={() => setShowConsultationModal(true)}>
                                    <PlusCircle className="me-2" /> Novo Atendimento
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </header>

                <main className="ac-parent-patient-main">
                    <section className="ac-parent-patient-identity-card">
                        <div className="ac-parent-patient-identity-card__avatar">{getInitials(patient?.name)}</div>
                        <div className="ac-parent-patient-identity-card__body">
                            <div className="ac-parent-patient-identity-card__top">
                                <div>
                                    <span className="ac-parent-patient-identity-card__eyebrow">Patient Care Center</span>
                                    <h2>{patient?.name || 'Paciente'}</h2>
                                </div>
                                {patientStatus ? <StatusPill value={patientStatus} /> : null}
                            </div>
                            <p className="ac-parent-patient-identity-card__facts">
                                {[patientAge !== 'N/A' ? patientAge : null, patientDiagnosis || null, supportLevelLabel]
                                    .filter(Boolean)
                                    .join(' • ') || 'Informações principais ainda não disponíveis'}
                            </p>
                            {patientSpecialInfo ? <p className="ac-parent-patient-identity-card__note">{patientSpecialInfo}</p> : null}
                        </div>
                        <div className="ac-parent-patient-identity-card__aside">
                            <div className="ac-parent-patient-identity-card__mini">
                                <span>Próximo atendimento</span>
                                <strong>{nextConsultation ? formatDate(nextConsultation.appointment_date || nextConsultation.date) : 'Sem agenda'}</strong>
                                <small>{nextConsultation ? `${formatTime(nextConsultation.appointment_time || nextConsultation.time)} • ${nextConsultation.appointment_type}` : 'Nenhum horário futuro registrado'}</small>
                            </div>
                            <div className="ac-parent-patient-identity-card__mini">
                                <span>Responsável</span>
                                <strong>{patientResponsible}</strong>
                                <small>{greeting} • Atualizado em {todayLabel}</small>
                            </div>
                        </div>
                    </section>

                    {(successMessage || error) && (
                        <div className="ac-parent-patient-feedback-stack no-print">
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
                        <div className="ac-parent-patient-mobile-nav no-print">
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

                    <div className="ac-parent-patient-workspace-grid">
                        <aside className="ac-parent-patient-context-shell no-print">
                            {renderPatientNavigation()}
                        </aside>

                        <section className="ac-parent-patient-workspace-panel">
                            {renderActiveWorkspace()}
                        </section>
                    </div>
                </main>
            </div>

            <Modal show={showNoteModal && canCreateNotes} onHide={() => setShowNoteModal(false)} className="ac-parent-patient-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Adicionar orientação</Modal.Title>
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
                            <Button className="ac-parent-patient-secondary-button" onClick={() => setShowNoteModal(false)}>
                                Cancelar
                            </Button>
                            <Button className="ac-parent-patient-primary-button" type="submit">
                                Salvar
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showConsultationModal && canManageConsultations} onHide={() => setShowConsultationModal(false)} size="lg" className="ac-parent-patient-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Registrar Novo Atendimento</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveConsultation}>
                    <Modal.Body>
                        <section className="ac-parent-patient-form-block">
                            <div className="ac-parent-patient-form-block__header">
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

                        <section className="ac-parent-patient-form-block">
                            <div className="ac-parent-patient-form-block__header">
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
                        <Button className="ac-parent-patient-secondary-button" onClick={() => setShowConsultationModal(false)}>
                            Cancelar
                        </Button>
                        <Button className="ac-parent-patient-primary-button" type="submit">
                            Salvar Atendimento
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default PatientDetailsParent;


