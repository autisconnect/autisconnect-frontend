import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, Badge, Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import {
    CheckCircle,
    ExclamationTriangle,
    InfoCircle,
    Mic,
    MicMute,
    RecordCircle,
    Soundwave,
    X
} from 'react-bootstrap-icons';
import axios from 'axios';
import logonovo from './assets/logonovo.png';
import './App.css';
import './TriggerRecorder.css';

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

const TriggerRecorder = () => {
    const [patientId, setPatientId] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResults, setAnalysisResults] = useState([]);
    const [transcribedText, setTranscribedText] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef('');

    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('patientId');

        if (id) {
            setPatientId(id);
            setError(null);
            return;
        }

        setPatientId(null);
        setError('Paciente não identificado. Abra esta ferramenta a partir do Dashboard do Paciente para iniciar um monitoramento.');
    }, [location]);

    useEffect(() => () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (stopError) {
                console.warn('Não foi possível encerrar o reconhecimento ao desmontar.', stopError);
            }
        }
    }, []);

    const clearFeedback = () => {
        setError(null);
        setSaveMessage('');
    };

    const handleStartRecording = async () => {
        if (!patientId) {
            setError('Não é possível iniciar a gravação sem um ID de paciente.');
            return;
        }

        clearFeedback();
        setAnalysisResults([]);
        setTranscribedText('');
        setIsLoading(false);
        finalTranscriptRef.current = '';

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Reconhecimento de fala não é suportado neste navegador. Utilize um navegador compatível, como Google Chrome.');
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onstart = () => {
            setIsTranscribing(true);
            console.log('Reconhecimento de fala iniciado.');
        };

        recognitionRef.current.onresult = (event) => {
            let interimTranscript = '';

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                if (event.results[index].isFinal) {
                    finalTranscriptRef.current += `${event.results[index][0].transcript} `;
                } else {
                    interimTranscript += event.results[index][0].transcript;
                }
            }

            setTranscribedText(`${finalTranscriptRef.current}${interimTranscript}`.trim());
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Erro no reconhecimento de fala:', event.error);

            if (event.error === 'no-speech') {
                setError('Nenhuma fala foi detectada. Tente falar mais próximo ao microfone.');
            } else {
                setError(`Erro no reconhecimento de fala: ${normalizeText(event.error)}`);
            }

            setIsRecording(false);
            setIsTranscribing(false);
        };

        recognitionRef.current.onend = () => {
            setIsTranscribing(false);
            console.log('Reconhecimento de fala parado.');
        };

        recognitionRef.current.start();
        setIsRecording(true);
    };

    const handleStopRecording = async () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        setIsRecording(false);

        await new Promise((resolve) => {
            window.setTimeout(resolve, 500);
        });

        const finalText = finalTranscriptRef.current.trim();
        if (finalText.length > 0) {
            setIsLoading(true);
            await analyzeAndSaveText(finalText);
            setIsLoading(false);
        }
    };

    const analyzeAndSaveText = async (text) => {
        if (!text) {
            return;
        }

        console.log('Analisando texto:', text);

        const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
        const wordCount = words.length;
        const uniqueWords = new Set(words).size;
        const wordFrequency = words.reduce((accumulator, word) => {
            accumulator[word] = (accumulator[word] || 0) + 1;
            return accumulator;
        }, {});

        const repeatedWords = Object.entries(wordFrequency).filter(([, count]) => count > 2);

        const analysis = {
            wordCount,
            uniqueWords,
            lexicalDiversity: wordCount > 0 ? uniqueWords / wordCount : 0,
            repeatedWords: repeatedWords.map(([word, count]) => `${word} (${count}x)`),
            fullText: text
        };

        setAnalysisResults([analysis]);
        await saveVocalizationToDB(analysis);
    };

    const saveVocalizationToDB = async (analysisData) => {
        if (!patientId) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Token não encontrado. Não foi possível salvar a análise.');
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            await axios.post('http://localhost:5000/api/vocalizations', {
                patient_id: patientId,
                analysis_data: analysisData,
                date: new Date().toISOString()
            }, config);

            setSaveMessage('Análise salva com sucesso no histórico do paciente.');
            console.log('Análise de vocalização salva com sucesso.');
        } catch (err) {
            console.error('Erro ao salvar análise de vocalização:', err);
            setError(normalizeText(err?.response?.data?.error || 'Falha ao comunicar com o servidor para salvar a análise.'));
        }
    };

    const latestAnalysis = analysisResults[0] || null;
    const showLiveTranscript = isRecording || isTranscribing;
    const appState = useMemo(() => {
        if (!patientId) return 'blocked';
        if (error && !isRecording && !isLoading && !latestAnalysis) return 'error';
        if (isLoading) return 'analyzing';
        if (isRecording || isTranscribing) return 'recording';
        if (latestAnalysis) return 'complete';
        return 'ready';
    }, [error, isLoading, isRecording, isTranscribing, latestAnalysis, patientId]);

    const statusMeta = {
        blocked: {
            label: 'Paciente não identificado',
            description: 'Abra esta ferramenta a partir do Dashboard do Paciente para iniciar um monitoramento.',
            tone: 'blocked',
            icon: InfoCircle
        },
        ready: {
            label: 'Pronto',
            description: 'Posicione-se próximo ao microfone e inicie quando estiver preparado.',
            tone: 'ready',
            icon: Mic
        },
        recording: {
            label: 'Gravando',
            description: 'Escutando... fale normalmente.',
            tone: 'recording',
            icon: RecordCircle
        },
        analyzing: {
            label: 'Analisando',
            description: 'Analisando vocalização...',
            tone: 'analyzing',
            icon: Soundwave
        },
        complete: {
            label: 'Análise concluída',
            description: 'Os resultados da vocalização já estão disponíveis abaixo.',
            tone: 'complete',
            icon: CheckCircle
        },
        error: {
            label: 'Atenção',
            description: 'A ferramenta encontrou um problema e você pode tentar novamente.',
            tone: 'error',
            icon: ExclamationTriangle
        }
    }[appState];

    const StatusIcon = statusMeta.icon;
    const recordButtonDisabled = isLoading || !patientId;
    const recordButtonLabel = isRecording ? 'Parar gravação' : 'Iniciar gravação';
    const recordButtonIcon = isRecording ? MicMute : Mic;
    const RecordButtonIcon = recordButtonIcon;

    return (
        <div className="ac-trigger-page">
            <header className="ac-trigger-header">
                <Container fluid="xl" className="ac-trigger-header__inner">
                    <div className="ac-trigger-header__brand">
                        <img src={logonovo} alt="AutisConnect" className="ac-trigger-header__logo" />
                    </div>

                    <div className="ac-trigger-header__title">
                        <span>Vocalizações</span>
                        <strong>Monitoramento de Vocalizações</strong>
                    </div>

                    <Button
                        variant="link"
                        className="ac-trigger-header__close"
                        onClick={() => window.close()}
                        aria-label="Fechar ferramenta"
                    >
                        <X />
                        <span>Fechar</span>
                    </Button>
                </Container>
            </header>

            <main className="ac-trigger-workspace">
                <Container fluid="xl">
                    <section className="ac-trigger-hero">
                        <div>
                            <span className="ac-trigger-hero__eyebrow">Voice Monitoring Workspace</span>
                            <h1>Monitoramento de Vocalizações</h1>
                            <p>Registre amostras de fala e acompanhe indicadores de comunicação.</p>
                        </div>
                        <Badge className="ac-trigger-badge">Análise em tempo real</Badge>
                    </section>

                    {(error || saveMessage) && (
                        <div className="ac-trigger-feedback-stack">
                            {error ? (
                                <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-0">
                                    {error}
                                </Alert>
                            ) : null}
                            {saveMessage ? (
                                <Alert variant="success" dismissible onClose={() => setSaveMessage('')} className="mb-0">
                                    {saveMessage}
                                </Alert>
                            ) : null}
                        </div>
                    )}

                    <Row className="g-4">
                        <Col xl={5}>
                            <section className={`ac-trigger-recorder ac-trigger-recorder--${statusMeta.tone}`}>
                                <div className="ac-trigger-recorder__status">
                                    <span className={`ac-trigger-status ac-trigger-status--${statusMeta.tone}`}>
                                        <StatusIcon />
                                        <span>{statusMeta.label}</span>
                                    </span>
                                    {isLoading ? (
                                        <span className="ac-trigger-status-note">
                                            <Spinner animation="border" size="sm" />
                                            <span>Analisando vocalização...</span>
                                        </span>
                                    ) : showLiveTranscript ? (
                                        <span className="ac-trigger-status-note">
                                            <Spinner animation="grow" size="sm" />
                                            <span>Escutando em tempo real</span>
                                        </span>
                                    ) : null}
                                </div>

                                <div className="ac-trigger-recorder__center">
                                    <div className={`ac-trigger-mic${isRecording ? ' is-recording' : ''}`}>
                                        <div className="ac-trigger-mic__rings" aria-hidden="true">
                                            <span />
                                            <span />
                                            <span />
                                        </div>
                                        <div className="ac-trigger-mic__core">
                                            {isRecording ? <RecordCircle /> : <Mic />}
                                        </div>
                                    </div>

                                    <div className="ac-trigger-recorder__copy">
                                        <h2>{statusMeta.label === 'Pronto' ? 'Pronto para gravar' : statusMeta.label}</h2>
                                        <p>{statusMeta.description}</p>
                                    </div>
                                </div>

                                <div className="ac-trigger-recorder__actions">
                                    <Button
                                        className={`ac-trigger-record-button${isRecording ? ' is-recording' : ''}`}
                                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                                        disabled={recordButtonDisabled}
                                    >
                                        <RecordButtonIcon />
                                        <span>{recordButtonLabel}</span>
                                    </Button>
                                </div>

                                {!patientId ? (
                                    <div className="ac-trigger-blocked-note">
                                        Abra esta ferramenta pelo dashboard do paciente para habilitar a gravação.
                                    </div>
                                ) : null}
                            </section>
                        </Col>

                        <Col xl={7}>
                            <section className="ac-trigger-transcript">
                                <div className="ac-trigger-panel-header">
                                    <div>
                                        <span className="ac-trigger-panel-header__eyebrow">Transcrição</span>
                                        <h3>Transcrição em tempo real</h3>
                                    </div>
                                    <Badge className={`ac-trigger-badge ac-trigger-badge--${statusMeta.tone}`}>
                                        {statusMeta.label}
                                    </Badge>
                                </div>

                                <div className="ac-trigger-transcript__content">
                                    {transcribedText ? (
                                        <p>{transcribedText}</p>
                                    ) : (
                                        <div className="ac-trigger-empty-state">
                                            <InfoCircle />
                                            <div>
                                                <strong>Transcrição disponível aqui</strong>
                                                <span>A transcrição aparecerá aqui durante a gravação.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </Col>
                    </Row>

                    <section className="ac-trigger-results">
                        <div className="ac-trigger-panel-header">
                            <div>
                                <span className="ac-trigger-panel-header__eyebrow">Análise estatística</span>
                                <h3>Análise da vocalização</h3>
                            </div>
                            {latestAnalysis ? (
                                <Badge className="ac-trigger-badge ac-trigger-badge--complete">Sessão processada</Badge>
                            ) : null}
                        </div>

                        {isLoading ? (
                            <div className="ac-trigger-analysis-loading">
                                <Spinner animation="border" size="sm" />
                                <span>Analisando vocalização...</span>
                            </div>
                        ) : null}

                        {latestAnalysis ? (
                            <>
                                <div className="ac-trigger-metrics">
                                    <article className="ac-trigger-metric">
                                        <span>Palavras</span>
                                        <strong>{latestAnalysis.wordCount}</strong>
                                        <small>Total identificado na gravação.</small>
                                    </article>
                                    <article className="ac-trigger-metric">
                                        <span>Palavras únicas</span>
                                        <strong>{latestAnalysis.uniqueWords}</strong>
                                        <small>Termos diferentes identificados.</small>
                                    </article>
                                    <article className="ac-trigger-metric">
                                        <span>Diversidade lexical</span>
                                        <strong>{(latestAnalysis.lexicalDiversity * 100).toFixed(1)}%</strong>
                                        <small>Proporção entre palavras diferentes e o total de palavras.</small>
                                    </article>
                                    <article className="ac-trigger-metric">
                                        <span>Repetições</span>
                                        <strong>{latestAnalysis.repeatedWords.length}</strong>
                                        <small>Termos que apareceram mais de duas vezes.</small>
                                    </article>
                                </div>

                                <div className="ac-trigger-repetitions">
                                    <div className="ac-trigger-panel-header ac-trigger-panel-header--compact">
                                        <div>
                                            <span className="ac-trigger-panel-header__eyebrow">Padrões</span>
                                            <h4>Padrões de repetição</h4>
                                        </div>
                                    </div>

                                    {latestAnalysis.repeatedWords.length > 0 ? (
                                        <div className="ac-trigger-chip-list">
                                            {latestAnalysis.repeatedWords.map((item) => (
                                                <span key={item} className="ac-trigger-chip">{item}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="ac-trigger-repetitions__empty">
                                            Nenhum padrão recorrente foi identificado com o critério atual.
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="ac-trigger-empty-results">
                                <Soundwave />
                                <div>
                                    <strong>Nenhuma análise disponível ainda</strong>
                                    <span>Capture uma amostra de fala para gerar indicadores de comunicação.</span>
                                </div>
                            </div>
                        )}
                    </section>
                </Container>
            </main>

            <footer className="ac-trigger-footer">
                <Container fluid="xl">
                    <p>© 2026 Nf Representações Comerciais Ltda. Todos os direitos reservados.</p>
                </Container>
            </footer>
        </div>
    );
};

export default TriggerRecorder;

