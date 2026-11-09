import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useDevice } from '../../context/DeviceContext';
import { useMqttCommand } from '../../hooks/useMqttCommand';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { AppIcons } from '../common/AppIcons';
import { radius, spacing, elevationStyles } from '@repo/design-tokens';

export const LightControlCard: React.FC = () => {
  const { lightFsm, canSendCommands } = useDevice();
  const { sendLightCommand } = useMqttCommand();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  const isPending = lightFsm === 'PENDING_ON' || lightFsm === 'PENDING_OFF';
  const isOn = lightFsm === 'ON' || lightFsm === 'PENDING_OFF';

  const handleToggle = () => {
    if (!canSendCommands || isPending) return;
    const nextState = isOn ? 'OFF' : 'ON';
    sendLightCommand(nextState);
  };

  // Card theme styling
  const cardBg = isOn ? (isDarkMode ? '#090D16' : '#111216') : theme.surfaceCard;

  const cardBorder = isOn
    ? isDarkMode
      ? 'rgba(251, 191, 36, 0.4)'
      : 'transparent'
    : isDarkMode
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.05)';

  const primaryTextColor = isOn ? '#FFFFFF' : theme.textPrimary;
  const secondaryTextColor = isOn ? '#9CA3AF' : theme.textSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleToggle}
      disabled={!canSendCommands || isPending}
      style={[
        styles.card,
        isDarkMode ? elevationStyles.cardActiveDark : elevationStyles.cardLight,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          opacity: canSendCommands ? 1 : 0.6,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isOn
                ? 'rgba(251, 191, 36, 0.2)'
                : isDarkMode
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
        >
          {isOn ? (
            <AppIcons.LightbulbOn size={26} color="#FFC700" />
          ) : (
            <AppIcons.LightbulbOff size={26} color="#9CA3AF" />
          )}
        </View>

        {/* Switch / Spinner */}
        <View style={styles.actionSlot}>
          {isPending ? (
            <ActivityIndicator size="small" color={isOn ? '#FFC700' : theme.textPrimary} />
          ) : (
            <View
              style={[
                styles.switchTrack,
                {
                  backgroundColor: isOn ? '#FFFFFF' : isDarkMode ? '#334155' : '#D1D5DB',
                },
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  {
                    backgroundColor: isOn ? '#111216' : '#FFFFFF',
                    alignSelf: isOn ? 'flex-end' : 'flex-start',
                  },
                ]}
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.cardTitle, { color: primaryTextColor }]} numberOfLines={1}>
          {t('devLightTitle')}
        </Text>
        <Text style={[styles.cardSub, { color: secondaryTextColor }]} numberOfLines={1}>
          {t('devLightSub')}
        </Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isOn
                  ? 'rgba(251, 191, 36, 0.2)'
                  : isDarkMode
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <Text style={[styles.statusText, { color: isOn ? '#FBBF24' : secondaryTextColor }]}>
              {isPending ? '...' : isOn ? t('on').toUpperCase() : t('off').toUpperCase()}
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
    borderWidth: 1,
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
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: radius.full,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
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
