import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';
import {
    ArrowLeft,
    BarChartLine,
    CheckCircleFill,
    ClockHistory,
    Diagram3,
    ExclamationTriangleFill,
    InfoCircle,
    JournalText,
    ListCheck,
    ShieldCheck,
    Stars
} from 'react-bootstrap-icons';
import logonovo from './assets/logonovo.png';
import AbaCharts from './components/AbaCharts';
import AbaAiAnalysis from './components/AbaAiAnalysis';
import AbaForecast from './components/AbaForecast';
import AbaProgramMonitoring from './components/AbaProgramMonitoring';
import AbaSessionsList from './components/AbaSessionsList';
import abaService from './services/abaService';
import abaAiService from './services/abaAiService';
import './DashboardABA.css';

const NAVIGATION_ITEMS = [
    { key: 'overview', label: 'Visão Geral', icon: BarChartLine },
    { key: 'skills', label: 'Habilidades', icon: ListCheck },
    { key: 'prompts', label: 'Níveis de Auxílio', icon: Diagram3 },
    { key: 'history', label: 'Histórico', icon: ClockHistory },
    { key: 'comparison', label: 'Comparação', icon: JournalText },
    { key: 'insights', label: 'Insights', icon: Stars }
];

const PROMPT_LEVEL_ORDER = [
    'INDEPENDENTE',
    'GESTUAL',
    'VERBAL',
    'MODELAGEM',
    'FÍSICO PARCIAL',
    'FISICO PARCIAL',
    'FÍSICO TOTAL',
    'FISICO TOTAL',
    'FÍSICO',
    'FISICO'
];

function formatPercent(value) {
    if (!Number.isFinite(value)) {
        return '--';
    }

    return `${Math.round(value)}%`;
}

function formatDate(value) {
    if (!value) {
        return '--';
    }

    return new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(value) {
    if (!value) {
        return '--';
    }

    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function normalizePromptKey(promptLevel) {
    return String(promptLevel || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
}

function formatPromptLevel(promptLevel) {
    const normalizedPrompt = normalizePromptKey(promptLevel);

    switch (normalizedPrompt) {
    case 'INDEPENDENTE':
        return 'Independente';
    case 'GESTUAL':
        return 'Gestual';
    case 'VERBAL':
        return 'Verbal';
    case 'MODELAGEM':
        return 'Modelagem';
    case 'FISICO PARCIAL':
        return 'Físico parcial';
    case 'FISICO TOTAL':
        return 'Físico total';
    case 'FISICO':
        return 'Físico';
    default:
        return String(promptLevel || 'Não informado');
    }
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

function sortPromptLevels(promptEntries = []) {
    return [...promptEntries].sort((left, right) => {
        const leftIndex = PROMPT_LEVEL_ORDER.indexOf(normalizePromptKey(left.label));
        const rightIndex = PROMPT_LEVEL_ORDER.indexOf(normalizePromptKey(right.label));

        const normalizedLeftIndex = leftIndex === -1 ? PROMPT_LEVEL_ORDER.length : leftIndex;
        const normalizedRightIndex = rightIndex === -1 ? PROMPT_LEVEL_ORDER.length : rightIndex;

        if (normalizedLeftIndex !== normalizedRightIndex) {
            return normalizedLeftIndex - normalizedRightIndex;
        }

        return right.count - left.count;
    });
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

export default function DashboardABA({ patientId: propPatientId = null }) {
    const location = useLocation();
    const { id, patientId: routePatientId } = useParams();
    const queryPatientId = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('patientId');
    }, [location.search]);
    const patientIdCandidate = propPatientId || routePatientId || id || queryPatientId;
    const parsedPatientId = patientIdCandidate ? Number.parseInt(patientIdCandidate, 10) : null;
    const idPaciente = Number.isFinite(parsedPatientId) && parsedPatientId > 0 ? parsedPatientId : null;

    const [activeSection, setActiveSection] = useState('overview');
    const [selectedHabilidade, setSelectedHabilidade] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [monitoring, setMonitoring] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [warnings, setWarnings] = useState([]);

    const loadDashboardData = useCallback(async () => {
        if (!idPaciente) {
            setSessions([]);
            setAnalytics(null);
            setForecast(null);
            setMonitoring(null);
            setWarnings([]);
            setError('Paciente não identificado. Abra a Atividade ABA a partir do contexto correto do paciente.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        setWarnings([]);

        const results = await Promise.allSettled([
            abaService.getSessions(idPaciente),
            abaAiService.getAnalytics(idPaciente),
            abaAiService.getForecast(idPaciente),
            abaAiService.getMonitoring(idPaciente)
        ]);

        const [sessionsResult, analyticsResult, forecastResult, monitoringResult] = results;
        const nextWarnings = [];

        if (sessionsResult.status === 'fulfilled') {
            setSessions(Array.isArray(sessionsResult.value?.data) ? sessionsResult.value.data : []);
        } else {
            setSessions([]);
            nextWarnings.push('As sessões ABA não puderam ser carregadas nesta tentativa.');
        }

        if (analyticsResult.status === 'fulfilled') {
            setAnalytics(analyticsResult.value?.data || null);
        } else {
            setAnalytics(null);
            nextWarnings.push('Os insights de evolução não estão disponíveis no momento.');
        }

        if (forecastResult.status === 'fulfilled') {
            setForecast(forecastResult.value?.data || null);
        } else {
            setForecast(null);
            nextWarnings.push('A previsão terapêutica ainda não está disponível neste momento.');
        }

        if (monitoringResult.status === 'fulfilled') {
            setMonitoring(monitoringResult.value?.data || null);
        } else {
            setMonitoring(null);
            nextWarnings.push('O monitoramento clínico do programa ABA não respondeu nesta tentativa.');
        }

        const hasAnySuccess = results.some((result) => result.status === 'fulfilled');
        if (!hasAnySuccess) {
            setError('Não foi possível carregar os dados da Central de Evolução ABA.');
        }

        setWarnings(nextWarnings);
        setLoading(false);
    }, [idPaciente]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const orderedSessions = useMemo(() => (
        [...sessions].sort((left, right) => {
            const leftDate = new Date(left.createdAt || left.sessionDate || 0).getTime();
            const rightDate = new Date(right.createdAt || right.sessionDate || 0).getTime();
            return rightDate - leftDate;
        })
    ), [sessions]);

    const skillWorkspace = useMemo(() => {
        const skillsMap = new Map();

        sessions.forEach((session) => {
            const skillName = String(session.targetSkill || '').trim();

            if (!skillName) {
                return;
            }

            const skillKey = skillName;
            const currentPrompt = formatPromptLevel(session.promptLevel);
            const existingSkill = skillsMap.get(skillKey) || {
                id: skillKey,
                descricao: skillName,
                dominio: session.domain || '',
                programName: session.programName || '',
                sessionCount: 0,
                totalTrials: 0,
                correctResponses: 0,
                generalizationCount: 0,
                lastPromptLevel: '',
                lastSessionAt: '',
                sessionTypes: new Set(),
                promptCounts: {}
            };

            existingSkill.sessionCount += 1;
            existingSkill.totalTrials += Number(session.totalTrials || 0);
            existingSkill.correctResponses += Number(session.correctResponses || 0);
            existingSkill.generalizationCount += session.generalization ? 1 : 0;
            existingSkill.lastPromptLevel = currentPrompt;
            existingSkill.lastSessionAt = session.createdAt || session.sessionDate || existingSkill.lastSessionAt;

            if (session.programName && !existingSkill.programName) {
                existingSkill.programName = session.programName;
            }

            if (session.domain && !existingSkill.dominio) {
                existingSkill.dominio = session.domain;
            }

            if (session.sessionType) {
                existingSkill.sessionTypes.add(session.sessionType);
            }

            existingSkill.promptCounts[currentPrompt] = (existingSkill.promptCounts[currentPrompt] || 0) + 1;
            skillsMap.set(skillKey, existingSkill);
        });

        return [...skillsMap.values()]
            .map((skill) => {
                const accuracy = skill.totalTrials > 0
                    ? Math.round((skill.correctResponses / skill.totalTrials) * 100)
                    : null;
                const promptDistribution = sortPromptLevels(
                    Object.entries(skill.promptCounts).map(([label, count]) => ({
                        label,
                        count
                    }))
                );

                return {
                    ...skill,
                    sessionTypes: [...skill.sessionTypes],
                    accuracy,
                    generalizationRate: skill.sessionCount > 0
                        ? Math.round((skill.generalizationCount / skill.sessionCount) * 100)
                        : null,
                    promptDistribution
                };
            })
            .sort((left, right) => right.sessionCount - left.sessionCount);
    }, [sessions]);

    const selectedSkillData = useMemo(() => (
        skillWorkspace.find((skill) => skill.id === selectedHabilidade) || null
    ), [selectedHabilidade, skillWorkspace]);

    useEffect(() => {
        if (selectedHabilidade && !selectedSkillData) {
            setSelectedHabilidade(null);
        }
    }, [selectedHabilidade, selectedSkillData]);

    const overallAverageAccuracy = useMemo(() => {
        const totals = sessions.reduce((accumulator, session) => ({
            correctResponses: accumulator.correctResponses + Number(session.correctResponses || 0),
            totalTrials: accumulator.totalTrials + Number(session.totalTrials || 0)
        }), { correctResponses: 0, totalTrials: 0 });

        if (!totals.totalTrials) {
            return null;
        }

        return Math.round((totals.correctResponses / totals.totalTrials) * 100);
    }, [sessions]);

    const overallGeneralizationRate = useMemo(() => {
        if (!sessions.length) {
            return null;
        }

        const positiveSessions = sessions.filter((session) => session.generalization).length;
        return Math.round((positiveSessions / sessions.length) * 100);
    }, [sessions]);

    const kpiCards = useMemo(() => ([
        {
            label: 'Habilidades em acompanhamento',
            value: skillWorkspace.length,
            helper: skillWorkspace.length
                ? 'Calculado a partir das habilidades registradas nas sessões.'
                : 'Nenhuma habilidade com sessão válida até o momento.'
        },
        {
            label: 'Sessões registradas',
            value: analytics?.totalSessions ?? sessions.length,
            helper: sessions.length
                ? 'Baseado nas sessões ABA carregadas para este paciente.'
                : 'Aguardando sessões lançadas pela equipe clínica.'
        },
        {
            label: 'Média de acerto',
            value: formatPercent(Number.isFinite(analytics?.avgAccuracy) ? analytics.avgAccuracy : overallAverageAccuracy),
            helper: 'Representa o desempenho médio observado nas tentativas registradas.'
        },
        {
            label: 'Generalização observada',
            value: formatPercent(Number.isFinite(analytics?.generalizationRate) ? analytics.generalizationRate : overallGeneralizationRate),
            helper: 'Reflete a ocorrência de generalização nas sessões disponíveis.'
        }
    ]), [analytics?.avgAccuracy, analytics?.generalizationRate, analytics?.totalSessions, overallAverageAccuracy, overallGeneralizationRate, sessions.length, skillWorkspace.length]);

    const recentSessions = useMemo(() => orderedSessions.slice(0, 3), [orderedSessions]);

    const patientContextPills = useMemo(() => ([
        {
            label: 'Evolução',
            value: analytics?.overallStatus ? getStatusLabel(analytics.overallStatus) : 'Sem dados suficientes',
            tone: analytics?.overallStatus ? getStatusTone(analytics.overallStatus) : 'neutral'
        },
        {
            label: 'Monitoramento',
            value: monitoring?.status ? getStatusLabel(monitoring.status) : 'Indisponível',
            tone: monitoring?.status ? getStatusTone(monitoring.status) : 'neutral'
        },
        {
            label: 'Insights IA',
            value: analytics ? 'Disponíveis' : 'Aguardando base suficiente',
            tone: analytics ? 'info' : 'neutral'
        }
    ]), [analytics, monitoring]);

    const renderOverview = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Visão Geral ABA</span>
                    <h2>Evolução ABA</h2>
                    <p>Acompanhe o desempenho das habilidades ao longo das sessões com foco em progresso, consistência e nível de auxílio.</p>
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
                            <h3>Evolução das Habilidades</h3>
                            <p>O componente existente continua responsável pelos dados e visualizações clínicas da evolução ABA.</p>
                        </div>
                    </div>

                    {sessions.length ? (
                        <div className="ac-aba-component-slot">
                            <AbaCharts sessions={sessions} compact />
                        </div>
                    ) : (
                        <EmptyState
                            icon={BarChartLine}
                            title="Nenhum dado de evolução disponível"
                            description="Os gráficos aparecerão assim que o paciente tiver sessões ABA registradas."
                            note="Os mocks temporários do componente original não são exibidos como dado clínico real."
                        />
                    )}
                </div>

                <div className="ac-aba-insights-column">
                    {analytics ? (
                        <div className="ac-aba-component-slot">
                            <AbaAiAnalysis analytics={analytics} compact />
                        </div>
                    ) : (
                        <div className="ac-aba-panel-card">
                            <EmptyState
                                icon={Stars}
                                title="Insights de evolução indisponíveis"
                                description="A análise inteligente é exibida apenas quando houver dados suficientes para interpretação segura."
                            />
                        </div>
                    )}

                    {forecast ? (
                        <div className="ac-aba-component-slot">
                            <AbaForecast forecast={forecast} compact />
                        </div>
                    ) : (
                        <div className="ac-aba-panel-card">
                            <EmptyState
                                icon={Stars}
                                title="Previsão terapêutica indisponível"
                                description="A previsão de desempenho futuro será exibida quando houver base suficiente para análise segura."
                            />
                        </div>
                    )}

                    <div className="ac-aba-panel-card">
                        <div className="ac-aba-panel-header">
                            <div>
                                <span className="ac-aba-section-kicker">Atenção clínica</span>
                                <h3>Monitoramento do programa ABA</h3>
                            </div>
                        </div>

                        {monitoring ? (
                            <div className={`ac-aba-monitor-card is-${getStatusTone(monitoring.status)}`}>
                                <div className="ac-aba-monitor-topline">
                                    <span className={`ac-aba-status-pill is-${getStatusTone(monitoring.status)}`}>
                                        {getStatusLabel(monitoring.status)}
                                    </span>
                                    {monitoring.programName ? <strong>{monitoring.programName}</strong> : null}
                                </div>
                                <p>{monitoring.analysis || 'Monitoramento disponível sem narrativa detalhada.'}</p>
                                {monitoring.period ? (
                                    <small>Período avaliado: {monitoring.period}</small>
                                ) : (
                                    <small>Sem período detalhado informado pelo serviço de monitoramento.</small>
                                )}
                            </div>
                        ) : (
                            <EmptyState
                                icon={ShieldCheck}
                                title="Monitoramento ainda não disponível"
                                description="Quando houver leitura automatizada do programa ABA, esta área destacará tendências como progresso, estabilidade ou possível regressão."
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="ac-aba-panel-card">
                <div className="ac-aba-panel-header">
                    <div>
                        <span className="ac-aba-section-kicker">Sessões recentes</span>
                        <h3>Últimos registros lançados</h3>
                        <p>Resumo rápido das sessões mais recentes para leitura clínica imediata.</p>
                    </div>
                </div>

                {recentSessions.length ? (
                    <div className="ac-aba-recent-list">
                        {recentSessions.map((session) => {
                            const accuracy = session.totalTrials
                                ? Math.round((Number(session.correctResponses || 0) / Number(session.totalTrials || 1)) * 100)
                                : null;

                            return (
                                <article key={session.id || `${session.targetSkill}-${session.createdAt || session.sessionDate}`} className="ac-aba-recent-item">
                                    <div className="ac-aba-recent-item__date">{formatDate(session.createdAt || session.sessionDate)}</div>
                                    <div className="ac-aba-recent-item__body">
                                        <strong>{session.targetSkill || 'Habilidade não informada'}</strong>
                                        <span>{session.programName || 'Programa ABA não informado'}</span>
                                    </div>
                                    <div className="ac-aba-recent-item__meta">
                                        <span>{accuracy !== null ? `${accuracy}% de acerto` : 'Sem taxa consolidada'}</span>
                                        <small>{formatPromptLevel(session.promptLevel)}</small>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={ClockHistory}
                        title="Nenhuma sessão registrada"
                        description="Os registros recentes aparecerão aqui após o lançamento das sessões ABA."
                    />
                )}
            </div>
        </section>
    );

    const renderSkills = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Skill Workspace</span>
                    <h2>Habilidades em Acompanhamento</h2>
                    <p>Selecione uma habilidade para visualizar contexto terapêutico, volume de sessões e sinais de progresso já observados.</p>
                </div>
            </div>

            {!skillWorkspace.length ? (
                <div className="ac-aba-panel-card">
                    <EmptyState
                        icon={ListCheck}
                        title="Nenhuma habilidade disponível"
                        description="As habilidades serão exibidas aqui quando houver sessões ABA registradas com dados reais."
                        note="Os exemplos temporários do arquivo original foram removidos da interface final para não sugerir dados clínicos inexistentes."
                    />
                </div>
            ) : (
                <div className="ac-aba-skills-workspace">
                    <div className="ac-aba-skills-grid">
                        {skillWorkspace.map((skill) => {
                            const isSelected = selectedHabilidade === skill.id;

                            return (
                                <button
                                    key={skill.id}
                                    type="button"
                                    className={`ac-aba-skill-card ${isSelected ? 'is-selected' : ''}`}
                                    onClick={() => setSelectedHabilidade(skill.id)}
                                >
                                    <div className="ac-aba-skill-card__topline">
                                        <span>{skill.programName || 'Programa ABA'}</span>
                                        {isSelected ? <CheckCircleFill /> : null}
                                    </div>
                                    <strong>{skill.descricao}</strong>
                                    <p>{skill.dominio ? `Domínio: ${skill.dominio}` : 'Domínio ainda não informado no backend atual.'}</p>
                                    <div className="ac-aba-skill-card__footer">
                                        <div>
                                            <small>Sessões</small>
                                            <span>{skill.sessionCount}</span>
                                        </div>
                                        <div>
                                            <small>Média de acerto</small>
                                            <span>{formatPercent(skill.accuracy)}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="ac-aba-panel-card">
                        {selectedSkillData ? (
                            <div className="ac-aba-skill-detail">
                                <div className="ac-aba-panel-header">
                                    <div>
                                        <span className="ac-aba-section-kicker">Habilidade selecionada</span>
                                        <h3>{selectedSkillData.descricao}</h3>
                                        <p>
                                            {selectedSkillData.programName || 'Programa ABA não informado'} • última sessão em {formatDateTime(selectedSkillData.lastSessionAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="ac-aba-skill-metrics">
                                    <article>
                                        <span>Sessões</span>
                                        <strong>{selectedSkillData.sessionCount}</strong>
                                    </article>
                                    <article>
                                        <span>Generalização</span>
                                        <strong>{formatPercent(selectedSkillData.generalizationRate)}</strong>
                                    </article>
                                    <article>
                                        <span>Prompt mais recente</span>
                                        <strong>{selectedSkillData.lastPromptLevel || 'Não informado'}</strong>
                                    </article>
                                </div>

                                <div className="ac-aba-progress-block">
                                    <div className="ac-aba-progress-block__head">
                                        <span>Evolução observada</span>
                                        <strong>{formatPercent(selectedSkillData.accuracy)}</strong>
                                    </div>
                                    <div className="ac-aba-progress-bar">
                                        <div
                                            className="ac-aba-progress-bar__fill"
                                            style={{ width: `${Math.max(0, Math.min(selectedSkillData.accuracy || 0, 100))}%` }}
                                        />
                                    </div>
                                    <small>Indicador derivado das tentativas e acertos já registrados para esta habilidade.</small>
                                </div>

                                <div className="ac-aba-prompt-preview">
                                    <h4>Níveis de auxílio observados</h4>
                                    {selectedSkillData.promptDistribution.length ? (
                                        <ul>
                                            {selectedSkillData.promptDistribution.map((prompt) => (
                                                <li key={prompt.label}>
                                                    <span>{prompt.label}</span>
                                                    <strong>{prompt.count} sessão(ões)</strong>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>Nenhum nível de auxílio foi registrado para esta habilidade até o momento.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                icon={InfoCircle}
                                title="Selecione uma habilidade"
                                description="Escolha uma habilidade para visualizar o contexto terapêutico, os níveis de auxílio e a evolução já registrada."
                            />
                        )}
                    </div>
                </div>
            )}
        </section>
    );

    const renderPrompts = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Níveis de Auxílio</span>
                    <h2>Progressão de suporte por habilidade</h2>
                    <p>Visualize o nível de suporte utilizado por habilidade sem confundir prompt ABA com nível de suporte TEA.</p>
                </div>
            </div>

            <div className="ac-aba-panel-card">
                {selectedSkillData ? (
                    <div className="ac-aba-prompt-workspace">
                        <div className="ac-aba-panel-header">
                            <div>
                                <span className="ac-aba-section-kicker">Habilidade ativa</span>
                                <h3>{selectedSkillData.descricao}</h3>
                                <p>Distribuição real baseada nas sessões já registradas para esta habilidade.</p>
                            </div>
                        </div>

                        {selectedSkillData.promptDistribution.length ? (
                            <div className="ac-aba-prompt-grid">
                                {selectedSkillData.promptDistribution.map((prompt) => {
                                    const percentage = selectedSkillData.sessionCount
                                        ? Math.round((prompt.count / selectedSkillData.sessionCount) * 100)
                                        : 0;

                                    return (
                                        <article key={prompt.label} className="ac-aba-prompt-card">
                                            <div className="ac-aba-prompt-card__topline">
                                                <span>{prompt.label}</span>
                                                <strong>{percentage}%</strong>
                                            </div>
                                            <div className="ac-aba-progress-bar is-prompt">
                                                <div
                                                    className="ac-aba-progress-bar__fill"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <small>{prompt.count} sessão(ões) com este nível de auxílio.</small>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Diagram3}
                                title="Sem níveis de auxílio registrados"
                                description="Ainda não há prompt levels estruturados para a habilidade selecionada."
                            />
                        )}
                    </div>
                ) : (
                    <EmptyState
                        icon={InfoCircle}
                        title="Selecione uma habilidade"
                        description="Escolha uma habilidade para visualizar os níveis de auxílio e sua evolução ao longo das sessões."
                    />
                )}
            </div>
        </section>
    );

    const renderHistory = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Histórico</span>
                    <h2>Histórico de Sessões ABA</h2>
                    <p>Acompanhe as sessões registradas e a evolução ao longo do tempo sem transformar o histórico em um log técnico.</p>
                </div>
            </div>

            {sessions.length ? (
                <div className="ac-aba-component-slot">
                    <AbaSessionsList sessions={orderedSessions} patientId={idPaciente} />
                </div>
            ) : (
                <div className="ac-aba-panel-card">
                    <EmptyState
                        icon={ClockHistory}
                        title="Nenhuma sessão registrada"
                        description="Quando a equipe lançar novas sessões ABA, o histórico completo ficará disponível aqui."
                    />
                </div>
            )}
        </section>
    );

    const renderComparison = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Comparação</span>
                    <h2>Comparação de Habilidades</h2>
                    <p>A estrutura está preparada para comparar evolução entre habilidades e períodos, mas essa leitura ainda depende de implementação dedicada.</p>
                </div>
            </div>

            <div className="ac-aba-panel-card">
                <EmptyState
                    icon={JournalText}
                    title="Comparação ainda não disponível"
                    description="Quando a comparação avançada for implementada, esta área permitirá cruzar habilidades, períodos e domínios sem recorrer a dados fictícios."
                    note="A arquitetura visual já considera seleção de habilidades, período e indicadores comparativos futuros."
                />
            </div>
        </section>
    );

    const renderInsights = () => (
        <section className="ac-aba-section">
            <div className="ac-aba-section-header">
                <div>
                    <span className="ac-aba-section-kicker">Insights de Evolução</span>
                    <h2>Interpretação complementar do acompanhamento ABA</h2>
                    <p>A IA é exibida apenas como apoio à leitura de progresso e não substitui supervisão clínica ou tomada de decisão profissional.</p>
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
                            description="Ainda não há dados suficientes para exibir uma análise inteligente segura deste paciente."
                        />
                    </div>
                )}

                <div className="ac-aba-insights-column">
                    {forecast ? (
                        <div className="ac-aba-component-slot">
                            <AbaForecast forecast={forecast} />
                        </div>
                    ) : (
                        <div className="ac-aba-panel-card">
                            <EmptyState
                                icon={Stars}
                                title="Previsão terapêutica indisponível"
                                description="Assim que o serviço de previsão ABA responder com dados válidos, esta área complementará a leitura evolutiva."
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
                                title="Monitoramento sem retorno"
                                description="Quando o serviço de monitoramento responder com dados válidos, os alertas de estagnação ou possível regressão aparecerão aqui."
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );

    const renderActiveSection = () => {
        switch (activeSection) {
        case 'skills':
            return renderSkills();
        case 'prompts':
            return renderPrompts();
        case 'history':
            return renderHistory();
        case 'comparison':
            return renderComparison();
        case 'insights':
            return renderInsights();
        case 'overview':
        default:
            return renderOverview();
        }
    };

    return (
        <div className="ac-aba-shell">
            <aside className="ac-aba-sidebar">
                <div className="ac-aba-sidebar__brand">
                    <img src={logonovo} alt="AutisConnect" className="ac-aba-sidebar__logo" />
                    <div className="ac-aba-sidebar__copy">
                        <span>ABA Progress Workspace</span>
                        <strong>Atividade ABA</strong>
                    </div>
                </div>

                <nav className="ac-aba-sidebar__nav" aria-label="Navegação da Atividade ABA">
                    {NAVIGATION_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.key;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                className={`ac-aba-sidebar__item ${isActive ? 'is-active' : ''}`}
                                onClick={() => setActiveSection(item.key)}
                            >
                                <Icon />
                                <span>{item.label}</span>
                                {item.key === 'insights' ? (
                                    <small className="ac-aba-nav-tag">IA</small>
                                ) : null}
                            </button>
                        );
                    })}
                </nav>

                <div className="ac-aba-sidebar__footer">
                    <div className="ac-aba-sidebar__signature">Tecnologia que conecta. Cuidado que transforma.</div>
                </div>
            </aside>

            <div className="ac-aba-main">
                <header className="ac-aba-header">
                    <div>
                        <div className="ac-aba-breadcrumb">Paciente / ABA</div>
                        <h1>Central de Evolução ABA</h1>
                    </div>

                    <Button variant="outline-primary" className="ac-aba-back-button" onClick={() => window.history.back()}>
                        <ArrowLeft className="me-2" />
                        Voltar ao paciente
                    </Button>
                </header>

                <section className="ac-aba-patient-context">
                    <div>
                        <span className="ac-aba-section-kicker">Contexto do paciente</span>
                        <h2>Paciente vinculado</h2>
                        <p>
                            A atividade ABA desta tela utiliza sessões, monitoramento e análise inteligente já existentes no projeto.
                            O identificador técnico do paciente não é tratado como identidade principal da interface.
                        </p>
                    </div>

                    <div className="ac-aba-context-pills">
                        {patientContextPills.map((pill) => (
                            <div key={pill.label} className={`ac-aba-context-pill is-${pill.tone}`}>
                                <span>{pill.label}</span>
                                <strong>{pill.value}</strong>
                            </div>
                        ))}
                    </div>
                </section>

                {!idPaciente ? (
                    <div className="ac-aba-panel-card">
                        <EmptyState
                            icon={ShieldCheck}
                            title="Paciente não identificado"
                            description="O componente original utilizava fallback silencioso para o paciente 1, o que é inseguro. Agora o módulo permanece bloqueado até receber um paciente válido."
                        />
                    </div>
                ) : null}

                {warnings.length ? (
                    <Alert variant="warning" className="ac-aba-alert">
                        <div className="ac-aba-alert__title">
                            <ExclamationTriangleFill />
                            <strong>Alguns blocos não responderam nesta tentativa</strong>
                        </div>
                        <ul className="ac-aba-alert__list">
                            {warnings.map((warning) => (
                                <li key={warning}>{warning}</li>
                            ))}
                        </ul>
                    </Alert>
                ) : null}

                {error ? (
                    <Alert variant="danger" className="ac-aba-alert">
                        <div className="ac-aba-alert__title">
                            <ExclamationTriangleFill />
                            <strong>Falha ao carregar a atividade ABA</strong>
                        </div>
                        <p className="mb-0">{error}</p>
                    </Alert>
                ) : null}

                {loading ? <LoadingSkeleton /> : idPaciente ? renderActiveSection() : null}

                <footer className="ac-aba-footer">
                    <span>© 2026 Nf Representações Comerciais Ltda.</span>
                    <span>Atividade ABA alinhada ao design system premium do AutisConnect.</span>
                </footer>
            </div>
        </div>
    );
}
