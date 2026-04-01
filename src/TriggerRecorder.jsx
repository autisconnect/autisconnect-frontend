// Ficheiro: src/TriggerRecorder.jsx (Versão Final e Limpa)

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import logonovo from './assets/logonovo.png';
import { X } from 'react-bootstrap-icons';
import axios from 'axios';
import './App.css';

const TriggerRecorder = () => {
    // Estados
    const [patientId, setPatientId] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResults, setAnalysisResults] = useState([]);
    const [transcribedText, setTranscribedText] = useState('');
    const [, setIsTranscribing] = useState(false);

    // Refs
    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef(''); // Usar ref para acumular o texto final

    const location = useLocation();

    // Efeito para ler o ID do paciente
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('patientId');
        if (id) {
            setPatientId(id);
        } else {
            setError("ID do paciente não encontrado na URL. A gravação está desativada.");
        }
    }, [location]);

    // --- Funções de Gravação e Transcrição ---
    const handleStartRecording = async () => {
        if (!patientId) {
            setError("Não é possível iniciar a gravação sem um ID de paciente.");
            return;
        }
        setError(null);
        setAnalysisResults([]);
        setTranscribedText('');
        finalTranscriptRef.current = ''; // Limpa o texto acumulado

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Reconhecimento de fala não é suportado neste navegador. Tente usar o Google Chrome.");
            return;
        }
        
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onstart = () => {
            setIsTranscribing(true);
            console.log("Reconhecimento de fala iniciado.");
        };

        recognitionRef.current.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptRef.current += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            // Atualiza o estado com o texto parcial e o final acumulado
            setTranscribedText(finalTranscriptRef.current + interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Erro no reconhecimento de fala:", event.error);
            // Trata o erro 'no-speech' de forma amigável
            if (event.error === 'no-speech') {
                setError("Nenhuma fala foi detectada. Por favor, tente falar mais perto do microfone.");
            } else {
                setError(`Erro no reconhecimento de fala: ${event.error}`);
            }
            setIsRecording(false);
            setIsTranscribing(false);
        };

        recognitionRef.current.onend = () => {
            setIsTranscribing(false);
            console.log("Reconhecimento de fala parado.");
        };

        recognitionRef.current.start();
        setIsRecording(true);
    };

    const handleStopRecording = async () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);

        // Aguarda um momento para garantir que o texto final foi processado
        await new Promise(resolve => setTimeout(resolve, 500));

        const finalText = finalTranscriptRef.current.trim();
        if (finalText.length > 0) {
            setIsLoading(true);
            await analyzeAndSaveText(finalText);
            setIsLoading(false);
        }
    };

    // --- Análise e Salvamento do Texto ---
    const analyzeAndSaveText = async (text) => {
        if (!text) return;
        
        console.log("Analisando texto:", text);
        
        const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
        const wordCount = words.length;
        const uniqueWords = new Set(words).size;
        const wordFrequency = words.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        
        const repeatedWords = Object.entries(wordFrequency).filter(([, count]) => count > 2);

        const analysis = {
            wordCount,
            uniqueWords,
            lexicalDiversity: wordCount > 0 ? (uniqueWords / wordCount) : 0,
            repeatedWords: repeatedWords.map(([word, count]) => `${word} (${count}x)`),
            fullText: text
        };

        setAnalysisResults([analysis]);
        await saveVocalizationToDB(analysis);
    };

    const saveVocalizationToDB = async (analysisData) => {
        if (!patientId) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Token não encontrado. Não foi possível salvar a análise.");
            return;
        }

        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/vocalizations', {
                patient_id: patientId,
                analysis_data: analysisData,
                date: new Date( ).toISOString()
            }, config);
            console.log("Análise de vocalização salva com sucesso.");
        } catch (err) {
            console.error("Erro ao salvar análise de vocalização:", err);
            setError("Falha ao comunicar com o servidor para salvar a análise.");
        }
    };

    // --- Renderização ---
    return (
        <div className="App bg-light min-vh-100">
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={4} className="text-center text-md-start">
                            <img src={logonovo} alt="AutisConnect" className="top-bar-logo" />
                        </Col>
                        <Col md={4} className="text-center d-none d-md-block">
                            <span className="text-white fw-semibold">Analisador de Vocalizacoes</span>
                        </Col>
                        <Col md={4} className="text-center text-md-end">
                            <Button variant="outline-light" size="sm" onClick={() => window.close()}>
                                <X className="me-2" /> Fechar
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </nav>

            <div className="home-page" style={{ paddingTop: '85px' }}>
                <section className="hero-section hero-short">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={7} className="mb-4 mb-lg-0">
                                <div className="hero-content-box p-4 rounded-4">
                                    <h2 className="display-6 fw-bold mb-2 text-white">Analisador de Vocalizacoes</h2>
                                    <p className="text-white-90 mb-1">Registre e acompanhe padroes de vocalizacao.</p>
                                    <p className="text-white-90 mb-0">Dados organizados para apoio terapeutico.</p>
                                </div>
                            </Col>
                            <Col lg={5}>
                                <Card className="shadow-sm border-0">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-2">Resumo rapido</h5>
                                        <div className="text-muted">Use a gravacao para gerar insights automaticos.</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <main className="dashboard-section py-4">
                    <Container fluid className="trigger-recorder-page">
{error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

                    <Row className="align-items-center mb-3">
                        <Col xs="auto">
                            <Button
                                variant={isRecording ? "danger" : "success"}
                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                disabled={isLoading || !patientId}
                            >
                                {isRecording ? <><Spinner as="span" animation="grow" size="sm" /> Parar Gravação</> : "Iniciar Análise de Fala"}
                            </Button>
                        </Col>
                        <Col>
                            {isRecording && <span className="text-danger">Escutando... Fale agora.</span>}
                            {isLoading && <Spinner animation="border" size="sm" />}
                        </Col>
                    </Row>

                    <Card bg="light" className="p-3 mb-3">
                        <Card.Title>Transcrição</Card.Title>
                        <Card.Text style={{ minHeight: '50px' }}>
                            {transcribedText || (isRecording ? "Ouvindo..." : "Aguardando início da gravação.")}
                        </Card.Text>
                    </Card>
                    
                    <hr />

                    <h6 className="mt-3">Resultados da Análise (IA - Nível 1):</h6>
                    {isLoading && <p>Analisando texto gravado...</p>}
                    
                    {analysisResults.length > 0 && (
                        <ListGroup variant="flush">
                            {analysisResults.map((result, index) => (
                                <React.Fragment key={index}>
                                    <ListGroup.Item><strong>Contagem de Palavras:</strong> <Badge bg="primary">{result.wordCount}</Badge></ListGroup.Item>
                                    <ListGroup.Item><strong>Vocabulário (Palavras Únicas):</strong> <Badge bg="info">{result.uniqueWords}</Badge></ListGroup.Item>
                                    <ListGroup.Item><strong>Diversidade Léxica:</strong> <Badge bg="secondary">{(result.lexicalDiversity * 100).toFixed(1)}%</Badge></ListGroup.Item>
                                    {result.repeatedWords.length > 0 && (
                                        <ListGroup.Item><strong>Padrões de Repetição (Ecolalia):</strong> {result.repeatedWords.join(', ')}</ListGroup.Item>
                                    )}
                                </React.Fragment>
                            ))}
                        </ListGroup>
                    )}
        </Container>
            </main>

            <footer className="footer-section py-4">
                <Container>
                    <Row className="align-items-center">
                        <Col md={6} className="footer-left text-start">
                            <p className="mb-0">
                                {'\u00a9'} 2026 Nf Representacoes Comerciais Ltda.<br />
                                <small>Todos os direitos reservados.</small>
                            </p>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    </div>
    );
};

export default TriggerRecorder;
