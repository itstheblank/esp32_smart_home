import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDevice } from '../context/DeviceContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { EnergyBanner } from '../components/cards/EnergyBanner';
import { LightControlCard } from '../components/cards/LightControlCard';
import { DoorSecurityCard } from '../components/cards/DoorSecurityCard';
import { MotionRadarCard } from '../components/cards/MotionRadarCard';
import { RfidAccessCard } from '../components/cards/RfidAccessCard';
import { spacing, radius } from '@repo/design-tokens';

export const DashboardScreen: React.FC = () => {
  const { esp32Online } = useDevice();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'living' | 'security' | 'bedroom' | 'kitchen'>('living');

  const tabs = [
    { key: 'living', label: t('tabLiving') },
    { key: 'security', label: t('tabSecurity') },
    { key: 'bedroom', label: t('tabBedroom') },
    { key: 'kitchen', label: t('tabKitchen') },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Energy Saving Banner */}
        <EnergyBanner />

        {/* Room Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isActive
                      ? isDarkMode ? '#FFFFFF' : '#111216'
                      : isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    {
                      color: isActive
                        ? isDarkMode ? '#111216' : '#FFFFFF'
                        : theme.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2-Column Device Cards Grid */}
        <View style={styles.gridRow}>
          <LightControlCard />
          <DoorSecurityCard />
        </View>

        <View style={styles.gridRow}>
          <MotionRadarCard />
          <RfidAccessCard />
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
    paddingBottom: 110, // Avoid overlapping floating dock
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  tabChipText: {
    fontSize: 13,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: 12,
  },
});

