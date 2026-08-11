import React, { useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Building,
    Check2,
    CheckCircleFill,
    Envelope,
    ExclamationTriangle,
    Eye,
    EyeSlash,
    GeoAlt,
    GraphUp,
    Heart,
    Lock,
    People,
    ShieldCheck,
    Stars,
    Wallet2
} from 'react-bootstrap-icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from './services/api.js';
import logohori from './assets/logonovo.png';
import './App.css';
import './Login.css';
import './Signup.css';

const profileOptions = [
    {
        value: 'pais_responsavel',
        title: 'Pais / Responsável',
        description: 'Acompanhe o desenvolvimento e organize o cuidado com praticidade.',
        icon: People
    },
    {
        value: 'medicos_terapeutas',
        title: 'Profissionais',
        description: 'Gerencie pacientes, evolução e atendimentos em um ambiente de trabalho premium.',
        icon: Briefcase
    },
    {
        value: 'clinica',
        title: 'Clínica',
        description: 'Gerencie serviços e conexões profissionais em uma operação integrada.',
        icon: Building
    }
];

const benefitItems = [
    {
        icon: ShieldCheck,
        label: 'Dados e segurança'
    },
    {
        icon: GraphUp,
        label: 'Acompanhamento inteligente'
    },
    {
        icon: Heart,
        label: 'Conexão entre cuidado e tecnologia'
    }
];

const professionalSpecialties = [
    'Psicologia Infantil',
    'Terapia ABA',
    'Fonoaudiologia',
    'Terapia Ocupacional',
    'Fisioterapia',
    'Neurologia',
    'Psiquiatria',
    'Pediatria',
    'Musicoterapia',
    'outros'
];

const businessServices = [
    'ABA',
    'Fonoaudiologia',
    'Psicopedagogia',
    'Equoterapia',
    'Natacao Adaptada',
    'Musica',
    'Artes',
    'Odontologia Sensorial',
    'Psiquiatria',
    'Neuropediatria'
];

const supportLevels = [
    { value: '1', label: 'Nível 1' },
    { value: '2', label: 'Nível 2' },
    { value: '3', label: 'Nível 3' }
];

const ageRanges = [
    { value: '0-3', label: '0-3 anos' },
    { value: '4-7', label: '4-7 anos' },
    { value: '8-12', label: '8-12 anos' },
    { value: '13-17', label: '13-17 anos' },
    { value: '18+', label: '18+ anos' }
];

const coverageOptions = [
    { value: 'Convenio', label: 'Convênio' },
    { value: 'Particular', label: 'Particular' },
    { value: 'PlanoSaude', label: 'Plano de Saúde' }
];

const parentPlans = [
    {
        title: 'Plano Acompanhar+',
        price: 'R$ 89,90',
        planId: 'acompanhar_plus',
        features: ['Gerenciamento Completo', 'Todos os Monitoramentos com IA', 'Análise Preditiva e Insights']
    }
];

const professionalPlans = [
    {
        title: 'Analisar+ 50',
        price: 'R$ 189,90',
        planId: 'analisar_plus_50',
        features: ['Até 50 Pacientes', 'Acesso completo à IA']
    },
    {
        title: 'Analisar+ 100',
        price: 'R$ 259,90',
        planId: 'analisar_plus_100',
        features: ['Até 100 Pacientes', 'Acesso completo à IA']
    },
    {
        title: 'Analisar+ 200',
        price: 'R$ 349,90',
        planId: 'analisar_plus_200',
        features: ['Até 200 Pacientes', 'Acesso completo à IA']
    },
    {
        title: 'Analisar+ 500',
        price: 'R$ 499,90',
        planId: 'analisar_plus_500',
        features: ['Até 500 Pacientes', 'Acesso completo à IA']
    }
];

const getPasswordCriteria = (password) => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
});

function SignupAlert({ variant, title, message }) {
    const icon = variant === 'success' ? CheckCircleFill : ExclamationTriangle;
    const Icon = icon;

    return (
        <div className={`ac-signup-alert ac-signup-alert--${variant}`} role="alert" aria-live="polite">
            <span className="ac-signup-alert__icon">
                <Icon />
            </span>
            <div>
                <strong>{title}</strong>
                <p>{message}</p>
            </div>
        </div>
    );
}

function SignupStepper({ etapa }) {
    const currentIndex = etapa === 'selecao_tipo' ? 0 : etapa === 'formulario' ? 1 : 2;
    const steps = [
        { label: 'Perfil', icon: People },
        { label: 'Cadastro', icon: ShieldCheck },
        { label: 'Plano', icon: Wallet2 }
    ];

    return (
        <div className="ac-signup-stepper" aria-label="Progresso do cadastro">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentIndex;
                const isComplete = index < currentIndex;

                return (
                    <div
                        key={step.label}
                        className={`ac-signup-step${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`}
                    >
                        <span className="ac-signup-step__marker">
                            {isComplete ? <Check2 /> : <Icon />}
                        </span>
                        <span className="ac-signup-step__label">{step.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function UserTypeCard({ option, selected, onSelect }) {
    const Icon = option.icon;

    return (
        <label className={`ac-signup-profile-card${selected ? ' is-selected' : ''}`} htmlFor={`tipo-${option.value}`}>
            <input
                id={`tipo-${option.value}`}
                className="ac-signup-profile-card__input"
                type="radio"
                name="tipoUsuario"
                value={option.value}
                checked={selected}
                onChange={onSelect}
            />
            <div className="ac-signup-profile-card__icon">
                <Icon />
            </div>
            <div className="ac-signup-profile-card__copy">
                <strong>{option.title}</strong>
                <p>{option.description}</p>
            </div>
            <span className="ac-signup-profile-card__check" aria-hidden="true">
                <Check2 />
            </span>
        </label>
    );
}

function FormSection({ eyebrow, title, description, children }) {
    return (
        <section className="ac-signup-section">
            <div className="ac-signup-section__header">
                {eyebrow ? <span className="ac-signup-section__eyebrow">{eyebrow}</span> : null}
                <h3>{title}</h3>
                {description ? <p>{description}</p> : null}
            </div>
            <div className="ac-signup-section__body">{children}</div>
        </section>
    );
}

function SelectableChip({ id, name, value, label, checked, onChange }) {
    return (
        <label className={`ac-signup-chip${checked ? ' is-selected' : ''}`} htmlFor={id}>
            <input
                id={id}
                className="ac-signup-chip__input"
                type="checkbox"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
            />
            <span className="ac-signup-chip__check" aria-hidden="true">
                <Check2 />
            </span>
            <span>{label}</span>
        </label>
    );
}

function PasswordStrength({ password, passwordStrength }) {
    const criteria = getPasswordCriteria(password || '');
    const criteriaItems = [
        { label: '8 caracteres', valid: criteria.length },
        { label: 'Letra maiúscula', valid: criteria.upper },
        { label: 'Letra minúscula', valid: criteria.lower },
        { label: 'Número', valid: criteria.number },
        { label: 'Caractere especial', valid: criteria.special }
    ];

    return (
        <div className="ac-signup-password-strength" aria-live="polite">
            <div className="ac-signup-password-strength__bar">
                <span
                    className={`ac-signup-password-strength__fill ac-signup-password-strength__fill--${passwordStrength.variant}`}
                    style={{ width: `${passwordStrength.value}%` }}
                />
            </div>
            <div className="ac-signup-password-strength__status">
                <strong>{passwordStrength.text}</strong>
            </div>
            <div className="ac-signup-password-strength__criteria">
                {criteriaItems.map((item) => (
                    <span key={item.label} className={item.valid ? 'is-valid' : ''}>
                        <Check2 />
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function PlanCard({ title, price, features, planId, onSelect, isLoading, isSelected }) {
    return (
        <div className={`ac-signup-plan${isSelected ? ' is-selected' : ''}`}>
            <div className="ac-signup-plan__header">
                <h3>{title}</h3>
                <p>{price}</p>
                <span>/mês</span>
            </div>
            <ul className="ac-signup-plan__features">
                {features.map((feature) => (
                    <li key={feature}>
                        <Check2 />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <Button onClick={() => onSelect(planId)} disabled={isLoading} className="w-100">
                {isLoading && isSelected ? (
                    <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Redirecionando...
                    </>
                ) : (
                    'Ativar plano'
                )}
            </Button>
        </div>
    );
}

function Signup() {
    const [etapa, setEtapa] = useState('selecao_tipo');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [tipoUsuario, setTipoUsuario] = useState('');
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ value: 0, variant: 'danger', text: 'Senha muito fraca' });
    const [showPassword, setShowPassword] = useState(false);
    const [lookupFeedback, setLookupFeedback] = useState({
        cep: { status: 'idle', message: '' },
        cnpj: { status: 'idle', message: '' }
    });
    const navigate = useNavigate();
    const isBusinessUser = tipoUsuario === 'servicos_locais' || tipoUsuario === 'clinica';

    const handleTipoUsuarioChange = (eventOrValue) => {
        const value = typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value;
        setTipoUsuario(value);
        setError('');
    };

    const handleContinuarParaFormulario = (event) => {
        event.preventDefault();
        if (tipoUsuario) {
            setEtapa('formulario');
        } else {
            setError('Por favor, selecione um tipo de usuário.');
        }
    };

    const handleSubmitCadastro = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (passwordStrength.value < 30) {
            setError('Por favor, escolha uma senha mais forte.');
            return;
        }

        setIsLoading(true);
        try {
            const payload = { ...formData, username: formData.email, tipo_usuario: tipoUsuario };

            await apiClient.post('/signup', payload);

            if (isBusinessUser) {
                setSuccess('Cadastro realizado com sucesso! Você já pode fazer o login.');
                if (tipoUsuario === 'clinica') {
                    setSuccess('Cadastro da clínica realizado com sucesso! Você já pode fazer o login.');
                }
                setTimeout(() => navigate('/login'), 3000);
            } else {
                const loginResponse = await apiClient.post('/auth/login', {
                    username: formData.email,
                    password: formData.password
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

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        if (type === 'checkbox') {
            const current = formData[name] || [];
            const newValues = checked ? [...current, value] : current.filter((item) => item !== value);
            setFormData((previous) => ({ ...previous, [name]: newValues }));
        } else {
            setFormData((previous) => ({ ...previous, [name]: value }));
        }

        if (name === 'password') {
            checkPasswordStrength(value);
        }
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

        let strength = { value: 0, variant: 'danger', text: 'Muito fraca' };
        if (score === 5) strength = { value: 100, variant: 'success', text: 'Forte' };
        else if (score >= 3) strength = { value: 60, variant: 'warning', text: 'Média' };
        else if (score >= 2) strength = { value: 30, variant: 'danger', text: 'Fraca' };
        setPasswordStrength(strength);
    };

    const buscarCep = async (cep) => {
        if (!cep || cep.length !== 8) return;

        setLookupFeedback((previous) => ({
            ...previous,
            cep: { status: 'loading', message: 'Buscando endereço...' }
        }));
        setIsLoading(true);
        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.data.erro) {
                setFormData((previous) => ({
                    ...previous,
                    logradouro: response.data.logradouro || '',
                    bairro: response.data.bairro || '',
                    cidade: response.data.localidade || '',
                    estado: response.data.uf || '',
                    pais: 'Brasil'
                }));
                setLookupFeedback((previous) => ({
                    ...previous,
                    cep: { status: 'success', message: 'Endereço encontrado.' }
                }));
            } else {
                setError('CEP não encontrado. Por favor, verifique o CEP informado.');
                setLookupFeedback((previous) => ({
                    ...previous,
                    cep: { status: 'error', message: 'CEP não encontrado.' }
                }));
            }
        } catch (err) {
            setError('Erro ao buscar CEP. Por favor, tente novamente.');
            setLookupFeedback((previous) => ({
                ...previous,
                cep: { status: 'error', message: 'Erro ao buscar CEP.' }
            }));
            console.error('Erro ao buscar CEP:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const buscarCnpj = async (cnpj) => {
        if (!cnpj || cnpj.length !== 14) return;

        setLookupFeedback((previous) => ({
            ...previous,
            cnpj: { status: 'loading', message: 'Buscando CNPJ...' }
        }));
        setIsLoading(true);
        try {
            const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (response.data) {
                setFormData((previous) => ({
                    ...previous,
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
                setLookupFeedback((previous) => ({
                    ...previous,
                    cnpj: { status: 'success', message: 'Dados encontrados.' }
                }));
            } else {
                setError('CNPJ não encontrado ou inválido. Por favor, verifique o CNPJ informado.');
                setLookupFeedback((previous) => ({
                    ...previous,
                    cnpj: { status: 'error', message: 'CNPJ não encontrado.' }
                }));
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
            setLookupFeedback((previous) => ({
                ...previous,
                cnpj: { status: 'error', message: 'Erro ao localizar CNPJ.' }
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCepChange = (event) => {
        const cep = event.target.value.replace(/\D/g, '');
        setFormData((previous) => ({ ...previous, cep }));
        if (cep.length < 8) {
            setLookupFeedback((previous) => ({ ...previous, cep: { status: 'idle', message: '' } }));
        }
        if (cep.length === 8) {
            buscarCep(cep);
        }
    };

    const handleCnpjChange = (event) => {
        const cnpj = event.target.value.replace(/\D/g, '');
        setFormData((previous) => ({ ...previous, cnpj }));
        if (cnpj.length < 14) {
            setLookupFeedback((previous) => ({ ...previous, cnpj: { status: 'idle', message: '' } }));
        }
        if (cnpj.length === 14) {
            buscarCnpj(cnpj);
        }
    };

    const currentProfile = profileOptions.find((item) => item.value === tipoUsuario);
    const currentPlans = tipoUsuario === 'pais_responsavel' ? parentPlans : professionalPlans;
    const submitButtonLabel = isBusinessUser ? 'Criar conta' : 'Continuar para planos';
    const passwordCriteria = getPasswordCriteria(formData.password || '');

    const renderLookupMessage = (key) => {
        const feedback = lookupFeedback[key];
        if (!feedback?.message) return null;
        return (
            <small className={`ac-signup-feedback-inline ac-signup-feedback-inline--${feedback.status}`} aria-live="polite">
                {feedback.message}
            </small>
        );
    };

    const renderAutoFilledTag = (active) => {
        if (!active) return null;
        return (
            <small className="ac-signup-autofill-tag">
                <Stars />
                Preenchido automaticamente
            </small>
        );
    };

    const renderAccessSection = (emailPlaceholder) => (
        <FormSection
            eyebrow="Acesso à conta"
            title="Dados de acesso"
            description="Use um e-mail válido e escolha uma senha forte para proteger sua conta."
        >
            <div className="ac-signup-grid ac-signup-grid--2">
                <Form.Group className="ac-signup-field" controlId="signup-email">
                    <Form.Label>E-mail</Form.Label>
                    <div className="ac-signup-input-shell">
                        <span className="ac-signup-input-shell__icon">
                            <Envelope />
                        </span>
                        <Form.Control
                            className="ac-signup-input"
                            type="email"
                            name="email"
                            placeholder={emailPlaceholder}
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </Form.Group>

                <Form.Group className="ac-signup-field" controlId="signup-password">
                    <Form.Label>Senha</Form.Label>
                    <div className="ac-signup-input-shell">
                        <span className="ac-signup-input-shell__icon">
                            <Lock />
                        </span>
                        <Form.Control
                            className="ac-signup-input"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Digite sua senha"
                            value={formData.password || ''}
                            onChange={handleInputChange}
                            required
                        />
                        <button
                            type="button"
                            className="ac-signup-input-shell__action"
                            onClick={() => setShowPassword((current) => !current)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showPassword ? <EyeSlash /> : <Eye />}
                        </button>
                    </div>
                </Form.Group>
            </div>

            <PasswordStrength password={formData.password || ''} passwordStrength={passwordStrength} />

            <div className="ac-signup-password-note">
                <small>
                    A validação considera: 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.
                </small>
                <div className="ac-signup-password-note__summary" aria-hidden="true">
                    {Object.values(passwordCriteria).filter(Boolean).length}/5 critérios atendidos
                </div>
            </div>
        </FormSection>
    );

    const renderParentForm = () => (
        <>
            {renderAccessSection('Digite seu e-mail')}

            <FormSection
                eyebrow="Responsável"
                title="Dados do responsável"
                description="Precisamos dessas informações para identificar a conta principal do acompanhamento."
            >
                <div className="ac-signup-grid">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Nome completo</Form.Label>
                        <Form.Control name="nome_completo" value={formData.nome_completo || ''} onChange={handleInputChange} required />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--2">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>CPF</Form.Label>
                        <Form.Control name="cpf" value={formData.cpf || ''} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Telefone</Form.Label>
                        <Form.Control type="tel" name="telefone" value={formData.telefone || ''} onChange={handleInputChange} required />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Parentesco</Form.Label>
                        <Form.Select name="parentesco" value={formData.parentesco || ''} onChange={handleInputChange} required>
                            <option value="">Selecione o parentesco</option>
                            <option value="pai">Pai</option>
                            <option value="mae">Mãe</option>
                            <option value="outro">Outro</option>
                        </Form.Select>
                    </Form.Group>
                </div>
                {formData.parentesco === 'outro' ? (
                    <div className="ac-signup-grid">
                        <Form.Group className="ac-signup-field">
                            <Form.Label>Especifique o parentesco</Form.Label>
                            <Form.Control
                                name="outro_parentesco"
                                value={formData.outro_parentesco || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                    </div>
                ) : null}
            </FormSection>

            <FormSection
                eyebrow="Endereço"
                title="Endereço"
                description="Utilizamos o CEP para agilizar o preenchimento, sem impedir edições manuais."
            >
                <div className="ac-signup-grid ac-signup-grid--2 ac-signup-grid--compact-first">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>CEP</Form.Label>
                        <Form.Control
                            name="cep"
                            value={formData.cep || ''}
                            onChange={handleCepChange}
                            maxLength={8}
                            required
                        />
                        <small className="text-muted">Digite apenas números</small>
                        {renderLookupMessage('cep')}
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Logradouro
                            {renderAutoFilledTag(lookupFeedback.cep.status === 'success' && !!formData.logradouro)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cep.status === 'success' && formData.logradouro ? 'ac-signup-input--autofill' : ''}
                            name="logradouro"
                            value={formData.logradouro || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--2 ac-signup-grid--compact-first">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Número</Form.Label>
                        <Form.Control name="numero" value={formData.numero || ''} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Complemento</Form.Label>
                        <Form.Control name="complemento" value={formData.complemento || ''} onChange={handleInputChange} />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--3">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Bairro
                            {renderAutoFilledTag(lookupFeedback.cep.status === 'success' && !!formData.bairro)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cep.status === 'success' && formData.bairro ? 'ac-signup-input--autofill' : ''}
                            name="bairro"
                            value={formData.bairro || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Cidade
                            {renderAutoFilledTag(lookupFeedback.cep.status === 'success' && !!formData.cidade)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cep.status === 'success' && formData.cidade ? 'ac-signup-input--autofill' : ''}
                            name="cidade"
                            value={formData.cidade || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Estado
                            {renderAutoFilledTag(lookupFeedback.cep.status === 'success' && !!formData.estado)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cep.status === 'success' && formData.estado ? 'ac-signup-input--autofill' : ''}
                            name="estado"
                            value={formData.estado || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                </div>
            </FormSection>

            <FormSection
                eyebrow="Pessoa acompanhada"
                title="Dados da pessoa acompanhada"
                description="Essas informações ajudam a iniciar o acompanhamento com mais contexto e organização."
            >
                <div className="ac-signup-grid">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Nome completo</Form.Label>
                        <Form.Control name="nome_autista" value={formData.nome_autista || ''} onChange={handleInputChange} required />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--2">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>CPF</Form.Label>
                        <Form.Control name="cpf_autista" value={formData.cpf_autista || ''} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Data de nascimento</Form.Label>
                        <Form.Control
                            type="date"
                            name="data_nascimento"
                            value={formData.data_nascimento || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                </div>
            </FormSection>
        </>
    );

    const renderProfessionalForm = () => (
        <>
            {renderAccessSection('Digite seu e-mail')}

            <FormSection
                eyebrow="Perfil"
                title="Dados pessoais"
                description="Essas informações identificam sua conta profissional dentro do AutisConnect."
            >
                <div className="ac-signup-grid">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Nome completo</Form.Label>
                        <Form.Control name="nome_completo" value={formData.nome_completo || ''} onChange={handleInputChange} required />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--2">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>CPF</Form.Label>
                        <Form.Control name="cpf" value={formData.cpf || ''} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Telefone</Form.Label>
                        <Form.Control type="tel" name="telefone" value={formData.telefone || ''} onChange={handleInputChange} required />
                    </Form.Group>
                </div>
            </FormSection>

            <FormSection
                eyebrow="Endereço"
                title="Endereço"
                description="O CEP ajuda a preencher os campos automaticamente para acelerar o cadastro."
            >
                <div className="ac-signup-grid ac-signup-grid--2 ac-signup-grid--compact-first">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>CEP</Form.Label>
                        <Form.Control name="cep" value={formData.cep || ''} onChange={handleCepChange} maxLength={8} required />
                        <small className="text-muted">Digite apenas números</small>
                        {renderLookupMessage('cep')}
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Logradouro
                            {renderAutoFilledTag(lookupFeedback.cep.status === 'success' && !!formData.logradouro)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cep.status === 'success' && formData.logradouro ? 'ac-signup-input--autofill' : ''}
                            name="logradouro"
                            value={formData.logradouro || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--2 ac-signup-grid--compact-first">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Número</Form.Label>
                        <Form.Control name="numero" value={formData.numero || ''} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Complemento</Form.Label>
                        <Form.Control name="complemento" value={formData.complemento || ''} onChange={handleInputChange} />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--3">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Bairro
                            {renderAutoFilledTag(lookupFeedback.cep.status === 'success' && !!formData.bairro)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cep.status === 'success' && formData.bairro ? 'ac-signup-input--autofill' : ''}
                            name="bairro"
                            value={formData.bairro || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Cidade
                            {renderAutoFilledTag(lookupFeedback.cep.status === 'success' && !!formData.cidade)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cep.status === 'success' && formData.cidade ? 'ac-signup-input--autofill' : ''}
                            name="cidade"
                            value={formData.cidade || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Estado
                            {renderAutoFilledTag(lookupFeedback.cep.status === 'success' && !!formData.estado)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cep.status === 'success' && formData.estado ? 'ac-signup-input--autofill' : ''}
                            name="estado"
                            value={formData.estado || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                </div>
            </FormSection>

            <FormSection
                eyebrow="Atuação"
                title="Informações profissionais"
                description="Preencha seus dados de atuação e selecione as especialidades vinculadas ao seu trabalho."
            >
                <div className="ac-signup-grid ac-signup-grid--2">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Registro profissional</Form.Label>
                        <Form.Control
                            name="registro_profissional"
                            value={formData.registro_profissional || ''}
                            onChange={handleInputChange}
                            placeholder="Ex: CRM 12345/SP, CRP 06/123456"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>CNPJ vinculado a serviços</Form.Label>
                        <Form.Control
                            name="cnpj_vinculado"
                            value={formData.cnpj_vinculado || ''}
                            onChange={handleInputChange}
                            placeholder="Digite o CNPJ (opcional)"
                        />
                    </Form.Group>
                </div>

                <div className="ac-signup-field">
                    <Form.Label>Especialidades</Form.Label>
                    <div className="ac-signup-chip-grid">
                        {professionalSpecialties.map((specialty) => (
                            <SelectableChip
                                key={specialty}
                                id={`especialidade-${specialty}`}
                                name="especialidades"
                                value={specialty}
                                label={specialty === 'outros' ? 'Outros' : specialty}
                                checked={(formData.especialidades || []).includes(specialty)}
                                onChange={handleInputChange}
                            />
                        ))}
                    </div>
                </div>

                {(formData.especialidades || []).includes('outros') ? (
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Descreva outras especialidades</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="outras_especialidades"
                            value={formData.outras_especialidades || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                ) : null}
            </FormSection>
        </>
    );

    const renderBusinessForm = () => (
        <>
            {renderAccessSection(tipoUsuario === 'clinica' ? 'Digite o e-mail da clínica' : 'Digite o e-mail da empresa')}

            <FormSection
                eyebrow="Institucional"
                title={tipoUsuario === 'clinica' ? 'Dados da clínica' : 'Dados da empresa'}
                description="Os dados de CNPJ podem preencher automaticamente as informações cadastrais quando disponíveis."
            >
                <div className="ac-signup-grid ac-signup-grid--2">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>CNPJ</Form.Label>
                        <Form.Control
                            name="cnpj"
                            value={formData.cnpj || ''}
                            onChange={handleCnpjChange}
                            maxLength={14}
                            required
                        />
                        <small className="text-muted">Digite apenas números</small>
                        {renderLookupMessage('cnpj')}
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Razão social
                            {renderAutoFilledTag(lookupFeedback.cnpj.status === 'success' && !!formData.razao_social)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cnpj.status === 'success' && formData.razao_social ? 'ac-signup-input--autofill' : ''}
                            name="razao_social"
                            value={formData.razao_social || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Nome fantasia
                            {renderAutoFilledTag(lookupFeedback.cnpj.status === 'success' && !!formData.nome_fantasia)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cnpj.status === 'success' && formData.nome_fantasia ? 'ac-signup-input--autofill' : ''}
                            name="nome_fantasia"
                            value={formData.nome_fantasia || ''}
                            onChange={handleInputChange}
                        />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--2">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>{tipoUsuario === 'clinica' ? 'Telefone da clínica' : 'Telefone'}</Form.Label>
                        <Form.Control name="telefone" value={formData.telefone || ''} onChange={handleInputChange} />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Horário de funcionamento</Form.Label>
                        <Form.Control
                            name="horario_funcionamento"
                            value={formData.horario_funcionamento || ''}
                            onChange={handleInputChange}
                            placeholder="Ex: Seg-Sex 08:00-18:00"
                        />
                    </Form.Group>
                </div>
            </FormSection>

            <FormSection
                eyebrow="Localização"
                title="Endereço da clínica"
                description="Os campos podem ser preenchidos automaticamente a partir do CNPJ e continuam editáveis."
            >
                <div className="ac-signup-grid ac-signup-grid--2 ac-signup-grid--compact-first">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            CEP
                            {renderAutoFilledTag(lookupFeedback.cnpj.status === 'success' && !!formData.cep_empresa)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cnpj.status === 'success' && formData.cep_empresa ? 'ac-signup-input--autofill' : ''}
                            name="cep_empresa"
                            value={formData.cep_empresa || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Logradouro
                            {renderAutoFilledTag(lookupFeedback.cnpj.status === 'success' && !!formData.logradouro_empresa)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cnpj.status === 'success' && formData.logradouro_empresa ? 'ac-signup-input--autofill' : ''}
                            name="logradouro_empresa"
                            value={formData.logradouro_empresa || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--2 ac-signup-grid--compact-first">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Número</Form.Label>
                        <Form.Control name="numero_empresa" value={formData.numero_empresa || ''} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Complemento</Form.Label>
                        <Form.Control name="complemento_empresa" value={formData.complemento_empresa || ''} onChange={handleInputChange} />
                    </Form.Group>
                </div>
                <div className="ac-signup-grid ac-signup-grid--3">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Bairro
                            {renderAutoFilledTag(lookupFeedback.cnpj.status === 'success' && !!formData.bairro_empresa)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cnpj.status === 'success' && formData.bairro_empresa ? 'ac-signup-input--autofill' : ''}
                            name="bairro_empresa"
                            value={formData.bairro_empresa || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Cidade
                            {renderAutoFilledTag(lookupFeedback.cnpj.status === 'success' && !!formData.cidade_empresa)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cnpj.status === 'success' && formData.cidade_empresa ? 'ac-signup-input--autofill' : ''}
                            name="cidade_empresa"
                            value={formData.cidade_empresa || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>
                            Estado
                            {renderAutoFilledTag(lookupFeedback.cnpj.status === 'success' && !!formData.estado_empresa)}
                        </Form.Label>
                        <Form.Control
                            className={lookupFeedback.cnpj.status === 'success' && formData.estado_empresa ? 'ac-signup-input--autofill' : ''}
                            name="estado_empresa"
                            value={formData.estado_empresa || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>
                </div>

                <div className="ac-signup-grid ac-signup-grid--2">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Latitude (opcional)</Form.Label>
                        <Form.Control name="latitude" value={formData.latitude || ''} onChange={handleInputChange} placeholder="Ex: -3.71722" />
                    </Form.Group>
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Longitude (opcional)</Form.Label>
                        <Form.Control name="longitude" value={formData.longitude || ''} onChange={handleInputChange} placeholder="Ex: -38.54337" />
                    </Form.Group>
                </div>
                <small className="ac-signup-field-hint">
                    <GeoAlt />
                    Coordenadas avançadas podem ser preenchidas se você já tiver esses dados.
                </small>
            </FormSection>

            <FormSection
                eyebrow="Serviços"
                title="Serviços oferecidos"
                description="Selecione as modalidades e perfis de atendimento disponíveis na sua operação."
            >
                <div className="ac-signup-field">
                    <Form.Label>Serviços oferecidos</Form.Label>
                    <div className="ac-signup-chip-grid">
                        {businessServices.map((service) => (
                            <SelectableChip
                                key={service}
                                id={`servico-${service}`}
                                name="servicos"
                                value={service}
                                label={service}
                                checked={(formData.servicos || []).includes(service)}
                                onChange={handleInputChange}
                            />
                        ))}
                    </div>
                </div>

                <div className="ac-signup-grid ac-signup-grid--2">
                    <Form.Group className="ac-signup-field">
                        <Form.Label>Modalidade</Form.Label>
                        <Form.Select name="modalidade" value={formData.modalidade || ''} onChange={handleInputChange}>
                            <option value="">Selecione...</option>
                            <option value="Presencial">Presencial</option>
                            <option value="Online">Online</option>
                            <option value="Hibrido">Hibrido</option>
                        </Form.Select>
                    </Form.Group>
                    <div className="ac-signup-field">
                        <Form.Label>Nível de suporte atendido</Form.Label>
                        <div className="ac-signup-chip-grid ac-signup-chip-grid--inline">
                            {supportLevels.map((level) => (
                                <SelectableChip
                                    key={level.value}
                                    id={`nivel-${level.value}`}
                                    name="nivel_suporte"
                                    value={level.value}
                                    label={level.label}
                                    checked={(formData.nivel_suporte || []).includes(level.value)}
                                    onChange={handleInputChange}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="ac-signup-grid ac-signup-grid--2">
                    <div className="ac-signup-field">
                        <Form.Label>Faixa etária atendida</Form.Label>
                        <div className="ac-signup-chip-grid">
                            {ageRanges.map((range) => (
                                <SelectableChip
                                    key={range.value}
                                    id={`faixa-${range.value}`}
                                    name="faixa_etaria"
                                    value={range.value}
                                    label={range.label}
                                    checked={(formData.faixa_etaria || []).includes(range.value)}
                                    onChange={handleInputChange}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="ac-signup-field">
                        <Form.Label>Cobertura</Form.Label>
                        <div className="ac-signup-chip-grid">
                            {coverageOptions.map((coverage) => (
                                <SelectableChip
                                    key={coverage.value}
                                    id={`cobertura-${coverage.value}`}
                                    name="cobertura"
                                    value={coverage.value}
                                    label={coverage.label}
                                    checked={(formData.cobertura || []).includes(coverage.value)}
                                    onChange={handleInputChange}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </FormSection>

            <FormSection
                eyebrow="Descrição"
                title="Descrição e vinculação"
                description="Conte um pouco mais sobre os serviços, diferenciais e responsáveis pela operação."
            >
                <Form.Group className="ac-signup-field">
                    <Form.Label>Descrição dos serviços</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        name="descricao_servico"
                        value={formData.descricao_servico || ''}
                        onChange={handleInputChange}
                        placeholder="Descreva serviços, especialidades e diferenciais."
                        required
                    />
                    <small className="text-muted">Descreva serviços, especialidades e diferenciais.</small>
                </Form.Group>

                <Form.Group className="ac-signup-field">
                    <Form.Label>Vinculação a médico ou profissional</Form.Label>
                    <Form.Control
                        name="vinculacao_medico"
                        value={formData.vinculacao_medico || ''}
                        onChange={handleInputChange}
                        placeholder="Nome do médico ou profissional responsável (opcional)"
                    />
                </Form.Group>
            </FormSection>
        </>
    );

    const renderFormulario = () => (
        <Form className="ac-signup-form" onSubmit={handleSubmitCadastro}>
            {tipoUsuario === 'pais_responsavel' ? renderParentForm() : null}
            {tipoUsuario === 'medicos_terapeutas' ? renderProfessionalForm() : null}
            {isBusinessUser ? renderBusinessForm() : null}

            <div className="ac-signup-form__actions">
                <Button variant="outline-secondary" type="button" onClick={() => setEtapa('selecao_tipo')}>
                    <ArrowLeft className="me-2" />
                    Voltar para perfil
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Criando conta...
                        </>
                    ) : (
                        <>
                            {submitButtonLabel}
                            <ArrowRight className="ms-2" />
                        </>
                    )}
                </Button>
            </div>
        </Form>
    );

    const renderEtapa = () => {
        switch (etapa) {
            case 'formulario':
                return renderFormulario();

            case 'planos':
                return (
                    <div className="ac-signup-plan-stage">
                        <div className="ac-signup-plan-stage__header">
                            <span className="ac-signup-section__eyebrow">Etapa 3 de 3</span>
                            <h3>Escolha o plano ideal para você</h3>
                            <p>Você poderá acessar os recursos do AutisConnect após ativar seu plano.</p>
                        </div>

                        <div className={`ac-signup-plan-grid${tipoUsuario === 'pais_responsavel' ? ' is-single' : ''}`}>
                            {currentPlans.map((plan) => (
                                <PlanCard
                                    key={plan.planId}
                                    title={plan.title}
                                    price={plan.price}
                                    features={plan.features}
                                    planId={plan.planId}
                                    onSelect={handleAssinarPlano}
                                    isLoading={isLoading}
                                    isSelected={selectedPlan === plan.planId}
                                />
                            ))}
                        </div>

                        <div className="ac-signup-form__actions">
                            <Button variant="outline-secondary" type="button" onClick={() => setEtapa('formulario')}>
                                <ArrowLeft className="me-2" />
                                Voltar para cadastro
                            </Button>
                        </div>
                    </div>
                );

            case 'selecao_tipo':
            default:
                return (
                    <Form className="ac-signup-profile-stage" onSubmit={handleContinuarParaFormulario}>
                        <div className="ac-signup-profile-stage__header">
                            <span className="ac-signup-section__eyebrow">Etapa 1 de 3</span>
                            <h3>Como você utilizará o AutisConnect?</h3>
                            <p>Escolha o perfil que melhor representa sua jornada dentro da plataforma.</p>
                        </div>

                        <div className="ac-signup-profile-grid">
                            {profileOptions.map((option) => (
                                <UserTypeCard
                                    key={option.value}
                                    option={option}
                                    selected={tipoUsuario === option.value}
                                    onSelect={handleTipoUsuarioChange}
                                />
                            ))}
                        </div>

                        <div className="ac-signup-form__actions ac-signup-form__actions--single">
                            <Button type="submit">
                                Continuar
                                <ArrowRight className="ms-2" />
                            </Button>
                        </div>
                    </Form>
                );
        }
    };

    const getBackAction = () => {
        if (etapa === 'formulario') {
            return (
                <button type="button" className="ac-login-backlink ac-signup-backlink" onClick={() => setEtapa('selecao_tipo')}>
                    <ArrowLeft size={18} />
                    <span>Voltar para escolha de perfil</span>
                </button>
            );
        }

        if (etapa === 'planos') {
            return (
                <button type="button" className="ac-login-backlink ac-signup-backlink" onClick={() => setEtapa('formulario')}>
                    <ArrowLeft size={18} />
                    <span>Voltar para cadastro</span>
                </button>
            );
        }

        return (
            <Link to="/" className="ac-login-backlink ac-signup-backlink">
                <ArrowLeft size={18} />
                <span>Voltar para o início</span>
            </Link>
        );
    };

    return (
        <div className="ac-login-page ac-signup-page">
            <div className="ac-login-layout ac-signup-layout">
                <section className="ac-login-showcase ac-signup-showcase" aria-label="Visão institucional do AutisConnect">
                    <div className="ac-login-showcase__grid" aria-hidden="true" />
                    <div className="ac-login-showcase__glow" aria-hidden="true" />

                    <div className="ac-login-showcase__content">
                        <Link to="/" className="ac-login-brand" aria-label="Voltar para o início">
                            <img src={logohori} alt="AutisConnect" className="ac-login-brand__logo" />
                        </Link>

                        <div className="ac-login-copy">
                            <span className="ac-login-kicker">Onboarding premium</span>
                            <h1 className="ac-login-title">
                                Tecnologia que conecta.
                                <span>Cuidado que transforma.</span>
                            </h1>
                            <p className="ac-login-description">
                                Crie sua conta e faça parte de uma plataforma que aproxima famílias, profissionais e serviços.
                            </p>
                        </div>

                        <div className="ac-signup-benefit-list">
                            {benefitItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="ac-signup-benefit">
                                        <span className="ac-signup-benefit__icon">
                                            <Icon />
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="ac-login-ribbon" aria-hidden="true" />
                </section>

                <section className="ac-login-panel ac-signup-main">
                    <div className="ac-login-panel__content ac-signup-panel__content">
                        <div className="ac-login-mobile-brand">
                            <Link to="/" className="ac-login-brand ac-login-brand--mobile" aria-label="Voltar para o início">
                                <img src={logohori} alt="AutisConnect" className="ac-login-brand__logo" />
                            </Link>
                            <div className="ac-login-mobile-ribbon" aria-hidden="true" />
                        </div>

                        {getBackAction()}

                        <div className="ac-login-card ac-signup-card">
                            <SignupStepper etapa={etapa} />

                            <div className="ac-signup-stage-header">
                                <span className="ac-login-card__eyebrow">
                                    {etapa === 'selecao_tipo' ? 'Etapa 1 de 3' : etapa === 'formulario' ? 'Etapa 2 de 3' : 'Etapa 3 de 3'}
                                </span>
                                <h2 className="ac-login-card__title">
                                    {etapa === 'selecao_tipo'
                                        ? 'Crie sua conta'
                                        : etapa === 'formulario'
                                            ? currentProfile?.title || 'Complete seu cadastro'
                                            : 'Ative sua conta'}
                                </h2>
                                <p className="ac-login-card__subtitle">
                                    {etapa === 'selecao_tipo'
                                        ? 'Escolha o perfil que melhor representa sua jornada e siga com um onboarding mais claro e progressivo.'
                                        : etapa === 'formulario'
                                            ? 'Organizamos o cadastro em seções para tornar o preenchimento mais simples, claro e seguro.'
                                            : 'Falta pouco para concluir sua entrada no ecossistema AutisConnect.'}
                                </p>
                            </div>

                            {error ? <SignupAlert variant="error" title="Não foi possível continuar" message={error} /> : null}
                            {success ? <SignupAlert variant="success" title="Tudo certo" message={success} /> : null}

                            {renderEtapa()}

                            <div className="ac-login-footer ac-signup-footer">
                                <span>Já possui uma conta?</span>
                                <Link to="/login" className="ac-login-inline-link ac-login-inline-link--strong">
                                    Entrar
                                </Link>
                            </div>
                        </div>

                        <p className="ac-login-legal">© 2026 Nf Representacoes Comerciais Ltda. Todos os direitos reservados.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Signup;
