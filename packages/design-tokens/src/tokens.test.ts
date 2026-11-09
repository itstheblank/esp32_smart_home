import { describe, it, expect } from "vitest";
import {
  primitiveColors,
  spacing,
  radii,
  lightTheme,
  darkTheme,
  motionTokens,
} from "./index";

describe("Design Tokens System Verification", () => {
  it("should define all primary primitive colors from Figma spec", () => {
    expect(primitiveColors.gray100).toBe("#F4F5F8");
    expect(primitiveColors.gray950).toBe("#111216");
    expect(primitiveColors.emerald500).toBe("#22C55E");
    expect(primitiveColors.amber400).toBe("#FFC700");
    expect(primitiveColors.red500).toBe("#EF4444");
  });

  it("should have correct spacing and 8-point grid values", () => {
    expect(spacing["2xs"]).toBe(4);
    expect(spacing.xs).toBe(8);
    expect(spacing.sm).toBe(12);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(20);
    expect(spacing.xl).toBe(24);
  });

  it("should maintain card radius at 24px and dock at 36px", () => {
    expect(radii.xl).toBe(24);
    expect(radii.dock).toBe(36);
    expect(radii.full).toBe(9999);
  });

  it("should have consistent light and dark theme keys", () => {
    const lightKeys = Object.keys(lightTheme).sort();
    const darkKeys = Object.keys(darkTheme).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it("should match watchdog timings in motion tokens", () => {
    expect(motionTokens.durationWatchdogLight).toBe(3000);
    expect(motionTokens.durationWatchdogDoor).toBe(4000);
  });
});
