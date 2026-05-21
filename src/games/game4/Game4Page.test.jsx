import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import Game4Page from './Game4Page';

const { apiPostMock, ioMock, registryStore, createGameMock } = vi.hoisted(() => {
  const registryStore = new Map();

  const apiPostMock = vi.fn((url) => {
    if (url.includes('start-session')) {
      return Promise.resolve({ data: { sessionId: 41 } });
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

vi.mock('./game4Phaser', () => ({
  createGame4Game: createGameMock
}));

const renderGame = () => render(
  <MemoryRouter
    initialEntries={['/games/game4/16?level=1']}
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Routes>
      <Route path="/games/game4/:patientId" element={<Game4Page />} />
    </Routes>
  </MemoryRouter>
);

describe('Game4Page', () => {
  it('abre o modal de progressao quando a sequencia final esta correta, mesmo com reorganizacao', async () => {
    renderGame();

    const onEvent = () => registryStore.get('onEvent');
    const onSessionComplete = () => registryStore.get('onSessionComplete');

    await screen.findByText(/Routine Builder/i);

    await act(async () => {
      onEvent()({
        eventType: 'trigger',
        data: {
          type: 'routine_start',
          routineId: 'manha',
          routineType: 'manha',
          activitiesCount: 3,
          activities: [
            { id: 'acordar', label: 'Acordar' },
            { id: 'escovar', label: 'Escovar os dentes' },
            { id: 'cafe', label: 'Tomar cafe' }
          ]
        }
      });
      onEvent()({ eventType: 'trigger', data: { type: 'card_placed', activityId: 'cafe', slotIndex: 0 } });
      onEvent()({ eventType: 'trigger', data: { type: 'card_placed', activityId: 'acordar', slotIndex: 1 } });
      onEvent()({ eventType: 'trigger', data: { type: 'card_placed', activityId: 'escovar', slotIndex: 2 } });
      onEvent()({
        eventType: 'dysregulation',
        data: {
          type: 'sequence_needs_adjustment',
          incorrectCount: 2,
          incorrectSlots: [0, 1],
          incorrectActivityIds: ['cafe', 'acordar']
        }
      });
      onEvent()({ eventType: 'trigger', data: { type: 'card_placed', activityId: 'acordar', slotIndex: 0 } });
      onEvent()({ eventType: 'trigger', data: { type: 'card_placed', activityId: 'escovar', slotIndex: 1 } });
      onEvent()({ eventType: 'trigger', data: { type: 'card_placed', activityId: 'cafe', slotIndex: 2 } });
      onEvent()({ eventType: 'regulation_success', data: { type: 'routine_sequence_correct', correctCount: 3 } });
      onEvent()({ eventType: 'trigger', data: { type: 'routine_complete', durationMs: 15000 } });
    });

    await act(async () => {
      await onSessionComplete()({ reason: 'completed' });
    });

    expect(await screen.findByText(/Excelente Trabalho!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Avancar para o Nivel 2/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Praticar Novamente/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Encerrar Sessao/i })).toBeEnabled();

    expect(apiPostMock).toHaveBeenCalledWith('/games/game4/end-session', expect.any(Object));
  });
});
