import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { RobotAvatar } from '../common/RobotAvatar';
import { LanguageToggle } from '../common/LanguageToggle';
import { ModeToggle } from '../common/ModeToggle';
import { spacing } from '@repo/design-tokens';

interface AppHeaderProps {
  onAvatarPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onAvatarPress }) => {
  const { theme } = useAppTheme();
  const { t, currentLang } = useI18n();

  // Dynamic Date string matching Figma: "Friday, Nov 6" or "Thứ Sáu, 6 Th11"
  const formattedDate = useMemo(() => {
    const now = new Date();
    try {
      if (currentLang === 'en') {
        const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
        const month = now.toLocaleDateString('en-US', { month: 'short' });
        const day = now.getDate();
        return `${weekday}, ${month} ${day}`;
      } else {
        const weekday = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        const day = now.getDate();
        const month = now.getMonth() + 1;
        // Capitalize first letter (e.g., Thứ Sáu)
        const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        return `${capWeekday}, ${day} Th${month}`;
      }
    } catch {
      return currentLang === 'en' ? 'Friday, Nov 6' : 'Thứ Sáu, 6 Th11';
    }
  }, [currentLang]);

  return (
    <View style={styles.headerContainer}>
      {/* Left: Robot Avatar + Greeting & Date */}
      <View style={styles.userGreetingBox}>
        <RobotAvatar size={44} onPress={onAvatarPress} />

        <View style={styles.textColumn}>
          <Text style={[styles.greetingText, { color: theme.textPrimary }]}>{t('greeting')}</Text>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>{formattedDate}</Text>
        </View>
      </View>

      {/* Right: Controls (Language Pill & Mode Toggle) */}
      <View style={styles.headerActions}>
        <LanguageToggle />
        <ModeToggle size={38} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  userGreetingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textColumn: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
