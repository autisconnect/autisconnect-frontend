import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import HospitalProfileDashboard from './HospitalProfileDashboard';
vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

describe('HospitalProfileDashboard', () => {
  beforeEach(() => { vi.clearAllMocks(); apiClient.get.mockResolvedValue({ data: { profile: { key: 'coordination', label: 'Coordenação assistencial', description: 'Fila operacional.' }, metrics: [{ key: 'patients', label: 'Pacientes ativos', value: 12, tone: 'blue' }, { key: 'pending', label: 'Pendências operacionais', value: 2, tone: 'orange' }], focus: { title: 'Próximos atendimentos', items: [{ id: 1, label: 'Ana', detail: '2026-09-24 · Terapia', patientId: 10, targetSection: 'appointments' }] }, teams: [], pending: { total: 2, items: [{ id: 'p:1', priority: 'high', patient: { id: 10, name: 'Ana' }, title: 'Evolução em revisão', targetSection: 'progress' }] } } }); });
  it('exibe conteúdo específico do perfil e navega para a ação contextual', async () => {
    render(<HospitalProfileDashboard hospitalId="7" />);
    expect(await screen.findByText('Coordenação assistencial')).toBeInTheDocument();
    expect(screen.getByText('Pendências operacionais')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ana.*2026-09-24/i }));
    expect(navigate).toHaveBeenCalledWith('/hospital/7/patient/10?section=appointments');
  });
});
