import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { CameraVideo, PencilSquare, PlusCircle } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard
} from './SchoolShell';
import SchoolCameraGrid from './SchoolCameraGrid';
import {
  createSchoolCamera,
  fetchSchoolCameras,
  fetchSchoolLocations,
  testSchoolCamera,
  updateSchoolCamera
} from './schoolApi';
import { openSchoolCameraMonitorTab } from './schoolMonitoringLinks';

const initialForm = {
  id: null,
  name: '',
  locationId: '',
  cameraType: 'webcam',
  streamType: 'browser',
  streamUrl: '',
  description: '',
  isActive: true,
  username: '',
  password: '',
  token: ''
};

export default function SchoolCameras() {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [cameraResponse, locationResponse] = await Promise.all([
          fetchSchoolCameras(),
          fetchSchoolLocations()
        ]);

        if (!isMounted) return;
        setCameras(cameraResponse?.items || []);
        setLocations(locationResponse?.items || []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Não foi possível carregar as câmeras.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  function openCreateModal() {
    setForm(initialForm);
    setShowModal(true);
  }

  function openEditModal(camera) {
    setForm({
      id: camera.id,
      name: camera.name,
      locationId: camera.locationId ? String(camera.locationId) : '',
      cameraType: camera.cameraType || 'webcam',
      streamType: camera.streamType || 'browser',
      streamUrl: camera.streamUrl || '',
      description: camera.description || '',
      isActive: Boolean(camera.isActive),
      username: '',
      password: '',
      token: ''
    });
    setShowModal(true);
  }

  async function reloadCameras() {
    const response = await fetchSchoolCameras();
    setCameras(response?.items || []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name,
        locationId: Number(form.locationId),
        cameraType: form.cameraType,
        streamType: form.streamType,
        streamUrl: form.streamUrl || null,
        description: form.description,
        isActive: form.isActive,
        username: form.username || null,
        password: form.password || null,
        token: form.token || null
      };

      if (form.id) {
        await updateSchoolCamera(form.id, payload);
        setSuccess('Câmera atualizada com sucesso.');
      } else {
        await createSchoolCamera(payload);
        setSuccess('Câmera cadastrada com sucesso.');
      }

      await reloadCameras();
      setShowModal(false);
      setForm(initialForm);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível salvar a câmera.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTestCamera(camera) {
    setError('');
    setSuccess('');

    try {
      const response = await testSchoolCamera(camera.id);
      setSuccess(response?.message || 'Teste concluído.');
      await reloadCameras();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.error || 'Não foi possível testar a câmera.');
    }
  }

  return (
    <SchoolShell
      pageKey="cameras"
      breadcrumb="School / Câmeras"
      title="Câmeras e fontes de monitoramento"
      description="Cadastre webcams, câmeras IP e futuras fontes integradas por gateway sem expor segredos sensíveis na interface."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
      actions={
        <Button onClick={openCreateModal}>
          <PlusCircle className="me-2" />
          Nova câmera
        </Button>
      }
    >
      <SchoolSectionCard eyebrow="Câmeras" title="Inventário operacional">
        {cameras.length === 0 ? (
          <SchoolEmptyState
            title="Nenhuma câmera cadastrada"
            description="Adicione uma câmera para começar a estruturar a central de monitoramento escolar."
            actionLabel="Cadastrar câmera"
            onAction={openCreateModal}
            icon={CameraVideo}
          />
        ) : (
          <SchoolCameraGrid
            cameras={cameras}
            onOpen={(camera) => navigate(`/school/cameras/${camera.id}`)}
            onMonitor={(camera) => openSchoolCameraMonitorTab(camera.id)}
            onTest={handleTestCamera}
          />
        )}
      </SchoolSectionCard>

      <SchoolSectionCard eyebrow="Edição rápida" title="Ações disponíveis">
        <div className="ac-school-list">
          {cameras.map((camera) => (
            <article key={camera.id} className="ac-school-list-card">
              <div>
                <h4>{camera.name}</h4>
                <p>{camera.locationName || 'Ambiente não informado'}</p>
              </div>
              <div className="ac-school-actions-row">
                <Button variant="outline-secondary" onClick={() => openEditModal(camera)}>
                  <PencilSquare className="me-2" />
                  Editar
                </Button>
                <Button variant="outline-primary" onClick={() => navigate(`/school/cameras/${camera.id}`)}>
                  Detalhes
                </Button>
              </div>
            </article>
          ))}
        </div>
      </SchoolSectionCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{form.id ? 'Editar câmera' : 'Cadastrar câmera'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="ac-school-form-grid">
              <Form.Group>
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Ambiente</Form.Label>
                <Form.Select
                  required
                  value={form.locationId}
                  onChange={(event) => setForm((current) => ({ ...current, locationId: event.target.value }))}
                >
                  <option value="">Selecione</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Tipo de câmera</Form.Label>
                <Form.Select
                  value={form.cameraType}
                  onChange={(event) => setForm((current) => ({ ...current, cameraType: event.target.value }))}
                >
                  <option value="webcam">Webcam</option>
                  <option value="usb">USB</option>
                  <option value="ip_camera">Câmera IP</option>
                  <option value="nvr">NVR</option>
                  <option value="dvr">DVR</option>
                  <option value="other">Outro</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Tipo de conexão</Form.Label>
                <Form.Select
                  value={form.streamType}
                  onChange={(event) => setForm((current) => ({ ...current, streamType: event.target.value }))}
                >
                  <option value="browser">Browser</option>
                  <option value="webrtc">WebRTC</option>
                  <option value="hls">HLS</option>
                  <option value="rtsp">RTSP</option>
                  <option value="gateway">Gateway</option>
                </Form.Select>
              </Form.Group>
            </div>

            <Form.Group className="mt-3">
              <Form.Label>URL do stream</Form.Label>
              <Form.Control
                value={form.streamUrl}
                onChange={(event) => setForm((current) => ({ ...current, streamUrl: event.target.value }))}
                placeholder={form.streamType === 'browser' ? 'Não é necessária para webcam deste dispositivo' : 'Ex.: https://stream.exemplo/hls.m3u8'}
                disabled={form.streamType === 'browser'}
              />
            </Form.Group>

            <div className="ac-school-form-grid mt-3">
              <Form.Group>
                <Form.Label>Usuário do stream</Form.Label>
                <Form.Control
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Opcional"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Senha do stream</Form.Label>
                <Form.Control
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Opcional"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Token de acesso</Form.Label>
                <Form.Control
                  value={form.token}
                  onChange={(event) => setForm((current) => ({ ...current, token: event.target.value }))}
                  placeholder="Opcional"
                />
              </Form.Group>
            </div>

            <Form.Group className="mt-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </Form.Group>

            <Form.Check
              className="mt-3"
              type="switch"
              id="camera-active-switch"
              label="Manter câmera ativa"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar câmera'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </SchoolShell>
  );
}
