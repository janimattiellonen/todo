const STEP = 1024;

/**
 * Compute a new sparse position for a task being moved into a column at
 * a given index.
 *
 * Strategy: take the midpoint of the neighbouring positions. With
 * `numeric` storage we can keep halving indefinitely; explicit
 * re-spacing isn't needed at this scale.
 *
 * - Empty column / dropping into an empty list → STEP (1024)
 * - Drop at the start → first.position / 2 (or first - STEP if first is small)
 * - Drop at the end → last.position + STEP
 * - Drop in the middle → (prev.position + next.position) / 2
 *
 * `existingPositions` must already exclude the moving task itself if
 * it's being repositioned within the same column.
 */
export function computeNewPosition(
  existingPositions: ReadonlyArray<number>,
  targetIndex: number,
): number {
  if (existingPositions.length === 0) {
    return STEP;
  }

  // Clamp to [0, existingPositions.length].
  const i = Math.max(0, Math.min(targetIndex, existingPositions.length));

  if (i === 0) {
    const first = existingPositions[0] ?? STEP;
    // Halve the first position; if that would round to zero, step away.
    const candidate = first / 2;
    return candidate > 0 ? candidate : first - STEP;
  }

  if (i === existingPositions.length) {
    const last = existingPositions[existingPositions.length - 1] ?? 0;
    return last + STEP;
  }

  const prev = existingPositions[i - 1];
  const next = existingPositions[i];
  if (prev === undefined || next === undefined) {
    // Should be unreachable given the index guards above.
    return STEP;
  }
  return (prev + next) / 2;
}
