import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDevice } from '../../context/DeviceContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { AppIcons } from '../common/AppIcons';
import { LiveStatusDot } from '../common/LiveStatusDot';
import { radius, spacing, elevationStyles } from '@repo/design-tokens';

export const MotionRadarCard: React.FC = () => {
  const { motionState } = useDevice();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  const isDetected = motionState === 'DETECTED';

  const iconBg = isDetected
    ? 'rgba(249, 115, 22, 0.15)'
    : isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';

  const pillBg = isDetected
    ? 'rgba(249, 115, 22, 0.15)'
    : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  const pillColor = isDetected ? '#F97316' : theme.textSecondary;

  return (
    <View
      style={[
        styles.card,
        isDarkMode ? elevationStyles.cardActiveDark : elevationStyles.cardLight,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: isDetected
            ? 'rgba(249, 115, 22, 0.3)'
            : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <AppIcons.MotionSensor
            size={26}
            color={isDetected ? '#F97316' : '#9CA3AF'}
          />
        </View>

        <View style={styles.actionSlot}>
          {isDetected ? (
            <LiveStatusDot status="warning" size={10} />
          ) : (
            <LiveStatusDot status="online" size={8} />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {t('devMotionTitle')}
        </Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]} numberOfLines={1}>
          HC-SR501 (GPIO 13)
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
            <Text style={[styles.statusText, { color: pillColor }]}>
              {isDetected
                ? t('motionDetected').toUpperCase()
                : t('motionClear').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 165,
    borderRadius: radius.xl,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSlot: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    marginTop: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs + 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

