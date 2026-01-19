import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';
import logohori from '../assets/logo.png';

// IMAGENS — todas já estão em src/assets/
import dp00 from '../assets/dp 00.png'; // hero principal
import dp01 from '../assets/dp 01.png'; // Visão Geral Completa
import dp02 from '../assets/dp 02.png'; // Análise Emocional por IA
import dp03 from '../assets/dp 03.png'; // Monitoramento de Risco de AVC
import dp04 from '../assets/dp 04.png'; // Análise de Vocalizações
import dp05 from '../assets/dp 05.png'; // Prescrições e Histórico

import '../App.css';

function PresentationPatientDetails() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBackToMain = () => navigate('/');
    const handleSignUp = () => navigate('/signup');

    return (
        <div className="presentation-page">

        {/* NAVBAR PADRÃO */}
        <Navbar bg="light" variant="light" expand="lg" fixed="top" className="mb-4 service-navbar">
            <Container>
            <Navbar.Brand>
                <img src={logohori} alt="AutisConnect Logo" className="d-inline-block align-top logo" />
            </Navbar.Brand>
            <div className="ms-auto">
                <Button
                variant="danger"
                onClick={handleBackToMain}
                style={{ backgroundColor: '#e67e22', borderColor: '#e67e22' }}
                >
                Voltar
                </Button>
            </div>
            </Container>
        </Navbar>

        {/* HERO COM FOTO dp00 */}
        <div
            className="hero-section text-white text-center d-flex align-items-center justify-content-center"
            style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${dp00})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '500px'
            }}
        >
            <div>
            <h1 className="display-4 fw-bold mb-4">Detalhes do Paciente</h1>
            <p className="lead col-lg-8 mx-auto">
                Acompanhe toda a jornada clínica com gráficos, análises de IA, prescrições e histórico completo — tudo em um só lugar.
            </p>
            </div>
        </div>

        <Container fluid className="px-md-5 py-5">

            <Row className="text-center mb-5">
            <Col>
                <h2 className="display-5 fw-bold">O acompanhamento clínico mais completo do mercado</h2>
                <p className="lead text-muted">
                Tudo o que o profissional precisa para tomar decisões baseadas em dados reais.
                </p>
            </Col>
            </Row>

            {/* CARDS COM FOTOS */}
            <Row className="g-5">

            {/* 01 - Visão Geral Completa */}
            <Col md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0 text-center p-4 hover-lift">
                <Image src={dp01} fluid rounded className="mb-4" style={{ height: '220px', objectFit: 'cover' }} alt="Visão Geral Completa" />
                <h4 className="fw-bold">Visão Geral Completa</h4>
                <p>Perfil do paciente, idade, diagnóstico, última consulta e indicadores principais em uma única tela.</p>
                </Card>
            </Col>

            {/* 02 - Análise Emocional por IA */}
            <Col md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0 text-center p-4 hover-lift">
                <Image src={dp02} fluid rounded className="mb-4" style={{ height: '220px', objectFit: 'cover' }} alt="Análise Emocional por IA" />
                <h4 className="fw-bold">Análise Emocional por IA</h4>
                <p>Gráficos de humor, picos emocionais, volatilidade e previsões com inteligência artificial avançada.</p>
                </Card>
            </Col>

            {/* 03 - Monitoramento de Risco de AVC */}
            <Col md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0 text-center p-4 hover-lift">
                <Image src={dp03} fluid rounded className="mb-4" style={{ height: '220px', objectFit: 'cover' }} alt="Monitoramento de Risco de AVC" />
                <h4 className="fw-bold">Monitoramento de Risco de AVC</h4>
                <p>Detecção automática de assimetria facial com alertas em tempo real.</p>
                </Card>
            </Col>

            {/* 04 - Análise de Vocalizações */}
            <Col md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0 text-center p-4 hover-lift">
                <Image src={dp04} fluid rounded className="mb-4" style={{ height: '220px', objectFit: 'cover' }} alt="Análise de Vocalizações" />
                <h4 className="fw-bold">Análise de Vocalizações</h4>
                <p>Transcrição automática, detecção de ecolalia, diversidade lexical e evolução da fala.</p>
                </Card>
            </Col>

            {/* 05 - Prescrições e Histórico */}
            <Col md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0 text-center p-4 hover-lift">
                <Image src={dp05} fluid rounded className="mb-4" style={{ height: '220px', objectFit: 'cover' }} alt="Prescrições e Histórico" />
                <h4 className="fw-bold">Prescrições e Histórico</h4>
                <p>Prescrições digitais, histórico de consultas, notas evolutivas e tudo organizado cronologicamente.</p>
                </Card>
            </Col>

            </Row>

            {/* CTA FINAL */}
            <Row className="text-center py-5">
            <Col>
                <h3 className="display-6 fw-bold mb-4">
                Transforme dados em decisões clínicas
                </h3>
                <p className="lead text-muted mb-4">
                Junte-se aos profissionais que já usam o AutisConnect para elevar o padrão do acompanhamento.
                </p>
                <Button variant="primary" size="lg" onClick={handleSignUp}>Comece a Usar Agora</Button>

            </Col>
            </Row>

        </Container>

        {/* FOOTER */}
        <footer className="bg-light py-4 mt-5">
            <Container>
            <p className="text-center text-muted mb-0">
                © {new Date().getFullYear()} Nf Representações Comerciais Ltda.<br />
                <small>Todos os direitos reservados.</small>
            </p>
            </Container>
        </footer>
        </div>
    );
}

export default PresentationPatientDetails;