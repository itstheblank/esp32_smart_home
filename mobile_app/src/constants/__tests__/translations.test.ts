import { describe, it, expect } from "vitest";
import { translations, formatTranslation, TranslationKey } from "../translations";

describe("Internationalization Dictionary Parity & Formatter", () => {
  it("should have identical translation keys for both Vietnamese and English", () => {
    const viKeys = Object.keys(translations.vi).sort();
    const enKeys = Object.keys(translations.en).sort();

    expect(viKeys).toEqual(enKeys);
    expect(viKeys.length).toBeGreaterThan(100);
  });

  it("should format string template parameters correctly", () => {
    const template = "Quẹt thẻ UID: {uid} — Kết quả: {res}";
    const formatted = formatTranslation(template, {
      uid: "A1B2C3D4",
      res: "GRANTED",
    });

    expect(formatted).toBe("Quẹt thẻ UID: A1B2C3D4 — Kết quả: GRANTED");
  });

  it("should format multi-variable templates for attempt and delay", () => {
    const template = translations.vi.LOG_EXP_BACKOFF_ATTEMPT;
    const formatted = formatTranslation(template, {
      attempt: 2,
      delay: 4000,
    });

    expect(formatted).toBe("Exponential Backoff: Thử lại lần 2 sau 4000ms...");
  });

  it("should leave template untouched if no params provided", () => {
    const template = "Hệ thống Smart Home khởi động thành công.";
    expect(formatTranslation(template)).toBe(template);
  });

  it("should provide bilingual strings for MQTT and Audit errors", () => {
    expect(translations.vi.mqttClientError).toBe("Lỗi kết nối MQTT Client");
    expect(translations.en.mqttClientError).toBe("MQTT Client Connection Error");
    expect(translations.vi.mqttSendNotConnected).toBe("Không thể gửi lệnh: Chưa kết nối tới Broker");
    expect(translations.en.mqttSendNotConnected).toBe("Cannot send command: Broker not connected");
  });
});

