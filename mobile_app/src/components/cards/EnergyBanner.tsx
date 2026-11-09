import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDevice } from '../../context/DeviceContext';
import { useMqtt } from '../../context/MqttContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { AppIcons } from '../common/AppIcons';
import { radius, spacing } from '@repo/design-tokens';

export interface EnergyBannerProps {
  percent?: string;
}

/**
 * EnergyBanner Component
 * 100% Pixel-perfect implementation based on prototype.html (.energy-card lines 420-462 & 1547-1560)
 */
export const EnergyBanner: React.FC<EnergyBannerProps> = ({ percent = '+35%' }) => {
  const { esp32Online } = useDevice();
  const { isConnected } = useMqtt();
  const { theme, isDarkMode } = useTheme();
  const { t, currentLang } = useI18n();

  // Status mapping matching prototype logic:
  // if (!isBrokerConnected) espUnknown
  // else espState === 'ONLINE' ? espOnline : espOffline
  const isHealthy = isConnected && esp32Online;

  const getStatusBadge = () => {
    if (!isConnected) return currentLang === 'vi' ? 'KHÔNG RÕ' : 'UNKNOWN';
    if (esp32Online) return 'ONLINE';
    return 'OFFLINE';
  };

  const getStatusSuffix = () => {
    if (!isConnected) return currentLang === 'vi' ? '(Mất Broker)' : '(Broker Down)';
    if (esp32Online) return '(LWT OK)';
    return currentLang === 'vi' ? '(Mất kết nối)' : '(Disconnected)';
  };

  const statusColor = isHealthy
    ? isDarkMode
      ? '#4ADE80'
      : '#22C55E'
    : isDarkMode
      ? '#F87171'
      : '#EF4444';

  const energyGreen = isDarkMode ? '#4ADE80' : '#22C55E';
  const yellowLight = isDarkMode ? '#FACC15' : '#FFC700';

  return (
    <View
      style={[
        styles.energyCard,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          shadowOpacity: isDarkMode ? 0.35 : 0.05,
        },
      ]}
    >
      <View style={styles.energyInfo}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('energyTitle')}</Text>
        <Text style={[styles.value, { color: energyGreen }]}>{percent}</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>
          ESP32:{' '}
          <Text style={[styles.statusHighlight, { color: statusColor }]}>{getStatusBadge()}</Text>{' '}
          {getStatusSuffix()}
        </Text>
      </View>

      <View style={styles.energyIconWrap}>
        <AppIcons.FlashEnergy size={28} color={yellowLight} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  energyCard: {
    borderRadius: radius.xl, // 24px (SSOT var(--radius-card))
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: spacing.lg,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Shadow matching prototype: box-shadow: var(--shadow-card)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 3,
  },
  energyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 2,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusHighlight: {
    fontWeight: '700',
  },
  energyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 199, 0, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
});
