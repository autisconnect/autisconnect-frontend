import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Table, Alert, Spinner, Dropdown, Form, Badge } from 'react-bootstrap';
import { ArrowLeft, GraphUp, Calendar3, ExclamationTriangle, Heart } from 'react-bootstrap-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Line, Bar, Pie } from 'react-chartjs-2';
import logohori from './assets/logo.png';
import sloganProfissional from './assets/18.jpg';
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
    Filler,
} from 'chart.js';
import './App.css';

import emotionalMonitoringImg from './assets/emotional_monitoring.png';
import strokeRiskImg from './assets/stroke_risk.png';
import repetitivePatternsImg from './assets/repetitive_patterns.png';
import triggerRecorderImg from './assets/trigger_recorder.png';

// Register Chart.js components
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

// Route constants for monitoring tools
const ROUTES = {
    EMOTION_DETECTOR: '/emotion-detector',
    STROKE_RISK_MONITOR: '/stroke-risk-monitor',
    STEREOTYPY_MONITOR: '/stereotypy-monitor',
    TRIGGER_RECORDER: '/trigger-recorder',
};

// Utility function for auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token de autenticação não encontrado.');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

// Utility function to format date
const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'N/A';
};

// Utility function to format age
const formatAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return `${age} anos`;
};

const ParentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const { id: parentId } = useParams();
    const navigate = useNavigate();

    // States
    const [patientList, setPatientList] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [notes, setNotes] = useState([]);
    const [vocalizations, setVocalizations] = useState([]);
    const [strokeRisks, setStrokeRisks] = useState([]);
    const [stereotypies, setStereotypies] = useState([]);
    const [emotions, setEmotions] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [emotionDistributionData, setEmotionDistributionData] = useState(null);
    const [vocalizationTrendData, setVocalizationTrendData] = useState(null);
    const [repetitionPatternData, setRepetitionPatternData] = useState(null);
    const [strokeData, setStrokeData] = useState(null);
    const [stereotypyData, setStereotypyData] = useState(null);
    const [emotionData, setEmotionData] = useState(null);
    const [vocalizationAnalysis, setVocalizationAnalysis] = useState(null);
    const [strokeRiskAnalysis, setStrokeRiskAnalysis] = useState(null);
    const [stereotypyAnalysis, setStereotypyAnalysis] = useState(null);
    const [emotionAnalysis, setEmotionAnalysis] = useState(null);
    const [vocalizationPrediction, setVocalizationPrediction] = useState('Calculando previsão...');
    const [vocalizationAnomaly, setVocalizationAnomaly] = useState(null);
    const [strokePrediction, setStrokePrediction] = useState('Calculando previsão...');
    const [strokeAnomaly, setStrokeAnomaly] = useState(null);
    const [stereotypyPrediction, setStereotypyPrediction] = useState('Calculando previsão...');
    const [stereotypyAnomaly, setStereotypyAnomaly] = useState(null);
    const [prediction, setPrediction] = useState('Calculando previsão...');
    const [anomaly, setAnomaly] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [periodFilter, setPeriodFilter] = useState('month');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchDate, setSearchDate] = useState('');

    // Chart options
    const lineOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Evolução ao Longo do Tempo' }
        },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Valor' } }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right' },
            title: { display: true, text: 'Distribuição' }
        }
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Comparação entre Sessões' }
        },
        scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Porcentagem (%)' } }
        }
    };

    // Analysis functions (reused from PatientDetails)
    const analyzeEmotionPatterns = (emotionRecords) => {
        if (!emotionRecords || emotionRecords.length === 0) return null;
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const todayRecords = emotionRecords.filter(e => new Date(e.timestamp) > new Date(now - oneDay));
        const yesterdayRecords = emotionRecords.filter(e => {
            const recordDate = new Date(e.timestamp);
            return recordDate > new Date(now - 2 * oneDay) && recordDate < new Date(now - oneDay);
        });

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
                emotionalPeaks.push(`Um pico de detecções com predominância de "${peakEmotion}" foi observado em ${day}.`);
            }
        }

        let moodSwings = 0;
        for (let i = 1; i < emotionRecords.length; i++) {
            if (emotionRecords[i].emotion !== emotionRecords[i - 1].emotion) {
                moodSwings++;
            }
        }
        const volatility = (moodSwings / totalCount) * 100;
        let volatilityText = 'estável';
        if (volatility > 30) volatilityText = 'variável';
        if (volatility > 60) volatilityText = 'altamente volátil';

        return { dominantEmotion, distribution, trend, emotionalPeaks, volatilityText };
    };

    const generateAISummary = (analysis) => {
        if (!analysis) return "Aguardando dados suficientes para gerar o resumo...";
        const { dominantEmotion, distribution, trend, emotionalPeaks, volatilityText } = analysis;
        let summary = `No período analisado, seu filho apresentou um estado emocional predominante de **${dominantEmotion}**. `;
        const secondaryEmotion = distribution.find(d => d.emotion !== dominantEmotion && parseFloat(d.percentage) > 15);
        if (secondaryEmotion) {
            summary += `Também foi observada uma presença significativa de **${secondaryEmotion.emotion}** (${secondaryEmotion.percentage}%). `;
        }
        summary += `O comportamento emocional foi **${volatilityText}**. `;
        if (trend.happy < -2) {
            summary += "Houve uma diminuição na felicidade recentemente. ";
        } else if (trend.sad > 2 || trend.angry > 2) {
            summary += "Observou-se um aumento em emoções negativas (tristeza/raiva) recentemente. ";
        } else if (trend.happy > 2) {
            summary += "Houve uma tendência positiva, com aumento de felicidade. ";
        }
        if (emotionalPeaks.length > 0) {
            const firstPeakDateMatch = emotionalPeaks[0].match(/\d{2}\/\d{2}\/\d{4}/);
            if (firstPeakDateMatch) {
                summary += `Picos emocionais foram registrados, como em ${firstPeakDateMatch[0]}, que podem precisar de atenção.`;
            }
        }
        return summary;
    };

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
        const highRiskPercentage = distribution.find(d => d.level === 'Alto')?.percentage || 0;
        let summary = `O nível de risco mais recente foi **${lastRiskLevel}**. `;
        if (highRiskPercentage > 10) {
            summary += `Cerca de **${highRiskPercentage}%** das medições indicaram risco alto, sugerindo a necessidade de acompanhamento. `;
        } else {
            summary += `A maioria das medições indicou risco baixo ou moderado. `;
        }
        if (hasRecentHighRisk) {
            summary += `**Atenção:** Riscos altos foram detectados na última semana. Consulte um profissional.`;
        } else {
            summary += "Não houve riscos altos recentes.";
        }
        return summary;
    };

    const analyzeVocalizationPatterns = (vocalizationRecords) => {
        if (!vocalizationRecords || vocalizationRecords.length === 0) return null;
        const allAnalyses = vocalizationRecords.map(v => v.analysis);
        const totalWordCount = allAnalyses.reduce((sum, a) => sum + a.wordCount, 0);
        const totalUniqueWords = allAnalyses.reduce((sum, a) => sum + a.uniqueWords, 0);
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

    const generateVocalizationAISummary = (analysis) => {
        if (!analysis) return "Aguardando dados de vocalização para gerar resumo.";
        const { averageWordCount, averageLexicalDiversity, dominantRepetition, totalRecordings } = analysis;
        let summary = `Foram analisadas **${totalRecordings}** gravações, com uma média de **${averageWordCount}** palavras por gravação. `;
        summary += `A diversidade de palavras é de **${averageLexicalDiversity}%**, mostrando o nível de variedade na fala. `;
        if (dominantRepetition !== 'Nenhuma') {
            summary += `A palavra ou frase mais repetida foi **"${dominantRepetition}"**, que pode indicar um padrão de comportamento.`;
        } else {
            summary += "Não foram observadas repetições significativas.";
        }
        return summary;
    };

    const analyzeStereotypyPatterns = (records) => {
        if (!records || records.length === 0) return null;
        const counts = records.reduce((acc, rec) => {
            acc[rec.type] = (acc[rec.type] || 0) + 1;
            return acc;
        }, {});
        const dominantType = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'Nenhuma');
        const totalDuration = records.reduce((sum, rec) => sum + (rec.duration || 0), 0);
        const averageDuration = totalDuration / records.length;
        return {
            totalDetections: records.length,
            dominantType,
            averageDuration: averageDuration.toFixed(1),
            distribution: counts,
        };
    };

    const generateStereotypyAISummary = (analysis) => {
        if (!analysis) return "Aguardando dados de comportamentos repetitivos para gerar resumo.";
        const { dominantType, averageDuration, totalDetections } = analysis;
        let summary = `Foram registrados **${totalDetections}** comportamentos repetitivos, sendo o mais comum **${dominantType}**. `;
        summary += `Cada episódio dura em média **${averageDuration} segundos**. `;
        if (dominantType === 'Balançar corpo') {
            summary += "Isso pode ser uma forma de seu filho buscar equilíbrio ou conforto.";
        } else if (dominantType === 'Movimento de mãos') {
            summary += "Esse comportamento pode estar ligado a excitação ou sobrecarga sensorial.";
        }
        return summary;
    };

    // Fetch patient list
    useEffect(() => {
        if (!user || !parentId) {
            navigate('/login');
            return;
        }

        const fetchPatientList = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`http://localhost:5000/api/parent/${parentId}/patients`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error('Falha ao buscar lista de pacientes.');
                const data = await response.json();
                if (data.length === 0) {
                    setError('Nenhum paciente associado encontrado.');
                } else {
                    setPatientList(data);
                    setSelectedPatient(data[0]);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPatientList();
    }, [user, parentId, navigate]);

    // Busca todos os dados detalhados quando um filho ou o filtro de período muda
    useEffect(() => {
        if (!selectedPatient) return;

        const fetchAllDataForSelectedPatient = async () => {
            setLoading(true);
            const patientId = selectedPatient.id;
            const queryParams = `?period=${periodFilter}`;
            
            try {
                // >>>>> CORREÇÃO PRINCIPAL AQUI: Todas as rotas usam o prefixo /api/parent/ <<<<<
                const [consRes, vocRes, strRes, steRes, emoRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/parent/patient/${patientId}/consultations${queryParams}`, { headers: getAuthHeaders( ) }),
                    fetch(`http://localhost:5000/api/parent/vocalizations/${patientId}${queryParams}`, { headers: getAuthHeaders( ) }),
                    fetch(`http://localhost:5000/api/parent/stroke-risk/${patientId}${queryParams}`, { headers: getAuthHeaders( ) }),
                    fetch(`http://localhost:5000/api/parent/stereotypies/${patientId}${queryParams}`, { headers: getAuthHeaders( ) }),
                    fetch(`http://localhost:5000/api/parent/emotions/${patientId}${queryParams}`, { headers: getAuthHeaders( ) })
                ]);

                // Funções para tratar a resposta e evitar que um erro pare todos os outros
                const processResponse = async (res, name) => {
                    if (!res.ok) {
                        console.warn(`Falha ao buscar ${name}. Status: ${res.status}`);
                        return []; // Retorna um array vazio em caso de erro
                    }
                    return res.json();
                };

                const consultationsData = await processResponse(consRes, 'consultas');
                const vocalizationsData = await processResponse(vocRes, 'vocalizações');
                const strokeData = await processResponse(strRes, 'risco de AVC');
                const stereotypyData = await processResponse(steRes, 'estereotipias');
                const emotionData = await processResponse(emoRes, 'emoções');

                setConsultations(consultationsData);
                setVocalizations(vocalizationsData);
                setStrokeRisks(strokeData);
                setStereotypies(stereotypyData);
                setEmotions(emotionData);

                processChartData(vocalizationsData, strokeData, stereotypyData, emotionData);

            } catch (err) {
                setError(`Erro ao carregar dados de ${selectedPatient.nome_completo}: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchAllDataForSelectedPatient();
    }, [selectedPatient, periodFilter]);

    // Fetch patient data
    useEffect(() => {
        if (!selectedPatient) return;

        const fetchPatientData = async () => {
            setLoading(true);
            setError('');
            try {
                const [
                    notesRes, consultationsRes, vocalizationsRes, strokeRes, emotionsRes, stereotypiesRes, prescriptionsRes
                ] = await Promise.all([
                    fetch(`http://localhost:5000/api/parent/${parentId}/patients/${selectedPatient.id}/notes`, { headers: getAuthHeaders() }),
                    fetch(`http://localhost:5000/api/appointments/patient/${selectedPatient.id}`, { headers: getAuthHeaders() }),
                    fetch(`http://localhost:5000/api/vocalizations/${selectedPatient.id}`, { headers: getAuthHeaders() }),
                    fetch(`http://localhost:5000/api/stroke-risk/${selectedPatient.id}`, { headers: getAuthHeaders() }),
                    fetch(`http://localhost:5000/api/emotions/${selectedPatient.id}`, { headers: getAuthHeaders() }),
                    fetch(`http://localhost:5000/api/stereotypies/${selectedPatient.id}`, { headers: getAuthHeaders() }),
                    fetch(`http://localhost:5000/api/prescriptions/${selectedPatient.id}`, { headers: getAuthHeaders() })
                ]);

                if (!notesRes.ok) {
                    if (notesRes.status === 404) {
                        setNotes([]);
                    } else if (notesRes.status === 403) {
                        setError('Acesso negado: paciente não associado.');
                        return;
                    } else {
                        throw new Error('Falha ao buscar notas.');
                    }
                }
                if (!consultationsRes.ok) {
                    if (consultationsRes.status === 404 || consultationsRes.status === 403) {
                        setConsultations([]);
                    } else {
                        throw new Error('Falha ao buscar consultas.');
                    }
                }
                if (!vocalizationsRes.ok) {
                    if (vocalizationsRes.status === 404 || vocalizationsRes.status === 403) {
                        setVocalizations([]);
                    } else {
                        throw new Error('Falha ao buscar vocalizações.');
                    }
                }
                if (!strokeRes.ok) {
                    if (strokeRes.status === 404 || strokeRes.status === 403) {
                        setStrokeRisks([]);
                    } else {
                        throw new Error('Falha ao buscar risco de AVC.');
                    }
                }
                if (!emotionsRes.ok) {
                    if (emotionsRes.status === 404 || emotionsRes.status === 403) {
                        setEmotions([]);
                    } else {
                        throw new Error('Falha ao buscar emoções.');
                    }
                }
                if (!stereotypiesRes.ok) {
                    if (stereotypiesRes.status === 404 || stereotypiesRes.status === 403) {
                        setStereotypies([]);
                    } else {
                        throw new Error('Falha ao buscar estereotipias.');
                    }
                }
                if (!prescriptionsRes.ok) {
                    if (prescriptionsRes.status === 404 || prescriptionsRes.status === 403) {
                        setPrescriptions([]);
                        setFilteredPrescriptions([]);
                    } else {
                        throw new Error('Falha ao buscar prescrições.');
                    }
                }

                const notesData = notesRes.ok ? await notesRes.json() : [];
                const consultationsData = consultationsRes.ok ? await consultationsRes.json() : [];
                const vocalizationsData = vocalizationsRes.ok ? await vocalizationsRes.json() : [];
                const strokeDataFromDB = strokeRes.ok ? await strokeRes.json() : [];
                const emotionsDataFromDB = emotionsRes.ok ? await emotionsRes.json() : [];
                const stereotypiesData = stereotypiesRes.ok ? await stereotypiesRes.json() : [];
                const prescriptionsData = prescriptionsRes.ok ? await prescriptionsRes.json() : [];

                const validVocalizations = (Array.isArray(vocalizationsData) ? vocalizationsData : []).map(v => {
                    let parsedAnalysis = {};
                    try {
                        if (v.analysis_data && typeof v.analysis_data === 'string' && v.analysis_data.startsWith('{')) {
                            parsedAnalysis = JSON.parse(v.analysis_data);
                        } else if (typeof v.analysis_data === 'object' && v.analysis_data !== null) {
                            parsedAnalysis = v.analysis_data;
                        }
                    } catch (e) {
                        console.error("Falha ao fazer parse do JSON da vocalização:", v.analysis_data, e);
                    }
                    return { ...v, analysis: parsedAnalysis };
                });

                setNotes(Array.isArray(notesData) ? notesData : []);
                setConsultations(Array.isArray(consultationsData) ? consultationsData : []);
                setVocalizations(validVocalizations);
                setStrokeRisks(Array.isArray(strokeDataFromDB) ? strokeDataFromDB : []);
                setEmotions(Array.isArray(emotionsDataFromDB) ? emotionsDataFromDB : []);
                setStereotypies(Array.isArray(stereotypiesData) ? stereotypiesData : []);
                setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
                setFilteredPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);

                setVocalizationAnalysis(analyzeVocalizationPatterns(validVocalizations));
                setStrokeRiskAnalysis(analyzeStrokeRiskPatterns(strokeDataFromDB));
                setStereotypyAnalysis(analyzeStereotypyPatterns(stereotypiesData));
                setEmotionAnalysis(analyzeEmotionPatterns(emotionsDataFromDB));

                processChartData(null, strokeDataFromDB, stereotypiesData, emotionsDataFromDB, validVocalizations);
            } catch (err) {
                setError(err.message || 'Erro ao carregar dados do paciente.');
            } finally {
                setLoading(false);
            }
        };
        fetchPatientData();
    }, [selectedPatient, periodFilter]);

    // Fetch AI analyses
    useEffect(() => {
        if (!selectedPatient || !emotions.length) return;
        const fetchAIAnalysis = async () => {
            try {
                const aiResponse = await fetch(`http://localhost:5000/api/iaemotions/analysis/${selectedPatient.id}?type=emotion`, { headers: getAuthHeaders() });
                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    setPrediction(aiData.predictionText || "Previsão gerada com sucesso.");
                    setAnomaly(aiData.anomaly || null);
                } else {
                    setPrediction("Serviço de análise de emoções indisponível.");
                }
            } catch (aiError) {
                setPrediction("Não foi possível conectar ao serviço de análise de emoções.");
            }
        };
        fetchAIAnalysis();
    }, [emotions, selectedPatient]);

    useEffect(() => {
        if (!selectedPatient || !strokeRisks.length) return;
        const fetchStrokeAIAnalysis = async () => {
            try {
                const aiResponse = await fetch(`http://localhost:5000/api/iaemotions/analysis/${selectedPatient.id}?type=stroke`, { headers: getAuthHeaders() });
                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    setStrokePrediction(aiData.predictionText || "Previsão de risco gerada.");
                    setStrokeAnomaly(aiData.anomaly || null);
                } else {
                    setStrokePrediction("Serviço de análise de risco indisponível.");
                }
            } catch (aiError) {
                setStrokePrediction("Não foi possível conectar ao serviço de análise de risco.");
            }
        };
        fetchStrokeAIAnalysis();
    }, [strokeRisks, selectedPatient]);

    useEffect(() => {
        if (!selectedPatient || !vocalizations.length) return;
        const fetchVocalizationAI = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/iavocalizations/analysis/${selectedPatient.id}`, { headers: getAuthHeaders() });
                if (response.ok) {
                    const data = await response.json();
                    setVocalizationPrediction(data.predictionText);
                    setVocalizationAnomaly(data.anomaly);
                } else {
                    setVocalizationPrediction("Serviço de análise de vocalizações indisponível.");
                }
            } catch (err) {
                setVocalizationPrediction("Não foi possível conectar ao serviço de análise de vocalizações.");
            }
        };
        fetchVocalizationAI();
    }, [vocalizations, selectedPatient]);

    useEffect(() => {
        if (!selectedPatient || !stereotypies.length) return;
        const fetchStereotypyAI = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/ia-analysis/${selectedPatient.id}?type=stereotypy`, { headers: getAuthHeaders() });
                if (response.ok) {
                    const data = await response.json();
                    setStereotypyPrediction(data.predictionText);
                    setStereotypyAnomaly(data.anomaly);
                } else {
                    setStereotypyPrediction("Serviço de análise de estereotipias indisponível.");
                }
            } catch (err) {
                setStereotypyPrediction("Não foi possível conectar ao serviço de análise.");
            }
        };
        fetchStereotypyAI();
    }, [stereotypies, selectedPatient]);

    const processChartData = (triggers, strokeRisks, stereotypies, emotions, vocalizations) => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

        // Stroke chart
        const strokeChartData = {
            labels: strokeRisks.map(r => formatDate(r.date)),
            datasets: [{
                label: 'Índice de Assimetria Facial',
                data: strokeRisks.map(r => parseFloat(r.asymmetry_index)),
                borderColor: 'rgba(220, 53, 69, 1)',
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                fill: true,
                tension: 0.4
            }]
        };
        setStrokeData(strokeChartData);

        // Stereotypy chart
        const stereotypyTypes = ['Balançar corpo', 'Movimento de mãos', 'Bater palmas'];
        const stereotypyChartData = {
            labels: stereotypyTypes,
            datasets: [{
                label: 'Frequência de Comportamentos Repetitivos',
                data: stereotypyTypes.map(type => {
                    return stereotypies.reduce((sum, s) => s.type === type ? sum + s.frequency : sum, 0);
                }),
                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 1
            }]
        };
        setStereotypyData(stereotypyChartData);

        // Emotion charts
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
                const date = formatDate(record.timestamp);
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

        // Vocalization charts
        if (vocalizations && vocalizations.length > 0) {
            const sortedVocalizations = [...vocalizations].sort((a, b) => new Date(a.date) - new Date(b.date));
            const trendData = {
                labels: sortedVocalizations.map(v => formatDate(v.date)),
                datasets: [
                    {
                        label: 'Diversidade Léxica (%)',
                        data: sortedVocalizations.map(v => (v.analysis.lexicalDiversity * 100).toFixed(1)),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        yAxisID: 'y',
                    },
                    {
                        label: 'Contagem de Palavras',
                        data: sortedVocalizations.map(v => v.analysis.wordCount),
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

            const sortedRepetitions = Object.entries(repetitionCounts).sort(([, a], [, b]) => b - a).slice(0, 10);
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
        monitoringToolUrl.searchParams.append('patientId', selectedPatient.id);
        window.open(monitoringToolUrl.toString(), '_blank', 'noopener,noreferrer');
    };

    const handlePeriodChange = (e) => {
        setPeriodFilter(e.target.value);
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
                <p>Carregando dados...</p>
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

    if (!patientList.length) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">Nenhum paciente associado encontrado.</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 parent-dashboard-page">
            <Row className="mb-4 align-items-center">
                <Col xs="auto">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                </Col>
                <Col>
                    <h1 className="mb-0 mt-2">Painel dos Pais</h1>
                    <p className="text-muted mb-0">Visualize o progresso e informações do seu filho</p>
                </Col>
                <Col xs="auto">
                    <Dropdown onSelect={(key) => setSelectedPatient(patientList.find(p => p.id.toString() === key))}>
                        <Dropdown.Toggle variant="link" id="patient-select" className="p-0 text-muted">
                            Visualizando: <strong>{selectedPatient?.nome_completo || 'Selecionar'}</strong>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {patientList.map(p => (
                                <Dropdown.Item key={p.id} eventKey={p.id.toString()}>
                                    {p.nome_completo}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-primary" onClick={logout} className="back-button-standalone">
                        <ArrowLeft /> Sair
                    </Button>
                </Col>
            </Row>

            {selectedPatient && (
                <>
                    <Row className="mb-4 no-print">
                        <Col md={3}>
                            <div className="d-flex align-items-center">
                                <label htmlFor="period-filter" className="me-2">Período:</label>
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
                                        <Nav.Link eventKey="vocalization">Vocalizações</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="stroke">Risco de AVC</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="stereotypy">Comportamentos Repetitivos</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="emotion">Emoções</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="monitoring-tools">Ferramentas de Monitoramento</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="consultation">Consultas</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="prescription">Prescrições</Nav.Link>
                                    </Nav.Item>
                                </Nav>

                                <Tab.Content>
                                    <Tab.Pane eventKey="overview" className="no-print">
                                        <Row>
                                            <Col md={12} className="mb-4">
                                                <Row>
                                                    <Col md={3}>
                                                        <Card className="text-center mb-3 mb-md-0 shadow-sm">
                                                            <Card.Body>
                                                                <Heart className="text-danger mb-2" size={24} />
                                                                <h6>Risco de AVC</h6>
                                                                <h3>{strokeRisks[0]?.risk_level || 'N/A'}</h3>
                                                                <small className="text-muted">
                                                                    Última medição: {formatDate(strokeRisks[0]?.date) || 'N/A'}
                                                                </small>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Card className="text-center mb-3 mb-md-0 shadow-sm">
                                                            <Card.Body>
                                                                <GraphUp className="text-primary mb-2" size={24} />
                                                                <h6>Comportamento Repetitivo</h6>
                                                                <h3>{stereotypies[0]?.type || 'N/A'}</h3>
                                                                <small className="text-muted">
                                                                    Frequência: {stereotypies[0]?.frequency || '0'}/semana
                                                                </small>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Card className="text-center shadow-sm">
                                                            <Card.Body>
                                                                <Calendar3 className="text-success mb-2" size={24} />
                                                                <h6>Emoção Predominante</h6>
                                                                <h3>{emotions[0]?.emotion || 'N/A'}</h3>
                                                                <small className="text-muted">
                                                                    Última sessão: {formatDate(emotions[0]?.timestamp) || 'N/A'}
                                                                </small>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Card className="text-center shadow-sm">
                                                            <Card.Body>
                                                                <ExclamationTriangle className="text-warning mb-2" size={24} />
                                                                <h6>Vocalizações</h6>
                                                                <h3>{vocalizations.length}</h3>
                                                                <small className="text-muted">
                                                                    Última: {formatDate(vocalizations[0]?.date) || 'N/A'}
                                                                </small>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                </Row>
                                            </Col>
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
                                            <Col md={6} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header>
                                                        <h5 className="mb-0">Índice de Assimetria Facial</h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {strokeData ? <Line data={strokeData} options={lineOptions} /> : <p>Carregando...</p>}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={6}>
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header>
                                                        <h5 className="mb-0">Distribuição de Comportamentos</h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {stereotypyData ? <Pie data={stereotypyData} options={pieOptions} /> : <p>Carregando...</p>}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={6}>
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header>
                                                        <h5 className="mb-0">Evolução da Fala</h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {vocalizationTrendData ? (
                                                            <Line data={vocalizationTrendData} options={{
                                                                ...lineOptions,
                                                                scales: {
                                                                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Diversidade Léxica (%)' } },
                                                                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Contagem de Palavras' } },
                                                                }
                                                            }} />
                                                        ) : (
                                                            <p>Carregando...</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={12}>
                                                <Card className="shadow-sm">
                                                    <Card.Header>
                                                        <h5 className="mb-0">Notas do Profissional</h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {notes.length > 0 ? (
                                                            notes.map(note => (
                                                                note && note.id ? (
                                                                    <Card key={note.id} className="mb-2">
                                                                        <Card.Body>
                                                                            <h6>{note.title || 'Sem título'}</h6>
                                                                            <p className="mb-1">{note.content || 'Sem conteúdo'}</p>
                                                                            <small className="text-muted">
                                                                                {formatDate(note.createdAt)}
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
                                            </Col>
                                        </Row>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="vocalization" className="no-print">
                                        <Row>
                                            <Col md={12} className="mb-4">
                                                <Card className="shadow-sm">
                                                    <Card.Header><h5 className="mb-0">Análise da Fala</h5></Card.Header>
                                                    <Card.Body>
                                                        <p className="lead">{generateVocalizationAISummary(vocalizationAnalysis)}</p>
                                                        <h6>Previsão para as Próximas 24h</h6>
                                                        <p>{vocalizationPrediction}</p>
                                                        {vocalizationAnomaly && vocalizationAnomaly.detected && (
                                                            <Alert variant="danger" className="alert-anomaly">
                                                                <strong>Alerta:</strong> {vocalizationAnomaly.message}
                                                            </Alert>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={8} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header><h5 className="mb-0">Evolução da Fala</h5></Card.Header>
                                                    <Card.Body>
                                                        {vocalizationTrendData ? (
                                                            <Line data={vocalizationTrendData} options={{
                                                                ...lineOptions,
                                                                scales: {
                                                                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Diversidade Léxica (%)' } },
                                                                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Contagem de Palavras' } },
                                                                }
                                                            }} />
                                                        ) : (
                                                            <p className="text-muted text-center pt-5">Não há dados suficientes.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={4} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header><h5 className="mb-0">Palavras Mais Repetidas</h5></Card.Header>
                                                    <Card.Body>
                                                        {repetitionPatternData && repetitionPatternData.labels.length > 0 ? (
                                                            <Bar data={repetitionPatternData} options={{ ...barOptions, indexAxis: 'y' }} />
                                                        ) : (
                                                            <p className="text-muted text-center pt-5">Nenhum padrão de repetição encontrado.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={12}>
                                                <Card className="shadow-sm">
                                                    <Card.Header><h5 className="mb-0">Histórico de Vocalizações</h5></Card.Header>
                                                    <Card.Body>
                                                        {vocalizationAnalysis ? (
                                                            <Row className="mb-3 text-center">
                                                                <Col><strong>Total de Gravações:</strong> {vocalizationAnalysis.totalRecordings}</Col>
                                                                <Col><strong>Média de Palavras:</strong> {vocalizationAnalysis.averageWordCount}</Col>
                                                                <Col><strong>Diversidade Léxica:</strong> {vocalizationAnalysis.averageLexicalDiversity}%</Col>
                                                                <Col><strong>Repetição Dominante:</strong> <Badge bg="warning">{vocalizationAnalysis.dominantRepetition}</Badge></Col>
                                                            </Row>
                                                        ) : (
                                                            <p className="text-muted text-center">Aguardando dados.</p>
                                                        )}
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
                                                                            <td>{v.analysis.wordCount}</td>
                                                                            <td>{v.analysis.uniqueWords}</td>
                                                                            <td>{(v.analysis.lexicalDiversity * 100).toFixed(1)}%</td>
                                                                            <td style={{ maxWidth: '400px', whiteSpace: 'pre-wrap' }}>{v.analysis.fullText}</td>
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
                                            <Col md={12} className="mb-4">
                                                <Card className="shadow-sm">
                                                    <Card.Header><h5 className="mb-0">Análise de Risco de AVC</h5></Card.Header>
                                                    <Card.Body>
                                                        <p className="lead">{generateStrokeAISummary(strokeRiskAnalysis)}</p>
                                                        <h6>Previsão para as Próximas 24h</h6>
                                                        <p>{strokePrediction}</p>
                                                        {strokeAnomaly && strokeAnomaly.detected && (
                                                            <Alert variant="danger" className="alert-anomaly">
                                                                <strong>Alerta:</strong> {strokeAnomaly.message}
                                                            </Alert>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={8} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header><h5 className="mb-0">Evolução do Risco</h5></Card.Header>
                                                    <Card.Body>
                                                        {strokeData && strokeData.labels.length > 0 ? (
                                                            <Line data={strokeData} options={lineOptions} />
                                                        ) : (
                                                            <p>Não há dados suficientes.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={4} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header><h5 className="mb-0">Resumo de Risco</h5></Card.Header>
                                                    <Card.Body>
                                                        {strokeRiskAnalysis ? (
                                                            <>
                                                                <h6>Risco Atual</h6>
                                                                <p className="h4">
                                                                    <Badge bg={
                                                                        strokeRiskAnalysis.lastRiskLevel === 'Alto' ? 'danger' :
                                                                        strokeRiskAnalysis.lastRiskLevel === 'Médio' ? 'warning' : 'success'
                                                                    }>
                                                                        {strokeRiskAnalysis.lastRiskLevel}
                                                                    </Badge>
                                                                </p>
                                                                <p className="text-muted">Índice: {strokeRiskAnalysis.lastAsymmetryIndex}</p>
                                                                <hr />
                                                                <h6>Distribuição</h6>
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
                                        </Row>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="stereotypy" className="no-print">
                                        <Row>
                                            <Col md={12} className="mb-4">
                                                <Card className="shadow-sm">
                                                    <Card.Header><h5 className="mb-0">Análise de Comportamentos Repetitivos</h5></Card.Header>
                                                    <Card.Body>
                                                        <p className="lead">{generateStereotypyAISummary(stereotypyAnalysis)}</p>
                                                        <h6>Previsão para as Próximas 24h</h6>
                                                        <p>{stereotypyPrediction}</p>
                                                        {stereotypyAnomaly && stereotypyAnomaly.detected && (
                                                            <Alert variant="danger" className="alert-anomaly">
                                                                <strong>Alerta:</strong> {stereotypyAnomaly.message}
                                                            </Alert>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={8} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header><h5 className="mb-0">Distribuição de Comportamentos</h5></Card.Header>
                                                    <Card.Body>
                                                        {stereotypyData && stereotypyData.labels.length > 0 ? (
                                                            <Pie data={stereotypyData} options={pieOptions} />
                                                        ) : (
                                                            <p className="text-muted text-center pt-5">Não há dados.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={4} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header><h5 className="mb-0">Resumo</h5></Card.Header>
                                                    <Card.Body>
                                                        {stereotypyAnalysis ? (
                                                            <>
                                                                <h6>Tipo Principal</h6>
                                                                <p className="h4"><Badge bg="info">{stereotypyAnalysis.dominantType}</Badge></p>
                                                                <hr />
                                                                <h6>Duração Média</h6>
                                                                <p className="h4">{stereotypyAnalysis.averageDuration} seg</p>
                                                                <hr />
                                                                <h6>Total de Registros</h6>
                                                                <p className="h4">{stereotypyAnalysis.totalDetections}</p>
                                                            </>
                                                        ) : (
                                                            <p className="text-muted">Não há dados.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="emotion" className="no-print">
                                        <Row>
                                            <Col md={8} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header><h5 className="mb-0">Evolução de Emoções</h5></Card.Header>
                                                    <Card.Body>
                                                        {emotionData && emotionData.datasets.length > 0 && emotionData.labels.length > 0 ? (
                                                            <Line data={emotionData} options={lineOptions} />
                                                        ) : (
                                                            <p>Não há dados suficientes.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={4} className="mb-4">
                                                <Card className="shadow-sm h-100">
                                                    <Card.Header><h5 className="mb-0">Distribuição de Emoções</h5></Card.Header>
                                                    <Card.Body>
                                                        {emotionDistributionData && emotionDistributionData.datasets.length > 0 && emotionDistributionData.datasets[0].data.some(d => d > 0) ? (
                                                            <Pie data={emotionDistributionData} options={pieOptions} />
                                                        ) : (
                                                            <p>Não há dados.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={12}>
                                                <Card className="shadow-sm">
                                                    <Card.Header><h5 className="mb-0">Análise de Emoções</h5></Card.Header>
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
                                                                    <h6><ExclamationTriangle className="me-2" />Resumo</h6>
                                                                    <p><strong>Emoção Principal:</strong> <Badge bg="primary">{emotionAnalysis.dominantEmotion.toUpperCase()}</Badge></p>
                                                                    <h6>Tendência Recente</h6>
                                                                    <ul className="list-unstyled trend-list">
                                                                        <li>Feliz: <Badge bg={emotionAnalysis.trend.happy >= 0 ? 'success' : 'danger'}>{emotionAnalysis.trend.happy >= 0 ? '+' : ''}{emotionAnalysis.trend.happy}</Badge></li>
                                                                        <li>Triste: <Badge bg={emotionAnalysis.trend.sad > 0 ? 'danger' : 'success'}>{emotionAnalysis.trend.sad > 0 ? '+' : ''}{emotionAnalysis.trend.sad}</Badge></li>
                                                                        <li>Raiva: <Badge bg={emotionAnalysis.trend.angry > 0 ? 'danger' : 'success'}>{emotionAnalysis.trend.angry > 0 ? '+' : ''}{emotionAnalysis.trend.angry}</Badge></li>
                                                                    </ul>
                                                                    {emotionAnalysis.emotionalPeaks.length > 0 && (
                                                                        <>
                                                                            <h6>Picos Emocionais</h6>
                                                                            {emotionAnalysis.emotionalPeaks.map((peak, index) => (
                                                                                <Alert variant="warning" key={index} className="alert-emotional-peak">{peak}</Alert>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </Col>
                                                            </Row>
                                                        ) : (
                                                            <p className="text-muted">Não há dados suficientes.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={12} className="mb-4">
                                                <Card className="shadow-sm">
                                                    <Card.Header><h5 className="mb-0">Resumo Inteligente</h5></Card.Header>
                                                    <Card.Body>
                                                        <p className="lead">{generateAISummary(emotionAnalysis)}</p>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={12} className="mb-4">
                                                <Card className="shadow-sm card-ia-prediction">
                                                    <Card.Header><h5 className="mb-0">Previsões</h5></Card.Header>
                                                    <Card.Body>
                                                        <h6>Previsão para as Próximas 24h</h6>
                                                        <p>{prediction}</p>
                                                        {anomaly && anomaly.detected && (
                                                            <Alert variant="danger" className="alert-anomaly">
                                                                <strong>Alerta:</strong> {anomaly.message}
                                                            </Alert>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="monitoring-tools" className="no-print">
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Ferramentas de Monitoramento</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <p className="text-muted">Abra uma das ferramentas abaixo em uma nova janela para iniciar o monitoramento em tempo real de <strong>{selectedPatient.nome_completo}</strong>.</p>
                                                <Row>
                                                    <Col md={6} className="mb-4">
                                                        <Card className="h-100 text-center">
                                                            <Card.Img variant="top" src={emotionalMonitoringImg} style={{ maxHeight: '180px', objectFit: 'contain', paddingTop: '1rem' }} />
                                                            <Card.Body className="d-flex flex-column">
                                                                <Card.Title>Monitoramento Emocional</Card.Title>
                                                                <Card.Text>Analisa expressões faciais para identificar emoções.</Card.Text>
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() => handleOpenMonitoringTool('emotion-detector')}
                                                                    className="mt-auto"
                                                                >
                                                                    Abrir Detector de Emoções
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={6} className="mb-4">
                                                        <Card className="h-100 text-center">
                                                            <Card.Img variant="top" src={strokeRiskImg} style={{ maxHeight: '180px', objectFit: 'contain', paddingTop: '1rem' }} />
                                                            <Card.Body className="d-flex flex-column">
                                                                <Card.Title>Monitoramento de Risco de AVC</Card.Title>
                                                                <Card.Text>Verifica a simetria facial para detectar sinais de alerta.</Card.Text>
                                                                <Button
                                                                    variant="warning"
                                                                    onClick={() => handleOpenMonitoringTool('stroke-risk-monitor')}
                                                                    className="mt-auto"
                                                                >
                                                                    Abrir Monitor de AVC
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={6} className="mb-4">
                                                        <Card className="h-100 text-center">
                                                            <Card.Img variant="top" src={repetitivePatternsImg} style={{ maxHeight: '180px', objectFit: 'contain', paddingTop: '1rem' }} />
                                                            <Card.Body className="d-flex flex-column">
                                                                <Card.Title>Padrões Repetitivos</Card.Title>
                                                                <Card.Text>Identifica movimentos de estereotipia corporal ou de mãos.</Card.Text>
                                                                <Button
                                                                    variant="info"
                                                                    onClick={() => handleOpenMonitoringTool('stereotypy-monitor')}
                                                                    className="mt-auto"
                                                                >
                                                                    Abrir Monitor de Estereotipias
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={6} className="mb-4">
                                                        <Card className="h-100 text-center">
                                                            <Card.Img variant="top" src={triggerRecorderImg} style={{ maxHeight: '180px', objectFit: 'contain', paddingTop: '1rem' }} />
                                                            <Card.Body className="d-flex flex-column">
                                                                <Card.Title>Analisador de Vocalizações</Card.Title>
                                                                <Card.Text>Grava e analisa a fala para identificar padrões e gatilhos.</Card.Text>
                                                                <Button
                                                                    variant="success"
                                                                    onClick={() => handleOpenMonitoringTool('trigger-recorder')}
                                                                    className="mt-auto"
                                                                >
                                                                    Abrir Gravador de Voz
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="consultation" className="no-print">
                                        <Card className="shadow-sm">
                                            <Card.Header><h5 className="mb-0">Histórico de Consultas</h5></Card.Header>
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
                                                                <th>Observações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {consultations.map(c => (
                                                                <tr key={c.id}>
                                                                    <td>{formatDate(c.appointment_date)}</td>
                                                                    <td>{c.appointment_time ? c.appointment_time.substring(0, 5) : 'N/A'}</td>
                                                                    <td>{c.appointment_type}</td>
                                                                    <td>{c.status}</td>
                                                                    <td>{c.value ? parseFloat(c.value).toFixed(2) : '0.00'}</td>
                                                                    <td>{c.payment_method || 'N/A'}</td>
                                                                    <td>{c.notes || 'N/A'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                ) : (
                                                    <Alert variant="info">Nenhuma consulta registrada.</Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="prescription">
                                        <div className="printable-prescription">
                                            <div className="print-header text-center">
                                                <img src={sloganProfissional} alt="Slogan do Profissional" style={{ maxWidth: '100%', height: 'auto', marginBottom: '20px' }} />
                                                <h4>Prescrição Médica</h4>
                                                <p><strong>Paciente:</strong> {selectedPatient?.nome_completo || 'N/A'}</p>
                                                <p><strong>Responsável:</strong> {selectedPatient?.parent || 'N/A'}</p>
                                                <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                                            </div>
                                            {filteredPrescriptions.length > 0 ? (
                                                filteredPrescriptions.map(prescription => (
                                                    <div key={prescription.id} className="prescription-block">
                                                        <Table striped bordered hover responsive>
                                                            <thead>
                                                                <tr>
                                                                    <th>Prescrição ou Medicamento</th>
                                                                    <th>Quantidade ou Dosagem</th>
                                                                    <th>Indicações ou Sugestões</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {prescription.medications.map((med, index) => (
                                                                    <tr key={`${prescription.id}-${index}`}>
                                                                        <td>{med.medication}</td>
                                                                        <td>{med.dosage}</td>
                                                                        <td>{med.indicationssuggestions || 'N/A'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                        {prescription.observations && (
                                                            <div className="prescription-observations">
                                                                <strong>Observações:</strong> {prescription.observations}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center">Nenhuma prescrição registrada.</p>
                                            )}
                                            <div className="print-footer">
                                                <p><strong>Médico:</strong> {prescriptions[0]?.professional_name || 'N/A'}</p>
                                                <p><strong>Inscrição:</strong> {prescriptions[0]?.professional_registration || 'N/A'}</p>
                                                <p><strong>Assinatura:</strong></p>
                                                <div className="signature-line"></div>
                                            </div>
                                        </div>
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
                                                                <Button variant="secondary" onClick={handlePrint} aria-label="Imprimir prescrições">
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
                                                                            </tr>
                                                                        ))
                                                                    )
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={5} className="text-center">Nenhuma prescrição registrada.</td>
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
                </>
            )}
        </Container>
    );
};

export default ParentDashboard;