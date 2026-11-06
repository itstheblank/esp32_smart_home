import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WatchdogEngine } from '../watchdogEngine';

describe('Watchdog Rollback Engine (Timer Verification)', () => {
  let engine: WatchdogEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new WatchdogEngine();
  });

  afterEach(() => {
    engine.clearAll();
    vi.useRealTimers();
  });

  it('should disarm successfully before timeout fires (Happy Path)', () => {
    const onTimeout = vi.fn();

    // Arm light for 3000ms
    engine.arm('light', { timeoutMs: 3000, onTimeout });
    expect(engine.hasActiveTimer('light')).toBe(true);

    // Fast-forward 500ms (ESP32 responds)
    vi.advanceTimersByTime(500);

    // Disarm timer
    const disarmed = engine.disarm('light');
    expect(disarmed).toBe(true);
    expect(engine.hasActiveTimer('light')).toBe(false);

    // Fast-forward past original 3000ms
    vi.advanceTimersByTime(3000);

    // Timeout callback must never be called!
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('should trigger rollback when board does not respond within timeout', () => {
    const onTimeout = vi.fn();

    engine.arm('light', { timeoutMs: 3000, onTimeout });

    // Advance 2999ms - should not fire yet
    vi.advanceTimersByTime(2999);
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance 1ms more -> 3000ms reached
    vi.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(engine.hasActiveTimer('light')).toBe(false);
  });

  it('should trigger Door Jam timeout at 4000ms', () => {
    const onDoorTimeout = vi.fn();

    engine.arm('door', { timeoutMs: 4000, onTimeout: onDoorTimeout });

    vi.advanceTimersByTime(3999);
    expect(onDoorTimeout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onDoorTimeout).toHaveBeenCalledTimes(1);
  });

  it('should handle independent timers for different devices simultaneously', () => {
    const onLightTimeout = vi.fn();
    const onDoorTimeout = vi.fn();

    engine.arm('light', { timeoutMs: 3000, onTimeout: onLightTimeout });
    engine.arm('door', { timeoutMs: 4000, onTimeout: onDoorTimeout });

    // After 2000ms, disarm light (light succeeded)
    vi.advanceTimersByTime(2000);
    engine.disarm('light');

    // Advance to 3500ms
    vi.advanceTimersByTime(1500);
    expect(onLightTimeout).not.toHaveBeenCalled();
    expect(onDoorTimeout).not.toHaveBeenCalled();

    // Advance past 4000ms -> door times out!
    vi.advanceTimersByTime(600);
    expect(onLightTimeout).not.toHaveBeenCalled();
    expect(onDoorTimeout).toHaveBeenCalledTimes(1);
  });
});
