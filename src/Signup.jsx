import React, { useState } from 'react';
import { Container, Navbar, Form, Card, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';
import apiClient from '@/services/api.js';
import logohori from './assets/logohoriz.jpg';
import './App.css';

function Signup() {
    const [tipoUsuario, setTipoUsuario] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        value: 0,
        variant: 'danger',
        text: 'Senha fraca'
    });
    const navigate = useNavigate();

    const handleBackToHome = () => {
        navigate('/');
    };

    const handleTipoUsuarioChange = (e) => {
        setTipoUsuario(e.target.value);
        setError('');
        setSuccess('');
    };

    const handleContinuar = (e) => {
        e.preventDefault();
        if (tipoUsuario) {
            setMostrarFormulario(true);
        } else {
            setError('Por favor, selecione um tipo de usuário.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData((prev) => {
                const current = prev[name] || [];
                if (checked) {
                    return { ...prev, [name]: [...current, value] };
                } else {
                    return { ...prev, [name]: current.filter((v) => v !== value) };
                }
            });
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        // Verificar força da senha se o campo for password
        if (name === 'password') {
            checkPasswordStrength(value);
        }
    };

    const checkPasswordStrength = (password) => {
        // Critérios de força da senha
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        // Calcular pontuação
        let score = 0;
        if (hasLowerCase) score += 1;
        if (hasUpperCase) score += 1;
        if (hasNumber) score += 1;
        if (hasSpecialChar) score += 1;
        if (isLongEnough) score += 1;

        // Definir força com base na pontuação
        let strength = {
            value: 0,
            variant: 'danger',
            text: 'Senha muito fraca'
        };

        if (score === 5) {
            strength = { value: 100, variant: 'success', text: 'Senha forte' };
        } else if (score >= 3) {
            strength = { value: 60, variant: 'warning', text: 'Senha média' };
        } else if (score >= 2) {
            strength = { value: 30, variant: 'danger', text: 'Senha fraca' };
        }

        setPasswordStrength(strength);
    };

    // Função para buscar endereço pelo CEP
    const buscarCep = async (cep) => {
        if (!cep || cep.length !== 8) return;

        setIsLoading(true);
        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.data.erro) {
                setFormData(prev => ({
                    ...prev,
                    logradouro: response.data.logradouro || '',
                    bairro: response.data.bairro || '',
                    cidade: response.data.localidade || '',
                    estado: response.data.uf || '',
                    pais: 'Brasil'
                }));
            } else {
                setError('CEP não encontrado. Por favor, verifique o CEP informado.');
            }
        } catch (err) {
            setError('Erro ao buscar CEP. Por favor, tente novamente.');
            console.error('Erro ao buscar CEP:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Função para buscar dados da empresa pelo CNPJ
    const buscarCnpj = async (cnpj) => {
        if (!cnpj || cnpj.length !== 14) return;

        setIsLoading(true);
        try {
            // Usando a BrasilAPI para consulta de CNPJ (resolve problemas de CORS)
            const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (response.data) {
                setFormData(prev => ({
                    ...prev,
                    razao_social: response.data.razao_social || response.data.nome || '',
                    nome_fantasia: response.data.nome_fantasia || response.data.fantasia || '',
                    cep_empresa: response.data.cep ? response.data.cep.replace(/\D/g, '') : '',
                    logradouro_empresa: response.data.logradouro || '',
                    bairro_empresa: response.data.bairro || '',
                    cidade_empresa: response.data.municipio || '',
                    estado_empresa: response.data.uf || '',
                    pais_empresa: 'Brasil'
                }));
                setError(''); // Limpar erro se a busca foi bem-sucedida
            } else {
                setError('CNPJ não encontrado ou inválido. Por favor, verifique o CNPJ informado.');
            }
        } catch (err) {
            console.error('Erro ao buscar CNPJ:', err);
            if (err.response?.status === 404) {
                setError('CNPJ não encontrado. Por favor, verifique o CNPJ informado.');
            } else if (err.response?.status === 400) {
                setError('CNPJ inválido. Por favor, digite apenas os 14 números do CNPJ.');
            } else {
                setError('Erro ao buscar dados do CNPJ. Por favor, tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handler para o campo de CEP
    const handleCepChange = (e) => {
        const cep = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        setFormData(prev => ({ ...prev, cep }));
        
        if (cep.length === 8) {
            buscarCep(cep);
        }
    };

    // Handler para o campo de CNPJ
    const handleCnpjChange = (e) => {
        const cnpj = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        setFormData(prev => ({ ...prev, cnpj }));
        
        if (cnpj.length === 14) {
            buscarCnpj(cnpj);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validar força da senha
        if (passwordStrength.value < 30) {
            setError('Por favor, escolha uma senha mais forte.');
            return;
        }

        try {
            setIsLoading(true);
            const payload = {
                ...formData,
                username: formData.email,
                tipo_usuario: tipoUsuario
            };

            console.log("Enviando este payload para o backend:", payload);

            const response = await apiClient.post("/signup", payload);
            setSuccess(response.data.message || 'Cadastro realizado com sucesso!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            console.error('Erro ao cadastrar:', err);
            if (err.response && err.response.data) {
                setError(err.response.data.error || 'Erro desconhecido do servidor.');
            } else {
                setError('Erro de rede. Não foi possível conectar ao servidor.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="App">
            <Navbar bg="light" expand="lg" fixed="top" className="mb-4">
                <Container>
                    <Navbar.Brand>
                        <img
                            src={logohori}
                            alt="Logo Autisconnect Horizontal"
                            className="d-inline-block align-top logo"
                        />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <div className="ms-auto">
                            <ArrowLeft
                                size={30}
                                onClick={handleBackToHome}
                                style={{ cursor: 'pointer', color: '#007bff' }}
                                title="Voltar para a Home"
                            />
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <section className="signup-section py-5" style={{ marginTop: '70px' }}>
                <Container>
                    <h1 className="display-3 fw-bold mb-4 text-white">
                        Bem-vindo ao <span className="text-gradient"> AutisConnect</span>
                    </h1>
                    <p className="text-center lead mb-5">
                        Cadastre-se para começar a conectar sua família a serviços inclusivos e suporte especializado.
                    </p>

                    {error && <Alert variant="danger" className="mx-auto" style={{ maxWidth: '600px' }}>{error}</Alert>}
                    {success && <Alert variant="success" className="mx-auto" style={{ maxWidth: '600px' }}>{success}</Alert>}

                    {!mostrarFormulario ? (
                        <Card className="mx-auto" style={{ maxWidth: '400px' }}>
                            <Card.Body>
                                <Card.Title className="text-center mb-4">Selecione o Tipo de Usuário</Card.Title>
                                <Form onSubmit={handleContinuar}>
                                    <Form.Group className="mb-3" controlId="formUsuario">
                                        <Form.Label>Usuário</Form.Label>
                                        <Form.Select
                                            value={tipoUsuario}
                                            onChange={handleTipoUsuarioChange}
                                            required
                                        >
                                            <option value="">Selecione o tipo de usuário</option>
                                            <option value="pais_responsavel">Pais ou Responsável</option>
                                            <option value="medicos_terapeutas">Médicos ou Terapeutas</option>
                                            <option value="servicos_locais">Serviços Locais</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Button variant="primary" type="submit" className="w-100">
                                        Continuar
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Card className="mx-auto" style={{ maxWidth: '800px' }}>
                            <Card.Body>
                                <Card.Title className="text-center mb-4">
                                    {tipoUsuario === 'pais_responsavel' && 'Cadastro de Pais ou Responsável'}
                                    {tipoUsuario === 'medicos_terapeutas' && 'Cadastro de Médicos ou Terapeutas'}
                                    {tipoUsuario === 'servicos_locais' && 'Cadastro de Serviços Locais'}
                                </Card.Title>
                                <Form onSubmit={handleSubmit}>
                                    {/* FORMULÁRIO PARA PAIS E RESPONSÁVEIS */}
                                    {tipoUsuario === 'pais_responsavel' && (
                                        <>
                                            <Card className="mb-4">
                                                <Card.Header className="bg-primary">
                                                    <h5 className="mb-0">Dados de Login</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formEmail">
                                                                <Form.Label>Email</Form.Label>
                                                                <Form.Control
                                                                    type="email"
                                                                    name="email"
                                                                    placeholder="Digite seu email"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formPassword">
                                                                <Form.Label>Senha</Form.Label>
                                                                <Form.Control
                                                                    type="password"
                                                                    name="password"
                                                                    placeholder="Digite sua senha"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                                <div className="mt-2">
                                                                    <div className="progress" style={{ height: '5px' }}>
                                                                        <div 
                                                                            className={`progress-bar bg-${passwordStrength.variant}`} 
                                                                            role="progressbar" 
                                                                            style={{ width: `${passwordStrength.value}%` }}
                                                                            aria-valuenow={passwordStrength.value} 
                                                                            aria-valuemin="0" 
                                                                            aria-valuemax="100"
                                                                        ></div>
                                                                    </div>
                                                                    <small className={`text-${passwordStrength.variant}`}>{passwordStrength.text}</small>
                                                                    <div className="mt-1">
                                                                        <small className="text-muted">A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.</small>
                                                                    </div>
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-4">
                                                <Card.Header className="bg-primary ">
                                                    <h5 className="mb-0">Dados do Pai/Mãe ou Responsável</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3" controlId="formNomeCompleto">
                                                                <Form.Label>Nome Completo</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="nome_completo"
                                                                    placeholder="Digite seu nome completo"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formCpf">
                                                                <Form.Label>CPF</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cpf"
                                                                    placeholder="Digite seu CPF"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formTelefone">
                                                                <Form.Label>Telefone</Form.Label>
                                                                <Form.Control
                                                                    type="tel"
                                                                    name="telefone"
                                                                    placeholder="Digite seu telefone"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formCep">
                                                                <Form.Label>CEP</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cep"
                                                                    placeholder="Digite o CEP"
                                                                    value={formData.cep || ''}
                                                                    onChange={handleCepChange}
                                                                    maxLength={8}
                                                                    required
                                                                />
                                                                <small className="text-muted">Digite apenas números</small>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={8}>
                                                            <Form.Group className="mb-3" controlId="formLogradouro">
                                                                <Form.Label>Logradouro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="logradouro"
                                                                    placeholder="Logradouro será preenchido automaticamente"
                                                                    value={formData.logradouro || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formNumero">
                                                                <Form.Label>Número</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="numero"
                                                                    placeholder="Digite o número"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={8}>
                                                            <Form.Group className="mb-3" controlId="formComplemento">
                                                                <Form.Label>Complemento</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="complemento"
                                                                    placeholder="Digite o complemento (opcional)"
                                                                    onChange={handleInputChange}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formBairro">
                                                                <Form.Label>Bairro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="bairro"
                                                                    placeholder="Bairro será preenchido automaticamente"
                                                                    value={formData.bairro || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formCidade">
                                                                <Form.Label>Cidade</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cidade"
                                                                    placeholder="Cidade será preenchida automaticamente"
                                                                    value={formData.cidade || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formEstado">
                                                                <Form.Label>Estado</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="estado"
                                                                    placeholder="Estado será preenchido automaticamente"
                                                                    value={formData.estado || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3" controlId="formParentesco">
                                                                <Form.Label>Parentesco</Form.Label>
                                                                <Form.Select
                                                                    name="parentesco"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                >
                                                                    <option value="">Selecione o parentesco</option>
                                                                    <option value="pai">Pai</option>
                                                                    <option value="mae">Mãe</option>
                                                                    <option value="outro">Outro</option>
                                                                </Form.Select>
                                                            </Form.Group>
                                                            {formData.parentesco === 'outro' && (
                                                                <Form.Group className="mb-3" controlId="formOutroParentesco">
                                                                    <Form.Label>Especifique o parentesco</Form.Label>
                                                                    <Form.Control
                                                                        type="text"
                                                                        name="outro_parentesco"
                                                                        placeholder="Digite o parentesco"
                                                                        onChange={handleInputChange}
                                                                        required
                                                                    />
                                                                </Form.Group>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-4">
                                                <Card.Header className="bg-primary ">
                                                    <h5 className="mb-0">Dados do Autista</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3" controlId="formNomeAutista">
                                                                <Form.Label>Nome Completo</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="nome_autista"
                                                                    placeholder="Digite o nome completo do autista"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formCpfAutista">
                                                                <Form.Label>CPF</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cpf_autista"
                                                                    placeholder="Digite o CPF do autista"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formDataNascimento">
                                                                <Form.Label>Data de Nascimento</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    name="data_nascimento"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </>
                                    )}

                                    {/* FORMULÁRIO PARA MÉDICOS E TERAPEUTAS */}
                                    {tipoUsuario === 'medicos_terapeutas' && (
                                        <>
                                            <Card className="mb-4">
                                                <Card.Header className="bg-success">
                                                    <h5 className="mb-0">Dados de Login</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formEmailMedico">
                                                                <Form.Label>Email</Form.Label>
                                                                <Form.Control
                                                                    type="email"
                                                                    name="email"
                                                                    placeholder="Digite seu email"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formPasswordMedico">
                                                                <Form.Label>Senha</Form.Label>
                                                                <Form.Control
                                                                    type="password"
                                                                    name="password"
                                                                    placeholder="Digite sua senha"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                                <div className="mt-2">
                                                                    <div className="progress" style={{ height: '5px' }}>
                                                                        <div 
                                                                            className={`progress-bar bg-${passwordStrength.variant}`} 
                                                                            role="progressbar" 
                                                                            style={{ width: `${passwordStrength.value}%` }}
                                                                            aria-valuenow={passwordStrength.value} 
                                                                            aria-valuemin="0" 
                                                                            aria-valuemax="100"
                                                                        ></div>
                                                                    </div>
                                                                    <small className={`text-${passwordStrength.variant}`}>{passwordStrength.text}</small>
                                                                    <div className="mt-1">
                                                                        <small className="text-muted">A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.</small>
                                                                    </div>
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-4">
                                                <Card.Header className="bg-success">
                                                    <h5 className="mb-0">Dados Pessoais</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3" controlId="formNomeCompletoMedico">
                                                                <Form.Label>Nome Completo</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="nome_completo"
                                                                    placeholder="Digite seu nome completo"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formCpfMedico">
                                                                <Form.Label>CPF</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cpf"
                                                                    placeholder="Digite seu CPF"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formTelefoneMedico">
                                                                <Form.Label>Telefone</Form.Label>
                                                                <Form.Control
                                                                    type="tel"
                                                                    name="telefone"
                                                                    placeholder="Digite seu telefone"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formCepMedico">
                                                                <Form.Label>CEP</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cep"
                                                                    placeholder="Digite o CEP"
                                                                    value={formData.cep || ''}
                                                                    onChange={handleCepChange}
                                                                    maxLength={8}
                                                                    required
                                                                />
                                                                <small className="text-muted">Digite apenas números</small>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={8}>
                                                            <Form.Group className="mb-3" controlId="formLogradouroMedico">
                                                                <Form.Label>Logradouro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="logradouro"
                                                                    placeholder="Logradouro será preenchido automaticamente"
                                                                    value={formData.logradouro || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formNumeroMedico">
                                                                <Form.Label>Número</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="numero"
                                                                    placeholder="Digite o número"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={8}>
                                                            <Form.Group className="mb-3" controlId="formComplementoMedico">
                                                                <Form.Label>Complemento</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="complemento"
                                                                    placeholder="Digite o complemento (opcional)"
                                                                    onChange={handleInputChange}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formBairroMedico">
                                                                <Form.Label>Bairro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="bairro"
                                                                    placeholder="Bairro será preenchido automaticamente"
                                                                    value={formData.bairro || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formCidadeMedico">
                                                                <Form.Label>Cidade</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cidade"
                                                                    placeholder="Cidade será preenchida automaticamente"
                                                                    value={formData.cidade || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formEstadoMedico">
                                                                <Form.Label>Estado</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="estado"
                                                                    placeholder="Estado será preenchido automaticamente"
                                                                    value={formData.estado || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-4">
                                                <Card.Header className="bg-success ">
                                                    <h5 className="mb-0">Dados Profissionais</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formRegistroProfissional">
                                                                <Form.Label>Registro Profissional</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="registro_profissional"
                                                                    placeholder="Ex: CRM 12345/SP, CRP 06/123456"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                                <small className="text-muted">Informe o número do seu registro profissional</small>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formCnpjVinculado">
                                                                <Form.Label>CNPJ Vinculado a Serviços</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cnpj_vinculado"
                                                                    placeholder="Digite o CNPJ (opcional)"
                                                                    onChange={handleInputChange}
                                                                />
                                                                <small className="text-muted">CNPJ da clínica ou instituição onde atua</small>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3" controlId="formEspecialidades">
                                                                <Form.Label>Especialidades</Form.Label>
                                                                <div className="mb-2">
                                                                    <Row>
                                                                        <Col md={6}>
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-psicologia-infantil"
                                                                                name="especialidades"
                                                                                value="Psicologia Infantil"
                                                                                label="Psicologia Infantil"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-terapia-aba"
                                                                                name="especialidades"
                                                                                value="Terapia ABA"
                                                                                label="Terapia ABA"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-fonoaudiologia"
                                                                                name="especialidades"
                                                                                value="Fonoaudiologia"
                                                                                label="Fonoaudiologia"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-terapia-ocupacional"
                                                                                name="especialidades"
                                                                                value="Terapia Ocupacional"
                                                                                label="Terapia Ocupacional"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-fisioterapia"
                                                                                name="especialidades"
                                                                                value="Fisioterapia"
                                                                                label="Fisioterapia"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                        </Col>
                                                                        <Col md={6}>
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-neurologia"
                                                                                name="especialidades"
                                                                                value="Neurologia"
                                                                                label="Neurologia"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-psiquiatria"
                                                                                name="especialidades"
                                                                                value="Psiquiatria"
                                                                                label="Psiquiatria"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-pediatria"
                                                                                name="especialidades"
                                                                                value="Pediatria"
                                                                                label="Pediatria"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-musicoterapia"
                                                                                name="especialidades"
                                                                                value="Musicoterapia"
                                                                                label="Musicoterapia"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id="esp-outros"
                                                                                name="especialidades"
                                                                                value="outros"
                                                                                label="Outros"
                                                                                onChange={handleInputChange}
                                                                            />
                                                                        </Col>
                                                                    </Row>
                                                                </div>
                                                                {formData.especialidades && formData.especialidades.includes('outros') && (
                                                                    <Form.Group className="mb-3" controlId="formOutrasEspecialidades">
                                                                        <Form.Label>Especifique outras especialidades</Form.Label>
                                                                        <Form.Control
                                                                            as="textarea"
                                                                            rows={2}
                                                                            name="outras_especialidades"
                                                                            placeholder="Descreva outras especialidades não listadas"
                                                                            onChange={handleInputChange}
                                                                            required
                                                                        />
                                                                    </Form.Group>
                                                                )}
                                                                <small className="text-muted">Selecione todas as especialidades que se aplicam</small>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </>
                                    )}

                                    {/* FORMULÁRIO PARA SERVIÇOS LOCAIS */}
                                    {tipoUsuario === 'servicos_locais' && (
                                        <>
                                            <Card className="mb-4">
                                                <Card.Header className="bg-warning ">
                                                    <h5 className="mb-0">Dados de Login</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formEmailServico">
                                                                <Form.Label>Email</Form.Label>
                                                                <Form.Control
                                                                    type="email"
                                                                    name="email"
                                                                    placeholder="Digite o email da empresa"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formPasswordServico">
                                                                <Form.Label>Senha</Form.Label>
                                                                <Form.Control
                                                                    type="password"
                                                                    name="password"
                                                                    placeholder="Digite sua senha"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                                <div className="mt-2">
                                                                    <div className="progress" style={{ height: '5px' }}>
                                                                        <div 
                                                                            className={`progress-bar bg-${passwordStrength.variant}`} 
                                                                            role="progressbar" 
                                                                            style={{ width: `${passwordStrength.value}%` }}
                                                                            aria-valuenow={passwordStrength.value} 
                                                                            aria-valuemin="0" 
                                                                            aria-valuemax="100"
                                                                        ></div>
                                                                    </div>
                                                                    <small className={`text-${passwordStrength.variant}`}>{passwordStrength.text}</small>
                                                                    <div className="mt-1">
                                                                        <small className="text-muted">A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.</small>
                                                                    </div>
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-4">
                                                <Card.Header className="bg-warning ">
                                                    <h5 className="mb-0">Dados da Empresa</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formCnpj">
                                                                <Form.Label>CNPJ</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cnpj"
                                                                    placeholder="Digite o CNPJ"
                                                                    value={formData.cnpj || ''}
                                                                    onChange={handleCnpjChange}
                                                                    maxLength={14}
                                                                    required
                                                                />
                                                                <small className="text-muted">Digite apenas números</small>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3" controlId="formRazaoSocial">
                                                                <Form.Label>Razão Social</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="razao_social"
                                                                    placeholder="Razão social será preenchida automaticamente"
                                                                    value={formData.razao_social || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3" controlId="formNomeFantasia">
                                                                <Form.Label>Nome Fantasia</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="nome_fantasia"
                                                                    placeholder="Nome fantasia será preenchido automaticamente"
                                                                    value={formData.nome_fantasia || ''}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formCepEmpresa">
                                                                <Form.Label>CEP</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cep_empresa"
                                                                    placeholder="CEP será preenchido automaticamente"
                                                                    value={formData.cep_empresa || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={8}>
                                                            <Form.Group className="mb-3" controlId="formLogradouroEmpresa">
                                                                <Form.Label>Logradouro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="logradouro_empresa"
                                                                    placeholder="Logradouro será preenchido automaticamente"
                                                                    value={formData.logradouro_empresa || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formNumeroEmpresa">
                                                                <Form.Label>Número</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="numero_empresa"
                                                                    placeholder="Digite o número"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={8}>
                                                            <Form.Group className="mb-3" controlId="formComplementoEmpresa">
                                                                <Form.Label>Complemento</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="complemento_empresa"
                                                                    placeholder="Digite o complemento (opcional)"
                                                                    onChange={handleInputChange}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formBairroEmpresa">
                                                                <Form.Label>Bairro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="bairro_empresa"
                                                                    placeholder="Bairro será preenchido automaticamente"
                                                                    value={formData.bairro_empresa || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formCidadeEmpresa">
                                                                <Form.Label>Cidade</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="cidade_empresa"
                                                                    placeholder="Cidade será preenchida automaticamente"
                                                                    value={formData.cidade_empresa || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3" controlId="formEstadoEmpresa">
                                                                <Form.Label>Estado</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="estado_empresa"
                                                                    placeholder="Estado será preenchido automaticamente"
                                                                    value={formData.estado_empresa || ''}
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-4">
                                                <Card.Header className="bg-warning ">
                                                    <h5 className="mb-0">Descrição e Vinculação</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3" controlId="formDescricaoServico">
                                                                <Form.Label>Descrição dos Serviços</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    name="descricao_servico"
                                                                    placeholder="Descreva os serviços oferecidos pela empresa"
                                                                    onChange={handleInputChange}
                                                                    required
                                                                />
                                                                <small className="text-muted">Detalhe os serviços, especialidades e diferenciais da empresa</small>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3" controlId="formVinculacaoMedico">
                                                                <Form.Label>Vinculação a Médico ou Profissional</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    name="vinculacao_medico"
                                                                    placeholder="Nome do médico ou profissional responsável (opcional)"
                                                                    onChange={handleInputChange}
                                                                />
                                                                <small className="text-muted">Informe o nome do médico ou profissional responsável pelos serviços</small>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </>
                                    )}

                                    <div className="text-center">
                                        <Button 
                                            variant="primary" 
                                            type="submit" 
                                            size="lg" 
                                            disabled={isLoading}
                                            className="px-5"
                                        >
                                            {isLoading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}
                </Container>
            </section>
        </div>
    );
}

export default Signup;

