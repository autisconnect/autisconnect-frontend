import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import HospitalPdi from './HospitalPdi';
vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
describe('Hospital PDI', () => {
  beforeEach(() => vi.clearAllMocks());
  it('exibe o ciclo e permite aprovação apenas quando autorizada', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { items: [{ id: 70, title: 'PDI 2026', status: 'in_review', current_version: 1, valid_from: '2026-09-01', valid_until: '2027-03-01', objective_count: 2, participant_count: 3, allowedActions: { activate: true } }] } }).mockResolvedValueOnce({ data: { items: [] } });
    apiClient.post.mockResolvedValue({ data: { id: 70, status: 'active' } });
    render(<HospitalPdi hospitalId="7" patientId="10" capabilities={{ pdiCreate: true, pdiApprove: true }} />);
    expect(await screen.findByText('PDI 2026')).toBeInTheDocument(); expect(screen.getByText('Em revisão')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Aprovar e ativar/i }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/hospitals/7/patients/10/pdis/70/activate'));
  });
  it('cria rascunho com objetivo configurável e sem IA automática', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } }); apiClient.post.mockResolvedValue({ data: { id: 71, status: 'draft' } });
    render(<HospitalPdi hospitalId="7" patientId="10" capabilities={{ pdiCreate: true }} />);
    fireEvent.click(await screen.findByRole('button', { name: /Novo PDI/i })); fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Plano individual' } }); fireEvent.change(screen.getByLabelText('Título do objetivo 1'), { target: { value: 'Autonomia' } }); fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/hospitals/7/patients/10/pdis', expect.objectContaining({ title: 'Plano individual', assistedByAi: false, objectives: [expect.objectContaining({ title: 'Autonomia' })] })));
  });
});
