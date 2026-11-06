/**
 * Dynamic Subscription Dispatcher (Observer Pattern with Wildcard Support)
 */

export type TopicHandler = (topic: string, payload: string) => void;

export class SubscriptionDispatcher {
  private handlers = new Map<string, Set<TopicHandler>>();

  subscribe(topicPattern: string, handler: TopicHandler): () => void {
    if (!this.handlers.has(topicPattern)) {
      this.handlers.set(topicPattern, new Set());
    }
    this.handlers.get(topicPattern)!.add(handler);

    return () => {
      const set = this.handlers.get(topicPattern);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.handlers.delete(topicPattern);
        }
      }
    };
  }

  dispatch(incomingTopic: string, payload: string): number {
    let notifiedCount = 0;

    // 1. Exact match dispatch
    const exactHandlers = this.handlers.get(incomingTopic);
    if (exactHandlers) {
      exactHandlers.forEach((handler) => {
        try {
          handler(incomingTopic, payload);
          notifiedCount++;
        } catch (err) {
          console.error(`[Dispatcher Error] Topic ${incomingTopic}:`, err);
        }
      });
    }

    // 2. Wildcard '+' match dispatch (single level, e.g. smarthome/state/+)
    this.handlers.forEach((handlers, pattern) => {
      if (pattern.endsWith('/+')) {
        const prefix = pattern.slice(0, -1); // e.g. "smarthome/state/"
        if (incomingTopic.startsWith(prefix) && !incomingTopic.slice(prefix.length).includes('/')) {
          handlers.forEach((handler) => {
            try {
              handler(incomingTopic, payload);
              notifiedCount++;
            } catch (err) {
              console.error(`[Dispatcher Wildcard Error] Pattern ${pattern}:`, err);
            }
          });
        }
      }
    });

    return notifiedCount;
  }

  getSubscriberCount(topicPattern?: string): number {
    if (topicPattern) return this.handlers.get(topicPattern)?.size ?? 0;
    let total = 0;
    this.handlers.forEach((set) => {
      total += set.size;
    });
    return total;
  }

  clear(): void {
    this.handlers.clear();
  }
}
