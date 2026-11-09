import { primitiveColors } from "./primitives";

/**
 * Component Tokens & Cross-platform Elevations
 */

export const componentTokens = {
  // Toggle Switch
  toggle: {
    trackWidth: 44,
    trackHeight: 24,
    thumbSize: 20,
    activeTrack: primitiveColors.white,
    activeThumb: primitiveColors.gray950,
    inactiveTrack: primitiveColors.gray300,
    inactiveThumb: primitiveColors.white,
  },

  // Floating Action Button (+)
  fab: {
    size: 56,
    background: primitiveColors.gray950,
    iconColor: primitiveColors.white,
  },

  // Floating Dock Bar
  dock: {
    height: 72,
    horizontalMargin: 24,
    bottomOffset: 24,
  },

  // Device Cards (2-column grid)
  card: {
    minHeight: 165,
    padding: 16,
    iconBoxSize: 40,
  },
};

/**
 * Shadows for iOS & Android
 */
export const elevationStyles = {
  cardLight: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  cardActiveDark: {
    shadowColor: "#111216",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  cardDark: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  floatingDock: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  fabButton: {
    shadowColor: "#111216",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
};
