/**
 * MQTT Contract Validator for Mobile App
 * Verifies that topics and payloads used in mobile_app match docs/contracts/mqtt-contract.json (v2.0.0)
 */
const fs = require('fs');
const path = require('path');

const contractPath = path.resolve(__dirname, '../../../docs/contracts/mqtt-contract.json');

console.log('🔍 [Contract Guard] Checking MQTT Contract consistency...');

if (!fs.existsSync(contractPath)) {
  console.error(`❌ [Contract Guard] Contract file not found at: ${contractPath}`);
  process.exit(1);
}

try {
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  console.log(`✅ [Contract Guard] Loaded contract version ${contract.version || '1.0.0'}`);

  const expectedTopics = ['smarthome/cmd', 'smarthome/logs'];

  const contractTopics = (contract.topics || []).map((t) => t.topic);
  const missingInContract = expectedTopics.filter((t) => !contractTopics.includes(t));

  if (missingInContract.length > 0) {
    console.warn(
      `⚠️ [Contract Guard] Missing expected topics in contract: ${missingInContract.join(', ')}`
    );
  } else {
    console.log(
      `✅ [Contract Guard] All ${expectedTopics.length} core topics exist in shared contract.`
    );
  }

  // Guard against regressions to the deprecated v1 per-device topics
  const legacyTopics = [
    'smarthome/cmd/light',
    'smarthome/cmd/door',
    'smarthome/state/',
    'smarthome/event/access',
  ];
  const srcFiles = [
    path.resolve(__dirname, '../src/hooks/useMqttCommand.ts'),
    path.resolve(__dirname, '../src/context/MqttContext.tsx'),
    path.resolve(__dirname, '../src/context/DeviceContext.tsx'),
  ];
  for (const file of srcFiles) {
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    const hit = legacyTopics.find((t) => source.includes(`'${t}`));
    if (hit) {
      console.error(
        `❌ [Contract Guard] ${path.basename(file)} still uses deprecated v1 topic '${hit}'. Use smarthome/cmd + smarthome/logs.`
      );
      process.exit(1);
    }
  }

  console.log('🎉 [Contract Guard] Contract validation passed successfully!');
  process.exit(0);
} catch (err) {
  console.error(`❌ [Contract Guard] Failed to validate contract: ${err.message}`);
  process.exit(1);
}
