import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import {
    ArrowLeft,
    BarChartLine,
    ClipboardPlus,
    ClockHistory,
    FileEarmarkMedical,
    GraphUpArrow,
    JournalText,
    Lightbulb,
    ShieldCheck,
    Stars
} from 'react-bootstrap-icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import AbaSessionsList from '../components/AbaSessionsList';
import AbaSessionForm from '../components/AbaSessionForm';
import AbaCharts from '../components/AbaCharts';
import AbaAiAnalysis from '../components/AbaAiAnalysis';
import AbaForecast from '../components/AbaForecast';
import AbaProgramMonitoring from '../components/AbaProgramMonitoring';
import AbaProgramReplacement from '../components/AbaProgramReplacement';
import AbaProgramClosure from '../components/AbaProgramClosure';
import AbaProgramSuggestions from '../components/AbaProgramSuggestions';
import AbaReport from './AbaReport';

import abaService from '../services/abaService';
import abaAiService from '../services/abaAiService';

import logonovo from '../assets/logonovo.png';
import '../DashboardABA.css';
import './AbaPatient.css';

const NAVIGATION_ITEMS = [
    { key: 'dashboard', label: 'Visão Geral', icon: BarChartLine },
    { key: 'sessions', label: 'Sessões', icon: ClockHistory },
    { key: 'new-session', label: 'Nova Sessão', icon: ClipboardPlus },
    { key: 'charts', label: 'Gráficos', icon: GraphUpArrow },
    { key: 'analysis', label: 'Insights', icon: Stars, tag: 'IA' },
    { key: 'forecast', label: 'Previsão', icon: Lightbulb, tag: 'IA' },
    { key: 'monitoring', label: 'Monitoramento', icon: ShieldCheck },
    { key: 'suggestions', label: 'Sugestões', icon: JournalText, tag: 'IA' },
    { key: 'report', label: 'Relatório', icon: FileEarmarkMedical }
];

function formatPercent(value) {
    if (!Number.isFinite(Number(value))) {
        return '--';
    }

    return `${Math.round(Number(value))}%`;
}

function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return '--';
    }

    return value;
}

function getStatusTone(status) {
    const normalizedStatus = String(status || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

    switch (normalizedStatus) {
    case 'PROGRESSO':
        return 'success';
    case 'ESTAVEL':
        return 'info';
    case 'ESTAGNACAO':
        return 'warning';
    case 'REGRESSAO':
        return 'danger';
    default:
        return 'neutral';
    }
}

function getStatusLabel(status) {
    const normalizedStatus = String(status || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

    switch (normalizedStatus) {
    case 'PROGRESSO':
        return 'Progresso';
    case 'ESTAVEL':
        return 'Estável';
    case 'ESTAGNACAO':
        return 'Estagnação';
    case 'REGRESSAO':
        return 'Regressão';
    default:
        return status || 'Sem classificação';
    }
}

function EmptyState({ icon: Icon, title, description, note }) {
    return (
        <div className="ac-aba-empty-state">
            <div className="ac-aba-empty-state__icon">
                <Icon />
            </div>
            <strong>{title}</strong>
            <p>{description}</p>
            {note ? <small>{note}</small> : null}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="ac-aba-loading-shell">
            <div className="ac-aba-skeleton ac-aba-skeleton--title" />
            <div className="ac-aba-skeleton ac-aba-skeleton--paragraph" />
            <div className="ac-aba-loading-grid">
                <div className="ac-aba-skeleton ac-aba-skeleton--card" />
                <div className="ac-aba-skeleton ac-aba-skeleton--card" />
                <div className="ac-aba-skeleton ac-aba-skeleton--card" />
                <div className="ac-aba-skeleton ac-aba-skeleton--card" />
            </div>
            <div className="ac-aba-loading-grid ac-aba-loading-grid--main">
                <div className="ac-aba-skeleton ac-aba-skeleton--panel" />
                <div className="ac-aba-skeleton ac-aba-skeleton--panel" />
            </div>
        </div>
    );
}

const AbaPatient = () => {
    const { patientId: routePatientId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const queryPatientId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('patientId');
    }, [location.search]);

    const patientId = routePatientId || queryPatientId || null;

    const [activeTab, setActiveTab] = useState('dashboard');
    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [monitoring, setMonitoring] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsError, setSuggestionsError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const loadAbaData = useCallback(async () => {
        if (!patientId) {
            setSessions([]);
            setAnalytics(null);
            setForecast(null);
            setMonitoring(null);
            setSuggestions([]);
            setSuggestionsError(null);
            setLoadError('Paciente não identificado.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError(null);
        setSuggestionsError(null);

        const results = await Promise.allSettled([
            abaService.getSessions(patientId),
            abaAiService.getAnalytics(patientId),
            abaAiService.getForecast(patientId),
            abaAiService.getMonitoring(patientId),
            abaAiService.getProgramSuggestions(patientId)
        ]);

        const [sessionsRes, analyticsRes, forecastRes, monitoringRes, suggestionsRes] = results;

        if (sessionsRes.status === 'fulfilled') {
            setSessions(Array.isArray(sessionsRes.value?.data) ? sessionsRes.value.data : []);
        } else {
            setSessions([]);
        }

        if (analyticsRes.status === 'fulfilled') {
            setAnalytics(analyticsRes.value?.data || null);
        } else {
            setAnalytics(null);
        }

        if (forecastRes.status === 'fulfilled') {
            setForecast(forecastRes.value?.data || null);
        } else {
            setForecast(null);
        }

        if (monitoringRes.status === 'fulfilled') {
            setMonitoring(monitoringRes.value?.data || null);
        } else {
            setMonitoring(null);
        }

        if (suggestionsRes.status === 'fulfilled') {
            const rawSuggestions = Array.isArray(suggestionsRes.value?.data) ? suggestionsRes.value.data : [];
            const mappedSuggestions = rawSuggestions.map((suggestion) => {
                const reasonText = suggestion.reason || 'Sugestão gerada automaticamente';
                const normalizedReason = reasonText.toLowerCase();
                const priority = normalizedReason.includes('regress')
                    ? 'ALTA'
                    : normalizedReason.includes('estagna')
                        ? 'MÉDIA'
                        : 'BAIXA';

                return {
                    programName: suggestion.suggestion?.programName || suggestion.basedOnProgram || 'Programa sugerido',
                    objective: suggestion.basedOnProgram
                        ? `Ajustar o programa ${suggestion.basedOnProgram}`
                        : 'Aprimorar o plano terapêutico',
                    reason: reasonText,
                    priority
                };
            });

            setSuggestions(mappedSuggestions);
            setSuggestionsError(null);
        } else {
            setSuggestions([]);
            setSuggestionsError('Sugestões automáticas indisponíveis no momento.');
        }

        const hasSuccess = results.some((result) => result.status === 'fulfilled');
        if (!hasSuccess) {
            setLoadError('Erro ao carregar dados ABA.');
        }

        setLoading(false);
    }, [patientId]);

    useEffect(() => {
        loadAbaData();
    }, [loadAbaData]);

    const handleExit = () => {
        if (patientId) {
            navigate(`/patient-details/${patientId}`);
            return;
        }

        navigate(-1);
    };

    const contextPills = useMemo(() => ([
        {
            label: 'Paciente',
            value: patientId ? `Vinculado ao prontuário ${patientId}` : 'Não identificado',
            tone: patientId ? 'info' : 'warning'
        },
        {
            label: 'Monitoramento',
            value: monitoring?.status ? getStatusLabel(monitoring.status) : 'Sem leitura disponível',
            tone: monitoring?.status ? getStatusTone(monitoring.status) : 'neutral'
        },
        {
            label: 'Sugestões IA',
            value: suggestions.length ? `${suggestions.length} recomendação(ões)` : (suggestionsError || 'Aguardando base suficiente'),
            tone: suggestions.length ? 'info' : 'neutral'
        }
    ]), [monitoring, patientId, suggestions.length, suggestionsError]);

    const kpiCards = useMemo(() => ([
        {
            label: 'Taxa média de acerto',
            value: formatPercent(analytics?.avgAccuracy),
            helper: 'Leitura agregada das tentativas registradas para o paciente.'
        },
        {
            label: 'Dependência de prompt',
            value: formatPercent(analytics?.promptDependency),
            helper: 'Ajuda a visualizar o nível de suporte ainda necessário.'
        },
        {
            label: 'Generalização',
            value: formatPercent(analytics?.generalizationRate),
            helper: 'Indica a transferência de aprendizagem já observada.'
        },
        {
            label: 'Sessões avaliadas',
            value: formatValue(analytics?.totalSessions ?? sessions.length),
            helper: 'Total consolidado a partir das sessões carregadas.'
        }
    ]), [analytics?.avgAccuracy, analytics?.generalizationRate, analytics?.promptDependency, analytics?.totalSessions, sessions.length]);

    const renderDashboard = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Visão Geral ABA</span>
                    <h2>Central de evolução terapêutica</h2>
                    <p>Uma leitura integrada de sessões, gráficos, insights, previsão e monitoramento do acompanhamento ABA.</p>
                </div>
            </div>

            <div className="ac-aba-kpi-grid">
                {kpiCards.map((kpi) => (
                    <article key={kpi.label} className="ac-aba-kpi-card">
                        <span>{kpi.label}</span>
                        <strong>{kpi.value}</strong>
                        <small>{kpi.helper}</small>
                    </article>
                ))}
            </div>

            <div className="ac-aba-overview-grid">
                <div className="ac-aba-panel-card">
                    <div className="ac-aba-panel-header">
                        <div>
                            <span className="ac-aba-section-kicker">Gráficos</span>
                            <h3>Evolução das sessões e habilidades</h3>
                            <p>O módulo existente de gráficos continua responsável pela leitura clínica da evolução ABA.</p>
                        </div>
                    </div>

                    {sessions.length ? (
                        <div className="ac-aba-component-slot">
                            <AbaCharts sessions={sessions} />
                        </div>
                    ) : (
                        <EmptyState
                            icon={BarChartLine}
                            title="Nenhum dado de evolução disponível"
                            description="Os gráficos aparecerão assim que o paciente tiver sessões ABA registradas."
                        />
                    )}
                </div>

                <div className="ac-aba-insights-column">
                    {analytics ? (
                        <div className="ac-aba-component-slot">
                            <AbaAiAnalysis analytics={analytics} />
                        </div>
                    ) : (
                        <div className="ac-aba-panel-card">
                            <EmptyState
                                icon={Stars}
                                title="Insights ainda indisponíveis"
                                description="A análise complementar é exibida somente quando houver dados suficientes para interpretação segura."
                            />
                        </div>
                    )}

                    {forecast ? (
                        <div className="ac-aba-component-slot">
                            <AbaForecast forecast={forecast} sessions={sessions} />
                        </div>
                    ) : (
                        <div className="ac-aba-panel-card">
                            <EmptyState
                                icon={Lightbulb}
                                title="Previsão terapêutica indisponível"
                                description="A previsão de desempenho futuro aparecerá quando houver base suficiente para análise."
                            />
                        </div>
                    )}

                    {monitoring ? (
                        <div className="ac-aba-component-slot">
                            <AbaProgramMonitoring monitoring={monitoring} />
                        </div>
                    ) : (
                        <div className="ac-aba-panel-card">
                            <EmptyState
                                icon={ShieldCheck}
                                title="Monitoramento ainda não disponível"
                                description="Quando o serviço responder com dados válidos, os alertas de progresso, estabilidade ou possível regressão aparecerão aqui."
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );

    const renderSessions = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Histórico</span>
                    <h2>Sessões ABA registradas</h2>
                    <p>Acompanhe os lançamentos clínicos do paciente com a lista completa das sessões já registradas.</p>
                </div>
            </div>

            <div className="ac-aba-component-slot">
                <AbaSessionsList sessions={sessions} patientId={patientId} />
            </div>
        </section>
    );

    const renderNewSession = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Registro</span>
                    <h2>Nova sessão ABA</h2>
                    <p>Registre programa, habilidade, tentativas, prompt e observações clínicas no mesmo ambiente premium do prontuário.</p>
                </div>
            </div>

            <div className="ac-aba-component-slot">
                <AbaSessionForm patientId={patientId} onSaved={loadAbaData} />
            </div>
        </section>
    );

    const renderCharts = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Gráficos</span>
                    <h2>Visualização detalhada da evolução</h2>
                    <p>Explore os gráficos do módulo ABA com foco em consistência, aquisição e resposta às intervenções.</p>
                </div>
            </div>

            {sessions.length ? (
                <div className="ac-aba-component-slot">
                    <AbaCharts sessions={sessions} />
                </div>
            ) : (
                <div className="ac-aba-panel-card">
                    <EmptyState
                        icon={GraphUpArrow}
                        title="Sem gráficos para exibir"
                        description="Quando houver sessões registradas, esta área mostrará a evolução gráfica do paciente."
                    />
                </div>
            )}
        </section>
    );

    const renderAnalysis = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Insights</span>
                    <h2>Análise clínica complementar</h2>
                    <p>Insights e previsão aparecem apenas como apoio à leitura profissional do progresso terapêutico.</p>
                </div>
            </div>

            <div className="ac-aba-overview-grid">
                {analytics ? (
                    <div className="ac-aba-component-slot">
                        <AbaAiAnalysis analytics={analytics} />
                    </div>
                ) : (
                    <div className="ac-aba-panel-card">
                        <EmptyState
                            icon={Stars}
                            title="Sem insights disponíveis"
                            description="Ainda não há dados suficientes para gerar uma análise complementar segura."
                        />
                    </div>
                )}

                <div className="ac-aba-insights-column">
                    {forecast ? (
                        <div className="ac-aba-component-slot">
                            <AbaForecast forecast={forecast} sessions={sessions} />
                        </div>
                    ) : (
                        <div className="ac-aba-panel-card">
                            <EmptyState
                                icon={Lightbulb}
                                title="Sem previsão disponível"
                                description="A previsão de desempenho futuro será exibida quando houver base consistente para cálculo."
                            />
                        </div>
                    )}

                    {monitoring ? (
                        <div className="ac-aba-component-slot">
                            <AbaProgramMonitoring monitoring={monitoring} />
                        </div>
                    ) : (
                        <div className="ac-aba-panel-card">
                            <EmptyState
                                icon={ShieldCheck}
                                title="Sem monitoramento disponível"
                                description="O monitoramento do programa será exibido automaticamente quando o serviço retornar dados válidos."
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );

    const renderForecast = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Previsão</span>
                    <h2>Projeção terapêutica</h2>
                    <p>Use a leitura preditiva como apoio adicional ao planejamento, sempre com validação clínica.</p>
                </div>
            </div>

            {forecast ? (
                <div className="ac-aba-component-slot">
                    <AbaForecast forecast={forecast} sessions={sessions} />
                </div>
            ) : (
                <div className="ac-aba-panel-card">
                    <EmptyState
                        icon={Lightbulb}
                        title="Previsão ainda não disponível"
                        description="O serviço de previsão não retornou dados suficientes para este paciente."
                    />
                </div>
            )}
        </section>
    );

    const renderSuggestions = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Sugestões</span>
                    <h2>Recomendações inteligentes de programas</h2>
                    <p>As recomendações abaixo precisam de validação do profissional responsável antes de qualquer aplicação clínica.</p>
                </div>
            </div>

            <div className="ac-aba-component-slot">
                <AbaProgramSuggestions suggestions={suggestions} error={suggestionsError} />
            </div>
        </section>
    );

    const renderMonitoring = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Monitoramento</span>
                    <h2>Saúde do programa ABA</h2>
                    <p>Concentre aqui a leitura de progresso, estabilidade, estagnação ou possível regressão do programa em execução.</p>
                </div>
            </div>

            <div className="ac-aba-patient-stack">
                {monitoring ? (
                    <div className="ac-aba-component-slot">
                        <AbaProgramMonitoring monitoring={monitoring} />
                    </div>
                ) : (
                    <div className="ac-aba-panel-card">
                        <EmptyState
                            icon={ShieldCheck}
                            title="Monitoramento indisponível"
                            description="Quando houver dados válidos do serviço de monitoramento, as ações clínicas assistidas aparecerão nesta área."
                        />
                    </div>
                )}

                <div className="ac-aba-patient-action-grid">
                    <div className="ac-aba-component-slot">
                        <AbaProgramReplacement monitoring={monitoring} onActionCompleted={loadAbaData} />
                    </div>
                    <div className="ac-aba-component-slot">
                        <AbaProgramClosure monitoring={monitoring} onActionCompleted={loadAbaData} />
                    </div>
                </div>
            </div>
        </section>
    );

    const renderReport = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Relatório</span>
                    <h2>Documento clínico consolidado</h2>
                    <p>Gere uma visão consolidada do progresso ABA com gráficos, indicadores e leitura complementar já integrada ao módulo.</p>
                </div>
            </div>

            <div className="ac-aba-panel-card">
                <AbaReport patientId={patientId} embedded />
            </div>
        </section>
    );

    const renderActiveSection = () => {
        if (loading && activeTab !== 'new-session') {
            return <LoadingSkeleton />;
        }

        switch (activeTab) {
        case 'sessions':
            return renderSessions();
        case 'new-session':
            return renderNewSession();
        case 'charts':
            return renderCharts();
        case 'analysis':
            return renderAnalysis();
        case 'forecast':
            return renderForecast();
        case 'suggestions':
            return renderSuggestions();
        case 'monitoring':
            return renderMonitoring();
        case 'report':
            return renderReport();
        case 'dashboard':
        default:
            return renderDashboard();
        }
    };

    return (
        <div className="ac-aba-shell ac-aba-patient-shell">
            <aside className="ac-aba-sidebar">
                <div className="ac-aba-sidebar__brand">
                    <img src={logonovo} alt="AutisConnect" className="ac-aba-sidebar__logo" />
                    <div className="ac-aba-sidebar__copy">
                        <span>ABA Professional Workspace</span>
                        <strong>Atividade ABA do paciente</strong>
                    </div>
                </div>

                <nav className="ac-aba-sidebar__nav" aria-label="Navegação da Atividade ABA do paciente">
                    {NAVIGATION_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.key;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                className={`ac-aba-sidebar__item ${isActive ? 'is-active' : ''}`}
                                onClick={() => setActiveTab(item.key)}
                            >
                                <Icon />
                                <span>{item.label}</span>
                                {item.tag ? <span className="ac-aba-nav-tag">{item.tag}</span> : null}
                            </button>
                        );
                    })}
                </nav>

                <div className="ac-aba-sidebar__footer">
                    <p className="ac-aba-sidebar__signature">
                        Workspace premium integrado ao fluxo profissional, preservando sessões, relatório, monitoramento e sugestões do módulo ABA.
                    </p>
                </div>
            </aside>

            <main className="ac-aba-main">
                <header className="ac-aba-header">
                    <div>
                        <div className="ac-aba-breadcrumb">Paciente / Atividade ABA</div>
                        <h1>Central Premium ABA</h1>
                    </div>

                    <Button variant="outline-primary" className="ac-aba-back-button" onClick={handleExit}>
                        <ArrowLeft className="me-2" />
                        Voltar ao paciente
                    </Button>
                </header>

                <section className="ac-aba-patient-context">
                    <div>
                        <span className="ac-aba-section-kicker">Contexto do paciente</span>
                        <h2>Paciente vinculado</h2>
                        <p>
                            Conduza o acompanhamento ABA com visão consolidada de sessões, gráficos, insights,
                            previsão e ações de monitoramento em uma única interface.
                        </p>
                    </div>

                    <div className="ac-aba-context-pills">
                        {contextPills.map((pill) => (
                            <article key={pill.label} className={`ac-aba-context-pill is-${pill.tone}`}>
                                <span>{pill.label}</span>
                                <strong>{pill.value}</strong>
                            </article>
                        ))}
                    </div>
                </section>

                {loadError ? (
                    <Alert variant="warning" className="ac-aba-alert">
                        <div className="ac-aba-alert__title">
                            <ShieldCheck />
                            <strong>Atenção ao carregamento</strong>
                        </div>
                        <div>{loadError}</div>
                    </Alert>
                ) : null}

                {renderActiveSection()}

                <footer className="ac-aba-footer">
                    <span>AutisConnect ABA Workspace</span>
                    <span>Tecnologia que conecta. Cuidado que transforma.</span>
                </footer>
            </main>
        </div>
    );
};

export default AbaPatient;
