import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Award, People, Heart, Calendar, ChatDots, CheckCircle, PersonVideo, Mic, Sliders } from 'react-bootstrap-icons';
import logohori from './assets/logo.png';
import pais from './assets/pais.png';
import medicos from './assets/medicos.png';
import servicos from './assets/servicos.png';
//import './App.css';

const Home = () => {
    const [showWelcome, setShowWelcome] = useState(false);
    const [isVisible, setIsVisible] = useState({});

    const [testimonials] = useState([
        {
            id: 1,
            name: "Maria Silva",
            role: "Mãe de criança autista",
            text: "O AutisConnect transformou nossa rotina. Conseguimos encontrar profissionais especializados e acompanhar o progresso do meu filho de forma simples e eficiente. A plataforma nos deu esperança e direcionamento.",
            rating: 5,
            location: "São Paulo, SP"
        },
        {
            id: 2,
            name: "Dr. Carlos Mendes",
            role: "Neurologista Pediátrico",
            text: "Como profissional, a plataforma me permite acompanhar meus pacientes remotamente e colaborar com outros especialistas. A ferramenta de detecção de emoções é revolucionária e tem ajudado muito no diagnóstico.",
            rating: 5,
            location: "Rio de Janeiro, RJ"
        },
        {
            id: 3,
            name: "Restaurante Inclusivo Sabores",
            role: "Serviço Local Parceiro",
            text: "Desde que nos cadastramos no AutisConnect, recebemos treinamento especializado e aumentamos significativamente nosso atendimento a famílias com crianças autistas. Uma parceria que beneficia a todos.",
            rating: 5,
            location: "Belo Horizonte, MG"
        },
        {
            id: 4,
            name: "Ana Paula Rodrigues",
            role: "Terapeuta Ocupacional",
            text: "A integração entre profissionais na plataforma facilita muito o trabalho multidisciplinar. Posso acompanhar o progresso dos pacientes em tempo real e ajustar as terapias conforme necessário.",
            rating: 5,
            location: "Porto Alegre, RS"
        }
    ]);

    const [stats, setStats] = useState({
        families: 0,
        professionals: 0,
        services: 0,
        successStories: 0
    });

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
        {
            id: 5,
            title: "Detector de Estereotipias",
            description: "Utilize a webcam para monitorar e registrar a frequência e duração de comportamentos repetitivos, como balançar o corpo ou movimentos de mãos.",
            icon: <PersonVideo className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationStereotypyMonitor",
            color: "#1abc9c"
        },
        {
            id: 6,
            title: "Gestão para Secretárias",
            description: "Uma plataforma dedicada para secretárias e administradores de clínicas gerenciarem agendamentos, pacientes e a comunicação para múltiplos profissionais.",
            icon: <Calendar className="feature-icon" size={40} />,
            link: "/presentation-dashboard/PresentationSecretaryDashboard",
            color: "#e67e22"
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

    // Animação de contadores
    useEffect(() => {
        const timer = setTimeout(() => setShowWelcome(true), 1000);

        const statsInterval = setInterval(() => {
            setStats(prev => ({
                families: Math.min(prev.families + 12, 1450),
                professionals: Math.min(prev.professionals + 6, 520),
                services: Math.min(prev.services + 3, 240),
                successStories: Math.min(prev.successStories + 4, 380)
            }));
        }, 50);

        // Cleanup
        return () => {
            clearTimeout(timer);
            clearInterval(statsInterval);
        };
    }, []);

    // Intersection Observer para animações
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(prev => ({
                            ...prev,
                            [entry.target.id]: true
                        }));
                    }
                });
            },
            { threshold: 0.1 }
        );

        const sections = document.querySelectorAll('[id^="section-"]');
        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-page">
            {/* Hero Section */}
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
                                    <Link to="/signup" className="text-decoration-none">
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

                                {/* Benefícios rápidos */}
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

            {/* Seção de Estatísticas */}
            <section className="stats-section py-5" id="section-stats">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-bold mb-3">Nosso Impacto em Números</h2>
                        <p className="lead text-muted">Veja como estamos transformando vidas e construindo uma comunidade mais inclusiva</p>
                    </div>
                    <Row className="g-4">
                        <Col lg={3} md={6} className="mb-4">
                            <div className="stat-item text-center">
                                <div className="stat-number">{stats.families.toLocaleString()}+</div>
                                <p className="stat-label">Famílias Conectadas</p>
                                <small className="text-muted">Famílias que encontraram suporte e orientação</small>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-4">
                            <div className="stat-item text-center">
                                <div className="stat-number">{stats.professionals.toLocaleString()}+</div>
                                <p className="stat-label">Profissionais Especializados</p>
                                <small className="text-muted">Médicos, terapeutas e especialistas cadastrados</small>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-4">
                            <div className="stat-item text-center">
                                <div className="stat-number">{stats.services.toLocaleString()}+</div>
                                <p className="stat-label">Serviços Inclusivos</p>
                                <small className="text-muted">Estabelecimentos certificados e parceiros</small>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-4">
                            <div className="stat-item text-center">
                                <div className="stat-number">{stats.successStories.toLocaleString()}+</div>
                                <p className="stat-label">Histórias de Sucesso</p>
                                <small className="text-muted">Casos de sucesso documentados</small>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Seção de Recursos */}
            <section className="features-section py-5" id="section-features">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-bold mb-3">Recursos Exclusivos e Inovadores</h2>
                        <p className="lead text-muted">Tecnologia de ponta a serviço da inclusão e do desenvolvimento</p>
                    </div>
                    <Row className="g-4">
                        {features.map((feature, index) => (
                            <Col lg={4} md={6} className="mb-4" key={feature.id}>
                                <Card className="feature-card h-100">
                                    <Card.Body className="text-center">
                                        <div className="feature-icon-wrapper mb-3" style={{ background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}25 100%)` }}>
                                            <div style={{ color: feature.color }}>
                                                {feature.icon}
                                            </div>
                                        </div>
                                        <Card.Title className="h4 mb-3">{feature.title}</Card.Title>
                                        <Card.Text className="text-muted mb-4">{feature.description}</Card.Text>
                                        <Link to={feature.link} className="text-decoration-none">
                                            <Button variant="outline-primary" className="w-100">
                                                Explorar Recurso <ArrowRight className="ms-2" size={16} />
                                            </Button>
                                        </Link>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>


            {/* Seção de Serviços */}
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

            {/* Seção de Depoimentos */}
            <section className="testimonials-section py-5" id="section-testimonials">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-bold mb-3">Histórias Reais de Transformação</h2>
                        <p className="lead text-muted">Veja como o AutisConnect está mudando vidas em todo o Brasil</p>
                    </div>
                    <Carousel indicators controls interval={6000} className="testimonial-carousel">
                        {testimonials.map(testimonial => (
                            <Carousel.Item key={testimonial.id}>
                                <Card className="testimonial-card mx-auto">
                                    <Card.Body>
                                        <div className="testimonial-rating mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    fill={i < testimonial.rating ? "#FFD700" : "none"}
                                                    color={i < testimonial.rating ? "#FFD700" : "#e4e5e9"}
                                                    className="me-1"
                                                    size={24}
                                                />
                                            ))}
                                        </div>
                                        <Card.Text className="mb-4 fs-5">
                                            "{testimonial.text}"
                                        </Card.Text>
                                        <div className="d-flex flex-column align-items-center">
                                            <Card.Subtitle className="fw-bold text-primary mb-1">
                                                {testimonial.name}
                                            </Card.Subtitle>
                                            <small className="text-muted mb-1">{testimonial.role}</small>
                                            <small className="text-muted">{testimonial.location}</small>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </Container>
            </section>

            {/* Call to Action */}
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
                            <div className="mt-4">
                                <small className="text-white-50">
                                    Nrmendfsystems
                                </small>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </div>
    );
};

export default Home;

