import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// ÍCONES
import {
    ArrowRight,
    Star,
    Award,
    People,
    Heart,
    Calendar,
    GraphUp,
    Calendar2Check,
    Wallet2,
    Bell,
    CheckCircle,
    Sliders,
    Instagram,
    Whatsapp,
    Envelope,
    ExclamationTriangle,
    FileEarmarkText,
    Youtube,
    ArrowLeft
} from 'react-bootstrap-icons';

import logonovo from './assets/logonovo.png';
import servico1 from './assets/servico1.jpeg';
import servico2 from './assets/servico2.jpeg';
import servico3 from './assets/servico3.jpeg';

// Imagens do Hero Banner
import img1 from './assets/img1.png';
import img2 from './assets/img2.png';
import img3 from './assets/img3.png';
import img4 from './assets/img4.png';

import './App.css';

const Home = () => {
    const { loading } = useContext(AuthContext);

    const [features] = useState([
        {
            id: 1,
            title: "Monitoramento de Emoções",
            description: "Tecnologia avançada de inteligência artificial para detectar e analisar expressões faciais em tempo real, ajudando a compreender melhor as emoções não verbalizadas e facilitando a comunicação.",
            icon: <Heart className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationEmotionDetector",
            color: "#e74c3c"
        },
        {
            id: 2,
            title: "Avaliação de Risco de AVC",
            description: "Ferramenta inovadora que utiliza análise de assimetrias faciais para identificar possíveis sinais de alerta precoces para AVC, proporcionando intervenção rápida e eficaz.",
            icon: <ExclamationTriangle className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationStrokeRiskMonitor",
            color: "#f39c12"
        },
        {
            id: 3,
            title: "Dashboard Profissional",
            description: "Gerencie pacientes, colaboradores, finanças e consultas em um só lugar. Relatórios clínicos, ferramentas de IA e visão completa da sua prática com apenas alguns cliques.",
            icon: <Sliders className="feature-icon" size={40} />,
            link: "/PresentationProfessionalDashboard",
            color: "#3498db"
        },
        {
            id: 4,
            title: "Portal dos Pais",
            description: "Acompanhe o desenvolvimento da sua criança, agende consultas, converse com médicos, acesse jogos educativos e encontre serviços inclusivos — tudo em um só lugar seguro e intuitivo.",
            icon: <People className="feature-icon" size={40} />,
            link: "/PresentationParentDashboard",
            color: "#9b59b6"
        },
        {
            id: 5,
            title: "Gestão para Secretárias",
            description: "Centralize agendamentos, cadastre pacientes, visualize relatórios de desempenho e organize toda a rotina administrativa da clínica com uma plataforma simples e poderosa.",
            icon: <Calendar className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationSecretaryDashboard",
            color: "#1abc9c"
        },
        {
            id: 6,
            title: "Detalhes do Paciente",
            description: "Acompanhe evolução clínica completa, gráficos de progresso, prescrições, consultas e análises de IA em um só lugar.",
            icon: <GraphUp className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationPatientDetails",
            color: "#e67e22"
        }
    ]);

    // ==================== HERO BANNER ====================
    const [currentSlide, setCurrentSlide] = useState(0);

    const bannerSlides = [
        { id: 1, image: img1, showButton: true,  buttonLink: "https://calendar.app.google/WYc6Lm5gzHqqir7q7" },
        { id: 2, image: img2, showButton: false, buttonLink: "" },
        { id: 3, image: img3, showButton: false, buttonLink: "" },
        { id: 4, image: img4, showButton: false, buttonLink: "" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    const goToSlide = (index) => setCurrentSlide(index);

    const currentBanner = bannerSlides[currentSlide];

    if (loading) {
        return (
            <Container className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </div>
            </Container>
        );
    }

    return (
        <>
            {/* BARRA FIXA NO TOPO */}
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={7} className="text-center text-md-start">
                            <img 
                                src={logonovo} 
                                alt="AutisConnect" 
                                className="top-bar-logo" 
                                style={{ maxHeight: '55px' }}
                            />
                        </Col>
                        <Col md={5} className="text-center text-md-end">
                            <div className="d-flex justify-content-center justify-content-md-end gap-3">
                                <Link to="/signup" className="text-decoration-none">
                                    <Button variant="light" size="md" className="px-4 py-2">
                                        <CheckCircle className="me-2" size={18} /> Cadastre-se
                                    </Button>
                                </Link>
                                <Link to="/login" className="text-decoration-none"
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('user');
                                    }}
                                >
                                    <Button variant="outline-light" size="md" className="px-4 py-2">
                                        <ArrowRight className="me-2" size={18} /> Fazer Login
                                    </Button>
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </nav>

            <div className="home-page" style={{ paddingTop: '85px' }}>

                {/* HERO CURTA */}
                <section className="hero-section hero-short" id="section-hero">
                    <Container>
                        <Row className="align-items-center py-5">
                            <Col lg={6} className="mb-5 mb-lg-0">
                                <div className="hero-content-box p-5 rounded-4">
                                    <h1 className="display-4 fw-bold mb-4 text-white">
                                        Bem-vindo ao <span className="text-gradient">AutisConnect</span>
                                    </h1>
                                    <p className="lead mb-4 text-white-90">
                                        A plataforma mais completa para conectar famílias de pessoas autistas a profissionais especializados e serviços inclusivos.
                                    </p>
                                </div>
                            </Col>
                            <Col lg={6} className="text-center">
                                <img 
                                    src={logonovo} 
                                    alt="AutisConnect" 
                                    className="img-fluid hero-logo" 
                                    style={{ maxHeight: '320px' }}
                                />
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* HERO BANNER */}
                <section className="hero-banner position-relative overflow-hidden">
                    <div className="banner-slide">
                        <img 
                            src={currentBanner.image} 
                            alt={`Banner ${currentBanner.id}`} 
                            className="banner-image" 
                        />

                        {currentBanner.showButton && (
                            <div className="banner-button-container">
                                <a 
                                    href={currentBanner.buttonLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="light" size="lg" className="px-5 py-3 fw-bold shadow">
                                        Agendar Demonstração
                                    </Button>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Setas */}
                    <button onClick={prevSlide} className="banner-nav banner-nav-left">
                        <ArrowLeft size={28} />
                    </button>
                    <button onClick={nextSlide} className="banner-nav banner-nav-right">
                        <ArrowRight size={28} />
                    </button>

                    {/* Indicadores */}
                    <div className="banner-indicators">
                        {bannerSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </section>

                {/* ==================== RECURSOS EXCLUSIVOS ==================== */}
                <section className="features-inovadoras py-5 bg-white" id="section-features">
                    <Container>
                        <div className="text-center mb-5">
                            <h2 className="display-4 fw-bold mb-3">Recursos Exclusivos e Inovadores</h2>
                            <p className="lead text-muted">Tecnologia de ponta a serviço da inclusão e do desenvolvimento</p>
                        </div>

                        <Row className="g-5 justify-content-center">
                            {features.map((feature) => (
                                <Col key={feature.id} lg={4} md={6}>
                                    <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift position-relative overflow-hidden">
                                        <div className="position-absolute start-0 top-0 bottom-0" style={{ width: '8px', backgroundColor: feature.color, borderRadius: '8px 0 0 8px' }} />
                                        <div className="mb-4">
                                            <div className="icon-circle text-white mx-auto d-flex align-items-center justify-content-center shadow-lg"
                                                style={{ width: '90px', height: '90px', borderRadius: '50%', background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)` }}>
                                                {React.cloneElement(feature.icon, { size: 42 })}
                                            </div>
                                        </div>
                                        <h4 className="fw-bold mb-3">{feature.title}</h4>
                                        <p className="text-muted small lh-lg">{feature.description}</p>
                                        <Link to={feature.link}>
                                            <Button variant="outline-primary" size="sm" className="mt-3">
                                                Explorar Recurso <ArrowRight className="ms-2" size={16} />
                                            </Button>
                                        </Link>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                {/* ==================== PROFISSIONAIS E CLÍNICAS ==================== */}
                <section className="py-5" style={{ backgroundColor: '#f0f5ff' }}>
                    <Container>
                        <div className="text-center mb-5">
                            <h2 className="display-5 fw-bold mb-4">
                                Feito para <span className="text-primary">Profissionais e Clínicas</span> que Transformam Vidas
                            </h2>
                            <p className="lead text-muted col-lg-9 mx-auto">
                                Controle total de pacientes, relatórios científicos automáticos, agenda e financeiro em um só lugar.
                            </p>
                            <div className="mt-4">
                                <h3 className="display-6 fw-bold text-primary">
                                    A partir de apenas <span className="text-dark">R$ 139,90/mês</span>
                                </h3>
                                <p className="text-muted fs-5">Plano Analisar 50 – o mais escolhido</p>
                            </div>
                        </div>

                        <Row className="g-5 justify-content-center">
                            {/* Seus 6 cards aqui - mantidos iguais */}
                            {/* ... (você pode colar seus cards originais aqui) ... */}
                        </Row>
                    </Container>
                </section>

                {/* ==================== AGENDE DEMONSTRAÇÃO ==================== */}
                <section className="demo-section py-5" id="section-services">
                    <Container>
                        <div className="text-center mb-5">
                            <h2 className="display-4 fw-bold mb-3">Agende uma Demonstração Exclusiva</h2>
                            <p className="lead text-muted col-lg-8 mx-auto">
                                Escolha o perfil que melhor representa você e agende um atendimento individualizado.
                            </p>
                        </div>

                        <Row className="g-4 justify-content-center">
                            <Col lg={4} md={6}>
                                <Card className="demo-card h-100 shadow-sm border-0 overflow-hidden">
                                    <div className="image-container">
                                        <Card.Img variant="top" src={servico1} alt="Pais e Responsáveis" />
                                    </div>
                                    <Card.Body className="d-flex flex-column p-4">
                                        <Card.Title className="fw-bold mb-3">Pais e Responsáveis</Card.Title>
                                        <Card.Text className="flex-grow-1 text-muted">
                                            Acompanhe o desenvolvimento do seu filho e descubra como a plataforma pode ajudar.
                                        </Card.Text>
                                        <a href="https://calendar.app.google/WYc6Lm5gzHqqir7q7" target="_blank" rel="noopener noreferrer" className="mt-auto">
                                            <Button variant="primary" className="w-100">
                                                Agendar Demonstração <ArrowRight className="ms-2" size={18} />
                                            </Button>
                                        </a>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4} md={6}>
                                <Card className="demo-card h-100 shadow-sm border-0 overflow-hidden">
                                    <div className="image-container">
                                        <Card.Img variant="top" src={servico2} alt="Profissionais da Área" />
                                    </div>
                                    <Card.Body className="d-flex flex-column p-4">
                                        <Card.Title className="fw-bold mb-3">Profissionais da Área</Card.Title>
                                        <Card.Text className="flex-grow-1 text-muted">
                                            Conheça o dashboard completo com ferramentas de IA e gestão de pacientes.
                                        </Card.Text>
                                        <a href="https://calendar.app.google/WYc6Lm5gzHqqir7q7" target="_blank" rel="noopener noreferrer" className="mt-auto">
                                            <Button variant="primary" className="w-100">
                                                Agendar Demonstração <ArrowRight className="ms-2" size={18} />
                                            </Button>
                                        </a>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4} md={6}>
                                <Card className="demo-card h-100 shadow-sm border-0 overflow-hidden">
                                    <div className="image-container">
                                        <Card.Img variant="top" src={servico3} alt="Serviços e Rede TEA" />
                                    </div>
                                    <Card.Body className="d-flex flex-column p-4">
                                        <Card.Title className="fw-bold mb-3">Serviços e Rede TEA</Card.Title>
                                        <Card.Text className="flex-grow-1 text-muted">
                                            Integre sua clínica ou serviço à maior rede de apoio para o TEA.
                                        </Card.Text>
                                        <a href="https://calendar.app.google/WYc6Lm5gzHqqir7q7" target="_blank" rel="noopener noreferrer" className="mt-auto">
                                            <Button variant="primary" className="w-100">
                                                Agendar Demonstração <ArrowRight className="ms-2" size={18} />
                                            </Button>
                                        </a>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* CTA Final */}
                <section className="cta-section py-5 bg-primary text-white text-center">
                    <Container>
                        <h2 className="display-4 fw-bold mb-4">Junte-se à Nossa Comunidade Inclusiva</h2>
                        <p className="lead mb-5 col-lg-8 mx-auto">
                            Faça parte da maior rede de apoio para famílias de pessoas autistas no Brasil.
                        </p>
                        <Link to="/signup">
                            <Button variant="light" size="lg" className="px-5">
                                <CheckCircle className="me-2" size={20} /> Cadastre-se Agora
                            </Button>
                        </Link>
                    </Container>
                </section>

            </div>

            {/* RODAPÉ */}
            <footer className="footer-section py-5 bg-dark text-white-50">
                <Container>
                    <Row className="justify-content-between align-items-center text-center text-md-start">
                        <Col md={5} className="mb-4 mb-md-0">
                            <p className="mb-0">
                                © {new Date().getFullYear()} Nf Representações Comerciais Ltda.<br />
                                <small>Todos os direitos reservados.</small>
                            </p>
                        </Col>

                        <Col md={5} className="text-md-end">
                            <p className="mb-0">
                                <strong>Contato:</strong><br />
                                <a href="mailto:autisconnect@gmail.com" className="text-white-50 d-inline-flex align-items-center mb-1">
                                    <Envelope size={16} className="me-2" /> autisconnect@gmail.com
                                </a>
                                <br />
                                <a href="https://wa.me/5581982540904" target="_blank" rel="noopener noreferrer" className="text-white-50 d-inline-flex align-items-center mb-1">
                                    <Whatsapp size={16} className="me-2" /> WhatsApp: 81 98254-0904
                                </a>
                                <br />
                                <a href="https://instagram.com/autisconnect" target="_blank" rel="noopener noreferrer" className="text-white-50 d-inline-flex align-items-center mb-1">
                                    <Instagram size={18} className="me-2" /> @autisconnect
                                </a>
                                <br />
                                <a href="https://youtube.com/@autisconnect" target="_blank" rel="noopener noreferrer" className="text-white-50 d-inline-flex align-items-center">
                                    <Youtube size={18} className="me-2" /> YouTube: @autisconnect
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