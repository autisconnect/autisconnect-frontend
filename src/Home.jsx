import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ArrowRight, Star, Award, People, Heart, Calendar, CheckCircle, PersonVideo, Mic, Sliders, Instagram, Whatsapp, Envelope } from 'react-bootstrap-icons';
import logohori from './assets/logo.png';
import pais from './assets/pais.png';
import medicos from './assets/medicos.png';
import servicos from './assets/servicos.png';
import './App.css';

const Home = () => {
    const { user, loading } = useContext(AuthContext);



    const [features] = useState([
        {
            id: 1,
            title: "Monitoramento Emocional por IA",
            description: "Tecnologia de ponta que analisa expressões faciais em tempo real para ajudar a compreender emoções não verbalizadas, fornecendo insights valiosos para terapeutas e pais.",
            icon: <Heart className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationEmotionDetector",
            color: "#e74c3c"
        },
        {
            id: 2,
            title: "Análise de Risco de AVC",
            description: "Ferramenta inovadora que utiliza análise de assimetria facial para identificar sinais de alerta precoces, permitindo uma intervenção mais rápida e segura.",
            icon: <Star className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationStrokeRiskMonitor",
            color: "#f39c12"
        },
        {
            id: 3,
            title: "Dashboard Completo para Profissionais",
            description: "Gerencie pacientes, adicione colaboradores, visualize relatórios financeiros e de diagnósticos, e acompanhe o progresso de forma centralizada e eficiente.",
            icon: <Sliders className="feature-icon" size={40} />,
            link: "/PresentationProfessionalDashboard",
            color: "#3498db"
        },
        {
            id: 4,
            title: "Analisador de Vocalizações",
            description: "Grave e transcreva vocalizações para analisar padrões de fala, diversidade lexical e identificar repetições (ecolalia), auxiliando fonoaudiólogos e terapeutas.",
            icon: <Mic className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationTriggerRecorder",
            color: "#9b59b6"
        },
        /* {
            id: 5,
            title: "Detector de Estereotipias",
            description: "Utilize a webcam para monitorar e registrar a frequência e duração de comportamentos repetitivos, como balançar o corpo ou movimentos de mãos.",
            icon: <PersonVideo className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationStereotypyMonitor",
            color: "#1abc9c"
        },*/
        {
            id: 6,
            title: "Gestão para Secretárias",
            description: "Uma plataforma dedicada para secretárias e administradores de clínicas gerenciarem agendamentos, pacientes e a comunicação para múltiplos profissionais.",
            icon: <Calendar className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationSecretaryDashboard",
            color: "#e67e22"
        }
    ]);

    const [plans] = useState([
        {
            id: 1,
            name: "Plano Organizar",
            price: "R$ 19,90", // Preço estimado, pois não foi fornecido
            period: "/mês",
            description: "Ideal para famílias que precisam de organização e suporte básico.",
            features: [
                "Acesso ao Portal de Pais",
                "Organização de Rotinas e Agendas",
                "Comunicação com Profissionais (Limitada)",
                "Acesso à Comunidade de Apoio"
            ],
            link: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=ff7bcc9a70d74fa593d25a433d8b03ba"
        },
        {
            id: 2,
            name: "Plano Acompanhar+",
            price: "R$ 49,90", // Preço estimado, pois não foi fornecido
            period: "/mês",
            description: "Para quem busca monitoramento e ferramentas avançadas de acompanhamento.",
            features: [
                "Tudo do Plano Organizar",
                "Monitoramento de Progresso Detalhado",
                "Ferramentas de IA (Monitoramento Emocional, etc.)",
                "Relatórios de Desenvolvimento"
            ],
            link: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=c9b9e97b5b84405e88b9eab5f0d57490"
        },
        {
            id: 3,
            name: "Plano Gerenciar",
            price: "R$ 99,90", // Preço estimado, pois não foi fornecido
            period: "/mês",
            description: "Solução completa para profissionais e clínicas que gerenciam múltiplos pacientes.",
            features: [
                "Tudo do Plano Acompanhar+",
                "Dashboard Profissional Completo",
                "Gestão de Múltiplos Pacientes",
                "Suporte Prioritário"
            ],
            link: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=d6cea38104bc406780de450002dc6b09"
        }
    ]);

    const [benefits] = useState([
        {
            id: 1,
            title: "Conexão Facilitada",
            description: "Conecte-se facilmente com profissionais especializados e serviços inclusivos em sua região.",
            icon: <People size={30} />
        },
        {
            id: 2,
            title: "Monitoramento Contínuo",
            description: "Acompanhe o progresso e desenvolvimento com ferramentas avançadas de análise.",
            icon: <Heart size={30} />
        },
        {
            id: 3,
            title: "Suporte 24/7",
            description: "Acesso a recursos e comunidade de apoio disponível a qualquer momento.",
            icon: <CheckCircle size={30} />
        }
    ]);



    if (loading) {
        return <div>Carregando...</div>;
    }

    return (
        <>
        <div className="home-page">
            <section className="hero-section" id="section-hero">
                <Container>
                    <Row className="align-items-center min-vh-100">
                        <Col lg={6} className="mb-4 mb-lg-0">
                            <div className="hero-content">
                                <h1 className="display-3 fw-bold mb-4">
                                    Bem-vindo ao <span className="text-gradient">AutisConnect</span>
                                </h1>
                                <p className="lead mb-4">
                                    A plataforma mais completa para conectar famílias de pessoas autistas a profissionais especializados e serviços inclusivos, promovendo suporte, inclusão e desenvolvimento em um ambiente seguro e acolhedor.
                                </p>
                                <div className="d-flex flex-wrap gap-3 mt-4">
                                    <Link to="/Signup" className="text-decoration-none">
                                        <Button variant="light" size="lg" className="px-4 py-3">
                                            <CheckCircle className="me-2" size={20} />
                                            Cadastre-se
                                        </Button>
                                    </Link>
                                    <Link to="/login" className="text-decoration-none">
                                        <Button variant="outline-light" size="lg" className="px-4 py-3">
                                            <ArrowRight className="me-2" size={20} />
                                            Fazer Login
                                        </Button>
                                    </Link>
                                </div>
                                <Row className="mt-5">
                                    {benefits.map(benefit => (
                                        <Col md={4} key={benefit.id} className="mb-3">
                                            <div className="d-flex align-items-start">
                                                <div className="text-white me-3 mt-1">
                                                    {benefit.icon}
                                                </div>
                                                <div>
                                                    <h6 className="text-white fw-bold mb-1">{benefit.title}</h6>
                                                    <small className="text-white-50">{benefit.description}</small>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="hero-image text-center">
                                <img 
                                    src={logohori} 
                                    alt="AutisConnect - Conectando famílias, profissionais e serviços" 
                                    className="img-fluid hero-logo"
                                />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* ===================================================
                SEÇÃO: AUTISCONNECT PARA PROFISSIONAIS E CLÍNICAS
            =================================================== */}
            <section className="py-5" style={{ backgroundColor: '#f0f5ff' }}>
            <Container>
                <div className="text-center mb-5">
                <h2 className="display-5 fw-bold mb-4">
                    Feito para <span className="text-primary">Profissionais e Clínicas</span> que Transformam Vidas
                </h2>
                <p className="lead text-muted col-lg-9 mx-auto">
                    Tenha controle total dos seus pacientes, evolua com dados reais, gerencie sua agenda e financeiro em um só lugar.
                </p>
                <div className="mt-4">
                    <h3 className="display-6 fw-bold text-primary">
                    A partir de apenas <span className="text-dark">R$ 97/mês</span>
                    </h3>
                    <p className="text-muted fs-5">Plano Analisar 50 – o mais escolhido por profissionais</p>
                </div>
                </div>

                <Row className="g-5 justify-content-center">

                {/* Card 1 */}
                <Col lg={4} md={6}>
                    <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                    <div className="mb-4">
                        <div className="icon-circle bg-primary text-white mx-auto d-flex align-items-center justify-content-center"
                            style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                        <People size={38} />
                        </div>
                    </div>
                    <h4>Gestão Completa de Pacientes</h4>
                    <p className="text-muted">
                        Cadastro ilimitado, histórico clínico, evolução por métricas validadas, notas evolutivas e prescrições digitais.
                    </p>
                    </Card>
                </Col>

                {/* Card 2 */}
                <Col lg={4} md={6}>
                    <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                    <div className="mb-4">
                        <div className="icon-circle bg-success text-white mx-auto"
                            style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                        <GraphUp size={38} />
                        </div>
                    </div>
                    <h4>Relatórios Científicos Automáticos</h4>
                    <p className="text-muted">
                        Gráficos de progresso, distribuição de diagnósticos, evolução por domínio (comunicação, social, comportamento) prontos para laudos.
                    </p>
                    </Card>
                </Col>

                {/* Card 3 */}
                <Col lg={4} md={6}>
                    <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                    <div className="mb-4">
                        <div className="icon-circle bg-info text-white mx-auto"
                            style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                        <Calendar2Check size={38} />
                        </div>
                    </div>
                    <h4>Agenda + Financeiro Integrado</h4>
                    <p className="text-muted">
                        Controle de consultas, valores, formas de pagamento, status financeiro.
                    </p>
                    </Card>
                </Col>

                {/* Card 4 */}
                <Col lg={4} md={6}>
                    <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                    <div className="mb-4">
                        <div className="icon-circle bg-warning text-white mx-auto"
                            style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                        <FileEarmarkText size={38} />
                        </div>
                    </div>
                    <h4>Prescrições e Laudos Profissionais</h4>
                    <p className="text-muted">
                        Modelos prontos com impressão otimizada para entrega aos responsáveis.
                    </p>
                    </Card>
                </Col>

                {/* Card 5 */}
                <Col lg={4} md={6}>
                    <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                    <div className="mb-4">
                        <div className="icon-circle bg-danger text-white mx-auto"
                            style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                        <Bell size={38} />
                        </div>
                    </div>
                    <h4>Notificações e Lembretes</h4>
                    <p className="text-muted">
                        Avisos automáticos para consultas, reavaliações e pendências financeiras.
                    </p>
                    </Card>
                </Col>

                {/* Card 6 - Destaque */}
                <Col lg={4} md={6}>
                    <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift border-primary position-relative">
                    <div className="position-absolute top-0 start-50 translate-middle-x bg-primary text-white px-4 py-1 rounded-pill small fw-bold">
                        MAIS VENDIDO
                    </div>
                    <div className="mb-4 pt-3">
                        <div className="icon-circle bg-purple text-white mx-auto"
                            style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6f42c1' }}>
                        <Wallet2 size={38} />
                        </div>
                    </div>
                    <h4>Planos Analisar 50 até 500</h4>
                    <p className="text-muted">
                        Até <strong>500 pacientes ativos</strong> por mês.<br />
                        Ideal para clínicas grandes e supervisores.
                    </p>
                    <Badge bg="primary" className="fs-6">A partir de R$ 297/mês</Badge>
                    </Card>
                </Col>

                </Row>
            </Container>
            </section>

            <section className="services-section py-5" id="section-services">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-bold mb-3">Plataformas Especializadas</h2>
                        <p className="lead text-muted">Soluções personalizadas para cada tipo de usuário</p>
                    </div>
                    <Row className="g-4 align-items-stretch">
                        <Col lg={4} md={6} className="mb-4">
                            <Card className="service-card h-100">
                                <Card.Img variant="top" src={pais} alt="Plataforma para Pais e Responsáveis" />
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <Heart className="text-primary me-2" size={24} />
                                        <Card.Title className="h4 mb-0">Pais e Responsáveis</Card.Title>
                                    </div>
                                    <Card.Text className="flex-grow-1">
                                        Acesse as ferramentas de monitoramento, agende consultas, visualize o progresso detalhado do seu filho e comunique-se de forma segura com a equipe de profissionais.
                                    </Card.Text>
                                    <div className="mt-auto">
                                        <Link to="/login" className="text-decoration-none">
                                            <Button variant="primary" className="w-100">
                                                Acessar Portal <ArrowRight className="ms-2" size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4} md={6} className="mb-4">
                            <Card className="service-card h-100">
                                <Card.Img variant="top" src={medicos} alt="Plataforma para Médicos e Terapeutas" />
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <Star className="text-warning me-2" size={24} />
                                        <Card.Title className="h4 mb-0">Médicos e Terapeutas</Card.Title>
                                    </div>
                                    <Card.Text className="flex-grow-1">
                                        Utilize um dashboard completo para gerenciar pacientes, adicionar colaboradores, editar informações, analisar relatórios e acessar as ferramentas de monitoramento por IA.
                                    </Card.Text>
                                    <div className="mt-auto">
                                        <Link to="/login" className="text-decoration-none">
                                            <Button variant="primary" className="w-100">
                                                Acessar Portal <ArrowRight className="ms-2" size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4} md={6} className="mb-4">
                            <Card className="service-card h-100">
                                <Card.Img variant="top" src={servicos} alt="Plataforma para Secretárias e Clínicas" />
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <Award className="text-success me-2" size={24} />
                                        <Card.Title className="h4 mb-0">Secretárias e Clínicas</Card.Title>
                                    </div>
                                    <Card.Text className="flex-grow-1">
                                        Uma plataforma dedicada para a equipe administrativa gerenciar a agenda completa do profissional, cadastrar e editar pacientes, e facilitar a comunicação da clínica.
                                    </Card.Text>
                                    <div className="mt-auto">
                                        <Link to="/login" className="text-decoration-none">
                                            <Button variant="primary" className="w-100">
                                                Acessar Portal <ArrowRight className="ms-2" size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="cta-section py-5" id="section-cta">
                <Container className="text-center">
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <h2 className="display-4 fw-bold mb-4">
                                Junte-se à Nossa Comunidade Inclusiva
                            </h2>
                            <p className="lead mb-5">
                                Faça parte da maior rede de apoio para famílias de pessoas autistas no Brasil. 
                                Conecte-se, aprenda, cresça e contribua para um mundo mais inclusivo e acolhedor.
                            </p>
                            <div className="d-flex flex-wrap justify-content-center gap-3">
                                <Link to="/signup" className="text-decoration-none">
                                    <Button variant="light" size="lg" className="px-5 py-3">
                                        <CheckCircle className="me-2" size={20} />
                                        Cadastre-se
                                    </Button>
                                </Link>
                            </div>

                        </Col>
                    </Row>
                </Container>
            </section>
        </div>
        <footer className="footer-section py-4 bg-dark text-white-50">
            <Container>
                <Row className="justify-content-between align-items-center">
                    <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
                        <p className="mb-0">
                            &copy; {new Date().getFullYear()} Nf Representacoes Comerciais e Distribuicao Ltda 45.765.916/0001-70. Todos os direitos reservados.
                        </p>
                    </Col>
                    <Col md={6} className="text-center text-md-end">
                        <p className="mb-0">
                            Contato:
                            <a href="mailto:autisconnect@gmail.com" className="text-white-50">
                                <Envelope size={16} className="me-1" /> autisconnect@gmail.com
                            </a> |
                            <Whatsapp size={16} className="me-1" />
                            <a href="https://wa.me/5581982540904" target="_blank" rel="noopener noreferrer" className="text-white-50">
                                WhatsApp: 81 98254-0904
                            </a>
                            <a href="https://www.instagram.com/autisconnect" target="_blank" rel="noopener noreferrer" className="text-white-50 ms-3">
                                <Instagram size={20} className="me-1" /> @autisconnect
                            </a>
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
        </>
    );
};

export default Home;