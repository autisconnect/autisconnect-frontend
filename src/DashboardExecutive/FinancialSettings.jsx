import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import apiClient from '../services/api';

const initialValues = { currency_code: 'BRL', closing_day: '', professional_payment_day: '', default_interest_percent: '0', default_penalty_percent: '0', allow_discount: true, max_discount_percent: '', accept_pix: true, accept_card: true, accept_boleto: false, accept_cash: true };
const booleanFields = ['allow_discount', 'accept_pix', 'accept_card', 'accept_boleto', 'accept_cash'];
const dayFields = ['closing_day', 'professional_payment_day'];
const percentFields = ['default_interest_percent', 'default_penalty_percent', 'max_discount_percent'];

const FinancialSettings = () => {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    apiClient.get('/executive/finance/settings').then((response) => {
      if (!active) return;
      const data = response.data || {};
      setValues({ ...initialValues, ...data, ...Object.fromEntries(booleanFields.map((field) => [field, Number(data[field]) === 1])) });
    }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.error || 'Não foi possível carregar as configurações financeiras.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const change = (field, value) => {
    setError(''); setSuccess('');
    setValues((current) => ({ ...current, [field]: value, ...(field === 'allow_discount' && !value ? { max_discount_percent: '' } : {}) }));
  };

  const validate = () => {
    for (const field of dayFields) {
      if (values[field] !== '' && (!Number.isInteger(Number(values[field])) || Number(values[field]) < 1 || Number(values[field]) > 31)) return 'Os dias devem estar entre 1 e 31.';
    }
    for (const field of percentFields) {
      if (values[field] !== '' && (!Number.isFinite(Number(values[field])) || Number(values[field]) < 0 || Number(values[field]) > 100)) return 'Os percentuais devem estar entre 0 e 100.';
    }
    return '';
  };

  const save = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (!window.confirm('Salvar as novas configurações? Elas serão aplicadas somente aos próximos lançamentos.')) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        currency_code: String(values.currency_code || 'BRL').toUpperCase(),
        closing_day: values.closing_day === '' || values.closing_day === null ? null : Number(values.closing_day),
        professional_payment_day: values.professional_payment_day === '' || values.professional_payment_day === null ? null : Number(values.professional_payment_day),
        default_interest_percent: Number(values.default_interest_percent || 0),
        default_penalty_percent: Number(values.default_penalty_percent || 0),
        allow_discount: values.allow_discount ? 1 : 0,
        max_discount_percent: values.allow_discount && values.max_discount_percent !== '' && values.max_discount_percent !== null ? Number(values.max_discount_percent) : null,
        accept_pix: values.accept_pix ? 1 : 0,
        accept_card: values.accept_card ? 1 : 0,
        accept_boleto: values.accept_boleto ? 1 : 0,
        accept_cash: values.accept_cash ? 1 : 0,
      };
      console.log('Payload das configurações financeiras:', payload);
      const response = await apiClient.put('/executive/finance/settings', payload);
      setValues({ ...initialValues, ...response.data, ...Object.fromEntries(booleanFields.map((field) => [field, Number(response.data[field]) === 1])) });
      setSuccess('Configurações financeiras atualizadas. Registros existentes não foram alterados.');
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível salvar as configurações financeiras.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return <><div className="mb-4"><h2 className="h4 mb-1">Configurações Financeiras</h2><p className="text-muted mb-0">Padrões aplicados apenas em novos lançamentos do Dashboard Executivo.</p></div>{error && <Alert variant="danger">{error}</Alert>}{success && <Alert variant="success">{success}</Alert>}<Form onSubmit={save}><Card className="mb-3"><Card.Body><Card.Title>Moeda e fechamento mensal</Card.Title><Row className="g-3"><Col md={4}><Form.Label>Moeda</Form.Label><Form.Control value="BRL" readOnly /></Col><Col md={4}><Form.Label>Dia de fechamento</Form.Label><Form.Control type="number" min="1" max="31" value={values.closing_day ?? ''} onChange={(event) => change('closing_day', event.target.value)} /></Col><Col md={4}><Form.Label>Pagamento de profissionais</Form.Label><Form.Control type="number" min="1" max="31" value={values.professional_payment_day ?? ''} onChange={(event) => change('professional_payment_day', event.target.value)} /></Col></Row></Card.Body></Card><Card className="mb-3"><Card.Body><Card.Title>Juros, multa e descontos</Card.Title><Row className="g-3"><Col md={4}><Form.Label>Juros padrão (%)</Form.Label><Form.Control required type="number" min="0" max="100" step="0.001" value={values.default_interest_percent} onChange={(event) => change('default_interest_percent', event.target.value)} /></Col><Col md={4}><Form.Label>Multa padrão (%)</Form.Label><Form.Control required type="number" min="0" max="100" step="0.001" value={values.default_penalty_percent} onChange={(event) => change('default_penalty_percent', event.target.value)} /></Col><Col md={4}><Form.Check className="mt-4" label="Permitir descontos" checked={Boolean(values.allow_discount)} onChange={(event) => change('allow_discount', event.target.checked)} /></Col>{values.allow_discount && <Col md={4}><Form.Label>Desconto máximo (%)</Form.Label><Form.Control type="number" min="0" max="100" step="0.001" value={values.max_discount_percent ?? ''} onChange={(event) => change('max_discount_percent', event.target.value)} /></Col>}</Row></Card.Body></Card><Card className="mb-4"><Card.Body><Card.Title>Formas de pagamento aceitas</Card.Title><Row className="g-3">{[['accept_pix', 'Pix'], ['accept_card', 'Cartão'], ['accept_boleto', 'Boleto'], ['accept_cash', 'Dinheiro']].map(([field, label]) => <Col key={field} sm={6} lg={3}><Form.Check label={label} checked={Boolean(values[field])} onChange={(event) => change(field, event.target.checked)} /></Col>)}</Row></Card.Body></Card><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar configurações'}</Button></Form></>;
};

export default FinancialSettings;
