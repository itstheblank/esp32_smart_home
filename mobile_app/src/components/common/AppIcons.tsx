import React from 'react';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  style?: any;
}

/**
 * 100% Native Figma Vector Icons (Figma Node-ID 2-199 & 2-115)
 * Bóc tách trực tiếp từ prototype.html (thay thế hoàn toàn @expo/vector-icons)
 * Không phụ thuộc font tệp TTF, giảm 3.5MB bundle, hiển thị pixel-perfect.
 */
export const AppIcons = {
  // --- 1. DOCK & NAVIGATION ---
  Home: ({ size = 22, color = '#111216', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </Svg>
  ),
  HomeOutline: ({ size = 22, color = '#8E8E93', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  ),
  Events: ({ size = 22, color = '#111216', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </Svg>
  ),
  EventsOutline: ({ size = 22, color = '#8E8E93', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
      <Line x1="16" y1="13" x2="8" y2="13" />
      <Line x1="16" y1="17" x2="8" y2="17" />
      <Line x1="10" y1="9" x2="8" y2="9" />
    </Svg>
  ),
  Settings: ({ size = 22, color = '#111216', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </Svg>
  ),
  SettingsOutline: ({ size = 22, color = '#8E8E93', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  ),
  Plus: ({ size = 24, color = '#FFFFFF', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </Svg>
  ),

  // --- 2. DEVICE HARDWARE ---
  LightbulbOn: ({ size = 26, color = '#FFC700', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
    </Svg>
  ),
  LightbulbOff: ({ size = 26, color = '#8E8E93', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M9 18h6" />
      <Path d="M10 22h4" />
      <Path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.3 4.5 3.5 5.5.5.3.5.7.5 1.5h6c0-.8 0-1.2.5-1.5 2.2-1 3.5-3 3.5-5.5a7 7 0 0 0-7-7z" />
    </Svg>
  ),
  DoorOpen: ({ size = 26, color = '#789cea', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </Svg>
  ),
  DoorClosed: ({ size = 26, color = '#8E8E93', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  ),
  LockClosed: ({ size = 20, color = '#22C55E', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  ),
  LockOpen: ({ size = 20, color = '#86a5e8', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </Svg>
  ),
  MotionSensor: ({ size = 26, color = '#f4a973', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
    </Svg>
  ),
  RfidCard: ({ size = 26, color = '#87e3a9', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
    </Svg>
  ),
  FlashEnergy: ({ size = 24, color = '#f0d77e', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M7 2v11h3v9l7-12h-4l4-8z" />
    </Svg>
  ),
  Microchip: ({ size = 18, color = '#8E8E93', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Rect x={4} y={4} width={16} height={16} rx={2} />
      <Rect x={9} y={9} width={6} height={6} />
      <Line x1={9} y1={1} x2={9} y2={4} />
      <Line x1={15} y1={1} x2={15} y2={4} />
      <Line x1={9} y1={20} x2={9} y2={23} />
      <Line x1={15} y1={20} x2={15} y2={23} />
      <Line x1={20} y1={9} x2={23} y2={9} />
      <Line x1={20} y1={14} x2={23} y2={14} />
      <Line x1={1} y1={9} x2={4} y2={9} />
      <Line x1={1} y1={14} x2={4} y2={14} />
    </Svg>
  ),

  // --- 3. GATEWAY & AUTHENTICATION (FIGMA 2-199) ---
  Fingerprint: ({ size = 36, color = '#FFFFFF', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.9 4.04 12 4.02 14.15 4.6c.27.07.44.34.37.61-.07.27-.33.44-.61.37-1.95-.53-3.86-.5-5.69.45-1.36.7-2.5 1.7-3.4 2.97-.09.15-.24.23-.41.23zm7.98 12.87c-.12 0-.24-.04-.34-.13-.78-.71-1.37-1.46-1.74-2.25-.43-.91-.65-1.94-.65-3.05 0-2.02.8-3.84 2.2-5.13 1.39-1.28 3.23-1.99 5.17-1.99 1.15 0 2.28.25 3.34.74.25.12.36.41.24.66-.11.25-.41.36-.66.24-.96-.44-1.98-.67-3.02-.67-1.73 0-3.37.63-4.61 1.77-1.24 1.15-1.96 2.76-1.96 4.53 0 .97.19 1.87.56 2.67.33.7.85 1.36 1.54 1.99.2.18.22.49.04.69-.1.11-.23.16-.36.16z" />
    </Svg>
  ),
  ShieldCheck: ({ size = 24, color = '#7fe4a4', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <Path d="M9 12l2 2 4-4" />
    </Svg>
  ),
  ShieldAlert: ({ size = 24, color = '#e18282', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <Line x1="12" y1="8" x2="12" y2="12" />
      <Line x1="12" y1="16" x2="12.01" y2="16" />
    </Svg>
  ),
  ShieldAudit: ({ size = 24, color = '#22C55E', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </Svg>
  ),

  // --- 4. THEME & LANGUAGE ---
  Sun: ({ size = 20, color = '#FFC700', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
    </Svg>
  ),
  Moon: ({ size = 20, color = '#60A5FA', style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <Path d="M12.3 2a10 10 0 0 0-.19 14 9.92 9.92 0 0 0 7.9 3.89 10.14 10.14 0 0 0 1.9-.18A10 10 0 1 1 12.3 2z" />
    </Svg>
  ),
  Globe: ({ size = 18, color = '#111827', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Circle cx={12} cy={12} r={10} />
      <Line x1={2} y1={12} x2={22} y2={12} />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  ),

  // --- 5. FEEDBACK, ALERTS & ACTIONS ---
  Check: ({ size = 16, color = '#22C55E', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  ),
  CheckCircle: ({ size = 20, color = '#22C55E', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <Path d="M22 4L12 14.01l-3-3" />
    </Svg>
  ),
  AlertCircle: ({ size = 20, color = '#EF4444', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Circle cx={12} cy={12} r={10} />
      <Line x1={12} y1={8} x2={12} y2={12} />
      <Line x1={12} y1={16} x2={12.01} y2={16} />
    </Svg>
  ),
  WarningTriangle: ({ size = 20, color = '#FFC700', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <Line x1={12} y1={9} x2={12} y2={13} />
      <Line x1={12} y1={17} x2={12.01} y2={17} />
    </Svg>
  ),
  Close: ({ size = 18, color = '#8E8E93', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  ),
  Refresh: ({ size = 18, color = '#2563EB', style }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Path d="M23 4v6h-6" />
      <Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </Svg>
  ),
};
