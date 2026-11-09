/**
 * Motion, Watchdog Timings & Haptic Patterns
 */

export const motionTokens = {
  // Animation Durations (ms)
  durationFast: 150,
  durationNormal: 300,
  durationWatchdogLight: 3000,
  durationWatchdogDoor: 4000,
  durationRfidDebounce: 1500,
  durationPirCooldown: 5000,

  // Shake Keyframe Animation (Khi lỗi hoặc mất kết nối Broker)
  shakeAnimation: {
    offset: 8,
    cycles: 3,
    durationTotal: 400,
  },

  // Haptic feedback semantic keys (mapping to expo-haptics)
  hapticFeedback: {
    togglePress: "impactLight",
    accessGranted: "notificationSuccess",
    accessDenied: "notificationError",
    brokerDisconnect: "notificationWarning",
  },
} as const;
