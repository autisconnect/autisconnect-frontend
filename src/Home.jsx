import React, { useContext, useEffect } from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Award,
    Calendar,
    Calendar2Check,
    CheckCircle,
    Envelope,
    ExclamationTriangle,
    FileEarmarkText,
    GraphUp,
    Heart,
    Instagram,
    People,
    Sliders,
    Star,
    Wallet2,
    Whatsapp,
    Youtube
} from 'react-bootstrap-icons';
import { AuthContext } from './context/AuthContext';

import logonovo from './assets/logonovo.png';
import servico1 from './assets/servico1.jpeg';
import servico2 from './assets/servico2.jpeg';
import heroImage from './assets/img1.png';
import game1Image from './assets/game1.png';
import game2Image from './assets/game2.jpg';
import game3Image from './assets/game3.png';
import game4Image from './assets/game4.png';

import './App.css';

const DEMO_URL = 'https://calendar.app.google/WYc6Lm5gzHqqir7q7';
const WHATSAPP_PHONE = '5581982540904';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;

const TRACKING_EVENTS = {
    demoClick: 'click_demonstracao',
    ecosystemClick: 'click_ecossistema',
    whatsappClick: 'click_whatsapp',
    featureClick: 'click_recurso_home',
    gameClick: 'click_game_terapeutico'
};

const seoConfig = {
    title: 'AutisConnect | Plataforma inteligente para acompanhamento TEA',
    description:
        'Plataforma inteligente para monitoramento emocional, análise de vocalizações, atividades terapêuticas, jogos inteligentes e acompanhamento de pessoas com TEA.',
    keywords:
        'plataforma para autismo, monitoramento emocional TEA, acompanhamento TEA, jogos terapêuticos autismo, atividades ABA, desenvolvimento TEA, análise de vocalizações TEA'
};

const problemCards = [
    'Emoções difíceis de monitorar',
    'Evolução pouco mensurável',
    'Falta de integração entre casa e terapia',
    'Poucos dados para tomada de decisão',
    'Informações dispersas'
];

const ecosystemFeatures = [
    {
        title: 'Monitoramento Emocional',
        description: 'Acompanhe padrões emocionais ao longo do tempo através de indicadores inteligentes.',
        icon: <Heart size={38} />,
        color: '#d9486e',
        link: '/presentation-dashboard/PresentationEmotionDetector'
    },
    {
        title: 'Análise de Vocalizações',
        description: 'Registre e acompanhe vocalizações relevantes durante o desenvolvimento.',
        icon: <FileEarmarkText size={38} />,
        color: '#2563eb',
        link: '/presentation-dashboard/PresentationTriggerRecorder'
    },
    {
        title: 'Atividades ABA',
        description: 'Planejamento, execução e acompanhamento digital das atividades.',
        icon: <Calendar2Check size={38} />,
        color: '#0f9f8f',
        link: '/presentation-dashboard/PresentationPatientDetails'
    },
    {
        title: 'Games Terapêuticos',
        description: 'Jogos desenvolvidos para estimular habilidades cognitivas, emocionais e comportamentais.',
        icon: <Star size={38} />,
        color: '#7c3aed',
        link: '#games-terapeuticos'
    },
    {
        title: 'Inteligência de Dados',
        description: 'Transforme registros em informações visuais para apoiar decisões.',
        icon: <GraphUp size={38} />,
        color: '#f97316',
        link: '/PresentationProfessionalDashboard'
    }
];

const games = [
    {
        title: 'Reconhecimento de Emoções',
        image: game1Image,
        benefit: 'Estimula percepção emocional e identificação de expressões.',
        objective: 'Associar sentimentos, expressões e respostas sociais.'
    },
    {
        title: 'Rotinas e Autonomia',
        image: game2Image,
        benefit: 'Apoia organização de tarefas e previsibilidade do dia a dia.',
        objective: 'Sequenciar atividades e fortalecer autonomia funcional.'
    },
    {
        title: 'Planejamento e Flexibilidade',
        image: game3Image,
        benefit: 'Trabalha funções executivas, memória e adaptação a mudanças.',
        objective: 'Planejar etapas, inibir impulsos e ajustar estratégias.'
    },
    {
        title: 'Histórias e Contexto Social',
        image: game4Image,
        benefit: 'Apoia compreensão de situações sociais e autorregulação.',
        objective: 'Interpretar contextos, escolhas e comportamentos esperados.'
    }
];

const emotionalInsights = ['Linha do tempo emocional', 'Indicadores', 'Tendências', 'Alertas', 'Insights'];

const professionalBenefits = [
    'Monitoramento contínuo',
    'Dados centralizados',
    'Comunicação com famílias',
    'Relatórios visuais',
    'Apoio à tomada de decisão'
];

const familyBenefits = [
    'Acompanhar evolução',
    'Registrar acontecimentos importantes',
    'Visualizar indicadores',
    'Interagir com atividades',
    'Participar do processo terapêutico'
];

const managementTools = [
    { title: 'Agenda', icon: <Calendar size={28} /> },
    { title: 'Pacientes', icon: <People size={28} /> },
    { title: 'Financeiro', icon: <Wallet2 size={28} /> },
    { title: 'Relatórios', icon: <GraphUp size={28} /> },
    { title: 'Portal dos Pais', icon: <Sliders size={28} /> }
];

const proofItems = [
    'Startup incubada pelo Porto Digital.',
    'Mais de 50 entrevistas realizadas com profissionais e famílias.',
    'Plataforma desenvolvida especificamente para o ecossistema TEA.',
    'Preparada para clínicas, profissionais e famílias.'
];

const updateMetaTag = (selector, attribute, value) => {
    let element = document.head.querySelector(selector);

    if (!element) {
        element = document.createElement('meta');
        const match = selector.match(/\[(name|property)="(.+)"\]/);
        if (match) {
            element.setAttribute(match[1], match[2]);
        }
        document.head.appendChild(element);
    }

    element.setAttribute(attribute, value);
};

const trackEvent = (eventName, eventData = {}) => {
    if (typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...eventData });

    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventData);
    }

    if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', eventName, eventData);
    }
};

const getWhatsAppUrl = (message = 'Olá! Quero falar com um especialista sobre o AutisConnect.') =>
    `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;

const Home = () => {
    const { loading } = useContext(AuthContext);

    useEffect(() => {
        document.title = seoConfig.title;
        updateMetaTag('meta[name="description"]', 'content', seoConfig.description);
        updateMetaTag('meta[name="keywords"]', 'content', seoConfig.keywords);
        updateMetaTag('meta[property="og:title"]', 'content', seoConfig.title);
        updateMetaTag('meta[property="og:description"]', 'content', seoConfig.description);
        updateMetaTag('meta[property="og:type"]', 'content', 'website');

        const schemaId = 'autisconnect-home-schema';
        let schemaScript = document.getElementById(schemaId);
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = schemaId;
            schemaScript.type = 'application/ld+json';
            document.head.appendChild(schemaScript);
        }

        schemaScript.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'AutisConnect',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'Web',
            description: seoConfig.description,
            keywords: seoConfig.keywords
        });
    }, []);

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
            <nav className="top-bar fixed-top shadow-sm autis-home-nav">
                <Container>
                    <Row className="align-items-center gy-3 py-3">
                        <Col lg={3} md={4} className="text-center text-md-start">
                            <img src={logonovo} alt="AutisConnect" className="top-bar-logo" />
                        </Col>
                        <Col lg={9} md={8}>
                            <div className="autis-home-nav__actions">
                                <a href="#ecossistema" className="autis-home-nav__link">Ecossistema</a>
                                <a href="#games-terapeuticos" className="autis-home-nav__link">Games</a>
                                <a href="#monitoramento-emocional" className="autis-home-nav__link">Monitoramento</a>
                                <a href="#gestao-integrada" className="autis-home-nav__link">Gestão</a>
                                <a
                                    href={DEMO_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-decoration-none"
                                    onClick={() => trackEvent(TRACKING_EVENTS.demoClick, { location: 'nav' })}
                                >
                                    <Button variant="light" size="md" className="px-4 py-2">
                                        Agendar Demonstração
                                    </Button>
                                </a>
                                <Link
                                    to="/login"
                                    className="text-decoration-none"
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('user');
                                    }}
                                >
                                    <Button variant="outline-light" size="md" className="px-4 py-2">
                                        Fazer Login
                                    </Button>
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </nav>

            <main className="home-page landing-home autisconnect-intelligence-home">
                <section
                    className="landing-hero intelligence-hero"
                    style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 25, 43, 0.92), rgba(8, 25, 43, 0.72), rgba(8, 25, 43, 0.38)), url(${heroImage})` }}
                >
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={8} xl={7}>
                                <p className="intelligence-hero__kicker">Plataforma Inteligente para Monitoramento, Desenvolvimento e Acompanhamento de Pessoas com TEA.</p>
                                <h1>Tecnologia para compreender, monitorar e apoiar a evolução de pessoas com TEA.</h1>
                                <p className="landing-hero__subtitle">
                                    Monitoramento emocional, análise de vocalizações, atividades terapêuticas, jogos inteligentes e gestão integrada em uma única plataforma.
                                </p>
                                <div className="landing-hero__actions">
                                    <a
                                        href={DEMO_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => trackEvent(TRACKING_EVENTS.demoClick, { location: 'hero' })}
                                    >
                                        <Button variant="light" size="lg">
                                            Agendar Demonstração <ArrowRight size={18} />
                                        </Button>
                                    </a>
                                    <a
                                        href="#ecossistema"
                                        onClick={() => trackEvent(TRACKING_EVENTS.ecosystemClick, { location: 'hero' })}
                                    >
                                        <Button variant="outline-light" size="lg">
                                            Conhecer o Ecossistema AutisConnect
                                        </Button>
                                    </a>
                                </div>
                                <div className="intelligence-hero__signals">
                                    <span><strong>Dashboard emocional</strong><small>padrões e alertas</small></span>
                                    <span><strong>Gráficos de evolução</strong><small>desenvolvimento ao longo do tempo</small></span>
                                    <span><strong>Indicadores clínicos</strong><small>apoio à decisão</small></span>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section intelligence-problem">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={5}>
                                <span className="landing-section__label">Problema</span>
                                <h2>Os maiores desafios não estão na agenda.</h2>
                                <p>
                                    Profissionais e famílias enfrentam dificuldades para acompanhar emoções, comportamentos, vocalizações e evolução terapêutica ao longo do tempo.
                                </p>
                                <p>
                                    Grande parte dessas informações permanece subjetiva, dificultando decisões mais assertivas.
                                </p>
                            </Col>
                            <Col lg={7}>
                                <Row className="g-3">
                                    {problemCards.map((problem) => (
                                        <Col md={6} key={problem}>
                                            <Card className="landing-card landing-pain-card h-100">
                                                <Card.Body>
                                                    <ExclamationTriangle size={24} />
                                                    <strong>{problem}</strong>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section bg-white" id="ecossistema">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Diferencial AutisConnect</span>
                            <h2>Transformando sinais em informações.</h2>
                            <p>O AutisConnect ajuda profissionais e famílias a identificar padrões que normalmente passariam despercebidos.</p>
                        </div>
                        <Row className="g-4 justify-content-center">
                            {ecosystemFeatures.map((feature) => (
                                <Col key={feature.title} lg={4} md={6}>
                                    <Card className="landing-card landing-feature-card intelligence-feature-card h-100">
                                        <Card.Body>
                                            <div className="landing-feature-card__icon" style={{ color: feature.color }}>
                                                {feature.icon}
                                            </div>
                                            <h3>{feature.title}</h3>
                                            <p>{feature.description}</p>
                                            {feature.link.startsWith('#') ? (
                                                <a
                                                    href={feature.link}
                                                    onClick={() => trackEvent(TRACKING_EVENTS.featureClick, { feature: feature.title })}
                                                >
                                                    Conhecer recurso <ArrowRight size={16} />
                                                </a>
                                            ) : (
                                                <Link
                                                    to={feature.link}
                                                    onClick={() => trackEvent(TRACKING_EVENTS.featureClick, { feature: feature.title })}
                                                >
                                                    Conhecer recurso <ArrowRight size={16} />
                                                </Link>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                <section className="landing-section intelligence-games" id="games-terapeuticos">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Games Terapêuticos</span>
                            <h2>Aprender também pode ser divertido.</h2>
                            <p>Jogos digitais com foco em habilidades cognitivas, emocionais e comportamentais.</p>
                        </div>
                        <Row className="g-4">
                            {games.map((game) => (
                                <Col key={game.title} lg={3} md={6}>
                                    <Card className="landing-card intelligence-game-card h-100">
                                        <div className="intelligence-game-card__image">
                                            <Card.Img src={game.image} alt={game.title} />
                                        </div>
                                        <Card.Body>
                                            <h3>{game.title}</h3>
                                            <p>{game.benefit}</p>
                                            <div className="intelligence-game-card__objective">
                                                <span>Objetivo comportamental</span>
                                                <strong>{game.objective}</strong>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                <section className="landing-section landing-emotional intelligence-emotional" id="monitoramento-emocional">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={6}>
                                <span className="landing-section__label">Monitoramento Emocional</span>
                                <h2>O diferencial que torna o AutisConnect único.</h2>
                                <p className="intelligence-emotional__quote">
                                    Quando emoções se tornam dados, decisões se tornam mais seguras.
                                </p>
                                <p>
                                    Acompanhe sinais emocionais, visualize tendências e transforme registros em insights para apoiar intervenções mais contextualizadas.
                                </p>
                                <div className="landing-emotional__grid">
                                    {emotionalInsights.map((signal) => (
                                        <span key={signal}><Star size={16} /> {signal}</span>
                                    ))}
                                </div>
                            </Col>
                            <Col lg={6}>
                                <div className="landing-emotional__panel intelligence-emotional__panel">
                                    <div className="landing-emotional__timeline">
                                        <span>Semana 1</span>
                                        <div><i style={{ width: '52%' }} /></div>
                                        <strong>Base</strong>
                                    </div>
                                    <div className="landing-emotional__timeline">
                                        <span>Semana 2</span>
                                        <div><i style={{ width: '71%' }} /></div>
                                        <strong>Atenção</strong>
                                    </div>
                                    <div className="landing-emotional__timeline">
                                        <span>Semana 3</span>
                                        <div><i style={{ width: '48%' }} /></div>
                                        <strong>Regulação</strong>
                                    </div>
                                    <div className="intelligence-emotional__insight-grid">
                                        <span><strong>Alertas</strong><small>mudanças relevantes</small></span>
                                        <span><strong>Insights</strong><small>padrões recorrentes</small></span>
                                        <span><strong>Tendências</strong><small>evolução longitudinal</small></span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section bg-white intelligence-audience">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={5}>
                                <img src={servico2} alt="Profissional analisando indicadores" className="intelligence-audience__image" />
                            </Col>
                            <Col lg={7}>
                                <span className="landing-section__label">Para Profissionais</span>
                                <h2>Mais do que gestão.</h2>
                                <p>
                                    Tenha acesso a ferramentas que ajudam a compreender o desenvolvimento dos seus pacientes de forma mais ampla e estruturada.
                                </p>
                                <Row className="g-3">
                                    {professionalBenefits.map((benefit) => (
                                        <Col md={6} key={benefit}>
                                            <div className="landing-benefit-item">
                                                <CheckCircle size={22} />
                                                <span>{benefit}</span>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section intelligence-family">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={7}>
                                <span className="landing-section__label">Para Famílias</span>
                                <h2>Participação ativa no desenvolvimento.</h2>
                                <p>
                                    Famílias deixam de acompanhar apenas por relatos soltos e passam a participar do processo com registros, indicadores e atividades conectadas.
                                </p>
                                <Row className="g-3">
                                    {familyBenefits.map((benefit) => (
                                        <Col md={6} key={benefit}>
                                            <div className="landing-benefit-item">
                                                <CheckCircle size={22} />
                                                <span>{benefit}</span>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                            <Col lg={5}>
                                <img src={servico1} alt="Família acompanhando desenvolvimento" className="intelligence-audience__image" />
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section bg-white" id="gestao-integrada">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Gestão Clínica</span>
                            <h2>Tudo isso com a gestão integrada que sua operação precisa.</h2>
                            <p>A gestão continua disponível como base operacional para organizar rotinas, equipes e relacionamento com famílias.</p>
                        </div>
                        <Row className="g-3 justify-content-center">
                            {managementTools.map((tool) => (
                                <Col key={tool.title} lg={2} md={4} sm={6}>
                                    <div className="intelligence-management-item">
                                        {tool.icon}
                                        <strong>{tool.title}</strong>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                <section className="landing-section landing-proof">
                    <Container>
                        <Row className="align-items-center g-4">
                            <Col lg={5}>
                                <span className="landing-section__label">Prova social</span>
                                <h2>Desenvolvido para o ecossistema TEA.</h2>
                                <p>Uma plataforma criada a partir de escuta, tecnologia e foco no desenvolvimento humano.</p>
                            </Col>
                            <Col lg={7}>
                                <Row className="g-3">
                                    {proofItems.map((item, index) => (
                                        <Col md={6} key={item}>
                                            <Card className="landing-card h-100">
                                                <Card.Body>
                                                    {index === 0 ? <Award size={34} /> : <People size={34} />}
                                                    <p>{item}</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-final-cta intelligence-final-cta">
                    <Container>
                        <h2>O futuro do acompanhamento TEA será orientado por dados.</h2>
                        <p>
                            Conheça como o AutisConnect está transformando emoções, comportamentos e interações em informações que apoiam o desenvolvimento de pessoas com TEA.
                        </p>
                        <div className="landing-final-cta__actions">
                            <a
                                href={DEMO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEvent(TRACKING_EVENTS.demoClick, { location: 'final_cta' })}
                            >
                                <Button variant="light" size="lg">Agendar Demonstração</Button>
                            </a>
                            <a
                                href={getWhatsAppUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEvent(TRACKING_EVENTS.whatsappClick, { location: 'final_cta' })}
                            >
                                <Button variant="outline-light" size="lg"><Whatsapp size={18} /> Falar com Especialista</Button>
                            </a>
                        </div>
                    </Container>
                </section>
            </main>

            <footer className="footer-section py-5">
                <Container>
                    <Row className="justify-content-between align-items-center text-center text-md-start">
                        <Col md={4} className="mb-4 mb-md-0 footer-left">
                            <p className="mb-0">
                                {'\u00a9'} {new Date().getFullYear()} Nf Representações Comerciais Ltda.<br />
                                <small>Todos os direitos reservados.</small>
                            </p>
                        </Col>
                        <Col md={4} className="mb-4 mb-md-0 text-center">
                            <img src={logonovo} alt="AutisConnect" className="footer-logo" />
                        </Col>
                        <Col md={4} className="text-md-end text-white-50">
                            <p className="mb-0">
                                <strong>Contato:</strong><br />
                                <a href="mailto:autisconnect@gmail.com" className="text-white-50 d-inline-flex align-items-center mb-1">
                                    <Envelope size={16} className="me-2" /> autisconnect@gmail.com
                                </a>
                                <br />
                                <a
                                    href={WHATSAPP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white-50 d-inline-flex align-items-center mb-1"
                                    onClick={() => trackEvent(TRACKING_EVENTS.whatsappClick, { location: 'footer' })}
                                >
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
