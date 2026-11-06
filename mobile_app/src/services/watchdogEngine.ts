/**
 * Watchdog Rollback Engine (Headless Timer with Fake Timers Support)
 */

export interface WatchdogOptions {
  timeoutMs: number;
  onTimeout: () => void;
}

export class WatchdogEngine {
  private activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

  arm(key: string, options: WatchdogOptions): void {
    this.disarm(key); // Cancel any previous timer for this device

    const timer = setTimeout(() => {
      this.activeTimers.delete(key);
      options.onTimeout();
    }, options.timeoutMs);

    this.activeTimers.set(key, timer);
  }

  disarm(key: string): boolean {
    const timer = this.activeTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(key);
      return true;
    }
    return false;
  }

  hasActiveTimer(key: string): boolean {
    return this.activeTimers.has(key);
  }

  clearAll(): void {
    this.activeTimers.forEach((timer) => clearTimeout(timer));
    this.activeTimers.clear();
  }
}

