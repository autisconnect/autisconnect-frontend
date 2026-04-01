import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import Game1Page from './Game1Page';

const { apiPostMock, ioMock, registryStore, createGameMock } = vi.hoisted(() => {
  const registryStore = new Map();

  const apiPostMock = vi.fn((url) => {
    if (url.includes('start-session')) {
      return Promise.resolve({ data: { sessionId: 1 } });
    }
    return Promise.resolve({ data: { success: true } });
  });

  const ioMock = vi.fn(() => ({
    connected: true,
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  }));

  const createGameMock = vi.fn(() => {
    registryStore.clear();
    return {
      registry: {
        set: (key, value) => registryStore.set(key, value),
        get: (key) => registryStore.get(key)
      },
      destroy: vi.fn()
    };
  });

  return { apiPostMock, ioMock, registryStore, createGameMock };
});

vi.mock('../../services/api', () => ({
  default: {
    post: apiPostMock,
    defaults: { baseURL: 'http://localhost:5000/api' }
  }
}));

vi.mock('socket.io-client', () => ({
  io: ioMock
}));

vi.mock('./game1Phaser', () => ({
  createGame1Game: createGameMock
}));

const renderGame = () => render(
  <MemoryRouter
    initialEntries={['/games/game1/123?level=1']}
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Routes>
      <Route path="/games/game1/:patientId" element={<Game1Page />} />
    </Routes>
  </MemoryRouter>
);

describe('Game1Page', () => {
  it('abre o modal de avanço com as três opções ao concluir o nível', async () => {
    renderGame();

    const onEvent = () => registryStore.get('onEvent');
    const onSessionComplete = () => registryStore.get('onSessionComplete');

    await screen.findByText(/Emotional Regulation Adventures/i);

    await act(async () => {
      onEvent()({ eventType: 'trigger', data: { scenarioId: 'barulho' } });
      onEvent()({ eventType: 'regulation_success', data: { strategy: 'respiração' } });
      onEvent()({ eventType: 'trigger', data: { scenarioId: 'fila' } });
      onEvent()({ eventType: 'regulation_success', data: { strategy: 'pausa' } });
    });

    await act(async () => {
      await onSessionComplete()({ reason: 'completed' });
    });

    expect(await screen.findByText(/Escolha o proximo passo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar no proximo nivel/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Repetir este nivel/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Encerrar agora/i })).toBeEnabled();

    expect(apiPostMock).toHaveBeenCalledWith('/games/game1/end-session', expect.any(Object));
  });
});
