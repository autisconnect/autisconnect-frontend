import React, { useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
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
    GeoAlt,
    GraphUp,
    Heart,
    Instagram,
    People,
    Search,
    Sliders,
    Star,
    StarFill,
    Wallet2,
    Whatsapp,
    Youtube
} from 'react-bootstrap-icons';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';

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
    gameClick: 'click_game_terapeutico',
    dashboardClick: 'click_dashboard_home'
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

const dashboardHighlights = [
    {
        title: 'Dashboard Clínica',
        description: 'Uma visão operacional para clínicas acompanharem pacientes, profissionais, agenda, vínculos e rotina de atendimento em um único ambiente.',
        icon: <Sliders size={34} />,
        bullets: ['Operação clínica integrada', 'Equipe, pacientes e agenda', 'Base para gestão terapêutica'],
        cta: 'Conhecer Dashboard Clínica'
    },
    {
        title: 'Dashboard Executivo',
        description: 'Uma camada estratégica para transformar dados da operação em indicadores, relatórios, alertas e visão gerencial da clínica.',
        icon: <GraphUp size={34} />,
        bullets: ['Indicadores executivos', 'Receita, ocupação e alertas', 'Relatórios e saúde operacional'],
        cta: 'Conhecer Dashboard Executivo'
    }
];

const proofItems = [
    'Startup incubada pelo Porto Digital.',
    'Mais de 50 entrevistas realizadas com profissionais e famílias.',
    'Plataforma desenvolvida especificamente para o ecossistema TEA.',
    'Preparada para clínicas, profissionais e famílias.'
];

const SERVICE_TYPE_OPTIONS = [
    { value: 'ABA', label: 'ABA' },
    { value: 'Fonoaudiologia', label: 'Fonoaudiologia' },
    { value: 'Psicopedagogia', label: 'Psicopedagogia' },
    { value: 'Equoterapia', label: 'Equoterapia' },
    { value: 'Natacao Adaptada', label: 'Natação Adaptada' },
    { value: 'Musica', label: 'Música' },
    { value: 'Artes', label: 'Artes' },
    { value: 'Odontologia Sensorial', label: 'Odontologia Sensorial' },
    { value: 'Psiquiatria', label: 'Psiquiatria' },
    { value: 'Neuropediatria', label: 'Neuropediatria' }
];

const SERVICE_SUPPORT_LEVEL_OPTIONS = [
    { value: '1', label: 'Nível 1' },
    { value: '2', label: 'Nível 2' },
    { value: '3', label: 'Nível 3' }
];

const SERVICE_MODALITY_OPTIONS = [
    { value: 'Presencial', label: 'Presencial' },
    { value: 'Online', label: 'Online' },
    { value: 'Hibrido', label: 'Híbrido' }
];

const SERVICE_AGE_RANGE_OPTIONS = [
    { value: '0-3', label: '0-3 anos' },
    { value: '4-7', label: '4-7 anos' },
    { value: '8-12', label: '8-12 anos' },
    { value: '13-17', label: '13-17 anos' },
    { value: '18+', label: '18+ anos' }
];

const SERVICE_COVERAGE_OPTIONS = [
    { value: 'Convenio', label: 'Convênio' },
    { value: 'Particular', label: 'Particular' },
    { value: 'PlanoSaude', label: 'Plano de Saúde' }
];

const buildBaseServiceFilters = () => ({
    city: '',
    region: '',
    state: '',
    types: [],
    supportLevels: [],
    modality: '',
    ageRange: '',
    coverage: '',
    search: '',
    sort: 'relevance',
    page: 1,
    limit: 12,
    lat: null,
    lng: null
});

const SERVICE_TYPE_LABELS = SERVICE_TYPE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});

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

const normalizeList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const normalizeService = (service) => {
    const specialtiesRaw =
        service?.specialties ||
        service?.especialidades ||
        service?.types ||
        service?.servicos ||
        service?.categorias ||
        service?.tipo_servico;
    const specialties = normalizeList(specialtiesRaw).map(
        (item) => SERVICE_TYPE_LABELS[item] || item
    );

    return {
        id: service?.id || service?.service_id || service?.codigo || service?.uuid,
        name: service?.name || service?.nome || service?.titulo || 'Serviço',
        neighborhood: service?.neighborhood || service?.bairro || service?.district || '',
        city: service?.city || service?.cidade || '',
        state: service?.state || service?.uf || service?.estado || '',
        specialties,
        rating: Number(service?.rating || service?.avaliacao_media || service?.avaliacao || 0),
        ratingCount: Number(
            service?.ratingCount || service?.avaliacoes_count || service?.total_avaliacoes || 0
        ),
        distanceKm: service?.distanceKm || service?.distancia_km || service?.distancia || null
    };
};

const parseCoordinate = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const buildServiceSearchParams = (filters) => {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.region) params.append('region', filters.region);
    if (filters.state) params.append('state', filters.state);
    if (filters.search) {
        params.append('q', filters.search);
        params.append('search', filters.search);
    }
    filters.types.forEach((type) => params.append('types[]', type));
    filters.supportLevels.forEach((level) => params.append('levels[]', level));
    if (filters.modality) params.append('modality', filters.modality);
    if (filters.ageRange) params.append('ageRange', filters.ageRange);
    if (filters.coverage) params.append('coverage', filters.coverage);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    const lat = parseCoordinate(filters.lat);
    const lng = parseCoordinate(filters.lng);
    if (lat !== null && lng !== null) {
        params.append('lat', String(lat));
        params.append('lng', String(lng));
    }
    return params.toString();
};

const Home = () => {
    const { loading } = useContext(AuthContext);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [servicesError, setServicesError] = useState('');
    const [services, setServices] = useState([]);
    const [serviceFilters, setServiceFilters] = useState(() => buildBaseServiceFilters());
    const [serviceMeta, setServiceMeta] = useState({ total: 0, page: 1, pageSize: 12 });
    const [serviceGeoStatus, setServiceGeoStatus] = useState('');

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

    const updateServiceFilter = (key, value) => {
        setServiceFilters((prev) => ({ ...prev, [key]: value }));
    };

    const toggleServiceFilterValue = (key, value) => {
        setServiceFilters((prev) => {
            const current = prev[key] || [];
            const next = current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value];
            return { ...prev, [key]: next };
        });
    };

    const fetchServices = async (filters) => {
        const hasLocation = filters.city || filters.region || filters.state;
        if (!hasLocation) {
            setServicesError('Informe cidade, região ou estado para buscar serviços.');
            setServices([]);
            setServiceMeta({ total: 0, page: 1, pageSize: filters.limit });
            return;
        }

        setServicesLoading(true);
        setServicesError('');

        try {
            const queryString = buildServiceSearchParams(filters);
            const response = await apiClient.get(`/parent/services/search?${queryString}`);
            const payload = response.data || {};
            const data = Array.isArray(payload)
                ? payload
                : payload.results || payload.items || payload.services || payload.data || [];
            const normalized = data.map(normalizeService);

            setServices(normalized);
            setServiceMeta({
                total: Number(payload.total || payload.count || normalized.length),
                page: Number(payload.page || filters.page || 1),
                pageSize: Number(payload.pageSize || payload.limit || filters.limit || 12)
            });
            trackEvent(TRACKING_EVENTS.featureClick, { feature: 'Busca Serviços Rede TEA' });
        } catch (err) {
            console.warn('Erro ao buscar serviços na Home.', err);
            setServices([]);
            setServiceMeta({ total: 0, page: filters.page || 1, pageSize: filters.limit || 12 });
            setServicesError('Não foi possível carregar serviços agora. Tente novamente.');
        } finally {
            setServicesLoading(false);
        }
    };

    const handleServiceSearch = (event) => {
        if (event) event.preventDefault();
        fetchServices({ ...serviceFilters, page: 1 });
    };

    const handleServiceClear = () => {
        const defaults = buildBaseServiceFilters();
        setServiceFilters(defaults);
        setServices([]);
        setServicesError('');
        setServiceGeoStatus('');
        setServiceMeta({ total: 0, page: 1, pageSize: 12 });
    };

    const handleServiceSortChange = (value) => {
        const nextFilters = { ...serviceFilters, sort: value, page: 1 };
        setServiceFilters(nextFilters);
        if (services.length > 0) {
            fetchServices(nextFilters);
        }
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setServiceGeoStatus('Geolocalização não suportada neste navegador.');
            return;
        }

        setServiceGeoStatus('Obtendo localização...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setServiceFilters((prev) => ({ ...prev, lat: latitude, lng: longitude }));
                setServiceGeoStatus('Localização capturada para calcular distância.');
            },
            () => {
                setServiceGeoStatus('Não foi possível obter sua localização.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    const openServiceDetails = (serviceId) => {
        const resolvedId = serviceId || 18;
        window.open(`/service-dashboard/${resolvedId}`, '_blank', 'noopener,noreferrer');
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
                                <a href="#ecossistema" className="autis-home-nav__link">Ecossistema</a>
                                <a href="#games-terapeuticos" className="autis-home-nav__link">Games</a>
                                <a href="#monitoramento-emocional" className="autis-home-nav__link">Monitoramento</a>
                                <a href="#servicos-rede-tea" className="autis-home-nav__link">Rede TEA</a>
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

                <section className="landing-section bg-white intelligence-service-search" id="servicos-rede-tea">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Serviços & Rede TEA</span>
                            <h2>Encontre serviços que atendem TEA na sua região.</h2>
                            <p>Busque clínicas, terapias, profissionais, atividades e serviços de apoio por cidade, especialidade, modalidade, faixa etária e tipo de atendimento.</p>
                        </div>

                        <Card className="landing-card intelligence-service-search__panel">
                            <Card.Body>
                                <Form onSubmit={handleServiceSearch}>
                                    <Row className="g-3 align-items-end">
                                        <Col lg={5} md={12}>
                                            <Form.Label>Buscar por nome ou palavra-chave</Form.Label>
                                            <div className="d-flex gap-2 flex-wrap flex-md-nowrap">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Ex: ABA, fonoaudiologia, terapia, clínica"
                                                    value={serviceFilters.search}
                                                    onChange={(event) => updateServiceFilter('search', event.target.value)}
                                                />
                                                <Button type="submit" variant="primary">
                                                    <Search size={17} /> Buscar
                                                </Button>
                                            </div>
                                        </Col>
                                        <Col lg={3} md={5}>
                                            <Form.Group controlId="homeServiceCity">
                                                <Form.Label>Cidade *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Cidade"
                                                    value={serviceFilters.city}
                                                    onChange={(event) => updateServiceFilter('city', event.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col lg={2} md={4}>
                                            <Form.Group controlId="homeServiceRegion">
                                                <Form.Label>Região</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Região"
                                                    value={serviceFilters.region}
                                                    onChange={(event) => updateServiceFilter('region', event.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col lg={2} md={3}>
                                            <Form.Group controlId="homeServiceState">
                                                <Form.Label>Estado</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="UF"
                                                    maxLength={2}
                                                    value={serviceFilters.state}
                                                    onChange={(event) => updateServiceFilter('state', event.target.value.toUpperCase())}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="g-3 mt-3">
                                        <Col lg={6}>
                                            <Form.Label>Tipo de serviço</Form.Label>
                                            <div className="intelligence-service-search__checks">
                                                {SERVICE_TYPE_OPTIONS.map((option) => (
                                                    <Form.Check
                                                        key={option.value}
                                                        type="checkbox"
                                                        id={`home-service-type-${option.value}`}
                                                        label={option.label}
                                                        checked={serviceFilters.types.includes(option.value)}
                                                        onChange={() => toggleServiceFilterValue('types', option.value)}
                                                    />
                                                ))}
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <Form.Label>Nível de suporte</Form.Label>
                                            <div className="intelligence-service-search__checks">
                                                {SERVICE_SUPPORT_LEVEL_OPTIONS.map((option) => (
                                                    <Form.Check
                                                        key={option.value}
                                                        type="checkbox"
                                                        id={`home-service-support-${option.value}`}
                                                        label={option.label}
                                                        checked={serviceFilters.supportLevels.includes(option.value)}
                                                        onChange={() => toggleServiceFilterValue('supportLevels', option.value)}
                                                    />
                                                ))}
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <Form.Group controlId="homeServiceModality">
                                                <Form.Label>Modalidade</Form.Label>
                                                <Form.Select
                                                    value={serviceFilters.modality}
                                                    onChange={(event) => updateServiceFilter('modality', event.target.value)}
                                                >
                                                    <option value="">Todas</option>
                                                    {SERVICE_MODALITY_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="g-3 mt-3 align-items-end">
                                        <Col md={4}>
                                            <Form.Group controlId="homeServiceAgeRange">
                                                <Form.Label>Faixa etária atendida</Form.Label>
                                                <Form.Select
                                                    value={serviceFilters.ageRange}
                                                    onChange={(event) => updateServiceFilter('ageRange', event.target.value)}
                                                >
                                                    <option value="">Todas</option>
                                                    {SERVICE_AGE_RANGE_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group controlId="homeServiceCoverage">
                                                <Form.Label>Convênio / Particular</Form.Label>
                                                <Form.Select
                                                    value={serviceFilters.coverage}
                                                    onChange={(event) => updateServiceFilter('coverage', event.target.value)}
                                                >
                                                    <option value="">Todos</option>
                                                    {SERVICE_COVERAGE_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button type="button" variant="outline-primary" onClick={handleUseMyLocation}>
                                                    <GeoAlt size={17} /> Usar localização
                                                </Button>
                                                <Button type="button" variant="outline-secondary" onClick={handleServiceClear}>
                                                    Limpar
                                                </Button>
                                            </div>
                                            {serviceGeoStatus && <small className="text-muted d-block mt-2">{serviceGeoStatus}</small>}
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>

                        <div className="intelligence-service-search__toolbar">
                            <div className="text-muted">
                                {servicesLoading
                                    ? 'Carregando serviços...'
                                    : `${serviceMeta.total || services.length} serviços encontrados`}
                            </div>
                            <Form.Group className="d-flex align-items-center gap-2">
                                <Form.Label className="mb-0">Ordenar</Form.Label>
                                <Form.Select
                                    value={serviceFilters.sort}
                                    onChange={(event) => handleServiceSortChange(event.target.value)}
                                >
                                    <option value="relevance">Relevância</option>
                                    <option value="rating">Avaliação</option>
                                    <option value="distance">Distância</option>
                                    <option value="recent">Mais recente</option>
                                </Form.Select>
                            </Form.Group>
                        </div>

                        {servicesError && (
                            <Alert variant="warning" className="border-0 shadow-sm">
                                {servicesError}
                            </Alert>
                        )}

                        {servicesLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" variant="primary" />
                            </div>
                        ) : services.length > 0 ? (
                            <Row className="g-3">
                                {services.map((service) => {
                                    const locationText = [
                                        service.neighborhood,
                                        [service.city, service.state].filter(Boolean).join('/')
                                    ]
                                        .filter(Boolean)
                                        .join(' - ');
                                    const specialties = service.specialties?.length
                                        ? service.specialties.slice(0, 2)
                                        : [];

                                    return (
                                        <Col key={service.id || service.name} md={6} lg={4}>
                                            <Card className="landing-card intelligence-service-card h-100">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-start gap-3">
                                                        <div>
                                                            <h3>{service.name}</h3>
                                                            <div className="intelligence-service-card__location">
                                                                <GeoAlt size={15} />
                                                                {locationText || 'Localização não informada'}
                                                            </div>
                                                        </div>
                                                        {service.distanceKm !== null && service.distanceKm !== undefined ? (
                                                            <Badge bg="light" text="dark">
                                                                {Number(service.distanceKm).toFixed(1)} km
                                                            </Badge>
                                                        ) : null}
                                                    </div>

                                                    <div className="intelligence-service-card__badges">
                                                        {specialties.length > 0 ? (
                                                            specialties.map((specialty) => (
                                                                <Badge key={specialty} bg="primary" className="bg-opacity-10 text-primary">
                                                                    {specialty}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <Badge bg="secondary" className="bg-opacity-10 text-secondary">
                                                                Especialidades diversas
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="intelligence-service-card__rating">
                                                        {service.rating > 0 ? (
                                                            <>
                                                                <StarFill className="text-warning" size={16} />
                                                                <strong>{service.rating.toFixed(1)}</strong>
                                                                <span>({service.ratingCount || 0})</span>
                                                            </>
                                                        ) : (
                                                            <span>Sem avaliações</span>
                                                        )}
                                                    </div>

                                                    <Button variant="outline-primary" size="sm" onClick={() => openServiceDetails(service.id)}>
                                                        Ver detalhes <ArrowRight size={15} />
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        ) : (
                            <Alert variant="info" className="border-0 shadow-sm">
                                Use os filtros acima para encontrar serviços especializados que atendem TEA.
                            </Alert>
                        )}
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
                        <Row className="g-4 mt-4 justify-content-center">
                            {dashboardHighlights.map((dashboard) => (
                                <Col key={dashboard.title} lg={6}>
                                    <Card className="landing-card intelligence-dashboard-card h-100">
                                        <Card.Body>
                                            <div className="intelligence-dashboard-card__header">
                                                <div className="intelligence-dashboard-card__icon">
                                                    {dashboard.icon}
                                                </div>
                                                <div>
                                                    <span>Nova funcionalidade integrada</span>
                                                    <h3>{dashboard.title}</h3>
                                                </div>
                                            </div>
                                            <p>{dashboard.description}</p>
                                            <ul>
                                                {dashboard.bullets.map((bullet) => (
                                                    <li key={bullet}>
                                                        <CheckCircle size={17} /> {bullet}
                                                    </li>
                                                ))}
                                            </ul>
                                            <a
                                                href={DEMO_URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => trackEvent(TRACKING_EVENTS.dashboardClick, { dashboard: dashboard.title })}
                                            >
                                                <Button variant="primary">
                                                    {dashboard.cta} <ArrowRight size={17} />
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
