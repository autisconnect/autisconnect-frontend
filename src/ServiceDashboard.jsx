import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Container, Navbar, Nav, Tab, Row, Col, Card, Button, ListGroup, Form, Modal, Alert, Table, Badge, Spinner, Image } from 'react-bootstrap';
import { FaTachometerAlt, FaUserEdit, FaCalendarCheck, FaComments, FaCertificate, FaSignOutAlt, FaExternalLinkAlt, FaEye, FaSave, FaCheck, FaClock, FaStar, FaStarHalfAlt, FaRegStar, FaPlus, FaUser } from 'react-icons/fa';
import axios from 'axios';
import logohori from './assets/logohoriz copy.jpg';
import { AuthContext } from './context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

import userPhoto18 from './assets/UsersPhoto/UsersPhoto18.jpg';
import userPhoto17 from './assets/UsersPhoto/UsersPhoto17.jpg';
import './app.css';

// Configuração base da API
const API_BASE_URL = 'http://localhost:5000/api';

// Helper Components
const SuggestTimeModal = ({ show, handleClose, handleSuggest, reservationId }) => {
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');

  const onSubmit = () => {
    if (suggestedDate && suggestedTime && reservationId !== null) {
      handleSuggest(reservationId, suggestedDate, suggestedTime);
      setSuggestedDate('');
      setSuggestedTime('');
      handleClose();
    } else {
      alert('Por favor, preencha a data e a hora sugeridas.');
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Sugerir Novo Horário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="suggestDate">
            <Form.Label>Nova Data Sugerida</Form.Label>
            <Form.Control type="date" value={suggestedDate} onChange={(e) => setSuggestedDate(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="suggestTime">
            <Form.Label>Novo Horário Sugerido</Form.Label>
            <Form.Control type="time" value={suggestedTime} onChange={(e) => setSuggestedTime(e.target.value)} required />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
        <Button variant="primary" onClick={onSubmit}>Enviar Sugestão</Button>
      </Modal.Footer>
    </Modal>
  );
};

const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className="text-warning" />);
  }
  if (halfStar) {
    stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" />);
  }
  return <span className="ms-1">{stars}</span>;
};

const AddCertificationModal = ({ show, handleClose, handleSaveCertification }) => {
  const [certificateName, setCertificateName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = () => {
    if (!certificateName || !issuer || !issueDate) {
      alert('Por favor, preencha o Nome do Certificado, Certificador e Data de Emissão.');
      return;
    }
    handleSaveCertification({
      name: certificateName,
      issuer,
      issue_date: issueDate,
      expiry_date: expiryDate || null,
      image_url: imageUrl || null,
    });
    setCertificateName('');
    setIssuer('');
    setIssueDate('');
    setExpiryDate('');
    setImageUrl('');
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Adicionar Nova Certificação</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="certificateName">
            <Form.Label>Nome do Certificado</Form.Label>
            <Form.Control
              type="text"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="issuer">
            <Form.Label>Certificador (Quem emitiu)</Form.Label>
            <Form.Control
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="issueDate">
            <Form.Label>Data de Emissão</Form.Label>
            <Form.Control
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="expiryDate">
            <Form.Label>Data de Validade (Opcional)</Form.Label>
            <Form.Control
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="imageUrl">
            <Form.Label>URL da Imagem do Certificado (Opcional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="https://exemplo.com/imagem.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSubmit}>Salvar Certificação</Button>
      </Modal.Footer>
    </Modal>
  );
};

const ServiceDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id: dashboardId } = useParams();
  const isPublicView = !user || (dashboardId && dashboardId !== user?.id?.toString());

  const [activeTab, setActiveTab] = useState('visao-geral');
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({ newReservations: 0, totalFeedbacks: 0, hasCertifications: false });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestReservationId, setSuggestReservationId] = useState(null);
  const [showAddCertificationModal, setShowAddCertificationModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  
// Função para obter o caminho da foto do usuário com base no ID
const userPhotos = {
  '18': userPhoto18,
  '17': userPhoto17,
  // Adicione mais userId e suas respectivas imagens
};

const getUserPhotoUrl = (userId, profileData = null) => {
  console.log('getUserPhotoUrl called with:', { userId, profileData });
  if (!userId || typeof userId !== 'string') {
    console.warn('ID do usuário inválido:', userId);
    return defaultUserPhoto; // Imagem padrão importada
  }
  if (profileData?.photo_url) {
    console.log('Using profileData.photo_url:', profileData.photo_url);
    return profileData.photo_url;
  }
  // Usar imagem importada se disponível, senão fallback para caminho público
  const importedPhoto = userPhotos[userId];
  if (importedPhoto) {
    console.log('Using imported photo for userId:', userId);
    return importedPhoto;
  }
  const defaultPath = `/assets/UsersPhoto/UsersPhoto${userId}.jpg`;
  console.log('Using default path:', defaultPath);
  return defaultPath;
};

  // Função para lidar com erro de carregamento de imagem
  const handleImageError = () => {
    setImageError(true);
  };

  // Função para resetar erro de imagem quando o usuário muda
  useEffect(() => {
    setImageError(false);
  }, [user?.id, dashboardId]);

  const fetchData = async (userId) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Buscar dados do usuário com endpoints mais robustos
      let profileResponse;
      let profileEndpointUsed = '';
      
      // Tentar múltiplos endpoints para buscar o perfil
      const profileEndpoints = [
        { url: `${API_BASE_URL}/users/${userId}`, name: 'users' },
        { url: `${API_BASE_URL}/user/${userId}`, name: 'user' },
        { url: `${API_BASE_URL}/services/${userId}`, name: 'services' },
        { url: `${API_BASE_URL}/service/${userId}`, name: 'service' }
      ];

      for (const endpoint of profileEndpoints) {
        try {
          profileResponse = await axios.get(endpoint.url, { headers });
          profileEndpointUsed = endpoint.name;
          break;
        } catch (profileError) {
          console.warn(`Endpoint ${endpoint.name} falhou:`, profileError.message);
          continue;
        }
      }

      if (!profileResponse) {
        throw new Error('Nenhum endpoint de perfil funcionou. Verifique a API.');
      }

      const profile = profileResponse.data;
      const userProfile = {
        name: profile.name || profile.nome || '',
        email: profile.email || profile.e_mail || '',
        phone: profile.phone || profile.telefone || '',
        address_street: profile.address_street || profile.rua || profile.endereco || '',
        address_number: profile.address_number || profile.numero || '',
        address_neighborhood: profile.address_neighborhood || profile.bairro || '',
        address_city: profile.address_city || profile.cidade || '',
        address_state: profile.address_state || profile.estado || '',
        address_zip: profile.address_zip || profile.cep || '',
        business_hours: profile.business_hours || profile.horario_funcionamento || '',
        services_description: profile.descricao_servico || profile.services_description || profile.services || profile.descricao_servicos || '',
      };
      setProfileData(userProfile);
      setFormData({ ...userProfile });

      // Buscar reservas com múltiplos endpoints
      let reservationsData = [];
      const reservationEndpoints = [
        `${API_BASE_URL}/reservas/servico/${userId}`,
        `${API_BASE_URL}/reservations/service/${userId}`,
        `${API_BASE_URL}/reservas/${userId}`,
        `${API_BASE_URL}/reservations/${userId}`
      ];

      for (const endpoint of reservationEndpoints) {
        try {
          const reservationsResponse = await axios.get(endpoint, { headers });
          reservationsData = reservationsResponse.data || [];
          break;
        } catch (resError) {
          console.warn(`Endpoint de reservas ${endpoint} falhou:`, resError.message);
          continue;
        }
      }
      setReservations(reservationsData);

      // Buscar avaliações com múltiplos endpoints
      let feedbacksData = [];
      const feedbackEndpoints = [
        `${API_BASE_URL}/avaliacoes/servico/${userId}`,
        `${API_BASE_URL}/feedbacks/service/${userId}`,
        `${API_BASE_URL}/avaliacoes/${userId}`,
        `${API_BASE_URL}/feedbacks/${userId}`
      ];

      for (const endpoint of feedbackEndpoints) {
        try {
          const feedbacksResponse = await axios.get(endpoint, { headers });
          feedbacksData = feedbacksResponse.data || [];
          break;
        } catch (fbError) {
          console.warn(`Endpoint de avaliações ${endpoint} falhou:`, fbError.message);
          continue;
        }
      }
      setFeedbacks(feedbacksData);

      // Buscar certificações com múltiplos endpoints
      let certificatesData = [];
      const certificateEndpoints = [
        `${API_BASE_URL}/certificados/servico/${userId}`,
        `${API_BASE_URL}/certificates/service/${userId}`,
        `${API_BASE_URL}/certificados/${userId}`,
        `${API_BASE_URL}/certificates/${userId}`
      ];

      for (const endpoint of certificateEndpoints) {
        try {
          const certificationsResponse = await axios.get(endpoint, { headers });
          certificatesData = certificationsResponse.data || [];
          break;
        } catch (certError) {
          console.warn(`Endpoint de certificações ${endpoint} falhou:`, certError.message);
          continue;
        }
      }
      setCertificates(certificatesData);

      const newReservationsCount = reservationsData.filter((r) => r.status === 'Pendente').length;
      const totalFeedbacksCount = feedbacksData.length;
      const hasCertificationsFlag = certificatesData.length > 0;
      setStats({
        newReservations: newReservationsCount,
        totalFeedbacks: totalFeedbacksCount,
        hasCertifications: hasCertificationsFlag,
      });
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(`Erro ao carregar dados: ${err.message || 'Erro desconhecido'}.`);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user && !isPublicView) {
      navigate('/login');
      return;
    }

    const currentUserId = dashboardId || user?.id;
    if (dashboardId && dashboardId !== user?.id?.toString() && !isPublicView) {
      navigate(`/service-dashboard/${user.id}`);
      return;
    }

    fetchData(currentUserId);
  }, [user, navigate, dashboardId, isPublicView]);

  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) return 0;
    const totalRating = feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0);
    return Number((totalRating / feedbacks.length).toFixed(1));
  }, [feedbacks]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewPublicPage = () => {
    if (user && user.id) {
      // O caminho completo no sistema de arquivos é C:\autisconnect\frontend\src\service_dashboard\ServiceDashboard{id}.jsx
      // No ambiente web, o 'src' é a raiz do projeto, então o caminho relativo seria /service_dashboard/ServiceDashboard{id}
      const publicPageUrl = `/service_dashboard/ServiceDashboard${user.id}`;
      window.open(publicPageUrl, '_blank', 'noopener,noreferrer');
      console.log(`Abrindo página pública do serviço ID: ${user.id}`);
    } else {
      console.error('Usuário não autenticado ou ID do usuário não encontrado.');
      alert('Não foi possível abrir a página pública. Tente fazer login novamente.');
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!formData || !user || !user.id) {
      alert('Dados do formulário ou informações do usuário ausentes.');
      return;
    }

    const dataToSave = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '',
      address_street: formData.address_street || '',
      address_number: formData.address_number || '',
      address_neighborhood: formData.address_neighborhood || '',
      address_city: formData.address_city || '',
      address_state: formData.address_state || '',
      address_zip: formData.address_zip || '',
      business_hours: formData.business_hours || '',
      services_description: formData.services_description || '', // Garantir que services_description está aqui
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado');

      const headers = { Authorization: `Bearer ${token}` };
      let updateSuccess = false;
      let updateResponse = null;
      
      const updateEndpoints = [
        { url: `${API_BASE_URL}/users/${user.id}`, method: 'PUT' },
        { url: `${API_BASE_URL}/users/${user.id}`, method: 'PATCH' },
        { url: `${API_BASE_URL}/user/${user.id}`, method: 'PUT' },
        { url: `${API_BASE_URL}/user/${user.id}`, method: 'PATCH' },
        { url: `${API_BASE_URL}/services/${user.id}`, method: 'PUT' },
        { url: `${API_BASE_URL}/services/${user.id}`, method: 'PATCH' },
        { url: `${API_BASE_URL}/service/${user.id}`, method: 'PUT' },
        { url: `${API_BASE_URL}/service/${user.id}`, method: 'PATCH' }
      ];

      for (const endpoint of updateEndpoints) {
        try {
          if (endpoint.method === 'PUT') {
            updateResponse = await axios.put(endpoint.url, dataToSave, { headers });
          } else {
            updateResponse = await axios.patch(endpoint.url, dataToSave, { headers });
          }
          updateSuccess = true;
          console.log(`Perfil atualizado com sucesso usando ${endpoint.method} ${endpoint.url}`);
          break;
        } catch (updateError) {
          console.warn(`Endpoint ${endpoint.method} ${endpoint.url} falhou:`, updateError.message);
          continue;
        }
      }

      if (!updateSuccess) {
        throw new Error('Nenhum endpoint de atualização funcionou. Verifique a API.');
      }

      const updatedProfile = updateResponse?.data || dataToSave;
      setProfileData(updatedProfile);
      setFormData(updatedProfile);
      setIsEditingProfile(false);
      alert('Perfil atualizado com sucesso!');
      window.location.reload(); // Recarregar a página após salvar
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      alert(`Erro ao salvar perfil: ${err.response?.data?.message || err.message || 'Erro desconhecido'}.`);
    }
  };

  const handleAcceptReservation = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const headers = { Authorization: `Bearer ${token}` };
      let acceptSuccess = false;

      const acceptEndpoints = [
        `${API_BASE_URL}/reservas/${id}/aceitar`,
        `${API_BASE_URL}/reservations/${id}/accept`,
        `${API_BASE_URL}/reservas/${id}/accept`,
        `${API_BASE_URL}/reservations/${id}/aceitar`
      ];

      for (const endpoint of acceptEndpoints) {
        try {
          await axios.put(endpoint, {}, { headers });
          acceptSuccess = true;
          break;
        } catch (acceptError) {
          console.warn(`Endpoint de aceitar reserva ${endpoint} falhou:`, acceptError.message);
          continue;
        }
      }

      if (!acceptSuccess) {
        throw new Error('Nenhum endpoint de aceitar reserva funcionou. Verifique a API.');
      }
        
      setReservations((prev) => prev.map((res) => (res.id === id ? { ...res, status: 'Confirmada' } : res)));
      alert(`Reserva ${id} confirmada com sucesso!`);
    } catch (err) {
      console.error('Erro ao confirmar reserva:', err);
      alert(`Erro ao confirmar reserva: ${err.response?.data?.message || err.message || 'Erro desconhecido'}.`);
    }
  };

  const handleOpenSuggestModal = (id) => {
    setSuggestReservationId(id);
    setShowSuggestModal(true);
  };

  const handleCloseSuggestModal = () => {
    setShowSuggestModal(false);
    setSuggestReservationId(null);
  };

  const handleSuggestTime = async (id, date, time) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const headers = { Authorization: `Bearer ${token}` };
      const suggestionData = { suggested_date: date, suggested_time: time };
      let suggestSuccess = false;

      const suggestEndpoints = [
        `${API_BASE_URL}/reservas/${id}/sugerir`,
        `${API_BASE_URL}/reservations/${id}/suggest`,
        `${API_BASE_URL}/reservas/${id}/suggest`,
        `${API_BASE_URL}/reservations/${id}/sugerir`
      ];

      for (const endpoint of suggestEndpoints) {
        try {
          await axios.put(endpoint, suggestionData, { headers });
          suggestSuccess = true;
          break;
        } catch (suggestError) {
          console.warn(`Endpoint de sugerir horário ${endpoint} falhou:`, suggestError.message);
          continue;
        }
      }

      if (!suggestSuccess) {
        throw new Error('Nenhum endpoint de sugerir horário funcionou. Verifique a API.');
      }

      setReservations((prev) => prev.map((res) => (res.id === id ? { ...res, status: 'Aguardando Confirmação', suggested_date: date, suggested_time: time } : res)));
      alert(`Novo horário sugerido para a reserva ${id}!`);
    } catch (err) {
      console.error('Erro ao sugerir novo horário:', err);
      alert(`Erro ao sugerir novo horário: ${err.response?.data?.message || err.message || 'Erro desconhecido'}.`);
    }
  };

  const handleSaveCertification = async (certificationData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const headers = { Authorization: `Bearer ${token}` };
      const dataToSave = { ...certificationData, service_id: user.id };
      let saveSuccess = false;
      let saveResponse = null;

      const saveEndpoints = [
        `${API_BASE_URL}/certificados`,
        `${API_BASE_URL}/certificates`,
        `${API_BASE_URL}/certificados/servico/${user.id}`,
        `${API_BASE_URL}/certificates/service/${user.id}`
      ];

      for (const endpoint of saveEndpoints) {
        try {
          saveResponse = await axios.post(endpoint, dataToSave, { headers });
          saveSuccess = true;
          break;
        } catch (saveError) {
          console.warn(`Endpoint de salvar certificação ${endpoint} falhou:`, saveError.message);
          continue;
        }
      }

      if (!saveSuccess) {
        throw new Error('Nenhum endpoint de salvar certificação funcionou. Verifique a API.');
      }

      const newCertification = saveResponse?.data || dataToSave;
      setCertificates((prev) => [...prev, newCertification]);
      setStats((prev) => ({ ...prev, hasCertifications: true }));
      alert('Certificação adicionada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar certificação:', err);
      alert(`Erro ao salvar certificação: ${err.response?.data?.message || err.message || 'Erro desconhecido'}.`);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Erro</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </Alert>
      </Container>
    );
  }

  const currentUserId = dashboardId || user?.id;

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand href="/">
            <img src={logohori} alt="Logo" height="40" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {!isPublicView && (
                <>
                  <Button variant="outline-primary" className="me-2" onClick={handleViewPublicPage}>
                    <FaExternalLinkAlt className="me-1" />
                    Ver Página Pública
                  </Button>
                  <Button variant="outline-danger" onClick={handleLogout}>
                    <FaSignOutAlt className="me-1" />
                    Sair
                  </Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-4">
        {/* Header do Perfil */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={2} className="text-center">
                    {!imageError ? (
                      <Image
                        src={getUserPhotoUrl(currentUserId, profileData)}
                        roundedCircle
                        width={100}
                        height={100}
                        className="border"
                        onError={handleImageError}
                        alt={`Foto de ${profileData?.name || 'Usuário'}`}
                      />
                    ) : (
                      <div 
                        className="d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle border"
                        style={{ width: 100, height: 100, fontSize: '2rem' }}
                      >
                        <FaUser />
                      </div>
                    )}
                  </Col>
                  <Col md={8}>
                    <h2 className="mb-1">{profileData?.name || 'Nome não disponível'}</h2>
                    <p className="text-muted mb-2">{profileData?.email || 'Email não disponível'}</p>
                    <p className="mb-0">{profileData?.services_description || 'Descrição dos serviços não disponível'}</p>
                    {averageRating > 0 && (
                      <div className="mt-2">
                        <StarRating rating={averageRating} />
                        <span className="ms-2 text-muted">({averageRating}/5 - {feedbacks.length} avaliações)</span>
                      </div>
                    )}
                  </Col>
                  {/* botão editar */}
                  <Col md={2} className="text-end">
                    {/*!isPublicView && (
                      <Button
                        variant={isEditingProfile ? "success" : "outline-primary"}
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                      >
                        <FaUserEdit className="me-1" />
                        {isEditingProfile ? 'Cancelar' : 'Editar'}
                      </Button>
                    )*/}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Estatísticas */}
        {!isPublicView && (
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <FaCalendarCheck className="text-primary mb-2" size={30} />
                  <h4>{stats.newReservations}</h4>
                  <p className="text-muted mb-0">Novos Atendimentos</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <FaComments className="text-success mb-2" size={30} />
                  <h4>{stats.totalFeedbacks}</h4>
                  <p className="text-muted mb-0">Total de Avaliações</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <FaCertificate className="text-warning mb-2" size={30} />
                  <h4>{stats.hasCertifications ? 'Sim' : 'Não'}</h4>
                  <p className="text-muted mb-0">Possui Certificações</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Tabs de Conteúdo */}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Row>
            <Col>
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link eventKey="visao-geral">
                    <FaTachometerAlt className="me-1" />
                    Visão Geral
                  </Nav.Link>
                </Nav.Item>
                {!isPublicView && (
                  <Nav.Item>
                    <Nav.Link eventKey="reservas">
                      <FaCalendarCheck className="me-1" />
                      Atendimento ({reservations.length})
                    </Nav.Link>
                  </Nav.Item>
                )}
                <Nav.Item>
                  <Nav.Link eventKey="avaliacoes">
                    <FaComments className="me-1" />
                    Avaliações ({feedbacks.length})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="certificacoes">
                    <FaCertificate className="me-1" />
                    Certificações ({certificates.length})
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                {/* Tab Visão Geral */}
                <Tab.Pane eventKey="visao-geral">
                  <Row>
                    <Col md={8}>
                      <Card className="shadow-sm">
                        <Card.Header>
                          <h5 className="mb-0">Informações do Perfil</h5>
                        </Card.Header>
                        <Card.Body>
                          {isEditingProfile && !isPublicView ? (
                            <Form onSubmit={handleProfileSave}>
                              <Row>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Nome</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="name"
                                      value={formData?.name || ''}
                                      onChange={handleProfileChange}
                                      required
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                      type="email"
                                      name="email"
                                      value={formData?.email || ''}
                                      onChange={handleProfileChange}
                                      required
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Row>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Telefone</Form.Label>
                                    <Form.Control
                                      type="tel"
                                      name="phone"
                                      value={formData?.phone || ''}
                                      onChange={handleProfileChange}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Horário de Funcionamento</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="business_hours"
                                      value={formData?.business_hours || ''}
                                      onChange={handleProfileChange}
                                      placeholder="Ex: Seg-Sex 8h-18h"
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Row>
                                <Col md={8}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Rua</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="address_street"
                                      value={formData?.address_street || ''}
                                      onChange={handleProfileChange}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Número</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="address_number"
                                      value={formData?.address_number || ''}
                                      onChange={handleProfileChange}
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Row>
                                <Col md={4}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Bairro</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="address_neighborhood"
                                      value={formData?.address_neighborhood || ''}
                                      onChange={handleProfileChange}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Cidade</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="address_city"
                                      value={formData?.address_city || ''}
                                      onChange={handleProfileChange}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={2}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Estado</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="address_state"
                                      value={formData?.address_state || ''}
                                      onChange={handleProfileChange}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={2}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>CEP</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="address_zip"
                                      value={formData?.address_zip || ''}
                                      onChange={handleProfileChange}
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Form.Group className="mb-3">
                                <Form.Label>Descrição dos Serviços</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  name="services_description"
                                  value={formData?.services_description || ''}
                                  onChange={handleProfileChange}
                                />
                              </Form.Group>
                              <div className="d-flex gap-2">
                                <Button type="submit" variant="success">
                                  <FaSave className="me-1" />
                                  Salvar Alterações
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => {
                                    setIsEditingProfile(false);
                                    setFormData({ ...profileData });
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </Form>
                          ) : (
                            <div>
                              <Row>
                                <Col md={6}>
                                  <p><strong>Nome:</strong> {profileData?.name || 'Não informado'}</p>
                                  <p><strong>Email:</strong> {profileData?.email || 'Não informado'}</p>
                                  <p><strong>Telefone:</strong> {profileData?.phone || 'Não informado'}</p>
                                </Col>
                                <Col md={6}>
                                  <p><strong>Horário de Funcionamento:</strong> {profileData?.business_hours || 'Não informado'}</p>
                                  <p><strong>Endereço:</strong> {
                                    [
                                      profileData?.address_street,
                                      profileData?.address_number,
                                      profileData?.address_neighborhood,
                                      profileData?.address_city,
                                      profileData?.address_state,
                                      profileData?.address_zip
                                    ].filter(Boolean).join(', ') || 'Não informado'
                                  }</p>
                                </Col>
                              </Row>
                              <p><strong>Descrição dos Serviços:</strong></p>
                              <p>{profileData?.services_description || 'Não informado'}</p>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="shadow-sm">
                        <Card.Header>
                          <h5 className="mb-0">Resumo de Atividades</h5>
                        </Card.Header>
                        <Card.Body>
                          <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              Total de Atendimentos
                              <Badge bg="primary" pill>{reservations.length}</Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              Atendimentos Pendentes
                              <Badge bg="warning" pill>{reservations.filter(r => r.status === 'Pendente').length}</Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              Atendimentos Confirmadas
                              <Badge bg="success" pill>{reservations.filter(r => r.status === 'Confirmada').length}</Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              Total de Avaliações
                              <Badge bg="info" pill>{feedbacks.length}</Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              Certificações
                              <Badge bg="secondary" pill>{certificates.length}</Badge>
                            </ListGroup.Item>
                          </ListGroup>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>

                {/* Tab Reservas */}
                {!isPublicView && (
                  <Tab.Pane eventKey="reservas">
                    <Card className="shadow-sm">
                      <Card.Header>
                        <h5 className="mb-0">Gerenciar Atendimentos</h5>
                      </Card.Header>
                      <Card.Body>
                        {reservations.length === 0 ? (
                          <p className="text-muted text-center py-4">Nenhum atendimento encontrado.</p>
                        ) : (
                          <Table responsive striped hover>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Status</th>
                                <th>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reservations.map((reservation) => (
                                <tr key={reservation.id}>
                                  <td>{reservation.id}</td>
                                  <td>{reservation.client_name || reservation.cliente || 'Cliente não informado'}</td>
                                  <td>{reservation.date || reservation.data || 'Data não informada'}</td>
                                  <td>{reservation.time || reservation.horario || 'Horário não informado'}</td>
                                  <td>
                                    <Badge 
                                      bg={
                                        reservation.status === 'Confirmada' ? 'success' :
                                        reservation.status === 'Pendente' ? 'warning' :
                                        reservation.status === 'Cancelada' ? 'danger' : 'secondary'
                                      }
                                    >
                                      {reservation.status || 'Status não informado'}
                                    </Badge>
                                  </td>
                                  <td>
                                    {reservation.status === 'Pendente' && (
                                      <div className="d-flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="success"
                                          onClick={() => handleAcceptReservation(reservation.id)}
                                        >
                                          <FaCheck className="me-1" />
                                          Aceitar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline-primary"
                                          onClick={() => handleOpenSuggestModal(reservation.id)}
                                        >
                                          <FaClock className="me-1" />
                                          Sugerir
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                )}

                {/* Tab Avaliações */}
                <Tab.Pane eventKey="avaliacoes">
                  <Card className="shadow-sm">
                    <Card.Header>
                      <h5 className="mb-0">Avaliações dos Clientes</h5>
                    </Card.Header>
                    <Card.Body>
                      {feedbacks.length === 0 ? (
                        <p className="text-muted text-center py-4">Nenhuma avaliação encontrada.</p>
                      ) : (
                        <div>
                          {feedbacks.map((feedback, index) => (
                            <Card key={index} className="mb-3">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="mb-0">{feedback.client_name || feedback.cliente || 'Cliente Anônimo'}</h6>
                                  <div className="d-flex align-items-center">
                                    <StarRating rating={feedback.rating || 0} />
                                    <span className="ms-2 text-muted">({feedback.rating || 0}/5)</span>
                                  </div>
                                </div>
                                <p className="mb-1">{feedback.comment || feedback.comentario || 'Sem comentário'}</p>
                                <small className="text-muted">
                                  {feedback.date || feedback.data || 'Data não informada'}
                                </small>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* Tab Certificações */}
                <Tab.Pane eventKey="certificacoes">
                  <Card className="shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Certificações</h5>
                      {!isPublicView && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowAddCertificationModal(true)}
                        >
                          <FaPlus className="me-1" />
                          Adicionar Certificação
                        </Button>
                      )}
                    </Card.Header>
                    <Card.Body>
                      {certificates.length === 0 ? (
                        <p className="text-muted text-center py-4">Nenhuma certificação encontrada.</p>
                      ) : (
                        <Row>
                          {certificates.map((certificate, index) => (
                            <Col md={6} lg={4} key={index} className="mb-3">
                              <Card className="h-100">
                                {certificate.image_url && (
                                  <Card.Img
                                    variant="top"
                                    src={certificate.image_url}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <Card.Body>
                                  <Card.Title className="h6">{certificate.name || certificate.nome || 'Certificação'}</Card.Title>
                                  <Card.Text>
                                    <small className="text-muted">
                                      <strong>Emissor:</strong> {certificate.issuer || certificate.emissor || 'Não informado'}<br />
                                      <strong>Data de Emissão:</strong> {certificate.issue_date || certificate.data_emissao || 'Não informada'}<br />
                                      {(certificate.expiry_date || certificate.data_validade) && (
                                        <>
                                          <strong>Validade:</strong> {certificate.expiry_date || certificate.data_validade}
                                        </>
                                      )}
                                    </small>
                                  </Card.Text>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      )}
                    </Card.Body>
                  </Card>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>

      {/* Modais */}
      <SuggestTimeModal
        show={showSuggestModal}
        handleClose={handleCloseSuggestModal}
        handleSuggest={handleSuggestTime}
        reservationId={suggestReservationId}
      />

      <AddCertificationModal
        show={showAddCertificationModal}
        handleClose={() => setShowAddCertificationModal(false)}
        handleSaveCertification={handleSaveCertification}
      />
    </div>
  );
};

export default ServiceDashboard;

