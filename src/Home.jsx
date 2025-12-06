import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// ÍCONES — todos importados uma única vez, sem duplicatas
import {
  ArrowRight,
  Star,
  Award,
  People,
  Heart,
  Calendar,
  GraphUp,
  Calendar2Check,
  Wallet2,
  Bell,
  CheckCircle,
  Mic,
  Sliders,
  Instagram,
  Whatsapp,
  Envelope,
  ExclamationTriangle,
  FileEarmarkText,
  ChatDots
} from 'react-bootstrap-icons';

import logohori from './assets/logo.png';
import pais from './assets/pais.png';
import medicos from './assets/medicos.png';
import servicos from './assets/servicos.png';
import './App.css';

const Home = () => {
  const { loading } = useContext(AuthContext);

  const [features] = useState([
    {
      id: 1,
      title: "Monitoramento de Emoções",
      description: "Tecnologia avançada de inteligência artificial para detectar e analisar expressões faciais em tempo real, ajudando a compreender melhor as emoções não verbalizadas e facilitando a comunicação.",
      icon: <Heart className="feature-icon" size={40} />,
      link: "/presentation-dashboard/PresentationEmotionDetector",
      color: "#e74c3c"
    },
    {
      id: 2,
      title: "Avaliação de Risco de AVC",
      description: "Ferramenta inovadora que utiliza análise de assimetrias faciais para identificar possíveis sinais de alerta precoces para AVC, proporcionando intervenção rápida e eficaz.",
      icon: <ExclamationTriangle className="feature-icon" size={40} />,
      link: "/presentation-dashboard/PresentationStrokeRiskMonitor",
      color: "#f39c12"
    },
    {
      id: 3,
      title: "Agendamento Integrado",
      description: "Sistema completo de agendamento que conecta famílias, profissionais e serviços com lembretes automáticos, confirmações e sincronização de calendários para maior organização.",
      icon: <Calendar className="feature-icon" size={40} />,
      link: "/presentation-dashboard/PresentationIntegratedScheduling",
      color: "#3498db"
    },
    {
      id: 4,
      title: "Comunidade de Apoio",
      description: "Fóruns especializados e grupos de discussão moderados para compartilhar experiências, obter suporte emocional e trocar conhecimentos entre famílias e profissionais.",
      icon: <People className="feature-icon" size={40} />,
      link: "/presentation-dashboard/PresentationCommunitySupport",
      color: "#9b59b6"
    },
    {
      id: 5,
      title: "Consultas Virtuais",
      description: "Plataforma segura e criptografada para consultas por videochamada, reduzindo deslocamentos e tornando o acompanhamento mais frequente e acessível para todas as famílias.",
      icon: <ChatDots className="feature-icon" size={40} />,
      link: "/presentation-dashboard/PresentationVirtualConsultations",
      color: "#1abc9c"
    },
    {
      id: 6,
      title: "Certificação de Serviços",
      description: "Programa abrangente de certificação e treinamento para estabelecimentos que desejam oferecer um ambiente adequado e acolhedor para pessoas autistas e suas famílias.",
      icon: <Award className="feature-icon" size={40} />,
      link: "/presentation-dashboard/PresentationServiceCertification",
      color: "#e67e22"
    }
  ]);

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
      <div className="home-page">

        {/* ==================== HERO ==================== */}
        <section className="hero-section" id="section-hero">
          <Container>
            <Row className="align-items-center min-vh-100">
              <Col lg={6} className="mb-5 mb-lg-0">
                <div className="hero-content">
                  <h1 className="display-3 fw-bold mb-4">
                    Bem-vindo ao <span className="text-gradient">AutisConnect</span>
                  </h1>
                  <p className="lead mb-4">
                    A plataforma mais completa para conectar famílias de pessoas autistas a profissionais especializados e serviços inclusivos, promovendo suporte, inclusão e desenvolvimento em um ambiente seguro e acolhedor.
                  </p>

                  <div className="d-flex flex-wrap gap-3 mt-4">
                    <Link to="/signup" className="text-decoration-none">
                      <Button variant="light" size="lg" className="px-4 py-3">
                        <CheckCircle className="me-2" size={20} /> Cadastre-se
                      </Button>
                    </Link>
                    <Link to="/login" className="text-decoration-none">
                      <Button variant="outline-light" size="lg" className="px-4 py-3">
                        <ArrowRight className="me-2" size={20} /> Fazer Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </Col>
              <Col lg={6} className="text-center">
                <img src={logohori} alt="AutisConnect" className="img-fluid hero-logo" />
              </Col>
            </Row>
          </Container>
        </section>

        {/* ==================== RECURSOS EXCLUSIVOS E INOVADORES (DINÂMICO) ==================== */}
        <section className="features-inovadoras py-5 bg-white" id="section-features">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold mb-3">Recursos Exclusivos e Inovadores</h2>
              <p className="lead text-muted">Tecnologia de ponta a serviço da inclusão e do desenvolvimento</p>
            </div>

            <Row className="g-5 justify-content-center">
              {features.map((feature) => (
                <Col key={feature.id} lg={4} md={6}>
                  <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift position-relative overflow-hidden">
                    {/* Faixa lateral colorida */}
                    <div
                      className="position-absolute start-0 top-0 bottom-0"
                      style={{
                        width: '8px',
                        backgroundColor: feature.color,
                        borderRadius: '8px 0 0 8px'
                      }}
                    />

                    {/* Ícone com gradiente personalizado */}
                    <div className="mb-4">
                      <div
                        className="icon-circle text-white mx-auto d-flex align-items-center justify-content-center shadow-lg"
                        style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`
                        }}
                      >
                        {React.cloneElement(feature.icon, { size: 42 })}
                      </div>
                    </div>

                    <h4 className="fw-bold mb-3">{feature.title}</h4>
                    <p className="text-muted small lh-lg">{feature.description}</p>

                    <Link to={feature.link}>
                      <Button variant="outline-primary" size="sm" className="mt-3">
                        Explorar Recurso <ArrowRight className="ms-2" size={16} />
                      </Button>
                    </Link>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* ==================== PROFISSIONAIS E CLÍNICAS ==================== */}
        <section className="py-5" style={{ backgroundColor: '#f0f5ff' }}>
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-5 fw-bold mb-4">
                Feito para <span className="text-primary">Profissionais e Clínicas</span> que Transformam Vidas
              </h2>
              <p className="lead text-muted col-lg-9 mx-auto">
                Controle total de pacientes, relatórios científicos automáticos, agenda e financeiro em um só lugar.
              </p>
              <div className="mt-4">
                <h3 className="display-6 fw-bold text-primary">
                  A partir de apenas <span className="text-dark">R$ 97/mês</span>
                </h3>
                <p className="text-muted fs-5">Plano Analisar 50 – o mais escolhido</p>
              </div>
            </div>

            <Row className="g-5 justify-content-center">
              <Col lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                  <div className="mb-4">
                    <div className="icon-circle bg-primary text-white mx-auto d-flex align-items-center justify-content-center"
                         style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                      <People size={38} />
                    </div>
                  </div>
                  <h4>Gestão Completa de Pacientes</h4>
                  <p className="text-muted">Cadastro ilimitado, histórico clínico, evolução e prescrições digitais.</p>
                </Card>
              </Col>

              <Col lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                  <div className="mb-4">
                    <div className="icon-circle bg-success text-white mx-auto"
                         style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                      <GraphUp size={38} />
                    </div>
                  </div>
                  <h4>Relatórios Científicos</h4>
                  <p className="text-muted">Gráficos prontos para laudos e evolução por domínio.</p>
                </Card>
              </Col>

              <Col lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                  <div className="mb-4">
                    <div className="icon-circle bg-info text-white mx-auto"
                         style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                      <Calendar2Check size={38} />
                    </div>
                  </div>
                  <h4>Agenda + Financeiro</h4>
                  <p className="text-muted">Controle de consultas, pagamentos e recibos com 1 clique.</p>
                </Card>
              </Col>

              <Col lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                  <div className="mb-4">
                    <div className="icon-circle bg-warning text-white mx-auto"
                         style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                      <FileEarmarkText size={38} />
                    </div>
                  </div>
                  <h4>Prescrições e Laudos</h4>
                  <p className="text-muted">Modelos prontos com impressão otimizada.</p>
                </Card>
              </Col>

              <Col lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift">
                  <div className="mb-4">
                    <div className="icon-circle bg-danger text-white mx-auto"
                         style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                      <Bell size={38} />
                    </div>
                  </div>
                  <h4>Notificações</h4>
                  <p className="text-muted">Lembretes automáticos de consultas e pendências.</p>
                </Card>
              </Col>

              <Col lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm text-center p-4 hover-lift border-primary position-relative">
                  <div className="position-absolute top-0 start-50 translate-middle-x bg-primary text-white px-4 py-1 rounded-pill small fw-bold">
                    MAIS VENDIDO
                  </div>
                  <div className="mb-4 pt-3">
                    <div className="icon-circle bg-purple text-white mx-auto"
                         style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6f42c1' }}>
                      <Wallet2 size={38} />
                    </div>
                  </div>
                  <h4>Planos Analisar 50–500</h4>
                  <p className="text-muted">
                    Até <strong>500 pacientes ativos</strong> por mês.<br />
                    Ideal para clínicas grandes.
                  </p>
                  <Badge bg="primary" className="fs-6">A partir de R$ 297/mês</Badge>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>

        {/* ==================== PLATAFORMAS ESPECIALIZADAS ==================== */}
        <section className="services-section py-5" id="section-services">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold mb-3">Plataformas Especializadas</h2>
              <p className="lead text-muted">Soluções personalizadas para cada tipo de usuário</p>
            </div>

            <Row className="g-4">
              <Col lg={4} md={6}>
                <Card className="service-card h-100 shadow-sm">
                  <Card.Img variant="top" src={pais} alt="Pais" />
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      <Heart className="text-primary me-2" size={24} />
                      <Card.Title>Pais e Responsáveis</Card.Title>
                    </div>
                    <Card.Text className="flex-grow-1">
                      Monitoramento, agenda e comunicação segura com profissionais.
                    </Card.Text>
                    <Link to="/login" className="mt-auto">
                      <Button variant="primary" className="w-100">
                        Acessar <ArrowRight className="ms-2" size={16} />
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4} md={6}>
                <Card className="service-card h-100 shadow-sm">
                  <Card.Img variant="top" src={medicos} alt="Profissionais" />
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      <Star className="text-warning me-2" size={24} />
                      <Card.Title>Médicos e Terapeutas</Card.Title>
                    </div>
                    <Card.Text className="flex-grow-1">
                      Dashboard completo com relatórios, prescrições e ferramentas de IA.
                    </Card.Text>
                    <Link to="/login" className="mt-auto">
                      <Button variant="primary" className="w-100">
                        Acessar <ArrowRight className="ms-2" size={16} />
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4} md={6}>
                <Card className="service-card h-100 shadow-sm">
                  <Card.Img variant="top" src={servicos} alt="Secretárias" />
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      <Award className="text-success me-2" size={24} />
                      <Card.Title>Secretárias e Clínicas</Card.Title>
                    </div>
                    <Card.Text className="flex-grow-1">
                      Gestão administrativa completa para clínicas e consultórios.
                    </Card.Text>
                    <Link to="/login" className="mt-auto">
                      <Button variant="primary" className="w-100">
                        Acessar <ArrowRight className="ms-2" size={16} />
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>

        {/* ==================== CTA FINAL ==================== */}
        <section className="cta-section py-5 bg-primary text-white text-center">
          <Container>
            <h2 className="display-4 fw-bold mb-4">
              Junte-se à Nossa Comunidade Inclusiva
            </h2>
            <p className="lead mb-5 col-lg-8 mx-auto">
              Faça parte da maior rede de apoio para famílias de pessoas autistas no Brasil.
            </p>
            <Link to="/signup">
              <Button variant="light" size="lg" className="px-5">
                <CheckCircle className="me-2" size={20} /> Cadastre-se Agora
              </Button>
            </Link>
          </Container>
        </section>

      </div>

      {/* ==================== FOOTER COM QUEBRA DE LINHA ==================== */}
      <footer className="footer-section py-5 bg-dark text-white-50">
        <Container>
          <Row className="justify-content-between align-items-center text-center text-md-start">
            <Col md={6} className="mb-4 mb-md-0">
              <p className="mb-0">
                © {new Date().getFullYear()} Nf Representações Comerciais Ltda.<br />
                <small>Todos os direitos reservados.</small>
              </p>
            </Col>

            <Col md={6} className="text-md-end">
              <p className="mb-0">
                <strong>Contato:</strong><br />
                <a href="mailto:autisconnect@gmail.com" className="text-white-50 d-inline-flex align-items-center mb-1">
                  <Envelope size={16} className="me-2" /> autisconnect@gmail.com
                </a>
                <br />
                <a href="https://wa.me/5581982540904" target="_blank" rel="noopener noreferrer" className="text-white-50 d-inline-flex align-items-center mb-1">
                  <Whatsapp size={16} className="me-2" /> WhatsApp: 81 98254-0904
                </a>
                <br />
                <a href="https://instagram.com/autisconnect" target="_blank" rel="noopener noreferrer" className="text-white-50 d-inline-flex align-items-center">
                  <Instagram size={18} className="me-2" /> @autisconnect
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