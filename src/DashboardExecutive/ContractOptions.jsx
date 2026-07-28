import { Form } from 'react-bootstrap';

const options = {
  contract_type: [['employee', 'CLT'], ['service_provider', 'Prestador de serviços'], ['partner', 'Sócio/Parceiro'], ['intern', 'Estagiário'], ['other', 'Outro']],
  payout_type: [['percentage', 'Percentual sobre produção'], ['session', 'Valor por sessão'], ['hour', 'Valor por hora'], ['fixed', 'Valor fixo/Salário'], ['mixed', 'Misto']]
};

export default function ContractOptions({ field, value, onChange }) {
  const values = options[field];
  if (!values) return <Form.Control type={field.includes('date') ? 'date' : 'text'} value={value} onChange={onChange} />;
  return <Form.Select value={value} onChange={onChange}><option value="">Selecione</option>{values.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Form.Select>;
}
