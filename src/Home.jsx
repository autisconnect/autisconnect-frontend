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
import servico1 from './assets/servico01.png';
import servico2 from './assets/servico02.png';
import img01 from './assets/img01.png';
import img02 from './assets/img02.png';
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
    serviceClick: 'click_servico_rede_tea',
    serviceSearch: 'busca_servicos_rede_tea',
    dashboardClick: 'click_dashboard_home',
    platformClick: 'click_conhecer_plataforma'
};

const seoConfig = {
    title: 'AutisConnect | Ecossistema inteligente para acompanhamento TEA',
    description:
        'Plataforma inteligente que conecta famílias, profissionais, clínicas, dados, monitoramento emocional, atividades ABA, jogos terapêuticos e gestão em torno da jornada da pessoa com TEA.',
    keywords:
        'plataforma para autismo, software para autismo, sistema para clínicas TEA, gestão de pacientes TEA, prontuário TEA, monitoramento emocional TEA, acompanhamento TEA, jogos terapêuticos autismo, atividades ABA, análise de vocalizações TEA, rede de serviços TEA'
};

const ecosystemGroups = [
    {
        title: 'Família',
        description: 'Acompanhamento, participação e informações do dia a dia.',
        icon: <Heart size={30} />,
        items: ['Evolução', 'Atividades', 'Comunicação']
    },
    {
        title: 'Profissionais',
        description: 'Pacientes, atendimentos, evolução e ferramentas terapêuticas.',
        icon: <People size={30} />,
        items: ['Atendimentos', 'ABA', 'Relatórios']
    },
    {
        title: 'Clínica',
        description: 'Pacientes, equipe, agenda, operação e financeiro.',
        icon: <Calendar2Check size={30} />,
        items: ['Agenda', 'Equipe', 'Operação']
    },
    {
        title: 'Gestão',
        description: 'Indicadores, produtividade, relatórios e inteligência gerencial.',
        icon: <GraphUp size={30} />,
        items: ['Indicadores', 'Alertas', 'Decisão']
    }
];

const beyondManagementPillars = [
    {
        title: 'Monitoramento de Emoções',
        description: 'Registros visuais para acompanhar sinais emocionais ao longo da jornada.',
        icon: <Heart size={30} />,
        link: '/presentation-dashboard/PresentationEmotionDetector',
        bars: [62, 78, 54]
    },
    {
        title: 'Análise de Vocalizações',
        description: 'Acompanhamento estruturado de vocalizações relevantes para o desenvolvimento.',
        icon: <FileEarmarkText size={30} />,
        link: '/presentation-dashboard/PresentationTriggerRecorder',
        bars: [44, 68, 82]
    },
    {
        title: 'Atividades ABA',
        description: 'Planejamento, execução e evolução das atividades terapêuticas.',
        icon: <Calendar2Check size={30} />,
        link: '/presentation-dashboard/PresentationPatientDetails',
        bars: [72, 58, 86]
    },
    {
        title: 'Games Terapêuticos',
        description: 'Experiências digitais para estimular habilidades cognitivas e socioemocionais.',
        icon: <Star size={30} />,
        link: '#games-terapeuticos',
        bars: [52, 74, 64]
    },
    {
        title: 'Inteligência Artificial',
        description: 'Organização de dados para apoiar leitura de padrões e insights de acompanhamento.',
        icon: <Sliders size={30} />,
        link: '/PresentationProfessionalDashboard',
        bars: [66, 46, 88]
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

const architectureLayers = [
    {
        title: 'Pais / Responsáveis',
        description: 'Participação da família na jornada.',
        items: ['Evolução', 'Indicadores', 'Atividades', 'Comunicação', 'Atendimentos', 'Serviços']
    },
    {
        title: 'Profissionais',
        description: 'Atendimento e acompanhamento terapêutico.',
        items: ['Pacientes', 'Atendimentos', 'ABA', 'Monitoramentos', 'Relatórios', 'Inteligência']
    },
    {
        title: 'Clínica',
        description: 'Gestão integrada da operação.',
        items: ['Pacientes', 'Profissionais', 'Funcionários', 'Agenda', 'Financeiro', 'Operação']
    },
    {
        title: 'Executivo',
        description: 'Inteligência estratégica da organização.',
        items: ['DRE', 'Fluxo de caixa', 'Alertas', 'Fiscal', 'Produtividade', 'Insights']
    }
];

const clinicFeatures = [
    'Visão geral',
    'Agendamentos',
    'Profissionais',
    'Pacientes',
    'Funcionários',
    'Financeiro',
    'Operações'
];

const executiveFeatures = [
    'Receita',
    'Custos',
    'Fluxo de caixa',
    'DRE',
    'Indicadores',
    'Produtividade',
    'Alertas',
    'Gestão Fiscal Inteligente',
    'IA e insights'
];

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

const validationItems = [
    'Startup incubada pelo Porto Digital do Recife.',
    'Mais de 50 entrevistas realizadas com profissionais e famílias.',
    'Plataforma desenvolvida especificamente para o ecossistema TEA.',
    'Preparada para clínicas, profissionais, famílias e rede de serviços.'
];

const footerTrustItems = [
    'Tecnologia inteligente',
    'Cuidado humano',
    'Dados e ciência',
    'Segurança',
    'Inclusão',
    'Evolução constante'
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
            .split(/[,;|]/)
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

const DataLine = ({ width = 60 }) => (
    <span className="ecosystem-data-line">
        <i style={{ width: `${width}%` }} />
    </span>
);

const MiniDashboard = ({ title, eyebrow, lines = [52, 72, 44], variant = 'blue' }) => (
    <div className={`ecosystem-mini-dashboard ecosystem-mini-dashboard--${variant}`}>
        <div className="ecosystem-mini-dashboard__top">
            <span>{eyebrow}</span>
            <strong>{title}</strong>
        </div>
        <div className="ecosystem-mini-dashboard__grid">
            {lines.map((line, index) => (
                <DataLine key={`${title}-${line}-${index}`} width={line} />
            ))}
        </div>
    </div>
);

const FeatureLink = ({ feature }) => {
    const content = (
        <>
            Conhecer recurso <ArrowRight size={16} />
        </>
    );

    if (feature.link.startsWith('#')) {
        return (
            <a
                href={feature.link}
                onClick={() => trackEvent(TRACKING_EVENTS.featureClick, { feature: feature.title })}
            >
                {content}
            </a>
        );
    }

    return (
        <Link
            to={feature.link}
            onClick={() => trackEvent(TRACKING_EVENTS.featureClick, { feature: feature.title })}
        >
            {content}
        </Link>
    );
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
            keywords: seoConfig.keywords,
            audience: [
                { '@type': 'Audience', audienceType: 'Famílias de pessoas com TEA' },
                { '@type': 'Audience', audienceType: 'Profissionais de saúde e terapias' },
                { '@type': 'Audience', audienceType: 'Clínicas e organizações de cuidado' }
            ]
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
            trackEvent(TRACKING_EVENTS.serviceSearch, { source: 'home_rede_tea' });
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
        trackEvent(TRACKING_EVENTS.serviceClick, { serviceId: resolvedId, source: 'home_rede_tea' });
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
            <nav className="top-bar fixed-top autis-home-nav ecosystem-nav">
                <Container>
                    <Row className="align-items-center gy-3 py-3">
                        <Col xl={2} lg={2} md={4} className="text-center text-md-start">
                            <a href="#topo" aria-label="AutisConnect Home">
                                <img src={logonovo} alt="AutisConnect" className="top-bar-logo ecosystem-nav__logo" />
                            </a>
                        </Col>
                        <Col xl={10} lg={10} md={8}>
                            <div className="autis-home-nav__actions ecosystem-nav__actions">
                                <a href="#plataforma" className="autis-home-nav__link">Plataforma</a>
                                <a href="#solucoes" className="autis-home-nav__link">Soluções</a>
                                <a href="#clinicas" className="autis-home-nav__link">Para Clínicas</a>
                                <a href="#profissionais" className="autis-home-nav__link">Para Profissionais</a>
                                <a href="#familias" className="autis-home-nav__link">Para Famílias</a>
                                <a href="#servicos-rede-tea" className="autis-home-nav__link">Rede TEA</a>
                                <Button
                                    as="a"
                                    href={DEMO_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="primary"
                                    className="ecosystem-btn ecosystem-btn--primary"
                                    onClick={() => trackEvent(TRACKING_EVENTS.demoClick, { location: 'nav' })}
                                >
                                    Agendar demonstração
                                </Button>
                                <Button
                                    as={Link}
                                    to="/login"
                                    variant="outline-light"
                                    className="ecosystem-btn ecosystem-btn--ghost"
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('user');
                                    }}
                                >
                                    Entrar
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </nav>

            <main id="topo" className="home-page landing-home autisconnect-intelligence-home ecosystem-home">
                <section className="ecosystem-hero">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col xl={6} lg={6}>
                                <Badge className="ecosystem-eyebrow">Plataforma inteligente HealthTech para TEA</Badge>
                                <h1>Tecnologia que conecta toda a jornada da pessoa com TEA.</h1>
                                <p className="ecosystem-hero__subtitle">
                                    Uma plataforma inteligente que integra famílias, profissionais, clínicas, acompanhamento terapêutico, dados e gestão em um único ecossistema.
                                </p>
                                <div className="ecosystem-hero__actions">
                                    <Button
                                        as="a"
                                        href="#plataforma"
                                        size="lg"
                                        className="ecosystem-btn ecosystem-btn--primary"
                                        onClick={() => trackEvent(TRACKING_EVENTS.platformClick, { location: 'hero' })}
                                    >
                                        Conhecer o AutisConnect <ArrowRight size={18} />
                                    </Button>
                                    <Button
                                        as="a"
                                        href={DEMO_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="lg"
                                        variant="outline-light"
                                        className="ecosystem-btn ecosystem-btn--light"
                                        onClick={() => trackEvent(TRACKING_EVENTS.demoClick, { location: 'hero' })}
                                    >
                                        Agendar demonstração
                                    </Button>
                                    <Link
                                        to="/login"
                                        className="ecosystem-hero__login"
                                        onClick={() => {
                                            localStorage.removeItem('token');
                                            localStorage.removeItem('user');
                                        }}
                                    >
                                        Entrar na plataforma
                                    </Link>
                                </div>
                                <div className="ecosystem-hero__trust">
                                    <span>Tecnologia inteligente</span>
                                    <span>Cuidado contínuo</span>
                                    <span>Dados e ciência</span>
                                </div>
                            </Col>
                            <Col xl={6} lg={6} className="hero-ecosystem-col">
                                <div className="hero-ecosystem-visual">
                                    <img
                                        src={img01}
                                        alt="Ecossistema AutisConnect com a pessoa com TEA no centro, conectando família, profissionais, clínica, gestão e ferramentas de acompanhamento"
                                        className="hero-ecosystem-image"
                                        width="1150"
                                        height="1368"
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="async"
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-problem">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={5}>
                                <span className="landing-section__label">O problema</span>
                                <h2>Muitos profissionais. Muitos registros. Pouca integração.</h2>
                                <p>
                                    A jornada da pessoa com TEA pode envolver família, psicologia, fonoaudiologia, terapia ocupacional, ABA, clínicas e outros profissionais.
                                </p>
                                <p>
                                    O problema é que grande parte dessas informações permanece fragmentada, dificultando uma visão contínua do desenvolvimento.
                                </p>
                            </Col>
                            <Col lg={7}>
                                <div className="problem-visual">
                                    <img
                                        src={img02}
                                        alt="Ecossistema integrado AutisConnect conectando pessoa com TEA, pais e responsáveis, profissionais, clínica, gestão e inteligência de dados"
                                        className="problem-ecosystem-image"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="ecosystem-question">
                    <Container>
                        <div className="ecosystem-question__panel">
                            <span className="landing-section__label">A grande virada</span>
                            <h2>E se a pessoa com TEA fosse o centro de tudo?</h2>
                            <p>
                                O AutisConnect organiza diferentes perspectivas em torno da mesma jornada: família, profissionais, clínica, dados e inteligência trabalhando de forma conectada.
                            </p>
                            <div className="ecosystem-question__flow">
                                {['Família', 'Profissionais', 'Clínica', 'Dados', 'Inteligência'].map((item) => (
                                    <span key={item}>{item}</span>
                                ))}
                            </div>
                        </div>
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-platform" id="plataforma">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">AutisConnect — o ecossistema</span>
                            <h2>Um ecossistema. Uma jornada. Uma visão integrada.</h2>
                            <p>
                                Cada público acessa ferramentas adequadas à sua rotina, mas todos trabalham sobre partes de uma mesma jornada.
                            </p>
                        </div>
                        <div className="ecosystem-connected-board">
                            <div className="ecosystem-connected-board__person">
                                <Heart size={34} />
                                <strong>Pessoa com TEA</strong>
                                <span>Acompanhamento, desenvolvimento e evolução</span>
                            </div>
                            <Row className="g-4">
                                {ecosystemGroups.map((group) => (
                                    <Col key={group.title} lg={3} md={6}>
                                        <Card className="landing-card ecosystem-group-card h-100">
                                            <Card.Body>
                                                <div className="ecosystem-group-card__icon">{group.icon}</div>
                                                <h3>{group.title}</h3>
                                                <p>{group.description}</p>
                                                <div className="ecosystem-group-card__tags">
                                                    {group.items.map((item) => (
                                                        <span key={item}>{item}</span>
                                                    ))}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-beyond" id="solucoes">
                    <Container>
                        <Row className="align-items-end g-4 mb-4">
                            <Col lg={7}>
                                <span className="landing-section__label">Fomos além da gestão</span>
                                <h2>Dados que ajudam a compreender a evolução.</h2>
                                <p>
                                    Monitoramentos, atividades e inteligência organizam sinais relevantes para apoiar profissionais e famílias, sem substituir avaliação clínica ou tomada de decisão profissional.
                                </p>
                            </Col>
                            <Col lg={5}>
                                <div className="ecosystem-beyond__insight">
                                    <GraphUp size={26} />
                                    <span>Uma leitura mais contínua da jornada, com dados visuais e contexto compartilhado.</span>
                                </div>
                            </Col>
                        </Row>
                        <Row className="g-4">
                            {beyondManagementPillars.map((pillar) => (
                                <Col key={pillar.title} xl={4} md={6}>
                                    <Card className="landing-card ecosystem-pillar-card h-100">
                                        <Card.Body>
                                            <div className="ecosystem-pillar-card__top">
                                                <div className="ecosystem-pillar-card__icon">{pillar.icon}</div>
                                                <div className="ecosystem-pillar-card__signal">
                                                    {pillar.bars.map((bar, index) => (
                                                        <DataLine key={`${pillar.title}-${bar}-${index}`} width={bar} />
                                                    ))}
                                                </div>
                                            </div>
                                            <h3>{pillar.title}</h3>
                                            <p>{pillar.description}</p>
                                            <FeatureLink feature={pillar} />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-games" id="games-terapeuticos">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Games terapêuticos</span>
                            <h2>Aprender também pode ser divertido.</h2>
                            <p>Jogos digitais com foco em habilidades cognitivas, emocionais e comportamentais.</p>
                        </div>
                        <Row className="g-4">
                            {games.map((game) => (
                                <Col key={game.title} lg={3} md={6}>
                                    <Card className="landing-card ecosystem-game-card h-100">
                                        <div className="ecosystem-game-card__image">
                                            <Card.Img src={game.image} alt={game.title} />
                                        </div>
                                        <Card.Body>
                                            <h3>{game.title}</h3>
                                            <p>{game.benefit}</p>
                                            <div className="ecosystem-game-card__objective">
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

                <section className="ecosystem-section ecosystem-architecture">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Arquitetura da plataforma</span>
                            <h2>Uma plataforma. Diferentes níveis de inteligência.</h2>
                            <p>Da jornada da pessoa com TEA à decisão estratégica, sem tirar a pessoa acompanhada do centro.</p>
                        </div>
                        <div className="ecosystem-architecture__canvas">
                            <div className="ecosystem-architecture__center">
                                <img src={logonovo} alt="" />
                                <strong>Pessoa com TEA</strong>
                                <span>Uma pessoa. Uma jornada. Diferentes perspectivas conectadas.</span>
                            </div>
                            <Row className="g-4">
                                {architectureLayers.map((layer) => (
                                    <Col key={layer.title} lg={3} md={6}>
                                        <Card className="landing-card ecosystem-layer-card h-100">
                                            <Card.Body>
                                                <h3>{layer.title}</h3>
                                                <p>{layer.description}</p>
                                                <div className="ecosystem-layer-card__items">
                                                    {layer.items.map((item) => (
                                                        <span key={item}>{item}</span>
                                                    ))}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                            <div className="ecosystem-dashboard-strip">
                                <MiniDashboard title="Paciente" eyebrow="Jornada" lines={[58, 78, 64]} variant="white" />
                                <MiniDashboard title="Pais" eyebrow="Participação" lines={[70, 52, 82]} variant="cyan" />
                                <MiniDashboard title="Profissional" eyebrow="Acompanhamento" lines={[62, 76, 50]} variant="white" />
                                <MiniDashboard title="Clínica" eyebrow="Operação" lines={[84, 56, 72]} variant="blue" />
                                <MiniDashboard title="Executivo" eyebrow="Decisão" lines={[46, 68, 88]} variant="cyan" />
                            </div>
                        </div>
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-professionals" id="profissionais">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={5}>
                                <img src={servico2} alt="Profissional analisando indicadores" className="ecosystem-photo-card" />
                            </Col>
                            <Col lg={7}>
                                <span className="landing-section__label">Para profissionais</span>
                                <h2>Mais contexto para acompanhar cada pessoa.</h2>
                                <p>
                                    Tenha acesso a ferramentas que ajudam a compreender o desenvolvimento dos seus pacientes de forma mais ampla e estruturada.
                                </p>
                                <Row className="g-3">
                                    {professionalBenefits.map((benefit) => (
                                        <Col md={6} key={benefit}>
                                            <div className="ecosystem-benefit-item">
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

                <section className="ecosystem-section ecosystem-families" id="familias">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={7}>
                                <span className="landing-section__label">Famílias</span>
                                <h2>A família também faz parte da jornada.</h2>
                                <p>
                                    Famílias deixam de acompanhar apenas por relatos soltos e passam a participar do processo com registros, indicadores, atividades e comunicação conectada.
                                </p>
                                <Row className="g-3">
                                    {familyBenefits.map((benefit) => (
                                        <Col md={6} key={benefit}>
                                            <div className="ecosystem-benefit-item">
                                                <CheckCircle size={22} />
                                                <span>{benefit}</span>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                            <Col lg={5}>
                                <img src={servico1} alt="Família acompanhando desenvolvimento" className="ecosystem-photo-card" />
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-clinic" id="clinicas">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={5}>
                                <span className="landing-section__label">Dashboard Clínica</span>
                                <h2>A operação da clínica conectada ao cuidado.</h2>
                                <p>
                                    A gestão clínica aparece como uma camada operacional do ecossistema: organiza equipe, agenda, pacientes e financeiro sem deslocar a pessoa com TEA do centro.
                                </p>
                                <div className="ecosystem-feature-list">
                                    {clinicFeatures.map((feature) => (
                                        <span key={feature}><CheckCircle size={16} /> {feature}</span>
                                    ))}
                                </div>
                                <Button
                                    as="a"
                                    href={DEMO_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ecosystem-btn ecosystem-btn--primary mt-4"
                                    onClick={() => trackEvent(TRACKING_EVENTS.dashboardClick, { dashboard: 'Dashboard Clínica' })}
                                >
                                    Conhecer Dashboard Clínica <ArrowRight size={17} />
                                </Button>
                            </Col>
                            <Col lg={7}>
                                <div className="ecosystem-desktop-mockup ecosystem-desktop-mockup--clinic">
                                    <div className="ecosystem-desktop-mockup__bar">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <div className="ecosystem-desktop-mockup__body">
                                        <aside>
                                            {['Visão', 'Agenda', 'Pacientes', 'Equipe', 'Fin.'].map((item) => (
                                                <i key={item}>{item}</i>
                                            ))}
                                        </aside>
                                        <main>
                                            <div className="ecosystem-mockup-header">
                                                <strong>Operação conectada</strong>
                                                <small>cuidado + rotina clínica</small>
                                            </div>
                                            <div className="ecosystem-mockup-cards">
                                                <MiniDashboard title="Agenda" eyebrow="Hoje" lines={[74, 54, 82]} variant="white" />
                                                <MiniDashboard title="Equipe" eyebrow="Atendimentos" lines={[58, 72, 66]} variant="cyan" />
                                                <MiniDashboard title="Financeiro" eyebrow="Resumo" lines={[44, 68, 78]} variant="blue" />
                                            </div>
                                            <div className="ecosystem-mockup-table">
                                                {['Paciente acompanhado', 'Profissional responsável', 'Status terapêutico'].map((item) => (
                                                    <span key={item}>{item}<DataLine width={70} /></span>
                                                ))}
                                            </div>
                                        </main>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-executive">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={7}>
                                <div className="ecosystem-desktop-mockup ecosystem-desktop-mockup--executive">
                                    <div className="ecosystem-desktop-mockup__bar">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <div className="ecosystem-executive-grid">
                                        <MiniDashboard title="Receita" eyebrow="Indicadores" lines={[68, 82, 56]} variant="white" />
                                        <MiniDashboard title="DRE" eyebrow="Gestão" lines={[44, 64, 78]} variant="cyan" />
                                        <MiniDashboard title="Fluxo" eyebrow="Caixa" lines={[72, 52, 88]} variant="blue" />
                                        <MiniDashboard title="Alertas" eyebrow="IA" lines={[50, 70, 60]} variant="white" />
                                    </div>
                                </div>
                            </Col>
                            <Col lg={5}>
                                <span className="landing-section__label">Dashboard Executivo</span>
                                <h2>Da operação à decisão estratégica.</h2>
                                <p>
                                    O AutisConnect também ajuda a organização que sustenta o atendimento a acompanhar indicadores, produtividade, alertas e inteligência gerencial.
                                </p>
                                <div className="ecosystem-feature-list">
                                    {executiveFeatures.map((feature) => (
                                        <span key={feature}><CheckCircle size={16} /> {feature}</span>
                                    ))}
                                </div>
                                <Button
                                    as="a"
                                    href={DEMO_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="outline-light"
                                    className="ecosystem-btn ecosystem-btn--light mt-4"
                                    onClick={() => trackEvent(TRACKING_EVENTS.dashboardClick, { dashboard: 'Dashboard Executivo' })}
                                >
                                    Conhecer Dashboard Executivo <ArrowRight size={17} />
                                </Button>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-service-search" id="servicos-rede-tea">
                    <Container>
                        <div className="landing-section__heading">
                            <span className="landing-section__label">Rede TEA</span>
                            <h2>Um ecossistema que também conecta pessoas a serviços.</h2>
                            <p>
                                Busque clínicas, terapias, profissionais, atividades e serviços de apoio por cidade, região, especialidade, modalidade, faixa etária, tipo de atendimento e localização.
                            </p>
                        </div>

                        <Card className="landing-card ecosystem-service-search__panel">
                            <Card.Body>
                                <Form onSubmit={handleServiceSearch}>
                                    <Row className="g-3 align-items-end">
                                        <Col lg={5} md={12}>
                                            <Form.Label>Especialidade, serviço ou palavra-chave</Form.Label>
                                            <div className="ecosystem-service-search__main-field">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Ex: ABA, fonoaudiologia, terapia, clínica"
                                                    value={serviceFilters.search}
                                                    onChange={(event) => updateServiceFilter('search', event.target.value)}
                                                />
                                                <Button type="submit" className="ecosystem-btn ecosystem-btn--primary">
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
                                                    placeholder="Bairro ou região"
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
                                            <Form.Label>Tipo de atendimento</Form.Label>
                                            <div className="ecosystem-service-search__checks">
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
                                            <div className="ecosystem-service-search__checks">
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
                                            <div className="ecosystem-service-search__actions">
                                                <Button type="button" variant="outline-primary" onClick={handleUseMyLocation}>
                                                    <GeoAlt size={17} /> Usar localização
                                                </Button>
                                                <Button type="button" variant="outline-secondary" onClick={handleServiceClear}>
                                                    Limpar filtros
                                                </Button>
                                            </div>
                                            {serviceGeoStatus && <small className="text-muted d-block mt-2">{serviceGeoStatus}</small>}
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>

                        <div className="ecosystem-service-search__toolbar">
                            <div>
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
                                            <Card className="landing-card ecosystem-service-card h-100">
                                                <Card.Body>
                                                    <div className="ecosystem-service-card__head">
                                                        <div>
                                                            <span>Serviço cadastrado</span>
                                                            <h3>{service.name}</h3>
                                                        </div>
                                                        {service.distanceKm !== null && service.distanceKm !== undefined ? (
                                                            <Badge bg="light" text="dark">
                                                                {Number(service.distanceKm).toFixed(1)} km
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <div className="ecosystem-service-card__location">
                                                        <GeoAlt size={15} />
                                                        {locationText || 'Localização não informada'}
                                                    </div>
                                                    <div className="ecosystem-service-card__badges">
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
                                                    <div className="ecosystem-service-card__rating">
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
                            <Alert variant="info" className="border-0 shadow-sm ecosystem-service-search__empty">
                                Use os filtros acima para encontrar serviços especializados que atendem TEA.
                            </Alert>
                        )}
                    </Container>
                </section>

                <section className="ecosystem-section ecosystem-validation">
                    <Container>
                        <Row className="align-items-center g-4">
                            <Col lg={5}>
                                <span className="landing-section__label">Validação e credibilidade</span>
                                <h2>Construído com escuta do ecossistema TEA.</h2>
                                <p>
                                    Uma base institucional discreta, sem promessas infladas: foco em tecnologia, cuidado humano e evolução contínua.
                                </p>
                            </Col>
                            <Col lg={7}>
                                <Row className="g-3">
                                    {validationItems.map((item, index) => (
                                        <Col md={6} key={item}>
                                            <Card className="landing-card ecosystem-validation-card h-100">
                                                <Card.Body>
                                                    {index === 0 ? <Award size={32} /> : <People size={32} />}
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

                <section className="landing-final-cta ecosystem-final-cta">
                    <Container>
                        <img src={logonovo} alt="AutisConnect" className="ecosystem-final-cta__logo" />
                        <h2>O futuro do acompanhamento do TEA é integrado, contínuo e orientado por dados.</h2>
                        <p>Estamos construindo esse futuro.</p>
                        <div className="landing-final-cta__actions">
                            <Button
                                as="a"
                                href={DEMO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="light"
                                size="lg"
                                onClick={() => trackEvent(TRACKING_EVENTS.demoClick, { location: 'final_cta' })}
                            >
                                Agendar demonstração
                            </Button>
                            <Button
                                as="a"
                                href="#plataforma"
                                variant="outline-light"
                                size="lg"
                                onClick={() => trackEvent(TRACKING_EVENTS.platformClick, { location: 'final_cta' })}
                            >
                                Conhecer a plataforma
                            </Button>
                            <Button
                                as="a"
                                href={getWhatsAppUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outline-light"
                                size="lg"
                                onClick={() => trackEvent(TRACKING_EVENTS.whatsappClick, { location: 'final_cta' })}
                            >
                                <Whatsapp size={18} /> Falar com especialista
                            </Button>
                        </div>
                    </Container>
                </section>
            </main>

            <footer className="footer-section ecosystem-footer py-4">
                <Container>
                    <div className="ecosystem-footer__top">
                        <img src={logonovo} alt="AutisConnect" className="footer-logo" />
                        <div className="ecosystem-footer__trust">
                            {footerTrustItems.map((item) => (
                                <span key={item}>{item}</span>
                            ))}
                        </div>
                    </div>
                    <Row className="justify-content-between align-items-center text-center text-md-start mt-4">
                        <Col md={4} className="mb-4 mb-md-0 footer-left">
                            <p className="mb-0">
                                {'\u00a9'} {new Date().getFullYear()} Nf Representações Comerciais Ltda.<br />
                                <small>Todos os direitos reservados.</small>
                            </p>
                        </Col>
                        <Col md={4} className="mb-4 mb-md-0 text-center">
                            <strong>Conectamos hoje para transformar amanhã.</strong>
                        </Col>
                        <Col md={4} className="text-md-end text-white-50">
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
                        </Col>
                    </Row>
                </Container>
            </footer>
        </>
    );
};

export default Home;
