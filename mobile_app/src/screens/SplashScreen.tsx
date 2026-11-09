import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { AppIcons } from '../components/common/AppIcons';
import { ModeToggle } from '../components/common/ModeToggle';
import { LanguageToggle } from '../components/common/LanguageToggle';
import { radius, spacing } from '@repo/design-tokens';

interface SplashScreenProps {
  onUnlock: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onUnlock }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  // Pulse animation for gateway auth circle
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Pure monochrome Dark/Light contrast
  const primaryMonochrome = isDarkMode ? '#FFFFFF' : '#111216';
  const oppositeMonochrome = isDarkMode ? '#111216' : '#FFFFFF';
  const secondaryMonochrome = isDarkMode ? '#94A3B8' : '#64748B';
  const subtleBorder = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const subtleBg = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.appBackground }]}>
      {/* Top Bar with Language & Mode */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <AppIcons.Microchip size={20} color={primaryMonochrome} />
          <Text style={[styles.brandText, { color: secondaryMonochrome }]}>ESP32 IoT Gateway</Text>
        </View>

        <View style={styles.topActions}>
          <LanguageToggle />
          <ModeToggle />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Security Badge */}
        <View
          style={[
            styles.badgeWrapper,
            {
              backgroundColor: subtleBg,
              borderColor: subtleBorder,
            },
          ]}
        >
          <View style={[styles.badgeDot, { backgroundColor: primaryMonochrome }]} />
          <Text style={[styles.badgeText, { color: primaryMonochrome }]}>{t('splashBadge')}</Text>
        </View>

        {/* Hero Title */}
        <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>{t('splashTitle')}</Text>
        <Text style={[styles.heroDesc, { color: theme.textSecondary }]}>{t('splashDesc')}</Text>
      </View>

      {/* Bottom Main Button */}
      <View style={styles.bottomSlot}>
        <TouchableOpacity
          style={[
            styles.enterButton,
            {
              backgroundColor: primaryMonochrome,
              borderColor: primaryMonochrome,
            },
          ]}
          onPress={onUnlock}
          activeOpacity={0.88}
        >
          <Text style={[styles.enterButtonText, { color: oppositeMonochrome }]}>
            {t('btnEnterDash')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  heroDesc: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: spacing.xl,
  },
  centerAuthSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  authCircleBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  authPromptText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  bottomSlot: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  enterButton: {
    paddingVertical: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  enterButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
