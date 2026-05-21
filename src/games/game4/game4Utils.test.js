import { describe, expect, it } from 'vitest';
import { createCenteredHitArea, resolveDropSlotIndex } from './game4Utils';

describe('game4Utils', () => {
  it('cria uma hit area centralizada para os cards', () => {
    expect(createCenteredHitArea(280, 58)).toEqual({
      x: -140,
      y: -29,
      width: 280,
      height: 58
    });
  });

  it('resolve o slot com maior sobreposicao', () => {
    const slotIndex = resolveDropSlotIndex(
      { x: 600, y: 160, width: 280, height: 58 },
      [
        { index: 0, filled: false, bounds: { x: 560, y: 150, width: 352, height: 82 } },
        { index: 1, filled: false, bounds: { x: 560, y: 240, width: 352, height: 82 } }
      ]
    );

    expect(slotIndex).toBe(0);
  });

  it('ignora slots preenchidos e retorna null quando nao houver encaixe suficiente', () => {
    const slotIndex = resolveDropSlotIndex(
      { x: 100, y: 100, width: 280, height: 58 },
      [
        { index: 0, filled: true, bounds: { x: 80, y: 80, width: 352, height: 82 } },
        { index: 1, filled: false, bounds: { x: 600, y: 300, width: 352, height: 82 } }
      ]
    );

    expect(slotIndex).toBeNull();
  });
});

