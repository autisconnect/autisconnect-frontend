import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import HospitalPatients from './HospitalPatients';

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));

describe('HospitalPatients', () => {
  const openWindow = vi.spyOn(window, 'open').mockImplementation(() => null);

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: {
      items: [{ id: 16, name: 'Paciente Teste', externalPatientId: 'H-001', status: 'active', teams: 'Equipe Azul', professionalCount: 2, admissionDate: '2026-01-10', nextAppointment: null, canOpen: true }],
      pagination: { page: 1, pages: 1, total: 1 },
      filterOptions: { teams: [{ id: 3, name: 'Equipe Azul' }] },
      scope: 'institution'
    } });
  });

  it('exibe pacientes reais e abre o Dashboard do Paciente em nova aba', async () => {
    render(<HospitalPatients hospitalId="1" />);
    expect(await screen.findByText('Paciente Teste')).toBeInTheDocument();
    expect(screen.getByText('H-001')).toBeInTheDocument();
    expect(screen.getByText('Equipe Azul', { selector: 'strong' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Dashboard do Paciente de Paciente Teste em nova aba' }));
    expect(openWindow).toHaveBeenCalledWith('http://localhost:3000/hospital/1/patient/16', '_blank', 'noopener,noreferrer');
  });

  it('aplica busca sem expor o termo na rota', async () => {
    render(<HospitalPatients hospitalId="1" />);
    await screen.findByText('Paciente Teste');
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar pacientes' }), { target: { value: 'Maria' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Paciente Teste')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenLastCalledWith('/hospitals/1/patients', expect.objectContaining({ params: expect.objectContaining({ search: 'Maria' }) }));
  });

  it('nao oferece Patient 360 sem relacao assistencial', async () => {
    apiClient.get.mockResolvedValueOnce({ data: {
      items: [{ id: 16, name: 'Paciente Restrito', externalPatientId: 'H-002', status: 'active', teams: 'Equipe Azul', professionalCount: 2, canOpen: false }],
      pagination: { page: 1, pages: 1, total: 1 },
      filterOptions: { teams: [] },
      scope: 'institution'
    } });
    render(<HospitalPatients hospitalId="1" />);
    expect(await screen.findByText('Paciente Restrito')).toBeInTheDocument();
    expect(screen.getByText('Relação assistencial necessária')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Abrir Dashboard do Paciente/ })).not.toBeInTheDocument();
  });
});
