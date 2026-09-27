import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import HospitalEvolutions from './HospitalEvolutions';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe('Hospital evolutions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lista o workflow e finaliza somente quando a API autoriza a ação', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { items: [{ id: 50, title: 'Evolução de psicologia', status: 'in_review', currentVersion: 2, professionalName: 'Dra. Teste', specialty: 'Psicologia', updatedAt: '2026-09-22T10:00:00Z', freeText: 'Evolução observada', allowedActions: { finalize: true } }] } })
      .mockResolvedValueOnce({ data: { items: [] } });
    apiClient.post.mockResolvedValue({ data: { id: 50, status: 'finalized' } });
    render(<HospitalEvolutions hospitalId="7" patientId="10" capabilities={{ evolutionCreate: true }} />);
    expect(await screen.findByText('Evolução de psicologia')).toBeInTheDocument();
    expect(screen.getByText('Em revisão')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Finalizar e assinar/i }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/hospitals/7/patients/10/evolutions/50/finalize'));
  });

  it('abre criação como rascunho e preserva o atendimento como opcional', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } });
    apiClient.post.mockResolvedValue({ data: { id: 51, status: 'draft' } });
    render(<HospitalEvolutions hospitalId="7" patientId="10" capabilities={{ evolutionCreate: true }} />);
    fireEvent.click(await screen.findByRole('button', { name: /Nova evolução/i }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nova evolução' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/hospitals/7/patients/10/evolutions', expect.objectContaining({ title: 'Nova evolução', appointmentId: null })));
  });
});
