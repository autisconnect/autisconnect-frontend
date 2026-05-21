// frontend/src/pages/Signup.jsx

import React, { useState } from 'react';
import { Container, Form, Card, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';
import axios from 'axios';
import apiClient from './services/api.js';
import logohori from './assets/logonovo.png';
import './App.css';

// Componente para exibir os cards de planos
const PlanCard = ({ title, price, features, planId, onSelect, isLoading, isSelected }) => (
    <Card className={`h-100 text-center shadow plan-card ${isSelected ? 'selected' : ''}`}>
        <Card.Header as="h5" className="plan-header">{title}</Card.Header>
        <Card.Body className="d-flex flex-column">
            <Card.Title className="display-4 fw-bold">{price}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">/mês</Card.Subtitle>
            <ul className="list-unstyled mt-3 mb-4 text-start">
                {features.map((feature, index) => <li key={index}>✓ {feature}</li>)}
            </ul>
            <Button 
                variant="success" 
                className="w-100 mt-auto"
                onClick={() => onSelect(planId)}
                disabled={isLoading}
            >
                {isLoading && isSelected ? <Spinner as="span" animation="border" size="sm" /> : 'Assinar Agora'}
            </Button>
        </Card.Body>
    </Card>
);

function Signup() {
    // --- ESTADOS PARA CONTROLAR O FLUXO ---
    const [etapa, setEtapa] = useState('selecao_tipo'); // 'selecao_tipo', 'formulario', 'planos'
    const [selectedPlan, setSelectedPlan] = useState(null); // Guarda o plano que o usuário está prestes a assinar

    // Seus estados existentes
    const [tipoUsuario, setTipoUsuario] = useState('');
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ value: 0, variant: 'danger', text: 'Senha fraca' });
    const navigate = useNavigate();
    const isBusinessUser = tipoUsuario === 'servicos_locais' || tipoUsuario === 'clinica';

    // --- LÓGICA DE NAVEGAÇÃO ENTRE ETAPAS ---
    const handleTipoUsuarioChange = (e) => {
        setTipoUsuario(e.target.value);
        setError('');
    };

    const handleContinuarParaFormulario = (e) => {
        e.preventDefault();
        if (tipoUsuario) {
            setEtapa('formulario');
        } else {
            setError('Por favor, selecione um tipo de usuário.');
        }
    };

    // --- LÓGICA DE CADASTRO E PAGAMENTO ---
    const handleSubmitCadastro = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordStrength.value < 30) {
            setError('Por favor, escolha uma senha mais forte.');
            return;
        }

        setIsLoading(true);
        try {
            const payload = { ...formData, username: formData.email, tipo_usuario: tipoUsuario };
            
            // PASSO 1: Cadastra o usuário no backend
            await apiClient.post("/signup", payload);
            
            // PASSO 2: Lógica condicional baseada no tipo de usuário
            if (isBusinessUser) {
                // Se for um serviço local (grátis), mostra sucesso e redireciona para o login.
                setSuccess('Cadastro realizado com sucesso! Você já pode fazer o login.');
                if (tipoUsuario === 'clinica') {
                    setSuccess('Cadastro da clínica realizado com sucesso! Você já pode fazer o login.');
                }
                setTimeout(() => navigate('/login'), 3000);
            } else {
                // Para usuários pagos, faz o login para obter o token e avança para a seleção de planos.
                const loginResponse = await apiClient.post('/auth/login', {
                    username: formData.email,
                    password: formData.password,
                });
                localStorage.setItem('token', loginResponse.data.token);

                setSuccess('Cadastro concluído! Agora, escolha seu plano para ativar a conta.');
                setEtapa('planos');
            }

        } catch (err) {
            console.error('Erro ao cadastrar:', err);
            setError(err.response?.data?.error || 'Erro de rede ao cadastrar.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssinarPlano = async (planId) => {
        setSelectedPlan(planId);
        setIsLoading(true);
        setError('');
        try {
            const response = await apiClient.post('/payment/create-subscription-checkout', { planId });
            const { checkoutUrl } = response.data;
            window.location.href = checkoutUrl;
        } catch (err) {
            console.error('Erro ao criar checkout:', err);
            setError(err.response?.data?.error || 'Não foi possível iniciar o processo de pagamento.');
            setIsLoading(false);
            setSelectedPlan(null);
        }
    };

    // Suas funções existentes (handleInputChange, checkPasswordStrength, etc.)
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            const current = formData[name] || [];
            const newValues = checked ? [...current, value] : current.filter((v) => v !== value);
            setFormData((prev) => ({ ...prev, [name]: newValues }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
        if (name === 'password') checkPasswordStrength(value);
    };

    const checkPasswordStrength = (password) => {
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        let score = 0;
        if (hasLowerCase) score++;
        if (hasUpperCase) score++;
        if (hasNumber) score++;
        if (hasSpecialChar) score++;
        if (isLongEnough) score++;

        let strength = { value: 0, variant: 'danger', text: 'Senha muito fraca' };
        if (score === 5) strength = { value: 100, variant: 'success', text: 'Senha forte' };
        else if (score >= 3) strength = { value: 60, variant: 'warning', text: 'Senha média' };
        else if (score >= 2) strength = { value: 30, variant: 'danger', text: 'Senha fraca' };
        setPasswordStrength(strength);
    };

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

    const buscarCnpj = async (cnpj) => {
        if (!cnpj || cnpj.length !== 14) return;

        setIsLoading(true);
        try {
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
                setError('');
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

    const handleCepChange = (e) => {
        const cep = e.target.value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, cep }));
        if (cep.length === 8) {
            buscarCep(cep);
        }
    };

    const handleCnpjChange = (e) => {
        const cnpj = e.target.value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, cnpj }));
        if (cnpj.length === 14) {
            buscarCnpj(cnpj);
        }
    };

    // --- RENDERIZAÇÃO CONDICIONAL DAS ETAPAS ---
    const renderEtapa = () => {
        switch (etapa) {
            case 'formulario':
                return (
                    <Card className="mx-auto" style={{ maxWidth: '800px' }}>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                {tipoUsuario === 'pais_responsavel' && 'Cadastro de Pais ou Responsável'}
                                {tipoUsuario === 'medicos_terapeutas' && 'Cadastro de Medicos ou Terapeutas'}
                                {tipoUsuario === 'clinica' && 'Cadastro de Clínica'}
                                {tipoUsuario === 'servicos_locais' && 'Cadastro de Servicos Locais'}
                            </Card.Title>
                            <Form onSubmit={handleSubmitCadastro}>
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
                                            <Card.Header className="bg-primary">
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
                                            <Card.Header className="bg-primary">
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
                                            <Card.Header className="bg-success">
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
                                                            <Form.Label>CNPJ Vinculado a Servicos</Form.Label>
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

                                {isBusinessUser && (
                                    <>
                                        <Card className="mb-4">
                                            <Card.Header className="bg-warning">
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
                                                                placeholder={tipoUsuario === 'clinica' ? 'Digite o email da clínica' : 'Digite o email da empresa'}
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
                                            <Card.Header className="bg-warning">
                                                <h5 className="mb-0">{tipoUsuario === 'clinica' ? 'Dados da Clínica' : 'Dados da Empresa'}</h5>
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
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3" controlId="formTelefoneServico">
                                                            <Form.Label>{tipoUsuario === 'clinica' ? 'Telefone da clínica' : 'Telefone'}</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="telefone"
                                                                placeholder={tipoUsuario === 'clinica' ? 'Telefone da clínica' : 'Telefone da empresa'}
                                                                onChange={handleInputChange}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3" controlId="formHorarioFuncionamento">
                                                            <Form.Label>Horário de Funcionamento</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="horario_funcionamento"
                                                                placeholder="Ex: Seg-Sex 08:00-18:00"
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
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3" controlId="formLatitudeEmpresa">
                                                            <Form.Label>Latitude (opcional)</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="latitude"
                                                                placeholder="Ex: -3.71722"
                                                                onChange={handleInputChange}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3" controlId="formLongitudeEmpresa">
                                                            <Form.Label>Longitude (opcional)</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="longitude"
                                                                placeholder="Ex: -38.54337"
                                                                onChange={handleInputChange}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                            </Card.Body>
                                        </Card>

                                                                                <Card className="mb-4">
                                            <Card.Header className="bg-warning">
                                                <h5 className="mb-0">Detalhes dos Servicos</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Row>
                                                    <Col md={12}>
                                                        <Form.Group className="mb-3" controlId="formServicosOferecidos">
                                                            <Form.Label>Servicos oferecidos</Form.Label>
                                                            <div className="d-flex flex-wrap gap-3">
                                                                <Form.Check type="checkbox" id="servico-aba" name="servicos" value="ABA" label="ABA" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-fono" name="servicos" value="Fonoaudiologia" label="Fonoaudiologia" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-psico" name="servicos" value="Psicopedagogia" label="Psicopedagogia" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-equo" name="servicos" value="Equoterapia" label="Equoterapia" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-natacao" name="servicos" value="Natacao Adaptada" label="Natacao Adaptada" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-musica" name="servicos" value="Musica" label="Musica" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-artes" name="servicos" value="Artes" label="Artes" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-odonto" name="servicos" value="Odontologia Sensorial" label="Odontologia Sensorial" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-psiq" name="servicos" value="Psiquiatria" label="Psiquiatria" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="servico-neuro" name="servicos" value="Neuropediatria" label="Neuropediatria" onChange={handleInputChange} />
                                                            </div>
                                                            <small className="text-muted">Selecione todos os servicos oferecidos.</small>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3" controlId="formModalidadeServico">
                                                            <Form.Label>Modalidade</Form.Label>
                                                            <Form.Select name="modalidade" onChange={handleInputChange} defaultValue="">
                                                                <option value="">Selecione...</option>
                                                                <option value="Presencial">Presencial</option>
                                                                <option value="Online">Online</option>
                                                                <option value="Hibrido">Hibrido</option>
                                                            </Form.Select>
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3" controlId="formNivelSuporteServico">
                                                            <Form.Label>Nivel de suporte atendido</Form.Label>
                                                            <div className="d-flex flex-wrap gap-3">
                                                                <Form.Check type="checkbox" id="nivel-1" name="nivel_suporte" value="1" label="Nivel 1" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="nivel-2" name="nivel_suporte" value="2" label="Nivel 2" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="nivel-3" name="nivel_suporte" value="3" label="Nivel 3" onChange={handleInputChange} />
                                                            </div>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3" controlId="formFaixaEtariaServico">
                                                            <Form.Label>Faixa etaria atendida</Form.Label>
                                                            <div className="d-flex flex-wrap gap-3">
                                                                <Form.Check type="checkbox" id="faixa-0-3" name="faixa_etaria" value="0-3" label="0-3 anos" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="faixa-4-7" name="faixa_etaria" value="4-7" label="4-7 anos" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="faixa-8-12" name="faixa_etaria" value="8-12" label="8-12 anos" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="faixa-13-17" name="faixa_etaria" value="13-17" label="13-17 anos" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="faixa-18" name="faixa_etaria" value="18+" label="18+ anos" onChange={handleInputChange} />
                                                            </div>
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3" controlId="formCoberturaServico">
                                                            <Form.Label>Cobertura</Form.Label>
                                                            <div className="d-flex flex-wrap gap-3">
                                                                <Form.Check type="checkbox" id="cobertura-convenio" name="cobertura" value="Convenio" label="Convenio" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="cobertura-particular" name="cobertura" value="Particular" label="Particular" onChange={handleInputChange} />
                                                                <Form.Check type="checkbox" id="cobertura-plano" name="cobertura" value="PlanoSaude" label="Plano de Saude" onChange={handleInputChange} />
                                                            </div>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>

                                        <Card className="mb-4">
                                            <Card.Header className="bg-warning">
                                                <h5 className="mb-0">Descricao e Vinculacao</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Row>
                                                    <Col md={12}>
                                                        <Form.Group className="mb-3" controlId="formDescricaoServico">
                                                            <Form.Label>Descricao dos Servicos</Form.Label>
                                                            <Form.Control
                                                                as="textarea"
                                                                rows={4}
                                                                name="descricao_servico"
                                                                placeholder="Descreva os servicos oferecidos pela empresa"
                                                                onChange={handleInputChange}
                                                                required
                                                            />
                                                            <small className="text-muted">Detalhe os servicos, especialidades e diferenciais da empresa</small>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={12}>
                                                        <Form.Group className="mb-3" controlId="formVinculacaoMedico">
                                                            <Form.Label>Vinculacao a Medico ou Profissional</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="vinculacao_medico"
                                                                placeholder="Nome do medico ou profissional responsavel (opcional)"
                                                                onChange={handleInputChange}
                                                            />
                                                            <small className="text-muted">Informe o nome do medico ou profissional responsavel pelos servicos</small>
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
                                        {isLoading ? 'Salvando...' : 'Salvar e Escolher Plano'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                );

            case 'planos':
                return (
                    <Container>
                        <h2 className="text-center text-white mb-4">Quase lá! Escolha seu plano para ativar a conta.</h2>
                        {success && <Alert variant="success">{success}</Alert>}
                        
                        {tipoUsuario === 'pais_responsavel' && (
                            <Row>
                                <Col md={{ span: 6, offset: 3 }} className="mb-4">
                                    <PlanCard title="Plano Acompanhar+" price="R$ 89,90" features={['Gerenciamento Completo', 'Todos os Monitoramentos com IA', 'Análise Preditiva e Insights']} planId="acompanhar_plus" onSelect={handleAssinarPlano} isLoading={isLoading} isSelected={selectedPlan === 'acompanhar_plus'} />
                                </Col>
                            </Row>
                        )}

                        {tipoUsuario === 'medicos_terapeutas' && (
                            <Row>
                                <Col md={6} lg={3} className="mb-4"><PlanCard title="Analisar+ 50" price="R$ 189,90" features={['Até 50 Pacientes', 'Acesso completo à IA']} planId="analisar_plus_50" onSelect={handleAssinarPlano} isLoading={isLoading} isSelected={selectedPlan === 'analisar_plus_50'} /></Col>
                                <Col md={6} lg={3} className="mb-4"><PlanCard title="Analisar+ 100" price="R$ 259,90" features={['Até 100 Pacientes', 'Acesso completo à IA']} planId="analisar_plus_100" onSelect={handleAssinarPlano} isLoading={isLoading} isSelected={selectedPlan === 'analisar_plus_100'} /></Col>
                                <Col md={6} lg={3} className="mb-4"><PlanCard title="Analisar+ 200" price="R$ 349,90" features={['Até 200 Pacientes', 'Acesso completo à IA']} planId="analisar_plus_200" onSelect={handleAssinarPlano} isLoading={isLoading} isSelected={selectedPlan === 'analisar_plus_200'} /></Col>
                                <Col md={6} lg={3} className="mb-4"><PlanCard title="Analisar+ 500" price="R$ 499,90" features={['Até 500 Pacientes', 'Acesso completo à IA']} planId="analisar_plus_500" onSelect={handleAssinarPlano} isLoading={isLoading} isSelected={selectedPlan === 'analisar_plus_500'} /></Col>
                            </Row>
                        )}
                    </Container>
                );
            case 'selecao_tipo':
            default:
                return (
                    <Card className="mx-auto" style={{ maxWidth: '400px' }}>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">Selecione o Tipo de Usuário</Card.Title>
                            <Form onSubmit={handleContinuarParaFormulario}>
                                <Form.Group className="mb-3">
                                    <Form.Select value={tipoUsuario} onChange={handleTipoUsuarioChange} required>
                                        <option value="">Selecione...</option>
                                        <option value="pais_responsavel">Pais ou Responsável</option>
                                        <option value="medicos_terapeutas">Medicos ou Terapeutas</option>
                                        <option value="clinica">Clinica</option>
                                        {/*<option value="servicos_locais">Servicos Locais (Grátis)</option>*/}
                                    </Form.Select>
                                </Form.Group>
                                <Button variant="primary" type="submit" className="w-100">Continuar</Button>
                            </Form>
                        </Card.Body>
                    </Card>
                );
        }
    };

    return (
        <div className="App auth-page">
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={7} className="text-center text-md-start">
                            <img src={logohori} alt="AutisConnect" className="top-bar-logo" />
                        </Col>
                        <Col md={5} className="text-center text-md-end">
                            <ArrowLeft size={30} onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#ffffff' }} />
                        </Col>
                    </Row>
                </Container>
            </nav>

            <div className="home-page" style={{ paddingTop: '85px' }}>
                <section className="hero-section hero-short">
                    <Container>
                        <Row className="align-items-start">
                            <Col lg={5} className="mb-4 mb-lg-0">
                                <div className="hero-content-box p-4 rounded-4">
                                    <h1 className="display-5 fw-bold mb-3 text-white">
                                        Bem-vindo ao <span className="text-gradient">AutisConnect</span>
                                    </h1>
                                    <p className="text-white-90 mb-0">
                                        {etapa === 'planos'
                                            ? 'Falta pouco! Escolha o plano ideal para ativar sua conta.'
                                            : 'Cadastre-se para comecar a conectar sua familia a servicos inclusivos e suporte especializado.'}
                                    </p>
                                </div>
                            </Col>
                            <Col lg={7}>
                                {error && <Alert variant="danger">{error}</Alert>}
                                {renderEtapa()}
                            </Col>
                        </Row>
                    </Container>
                </section>

                <footer className="footer-section py-4">
                    <Container>
                        <Row className="align-items-center">
                            <Col md={6} className="footer-left text-start">
                                <p className="mb-0">
                                    {'\u00a9'} 2026 Nf Representações Comerciais Ltda.<br />
                                    <small>Todos os direitos reservados.</small>
                                </p>
                            </Col>
                        </Row>
                    </Container>
                </footer>
            </div>
        </div>
    );
}

export default Signup;
