import React, { useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Gear } from 'react-bootstrap-icons';
import SchoolShell, { SchoolSectionCard } from './SchoolShell';
import { fetchSchoolProfile, updateSchoolProfile } from './schoolApi';

const initialForm = {
  name: '',
  legalName: '',
  cnpj: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  logoUrl: ''
};

export default function SchoolSettings() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolProfile();
        if (!isMounted) return;
        const school = response?.school || {};
        setForm({
          name: school.name || '',
          legalName: school.legalName || '',
          cnpj: school.cnpj || '',
          email: school.email || '',
          phone: school.phone || '',
          address: school.address || '',
          city: school.city || '',
          state: school.state || '',
          logoUrl: school.logoUrl || ''
        });
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Nao foi possivel carregar as configuracoes escolares.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateSchoolProfile(form);
      setSuccess('Configuracoes da escola atualizadas com sucesso.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nao foi possivel salvar as configuracoes da escola.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SchoolShell
      pageKey="settings"
      breadcrumb="School / Configuracoes"
      title="Configuracoes da instituicao"
      description="Atualize o perfil da escola, os dados institucionais e as informacoes operacionais exibidas em toda a area School."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
    >
      <SchoolSectionCard eyebrow="Perfil da escola" title="Dados institucionais">
        <Form onSubmit={handleSubmit}>
          <div className="ac-school-form-grid">
            <Form.Group>
              <Form.Label>Nome da escola</Form.Label>
              <Form.Control
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Razao social</Form.Label>
              <Form.Control
                value={form.legalName}
                onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>CNPJ</Form.Label>
              <Form.Control
                value={form.cnpj}
                onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>E-mail institucional</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>URL da logo</Form.Label>
              <Form.Control
                value={form.logoUrl}
                onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Endereco</Form.Label>
              <Form.Control
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Cidade</Form.Label>
              <Form.Control
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Estado</Form.Label>
              <Form.Control
                value={form.state}
                onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
              />
            </Form.Group>
          </div>

          <div className="ac-school-actions-row mt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar configuracoes'}
            </Button>
            <Button variant="outline-secondary" onClick={() => setForm(initialForm)}>
              Limpar campos
            </Button>
          </div>
        </Form>
      </SchoolSectionCard>

      <SchoolSectionCard eyebrow="Observacao" title="Governanca e privacidade">
        <div className="ac-school-empty-state">
          <div className="ac-school-empty-state__icon">
            <Gear />
          </div>
          <div className="ac-school-empty-state__copy">
            <h3>Permissoes granulares ja estao ativas.</h3>
            <p>
              O School respeita consentimento por funcionalidade. Ter vinculo com o aluno nao significa acesso irrestrito a todo o prontuario.
            </p>
          </div>
        </div>
      </SchoolSectionCard>
    </SchoolShell>
  );
}
