import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Image, Row, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Envelope, GeoAlt, StarFill, Whatsapp } from 'react-bootstrap-icons';
import apiClient from './services/api.js';
import logonovo from './assets/logonovo.png';
import './App.css';

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
};

const formatAddress = (service) => {
  const street = [service.logradouro, service.numero].filter(Boolean).join(', ');
  return [
    street,
    service.complemento,
    service.bairro,
    service.cidade,
    service.estado,
    service.cep
  ].filter(Boolean).join(' · ');
};

const getImageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const apiOrigin = (apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${apiOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
};

const PublicServiceProfile = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadService = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get(`/parent/services/${id}`);
        if (active) setService(response.data);
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.error || 'Não foi possível carregar este serviço.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadService();
    return () => {
      active = false;
    };
  }, [id]);

  const services = useMemo(() => normalizeList(service?.servicos || service?.tipo_servico), [service]);
  const specialties = useMemo(() => normalizeList(service?.especialidade), [service]);
  const address = useMemo(() => service ? formatAddress(service) : '', [service]);
  const whatsappNumber = normalizePhone(service?.telefone);
  const profileImage = getImageUrl(service?.foto_perfil);

  return (
    <main className="home-page landing-home public-service-profile">
      <nav className="public-service-profile__nav">
        <Container className="d-flex align-items-center justify-content-between gap-3">
          <Link to="/" className="public-service-profile__brand" aria-label="Voltar para a Home">
            <img src={logonovo} alt="AutisConnect" />
          </Link>
          <Button as={Link} to="/" variant="outline-light" className="d-inline-flex align-items-center gap-2">
            <ArrowLeft size={16} />
            Voltar para a Home
          </Button>
        </Container>
      </nav>

      <section className="public-service-profile__hero">
        <Container>
          {loading && (
            <div className="public-service-profile__loading">
              <Spinner animation="border" role="status" />
              <span>Carregando serviço...</span>
            </div>
          )}

          {!loading && error && (
            <Alert variant="warning" className="public-service-profile__alert">
              {error}
            </Alert>
          )}

          {!loading && service && (
            <Row className="g-4 align-items-center">
              <Col lg={7}>
                <span className="landing-section__label">Serviço TEA cadastrado</span>
                <h1>{service.name || service.nome_fantasia || 'Serviço TEA'}</h1>
                <p>
                  {service.descricao_servico || 'Espaço cadastrado na Rede TEA AutisConnect para apoiar famílias, profissionais e pessoas com TEA.'}
                </p>
                <div className="public-service-profile__meta">
                  {address && (
                    <span>
                      <GeoAlt />
                      {address}
                    </span>
                  )}
                  <span>
                    <StarFill />
                    {Number(service.rating || 0).toFixed(1)} ({service.ratingCount || 0} avaliações)
                  </span>
                </div>
                <div className="public-service-profile__actions">
                  {whatsappNumber && (
                    <Button
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-landing-primary"
                    >
                      <Whatsapp className="me-2" />
                      Falar pelo WhatsApp
                    </Button>
                  )}
                  {service.email && (
                    <Button href={`mailto:${service.email}`} variant="outline-light">
                      <Envelope className="me-2" />
                      Enviar e-mail
                    </Button>
                  )}
                </div>
              </Col>
              <Col lg={5}>
                <Card className="public-service-profile__feature-card">
                  <Card.Body>
                    {profileImage ? (
                      <Image src={profileImage} alt={service.name || 'Serviço TEA'} fluid rounded className="public-service-profile__image" />
                    ) : (
                      <div className="public-service-profile__image-placeholder">
                        <img src={logonovo} alt="AutisConnect" />
                        <span>Rede TEA AutisConnect</span>
                      </div>
                    )}
                    <div className="public-service-profile__badges">
                      {service.modalidade && <Badge bg="light" text="dark">{service.modalidade}</Badge>}
                      {service.faixa_etaria && <Badge bg="light" text="dark">{service.faixa_etaria}</Badge>}
                      {service.cobertura && <Badge bg="light" text="dark">{service.cobertura}</Badge>}
                      {service.nivel_suporte && <Badge bg="light" text="dark">{service.nivel_suporte}</Badge>}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </section>

      {!loading && service && (
        <section className="landing-section bg-white">
          <Container>
            <Row className="g-4">
              <Col lg={8}>
                <Card className="landing-card public-service-profile__card">
                  <Card.Body>
                    <span className="landing-section__label">Atendimento e especialidades</span>
                    <h2>Como este serviço pode apoiar</h2>
                    <div className="public-service-profile__chips">
                      {[...services, ...specialties].map((item) => (
                        <span key={item}>
                          <CheckCircle />
                          {item}
                        </span>
                      ))}
                      {[...services, ...specialties].length === 0 && (
                        <p className="mb-0">As informações de serviços serão exibidas assim que o cadastro for atualizado.</p>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="landing-card public-service-profile__card">
                  <Card.Body>
                    <span className="landing-section__label">Informações rápidas</span>
                    <ul className="public-service-profile__info-list">
                      <li><strong>Horário:</strong> {service.horario_funcionamento || 'Não informado'}</li>
                      <li><strong>Modalidade:</strong> {service.modalidade || 'Não informada'}</li>
                      <li><strong>Vínculo médico:</strong> {service.vinculacao_medico || 'Não informado'}</li>
                      <li><strong>Cidade:</strong> {[service.cidade, service.estado].filter(Boolean).join(' - ') || 'Não informada'}</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>
      )}
    </main>
  );
};

export default PublicServiceProfile;
