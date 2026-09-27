import React, { useContext, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { Building, Mortarboard, PersonBadge } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { useInstitutionContext } from '../../context/InstitutionContext';
import { AuthContext } from '../../context/AuthContext';
import './ContextSelector.css';

export default function ContextSelector() {
  const { contexts, currentContext, loading, selectContext } = useInstitutionContext();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [changing, setChanging] = useState(false);
  const [selectionError, setSelectionError] = useState('');

  if (loading) return <Spinner animation="border" size="sm" aria-label="Carregando contextos" />;
  if (contexts.length < 2) return null;

  const handleChange = async (event) => {
    setChanging(true);
    setSelectionError('');
    try {
      const selected = await selectContext(event.target.value);
      if (selected.type === 'hospital') {
        const roles = selected.roles || (selected.role ? [selected.role] : []);
        const hasInstitutionalRole = roles.some((role) => role !== 'hospital_professional');
        navigate(user?.tipo_usuario === 'medicos_terapeutas' && !hasInstitutionalRole
          ? `/professional-dashboard/${user.id}`
          : `/hospital/${selected.institutionId}/dashboard`);
      } else if (selected.type === 'school') {
        navigate('/school/dashboard');
      } else if (selected.type === 'clinic' && user?.id) {
        navigate(`/professional-dashboard/${user.id}`);
      } else if (selected.type === 'professional' && user?.id) {
        navigate(`/professional-dashboard/${user.id}`);
      }
    } catch {
      setSelectionError('Nao foi possivel trocar o contexto.');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="ac-context-selector" title={selectionError || currentContext?.name || ''}>
      {selectionError ? <span className="visually-hidden" role="alert">{selectionError}</span> : null}
      <span className="ac-context-selector__icon" aria-hidden="true">
        {currentContext?.type === 'hospital' || currentContext?.type === 'clinic' ? <Building /> : currentContext?.type === 'school' ? <Mortarboard /> : <PersonBadge />}
      </span>
      <Form.Select
        size="sm"
        aria-label="Contexto de atuacao"
        value={currentContext?.key || ''}
        onChange={handleChange}
        disabled={changing}
      >
        {contexts.map((context) => (
          <option key={context.key} value={context.key}>
            {context.type === 'professional' ? 'Atuacao independente' : context.name}
          </option>
        ))}
      </Form.Select>
    </div>
  );
}
