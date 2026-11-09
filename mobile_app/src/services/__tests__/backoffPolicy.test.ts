import { describe, it, expect } from 'vitest';
import { calculateBackoffWithJitter, DEFAULT_BACKOFF_CONFIG } from '../backoffPolicy';

describe('Exponential Backoff with Jitter Algorithm', () => {
  it('should calculate correct base and jitter for attempt 0', () => {
    // attempt 0: 1000 * 2^0 = 1000. Jitter with 0.5 -> 500 => 1500ms
    const wait = calculateBackoffWithJitter(0, DEFAULT_BACKOFF_CONFIG, () => 0.5);
    expect(wait).toBe(1500);
  });

  it('should double wait time for attempt 1 and 2', () => {
    // attempt 1: 1000 * 2^1 = 2000. Jitter 0 -> 2000ms
    const wait1 = calculateBackoffWithJitter(1, DEFAULT_BACKOFF_CONFIG, () => 0);
    expect(wait1).toBe(2000);

    // attempt 2: 1000 * 2^2 = 4000. Jitter 0 -> 4000ms
    const wait2 = calculateBackoffWithJitter(2, DEFAULT_BACKOFF_CONFIG, () => 0);
    expect(wait2).toBe(4000);
  });

  it('should enforce ceiling at maxMs (30000ms) for high attempts', () => {
    // attempt 8: 1000 * 2^8 = 256000 -> capped at 30000ms. Jitter 0.25 -> 250 => 30250ms
    const wait = calculateBackoffWithJitter(8, DEFAULT_BACKOFF_CONFIG, () => 0.25);
    expect(wait).toBe(30250);
  });

  it('should handle negative attempt defensively by treating it as 0', () => {
    const wait = calculateBackoffWithJitter(-5, DEFAULT_BACKOFF_CONFIG, () => 0);
    expect(wait).toBe(1000);
  });
});
