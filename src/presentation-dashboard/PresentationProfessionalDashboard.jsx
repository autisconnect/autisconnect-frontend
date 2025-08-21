import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
// Ícones atualizados para refletir as funcionalidades reais
import { FaUsers, FaUserPlus, FaChartPie, FaWallet, FaBrain, FaVideo, FaMicrophone } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logo.png';
//import './App.css';

// Importe as novas imagens que você vai criar
import heroImage from '../assets/professional-hero.png'; 
import dashboardOverview from '../assets/prof-dashboard-overview.png';
import dashboardPatients from '../assets/prof-dashboard-patients.png';
import dashboardAssistants from '../assets/prof-dashboard-assistants.png';
import dashboardFinancial from '../assets/prof-dashboard-financial.png';
import dashboardMonitoring from '../assets/prof-dashboard-monitoring.png';


function PresentationProfessionalDashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBackToMain = () => navigate('/');
    const handleSignUp = () => navigate('/signup');

    return (
        <div className="presentation-page">
            <Navbar bg="light" variant="light" expand="lg" fixed="top" className="mb-4 service-navbar">
                <Container>
                    <Navbar.Brand><img src={logohori} alt="AutisConnect Logo" className="d-inline-block align-top logo" /></Navbar.Brand>
                    <div className="ms-auto">
                        <Button variant="danger" onClick={handleBackToMain} style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}>Voltar</Button>
                    </div>
                </Container>
            </Navbar>

            <div 
                className="hero-section mb-5" 
                style={{ 
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '450px'
                }}
            >
                <div>
                    <h1 className="display-4 fw-bold mb-3">Dashboard Profissional AutisConnect</h1>
                    <p className="lead mb-4 text-white">
                        A plataforma completa para gestão de pacientes, finanças e equipes, com ferramentas de IA para um acompanhamento clínico sem precedentes.
                    </p>
                </div>
            </div>

            <Container fluid className="px-md-5">
                <Row className="mb-5 text-center">
                    <Col>
                        <h2>Uma Central de Comando para sua Prática Clínica</h2>
                        <p className="text-muted">Desenvolvemos um ecossistema de ferramentas para otimizar cada aspecto do seu trabalho, da administração à análise clínica.</p>
                    </Col>
                </Row>

                {/* Funcionalidades Principais do Dashboard */}
                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaUsers className="text-primary me-3" size={30} /><h4>Gestão Completa de Pacientes</h4></div>
                                <p>Cadastre, edite, filtre e visualize o perfil completo de cada paciente. Acesse o histórico de consultas, adicione notas de evolução e gerencie o status (ativo/inativo) com facilidade.</p>
                                <Image src={dashboardPatients} fluid rounded className="mt-3 feature-image" alt="Gestão de Pacientes" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaUserPlus className="text-success me-3" size={30} /><h4>Gerenciamento de Colaboradores</h4></div>
                                <p>Adicione e gerencie sua equipe de secretárias e assistentes. Delegue tarefas administrativas, como o agendamento de consultas e o cadastro de pacientes, com segurança e controle.</p>
                                <Image src={dashboardAssistants} fluid rounded className="mt-3 feature-image" alt="Gerenciamento de Colaboradores" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaWallet className="text-warning me-3" size={30} /><h4>Dashboard Financeiro</h4></div>
                                <p>Tenha uma visão clara da saúde financeira da sua clínica. Acompanhe o faturamento mensal, o ticket médio por consulta e a receita por forma de pagamento em gráficos intuitivos.</p>
                                <Image src={dashboardFinancial} fluid rounded className="mt-3 feature-image" alt="Dashboard Financeiro" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaChartPie className="text-info me-3" size={30} /><h4>Relatórios e Visão Geral</h4></div>
                                <p>Acesse uma visão geral do seu dia com as consultas agendadas e analise a distribuição de diagnósticos e tipos de consulta para entender melhor o perfil da sua base de pacientes.</p>
                                <Image src={dashboardOverview} fluid rounded className="mt-3 feature-image" alt="Relatórios e Visão Geral" />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Seção de Ferramentas de IA */}
                <Row className="mb-5">
                    <Col>
                        <h3 className="text-center mb-4">Ferramentas de Monitoramento por IA</h3>
                        <Card className="shadow-sm p-4">
                            <Row>
                                <Col md={6} className="mb-4 mb-md-0">
                                    <h4 className="mb-3">Análise de Dados Aprofundada</h4>
                                    <p>Vá além da gestão. Utilize nossas ferramentas de ponta para um acompanhamento clínico detalhado:</p>
                                    <ul className="feature-list">
                                        <li><strong><FaBrain className="me-2 text-primary"/>Análise Emocional:</strong> Entenda o estado emocional do paciente através da detecção de expressões faciais.</li>
                                        <li><strong><FaVideo className="me-2 text-primary"/>Monitor de Estereotipias:</strong> Quantifique a frequência e duração de comportamentos motores repetitivos.</li>
                                        <li><strong><FaMicrophone className="me-2 text-primary"/>Analisador de Vocalizações:</strong> Avalie padrões de fala, repetições e complexidade lexical.</li>
                                    </ul>
                                    <p className="mt-3">Todos os dados são salvos e apresentados em dashboards individuais para cada paciente, permitindo uma análise longitudinal precisa.</p>
                                </Col>
                                <Col md={6}>
                                    <Image src={dashboardMonitoring} fluid rounded className="feature-image-large" alt="Ferramentas de Monitoramento por IA" />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-5 text-center">
                    <Col>
                        <Card className="cta-card p-5">
                            <h3>Eleve o Nível da sua Prática Clínica</h3>
                            <p className="text-muted mb-4">Junte-se a centenas de profissionais que já estão utilizando nossa plataforma para otimizar a gestão e aprofundar o tratamento de pacientes com TEA.</p>
                            <Button variant="primary" size="lg" onClick={handleSignUp}>Cadastre-se Agora</Button>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <footer className="bg-light py-4 mt-5">
                <Container><p className="mb-0 text-center text-muted">Nrmendfsystems. Todos os direitos reservados.</p></Container>
            </footer>
        </div>
    );
}

export default PresentationProfessionalDashboard;
