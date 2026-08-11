import React from 'react';
import { Activity, ArrowLeft, BarChartLine, Heart, ShieldCheck } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import logohori from './assets/logonovo.png';

const featureItems = [
    {
        icon: Activity,
        label: 'Monitoramento Inteligente'
    },
    {
        icon: BarChartLine,
        label: 'Dados & Ciencia'
    },
    {
        icon: Heart,
        label: 'Cuidado Humano'
    },
    {
        icon: ShieldCheck,
        label: 'Seguranca & Privacidade'
    }
];

function AuthScaffold({
    backTo = '/',
    backLabel = 'Voltar para o inicio',
    eyebrow,
    title,
    subtitle,
    children,
    footer,
    legal = '© 2026 Nf Representacoes Comerciais Ltda. Todos os direitos reservados.',
    cardClassName = ''
}) {
    const cardClasses = ['ac-login-card', cardClassName].filter(Boolean).join(' ');

    return (
        <div className="ac-login-page">
            <div className="ac-login-layout">
                <section className="ac-login-showcase" aria-label="Visao institucional do AutisConnect">
                    <div className="ac-login-showcase__grid" aria-hidden="true" />
                    <div className="ac-login-showcase__glow" aria-hidden="true" />

                    <div className="ac-login-showcase__content">
                        <Link to="/" className="ac-login-brand" aria-label="Voltar para o inicio">
                            <img src={logohori} alt="AutisConnect" className="ac-login-brand__logo" />
                        </Link>

                        <div className="ac-login-copy">
                            <span className="ac-login-kicker">Plataforma SaaS HealthTech</span>
                            <h1 className="ac-login-title">
                                Tecnologia que conecta.
                                <span>Cuidado que transforma.</span>
                            </h1>
                            <p className="ac-login-description">
                                Monitoramento inteligente, dados e tecnologia para aproximar familias,
                                profissionais e o desenvolvimento de pessoas com TEA.
                            </p>
                        </div>

                        <div className="ac-login-feature-grid">
                            {featureItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div key={item.label} className="ac-login-feature">
                                        <span className="ac-login-feature__icon">
                                            <Icon />
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
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
