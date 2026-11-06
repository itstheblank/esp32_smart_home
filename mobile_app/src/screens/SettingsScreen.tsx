import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMqtt } from '../context/MqttContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { AppIcons } from '../components/common/AppIcons';
import { LiveStatusDot } from '../components/common/LiveStatusDot';
import { radius, spacing } from '@repo/design-tokens';

const STORAGE_NOTIF_PREFIX = 'SMARTHOME_NOTIF_CFG_';
const STORAGE_GUIDE_KEY = 'esp32_guide_dismissed';

export const SettingsScreen: React.FC = () => {
  const { brokerConfig, isConnected, connect, disconnect } = useMqtt();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  // Broker form state
  const [host, setHost] = useState(brokerConfig.host);
  const [port, setPort] = useState(String(brokerConfig.port));
  const [path, setPath] = useState(brokerConfig.path);
  const [showGuide, setShowGuide] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_GUIDE_KEY) !== 'true';
    }
    return true;
  });

  // Keep form fields synced if brokerConfig changes externally
  useEffect(() => {
    setHost(brokerConfig.host);
    setPort(String(brokerConfig.port));
    setPath(brokerConfig.path);
  }, [brokerConfig.host, brokerConfig.port, brokerConfig.path]);

  // Notification toggles state (8 options)
  const [notifCfg, setNotifCfg] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(`${STORAGE_NOTIF_PREFIX}STATE`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (_) {}
      }
    }
    return {
      doorToggle: true,
      lightToggle: true,
      securityAck: true,
      brokerStatus: true,
      deniedAlert: true,
      doorOpen: true,
      motionAlert: true,
      lwtAlert: true,
    };
  });

  useEffect(() => {
    AsyncStorage.getItem(`${STORAGE_NOTIF_PREFIX}STATE`).then((data) => {
      if (data) {
        try {
          setNotifCfg(JSON.parse(data));
        } catch (_) {}
      }
    });

    AsyncStorage.getItem(STORAGE_GUIDE_KEY).then((data) => {
      if (data === 'true') {
        setShowGuide(false);
      }
    });
  }, []);

  const toggleNotif = (key: keyof typeof notifCfg) => {
    setNotifCfg((prev: any) => {
      const updated = { ...prev, [key]: !prev[key] };
      const str = JSON.stringify(updated);
      AsyncStorage.setItem(`${STORAGE_NOTIF_PREFIX}STATE`, str).catch(() => {});
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`${STORAGE_NOTIF_PREFIX}STATE`, str);
      }
      return updated;
    });
  };

  const handleToggleGuide = (visible: boolean) => {
    setShowGuide(visible);
    const dismissed = (!visible).toString();
    AsyncStorage.setItem(STORAGE_GUIDE_KEY, dismissed).catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_GUIDE_KEY, dismissed);
    }
  };

  const handleSaveAndConnect = () => {
    const parsedPort = parseInt(port, 10) || 8083;
    connect(host.trim(), parsedPort, path.trim());
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {t('settingsTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('settingsSubtitle')}
          </Text>
        </View>

        {/* Section 1: EMQX MQTT Broker Configuration */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surfaceCard,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              <AppIcons.Settings size={20} color={theme.textPrimary} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {t('cfgHeader')}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <LiveStatusDot status={isConnected ? 'online' : 'offline'} size={8} />
              <Text style={[styles.statusPillText, { color: isConnected ? '#6ae6bd' : '#f58f8f' }]}>
                {isConnected ? t('statusOnline') : t('statusOffline')}
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              {t('cfgHostLabel')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : '#F9FAFB',
                  color: theme.textPrimary,
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
                },
              ]}
              value={host}
              onChangeText={setHost}
              placeholder="e.g. 192.168.1.15"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.rowForm}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                {t('cfgPortLabel')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : '#F9FAFB',
                    color: theme.textPrimary,
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
                  },
                ]}
                value={port}
                onChangeText={setPort}
                keyboardType="numeric"
                placeholder="8083"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                {t('cfgPathLabel')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : '#F9FAFB',
                    color: theme.textPrimary,
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
                  },
                ]}
                value={path}
                onChangeText={setPath}
                placeholder="/mqtt"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  flex: 2,
                  backgroundColor: isDarkMode ? '#FFFFFF' : '#111216',
                  borderColor: isDarkMode ? '#FFFFFF' : '#111216',
                },
              ]}
              onPress={handleSaveAndConnect}
              activeOpacity={0.8}
            >
              <AppIcons.Refresh size={16} color={isDarkMode ? '#111216' : '#FFFFFF'} />
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: isDarkMode ? '#111216' : '#FFFFFF' },
                ]}
              >
                {t('btnSaveConnect')}
              </Text>
            </TouchableOpacity>

            {isConnected && (
              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  {
                    flex: 1,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                  },
                ]}
                onPress={disconnect}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.secondaryBtnText,
                    { color: isDarkMode ? '#FFFFFF' : '#111216' },
                  ]}
                >
                  {t('btnDisconnect')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section 2: Setup Guide */}
        {showGuide ? (
          <View
            style={[
              styles.guideCard,
              {
                backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                borderColor: 'rgba(37, 99, 235, 0.25)',
              },
            ]}
          >
            <Text style={styles.guideTitle}>{t('guideTitle')}</Text>
            <Text style={[styles.guideBody, { color: theme.textPrimary }]}>
              {t('guideBody')}
            </Text>
            <TouchableOpacity
              style={styles.guideGotItBtn}
              onPress={() => handleToggleGuide(false)}
            >
              <Text style={styles.guideGotItText}>{t('btnGuideGotItText')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.restoreGuideBtn}
            onPress={() => handleToggleGuide(true)}
          >
            <Text style={styles.restoreGuideText}>{t('btnRestoreGuide')}</Text>
          </TouchableOpacity>
        )}

        {/* Section 3: Notification Strategy (8 Options) */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surfaceCard,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: spacing.md }]}>
            {t('notifHeader')}
          </Text>

          {/* Group 1: Controls */}
          <Text style={[styles.groupSubtitle, { color: theme.textSecondary }]}>
            {t('notifSubGroupControls')}
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                {t('notifDoorToggleTitle')}
              </Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                {t('notifDoorToggleSub')}
              </Text>
            </View>
            <Switch
              value={notifCfg.doorToggle}
              onValueChange={() => toggleNotif('doorToggle')}
              thumbColor={notifCfg.doorToggle ? '#2563EB' : '#9CA3AF'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                {t('notifLightToggleTitle')}
              </Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                {t('notifLightToggleSub')}
              </Text>
            </View>
            <Switch
              value={notifCfg.lightToggle}
              onValueChange={() => toggleNotif('lightToggle')}
              thumbColor={notifCfg.lightToggle ? '#2563EB' : '#9CA3AF'}
            />
          </View>

          {/* Group 2: Security & Network */}
          <Text style={[styles.groupSubtitle, { color: theme.textSecondary, marginTop: spacing.md }]}>
            {t('notifSubGroupSecurity')}
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                {t('notifDeniedTitle')}
              </Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                {t('notifDeniedSub')}
              </Text>
            </View>
            <Switch
              value={notifCfg.deniedAlert}
              onValueChange={() => toggleNotif('deniedAlert')}
              thumbColor={notifCfg.deniedAlert ? '#EF4444' : '#9CA3AF'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                {t('notifLwtTitle')}
              </Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                {t('notifLwtSub')}
              </Text>
            </View>
            <Switch
              value={notifCfg.lwtAlert}
              onValueChange={() => toggleNotif('lwtAlert')}
              thumbColor={notifCfg.lwtAlert ? '#EF4444' : '#9CA3AF'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                {t('notifMotionTitle')}
              </Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                {t('notifMotionSub')}
              </Text>
            </View>
            <Switch
              value={notifCfg.motionAlert}
              onValueChange={() => toggleNotif('motionAlert')}
              thumbColor={notifCfg.motionAlert ? '#F97316' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Section 4: Authorized RFID Whitelist */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surfaceCard,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('whitelistHeader')}
          </Text>
          <Text style={[styles.toggleSub, { color: theme.textSecondary, marginBottom: spacing.md }]}>
            {t('whitelistDesc')}
          </Text>

          <View style={styles.whitelistItem}>
            <AppIcons.RfidCard size={20} color="#ccd0ce" />
            <View style={styles.whitelistInfo}>
              <Text style={[styles.whitelistLabel, { color: theme.textPrimary }]}>
                {t('wlMasterLabel')}
              </Text>
              <Text style={styles.whitelistUid}>F3 44 2E 12 (Admin Root)</Text>
            </View>
          </View>

          <View style={styles.whitelistItem}>
            <AppIcons.RfidCard size={20} color="#919294" />
            <View style={styles.whitelistInfo}>
              <Text style={[styles.whitelistLabel, { color: theme.textPrimary }]}>
                {t('wlMemberLabel')}
              </Text>
              <Text style={styles.whitelistUid}>A1 B2 C3 D4 (Family Member)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 110,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: spacing.md,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  formGroup: {
    marginBottom: spacing.sm,
  },
  rowForm: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  guideCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  guideBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  guideGotItBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  guideGotItText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  restoreGuideBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  restoreGuideText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  groupSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  whitelistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  whitelistInfo: {
    flex: 1,
  },
  whitelistLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  whitelistUid: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#10B981',
    marginTop: 1,
  },
});

