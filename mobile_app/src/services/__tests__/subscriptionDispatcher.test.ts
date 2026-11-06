import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionDispatcher } from '../subscriptionDispatcher';

describe('Dynamic Subscription Dispatcher', () => {
  let dispatcher: SubscriptionDispatcher;

  beforeEach(() => {
    dispatcher = new SubscriptionDispatcher();
  });

  it('should dispatch to exact topic subscriber', () => {
    const handler = vi.fn();
    dispatcher.subscribe('smarthome/event/access', handler);

    const count = dispatcher.dispatch(
      'smarthome/event/access',
      JSON.stringify({ uid: 'A1B2C3D4', result: 'GRANTED' })
    );

    expect(count).toBe(1);
    expect(handler).toHaveBeenCalledWith(
      'smarthome/event/access',
      JSON.stringify({ uid: 'A1B2C3D4', result: 'GRANTED' })
    );
  });

  it("should dispatch to single-level wildcard '+' subscribers", () => {
    const lightHandler = vi.fn();
    const wildcardHandler = vi.fn();

    dispatcher.subscribe('smarthome/state/light', lightHandler);
    dispatcher.subscribe('smarthome/state/+', wildcardHandler);

    dispatcher.dispatch('smarthome/state/light', 'ON');
    expect(lightHandler).toHaveBeenCalledWith('smarthome/state/light', 'ON');
    expect(wildcardHandler).toHaveBeenCalledWith('smarthome/state/light', 'ON');

    // Dispatching door state should trigger wildcard but not light
    dispatcher.dispatch('smarthome/state/door', 'CLOSED');
    expect(lightHandler).toHaveBeenCalledTimes(1);
    expect(wildcardHandler).toHaveBeenCalledWith('smarthome/state/door', 'CLOSED');
  });

  it('should not dispatch to unrelated topics', () => {
    const handler = vi.fn();
    dispatcher.subscribe('smarthome/state/light', handler);

    const count = dispatcher.dispatch('smarthome/cmd/light', 'ON');
    expect(count).toBe(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should cleanly unsubscribe when callback is invoked', () => {
    const handler = vi.fn();
    const unsubscribe = dispatcher.subscribe('smarthome/state/light', handler);

    expect(dispatcher.getSubscriberCount('smarthome/state/light')).toBe(1);

    unsubscribe();
    expect(dispatcher.getSubscriberCount('smarthome/state/light')).toBe(0);

    dispatcher.dispatch('smarthome/state/light', 'ON');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should isolate subscriber errors so other handlers still execute', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const faultyHandler = vi.fn(() => {
      throw new Error('Handler crashed!');
    });
    const healthyHandler = vi.fn();

    dispatcher.subscribe('smarthome/state/light', faultyHandler);
    dispatcher.subscribe('smarthome/state/light', healthyHandler);

    const count = dispatcher.dispatch('smarthome/state/light', 'ON');

    expect(faultyHandler).toHaveBeenCalled();
    expect(healthyHandler).toHaveBeenCalledWith('smarthome/state/light', 'ON');
    expect(count).toBe(1); // healthyHandler completed

    consoleErrorSpy.mockRestore();
  });
});
