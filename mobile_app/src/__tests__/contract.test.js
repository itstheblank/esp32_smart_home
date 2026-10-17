import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('MQTT Contract Specification & Parser Tests', () => {
  const contractPath = path.resolve(__dirname, '../../../docs/mqtt-contract.json');

  it('should load docs/mqtt-contract.json correctly', () => {
    expect(fs.existsSync(contractPath)).toBe(true);
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    expect(contract.version).toBe('1.0.0');
    expect(Array.isArray(contract.topics)).toBe(true);
  });

  it('should have exact contract topic mappings', () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const topicNames = contract.topics.map((t) => t.topic);

    expect(topicNames).toContain('smarthome/cmd/light');
    expect(topicNames).toContain('smarthome/cmd/door');
    expect(topicNames).toContain('smarthome/state/light');
    expect(topicNames).toContain('smarthome/state/door');
    expect(topicNames).toContain('smarthome/state/motion');
    expect(topicNames).toContain('smarthome/state/online');
    expect(topicNames).toContain('smarthome/event/access');
  });

  it('should differentiate command CLOSE vs state CLOSED for door', () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const doorCmd = contract.topics.find((t) => t.topic === 'smarthome/cmd/door');
    const doorState = contract.topics.find((t) => t.topic === 'smarthome/state/door');

    expect(doorCmd.payloads).toContain('CLOSE');
    expect(doorCmd.payloads).not.toContain('CLOSED');

    expect(doorState.payloads).toContain('CLOSED');
    expect(doorState.payloads).not.toContain('CLOSE');
  });
});
