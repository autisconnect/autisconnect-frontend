import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import HospitalAppointments from './HospitalAppointments';

const navigate = vi.fn();
vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const response = {
  items: [{ id: 24, patientId: 16, patientName: 'Paciente Teste', externalPatientId: 'H-001', professionalName: 'Profissional Teste', specialty: 'Psicologia', date: '2026-09-19', time: '14:30:00', type: 'Acompanhamento', status: 'Confirmada', canOpenPatient: true }],
  summary: { total: 1, today: 1, upcoming: 0, completed: 0, cancelled: 0 },
  pagination: { page: 1, pages: 1, total: 1 },
  filterOptions: { statuses: ['Agendada', 'Confirmada'], professionals: [{ id: 28, name: 'Profissional Teste' }] },
  scope: 'institution'
};

describe('HospitalAppointments', () => {
  beforeEach(() => { vi.clearAllMocks(); apiClient.get.mockResolvedValue({ data: response }); });

  it('exibe atendimentos e abre o Patient 360 autorizado', async () => {
    render(<HospitalAppointments hospitalId="1" />);
    expect(await screen.findByText('Paciente Teste')).toBeInTheDocument();
    expect(screen.getByText('Confirmada', { selector: '.badge' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Patient 360 de Paciente Teste' }));
    expect(navigate).toHaveBeenCalledWith('/hospital/1/patient/16');
  });

  it('aplica busca e filtros na API', async () => {
    render(<HospitalAppointments hospitalId="1" />);
    await screen.findByText('Paciente Teste');
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar atendimentos' }), { target: { value: 'Paciente' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar atendimentos por status' }), { target: { value: 'Confirmada' } });
    expect(await screen.findByText('Paciente Teste')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenLastCalledWith('/hospitals/1/appointments', expect.objectContaining({ params: expect.objectContaining({ search: 'Paciente', status: 'Confirmada' }) }));
  });

  it('bloqueia atalho clínico sem relação assistencial', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { ...response, items: [{ ...response.items[0], canOpenPatient: false }] } });
    render(<HospitalAppointments hospitalId="1" />);
    expect(await screen.findByText('Relação assistencial necessária')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Abrir Patient 360/ })).not.toBeInTheDocument();
  });
});
