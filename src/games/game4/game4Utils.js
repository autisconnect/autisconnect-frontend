const getIntersectionArea = (rectA, rectB) => {
  const left = Math.max(rectA.x, rectB.x);
  const top = Math.max(rectA.y, rectB.y);
  const right = Math.min(rectA.x + rectA.width, rectB.x + rectB.width);
  const bottom = Math.min(rectA.y + rectA.height, rectB.y + rectB.height);

  if (right <= left || bottom <= top) {
    return 0;
  }

  return (right - left) * (bottom - top);
};

export const createCenteredHitArea = (width, height) => ({
  x: -width / 2,
  y: -height / 2,
  width,
  height
});

export const resolveDropSlotIndex = (cardBounds, slots, minOverlapRatio = 0.12) => {
  if (!cardBounds || !Array.isArray(slots) || slots.length === 0) {
    return null;
  }

  const cardArea = Math.max(cardBounds.width * cardBounds.height, 1);
  let bestSlotIndex = null;
  let bestRatio = 0;

  slots.forEach((slot) => {
    if (!slot || slot.filled || !slot.bounds) {
      return;
    }

    const overlapArea = getIntersectionArea(cardBounds, slot.bounds);
    const overlapRatio = overlapArea / cardArea;

    if (overlapRatio > bestRatio) {
      bestRatio = overlapRatio;
      bestSlotIndex = slot.index;
    }
  });

  return bestRatio >= minOverlapRatio ? bestSlotIndex : null;
};

