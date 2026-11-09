import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDevice } from '../../context/DeviceContext';
import { useMqtt } from '../../context/MqttContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { useAppLogs } from '../../context/LogContext';
import { AppIcons } from '../common/AppIcons';
import { LiveStatusDot, StatusDotVariant } from '../common/LiveStatusDot';
import { radius, spacing } from '@repo/design-tokens';

/**
 * SystemAuditCard (Event Summary / Audit Hero Banner)
 * 100% aligned with prototype.html (.event-summary-card lines 662-761 & 1718-1791)
 * Displays live metric status, live pulse dot, and dynamic recovery actions.
 */
export const SystemAuditCard: React.FC = () => {
  const { esp32Online, isSecurityAlert, resolveSecurityAlert } = useDevice();
  const { isConnected, reconnect } = useMqtt();
  const { logs } = useAppLogs();
  const { theme, isDarkMode } = useTheme();
  const { t, currentLang } = useI18n();

  // Dual-Layer State Machine matching prototype lines 3698-3780
  const isBrokerDown = !isConnected;
  const isEspOffline = isConnected && !esp32Online;
  const isBreached = isConnected && isSecurityAlert;

  let statusTitle = '';
  let statusColor = '';
  let subtitleText = '';
  let iconBg = '';
  let dotVariant: StatusDotVariant = 'ONLINE';
  let showAck = false;
  let showRetry = false;
  let showBrokerReconnect = false;

  if (isBrokerDown) {
    statusTitle = t('auditBrokerDisconnected');
    statusColor = theme.textSecondary;
    subtitleText = t('auditBrokerDisconnectedSub');
    iconBg = isDarkMode ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.12)';
    dotVariant = 'DISCONNECTED';
    showBrokerReconnect = true;
  } else if (isEspOffline) {
    statusTitle = currentLang === 'vi' ? 'Cảnh Báo Ngoại Tuyến' : 'Hardware Offline';
    statusColor = isDarkMode ? '#F87171' : '#EF4444';
    subtitleText =
      currentLang === 'vi'
        ? 'ESP32 mất kết nối • Cần kiểm tra Gateway'
        : 'ESP32 disconnected • Check Gateway';
    iconBg = isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.12)';
    dotVariant = 'ALERT';
    showRetry = true;
  } else if (isBreached) {
    statusTitle = currentLang === 'vi' ? 'Cảnh Báo An Ninh' : 'Security Alert';
    statusColor = isDarkMode ? '#F87171' : '#EF4444';
    subtitleText =
      currentLang === 'vi'
        ? 'Phát hiện thẻ lạ / Vi phạm an ninh'
        : 'Unauthorized card access attempt';
    iconBg = isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.12)';
    dotVariant = 'ALERT';
    showAck = true;
  } else {
    statusTitle = t('auditStatus');
    statusColor = isDarkMode ? '#4ADE80' : '#22C55E';
    subtitleText = t('eventSummarySub', { count: logs.length });
    iconBg = isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)';
    dotVariant = 'ONLINE';
  }

  return (
    <View
      style={[
        styles.eventSummaryCard,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          shadowOpacity: isDarkMode ? 0.35 : 0.04,
        },
      ]}
    >
      <View style={styles.eventSummaryInfo}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('auditLabel')}</Text>

        <View style={styles.valueRow}>
          <Text style={[styles.valueText, { color: statusColor }]}>{statusTitle}</Text>
          <LiveStatusDot status={dotVariant} size={8} />
        </View>

        <Text style={[styles.subText, { color: theme.textMuted }]}>{subtitleText}</Text>

        {/* Dynamic Action Buttons matching prototype lines 705-761 */}
        {showBrokerReconnect && (
          <TouchableOpacity
            style={styles.auditReconnectBtn}
            onPress={reconnect}
            activeOpacity={0.8}
          >
            <AppIcons.Refresh size={12} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>{t('auditReconnectBrokerText')}</Text>
          </TouchableOpacity>
        )}

        {showRetry && (
          <TouchableOpacity style={styles.auditRetryBtn} onPress={reconnect} activeOpacity={0.8}>
            <AppIcons.Refresh size={12} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>{t('auditRetryText')}</Text>
          </TouchableOpacity>
        )}

        {showAck && (
          <TouchableOpacity
            style={[
              styles.auditAckBtn,
              {
                backgroundColor: isDarkMode ? '#FFFFFF' : '#111216',
                borderColor: isDarkMode ? '#FFFFFF' : '#111216',
              },
            ]}
            onPress={resolveSecurityAlert}
            activeOpacity={0.8}
          >
            <AppIcons.Check size={12} color={isDarkMode ? '#111216' : '#FFFFFF'} />
            <Text style={[styles.actionBtnText, { color: isDarkMode ? '#111216' : '#FFFFFF' }]}>
              {t('auditAckText')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.eventSummaryIconWrap, { backgroundColor: iconBg }]}>
        <AppIcons.ShieldAudit size={24} color={statusColor} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  eventSummaryCard: {
    borderRadius: radius.xl, // 24px (SSOT var(--radius-card))
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: spacing.lg,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Shadow matching prototype: box-shadow: var(--shadow-card)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 3,
  },
  eventSummaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
  },
  auditReconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: '#3B82F6', // var(--blue-door)
    alignSelf: 'flex-start',
  },
  auditRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: '#EF4444', // var(--red-alert)
    alignSelf: 'flex-start',
  },
  auditAckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  eventSummaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
});
