import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap'; // Badge vem do react-bootstrap
import { Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// ÍCONES – todos importados corretamente do react-bootstrap-icons
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
  FileEarmarkText // este é o nome correto
} from 'react-bootstrap-icons';

import logohori from './assets/logo.png';
import pais from './assets/pais.png';
import medicos from './assets/medicos.png';
import servicos from './assets/servicos.png';
import './App.css';

const Home = () => {
  const { loading } = useContext(AuthContext);

  const benefits = [
    { id: 1, title: "Conexão Facilitada", description: "Conecte-se facilmente com profissionais especializados e serviços inclusivos em sua região.", icon: <People size={30} /> },
    { id: 2, title: "Monitoramento Contínuo", description: "Acompanhe o progresso e desenvolvimento com ferramentas avançadas de análise.", icon: <Heart size={30} /> },
    { id: 3, title: "Suporte 24/7", description: "Acesso a recursos e comunidade de apoio disponível a qualquer momento.", icon: <CheckCircle size={30} /> }
  ];

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

                  <Row className="mt-5">
                    {benefits.map(b => (
                      <Col md={4} key={b.id} className="mb-4">
                        <div className="d-flex align-items-start text-white">
                          <div className="me-3">{b.icon}</div>
                          <div>
                            <h6 className="fw-bold mb-1">{b.title}</h6>
                            <small className="text-white-50">{b.description}</small>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Col>

              <Col lg={6} className="text-center">
                <img src={logohori} alt="AutisConnect" className="img-fluid hero-logo" />
              </Col>
            </Row>
          </Container>
        </section>

        {/* ==================== SEÇÃO PROFISSIONAIS ==================== */}
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

        {/* ==================== PLATAFORMAS ==================== */}
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

        {/* ==================== CTA ==================== */}
        <section className="cta-section py-5 bg-primary text-white">
          <Container className="text-center">
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

      {/* ==================== FOOTER ==================== */}
      <footer className="footer-section py-4 bg-dark text-white-50">
        <Container>
          <Row className="justify-content-between align-items-center">
            <Col md={6} className="text-center text-md-start">
              <p className="mb-0">
                © {new Date().getFullYear()} Nf Representações Comerciais Ltda. Todos os direitos reservados.
              </p>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <p className="mb-0">
                Contato:
                <a href="mailto:autisconnect@gmail.com" className="text-white-50">
                  <Envelope size={16} className="me-1" /> autisconnect@gmail.com
                </a> |
                <Whatsapp size={16} className="me-1 ms-2" />
                <a href="https://wa.me/5581982540904" target="_blank" rel="noopener noreferrer" className="text-white-50">
                  WhatsApp: 81 98254-0904
                </a>
                <a href="https://instagram.com/autisconnect" target="_blank" rel="noopener noreferrer" className="text-white-50 ms-3">
                  <Instagram size={20} className="me-1" /> @autisconnect
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