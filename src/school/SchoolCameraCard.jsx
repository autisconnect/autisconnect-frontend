import React from 'react';
import { Button } from 'react-bootstrap';
import { ArrowRight, CameraVideo, PlayCircle } from 'react-bootstrap-icons';
import { SchoolStatusBadge } from './SchoolShell';

function resolveTone(status) {
  if (status === 'online') return 'success';
  if (status === 'connecting') return 'info';
  if (status === 'error') return 'warning';
  if (status === 'disabled') return 'neutral';
  return 'neutral';
}

function resolveLabel(status) {
  switch (`${status || ''}`.toLowerCase()) {
    case 'online':
      return 'Online';
    case 'connecting':
      return 'Conectando';
    case 'error':
      return 'Erro';
    case 'disabled':
      return 'Desativada';
    default:
      return 'Offline';
  }
}

export default function SchoolCameraCard({
  camera,
  onOpen,
  onMonitor,
  onTest
}) {
  return (
    <article className="ac-school-camera-card">
      <div className="ac-school-camera-card__header">
        <div>
          <span className="ac-school-card__eyebrow">Câmera</span>
          <h3>{camera.name}</h3>
          <p>{camera.locationName || 'Ambiente não informado'}</p>
        </div>
        <SchoolStatusBadge tone={resolveTone(camera.status)}>
          {resolveLabel(camera.status)}
        </SchoolStatusBadge>
      </div>

      <div className="ac-school-camera-card__stats">
        <span>{camera.monitoredPatients || 0} alunos monitorados</span>
        <span>{camera.recentEventCount || 0} eventos recentes</span>
        <span>{camera.activeSessionCount || 0} sessões ativas</span>
      </div>

      <div className="ac-school-camera-card__meta">
        <span>{camera.cameraType}</span>
        <span>{camera.streamType}</span>
      </div>

      <div className="ac-school-actions-row">
        <Button variant="outline-secondary" onClick={() => onTest?.(camera)}>
          <CameraVideo className="me-2" />
          Testar
        </Button>
        <Button variant="outline-primary" onClick={() => onOpen?.(camera)}>
          <ArrowRight className="me-2" />
          Abrir
        </Button>
        <Button onClick={() => onMonitor?.(camera)}>
          <PlayCircle className="me-2" />
          Monitorar
        </Button>
      </div>
    </article>
  );
}
