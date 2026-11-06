import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { AppIcons } from '../common/AppIcons';
import { SafeShield } from './SafeShield';
import { QuickActionsModal } from '../common/QuickActionsModal';
import { componentTokens } from '@repo/design-tokens';

export type TabType = 'home' | 'events' | 'settings';

interface FloatingDockBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

/**
 * FloatingDockBar Component
 * Fully responsive bottom dock navigation with 100% equal spacing distribution.
 * Constrained with maxWidth for tablet/desktop viewports and fluid 25% flex slots.
 */
export const FloatingDockBar: React.FC<FloatingDockBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { isDarkMode } = useTheme();
  const { t } = useI18n();
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  const activeColor = isDarkMode ? '#FFFFFF' : '#111216';
  const inactiveColor = isDarkMode ? '#94A3B8' : '#8E8E93';

  return (
    <>
      <View style={styles.dockWrapper} pointerEvents="box-none">
        <View
          style={[
            styles.dockContainer,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.06)',
              shadowOpacity: isDarkMode ? 0.45 : 0.08,
            },
          ]}
        >
          {/* Slot 1: Home Tab (25% equal width) */}
          <View style={styles.tabSlot}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => onSelectTab('home')}
              activeOpacity={0.7}
            >
              {currentTab === 'home' ? (
                <AppIcons.Home size={22} color={activeColor} />
              ) : (
                <AppIcons.HomeOutline size={22} color={inactiveColor} />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: currentTab === 'home' ? activeColor : inactiveColor },
                ]}
                numberOfLines={1}
              >
                {t('navHome')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Slot 2: Events Tab (25% equal width) */}
          <View style={styles.tabSlot}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => onSelectTab('events')}
              activeOpacity={0.7}
            >
              {currentTab === 'events' ? (
                <AppIcons.Events size={22} color={activeColor} />
              ) : (
                <AppIcons.EventsOutline size={22} color={inactiveColor} />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: currentTab === 'events' ? activeColor : inactiveColor },
                ]}
                numberOfLines={1}
              >
                {t('navEvents')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Slot 3: Quick Actions FAB (+) (25% equal width, perfectly centered) */}
          <View style={styles.tabSlot}>
            <TouchableOpacity
              style={[
                styles.fabButton,
                {
                  backgroundColor: isDarkMode ? '#FFFFFF' : '#111216',
                },
              ]}
              onPress={() => setQuickActionsVisible(true)}
              activeOpacity={0.85}
            >
              <AppIcons.Plus size={24} color={isDarkMode ? '#111216' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          {/* Slot 4: Settings Tab (25% equal width) */}
          <View style={styles.tabSlot}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => onSelectTab('settings')}
              activeOpacity={0.7}
            >
              {currentTab === 'settings' ? (
                <AppIcons.Settings size={22} color={activeColor} />
              ) : (
                <AppIcons.SettingsOutline size={22} color={inactiveColor} />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: currentTab === 'settings' ? activeColor : inactiveColor },
                ]}
                numberOfLines={1}
              >
                {t('navSettings')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sole SSOT Safe Shield */}
        <SafeShield />
      </View>

      <QuickActionsModal
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center', // Centers dock horizontally on all viewport widths
    zIndex: 90,
  },
  dockContainer: {
    width: '92%',
    maxWidth: 420, // Prevents over-stretching on tablets and desktop windows
    marginBottom: 22,
    height: componentTokens.dock.height || 68,
    borderRadius: 36, // var(--radius-dock)
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    // Soft drop shadow matching prototype: box-shadow: var(--shadow-dock)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 8,
  },
  tabSlot: {
    flex: 1, // Exactly 25% equal distribution across all 4 items
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  fabButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});
