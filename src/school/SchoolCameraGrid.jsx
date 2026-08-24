import React from 'react';
import { CameraVideo } from 'react-bootstrap-icons';
import SchoolCameraCard from './SchoolCameraCard';
import { SchoolEmptyState } from './SchoolShell';

export default function SchoolCameraGrid({
  cameras,
  onOpen,
  onMonitor,
  onTest
}) {
  if (!cameras || cameras.length === 0) {
    return (
      <SchoolEmptyState
        title="Nenhuma câmera cadastrada"
        description="Adicione uma câmera para começar a configurar a central de monitoramento da instituição."
        icon={CameraVideo}
      />
    );
  }

  return (
    <div className="ac-school-camera-grid">
      {cameras.map((camera) => (
        <SchoolCameraCard
          key={camera.id}
          camera={camera}
          onOpen={onOpen}
          onMonitor={onMonitor}
          onTest={onTest}
        />
      ))}
    </div>
  );
}
