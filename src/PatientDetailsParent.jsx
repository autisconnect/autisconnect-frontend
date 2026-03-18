// PatientDetailsParent.jsx (versão corrigida e completa)

import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Table, Alert, Spinner, Form, Modal, Badge } from 'react-bootstrap';
import { ArrowLeft, GraphUp, Calendar3, ExclamationTriangle, Heart, Wallet, PlusCircle } from 'react-bootstrap-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Line, Bar, Pie, Radar } from 'react-chartjs-2';
import apiClient from './services/api';
import AbaReport from './pages/AbaReport';

import logohori from './assets/logo.png';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import './App.css';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
    RadialLinearScale, Title, Tooltip, Legend, Filler
);

const ROUTES = {
    EMOTION_DETECTOR: '/emotion-detector',
    STROKE_RISK_MONITOR: '/stroke-risk-monitor',
    TRIGGER_RECORDER: '/trigger-recorder',
    ABA_MODULE: '/aba/patient',
};

const PatientDetailsParent = () => {
    // ===================================================
    // 1. HOOKS (useState, useContext, etc.)
    // ===================================================
    const { user } = useContext(AuthContext);
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [notes, setNotes] = useState([]);
    const [strokeData, setStrokeData] = useState(null);
    const [emotionData, setEmotionData] = useState(null);
    const [emotionDistributionData, setEmotionDistributionData] = useState(null);
    const [triggers] = useState([]);
    const [strokeRisks, setStrokeRisks] = useState([]);
    const [emotions, setEmotions] = useState([]);
    const [emotionAnalysis, setEmotionAnalysis] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [searchDate, setSearchDate] = useState('');
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [periodFilter, setPeriodFilter] = useState('month');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [newNoteData, setNewNoteData] = useState({ title: '', content: '' });
    const [successMessage, setSuccessMessage] = useState('');
    const [prediction, setPrediction] = useState("Calculando previsão...");
    const [anomaly, setAnomaly] = useState(null);
    const [strokeRiskAnalysis, setStrokeRiskAnalysis] = useState(null);
    const [strokePrediction, setStrokePrediction] = useState("Calculando previsão...");
    const [strokeAnomaly, setStrokeAnomaly] = useState(null);
    const [vocalizations, setVocalizations] = useState([]);
    const [vocalizationAnalysis, setVocalizationAnalysis] = useState(null);
    const [vocalizationPrediction, setVocalizationPrediction] = useState("Calculando previsão...");
    const [vocalizationAnomaly, setVocalizationAnomaly] = useState(null);
    const [vocalizationTrendData, setVocalizationTrendData] = useState(null);
    const [repetitionPatternData, setRepetitionPatternData] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [showConsultationModal, setShowConsultationModal] = useState(false);
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

    // ===================================================
    // 2. FUNCOES AUXILIARES (handlers, formatters, etc.)
    // ===================================================
    const lineOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Evolução ao Longo do Tempo' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Valor' } } } };
    const pieOptions = { responsive: true, plugins: { legend: { position: 'right' }, title: { display: true, text: 'Distribuição' } } };
    const barOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Comparação entre Sessões' } }, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Porcentagem (%)' } } } };
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'N/A';
    const formatAge = (birthDate) => { if (!birthDate) return 'N/A'; const today = new Date(); const birth = new Date(birthDate); let age = today.getFullYear() - birth.getFullYear(); const monthDiff = today.getMonth() - birth.getMonth(); if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) { age--; } return `${age} anos`; };

    const fetchConsultations = async () => {
        if (!user || !patientId) return;
        try {
            const response = user.tipo_usuario === 'pais_responsavel'
                ? await apiClient.get(`/parent/patient/${patientId}/upcoming-appointments`)
                : await apiClient.get(`/appointments/patient/${patientId}`);
            setConsultations(response.data);
        } catch (err) {
            setError(err.response.data.error || 'Falha ao buscar histórico de consultas.');
        }
    };

    const handleFieldUpdate = async (appointmentId, field, value) => {
        if (user.tipo_usuario === 'pais_responsável') {
            setError('Perfil de responsável não pode editar consultas.');
            return;
        }
        setConsultations(prev => prev.map(c => c.id === appointmentId ? { ...c, [field]: value } : c));
        try {
            await apiClient.put(`/appointments/${appointmentId}`, { field, value });
            setSuccessMessage('Campo atualizado com sucesso!');
            setTimeout(() => setSuccessMessage(''), 2000);
        } catch (err) {
            setError(`Erro ao atualizar: ${err.response.data.error || err.message}`);
            fetchConsultations();
        }
    };

    const handleConsultationInputChange = (e) => {
        const { name, value } = e.target;
        setNewConsultation(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveConsultation = async (e) => {
        if (user.tipo_usuario === 'pais_responsável') {
            setError('Perfil de responsável não pode criar consultas por este formulario.');
            return;
        }
        e.preventDefault();
        if (!newConsultation.appointment_date || !newConsultation.appointment_time || !newConsultation.value) {
            setError('Data, hora e valor são campos obrigatorios.');
            return;
        }
        try {
            const consultationToSave = {
                ...newConsultation,
                patient_id: patientId,
                professional_id: user.id,
                payment_method: ['Outros', 'Plano de Saude'].includes(newConsultation.payment_method)
                    ? newConsultation.payment_details
                    : newConsultation.payment_method
            };
            await apiClient.post('/appointments', consultationToSave);
            await fetchConsultations();
            setSuccessMessage('Consulta registrada com sucesso!');
            setShowConsultationModal(false);
            setNewConsultation({ appointment_date: '', appointment_time: '', appointment_type: 'Regular', status: 'Realizada', payment_method: 'Pix', payment_details: '', payment_status: 'Pago', value: '', notes: '' });
            setError('');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response.data.error || 'Falha ao registrar consulta.');
        }
    };

    const handleSaveNote = async () => {
        if (user.tipo_usuario === 'pais_responsável') {
            setError('Perfil de responsável não pode criar notas clinicas.');
            return;
        }
        if (!newNoteData.title || !newNoteData.content) {
            setError('Por favor, preencha o título e o conteúdo da nota.');
            return;
        }
        try {
            const response = await apiClient.post(`/professional/${user.id}/patients/${patientId}/notes`, newNoteData);
            setNotes([...notes, response.data]);
            setShowNoteModal(false);
            setNewNoteData({ title: '', content: '' });
            setError('');
            setSuccessMessage('Nota gravada com sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response.data.error || 'Falha ao salvar nota.');
        }
    };

    // ===================
    // >>>>> EMOTION <<<<<
    // ===================
    // Ideia 1
    const analyzeEmotionPatterns = (emotionRecords) => {
        if (!emotionRecords || emotionRecords.length === 0) {
            return null;
        }

        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const todayRecords = emotionRecords.filter(e => new Date(e.timestamp) > new Date(now - oneDay));
        const yesterdayRecords = emotionRecords.filter(e => {
            const recordDate = new Date(e.timestamp);
            return recordDate > new Date(now - 2 * oneDay) && recordDate < new Date(now - oneDay);
        });

        // 1. Calcular Emocao Dominante e Distribuição
        const totalCount = emotionRecords.length;
        const counts = emotionRecords.reduce((acc, record) => {
            acc[record.emotion] = (acc[record.emotion] || 0) + 1;
            return acc;
        }, {});

        let dominantEmotion = 'Nenhuma';
        let maxCount = 0;
        for (const emotion in counts) {
            if (counts[emotion] > maxCount) {
                maxCount = counts[emotion];
                dominantEmotion = emotion;
            }
        }

        const distribution = Object.keys(counts).map(emotion => ({
            emotion,
            percentage: ((counts[emotion] / totalCount) * 100).toFixed(1)
        })).sort((a, b) => b.percentage - a.percentage);

        // 2. Calcular Tendencia Diaria
        const todayDominant = todayRecords.reduce((acc, record) => {
            acc[record.emotion] = (acc[record.emotion] || 0) + 1;
            return acc;
        }, {});

        const yesterdayDominant = yesterdayRecords.reduce((acc, record) => {
            acc[record.emotion] = (acc[record.emotion] || 0) + 1;
            return acc;
        }, {});

        const trend = {
            happy: (todayDominant.happy || 0) - (yesterdayDominant.happy || 0),
            sad: (todayDominant.sad || 0) - (yesterdayDominant.sad || 0),
            angry: (todayDominant.angry || 0) - (yesterdayDominant.angry || 0),
        };

        // 3. Identificar Picos Emocionais
        const recordsByDay = emotionRecords.reduce((acc, record) => {
            const day = new Date(record.timestamp).toLocaleDateString('pt-BR');
            if (!acc[day]) acc[day] = [];
            acc[day].push(record.emotion);
            return acc;
        }, {});

        const averageDetectionsPerDay = totalCount / Object.keys(recordsByDay).length;
        const emotionalPeaks = [];
        for (const day in recordsByDay) {
            if (recordsByDay[day].length > averageDetectionsPerDay * 1.5) {
                const dayCounts = recordsByDay[day].reduce((acc, emo) => {
                    acc[emo] = (acc[emo] || 0) + 1;
                    return acc;
                }, {});
                let peakEmotion = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
                emotionalPeaks.push(`Um pico de detecções com predominancia de "${peakEmotion}" foi observado em ${day}.`);
            }
        }

        // 4. CALCULAR VOLATILIDADE (LOCAL CORRETO)

        let moodSwings = 0;
        for (let i = 1; i < emotionRecords.length; i++) {
            if (emotionRecords[i].emotion !== emotionRecords[i - 1].emotion) {
                moodSwings++;
            }
        }
        const volatility = (moodSwings / totalCount) * 100;
        let volatilityText = 'estavel';
        if (volatility > 30) volatilityText = 'variavel';
        if (volatility > 60) volatilityText = 'altamente volatil';


        // O return final que usa todas as variaveis calculadas.
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
            // Retorna uma string vazia ou uma mensagem padrao se não houver análise
            return "Aguardando dados suficientes para gerar o resumo...";
        }

        const { dominantEmotion, distribution, trend, emotionalPeaks, volatilityText } = analysis;

        // Frase 1: Emocao principal
        let summary = `No periodo analisado, o paciente demonstrou um estado emocional predominantemente **${dominantEmotion}**. `;

        // Frase 2: Emocoes secundarias notaveis
        const secondaryEmotion = distribution.find(d => d.emotion !== dominantEmotion && parseFloat(d.percentage) > 15);
        if (secondaryEmotion) {
            summary += `Houve tambem uma presença significativa de sentimentos de **${secondaryEmotion.emotion}** (${secondaryEmotion.percentage}%). `;
        }

        // Frase 3: Volatilidade
        summary += `O comportamento emocional geral mostrou-se **${volatilityText}**. `;

        // Frase 4: Tendencias (so mostra se houver uma tendencia clara)
        if (trend.happy < -2) { // Usando numeros inteiros para comparacao
            summary += "Foi observada uma tendência de **diminuicao na felicidade** nas detecções recentes. ";
        } else if (trend.sad > 2 || trend.angry > 2) {
            summary += "Foi observada uma tendencia de **aumento em emoções negativas** (tristeza/raiva) recentemente. ";
        } else if (trend.happy > 2) {
            summary += "Observa-se uma **tendência positiva** recente, com um aumento notavel na emoção 'feliz'. ";
        }

        // Frase 5: Picos (so mostra se houver picos)
        if (emotionalPeaks.length > 0) {
            // Pega a data do primeiro pico detectado para o resumo
            const firstPeakDateMatch = emotionalPeaks[0].match(/\d{2}\/\d{2}\/\d{4}/);
            if (firstPeakDateMatch) {
                summary += `**Alertas de pico** foram registrados, sugerindo que dias específicos, como ${firstPeakDateMatch[0]}, podem merecer uma análise mais aprofundada.`;
            }
        }

        return summary;
    };

    // =====================
    // >>>>> Risco AVC <<<<<
    // =====================

    const analyzeStrokeRiskPatterns = (riskRecords) => {
        if (!riskRecords || riskRecords.length === 0) return null;

        const totalCount = riskRecords.length;
        const lastRecord = riskRecords[riskRecords.length - 1];

        const counts = riskRecords.reduce((acc, record) => {
            acc[record.risk_level] = (acc[record.risk_level] || 0) + 1;
            return acc;
        }, {});

        const distribution = ['Baixo', 'Médio', 'Alto'].map(level => ({
            level,
            percentage: ((counts[level] || 0) / totalCount * 100).toFixed(1)
        }));

        const recentHighRisk = riskRecords.filter(r => r.risk_level === 'Alto' && new Date(r.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

        return {
            lastRiskLevel: lastRecord.risk_level,
            lastAsymmetryIndex: parseFloat(lastRecord.asymmetry_index).toFixed(2),
            distribution,
            hasRecentHighRisk: recentHighRisk.length > 0,
        };
    };

    const generateStrokeAISummary = (analysis) => {
        if (!analysis) return "Aguardando dados de risco de AVC para gerar resumo.";

        const { lastRiskLevel, distribution, hasRecentHighRisk } = analysis;
        const highRiskPercentage = distribution.find(d => d.level === 'Alto').percentage || 0;

        let summary = `O nível de risco mais recente do paciente foi classificado como **${lastRiskLevel}**. `;
        
        if (highRiskPercentage > 10) {
            summary += ` importante notar que **${highRiskPercentage}%** das medicoes indicaram um risco **Alto**, o que sugere a necessidade de monitoramento continuo. `;
        } else {
            summary += `A maioria das medicoes indicou um risco baixo a moderado. `;
        }

        if (hasRecentHighRisk) {
            summary += `**Alerta:** Foram detectados episódios de risco **Alto** na Última semana, recomendando-se atencao a quaisquer sintomas.`;
        } else {
            summary += "Não foram detectados episódios de risco alto na Última semana.";
        }

        return summary;
    };

    // ===================
    // >>>>> Gatilho <<<<<
    // ===================

    // ==========================
    // >>>>> VOCALIZAES <<<<<
    // ==========================

    // Nível 1: Análise Estatística
    const analyzeVocalizationPatterns = (vocalizationRecords) => {
        if (!vocalizationRecords || vocalizationRecords.length === 0) return null;

        const allAnalyses = vocalizationRecords.map(v => v.analysis);

        const totalWordCount = allAnalyses.reduce((sum, a) => sum + a.wordCount, 0);
        const averageDiversity = allAnalyses.reduce((sum, a) => sum + a.lexicalDiversity, 0) / allAnalyses.length;

        const allRepeatedWords = allAnalyses.flatMap(a => a.repeatedWords);
        const mostCommonRepetition = allRepeatedWords.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});

        const dominantRepetition = Object.keys(mostCommonRepetition).reduce((a, b) => mostCommonRepetition[a] > mostCommonRepetition[b] ? a : b, 'Nenhuma');

        return {
            totalRecordings: vocalizationRecords.length,
            averageWordCount: (totalWordCount / allAnalyses.length).toFixed(1),
            averageLexicalDiversity: (averageDiversity * 100).toFixed(1),
            dominantRepetition,
        };
    };

    // Nível 2: Resumo em Linguagem Natural
    const generateVocalizationAISummary = (analysis) => {
        if (!analysis) return "Aguardando dados de vocalizacao para gerar resumo.";

        const { averageWordCount, averageLexicalDiversity, dominantRepetition, totalRecordings } = analysis;

        let summary = `Com base em **${totalRecordings}** gravacoes, o paciente apresenta uma media de **${averageWordCount}** palavras por vocalizacao. `;
        summary += `A diversidade lexical media  de **${averageLexicalDiversity}%**, indicando a complexidade da comunicao. `;

        if (dominantRepetition !== 'Nenhuma') {
            summary += `O padrao de repeticao mais comum observado foi a palavra/frase **"${dominantRepetition}"**, o que pode ser um ponto de interesse para análise de ecolalia ou perseveracao.`;
        } else {
            summary += "Não foram observados padroes de repeticao significativos (ecolalia) nas gravacoes."
        }

        return summary;
    };

    useEffect(() => {
        const fetchPatientData = async () => {
            if (!user || !patientId) {
                navigate('/login');
                return;
            }

            setLoading(true);
            setError('');
            try {
                const [
                    patientRes, notesRes, consultationsRes, vocalizationsRes,
                    strokeRes, emotionsRes
                ] = await Promise.all([
                    apiClient.get(`/parent/patient/${patientId}`),
                    apiClient.get(`/parent/patient/${patientId}/recommendations`),
                    apiClient.get(`/parent/patient/${patientId}/upcoming-appointments`),
                    apiClient.get(`/vocalizations/${patientId}`),
                    apiClient.get(`/stroke-risk/${patientId}`),
                    apiClient.get(`/emotions/${patientId}`),
                ]);

                const patientData = patientRes.data;
                const notesData = notesRes.data;
                const consultationsData = consultationsRes.data;
                const vocalizationsData = vocalizationsRes.data;
                const strokeDataFromDB = strokeRes.data;
                const emotionsDataFromDB = emotionsRes.data;

                const validVocalizations = (Array.isArray(vocalizationsData) ? vocalizationsData : []).map(v => {
                    let parsedAnalysis = {};
                    try {
                        if (v.analysis_data && typeof v.analysis_data === 'string' && v.analysis_data.startsWith('{')) {
                            parsedAnalysis = JSON.parse(v.analysis_data);
                        } else if (typeof v.analysis_data === 'object' && v.analysis_data !== null) {
                            parsedAnalysis = v.analysis_data;
                        }
                    } catch (e) { console.error("Falha ao fazer parse do JSON da vocalizacao:", v.analysis_data, e); }
                    return { ...v, analysis: parsedAnalysis };
                });

                const validStrokeRisks = Array.isArray(strokeDataFromDB) ? strokeDataFromDB : [];
                const validEmotions = Array.isArray(emotionsDataFromDB) ? emotionsDataFromDB : [];

                setPatient(patientData);
                setNotes(Array.isArray(notesData) ? notesData : []);
                setConsultations(Array.isArray(consultationsData) ? consultationsData : []);
                setVocalizations(validVocalizations);
                setStrokeRisks(validStrokeRisks);
                setEmotions(validEmotions);

                setVocalizationAnalysis(analyzeVocalizationPatterns(validVocalizations));
                setStrokeRiskAnalysis(analyzeStrokeRiskPatterns(validStrokeRisks));
                setEmotionAnalysis(analyzeEmotionPatterns(validEmotions));

                processChartData(validStrokeRisks, validEmotions, validVocalizations);

            } catch (err) {
                console.error('Erro ao carregar dados do paciente:', err);
                const errorMessage = err.response.data.error || err.message || 'Ocorreu um erro desconhecido.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, patientId, periodFilter, navigate]);


    // Adicione este novo useEffect logo apos o useEffect acima
    useEffect(() => {
        if (patientId && emotions.length > 0) {
            const fetchAIAnalysis = async () => {
                try {
                    const aiResponse = await apiClient.get(`/iaemotions/analysis/${patientId}?type=emotion`);
                    setPrediction(aiResponse.data.predictionText || "Previsão gerada com sucesso.");
                    setAnomaly(aiResponse.data.anomaly || null);
                } catch (aiError) {
                    console.error("Erro ao buscar análise de IA de emoções:", aiError);
                    setPrediction("Não foi possível conectar ao serviço de análise de emoções.");
                }
            };
            fetchAIAnalysis();
        }
    }, [emotions, patientId]);

    // ===================================================
    // >>>>> NOVO useEffect PARA IA DE RISCO DE AVC <<<<<
    // ===================================================
    useEffect(() => {
        if (patientId && strokeRisks.length > 0) {
            const fetchStrokeAIAnalysis = async () => {
                try {
                    const aiResponse = await apiClient.get(`/iaemotions/analysis/${patientId}?type=stroke`);
                    setStrokePrediction(aiResponse.data.predictionText || "Previsão de risco gerada.");
                    setStrokeAnomaly(aiResponse.data.anomaly || null);
                } catch (aiError) {
                    console.error("Erro ao buscar análise de IA para Risco de AVC:", aiError);
                    setStrokePrediction("Não foi possível conectar ao serviço de análise de risco.");
                }
            };
            fetchStrokeAIAnalysis();
        }
    }, [strokeRisks, patientId]);

    useEffect(() => {
        if (patientId && vocalizations.length > 0) {
            const fetchVocalizationAI = async () => {
                try {
                    const response = await apiClient.get(`/iavocalizations/analysis/${patientId}`);
                    setVocalizationPrediction(response.data.predictionText);
                    setVocalizationAnomaly(response.data.anomaly);
                } catch (err) {
                    console.error("Erro ao buscar IA de vocalizações:", err);
                    setVocalizationPrediction("Não foi possível conectar ao serviço de análise de vocalizações.");
                }
            };
            fetchVocalizationAI();
        }
    }, [vocalizations, patientId]);

    const processChartData = (strokeRisks, emotions, vocalizations) => {

        // --- PROCESSAMENTO DE RISCO DE AVC ---
        const strokeChartData = {
            labels: strokeRisks.map(r => new Date(r.date).toLocaleDateString('pt-BR')),
            datasets: [{
                label: 'Indice de Assimetria Facial',
                data: strokeRisks.map(r => parseFloat(r.asymmetry_index)),
                borderColor: 'rgba(220, 53, 69, 1)',
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                fill: true,
                tension: 0.4
            }]
        };
        setStrokeData(strokeChartData);

        // --- PROCESSAMENTO DE EMOES ---
        if (emotions && emotions.length > 0) {
            const emotionTypes = ['happy', 'sad', 'neutral', 'angry', 'surprised', 'fearful', 'disgusted'];
            const emotionColors = [
                'rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(201, 203, 207, 0.6)',
                'rgba(255, 99, 132, 0.6)', 'rgba(255, 205, 86, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'
            ];

            const emotionCounts = emotions.reduce((acc, record) => {
                acc[record.emotion] = (acc[record.emotion] || 0) + 1;
                return acc;
            }, {});

            const distributionData = {
                labels: emotionTypes.map(e => e.charAt(0).toUpperCase() + e.slice(1)),
                datasets: [{
                    label: 'Distribuição de Emoções',
                    data: emotionTypes.map(type => emotionCounts[type] || 0),
                    backgroundColor: emotionColors,
                    borderColor: emotionColors.map(color => color.replace('0.6', '1')),
                    borderWidth: 1,
                }]
            };
            setEmotionDistributionData(distributionData);

            const dailyCounts = emotions.reduce((acc, record) => {
                const date = new Date(record.timestamp).toLocaleDateString('pt-BR');
                if (!acc[date]) acc[date] = {};
                acc[date][record.emotion] = (acc[date][record.emotion] || 0) + 1;
                return acc;
            }, {});

            const sortedDates = Object.keys(dailyCounts).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

            const lineChartData = {
                labels: sortedDates,
                datasets: emotionTypes.map((type, index) => ({
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    data: sortedDates.map(date => (dailyCounts[date] && dailyCounts[date][type]) || 0),
                    borderColor: emotionColors[index].replace('0.6', '1'),
                    backgroundColor: emotionColors[index],
                    fill: false,
                    tension: 0.1
                }))
            };
            setEmotionData(lineChartData);
        } else {
            setEmotionData({ labels: [], datasets: [] });
            setEmotionDistributionData({ labels: [], datasets: [] });
        }

        // ===================================================
        // >>>>> NOVO PROCESSAMENTO PARA GRAFICOS DE VOCALIZACAO <<<<<
        // ===================================================
        if (vocalizations && vocalizations.length > 0) {
            const sortedVocalizations = [...vocalizations].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            const trendData = {
                labels: sortedVocalizations.map(v => formatDate(v.date)),
                datasets: [
                    {
                        label: 'Diversidade Lexica (%)',
                        data: sortedVocalizations.map(v => (v.analysis_data.lexicalDiversity * 100).toFixed(1)), 
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        yAxisID: 'y',
                    },
                    {
                        label: 'Contagem de Palavras',
                        data: sortedVocalizations.map(v => v.analysis_data.wordCount),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        yAxisID: 'y1',
                    }
                ]
            };
            setVocalizationTrendData(trendData);

            const allRepeatedWords = vocalizations.flatMap(v => v.analysis.repeatedWords);
            const repetitionCounts = allRepeatedWords.reduce((acc, word) => {
                const wordOnly = word.split(' (')[0];
                acc[wordOnly] = (acc[wordOnly] || 0) + 1;
                return acc;
            }, {});

            const sortedRepetitions = Object.entries(repetitionCounts).sort(([,a],[,b]) => b-a).slice(0, 10);

            const repetitionData = {
                labels: sortedRepetitions.map(([word]) => word),
                datasets: [{
                    label: 'Frequência de Repetição',
                    data: sortedRepetitions.map(([, count]) => count),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                }]
            };
            setRepetitionPatternData(repetitionData);

        } else {
            setVocalizationTrendData(null);
            setRepetitionPatternData(null);
        }
    };

    const handleOpenMonitoringTool = (route) => {
        const monitoringToolUrl = new URL(window.location.origin);
        monitoringToolUrl.pathname = route;
        monitoringToolUrl.searchParams.append('patientId', patientId);
        window.open(monitoringToolUrl.toString(), '_blank', 'noopener,noreferrer');
    };

    const handlePeriodChange = (e) => {
        setPeriodFilter(e.target.value);
    };

    const handleDeletePrescription = (id) => {
        const updatedPrescriptions = prescriptions.filter(p => p.id !== id);
        setPrescriptions(updatedPrescriptions);
        setFilteredPrescriptions(updatedPrescriptions);
    };

    const handleSearchDate = (e) => {
        const date = e.target.value;
        setSearchDate(date);
        if (date) {
            setFilteredPrescriptions(prescriptions.filter(p => p.date === date));
        } else {
            setFilteredPrescriptions(prescriptions);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p>Carregando detalhes do paciente...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    if (!patient) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">Paciente não encontrado. Verifique se o paciente existe no sistema.</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 patient-details-page">
            <style>
                {`
                    @media print {
                        body * { visibility: hidden; }
                        .printable-prescription, .printable-prescription * { visibility: visible; }
                        .printable-prescription { position: absolute; top: 0; left: 0; width: 100%; }
                        .print-header, .print-footer { margin: 20px 0; }
                        .print-header h4, .print-footer p { margin: 5px 0; }
                        .print-footer .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 20px; }
                        .no-print { display: none; }
                        .prescription-observations { margin-top: 10px; margin-bottom: 20px; font-size: 14px; }
                    }
                `}
            </style>

            {successMessage && (
                <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                    {successMessage}
                </Alert>
            )}

            <Row className="patient-header-row mb-4 align-items-center">
                
                {/* Coluna da Logo */}
                <Col xs="auto">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                </Col>

                {/* Coluna da Logo e Título (Centralizada) */}
                <Col>
                    <h1 className="patient-name mb-0 mt-2">Dashboard Paciente</h1>
                    <p className="patient-info text-muted mb-0">{patient.name} - {patient.specialInfo}</p>
                </Col>

                {/* Coluna das Informações do Paciente ( direita) */}
                <Col xs="auto">
                    <div className="patient-info-block">
                        <div className="info-item">
                            <strong>Idade:</strong>
                            <span>{formatAge(patient.birthDate)}</span>
                        </div>
                        <div className="info-item">
                            <strong>Diagnóstico:</strong>
                            <span>{patient.diagnosis || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <strong>Responsável:</strong>
                            <span>{patient.parent || 'N/A'}</span>
                        </div>
                    </div>
                </Col>

                {/* Coluna do Botao Sair */}
                <Col xs="auto">
                    <Button 
                        variant="outline-primary" 
                        onClick={() => window.close()} 
                        className="back-button-standalone"
                    >
                        <ArrowLeft /> Sair
                    </Button>
                </Col>
            </Row>

            <Row className="mb-4 no-print">
                <Col md={3}>
                    <div className="d-flex align-items-center">
                        <label htmlFor="period-filter" className="me-2">Periodo:</label>
                        <select
                            id="period-filter"
                            className="form-select"
                            value={periodFilter}
                            onChange={handlePeriodChange}
                        >
                            <option value="week">Última Semana</option>
                            <option value="month">Último Mês</option>
                            <option value="quarter">Último Trimestre</option>
                            <option value="year">Último Ano</option>
                        </select>
                    </div>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col>
                    <Tab.Container id="monitoring-tabs" activeKey={activeTab} onSelect={setActiveTab}>
                        <Nav variant="tabs" className="mb-3 no-print">
                            <Nav.Item>
                                <Nav.Link eventKey="overview">Visão Geral</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="trigger">Vocalizações</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="stroke">Risco de AVC</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="emotion">Emoções</Nav.Link>
                            </Nav.Item>
                            {/* <Nav.Item>
                                <Nav.Link eventKey="vocalization">Vocalizaes</Nav.Link>
                            </Nav.Item> */}
                            <Nav.Item>
                                <Nav.Link eventKey="monitoring-tools">Ferramentas de Monitoramento</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="prescription">Prescrição Médica</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="aba-activity">Atividade ABA</Nav.Link>
                            </Nav.Item>
                            {/*<Nav.Item>
                                <Nav.Link eventKey="aba">ABA</Nav.Link>
                            </Nav.Item>*/}
                        </Nav>

                        <Tab.Content>
                            <Tab.Pane eventKey="overview" className="no-print">
                                <Row>
                                    <Col md={12} className="mb-4">
                                        <Row>
                                            <Col md={3}>
                                                <Card className="text-center mb-3 mb-md-0 shadow-sm">
                                                    <Card.Body>
                                                        <ExclamationTriangle className="text-warning mb-2" size={24} />
                                                        <h6>Gatilhos Identificados</h6>
                                                        <h3>{triggers.length}</h3>
                                                        <small className="text-muted">
                                                            Ultimo: {triggers?.[0]?.description || 'N/A'} ({formatDate(triggers?.[0]?.date) || 'N/A'})
                                                        </small>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="text-center mb-3 mb-md-0 shadow-sm">
                                                    <Card.Body>
                                                        <Heart className="text-danger mb-2" size={24} />
                                                        <h6>Risco de AVC</h6>
                                                        <h3>{strokeRisks?.[0]?.risk_level || 'N/A'}</h3>
                                                        <small className="text-muted">
                                                            Assimetria: {strokeRisks?.[0]?.asymmetry_index || 'N/A'}
                                                        </small>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="text-center shadow-sm">
                                                    <Card.Body>
                                                        <Calendar3 className="text-success mb-2" size={24} />
                                                        <h6>Emoção Predominante</h6>
                                                        <h3>{emotions?.[0]?.emotion || 'N/A'}</h3>
                                                        <small className="text-muted">
                                                            Última sessão: {emotions?.[0]?.percentage || '0'}%
                                                        </small>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Col>
                                    {/* <Col md={6} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Evolução de Gatilhos e Estereotipias</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {triggerData ? <Line data={triggerData} options={lineOptions} /> : <p>Carregando...</p>}
                                            </Card.Body>
                                        </Card>
                                    </Col> */}
                                    <Col md={6} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Evolução de Emoções</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {emotionData ? <Line data={emotionData} options={lineOptions} /> : <p>Carregando...</p>}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Índice de Assimetria Facial</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {strokeData ? <Line data={strokeData} options={lineOptions} /> : <p>Carregando...</p>}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Notas do Paciente</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h6>Notas</h6>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => setShowNoteModal(true)}
                                                        disabled={!patient.id}
                                                    >
                                                        Adicionar Nota
                                                    </Button>
                                                </div>
                                                {successMessage && (
                                                    <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                                                        {successMessage}
                                                    </Alert>
                                                )}
                                                {error && (
                                                    <Alert variant="danger" onClose={() => setError('')} dismissible>
                                                        {error}
                                                    </Alert>
                                                )}
                                                {notes && Array.isArray(notes) && notes.length > 0 ? (
                                                    notes.map(note => (
                                                        note && note.id ? (
                                                            <Card key={note.id} className="mb-2">
                                                                <Card.Body>
                                                                    <h6>{note.title || 'Sem título'}</h6>
                                                                    <p className="mb-1">{note.content || 'Sem conteúdo'}</p>
                                                                    <small className="text-muted">
                                                                        {formatDate(note.date || note.createdAt || note.created_at)}
                                                                    </small>
                                                                </Card.Body>
                                                            </Card>
                                                        ) : null
                                                    ))
                                                ) : (
                                                    <p className="text-muted">Nenhuma nota registrada.</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                        <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)}>
                                            <Modal.Header closeButton>
                                                <Modal.Title>Adicionar Nota</Modal.Title>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <Form>
                                                    <Form.Group controlId="noteTitle" className="mb-3">
                                                        <Form.Label>Título</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={newNoteData.title}
                                                            onChange={(e) => setNewNoteData({ ...newNoteData, title: e.target.value })}
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
                                                            onChange={(e) => setNewNoteData({ ...newNoteData, content: e.target.value })}
                                                            required
                                                            placeholder="Digite o conteúdo da nota"
                                                        />
                                                    </Form.Group>
                                                </Form>
                                            </Modal.Body>
                                            <Modal.Footer>
                                                <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
                                                    Cancelar
                                                </Button>
                                                <Button variant="primary" onClick={handleSaveNote}>
                                                    Salvar
                                                </Button>
                                            </Modal.Footer>
                                        </Modal>
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            {/* >>>>> ABA "GATILHOS" ATUALIZADA E COMPLETA <<<<< */}
                            <Tab.Pane eventKey="trigger" className="no-print">
                                <Row>
                                    {/* IA Nível 2 e 3 */}
                                    <Col md={12} className="mb-4">
                                        <Card className="shadow-sm">
                                            <Card.Header><h5 className="mb-0">Análise Inteligente de Vocalização (IA)</h5></Card.Header>
                                            <Card.Body>
                                                <p className="lead ai-summary">
                                                    {generateVocalizationAISummary(vocalizationAnalysis)}
                                                </p>
                                                <h6>Projecao de Tendência de Comunicação (IA - Nível 3)</h6>
                                                <p>{vocalizationPrediction}</p>
                                                {vocalizationAnomaly && vocalizationAnomaly.detected && (
                                                    <Alert variant="danger" className="alert-anomaly">
                                                        <strong>Alerta de Anomalia na Vocalização:</strong> {vocalizationAnomaly.message}
                                                    </Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Gráficos */}
                                    <Col md={8} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header><h5 className="mb-0">Evolução da Complexidade da Linguagem</h5></Card.Header>
                                            <Card.Body>
                                                {vocalizationTrendData ? (
                                                    <Line data={vocalizationTrendData} options={{
                                                        ...lineOptions,
                                                        scales: {
                                                            y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Diversidade Lexica (%)' } },
                                                            y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Contagem de Palavras' } },
                                                        }
                                                    }} />
                                                ) : (
                                                    <p className="text-muted text-center pt-5">Não há dados suficientes para exibir a evolução.</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header><h5 className="mb-0">Padrões de Repetição (Top 10)</h5></Card.Header>
                                            <Card.Body>
                                                {repetitionPatternData && repetitionPatternData.labels.length > 0 ? (
                                                    <Bar data={repetitionPatternData} options={{...barOptions, indexAxis: 'y'}} />
                                                ) : (
                                                    <p className="text-muted text-center pt-5">Nenhum padrão de repetição significativo encontrado.</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Tabela de Historico */}
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header><h5 className="mb-0">Histórico de Vocalizações</h5></Card.Header>
                                            <Card.Body>
                                                {vocalizationAnalysis ? (
                                                    <Row className="mb-3 text-center">
                                                        <Col><strong>Total de Gravações:</strong>
                                                            {vocalizationAnalysis.totalRecordings}</Col>
                                                                <Col><strong>Média de Palavras:</strong>
                                                            {vocalizationAnalysis.averageWordCount}</Col>
                                                                <Col><strong>Diversidade Lexica:</strong>
                                                            {vocalizationAnalysis.averageLexicalDiversity}%</Col>
                                                                <Col><strong>Repetição Dominante:</strong>
                                                            <Badge bg="warning">{vocalizationAnalysis.dominantRepetition}</Badge></Col>
                                                    </Row>
                                                ) : <p className="text-muted text-center">Aguardando dados para exibir métricas.</p>}
                                                
                                                <Table striped bordered hover responsive size="sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Data</th>
                                                            <th>Cont. Palavras</th>
                                                            <th>Palavras Únicas</th>
                                                            <th>Diversidade</th>
                                                            <th>Texto Transcrito</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vocalizations.length > 0 ? (
                                                            vocalizations.map(v => (
                                                                <tr key={v.id}>
                                                                    <td>{formatDate(v.date)}</td>
                                                                    <td>{v.analysis_data.wordCount}</td>
                                                                    <td>{v.analysis_data.uniqueWords}</td>
                                                                    <td>{(v.analysis_data.lexicalDiversity * 100).toFixed(1)}%</td>
                                                                    <td style={{maxWidth: '400px', whiteSpace: 'pre-wrap'}}>{v.analysis_data.fullText}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="text-center">Nenhuma vocalização registrada.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            <Tab.Pane eventKey="stroke" className="no-print">
                                <Row>
                                    {/* IA Nível 2 e 3 */}
                                    <Col md={12} className="mb-4">
                                        <Card className="shadow-sm">
                                            <Card.Header><h5 className="mb-0">Análise Inteligente de Risco de AVC (IA)</h5></Card.Header>
                                            <Card.Body>
                                                <p className="lead ai-summary">
                                                    {generateStrokeAISummary(strokeRiskAnalysis)}
                                                </p>
                                                {strokeRiskAnalysis.hasRecentHighRisk && (
                                                    <Alert variant="danger" className="alert-anomaly">
                                                        <strong>Alerta de Risco Elevado:</strong> Foram detectados episódios de risco **Alto** na Última semana. Recomenda-se atenção redobrada aos sinais de AVC.
                                                    </Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Gráficos */}
                                    <Col md={8} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header><h5 className="mb-0">Evolução do Índice de Assimetria Facial</h5></Card.Header>
                                            <Card.Body>
                                                {strokeData && strokeData.labels.length > 0 ? 
                                                    <Line data={strokeData} options={lineOptions} /> :
                                                    <p>Não há dados suficientes para exibir a evolução.</p>
                                                }
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* IA Nível 1 */}
                                    <Col md={4} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header><h5 className="mb-0">Análise de Risco</h5></Card.Header>
                                            <Card.Body>
                                                {strokeRiskAnalysis ? (
                                                    <>
                                                        <h6>Risco Mais Recente</h6>
                                                        <p className="h4">
                                                            <Badge bg={
                                                                strokeRiskAnalysis.lastRiskLevel === 'Alto' ? 'danger' :
                                                                strokeRiskAnalysis.lastRiskLevel === 'Médio' ? 'warning' : 'success'
                                                            }>
                                                                {strokeRiskAnalysis.lastRiskLevel}
                                                            </Badge>
                                                        </p>
                                                        <p className="text-muted">
                                                            Índice de Assimetria: {strokeRiskAnalysis.lastAsymmetryIndex}
                                                        </p>
                                                        <hr />
                                                        <h6>Distribuição Geral</h6>
                                                        {strokeRiskAnalysis.distribution.map(item => (
                                                            <div key={item.level} className="d-flex justify-content-between">
                                                                <span>{item.level}</span>
                                                                <strong>{item.percentage}%</strong>
                                                            </div>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <p>Não há dados para análise.</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    {/* =================================================== */}
                                    {/* >>>>> NOVO CARD DE PROJECOES (IA NIVEL 3) <<<<< */}
                                    {/* =================================================== */}
                                    <Col md={12} className="mb-4">
                                        <Card className="shadow-sm card-ia-prediction">
                                            <Card.Header><h5 className="mb-0">Projeções e Anomalias de Risco (IA - Nível 3)</h5></Card.Header>
                                            <Card.Body>
                                                <h6>Projeção de Tendência</h6>
                                                <p>{strokePrediction}</p>
                                                {strokeAnomaly && strokeAnomaly.detected && (
                                                    <Alert variant="danger" className="alert-anomaly">
                                                        <strong>Alerta de Anomalia Detectada:</strong> {strokeAnomaly.message}
                                                    </Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                                <Tab.Pane eventKey="aba-activity" className="no-print">
                                <Card className="shadow-sm">
                                    <Card.Header>
                                        <h5 className="mb-0">Laudos de Acompanhamento ABA</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Alert variant="info" className="mb-4">
                                            Os registros da Atividade ABA são inseridos apenas pelos profissionais.
                                            Aqui você acompanha os laudos e análises disponíveis.
                                        </Alert>
                                        <AbaReport patientId={patientId} embedded showPdf={false} />
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="emotion" className="no-print">                               <Row>
                                    {/* ================================================================== */}
                                    {/* ================ GRAFICOS DE VISUALIZACAO DE DADOS =============== */}
                                    {/* ================================================================== */}
                                    <Col md={8} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Evolução de Emoções ao Longo do Tempo</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {emotionData && emotionData.datasets.length > 0 && emotionData.labels.length > 0 ? 
                                                    <Line data={emotionData} options={lineOptions} /> : 
                                                    <p>Não há dados suficientes para exibir a evolução.</p>
                                                }
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Distribuição de Emoções</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {emotionDistributionData && emotionDistributionData.datasets.length > 0 && emotionDistributionData.datasets[0].data.some(d => d > 0) ? (
                                                    <Pie data={emotionDistributionData} options={pieOptions} />
                                                ) : (
                                                    <p>Não há dados para exibir a distribuição.</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* ================================================================== */}
                                    {/* ================ CARD DA ANALISE DE PADROES (IA NIVEL 1) ========= */}
                                    {/* ================================================================== */}
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Análise de Padrões Emocionais (IA - Nível 1)</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {emotionAnalysis ? (
                                                    <Row>
                                                        <Col md={6}>
                                                            <h6><GraphUp className="me-2" />Distribuição Percentual</h6>
                                                            <Table striped size="sm" hover>
                                                                <tbody>
                                                                    {emotionAnalysis.distribution.map(item => (
                                                                        <tr key={item.emotion}>
                                                                            <td>{item.emotion.charAt(0).toUpperCase() + item.emotion.slice(1)}</td>
                                                                            <td className="text-end"><strong>{item.percentage}%</strong></td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                        <Col md={6}>
                                                            <h6><ExclamationTriangle className="me-2" />Insights e Tendências</h6>
                                                            <p>
                                                                <strong>Emoção Dominante:</strong>{' '}
                                                                <Badge bg="primary">{emotionAnalysis.dominantEmotion.toUpperCase()}</Badge>
                                                            </p>
                                                            <h6>Tendência (Hoje vs. Ontem)</h6>
                                                            <ul className="list-unstyled trend-list">
                                                                <li>Feliz: <Badge bg={emotionAnalysis.trend.happy >= 0 ? 'success' : 'danger'}>{emotionAnalysis.trend.happy >= 0 ? '+' : ''}{emotionAnalysis.trend.happy}</Badge></li>
                                                                <li>Triste: <Badge bg={emotionAnalysis.trend.sad > 0 ? 'danger' : 'success'}>{emotionAnalysis.trend.sad > 0 ? '+' : ''}{emotionAnalysis.trend.sad}</Badge></li>
                                                                <li>Raiva: <Badge bg={emotionAnalysis.trend.angry > 0 ? 'danger' : 'success'}>{emotionAnalysis.trend.angry > 0 ? '+' : ''}{emotionAnalysis.trend.angry}</Badge></li>
                                                            </ul>
                                                            {emotionAnalysis.emotionalPeaks.length > 0 && (
                                                                <>
                                                                    <h6>Picos Emocionais Detectados</h6>
                                                                    {emotionAnalysis.emotionalPeaks.map((peak, index) => (
                                                                        <Alert variant="warning" key={index} className="alert-emotional-peak">{peak}</Alert>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                ) : (
                                                    <p className="text-muted">Não há dados suficientes para gerar uma análise.</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    {/* ================================================================== */}
                                    {/* ================ CARD DO RESUMO INTELIGENTE (IA NIVEL 2) ========= */}
                                    {/* ================================================================== */}
                                    <Col md={12} className="mb-4">
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Resumo Inteligente (IA - Nível 2)</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <p className="lead ai-summary">
                                                    {/* Esta funo gera o pargrafo de texto com base na análise */}
                                                    {generateAISummary(emotionAnalysis)}
                                                </p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    {/* ================================================================== */}
                                    {/* ======CARD inteligencia preditiva e proativa IA(IA NIVEL 3) ====== */}
                                    {/* ================================================================== */}
                                    <Col md={12} className="mb-4">
                                        <Card className="shadow-sm card-ia-prediction">
                                            <Card.Header>
                                                <h5 className="mb-0">Projeções e Anomalias (IA - Nível 3)</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <h6>Previsão para Próximas 24h</h6>
                                                <p>{prediction}</p>
                                                {anomaly && anomaly.detected && (
                                                    <Alert variant="danger" className="alert-anomaly">
                                                        <strong>Alerta de Anomalia Detectada:</strong> {anomaly.message}
                                                    </Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            <Tab.Pane eventKey="monitoring-tools" className="no-print">
                                <Card className="shadow-sm">
                                    <Card.Body>
                                        <Card.Title>Ferramentas de Monitoramento</Card.Title>
                                        <Row>
                                            <Col md={6} className="mb-4">
                                                <Card className="h-100">
                                                    <Card.Body className="d-flex flex-column align-items-center">
                                                        <h5 className="monitoring-title">Monitoramento Emocional</h5>
                                                        <Button
                                                            variant="primary"
                                                            onClick={() => handleOpenMonitoringTool('/emotion-detector')}
                                                            className="mt-auto"
                                                            aria-label="Abrir Detector de Emocoes"
                                                        >
                                                            Abrir Detector de Emoções
                                                        </Button>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={6} className="mb-4">
                                                <Card className="h-100">
                                                    <Card.Body className="d-flex flex-column align-items-center">
                                                        <h5 className="monitoring-title">Monitoramento de Risco de AVC</h5>
                                                        <Button
                                                            variant="warning"
                                                            onClick={() => handleOpenMonitoringTool(ROUTES.STROKE_RISK_MONITOR)}
                                                            className="mt-auto"
                                                            aria-label="Abrir Monitor de AVC"
                                                        >
                                                            Abrir Monitor de AVC
                                                        </Button>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={6} className="mb-4">
                                                <Card className="h-100">
                                                    <Card.Body className="d-flex flex-column align-items-center">
                                                        <h5 className="monitoring-title">Gravador de Voz</h5>
                                                        <Button
                                                            variant="success"
                                                            onClick={() => handleOpenMonitoringTool(ROUTES.TRIGGER_RECORDER)}
                                                            className="mt-auto"
                                                            aria-label="Abrir Gravador de Gatilhos"
                                                        >
                                                        Abrir Gravador de Voz
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        {/*<Col md={6} className="mb-4">
                                            <Card className="h-100">
                                                <Card.Body className="d-flex flex-column align-items-center">
                                                    <h5 className="monitoring-title text-primary">Mdulo ABA</h5>
                                                        <a
                                                        href={`/aba-dashboard/${patientId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-100"
                                                        >
                                                        <Button
                                                            variant="primary"
                                                            className="mt-auto w-100 btn-lg"
                                                            aria-label="Abrir Mdulo ABA"
                                                        >
                                                            Abrir Mdulo ABA
                                                        </Button>
                                                        </a>
                                                </Card.Body>
                                            </Card>
                                        </Col>*/}
                                    </Row>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                            <Tab.Pane eventKey="consultation" className="no-print">
                                <Card className="shadow-sm">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Histórico de Consultas</h5>
                                        <Button variant="primary" onClick={() => setShowConsultationModal(true)}>
                                            <PlusCircle className="me-2" /> Registrar Nova Consulta
                                        </Button>
                                    </Card.Header>
                                    <Card.Body>
                                        {consultations.length > 0 ? (
                                            <Table striped bordered hover responsive>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Hora</th>
                                                        <th>Tipo</th>
                                                        <th>Status</th>
                                                        <th>Valor (R$)</th>
                                                        <th>Forma de Pagamento</th>
                                                        <th>Detalhes</th>
                                                        <th>Status Pagamento</th>
                                                        <th>Observações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {consultations.map(c => (
                                                        <tr key={c.id}>
                                                            <td>{formatDate(c.appointment_date)}</td>
                                                            <td>{c.appointment_time ? c.appointment_time.substring(0, 5) : 'N/A'}</td>
                                                            <td>{c.appointment_type}</td>
                                                            <td>
                                                                <Form.Select
                                                                    size="sm"
                                                                    value={c.status}
                                                                    onChange={(e) => handleFieldUpdate(c.id, 'status', e.target.value)}
                                                                >
                                                                    <option value="Agendada">Agendada</option>
                                                                    <option value="Confirmada">Confirmada</option>
                                                                    <option value="Realizada">Realizada</option>
                                                                    <option value="Cancelada">Cancelada</option>
                                                                    <option value="Não Realizada">Não Realizada</option>
                                                                    <option value="Remarcada">Remarcada</option>
                                                                </Form.Select>
                                                            </td>
                                                            <td>{c.value ? parseFloat(c.value).toFixed(2) : '0.00'}</td>
                                                            <td>
                                                                <Form.Select
                                                                    size="sm"
                                                                    value={c.payment_method || ''}
                                                                    onChange={(e) => handleFieldUpdate(c.id, 'payment_method', e.target.value)}
                                                                >
                                                                    <option value="">N/A</option>
                                                                    <option value="Pix">Pix</option>
                                                                    <option value="Crédito">Crédito</option>
                                                                    <option value="Débito">Débito</option>
                                                                    <option value="Dinheiro">Dinheiro</option>
                                                                    <option value="Plano de Saúde">Plano de Saúde</option>
                                                                    <option value="Outros">Outros</option>
                                                                </Form.Select>
                                                            </td>
                                                            <td>
                                                                {(c.payment_method === 'Plano de Saúde' || c.payment_method === 'Outros') && (
                                                                    <Form.Control
                                                                        type="text"
                                                                        size="sm"
                                                                        defaultValue={c.payment_details || ''}
                                                                        onBlur={(e) => handleFieldUpdate(c.id, 'payment_details', e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                e.target.blur();
                                                                            }
                                                                        }}
                                                                    />
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Form.Select
                                                                    size="sm"
                                                                    value={c.payment_status}
                                                                    onChange={(e) => handleFieldUpdate(c.id, 'payment_status', e.target.value)}
                                                                >
                                                                    <option value="Pendente">Pendente</option>
                                                                    <option value="Pago">Pago</option>
                                                                    <option value="Atrasado">Atrasado</option>
                                                                    <option value="Isento">Isento</option>
                                                                </Form.Select>
                                                            </td>
                                                            <td>{c.notes || 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : (
                                            <Alert variant="info">Nenhuma consulta registrada para este paciente.</Alert>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                            <Tab.Pane eventKey="prescription">
                                <Row className="no-print">
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Prescrições Registradas</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Row className="mb-3">
                                                    <Col md={3}>
                                                        <Form.Group controlId="searchDate">
                                                            <Form.Label>Filtrar por Data</Form.Label>
                                                            <Form.Control
                                                                type="date"
                                                                value={searchDate}
                                                                onChange={handleSearchDate}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={9} className="d-flex align-items-end">
                                                        <Button variant="secondary" onClick={handlePrint} aria-label="Imprimir prescries">
                                                            Imprimir
                                                        </Button>
                                                    </Col>
                                                </Row>
                                                <Table striped bordered hover responsive>
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
                                                            filteredPrescriptions.flatMap(prescription =>
                                                                prescription.medications.map((med, index) => (
                                                                    <tr key={`${prescription.id}-${index}`}>
                                                                        {index === 0 ? (
                                                                            <td rowSpan={prescription.medications.length}>
                                                                                {formatDate(prescription.date)}
                                                                            </td>
                                                                        ) : null}
                                                                        <td>{med.medication}</td>
                                                                        <td>{med.dosage}</td>
                                                                        <td>{med.indicationssuggestions || 'N/A'}</td>
                                                                        {index === 0 ? (
                                                                            <td rowSpan={prescription.medications.length}>
                                                                                {prescription.observations || 'N/A'}
                                                                            </td>
                                                                        ) : null}
                                                                        {index === 0 ? (
                                                                            <td rowSpan={prescription.medications.length} className="no-print">
                                                                                <Button
                                                                                    variant="danger"
                                                                                    size="sm"
                                                                                    onClick={() => handleDeletePrescription(prescription.id)}
                                                                                    aria-label={`Excluir prescricao de ${formatDate(prescription.date)}`}
                                                                                >
                                                                                    Excluir
                                                                                </Button>
                                                                            </td>
                                                                        ) : null}
                                                                    </tr>
                                                                ))
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} className="text-center">Nenhuma prescrição registrada.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Col>
            </Row>

            {/* Modal for New Consultation */}
            <Modal show={showConsultationModal} onHide={() => setShowConsultationModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Registrar Nova Consulta</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveConsultation}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="consultationDate">
                                    <Form.Label>Data da Consulta *</Form.Label>
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
                                    <Form.Label>Hora da Consulta *</Form.Label>
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
                                    <Form.Label>Tipo de Consulta</Form.Label>
                                    <Form.Select
                                        name="appointment_type"
                                        value={newConsultation.appointment_type}
                                        onChange={handleConsultationInputChange}
                                    >
                                        <option value="Regular">Consulta Regular</option>
                                        <option value="Inicial">Consulta Inicial</option>
                                        <option value="Acompanhamento">Acompanhamento</option>
                                        <option value="Avaliação">Avaliação</option>
                                        <option value="Terapia">Terapia</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="consultationStatus">
                                    <Form.Label>Status da Consulta</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={newConsultation.status}
                                        onChange={handleConsultationInputChange}
                                    >
                                        <option value="Realizada">Realizada</option>
                                        <option value="Agendada">Agendada</option>
                                        <option value="Confirmada">Confirmada</option>
                                        <option value="Cancelada">Cancelada</option>
                                        <option value="Não Realizada">Não Realizada</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="consultationValue">
                                    <Form.Label>Valor da Consulta (R$) *</Form.Label>
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
                                        <option value="Pendente">Pendente</option>
                                        <option value="Pago">Pago</option>
                                        <option value="Atrasado">Atrasado</option>
                                        <option value="Isento">Isento</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3" controlId="consultationNotes">
                                    <Form.Label>Observações</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="notes"
                                        value={newConsultation.notes}
                                        onChange={handleConsultationInputChange}
                                        placeholder="Digite observações sobre a consulta"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <hr />
                        <h5>Detalhes do Pagamento</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="paymentMethod">
                                    <Form.Label>Forma de Pagamento</Form.Label>
                                    <Form.Select
                                        name="payment_method"
                                        value={newConsultation.payment_method}
                                        onChange={handleConsultationInputChange}
                                    >
                                        <option value="Pix">Pix</option>
                                        <option value="Crédito">Cartão de Crédito</option>
                                        <option value="Débito">Cartão de Débito</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Plano de Saúde">Plano de Saúde</option>
                                        <option value="Outros">Outros</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {(newConsultation.payment_method === 'Plano de Saúde' || newConsultation.payment_method === 'Outros') && (
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="paymentDetails">
                                        <Form.Label>
                                            {newConsultation.payment_method === 'Plano de Saúde' ? 'Qual Plano de Saúde' : 'Especifique a Forma de Pagamento'}
                                        </Form.Label>
                                        {newConsultation.payment_method === 'Plano de Saúde' ? (
                                            <Form.Select
                                                name="payment_details"
                                                value={newConsultation.payment_details}
                                                onChange={handleConsultationInputChange}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="Hapvida">Hapvida</option>
                                                <option value="Bradesco Saúde">Bradesco Saúde</option>
                                                <option value="SulAmerica">SulAmerica</option>
                                                <option value="Unimed">Unimed</option>
                                                <option value="Amil">Amil</option>
                                            </Form.Select>
                                        ) : (
                                            <Form.Control
                                                type="text"
                                                name="payment_details"
                                                placeholder="Ex: Transferencia Bancaria"
                                                value={newConsultation.payment_details}
                                                onChange={handleConsultationInputChange}
                                            />
                                        )}
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowConsultationModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit">
                            Salvar Consulta
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};
export default PatientDetailsParent;

























