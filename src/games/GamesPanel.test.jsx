import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import GamesPanel from './GamesPanel';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { unlockedLevel: 1 } }))
  }
}));

describe('GamesPanel', () => {
  it('renderiza o catálogo de games', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GamesPanel patientId="123" />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Games Terapêuticos/i)).toBeInTheDocument();
    expect(screen.getByText(/Emotional Regulation Adventures/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar/i })).toBeEnabled();
  });
});
