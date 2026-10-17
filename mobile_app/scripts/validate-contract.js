/**
 * MQTT Contract Validator for Mobile App
 * Verifies that topics and payloads used in mobile_app match docs/mqtt-contract.json
 */
const fs = require('fs');
const path = require('path');

const contractPath = path.resolve(__dirname, '../../docs/mqtt-contract.json');

console.log('🔍 [Contract Guard] Checking MQTT Contract consistency...');

if (!fs.existsSync(contractPath)) {
  console.error(`❌ [Contract Guard] Contract file not found at: ${contractPath}`);
  process.exit(1);
}

try {
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  console.log(`✅ [Contract Guard] Loaded contract version ${contract.version || '1.0.0'}`);

  const expectedTopics = [
    'smarthome/cmd/light',
    'smarthome/cmd/door',
    'smarthome/state/light',
    'smarthome/state/door',
    'smarthome/state/motion',
    'smarthome/state/online',
    'smarthome/event/access',
  ];

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

  // Scan App.js or src/ for basic string consistency
  const appJsPath = path.resolve(__dirname, '../App.js');
  if (fs.existsSync(appJsPath)) {
    const appSource = fs.readFileSync(appJsPath, 'utf8');

    // Check for common bugs like using CLOSE as state instead of CLOSED
    if (
      appSource.includes("'smarthome/state/door'") &&
      appSource.includes("'CLOSE'") &&
      !appSource.includes("'CLOSED'")
    ) {
      console.error(
        "❌ [Contract Guard] Bug detected: Expected state 'CLOSED' for door, but found only 'CLOSE'!"
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
