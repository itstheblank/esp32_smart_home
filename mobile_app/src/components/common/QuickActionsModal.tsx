import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useDevice } from '../../context/DeviceContext';
import { useMqttCommand } from '../../hooks/useMqttCommand';
import { useMqtt } from '../../context/MqttContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { AppIcons } from './AppIcons';
import { radius, spacing } from '@repo/design-tokens';

interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ visible, onClose }) => {
  const { resolveSecurityAlert } = useDevice();
  const { sendLightCommand, sendDoorCommand } = useMqttCommand();
  const { brokerConfig, isConnected } = useMqtt();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  const handleArmAll = () => {
    sendDoorCommand('CLOSE');
    onClose();
  };

  const handleLightsOff = () => {
    sendLightCommand('OFF');
    onClose();
  };

  const handleClearAlert = () => {
    resolveSecurityAlert();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surfaceCard,
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {t('quickActionsTitle')}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <AppIcons.Close size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsList}>
                {/* Action 1: Arm All / Lock Door */}
                <TouchableOpacity
                  style={[
                    styles.actionItem,
                    { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                  ]}
                  onPress={handleArmAll}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <AppIcons.LockClosed size={20} color={theme.textPrimary} />
                  </View>
                  <View style={styles.actionTextCol}>
                    <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>
                      {t('quickActionArmAll')}
                    </Text>
                    <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>
                      SG90 Servo ngậm chốt an toàn
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action 2: Turn off all lights */}
                <TouchableOpacity
                  style={[
                    styles.actionItem,
                    { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                  ]}
                  onPress={handleLightsOff}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <AppIcons.LightbulbOff size={20} color={theme.textPrimary} />
                  </View>
                  <View style={styles.actionTextCol}>
                    <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>
                      {t('quickActionLightsOff')}
                    </Text>
                    <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>
                      Tắt Relay GPIO 2 tiết kiệm điện
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action 3: Clear Security Alert */}
                <TouchableOpacity
                  style={[
                    styles.actionItem,
                    { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                  ]}
                  onPress={handleClearAlert}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <AppIcons.ShieldCheck size={20} color={theme.textPrimary} />
                  </View>
                  <View style={styles.actionTextCol}>
                    <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>
                      {t('quickActionClearAlert')}
                    </Text>
                    <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>
                      Đặt lại cảnh báo thẻ lạ về 100%
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Diagnostics summary */}
                <View
                  style={[
                    styles.diagnosticsBox,
                    {
                      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : '#F3F4F6',
                    },
                  ]}
                >
                  <Text style={[styles.diagTitle, { color: theme.textSecondary }]}>
                    {t('quickActionDiagnostics')}
                  </Text>
                  <Text style={[styles.diagLine, { color: theme.textPrimary }]}>
                    Broker: {brokerConfig.host}:{brokerConfig.port} (
                    {isConnected ? 'CONNECTED' : 'OFFLINE'})
                  </Text>
                  <Text style={[styles.diagLine, { color: theme.textPrimary }]}>
                    QoS: 0 (At most once) • LWT Topic: smarthome/state/online
                  </Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  actionsList: {
    gap: spacing.sm + 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextCol: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  diagnosticsBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  diagTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  diagLine: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
