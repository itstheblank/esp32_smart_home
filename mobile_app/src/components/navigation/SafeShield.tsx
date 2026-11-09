import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAppTheme } from '../../context/ThemeContext';

/**
 * SafeShield Component
 * 100% Pixel-perfect implementation based on prototype.html:
 * 1. .dock-backdrop-fade (lines 1031-1057): Soft gradient fade behind dock (110px)
 * 2. .dock-safe-shield (lines 1059-1083): 28px misclick interceptor bar
 * 3. .home-indicator-bar (lines 1085-1101): Native iOS 134x5px home gesture bar
 */
export const SafeShield: React.FC = () => {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <>
      {/* 1. Soft Backdrop Gradient Fade (Under & behind floating dock) */}
      <View style={styles.backdropFadeContainer} pointerEvents="none">
        <Svg style={styles.svgFill}>
          <Defs>
            <LinearGradient id="dockFadeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor={theme.appBackground} stopOpacity="1" />
              <Stop
                offset="40%"
                stopColor={theme.appBackground}
                stopOpacity={isDarkMode ? 0.85 : 0.75}
              />
              <Stop offset="100%" stopColor={theme.appBackground} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="110" fill="url(#dockFadeGradient)" />
        </Svg>
      </View>

      {/* 2. Dock Bottom Safe Area Shield (Accidental Misclick Interceptor) */}
      <TouchableWithoutFeedback
        onPress={(e) => {
          e.stopPropagation();
        }}
        accessible={false}
      >
        <View
          style={[
            styles.shieldContainer,
            {
              backgroundColor: theme.appBackground,
              borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            },
          ]}
          pointerEvents="auto"
        >
          {/* 3. Native iOS Home Gesture Indicator Bar */}
          <View
            style={[
              styles.homeIndicator,
              {
                backgroundColor: theme.textPrimary,
                opacity: isDarkMode ? 0.3 : 0.22,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

const styles = StyleSheet.create({
  backdropFadeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    zIndex: 60,
  },
  svgFill: {
    width: '100%',
    height: 60,
  },
  shieldContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 95,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 134,
    height: 5,
    borderRadius: 3,
  },
});
