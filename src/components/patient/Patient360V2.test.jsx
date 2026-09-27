import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import Patient360AssistentialSummary from './Patient360AssistentialSummary';

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));

const summary = {
  care: {
    primaryTeam: { id: 1, name: 'Equipe Azul' },
    activeProfessionals: 3,
    lastAppointment: { date: '2026-09-20', time: '10:00:00', type: 'Psicologia' },
    nextAppointment: null,
    latestClinicalRecord: { type: 'legacy_note', recorded_at: '2026-09-21T10:00:00Z' },
    latestAbaSession: null,
    latestMonitoring: null,
    multidisciplinaryReport: { available: false },
    pdi: { available: false }
  }
};

describe('Patient 360 V2 assistential summary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('distingue fatos, ausências e pendências operacionais', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { items: [{ id: 8, title: 'Nova observação', occurredAt: '2026-09-22T10:00:00Z', sourceType: 'hospital' }] } })
      .mockResolvedValueOnce({ data: { items: [], available: true } });
    render(<Patient360AssistentialSummary summary={summary} endpointBase="/hospitals/7/patients/10/360" />);
    expect(screen.getByRole('heading', { name: 'Resumo assistencial' })).toBeInTheDocument();
    expect(screen.getByText('Equipe Azul')).toBeInTheDocument();
    expect(screen.getAllByText('ainda não implantado')).toHaveLength(2);
    expect(await screen.findByText('Nova observação')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma pendência objetiva identificada.')).toBeInTheDocument();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
  });
});
