import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import HospitalPendingCenter from './HospitalPendingCenter';

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));

describe('HospitalPendingCenter', () => {
  const openWindow = vi.spyOn(window, 'open').mockImplementation(() => null);
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { items: [{ id: 'pdi_review:3', type: 'pdi_review', priority: 'high', title: 'PDI aguardando aprovação', detail: 'PDI anual', patient: { id: 10, name: 'Ana Teste', externalPatientId: 'H-10' }, responsible: { id: 5, name: 'Dra. Lia' }, occurredAt: '2026-09-22T10:00:00Z', targetSection: 'pdi' }], counts: { total: 1, byPriority: { critical: 0, high: 1, medium: 0, low: 0 } }, pagination: { page: 1, pages: 1, total: 1 }, rules: { description: 'Pendências são projeções operacionais determinísticas e não representam conclusão clínica.' }, scope: 'institution' } });
  });

  it('mostra a fila explicável e abre a seção correta do Patient 360', async () => {
    render(<HospitalPendingCenter hospitalId="7" />);
    expect(await screen.findByText('PDI aguardando aprovação')).toBeInTheDocument();
    expect(screen.getByText(/não representam conclusão clínica/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir pendência de Ana Teste no Patient 360' }));
    expect(openWindow).toHaveBeenCalledWith('http://localhost:3000/hospital/7/patient/10?section=pdi', '_blank', 'noopener,noreferrer');
  });

  it('envia filtros para a API', async () => {
    render(<HospitalPendingCenter hospitalId="7" />);
    await screen.findByText('PDI aguardando aprovação');
    fireEvent.change(screen.getByLabelText('Filtrar pendências por prioridade'), { target: { value: 'high' } });
    expect(await screen.findByText('PDI aguardando aprovação')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenLastCalledWith('/hospitals/7/pending', expect.objectContaining({ params: expect.objectContaining({ priority: 'high' }) }));
  });
});
