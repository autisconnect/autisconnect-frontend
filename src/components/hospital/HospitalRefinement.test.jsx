import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../services/api';
import HospitalAudit from './HospitalAudit';
import HospitalIntegrationHub from './HospitalIntegrationHub';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

describe('Hospital Phase 10 visual and responsive contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserva breakpoints, foco visível, toque e redução de movimento', () => {
    const css = readFileSync(path.resolve('src/HospitalDashboard.css'), 'utf8');
    expect(css).toContain('@media(max-width:900px)');
    expect(css).toContain('@media(max-width:620px)');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).toContain('@media(forced-colors:active)');
    expect(css).toContain('min-height:44px');
    expect(css).toContain(':focus-visible');
  });

  it('renderiza auditoria vazia com landmarks e tabela acessível', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [], pagination: { page: 1, pages: 1, total: 0 }, retention: { days: 1825 } } });
    render(<HospitalAudit hospitalId="7" />);
    expect(await screen.findByRole('heading', { name: 'Auditoria hospitalar' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Eventos da auditoria hospitalar' })).toBeInTheDocument();
    expect(screen.getByText('Nenhum evento corresponde aos filtros.')).toBeInTheDocument();
  });

  it('oferece recuperação explícita quando o Integration Hub falha', async () => {
    apiClient.get.mockRejectedValueOnce({ response: { data: { error: 'Falha simulada' } } }).mockResolvedValueOnce({ data: { systems: [], identifiers: [], imports: [], webhooks: [], logs: [] } });
    render(<HospitalIntegrationHub hospitalId="7" canManage />);
    expect(await screen.findByText('Falha simulada')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Nenhum conector configurado.')).toBeInTheDocument();
  });
});
