import React, { useContext, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Dropdown, Form, Offcanvas, OverlayTrigger, Spinner, Table, Tooltip as RBTooltip } from 'react-bootstrap';
import {
    ArrowClockwise,
    ArrowLeft,
    BoxArrowRight,
    Calendar2Check,
    CashCoin,
    ChevronLeft,
    ChevronRight,
    CurrencyDollar,
    FileEarmarkText,
    Funnel,
    GraphUp,
    List,
    People,
    PersonCircle,
    Wallet2
} from 'react-bootstrap-icons';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip as ChartTooltip } from 'chart.js';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';
import logonovo from './assets/logonovo.png';
import './App.css';
import './ProfessionalDashboard.css';
import './FinancialDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, ChartTooltip, Legend);

const SIDEBAR_STORAGE_KEY = 'ac-professional-sidebar-collapsed';
const PROFESSIONAL_TAB_STORAGE_KEY = 'ac-professional-dashboard-tab';
const paymentPalette = ['#2563EB', '#06B6D4', '#60A5FA', '#A78BFA', '#16A34A'];

function EmptyState({ title, description, actionLabel, onAction, compact = false }) {
    return (
        <div className={`ac-prof-empty-state${compact ? ' ac-prof-empty-state--compact' : ''}`}>
            <div className="ac-prof-empty-state__icon">
                <Wallet2 />
            </div>
            <div>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {actionLabel && onAction ? (
                <Button variant="outline-primary" onClick={onAction}>
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
}

function LoadingShell() {
    return (
        <div className="ac-prof-dashboard ac-fin-dashboard ac-prof-dashboard--loading">
            <aside className="ac-prof-sidebar-shell">
                <div className="ac-prof-sidebar">
                    <div className="ac-prof-sidebar__brand-block">
                        <div className="ac-prof-skeleton ac-prof-skeleton--logo" />
                        <div className="ac-prof-sidebar__brand-ribbon" />
                    </div>
                    <div className="ac-prof-sidebar__nav-group">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="ac-prof-skeleton ac-prof-skeleton--nav" />
                        ))}
                    </div>
                </div>
            </aside>
            <div className="ac-prof-shell">
                <header className="ac-prof-header">
                    <div className="ac-prof-skeleton ac-prof-skeleton--header-title" />
                    <div className="ac-prof-skeleton ac-prof-skeleton--header-actions" />
                </header>
                <main className="ac-prof-main">
                    <div className="ac-prof-skeleton-grid">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="ac-prof-skeleton ac-prof-skeleton--kpi" />
                        ))}
                    </div>
                    <div className="ac-prof-skeleton-grid ac-prof-skeleton-grid--content">
                        <div className="ac-prof-skeleton ac-prof-skeleton--panel" />
                        <div className="ac-prof-skeleton ac-prof-skeleton--panel" />
                    </div>
                </main>
            </div>
        </div>
    );
}

const FinancialDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const { id: professionalId } = useParams();
    const navigate = useNavigate();
    const reportSectionRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [financialData, setFinancialData] = useState(null);
    const [professionalName, setProfessionalName] = useState('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        paymentMethod: 'todos'
    });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.sessionStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Number(value || 0));

    const formatDate = (value) => (value ? new Date(value).toLocaleDateString('pt-BR') : 'N/A');

    const getStatusVariant = (status) => {
        const normalizedStatus = (status || '').toString().toLowerCase();

        if (['pago', 'recebido', 'quitado'].includes(normalizedStatus)) return 'success';
        if (['pendente', 'aguardando'].includes(normalizedStatus)) return 'warning';
        if (['cancelado', 'estornado', 'negado'].includes(normalizedStatus)) return 'danger';
        return 'neutral';
    };

    const fetchFinancialData = async () => {
        if (!user || !professionalId) return;

        setLoading(true);
        setError('');

        const url = `/financials/professional/${professionalId}`;

        try {
            const response = await apiClient.get(url);
            setFinancialData(response.data);
            setProfessionalName(response.data?.professionalName || user?.nome_completo || user?.username || '');
            setLastUpdatedAt(new Date());
        } catch (err) {
            const message = err.response?.data?.error || 'Falha ao carregar dados financeiros.';
            setError(message);
            setFinancialData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.sessionStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleResize = () => {
            if (window.innerWidth >= 992) {
                setIsMobileSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.tipo_usuario !== 'medicos_terapeutas' || professionalId !== user.id.toString()) {
            navigate(`/professional-dashboard/${user.id}`);
            return;
        }

        fetchFinancialData();
    }, [professionalId, user, navigate]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((previous) => ({ ...previous, [name]: value }));
    };

    const handleApplyFilters = (event) => {
        event.preventDefault();
        reportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            paymentMethod: 'todos'
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleOpenProfessionalSection = (targetTab = 'overview') => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(PROFESSIONAL_TAB_STORAGE_KEY, targetTab);
        }
        navigate(`/professional-dashboard/${user.id}`);
    };

    const summary = financialData?.summary || {};
    const monthlyPerformance = financialData?.monthlyPerformance || {};
    const revenueByPaymentMethod = financialData?.revenueByPaymentMethod || {};
    const detailedReport = Array.isArray(financialData?.detailedReport) ? financialData.detailedReport : [];

    const hasAnyFinancialContent =
        !!financialData &&
        [
            summary.balance,
            summary.monthlyRevenue,
            summary.averageTicket,
            summary.paidAppointments,
            summary.pendingPayments
        ].some((value) => value !== null && value !== undefined) ||
        monthlyPerformance?.data?.length > 0 ||
        revenueByPaymentMethod?.data?.length > 0 ||
        detailedReport.length > 0;

    const pieChartData = {
        labels: revenueByPaymentMethod.labels || [],
        datasets: [
            {
                data: revenueByPaymentMethod.data || [],
                backgroundColor: paymentPalette,
                borderColor: '#FFFFFF',
                borderWidth: 2,
                hoverOffset: 8
            }
        ]
    };

    const barChartData = {
        labels: monthlyPerformance.labels || [],
        datasets: [
            {
                label: 'Faturamento mensal',
                data: monthlyPerformance.data || [],
                backgroundColor: '#2563EB',
                hoverBackgroundColor: '#3860F8',
                borderRadius: 12,
                borderSkipped: false,
                maxBarThickness: 42
            }
        ]
    };

    const filteredReport =
        detailedReport.filter((item) => {
            const itemDate = new Date(item.date);
            const startDate = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
            const endDate = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;

            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            if (filters.paymentMethod !== 'todos' && item.paymentMethod !== filters.paymentMethod) return false;

            return true;
        }) || [];

    const hasActiveFilters = Boolean(filters.startDate || filters.endDate || filters.paymentMethod !== 'todos');
    const paymentTotal = (revenueByPaymentMethod.data || []).reduce((accumulator, value) => accumulator + Number(value || 0), 0);
    const paymentSummary = (revenueByPaymentMethod.labels || []).map((label, index) => {
        const value = Number(revenueByPaymentMethod.data?.[index] || 0);
        const percentage = paymentTotal > 0 ? Math.round((value / paymentTotal) * 100) : 0;

        return {
            label,
            value,
            percentage,
            color: paymentPalette[index % paymentPalette.length]
        };
    });

    const navigationGroups = [
        {
            label: 'Principal',
            items: [{ key: 'overview', label: 'Visão geral', icon: GraphUp, targetTab: 'overview' }]
        },
        {
            label: 'Gestão',
            items: [
                { key: 'patients', label: 'Pacientes', icon: People, targetTab: 'patients' },
                { key: 'appointments', label: 'Atendimentos', icon: Calendar2Check, targetTab: 'appointments' },
                { key: 'reports', label: 'Relatórios', icon: FileEarmarkText, targetTab: 'reports' },
                { key: 'assistants', label: 'Colaboradores', icon: People, targetTab: 'assistants' },
                { key: 'finance', label: 'Financeiro', icon: Wallet2, current: true }
            ]
        }
    ];

    const renderSidebarNavItem = (item, mobile = false) => {
        const Icon = item.icon;
        const collapsed = isSidebarCollapsed && !mobile;
        const className = `ac-prof-sidebar__item${item.current ? ' is-active' : ''}`;

        const content = item.current ? (
            <div className={className} title={item.label}>
                <span className="ac-prof-sidebar__item-icon">
                    <Icon />
                </span>
                <span className="ac-prof-sidebar__item-label">{item.label}</span>
            </div>
        ) : (
            <button
                type="button"
                className={className}
                title={item.label}
                onClick={() => handleOpenProfessionalSection(item.targetTab)}
            >
                <span className="ac-prof-sidebar__item-icon">
                    <Icon />
                </span>
                <span className="ac-prof-sidebar__item-label">{item.label}</span>
            </button>
        );

        if (collapsed) {
            return (
                <OverlayTrigger key={item.key} placement="right" overlay={<RBTooltip id={`finance-tooltip-${item.key}`}>{item.label}</RBTooltip>}>
                    {content}
                </OverlayTrigger>
            );
        }

        return <React.Fragment key={item.key}>{content}</React.Fragment>;
    };

    const renderSidebar = (mobile = false) => (
        <div className={`ac-prof-sidebar${isSidebarCollapsed && !mobile ? ' ac-prof-sidebar--collapsed' : ''}`}>
            <div className="ac-prof-sidebar__brand-block">
                <div className="ac-prof-sidebar__brand-row">
                    <img src={logonovo} alt="AutisConnect" className="ac-prof-sidebar__logo" />
                    {!mobile ? (
                        <button
                            type="button"
                            className="ac-prof-sidebar__collapse"
                            onClick={() => setIsSidebarCollapsed((current) => !current)}
                            aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                        >
                            {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
                        </button>
                    ) : null}
                </div>
                <div className="ac-prof-sidebar__brand-ribbon" />
            </div>

            <div className="ac-prof-sidebar__nav">
                {navigationGroups.map((group) => (
                    <div className="ac-prof-sidebar__nav-group" key={group.label}>
                        {!isSidebarCollapsed || mobile ? <span className="ac-prof-sidebar__group-label">{group.label}</span> : null}
                        <div className="ac-prof-sidebar__group-items">
                            {group.items.map((item) => renderSidebarNavItem(item, mobile))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="ac-prof-sidebar__footer">
                {!isSidebarCollapsed || mobile ? (
                    <div className="ac-prof-sidebar__user">
                        <div className="ac-prof-sidebar__user-avatar">
                            {(professionalName || user?.nome_completo || user?.username || 'AC')
                                .split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part.charAt(0).toUpperCase())
                                .join('')}
                        </div>
                        <div>
                            <strong>{professionalName || user?.nome_completo || user?.username || 'Profissional'}</strong>
                            <span>Painel financeiro</span>
                        </div>
                    </div>
                ) : (
                    <div className="ac-prof-sidebar__user-avatar ac-prof-sidebar__user-avatar--solo">
                        {(professionalName || user?.nome_completo || user?.username || 'AC')
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part.charAt(0).toUpperCase())
                            .join('')}
                    </div>
                )}

                <button type="button" className="ac-prof-sidebar__logout" onClick={handleLogout}>
                    <BoxArrowRight />
                    {!isSidebarCollapsed || mobile ? <span>Sair</span> : null}
                </button>
            </div>
        </div>
    );

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0F172A',
                titleColor: '#F8FAFC',
                bodyColor: '#E2E8F0',
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    label: (context) => formatCurrency(context.raw)
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748B' }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.16)', drawBorder: false },
                ticks: {
                    color: '#64748B',
                    callback: (value) => formatCurrency(value)
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#475569',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 18
                }
            },
            tooltip: {
                backgroundColor: '#0F172A',
                titleColor: '#F8FAFC',
                bodyColor: '#E2E8F0',
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    label: (context) => `${context.label}: ${formatCurrency(context.raw)}`
                }
            }
        }
    };

    const summaryCards = [
        {
            key: 'monthlyRevenue',
            label: 'Faturamento do mês',
            value: formatCurrency(summary.monthlyRevenue),
            helper: 'Receita consolidada no período atual.',
            icon: GraphUp,
            featured: true
        },
        {
            key: 'balance',
            label: 'Saldo atual',
            value: formatCurrency(summary.balance),
            helper: 'Disponível com base nos lançamentos registrados.',
            icon: Wallet2
        },
        {
            key: 'averageTicket',
            label: 'Ticket médio',
            value: formatCurrency(summary.averageTicket),
            helper: 'Valor médio por atendimento recebido.',
            icon: CurrencyDollar
        },
        {
            key: 'paidAppointments',
            label: 'Atendimentos pagos',
            value: `${Number(summary.paidAppointments || 0).toLocaleString('pt-BR')}`,
            helper: 'Quantidade de atendimentos marcados como pagos.',
            icon: Calendar2Check
        },
        {
            key: 'pendingPayments',
            label: 'Pagamentos pendentes',
            value: `${Number(summary.pendingPayments || 0).toLocaleString('pt-BR')}`,
            helper: 'Itens financeiros aguardando regularização.',
            icon: CashCoin
        }
    ];

    if (loading) {
        return <LoadingShell />;
    }

    return (
        <div className={`ac-prof-dashboard ac-fin-dashboard${isSidebarCollapsed ? ' ac-prof-dashboard--collapsed' : ''}`}>
            <aside className="ac-prof-sidebar-shell">{renderSidebar()}</aside>

            <Offcanvas show={isMobileSidebarOpen} onHide={() => setIsMobileSidebarOpen(false)} placement="start" className="ac-prof-offcanvas">
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title>AutisConnect</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>{renderSidebar(true)}</Offcanvas.Body>
            </Offcanvas>

            <div className="ac-prof-shell">
                <header className="ac-prof-header">
                    <div className="ac-prof-header__context">
                        <button
                            type="button"
                            className="ac-prof-header__menu-toggle"
                            onClick={() => setIsMobileSidebarOpen(true)}
                            aria-label="Abrir menu"
                        >
                            <List />
                        </button>
                        <div>
                            <span className="ac-prof-header__breadcrumb">Dashboard Profissional / Financeiro</span>
                            <h1>Financeiro</h1>
                        </div>
                    </div>

                    <div className="ac-prof-header__actions">
                        <Dropdown align="end">
                            <Dropdown.Toggle variant="light" className="ac-prof-profile-toggle">
                                <span className="ac-prof-profile-toggle__avatar">
                                    <PersonCircle />
                                </span>
                                <span className="ac-prof-profile-toggle__content">
                                    <strong>{professionalName || user?.nome_completo || user?.username || 'Profissional'}</strong>
                                    <small>Painel financeiro</small>
                                </span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="ac-prof-dropdown">
                                <Dropdown.Header>{professionalName || user?.nome_completo || user?.username || 'Profissional'}</Dropdown.Header>
                                <Dropdown.Item as="button" onClick={() => handleOpenProfessionalSection('overview')}>
                                    <ArrowLeft className="me-2" />
                                    Voltar ao dashboard
                                </Dropdown.Item>
                                <Dropdown.Item as="button" onClick={handleLogout}>
                                    <BoxArrowRight className="me-2" />
                                    Sair
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </header>

                <main className="ac-prof-main">
                    <section className="ac-prof-page-header">
                        <div className="ac-prof-page-header__copy">
                            <span className="ac-prof-page-header__eyebrow">AutisConnect Financial</span>
                            <h2>Financeiro</h2>
                            <p>
                                Acompanhe receitas, pagamentos e desempenho financeiro do seu ambiente de trabalho com uma visão clara
                                e organizada.
                            </p>
                            {lastUpdatedAt ? (
                                <small className="ac-fin-page-header__meta">
                                    Atualizado em {lastUpdatedAt.toLocaleDateString('pt-BR')} às{' '}
                                    {lastUpdatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </small>
                            ) : null}
                        </div>
                        <div className="ac-prof-page-header__actions">
                            <Button variant="outline-secondary" onClick={() => handleOpenProfessionalSection('overview')}>
                                <ArrowLeft className="me-2" />
                                Voltar ao dashboard
                            </Button>
                            <Button onClick={fetchFinancialData}>
                                <ArrowClockwise className="me-2" />
                                Atualizar
                            </Button>
                        </div>
                    </section>

                    {error ? (
                        <Card className="ac-prof-card">
                            <Card.Body>
                                <EmptyState
                                    title="Não foi possível carregar os dados financeiros"
                                    description={error}
                                    actionLabel="Tentar novamente"
                                    onAction={fetchFinancialData}
                                />
                            </Card.Body>
                        </Card>
                    ) : !hasAnyFinancialContent ? (
                        <Card className="ac-prof-card">
                            <Card.Body>
                                <EmptyState
                                    title="Nenhum dado financeiro disponível"
                                    description="As informações financeiras aparecerão aqui quando houver atendimentos e pagamentos registrados."
                                />
                            </Card.Body>
                        </Card>
                    ) : (
                        <>
                            <section className="ac-fin-kpi-grid">
                                {summaryCards.map((card) => {
                                    const Icon = card.icon;
                                    return (
                                        <Card
                                            key={card.key}
                                            className={`ac-prof-card ac-prof-kpi-card ac-fin-kpi-card${card.featured ? ' ac-fin-kpi-card--featured' : ''}`}
                                        >
                                            <Card.Body>
                                                <div className="ac-fin-kpi-card__top">
                                                    <span className="ac-fin-kpi-card__icon">
                                                        <Icon />
                                                    </span>
                                                    {card.featured ? <Badge bg="primary">Destaque</Badge> : null}
                                                </div>
                                                <span className="ac-prof-kpi-card__label">{card.label}</span>
                                                <strong>{card.value}</strong>
                                                <small>{card.helper}</small>
                                            </Card.Body>
                                        </Card>
                                    );
                                })}
                            </section>

                            <section className="ac-fin-analytics-grid">
                                <Card className="ac-prof-card ac-prof-chart-card ac-fin-chart-card--wide">
                                    <Card.Body>
                                        <div className="ac-prof-card__header">
                                            <div>
                                                <span className="ac-prof-card__eyebrow">Desempenho financeiro</span>
                                                <h3>Evolução do faturamento</h3>
                                                <p>Desempenho mensal dos últimos períodos.</p>
                                            </div>
                                        </div>
                                        <div className="ac-prof-chart">
                                            {barChartData.labels.length > 0 ? (
                                                <Bar data={barChartData} options={barOptions} />
                                            ) : (
                                                <EmptyState
                                                    compact
                                                    title="Sem faturamento consolidado"
                                                    description="Os dados do gráfico aparecerão conforme a movimentação financeira for registrada."
                                                />
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="ac-prof-card ac-prof-chart-card">
                                    <Card.Body>
                                        <div className="ac-prof-card__header">
                                            <div>
                                                <span className="ac-prof-card__eyebrow">Pagamentos</span>
                                                <h3>Receita por forma de pagamento</h3>
                                                <p>Distribuição atual das receitas registradas.</p>
                                            </div>
                                        </div>
                                        <div className="ac-prof-chart ac-fin-doughnut">
                                            {pieChartData.labels.length > 0 ? (
                                                <Doughnut data={pieChartData} options={doughnutOptions} />
                                            ) : (
                                                <EmptyState
                                                    compact
                                                    title="Sem distribuição disponível"
                                                    description="As formas de pagamento aparecerão aqui quando houver registros suficientes."
                                                />
                                            )}
                                        </div>
                                        {paymentSummary.length > 0 ? (
                                            <div className="ac-fin-payment-summary">
                                                {paymentSummary.map((item) => (
                                                    <div key={item.label} className="ac-fin-payment-summary__item">
                                                        <div className="ac-fin-payment-summary__label">
                                                            <span
                                                                className="ac-fin-payment-summary__dot"
                                                                style={{ backgroundColor: item.color }}
                                                                aria-hidden="true"
                                                            />
                                                            <span>{item.label}</span>
                                                        </div>
                                                        <strong>{item.percentage}%</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </Card.Body>
                                </Card>
                            </section>

                            <Card className="ac-prof-card" ref={reportSectionRef}>
                                <Card.Body>
                                    <div className="ac-prof-card__header">
                                        <div>
                                            <span className="ac-prof-card__eyebrow">Movimentações</span>
                                            <h3>Relatório financeiro</h3>
                                            <p>Consulte receitas e pagamentos por período com os filtros disponíveis no frontend.</p>
                                        </div>
                                    </div>

                                    <Form className="ac-fin-filter-bar" onSubmit={handleApplyFilters}>
                                        <div className="ac-fin-filter-bar__field">
                                            <Form.Label>Data inicial</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="startDate"
                                                value={filters.startDate}
                                                onChange={handleFilterChange}
                                            />
                                        </div>
                                        <div className="ac-fin-filter-bar__field">
                                            <Form.Label>Data final</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="endDate"
                                                value={filters.endDate}
                                                onChange={handleFilterChange}
                                            />
                                        </div>
                                        <div className="ac-fin-filter-bar__field">
                                            <Form.Label>Forma de pagamento</Form.Label>
                                            <Form.Select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}>
                                                <option value="todos">Todas</option>
                                                <option value="Pix">Pix</option>
                                                <option value="Crédito">Crédito</option>
                                                <option value="Débito">Débito</option>
                                                <option value="Plano de Saúde">Plano de Saúde</option>
                                                <option value="Dinheiro">Dinheiro</option>
                                            </Form.Select>
                                        </div>
                                        <div className="ac-fin-filter-bar__actions">
                                            <Button type="submit">
                                                <Funnel className="me-2" />
                                                Aplicar filtros
                                            </Button>
                                            {hasActiveFilters ? (
                                                <Button type="button" variant="outline-secondary" onClick={handleClearFilters}>
                                                    Limpar filtros
                                                </Button>
                                            ) : null}
                                        </div>
                                    </Form>

                                    {filteredReport.length > 0 ? (
                                        <div className="table-responsive">
                                            <Table className="ac-prof-table ac-fin-table">
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Paciente</th>
                                                        <th className="ac-fin-table__money-head">Valor</th>
                                                        <th>Forma de pagamento</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredReport.map((item) => (
                                                        <tr key={item.id}>
                                                            <td data-label="Data">{formatDate(item.date)}</td>
                                                            <td data-label="Paciente">{item.patientName || 'N/A'}</td>
                                                            <td data-label="Valor" className="ac-fin-table__money">
                                                                {formatCurrency(item.value)}
                                                            </td>
                                                            <td data-label="Forma de pagamento">{item.paymentMethod || 'N/A'}</td>
                                                            <td data-label="Status">
                                                                <span className={`ac-prof-status ac-prof-status--${getStatusVariant(item.status)}`}>
                                                                    {item.status || 'N/A'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            compact
                                            title="Nenhuma movimentação encontrada"
                                            description="Não encontramos registros para os filtros selecionados."
                                            actionLabel={hasActiveFilters ? 'Limpar filtros' : undefined}
                                            onAction={hasActiveFilters ? handleClearFilters : undefined}
                                        />
                                    )}
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default FinancialDashboard;
