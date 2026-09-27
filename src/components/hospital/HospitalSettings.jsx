import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { BuildingGear, ShieldCheck } from 'react-bootstrap-icons';
import apiClient from '../../services/api';
import HospitalRoleManagement from './HospitalRoleManagement';

const empty = { name: '', legalName: '', cnpj: '', email: '', phone: '', website: '', address: '', city: '', state: '', zipCode: '', logoUrl: '', status: '', subscriptionStatus: '' };

export default function HospitalSettings({ hospitalId, canManage }) {
  const [form, setForm] = useState(empty); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await apiClient.get(`/hospitals/${hospitalId}/settings`); setForm({ ...empty, ...(data.hospital || {}) }); }
    catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível carregar as configurações do hospital.'); }
    finally { setLoading(false); }
  }, [hospitalId]);
  useEffect(() => { load(); }, [load]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event) => {
    event.preventDefault(); if (!canManage) return; setSaving(true); setError(''); setSuccess('');
    try { const { data } = await apiClient.put(`/hospitals/${hospitalId}/settings`, form); setForm({ ...empty, ...(data.hospital || {}) }); setSuccess('Dados institucionais atualizados com sucesso.'); }
    catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível salvar as configurações.'); }
    finally { setSaving(false); }
  };
  if (loading) return <div className="ach-loading"><Spinner animation="border" /><span>Carregando configurações institucionais…</span></div>;
  return <section className="ach-settings" aria-labelledby="hospital-settings-title">
    <header className="ach-settings__header"><div><span>GOVERNANÇA INSTITUCIONAL</span><h2 id="hospital-settings-title">Configurações do Hospital</h2><p>Dados exibidos no contexto institucional do AutisConnect Hospital.</p></div><BuildingGear /></header>
    {error ? <Alert variant="danger">{error}</Alert> : null}{success ? <Alert variant="success">{success}</Alert> : null}
    {!canManage ? <Alert variant="info"><ShieldCheck /> Você possui acesso de consulta. Apenas administradores e gestores hospitalares podem alterar estes dados.</Alert> : null}
    <Form onSubmit={save}><Card className="ach-settings__card"><Card.Body><Card.Title>Identificação e contato</Card.Title><Row className="g-3"><Field md={6} label="Nome do hospital" value={form.name} onChange={(value) => update('name', value)} required disabled={!canManage} /><Field md={6} label="Razão social" value={form.legalName} onChange={(value) => update('legalName', value)} disabled={!canManage} /><Field md={4} label="CNPJ" value={form.cnpj} onChange={(value) => update('cnpj', value)} disabled={!canManage} /><Field md={4} label="E-mail institucional" type="email" value={form.email} onChange={(value) => update('email', value)} disabled={!canManage} /><Field md={4} label="Telefone" value={form.phone} onChange={(value) => update('phone', value)} disabled={!canManage} /><Field md={6} label="Site" type="url" value={form.website} onChange={(value) => update('website', value)} disabled={!canManage} /><Field md={6} label="URL da logo" type="url" value={form.logoUrl} onChange={(value) => update('logoUrl', value)} disabled={!canManage} /></Row></Card.Body></Card>
      <Card className="ach-settings__card"><Card.Body><Card.Title>Endereço institucional</Card.Title><Row className="g-3"><Field md={6} label="Endereço" value={form.address} onChange={(value) => update('address', value)} disabled={!canManage} /><Field md={2} label="CEP" value={form.zipCode} onChange={(value) => update('zipCode', value)} disabled={!canManage} /><Field md={2} label="Cidade" value={form.city} onChange={(value) => update('city', value)} disabled={!canManage} /><Field md={2} label="Estado" value={form.state} onChange={(value) => update('state', value)} disabled={!canManage} /></Row></Card.Body></Card>
      <Card className="ach-settings__card ach-settings__card--status"><Card.Body><Card.Title>Contrato e ambiente</Card.Title><Row className="g-3"><Field md={4} label="Tipo institucional" value={form.type || 'hospital'} disabled /><Field md={4} label="Situação" value={form.status || 'active'} disabled /><Field md={4} label="Assinatura" value={form.subscriptionStatus || 'inactive'} disabled /></Row><small>Estes campos são controlados pela operação AutisConnect e não podem ser alterados nesta tela.</small></Card.Body></Card>
      {canManage ? <div className="ach-settings__actions"><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar configurações'}</Button><Button type="button" variant="outline-secondary" disabled={saving} onClick={load}>Descartar alterações</Button></div> : null}
    </Form>
    {canManage ? <HospitalRoleManagement hospitalId={hospitalId} canManage={canManage} /> : null}
  </section>;
}
function Field({ md, label, value, onChange, disabled, required, type = 'text' }) { return <Col md={md}><Form.Group><Form.Label>{label}</Form.Label><Form.Control type={type} value={value ?? ''} onChange={(event) => onChange?.(event.target.value)} disabled={disabled} required={required} /></Form.Group></Col>; }
