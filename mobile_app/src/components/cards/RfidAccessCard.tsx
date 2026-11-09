import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDevice } from '../../context/DeviceContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { AppIcons } from '../common/AppIcons';
import { radius, spacing, elevationStyles } from '@repo/design-tokens';

export const RfidAccessCard: React.FC = () => {
  const { lastAccessEvent, isSecurityAlert } = useDevice();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  const hasEvent = !!lastAccessEvent;
  const isGranted = hasEvent && lastAccessEvent.result === 'GRANTED';
  const isDenied = hasEvent && lastAccessEvent.result === 'DENIED';

  const iconBg = isDenied
    ? 'rgba(239, 68, 68, 0.15)'
    : isGranted
      ? 'rgba(34, 197, 94, 0.15)'
      : isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.04)';

  const iconColor = isDenied ? '#EF4444' : isGranted ? '#22C55E' : theme.textSecondary;

  const pillBg = isDenied
    ? 'rgba(239, 68, 68, 0.15)'
    : isGranted
      ? 'rgba(34, 197, 94, 0.15)'
      : isDarkMode
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.05)';

  const pillColor = isDenied ? '#EF4444' : isGranted ? '#22C55E' : theme.textSecondary;

  return (
    <View
      style={[
        styles.card,
        isDarkMode ? elevationStyles.cardActiveDark : elevationStyles.cardLight,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: isSecurityAlert
            ? '#EF4444'
            : isDarkMode
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.05)',
          borderWidth: isSecurityAlert ? 2 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <AppIcons.RfidCard size={26} color={iconColor} />
        </View>

        <View style={styles.actionSlot}>
          <View
            style={[
              styles.uidBadge,
              {
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
              },
            ]}
          >
            <Text style={[styles.uidText, { color: theme.textSecondary }]}>
              {lastAccessEvent ? lastAccessEvent.uid : '----'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {t('devRfidTitle')}
        </Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]} numberOfLines={1}>
          RC522 (SPI GPIO 5/18/19/21)
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
            <Text style={[styles.statusText, { color: pillColor }]}>
              {isDenied
                ? t('rfidDenied').toUpperCase()
                : isGranted
                  ? t('rfidStatus').toUpperCase()
                  : t('rfidWaiting').toUpperCase()}
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
  uidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  uidText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
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
