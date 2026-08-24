import React, { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { PlayCircle } from 'react-bootstrap-icons';
import { SchoolSectionCard } from './SchoolShell';

function buildInitialForm(camera, defaultClassroomId = '') {
  return {
    classroomId: defaultClassroomId ? String(defaultClassroomId) : '',
    additionalPatientIds: [],
    monitoringMode: camera?.streamType === 'browser' ? 'browser' : 'camera'
  };
}

export default function SchoolCameraSetup({
  camera,
  classrooms,
  approvedStudents,
  defaultClassroomId,
  starting,
  onStart
}) {
  const [form, setForm] = useState(buildInitialForm(camera, defaultClassroomId));

  useEffect(() => {
    setForm(buildInitialForm(camera, defaultClassroomId));
  }, [camera, defaultClassroomId]);

  const eligibleStudents = (approvedStudents || []).filter((student) => (
    !form.classroomId || String(student.classroomId || '') === String(form.classroomId)
  ));

  const selectedExtraStudents = eligibleStudents.filter((student) => form.additionalPatientIds.includes(String(student.patientId)));

  function handleSubmit(event) {
    event.preventDefault();
    onStart?.({
      classroomId: form.classroomId ? Number(form.classroomId) : null,
      additionalPatientIds: selectedExtraStudents.map((student) => student.patientId),
      monitoringMode: form.monitoringMode
    });
  }

  return (
    <SchoolSectionCard eyebrow="Preparação" title="Iniciar monitoramento">
      <Form onSubmit={handleSubmit} className="ac-school-camera-setup">
        <div className="ac-school-form-grid">
          <Form.Group>
            <Form.Label>Câmera</Form.Label>
            <Form.Control value={camera?.name || ''} disabled />
          </Form.Group>

          <Form.Group>
            <Form.Label>Ambiente</Form.Label>
            <Form.Control value={camera?.locationName || ''} disabled />
          </Form.Group>

          <Form.Group>
            <Form.Label>Turma esperada</Form.Label>
            <Form.Select
              value={form.classroomId}
              onChange={(event) => setForm((current) => ({ ...current, classroomId: event.target.value }))}
            >
              <option value="">Sessão sem turma fixa</option>
              {(classrooms || []).map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Modo</Form.Label>
            <Form.Control
              value={camera?.streamType === 'browser' ? 'Browser / Webcam' : 'Câmera / Edge preparado'}
              disabled
            />
          </Form.Group>
        </div>

        <Form.Group className="mt-3">
          <Form.Label>Adicionar alunos autorizados temporariamente</Form.Label>
          <Form.Select
            multiple
            value={form.additionalPatientIds}
            onChange={(event) => {
              const nextIds = Array.from(event.target.selectedOptions).map((option) => option.value);
              setForm((current) => ({ ...current, additionalPatientIds: nextIds }));
            }}
          >
            {eligibleStudents.map((student) => (
              <option key={student.patientId} value={student.patientId}>
                {student.name} {student.classroomName ? `• ${student.classroomName}` : ''}
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">
            Use este campo para ambientes compartilhados, como sala sensorial, refeitório ou pátio.
          </Form.Text>
        </Form.Group>

        <div className="ac-school-camera-setup__summary">
          <span>{eligibleStudents.length} alunos autorizados disponíveis no recorte atual</span>
          <span>{selectedExtraStudents.length} adicionados manualmente à sessão</span>
        </div>

        <div className="ac-school-actions-row">
          <Button type="submit" disabled={starting}>
            <PlayCircle className="me-2" />
            {starting ? 'Iniciando...' : 'Iniciar sessão'}
          </Button>
        </div>
      </Form>
    </SchoolSectionCard>
  );
}
