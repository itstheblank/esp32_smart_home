import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('MQTT Contract v2.0.0 Specification Tests', () => {
  const contractPath = path.resolve(__dirname, '../../../../docs/contracts/mqtt-contract.json');
  const load = () => JSON.parse(fs.readFileSync(contractPath, 'utf8'));

  it('should load docs/contracts/mqtt-contract.json correctly', () => {
    expect(fs.existsSync(contractPath)).toBe(true);
    const contract = load();
    expect(contract.version).toBe('2.0.0');
    expect(Array.isArray(contract.topics)).toBe(true);
  });

  it('should expose exactly the command and log topics used by firmware', () => {
    const topicNames = load().topics.map((t) => t.topic);
    expect(topicNames).toEqual(['smarthome/cmd', 'smarthome/logs']);
  });

  it('should keep door command CLOSE (never CLOSED) in the command set', () => {
    const cmd = load().topics.find((t) => t.topic === 'smarthome/cmd');
    expect(cmd.commands.DOOR).toContain('CLOSE');
    expect(cmd.commands.DOOR).not.toContain('CLOSED');
    expect(cmd.commands.LIGHT).toEqual(['ON', 'OFF']);
    expect(cmd.retain).toBe(false);
  });

  it('should publish LWT OFFLINE on smarthome/logs, non-retained', () => {
    const lwt = load().connection.lastWill;
    expect(lwt.topic).toBe('smarthome/logs');
    expect(lwt.retain).toBe(false);
    expect(lwt.payload.action).toBe('OFFLINE');
  });
});
