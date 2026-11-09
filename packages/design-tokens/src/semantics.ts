import { primitiveColors } from "./primitives";

export interface ThemeColors {
  // Scaffolds & Surfaces
  appBackground: string;
  surfaceCard: string;
  surfaceCardActive: string;
  surfaceSubtle: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnActive: string;
  textOnActiveMuted: string;

  // Borders & Dividers
  borderDefault: string;
  borderActive: string;

  // Semantic Status
  statusOnline: string;
  statusOffline: string;
  statusWarning: string;
  statusSecurityAlert: string;
  statusMotion: string;
}

export const lightTheme: ThemeColors = {
  appBackground: primitiveColors.gray100, // #F4F5F8
  surfaceCard: primitiveColors.white, // #FFFFFF
  surfaceCardActive: primitiveColors.gray950, // #111216
  surfaceSubtle: primitiveColors.gray200, // #ECEEF2

  textPrimary: primitiveColors.gray900, // #111827
  textSecondary: primitiveColors.gray500, // #8E8E93
  textMuted: primitiveColors.gray400, // #9CA3AF
  textOnActive: primitiveColors.white, // #FFFFFF
  textOnActiveMuted: primitiveColors.gray400, // #9CA3AF

  borderDefault: "transparent",
  borderActive: "rgba(0, 0, 0, 0.05)",

  statusOnline: primitiveColors.emerald500, // #22C55E
  statusOffline: primitiveColors.red500, // #EF4444
  statusWarning: primitiveColors.amber400, // #FFC700
  statusSecurityAlert: primitiveColors.red500, // #EF4444
  statusMotion: primitiveColors.orange500, // #F97316
};

export const darkTheme: ThemeColors = {
  appBackground: primitiveColors.slate900, // #0F172A (Deep Slate)
  surfaceCard: primitiveColors.slate800, // #1E293B
  surfaceCardActive: primitiveColors.slate950, // #090D16 (Deep Obsidian)
  surfaceSubtle: "rgba(255, 255, 255, 0.06)",

  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textOnActive: "#FFFFFF",
  textOnActiveMuted: "#94A3B8",

  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderActive: "rgba(255, 255, 255, 0.15)",

  statusOnline: primitiveColors.emerald500,
  statusOffline: primitiveColors.red500,
  statusWarning: primitiveColors.amber400,
  statusSecurityAlert: primitiveColors.red500,
  statusMotion: primitiveColors.orange500,
};
