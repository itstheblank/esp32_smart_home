import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

// Context Providers
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { MqttProvider, useMqtt } from './context/MqttContext';
import { DeviceProvider, useDevice } from './context/DeviceContext';
import { LogProvider, useAppLogs } from './context/LogContext';

// Screens & Navigation
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from './screens/SplashScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ActivityLogScreen } from './screens/ActivityLogScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AppHeader } from './components/navigation/AppHeader';
import { FloatingDockBar, TabType } from './components/navigation/FloatingDockBar';
import { InAppNotificationToast } from './components/common/InAppNotificationToast';

const STORAGE_UNLOCKED_KEY = 'APP_IS_UNLOCKED';
const STORAGE_TAB_KEY = 'APP_CURRENT_TAB';

interface ToastState {
  visible: boolean;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

function MainApp() {
  // Synchronous web hydration to prevent Splash Screen flashing on refresh
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_UNLOCKED_KEY) === 'true';
    }
    return false;
  });

  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const savedTab = window.localStorage.getItem(STORAGE_TAB_KEY);
      if (savedTab === 'home' || savedTab === 'events' || savedTab === 'settings') {
        return savedTab as TabType;
      }
    }
    return 'home';
  });

  const { isDarkMode, theme } = useTheme();
  const { isConnected } = useMqtt();
  const { isSecurityAlert, lastAccessEvent, esp32Online, doorFsm } = useDevice();
  const { appendLog } = useAppLogs();
  const { t } = useI18n();

  // Async restore for Native and Web fallback
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_UNLOCKED_KEY)
      .then((saved) => {
        if (saved !== null) {
          setIsUnlocked(saved === 'true');
        }
      })
      .catch(() => {});

    AsyncStorage.getItem(STORAGE_TAB_KEY)
      .then((savedTab) => {
        if (savedTab === 'home' || savedTab === 'events' || savedTab === 'settings') {
          setCurrentTab(savedTab as TabType);
        }
      })
      .catch(() => {});
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    AsyncStorage.setItem(STORAGE_UNLOCKED_KEY, 'true').catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_UNLOCKED_KEY, 'true');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    AsyncStorage.setItem(STORAGE_UNLOCKED_KEY, 'false').catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_UNLOCKED_KEY, 'false');
    }
  };

  const handleSelectTab = (tab: TabType) => {
    setCurrentTab(tab);
    AsyncStorage.setItem(STORAGE_TAB_KEY, tab).catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_TAB_KEY, tab);
    }
  };

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'info',
    title: '',
    description: '',
  });

  const lastDeniedAlertRef = useRef(false);
  const lastDoorJammedRef = useRef(false);
  const lastLwtOfflineRef = useRef(false);

  // Watch for security alerts (RFID Denied) on transition
  useEffect(() => {
    if (isSecurityAlert && lastAccessEvent && lastAccessEvent.result === 'DENIED') {
      if (!lastDeniedAlertRef.current) {
        lastDeniedAlertRef.current = true;
        setToast({
          visible: true,
          type: 'error',
          title: t('notifPopupDeniedTitle'),
          description: t('notifPopupDeniedDesc', { uid: lastAccessEvent.uid }),
        });
        appendLog(
          'SECURITY',
          'ERROR',
          'LOG_RFID_SCAN',
          { uid: lastAccessEvent.uid, res: 'DENIED' },
          'smarthome/event/access'
        );
      }
    } else if (!isSecurityAlert) {
      lastDeniedAlertRef.current = false;
    }
  }, [isSecurityAlert, lastAccessEvent, t, appendLog]);

  // Watch for Door Jam on transition
  useEffect(() => {
    if (doorFsm === 'JAMMED') {
      if (!lastDoorJammedRef.current) {
        lastDoorJammedRef.current = true;
        setToast({
          visible: true,
          type: 'error',
          title: t('notifPopupDoorJamTitle'),
          description: t('notifPopupDoorJamDesc'),
        });
        appendLog('DOOR', 'ERROR', 'LOG_DOOR_SERVO_JAM');
      }
    } else {
      lastDoorJammedRef.current = false;
    }
  }, [doorFsm, t, appendLog]);

  // Watch for ESP32 LWT Offline on transition
  useEffect(() => {
    if (isConnected && !esp32Online) {
      if (!lastLwtOfflineRef.current) {
        lastLwtOfflineRef.current = true;
        setToast({
          visible: true,
          type: 'warning',
          title: t('notifPopupLwtTitle'),
          description: t('notifPopupLwtDesc'),
        });
        appendLog('SYSTEM', 'WARN', 'LOG_ESP_OFFLINE');
      }
    } else {
      lastLwtOfflineRef.current = false;
    }
  }, [isConnected, esp32Online, t, appendLog]);

  if (!isUnlocked) {
    return <SplashScreen onUnlock={handleUnlock} />;
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.appBackground }]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Global Header Bar: Robot Avatar, Greeting, Date, Language, Theme Mode */}
      <AppHeader onAvatarPress={handleLock} />

      {/* Main Tab Screen Content */}
      <View style={styles.screenWrapper}>
        {currentTab === 'home' && <DashboardScreen />}
        {currentTab === 'events' && <ActivityLogScreen />}
        {currentTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Floating Dock Bar */}
      <FloatingDockBar currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Top Floating Notification Toast */}
      <InAppNotificationToast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        description={toast.description}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
        onPress={() => {
          setToast((prev) => ({ ...prev, visible: false }));
          if (toast.type === 'error') {
            setCurrentTab('events');
          }
        }}
      />
    </SafeAreaView>
  );
}

export default function AppRoot() {
  // Load Plus Jakarta Sans (matching prototype.html lines 11 & 85)
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Inject Google Font link and global font-family rule on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontLinkId = 'plus-jakarta-sans-google-font';
      if (!document.getElementById(fontLinkId)) {
        const link = document.createElement('link');
        link.id = fontLinkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
        document.head.appendChild(link);
      }

      const styleId = 'plus-jakarta-sans-global-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          * {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <MqttProvider autoConnect={true}>
            <DeviceProvider>
              <LogProvider>
                <MainApp />
              </LogProvider>
            </DeviceProvider>
          </MqttProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
});
