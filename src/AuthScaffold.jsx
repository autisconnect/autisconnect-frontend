import React from 'react';
import { Activity, ArrowLeft, BarChartLine, CloudArrowUp, Heart, ShieldCheck } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import logohori from './assets/logonovo.png';

const featureItems = [
    {
        icon: Activity,
        label: 'Monitoramento Inteligente',
        description: 'Acompanhe evolucoes em tempo real com dashboards inteligentes e personalizados.'
    },
    {
        icon: BarChartLine,
        label: 'Dados & Ciencia',
        description: 'Decisoes baseadas em dados confiaveis e analises avancadas para melhores resultados.'
    },
    {
        icon: Heart,
        label: 'Cuidado Humano',
        description: 'Conexao, empatia e suporte para familias e profissionais em cada etapa da jornada.'
    },
    {
        icon: ShieldCheck,
        label: 'Seguranca & Privacidade',
        description: 'Protecao total dos dados com tecnologia segura, confiavel e em conformidade com a LGPD.'
    }
];

const showcaseMetrics = [
    {
        value: '24/7',
        label: 'Cuidado continuo'
    },
    {
        value: '360°',
        label: 'Jornada integrada'
    },
    {
        value: 'TEA',
        label: 'Experiencia especializada'
    }
];

const showcasePalette = ['#2563EB', '#38BDF8', '#06B6D4', '#08172F', '#E61F44'];

function AuthScaffold({
    backTo = '/',
    backLabel = 'Voltar para o inicio',
    eyebrow,
    title,
    subtitle,
    children,
    footer,
    legal = '© 2026 Nf Representacoes Comerciais Ltda. Todos os direitos reservados.',
    cardClassName = '',
    pageClassName = '',
    showPremiumPanel = true,
    showcaseMode = 'full'
}) {
    const pageClasses = ['ac-login-page', pageClassName].filter(Boolean).join(' ');
    const cardClasses = ['ac-login-card', cardClassName].filter(Boolean).join(' ');
    const isCompactShowcase = showcaseMode === 'compact';
    const showcaseContentClasses = [
        'ac-login-showcase__content',
        isCompactShowcase ? 'ac-login-showcase__content--compact' : ''
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={pageClasses}>
            <div className="ac-login-layout">
                <section className="ac-login-showcase" aria-label="Visao institucional do AutisConnect">
                    <div className="ac-login-showcase__grid" aria-hidden="true" />
                    <div className="ac-login-showcase__glow" aria-hidden="true" />

                    <div className={showcaseContentClasses}>
                        <Link to="/" className="ac-login-brand" aria-label="Voltar para o inicio">
                            <img src={logohori} alt="AutisConnect" className="ac-login-brand__logo" />
                        </Link>

                        <div className="ac-login-copy">
                            {!isCompactShowcase ? (
                                <span className="ac-login-kicker">
                                    <CloudArrowUp />
                                    <span>PLATAFORMA SAAS HEALTHTECH</span>
                                </span>
                            ) : null}
                            <h1 className="ac-login-title">
                                Tecnologia que conecta.
                                <span>Cuidado que transforma.</span>
                            </h1>
                            {!isCompactShowcase ? (
                                <p className="ac-login-description">
                                    Monitoramento inteligente, dados e tecnologia para aproximar familias,
                                    profissionais e o desenvolvimento de pessoas com TEA.
                                </p>
                            ) : null}
                        </div>

                        {!isCompactShowcase ? (
                            <div className="ac-login-feature-grid">
                                {featureItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div key={item.label} className="ac-login-feature">
                                            <span className="ac-login-feature__icon">
                                                <Icon />
                                            </span>
                                            <div className="ac-login-feature__copy">
                                                <strong className="ac-login-feature__label">{item.label}</strong>
                                                <p className="ac-login-feature__description">{item.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}

                        {showPremiumPanel ? (
                            <div className="ac-login-premium-panel" aria-label="Assinatura visual premium">
                                <div className="ac-login-premium-panel__header">
                                    <span>AutisConnect Premium</span>
                                    <strong>Uma entrada visualmente alinhada ao cuidado, aos dados e a identidade da marca.</strong>
                                </div>
                                <div className="ac-login-premium-panel__metrics">
                                    {showcaseMetrics.map((metric) => (
                                        <div key={metric.label} className="ac-login-premium-panel__metric">
                                            <strong>{metric.value}</strong>
                                            <span>{metric.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="ac-login-premium-panel__palette" aria-hidden="true">
                                    {showcasePalette.map((color) => (
                                        <i key={color} style={{ background: color }} />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="ac-login-ribbon" aria-hidden="true" />
                </section>

                <section className="ac-login-panel">
                    <div className="ac-login-panel__content">
                        <div className="ac-login-mobile-brand">
                            <Link to="/" className="ac-login-brand ac-login-brand--mobile" aria-label="Voltar para o inicio">
                                <img src={logohori} alt="AutisConnect" className="ac-login-brand__logo" />
                            </Link>
                            <div className="ac-login-mobile-ribbon" aria-hidden="true" />
                        </div>

                        <Link to={backTo} className="ac-login-backlink">
                            <ArrowLeft size={18} />
                            <span>{backLabel}</span>
                        </Link>

                        <div className={cardClasses}>
                            {eyebrow ? <span className="ac-login-card__eyebrow">{eyebrow}</span> : null}
                            {title ? <h2 className="ac-login-card__title">{title}</h2> : null}
                            {subtitle ? <p className="ac-login-card__subtitle">{subtitle}</p> : null}

                            {children}

                            {footer ? <div className="ac-login-footer">{footer}</div> : null}
                        </div>

                        {legal ? <p className="ac-login-legal">{legal}</p> : null}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AuthScaffold;
