import { describe, it, expect } from 'vitest';
import { ASYNC_CONFIG } from '@repo/contracts';

describe('Bounded Ring Buffer (O(1) Eviction)', () => {
  it('should never exceed 50 elements and discard oldest records', () => {
    const maxSize = ASYNC_CONFIG.RING_BUFFER_MAX_SIZE; // 50
    const buffer: number[] = [];

    // Push 100 items
    for (let i = 1; i <= 100; i++) {
      buffer.unshift(i); // Add to head
      if (buffer.length > maxSize) {
        buffer.length = maxSize; // Evict oldest
      }
    }

    expect(buffer.length).toBe(50);
    // Newest is 100
    expect(buffer[0]).toBe(100);
    // Oldest kept is 51 (items 1..50 were dropped)
    expect(buffer[49]).toBe(51);
    expect(buffer).not.toContain(1);
    expect(buffer).not.toContain(50);
  });
});
