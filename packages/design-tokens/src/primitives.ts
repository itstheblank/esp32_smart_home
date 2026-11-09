/**
 * Level 1: Primitive Tokens (Giá trị thô không phụ thuộc ngữ cảnh)
 * Nguồn: Figma Node-ID 2-199 & 2-115
 */

export const primitiveColors = {
  // Bảng màu trung tính & nền sáng
  gray50: "#F8F9FA",
  gray100: "#F4F5F8", // Scaffold Background
  gray200: "#ECEEF2", // Icon Container Background
  gray300: "#E5E7EB", // Divider & Inactive Track
  gray400: "#9CA3AF", // Text Muted / Off label
  gray500: "#8E8E93", // Text Secondary ("Monday, 20 Jan")
  gray900: "#111827", // Text Primary ("Hi Ye Min")
  gray950: "#111216", // Active Card Dark Surface

  // Bảng màu tối (Dark Mode Scaffold)
  slate900: "#0F172A", // Dark Scaffold Background
  slate800: "#1E293B", // Dark Inactive Card Surface
  slate950: "#090D16", // Dark Active Card Obsidian

  // Bảng màu trạng thái & chức năng (Semantic States)
  emerald500: "#22C55E", // Success / Online / RFID Granted (+35% Energy)
  amber400: "#FFC700", // Warning / Light On Glow / Motion Cooldown
  blue600: "#2563EB", // Door Open / Primary Info
  red500: "#EF4444", // Danger / RFID Denied / Door Closed / Offline
  orange500: "#F97316", // PIR Detected Motion

  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  none: 0,
  "2xs": 4, // Dot indicator, micro padding
  xs: 8, // Badge padding, small gap
  sm: 12, // Subtext gap, card inner margin
  md: 16, // Card padding, Column gap
  lg: 20, // Screen horizontal padding
  xl: 24, // Section vertical gap
  "2xl": 32, // Header margin
  "3xl": 40, // Hero padding
  dockOffset: 24,
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8, // Badge & small chips
  md: 14, // Icon container 40x40
  lg: 20, // Control pills & buttons
  xl: 24, // Standard Device Card
  xxl: 32, // Large bottom sheet modal
  dock: 36, // Floating Dock Navigation Bar
  full: 9999, // Round buttons (FAB, Avatar)
} as const;

export const radius = radii;

export const typography = {
  fontFamily: {
    heading:
      "'Plus Jakarta Sans', PlusJakartaSans_700Bold, -apple-system, sans-serif",
    body: "'Plus Jakarta Sans', PlusJakartaSans_400Regular, -apple-system, sans-serif",
    plusJakarta: "'Plus Jakarta Sans', PlusJakartaSans_400Regular, sans-serif",
    mono: "monospace",
  },
  fontSize: {
    display: 30,
    greeting: 20,
    metric: 22,
    deviceTitle: 16,
    tab: 15,
    controlLabel: 13,
    dateSubtitle: 13,
    subtext: 12,
    badge: 11,
  },
  lineHeight: {
    display: 38,
    greeting: 26,
    metric: 26,
    deviceTitle: 20,
    tab: 20,
    controlLabel: 18,
    subtext: 16,
    badge: 14,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
  },
} as const;
