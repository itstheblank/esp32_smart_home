/**
 * Exponential Backoff with Jitter Algorithm
 * Formula: waitMs = min(maxMs, baseMs * 2^attempt) + random(0, jitterMs)
 */

export interface BackoffConfig {
  baseMs: number;
  maxMs: number;
  jitterMs: number;
}

export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  baseMs: 1000,
  maxMs: 30000,
  jitterMs: 1000,
};

export function calculateBackoffWithJitter(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
  randomFn: () => number = Math.random
): number {
  const safeAttempt = Math.max(0, Math.floor(attempt));
  const exponential = config.baseMs * Math.pow(2, safeAttempt);
  const capped = Math.min(config.maxMs, exponential);
  const jitter = Math.floor(randomFn() * config.jitterMs);
  return capped + jitter;
}

