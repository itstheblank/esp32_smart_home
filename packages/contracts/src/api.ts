/**
 * API & Structured Log Contract Types
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export type LogCategory = "SECURITY" | "LIGHT" | "DOOR" | "MOTION" | "SYSTEM";
export type LogLevel = "INFO" | "SUCCESS" | "WARN" | "ERROR";

export interface StructuredLogEvent {
  id: string; // UUID hoặc microsecond timestamp
  timestamp: string; // ISO 8601 string
  timeFormatted: string; // HH:mm:ss
  category: LogCategory;
  level: LogLevel;
  translationKey: string;
  params: Record<string, string | number>;
  rawTopic?: string;
  rawPayload?: string;
}

export interface DeviceTelemetry {
  deviceId: string;
  name: string;
  online: boolean;
  lightState: "ON" | "OFF";
  doorState: "OPEN" | "CLOSED";
  motionDetected: boolean;
  lastSeen: string;
}

export interface RfidCardView {
  uid: string;
  cardName: string;
  ownerName?: string;
  isActive: boolean;
  registeredAt: string;
}
