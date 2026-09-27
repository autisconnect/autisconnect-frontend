import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import HospitalMultidisciplinaryReports from './HospitalMultidisciplinaryReports';
vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

describe('Hospital multidisciplinary reports', () => {
  beforeEach(() => vi.clearAllMocks());
  it('cria rascunho com período, fontes e conteúdo humano', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } }); apiClient.post.mockResolvedValue({ data: { id: 91, status: 'draft' } });
    render(<HospitalMultidisciplinaryReports hospitalId="7" patientId="10" capabilities={{ reportCreate: true }} />);
    fireEvent.click(await screen.findByRole('button', { name: /Novo relatório/i }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Relatório setembro' } });
    fireEvent.change(screen.getByLabelText('Início do período'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('Fim do período'), { target: { value: '2026-09-22' } });
    fireEvent.change(screen.getByLabelText('Resumo'), { target: { value: 'Resumo revisável' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/hospitals/7/patients/10/multidisciplinary-reports', expect.objectContaining({ title: 'Relatório setembro', assistedByAi: false, sources: expect.arrayContaining(['evolutions', 'pdi']) })));
  });
  it('permite finalizar somente quando a ação vem autorizada pelo backend', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { items: [{ id: 91, title: 'Relatório', period_from: '2026-09-01', period_to: '2026-09-22', status: 'in_review', current_version: 1, participant_count: 2, allowedActions: { finalize: true } }] } }).mockResolvedValueOnce({ data: { items: [] } });
    apiClient.post.mockResolvedValue({ data: { id: 91, status: 'finalized' } });
    render(<HospitalMultidisciplinaryReports hospitalId="7" patientId="10" capabilities={{ reportFinalize: true }} />);
    fireEvent.click(await screen.findByRole('button', { name: /Revisar e finalizar/i }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/hospitals/7/patients/10/multidisciplinary-reports/91/finalize'));
  });
});
