import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { FaMicrophone, FaSpellCheck, FaBrain, FaHistory } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logo.png';
import '../App.css';

// Importe as imagens que você vai criar
import recorderMain from '../assets/recorder-main.png';
import recorderTranscription from '../assets/recorder-transcription.png';
import recorderAnalysis from '../assets/recorder-analysis.png';
import recorderHistory from '../assets/recorder-history.png';
import recorderQuantitative from '../assets/recorder-quantitative.png';


function PresentationTriggerRecorder() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBackToMain = () => navigate('/');
    const handleSignUp = () => navigate('/signup');

    return (
        <div className="presentation-page">
            <Navbar bg="light" variant="light" expand="lg" fixed="top" className="mb-4 service-navbar">
                <Container>
                    <Navbar.Brand><img src={logohori} alt="AutisConnect Logo" className="d-inline-block align-top logo" /></Navbar.Brand>
                    <div className="ms-auto">
                        <Button variant="danger" onClick={handleBackToMain} style={{ backgroundColor: '#9b59b6', borderColor: '#9b59b6' }}>Voltar</Button>
                    </div>
                </Container>
            </Navbar>

            <div 
                className="hero-section mb-5" 
                style={{ 
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${recorderMain})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '450px'
                }}
            >
                <div>
                    <h1 className="display-4 fw-bold mb-3">Analisador de Vocalizações</h1>
                    <p className="lead mb-4 text-white">Grave, transcreva e analise padrões de fala para obter insights sobre comunicação e ecolalia.</p>
                </div>
            </div>

            <Container fluid className="px-md-5">
                <Row className="mb-5 text-center">
                    <Col>
                        <h2>Como o Analisador de Vocalizações Funciona</h2>
                        <p className="text-muted">Nossa ferramenta utiliza tecnologia de reconhecimento de fala para transformar áudio em texto e aplicar análises linguísticas.</p>
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaMicrophone className="text-primary me-3" size={30} /><h4>Gravação e Transcrição</h4></div>
                                <p>Inicie a gravação com um clique. A fala é capturada e convertida em texto em tempo real, diretamente no navegador.</p>
                                <Image src={recorderTranscription} fluid rounded className="mt-3 feature-image" alt="Transcrição em tempo real" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaBrain className="text-success me-3" size={30} /><h4>Análise de Padrões (IA)</h4></div>
                                <p>O sistema calcula automaticamente a contagem de palavras, a diversidade lexical e identifica padrões de repetição (ecolalia).</p>
                                <Image src={recorderAnalysis} fluid rounded className="mt-3 feature-image" alt="Análise de Padrões" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaHistory className="text-warning me-3" size={30} /><h4>Histórico Detalhado</h4></div>
                                <p>Todas as gravações e análises são salvas no perfil do paciente, permitindo o acompanhamento da evolução da comunicação ao longo do tempo.</p>
                                <Image src={recorderHistory} fluid rounded className="mt-3 feature-image" alt="Histórico de Vocalizações" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaSpellCheck className="text-info me-3" size={30} /><h4>Suporte ao Fonoaudiólogo</h4></div>
                                <p>Fornece dados quantitativos que auxiliam fonoaudiólogos e terapeutas a avaliar a complexidade da linguagem e a eficácia das intervenções.</p>
                                <Image src={recorderQuantitative} fluid rounded className="mt-3 feature-image" alt="Análise com Inteligência Artificial" />

                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-5 text-center">
                    <Col>
                        <h3>Transforme Fala em Dados</h3>
                        <p className="text-muted mb-4">Comece a usar o Analisador de Vocalizações para entender melhor a comunicação e apoiar o desenvolvimento da linguagem.</p>
                        <Button variant="primary" size="lg" onClick={handleSignUp}>Comece Agora</Button>
                    </Col>
                </Row>
            </Container>

            <footer className="bg-light py-4 mt-5">
                <Container><p className="mb-0 text-center text-muted">Nrmendfsystems. Todos os direitos reservados.</p></Container>
            </footer>
        </div>
    );
}

export default PresentationTriggerRecorder;
