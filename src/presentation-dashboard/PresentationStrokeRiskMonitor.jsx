// src/presentation-dashboard/PresentationStrokeRiskMonitor.jsx (VERSÃO ATUALIZADA)

import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
// Ícones atualizados para refletir as funcionalidades reais
import { FaVideo, FaChartLine, FaChartBar, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logo.png';
import './App.css';

// Importe as novas imagens que você vai criar
import strokeHero from '../assets/stroke-hero.png';
import strokeDetection from '../assets/stroke-detection.png';
import strokeLineChart from '../assets/stroke-line-chart.png';
import strokeBarChart from '../assets/stroke-bar-chart.png';
import strokeAlert from '../assets/stroke-alert.png';

function PresentationStrokeRiskMonitor() {
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
                        <Button variant="danger" onClick={handleBackToMain} style={{ backgroundColor: '#f39c12', borderColor: '#f39c12' }}>Voltar</Button>
                    </div>
                </Container>
            </Navbar>

                <div 
                    className="hero-section mb-5" 
                    style={{ 
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${strokeHero})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        minHeight: '450px'
                    }}
                >
                <div>
                    <h1 className="display-4 fw-bold mb-3">Monitor de Risco de AVC</h1>
                    <p className="lead mb-4 text-white">
                        Utilize inteligência artificial para analisar assimetrias faciais e monitorar sinais de alerta precoces para AVC.
                    </p>
                </div>
            </div>

            <Container fluid className="px-md-5">
                <Row className="mb-5 text-center">
                    <Col>
                        <h2>Como o Monitor de Risco de AVC Funciona</h2>
                        <p className="text-muted">Nossa ferramenta inovadora usa a câmera para analisar os pontos de referência faciais (landmarks), calcular o índice de assimetria e classificar o nível de risco em tempo real.</p>
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaVideo className="text-primary me-3" size={30} /><h4>Detecção Facial em Tempo Real</h4></div>
                                <p>A câmera captura a imagem e nossa IA detecta a face e seus pontos-chave, desenhando-os na tela para uma visualização clara.</p>
                                <Image src={strokeDetection} fluid rounded className="mt-3 feature-image" alt="Detecção Facial" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaChartLine className="text-success me-3" size={30} /><h4>Acompanhamento de Tendências</h4></div>
                                <p>Visualize a evolução do índice de assimetria ao longo do tempo. Filtre os dados por dia, semana, mês ou uma data específica para análises detalhadas.</p>
                                <Image src={strokeLineChart} fluid rounded className="mt-3 feature-image" alt="Gráfico de Tendências" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaChartBar className="text-warning me-3" size={30} /><h4>Distribuição de Níveis de Risco</h4></div>
                                <p>Entenda a frequência dos níveis de risco (Baixo, Médio, Alto) com um gráfico de barras, identificando se há um padrão de alerta.</p>
                                <Image src={strokeBarChart} fluid rounded className="mt-3 feature-image" alt="Distribuição de Riscos" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaExclamationTriangle className="text-danger me-3" size={30} /><h4>Alertas Imediatos</h4></div>
                                <p>O sistema exibe alertas visuais e coloridos (verde, amarelo, vermelho) de acordo com o nível de risco detectado, facilitando a rápida identificação de problemas.</p>
                                <Image src={strokeAlert} fluid rounded className="mt-3 feature-image" alt="Alertas de Risco" />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col>
                        <Card className="shadow-sm p-4">
                            <div className="d-flex align-items-center">
                                <FaInfoCircle size={40} className="text-info me-4" />
                                <div>
                                    <h4>Importante: Ferramenta de Apoio</h4>
                                    <p className="mb-0">
                                        Este monitor é uma ferramenta de triagem e apoio, não um diagnóstico médico. Uma assimetria facial súbita é um sinal de alerta que deve ser avaliado por um profissional de saúde. Em caso de suspeita de AVC, procure atendimento médico de emergência imediatamente.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-5 text-center">
                    <Col>
                        <h3>Monitore Sinais Vitais com Tecnologia</h3>
                        <p className="text-muted mb-4">Utilize nossa ferramenta de IA para um acompanhamento preventivo e proativo.</p>
                        <Button variant="primary" size="lg" onClick={handleSignUp}>Comece a Usar Agora</Button>
                    </Col>
                </Row>
            </Container>

            <footer className="bg-light py-4 mt-5">
                <Container><p className="mb-0 text-center text-muted">Nrmendfsystems. Todos os direitos reservados.</p></Container>
            </footer>
        </div>
    );
}

export default PresentationStrokeRiskMonitor;
