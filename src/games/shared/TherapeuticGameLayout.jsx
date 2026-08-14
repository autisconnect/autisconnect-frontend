import React from 'react';
import { Button } from 'react-bootstrap';
import { ArrowLeft, Controller, PersonBadge, Speedometer2 } from 'react-bootstrap-icons';
import logoNovo from '../../assets/logonovo.png';
import './therapeuticGameLayout.css';

const STATUS_META = {
    iniciando: {
        label: 'Preparando sessão',
        tone: 'info',
        helper: 'Configurando o ambiente terapêutico.'
    },
    rodando: {
        label: 'Em andamento',
        tone: 'success',
        helper: 'Jogo ativo com coleta de eventos.'
    },
    aguardando: {
        label: 'Pronto para avançar',
        tone: 'info',
        helper: 'A sessão atual foi concluída.'
    },
    avancando: {
        label: 'Carregando próximo nível',
        tone: 'info',
        helper: 'Preparando a próxima etapa do desafio.'
    },
    reiniciando: {
        label: 'Reiniciando nível',
        tone: 'warning',
        helper: 'A experiência será iniciada novamente.'
    },
    finalizado: {
        label: 'Sessão finalizada',
        tone: 'neutral',
        helper: 'A sessão foi encerrada com segurança.'
    },
    erro: {
        label: 'Erro de inicialização',
        tone: 'danger',
        helper: 'Houve um problema ao carregar o jogo.'
    }
};

function getStatusMeta(status) {
    return STATUS_META[status] || {
        label: status || 'Status da sessão',
        tone: 'neutral',
        helper: 'Acompanhamento do estado atual do jogo.'
    };
}

export default function TherapeuticGameLayout({
    tone = 'emotion',
    title,
    subtitle,
    patientId,
    levelId,
    maxLevel,
    status,
    error,
    statusMessage,
    onExit,
    stageTitle,
    stageDescription,
    supportCards = [],
    footer,
    children
}) {
    const statusMeta = getStatusMeta(status);

    return (
        <div className={`ac-game-shell ac-game-shell--${tone}`}>
            <aside className="ac-game-sidebar">
                <div className="ac-game-sidebar__brand">
                    <img src={logoNovo} alt="AutisConnect" className="ac-game-sidebar__logo" />
                    <div className="ac-game-sidebar__copy">
                        <span>AutisConnect Games</span>
                        <strong>{title}</strong>
                    </div>
                </div>

                <div className="ac-game-sidebar__intro">
                    <span className="ac-game-kicker">Workspace Terapêutico</span>
                    <p>{subtitle}</p>
                </div>

                <div className="ac-game-sidebar__metrics">
                    <article className="ac-game-sidebar__metric">
                        <div className="ac-game-sidebar__metric-icon">
                            <PersonBadge />
                        </div>
                        <div>
                            <span>Paciente</span>
                            <strong>{patientId ? `#${patientId}` : 'Não identificado'}</strong>
                            <small>Vinculado ao contexto clínico correto.</small>
                        </div>
                    </article>

                    <article className="ac-game-sidebar__metric">
                        <div className="ac-game-sidebar__metric-icon">
                            <Speedometer2 />
                        </div>
                        <div>
                            <span>Progressão</span>
                            <strong>{maxLevel ? `Nível ${levelId} de ${maxLevel}` : `Nível ${levelId}`}</strong>
                            <small>Evolução progressiva da experiência terapêutica.</small>
                        </div>
                    </article>

                    <article className={`ac-game-sidebar__metric is-${statusMeta.tone}`}>
                        <div className="ac-game-sidebar__metric-icon">
                            <Controller />
                        </div>
                        <div>
                            <span>Status da sessão</span>
                            <strong>{statusMeta.label}</strong>
                            <small>{statusMeta.helper}</small>
                        </div>
                    </article>
                </div>

                <div className="ac-game-sidebar__support">
                    {supportCards.map((card) => (
                        <article key={card.label} className="ac-game-support-card">
                            <span>{card.label}</span>
                            <strong>{card.value}</strong>
                            <p>{card.description}</p>
                        </article>
                    ))}
                </div>

                <div className="ac-game-sidebar__footer">
                    Tecnologia que conecta. Cuidado que transforma.
                </div>
            </aside>

            <main className="ac-game-main">
                <header className="ac-game-header">
                    <div>
                        <div className="ac-game-breadcrumb">Jogos Terapêuticos / {title}</div>
                        <h1>{title}</h1>
                        <p>{subtitle}</p>
                    </div>

                    <Button variant="outline-primary" className="ac-game-exit" onClick={onExit}>
                        <ArrowLeft className="me-2" />
                        Voltar
                    </Button>
                </header>

                <section className="ac-game-context">
                    <div>
                        <span className="ac-game-kicker">Ambiente de jogo</span>
                        <h2>{stageTitle}</h2>
                        <p>{stageDescription}</p>
                    </div>

                    <div className="ac-game-context__pills">
                        <span className="ac-game-pill">Paciente {patientId ? `#${patientId}` : 'não identificado'}</span>
                        <span className="ac-game-pill">Nível {levelId}</span>
                        <span className={`ac-game-pill is-${statusMeta.tone}`}>{statusMeta.label}</span>
                    </div>
                </section>

                {error ? (
                    <div className="ac-game-banner is-danger">
                        <strong>Atenção:</strong> {error}
                    </div>
                ) : null}

                {statusMessage ? (
                    <div className={`ac-game-banner is-${statusMeta.tone}`}>
                        <strong>Atualização da sessão:</strong> {statusMessage}
                    </div>
                ) : null}

                <section className="ac-game-stage">
                    <div className="ac-game-stage__header">
                        <div>
                            <span className="ac-game-kicker">Experiência interativa</span>
                            <h3>Área principal do jogo</h3>
                            <p>O motor do jogo permanece intacto, agora dentro de uma moldura premium alinhada ao ecossistema AutisConnect.</p>
                        </div>
                        <span className={`ac-game-stage__status is-${statusMeta.tone}`}>{statusMeta.label}</span>
                    </div>

                    <div className="ac-game-stage__ribbon" />

                    <div className="ac-game-stage__body">
                        {children}
                    </div>
                </section>

                <footer className="ac-game-footer">
                    {footer}
                </footer>
            </main>
        </div>
    );
}
