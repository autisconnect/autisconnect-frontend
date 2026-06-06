import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
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
    Whatsapp,
    Youtube
} from 'react-bootstrap-icons';
import { AuthContext } from './context/AuthContext';

import logonovo from './assets/logonovo.png';
import servico1 from './assets/servico1.jpeg';
import servico2 from './assets/servico2.jpeg';
import servico3 from './assets/servico3.jpeg';
import heroImage from './assets/img1.png';

import './App.css';

const DEMO_URL = 'https://calendar.app.google/WYc6Lm5gzHqqir7q7';
const WHATSAPP_PHONE = '5581982540904';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;

const TRACKING_EVENTS = {
    demoClick: 'click_demonstracao',
    whatsappClick: 'click_whatsapp',
    signupClick: 'click_cadastro',
    trialClick: 'click_teste_gratuito',
    pricingClick: 'click_planos',
    leadSubmit: 'envio_formulario_lead',
    featureClick: 'click_recurso_home'
};

const seoConfig = {
    title: 'AutisConnect | Software para autismo e gestão de pacientes TEA',
    description:
        'Plataforma para autismo que centraliza gestão de pacientes TEA, prontuário, agenda, financeiro, portal dos pais e monitoramento emocional.',
    keywords:
        'software para autismo, sistema para clínicas TEA, gestão de pacientes TEA, prontuário TEA, monitoramento emocional TEA, plataforma para autismo'
};

{/*const trustBadges = [
    'Startup incubada pelo Porto Digital',
    'Plataforma especializada em TEA',
    'Monitoramento Emocional Integrado'
];*/}

const painPoints = [
    'Informações espalhadas',
    'Múltiplas ferramentas',
    'Retrabalho administrativo',
    'Comunicação descentralizada',
    'Dificuldade de acompanhar evolução'
];

const solutionPillars = [
    {
        title: 'Organizar',
        text: 'Pacientes, agenda, financeiro e documentos em uma rotina mais clara.',
        icon: <Calendar2Check size={34} />
    },
    {
        title: 'Conectar',
        text: 'Famílias, profissionais e informações relevantes no mesmo fluxo.',
        icon: <People size={34} />
    },
    {
        title: 'Acompanhar',
        text: 'Evolução clínica, registros e monitoramento emocional com mais contexto.',
        icon: <GraphUp size={34} />
    }
];

const emotionalSignals = ['Linha do tempo emocional', 'Indicadores', 'IA', 'Evolução'];

const features = [
    {
        id: 1,
        title: 'Monitoramento emocional',
        description: 'Transforme sinais emocionais em dados de apoio ao acompanhamento TEA.',
        icon: <Heart className="feature-icon" size={40} />,
        link: '/presentation-dashboard/PresentationEmotionDetector',
        color: '#d9486e'
    },
    {
        id: 2,
        title: 'Dashboard profissional',
        description: 'Gerencie pacientes, consultas e evolução em um único sistema.',
        icon: <Sliders className="feature-icon" size={40} />,
        link: '/PresentationProfessionalDashboard',
        color: '#2563eb'
    },
    {
        id: 3,
        title: 'Portal dos pais',
        description: 'Aproxime famílias da rotina terapêutica e do progresso da criança.',
        icon: <People className="feature-icon" size={40} />,
        link: '/PresentationParentDashboard',
        color: '#7c3aed'
    },
    {
        id: 4,
        title: 'Gestão administrativa',
        description: 'Organize agenda, cadastro, relatórios e atendimento da clínica.',
        icon: <Calendar className="feature-icon" size={40} />,
        link: '/presentation-dashboard/PresentationSecretaryDashboard',
        color: '#0f9f8f'
    },
    {
        id: 5,
        title: 'Detalhes do paciente',
        description: 'Centralize histórico, prescrições, consultas, gráficos e observações.',
        icon: <FileEarmarkText className="feature-icon" size={40} />,
        link: '/presentation-dashboard/PresentationPatientDetails',
        color: '#f97316'
    },
    {
        id: 6,
        title: 'IA de apoio clínico',
        description: 'Use análises inteligentes para ampliar contexto e acelerar decisões.',
        icon: <ExclamationTriangle className="feature-icon" size={40} />,
        link: '/presentation-dashboard/PresentationStrokeRiskMonitor',
        color: '#f59e0b'
    }
];

const routineBenefits = [
    'Menos retrabalho',
    'Mais organização',
    'Mais produtividade',
    'Melhor acompanhamento',
    'Informações centralizadas',
    'Decisões mais rápidas'
];

const audienceCards = [
    {
        title: 'Profissionais',
        text: 'Controle pacientes, consultas, documentos e evolução clínica com menos esforço administrativo.',
        cta: 'Agendar Demonstração',
        image: servico2
    },
    {
        title: 'Clínicas',
        text: 'Organize operação, equipe, agenda e financeiro para crescer com processos mais previsíveis.',
        cta: 'Solicitar Apresentação',
        image: servico3
    },
    {
        title: 'Pais e Responsáveis',
        text: 'Acompanhe informações importantes, comunicação e progresso em uma experiência mais simples.',
        cta: 'Conhecer Plataforma',
        image: servico1
    }
];

const pricingPlans = [
    {
        name: 'Pais e Responsáveis',
        price: 'R$ 89,90',
        period: '/mês',
        benefit: 'Acompanhe a evolução, jogos terapêuticos e monitoramentos em uma área segura.',
        features: ['Portal dos Pais', 'Monitoramento emocional', 'Jogos terapêuticos', 'Histórico centralizado'],
        cta: 'Começar acompanhamento'
    },
    {
        name: 'Analisar 50',
        price: 'R$ 189,90',
        period: '/mês',
        benefit: 'Ideal para profissionais que precisam centralizar até 50 pacientes.',
        features: ['Até 50 pacientes', 'Agenda e documentos', 'Evolução clínica', 'Acesso à IA'],
        cta: 'Escolher Analisar 50',
        highlight: true
    },
    {
        name: 'Analisar 100',
        price: 'R$ 259,90',
        period: '/mês',
        benefit: 'Mais capacidade para consultórios em expansão e equipes multidisciplinares.',
        features: ['Até 100 pacientes', 'Gestão de rotina', 'Relatórios e gráficos', 'Portal integrado'],
        cta: 'Escolher Analisar 100'
    },
    {
        name: 'Analisar 200',
        price: 'R$ 349,90',
        period: '/mês',
        benefit: 'Para clínicas que precisam de organização, escala e visão de operação.',
        features: ['Até 200 pacientes', 'Fluxos administrativos', 'Financeiro', 'Indicadores de evolução'],
        cta: 'Escolher Analisar 200'
    },
    {
        name: 'Analisar 500',
        price: 'R$ 499,90',
        period: '/mês',
        benefit: 'Plano robusto para operações maiores com alto volume de acompanhamento.',
        features: ['Até 500 pacientes', 'Gestão ampliada', 'Equipe integrada', 'Dados centralizados'],
        cta: 'Falar com comercial'
    }
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

const getWhatsAppUrl = (message = 'Olá! Quero conhecer o AutisConnect.') =>
    `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;

const Home = () => {
    const { loading } = useContext(AuthContext);
    const [leadForm, setLeadForm] = useState({
        name: '',
        email: '',
        phone: '',
        profile: ''
    });
    const [leadSent, setLeadSent] = useState(false);

    const whatsappLeadUrl = useMemo(() => {
        const message = [
            'Olá! Quero solicitar uma demonstração do AutisConnect.',
            leadForm.name && `Nome: ${leadForm.name}`,
            leadForm.email && `E-mail: ${leadForm.email}`,
            leadForm.phone && `Telefone: ${leadForm.phone}`,
            leadForm.profile && `Perfil: ${leadForm.profile}`
        ]
            .filter(Boolean)
            .join('\n');

        return getWhatsAppUrl(message);
    }, [leadForm]);

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

    const handleLeadChange = (event) => {
        const { name, value } = event.target;
        setLeadForm((currentForm) => ({ ...currentForm, [name]: value }));
    };

    const handleLeadSubmit = (event) => {
        event.preventDefault();
        trackEvent(TRACKING_EVENTS.leadSubmit, {
            profile: leadForm.profile,
            source: 'home_lead_form'
        });
        setLeadSent(true);
        window.open(whatsappLeadUrl, '_blank', 'noopener,noreferrer');
    };

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
                                <a href="#recursos" className="autis-home-nav__link">Recursos</a>
                                <a href="#planos" className="autis-home-nav__link">Planos</a>
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

            <main className="home-page landing-home">
                <section
                    className="landing-hero"
                    style={{ backgroundImage: `linear-gradient(90deg, rgba(10, 28, 48, 0.92), rgba(10, 28, 48, 0.68), rgba(10, 28, 48, 0.38)), url(${heroImage})` }}
                >
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={8} xl={7}>
                                <h1>Organize pacientes, centralize informações e melhore o acompanhamento TEA em uma única plataforma.</h1>
                                <p className="landing-hero__subtitle">
                                    O AutisConnect conecta profissionais, famílias e informações do acompanhamento,
                                    reduzindo retrabalho e facilitando a evolução dos pacientes.
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
                                        href={getWhatsAppUrl('Olá! Quero testar gratuitamente o AutisConnect.')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => {
                                            trackEvent(TRACKING_EVENTS.trialClick, { location: 'hero' });
                                            trackEvent(TRACKING_EVENTS.whatsappClick, { location: 'hero_trial' });
                                        }}
                                    >
                                        <Button variant="success" size="lg">
                                            Teste Gratuitamente
                                        </Button>
                                    </a>
                                    <a
                                        href={getWhatsAppUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => trackEvent(TRACKING_EVENTS.whatsappClick, { location: 'hero' })}
                                    >
                                        <Button variant="outline-light" size="lg">
                                            <Whatsapp size={18} /> Falar pelo WhatsApp
                                        </Button>
                                    </a>
                                </div>
                                {/*<div className="landing-trust-bar">
                                    {trustBadges.map((badge) => (
                                        <span key={badge}>
                                            <CheckCircle size={17} /> {badge}
                                        </span>
                                    ))}
                                </div>*/}
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section landing-pains">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={5}>
                                <span className="landing-section__label">Dores reais do ecossistema TEA</span>
                                <h2>Você enfrenta algum destes desafios?</h2>
                                <p>
                                    Em mais de 100 entrevistas com profissionais e famílias, os mesmos bloqueios apareceram:
                                    informação dispersa, excesso de ferramentas e pouca integração entre quem acompanha o paciente.
                                </p>
                            </Col>
                            <Col lg={7}>
                                <Row className="g-3">
                                    {painPoints.map((pain) => (
                                        <Col md={6} key={pain}>
                                            <Card className="landing-card landing-pain-card h-100">
                                                <Card.Body>
                                                    <ExclamationTriangle size={24} />
                                                    <strong>{pain}</strong>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                        </Row>

                        <Row className="landing-compare g-4">
                            <Col md={6}>
                                <div className="landing-compare__column landing-compare__column--before">
                                    <span>Antes</span>
                                    <h3>Rotina fragmentada</h3>
                                    <p>Planilhas, mensagens, agenda, documentos e evolução clínica em lugares diferentes.</p>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="landing-compare__column landing-compare__column--after">
                                    <span>Depois</span>
                                    <h3>Gestão centralizada</h3>
                                    <p>Pacientes, famílias, histórico, indicadores e comunicação conectados em uma plataforma.</p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section bg-white">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Solução</span>
                            <h2>Como o AutisConnect resolve isso?</h2>
                        </div>
                        <Row className="g-4">
                            {solutionPillars.map((pillar) => (
                                <Col md={4} key={pillar.title}>
                                    <Card className="landing-card landing-pillar-card h-100">
                                        <Card.Body>
                                            <div className="landing-card__icon">{pillar.icon}</div>
                                            <h3>{pillar.title}</h3>
                                            <p>{pillar.text}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                <section className="landing-section landing-emotional">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={6}>
                                <span className="landing-section__label">Diferencial competitivo</span>
                                <h2>Monitoramento Emocional Inteligente</h2>
                                <p>
                                    Transforme sinais emocionais em informações que apoiam o acompanhamento e a tomada de decisão.
                                </p>
                                <div className="landing-emotional__grid">
                                    {emotionalSignals.map((signal) => (
                                        <span key={signal}><Star size={16} /> {signal}</span>
                                    ))}
                                </div>
                            </Col>
                            <Col lg={6}>
                                <div className="landing-emotional__panel">
                                    <div className="landing-emotional__timeline">
                                        <span>Manhã</span>
                                        <div><i style={{ width: '56%' }} /></div>
                                        <strong>Estável</strong>
                                    </div>
                                    <div className="landing-emotional__timeline">
                                        <span>Tarde</span>
                                        <div><i style={{ width: '78%' }} /></div>
                                        <strong>Atenção</strong>
                                    </div>
                                    <div className="landing-emotional__timeline">
                                        <span>Noite</span>
                                        <div><i style={{ width: '42%' }} /></div>
                                        <strong>Regulado</strong>
                                    </div>
                                    <div className="landing-emotional__insight">
                                        <Heart size={24} />
                                        <p>Indicadores emocionais ajudam profissionais e famílias a enxergar padrões ao longo do acompanhamento.</p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section bg-white" id="recursos">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Recursos</span>
                            <h2>Uma plataforma para transformar rotina em acompanhamento.</h2>
                            <p>Menos descrição técnica, mais benefício direto para profissionais, clínicas e famílias.</p>
                        </div>
                        <Row className="g-4">
                            {features.map((feature) => (
                                <Col key={feature.id} lg={4} md={6}>
                                    <Card className="landing-card landing-feature-card h-100">
                                        <Card.Body>
                                            <div className="landing-feature-card__icon" style={{ color: feature.color }}>
                                                {feature.icon}
                                            </div>
                                            <h3>{feature.title}</h3>
                                            <p>{feature.description}</p>
                                            <Link
                                                to={feature.link}
                                                onClick={() => trackEvent(TRACKING_EVENTS.featureClick, { feature: feature.title })}
                                            >
                                                Explorar recurso <ArrowRight size={16} />
                                            </Link>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                <section className="landing-section landing-benefits">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Benefícios</span>
                            <h2>Resultados para sua rotina.</h2>
                        </div>
                        <Row className="g-3">
                            {routineBenefits.map((benefit) => (
                                <Col lg={4} md={6} key={benefit}>
                                    <div className="landing-benefit-item">
                                        <CheckCircle size={22} />
                                        <span>{benefit}</span>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                <section className="landing-section bg-white">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Para quem é</span>
                            <h2>Escolha o caminho mais próximo da sua realidade.</h2>
                        </div>
                        <Row className="g-4">
                            {audienceCards.map((audience) => (
                                <Col lg={4} md={6} key={audience.title}>
                                    <Card className="landing-card landing-audience-card h-100">
                                        <div className="landing-audience-card__image">
                                            <Card.Img src={audience.image} alt={audience.title} />
                                        </div>
                                        <Card.Body>
                                            <h3>{audience.title}</h3>
                                            <p>{audience.text}</p>
                                            <a
                                                href={DEMO_URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => trackEvent(TRACKING_EVENTS.demoClick, { location: `publico_${audience.title}` })}
                                            >
                                                <Button variant="primary" className="w-100">
                                                    {audience.cta} <ArrowRight size={17} />
                                                </Button>
                                            </a>
                                        </Card.Body>
                                    </Card>
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
                                <h2>Construído com escuta real do ecossistema TEA.</h2>
                                <p>Área preparada para receber depoimentos, logos de parceiros e casos de sucesso.</p>
                            </Col>
                            <Col lg={7}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Card className="landing-card h-100">
                                            <Card.Body>
                                                <Award size={34} />
                                                <h3>Porto Digital</h3>
                                                <p>Startup incubada pelo Porto Digital.</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="landing-card h-100">
                                            <Card.Body>
                                                <People size={34} />
                                                <h3>+50 entrevistas</h3>
                                                <p>Pesquisa com profissionais e famílias do ecossistema TEA.</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-section bg-white" id="planos">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Planos</span>
                            <h2>Planos pensados para acompanhar sua fase.</h2>
                            <p>Escolha pela necessidade de gestão, volume de pacientes e nível de acompanhamento.</p>
                        </div>
                        <Row className="g-4 justify-content-center">
                            {pricingPlans.map((plan) => (
                                <Col key={plan.name} xl={plan.highlight ? 4 : undefined} lg={4} md={6}>
                                    <Card className={`landing-card landing-plan-card h-100 ${plan.highlight ? 'landing-plan-card--highlight' : ''}`}>
                                        <Card.Body>
                                            {plan.highlight && <Badge className="landing-plan-card__badge">Mais escolhido</Badge>}
                                            <h3>{plan.name}</h3>
                                            <p>{plan.benefit}</p>
                                            <div className="landing-plan-card__price">
                                                <strong>{plan.price}</strong>
                                                <span>{plan.period}</span>
                                            </div>
                                            <ul>
                                                {plan.features.map((feature) => (
                                                    <li key={feature}>
                                                        <CheckCircle size={17} /> {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                            <Link
                                                to="/signup"
                                                onClick={() => trackEvent(TRACKING_EVENTS.pricingClick, { plan: plan.name })}
                                            >
                                                <Button variant={plan.highlight ? 'primary' : 'outline-primary'} className="w-100">
                                                    {plan.cta}
                                                </Button>
                                            </Link>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                <section className="landing-section landing-lead">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={5}>
                                <span className="landing-section__label">Captação de leads</span>
                                <h2>Solicite uma demonstração personalizada.</h2>
                                <p>
                                    Conte seu perfil e abriremos uma conversa com o comercial para direcionar a melhor apresentação.
                                </p>
                            </Col>
                            <Col lg={7}>
                                <Card className="landing-card landing-form-card">
                                    <Card.Body>
                                        <Form onSubmit={handleLeadSubmit}>
                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group controlId="leadName">
                                                        <Form.Label>Nome</Form.Label>
                                                        <Form.Control
                                                            name="name"
                                                            value={leadForm.name}
                                                            onChange={handleLeadChange}
                                                            placeholder="Seu nome"
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group controlId="leadEmail">
                                                        <Form.Label>E-mail</Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            name="email"
                                                            value={leadForm.email}
                                                            onChange={handleLeadChange}
                                                            placeholder="voce@email.com"
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group controlId="leadPhone">
                                                        <Form.Label>Telefone</Form.Label>
                                                        <Form.Control
                                                            name="phone"
                                                            value={leadForm.phone}
                                                            onChange={handleLeadChange}
                                                            placeholder="(00) 00000-0000"
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group controlId="leadProfile">
                                                        <Form.Label>Perfil</Form.Label>
                                                        <Form.Select name="profile" value={leadForm.profile} onChange={handleLeadChange} required>
                                                            <option value="">Selecione</option>
                                                            <option value="Profissional">Profissional</option>
                                                            <option value="Clínica">Clínica</option>
                                                            <option value="Pai/Mãe">Pai/Mãe</option>
                                                            <option value="Serviço TEA">Serviço TEA</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col xs={12}>
                                                    <Button type="submit" variant="success" size="lg" className="w-100">
                                                        Solicitar Demonstração <ArrowRight size={18} />
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </Form>
                                        {leadSent && (
                                            <p className="landing-form-card__success">
                                                Solicitação registrada. O WhatsApp foi aberto com seus dados para agilizar o atendimento.
                                            </p>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="landing-final-cta">
                    <Container>
                        <h2>Pronto para transformar a forma como você acompanha o TEA?</h2>
                        <p>Centralize informações, reduza retrabalho e acompanhe a evolução em uma única plataforma.</p>
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
                                href={getWhatsAppUrl('Olá! Quero testar gratuitamente o AutisConnect.')}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                    trackEvent(TRACKING_EVENTS.trialClick, { location: 'final_cta' });
                                    trackEvent(TRACKING_EVENTS.whatsappClick, { location: 'final_cta_trial' });
                                }}
                            >
                                <Button variant="success" size="lg">Teste Gratuitamente</Button>
                            </a>
                            <a
                                href={getWhatsAppUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEvent(TRACKING_EVENTS.whatsappClick, { location: 'final_cta' })}
                            >
                                <Button variant="outline-light" size="lg"><Whatsapp size={18} /> WhatsApp</Button>
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
