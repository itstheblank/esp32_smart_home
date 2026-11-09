import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDevice } from '../../context/DeviceContext';
import { useMqttCommand } from '../../hooks/useMqttCommand';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { AppIcons } from '../common/AppIcons';
import { radius, spacing, elevationStyles } from '@repo/design-tokens';

export const DoorSecurityCard: React.FC = () => {
  const { doorFsm, canSendCommands, resetDoorJam } = useDevice();
  const { sendDoorCommand } = useMqttCommand();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  const isPending = doorFsm === 'PENDING_OPEN' || doorFsm === 'PENDING_CLOSE';
  const isOpen = doorFsm === 'OPEN' || doorFsm === 'PENDING_CLOSE';
  const isJammed = doorFsm === 'JAMMED';

  const handleToggle = () => {
    if (!canSendCommands || isPending) return;
    if (isJammed) {
      resetDoorJam();
      return;
    }
    const nextCmd = isOpen ? 'CLOSE' : 'OPEN';
    sendDoorCommand(nextCmd);
  };

  const cardBorder = isJammed
    ? '#EF4444'
    : isDarkMode
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.05)';

  const iconBg = isJammed
    ? 'rgba(239, 68, 68, 0.15)'
    : isOpen
      ? 'rgba(37, 99, 235, 0.15)'
      : isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.04)';

  const pillBg = isJammed
    ? 'rgba(239, 68, 68, 0.15)'
    : isOpen
      ? 'rgba(37, 99, 235, 0.12)'
      : isDarkMode
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.05)';

  const pillText = isJammed ? '#EF4444' : isOpen ? '#2563EB' : theme.textSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleToggle}
      disabled={!canSendCommands || isPending}
      style={[
        styles.card,
        isDarkMode ? elevationStyles.cardActiveDark : elevationStyles.cardLight,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: cardBorder,
          borderWidth: isJammed ? 2 : 1,
          opacity: canSendCommands ? 1 : 0.6,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          {isJammed ? (
            <AppIcons.AlertCircle size={26} color="#EF4444" />
          ) : isOpen ? (
            <AppIcons.DoorOpen size={26} color="#2563EB" />
          ) : (
            <AppIcons.DoorClosed size={26} color={theme.textSecondary} />
          )}
        </View>

        <View style={styles.actionSlot}>
          {isPending ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : isJammed ? (
            <TouchableOpacity style={styles.jamResetBtn} onPress={resetDoorJam} activeOpacity={0.8}>
              <Text style={styles.jamResetText}>Reset</Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.lockBadge,
                { backgroundColor: isOpen ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)' },
              ]}
            >
              {isOpen ? (
                <AppIcons.LockOpen size={18} color="#2563EB" />
              ) : (
                <AppIcons.LockClosed size={18} color="#10B981" />
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {t('devDoorTitle')}
        </Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]} numberOfLines={1}>
          {t('devDoorSub')}
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
            <Text style={[styles.statusText, { color: pillText }]}>
              {isPending
                ? '...'
                : isJammed
                  ? t('doorJammed').toUpperCase()
                  : isOpen
                    ? t('open').toUpperCase()
                    : t('closed').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jamResetBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  jamResetText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
