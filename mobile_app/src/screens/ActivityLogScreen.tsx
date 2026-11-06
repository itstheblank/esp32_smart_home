import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAppLogs } from '../context/LogContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { AppIcons } from '../components/common/AppIcons';
import { SystemAuditCard } from '../components/cards/SystemAuditCard';
import { radius, spacing } from '@repo/design-tokens';
import { LogCategory, StructuredLogEvent } from '@repo/contracts';

export const ActivityLogScreen: React.FC = () => {
  const { filteredLogs, activeFilter, setFilter, clearLogs, logs } = useAppLogs();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  const filterChips: { key: LogCategory | 'ALL'; label: string }[] = [
    { key: 'ALL', label: t('chipAll') },
    { key: 'SECURITY', label: t('chipSec') },
    { key: 'LIGHT', label: t('chipLight') },
    { key: 'DOOR', label: t('chipDoor') },
    { key: 'MOTION', label: t('chipMotion') },
    { key: 'SYSTEM', label: t('chipSys') },
  ];

  const getCategoryColor = (category: LogCategory): string => {
    switch (category) {
      case 'SECURITY':
        return '#EF4444';
      case 'LIGHT':
        return '#F59E0B';
      case 'DOOR':
        return '#2563EB';
      case 'MOTION':
        return '#F97316';
      case 'SYSTEM':
      default:
        return '#10B981';
    }
  };

  const renderLogItem = ({ item }: { item: StructuredLogEvent }) => {
    const categoryColor = getCategoryColor(item.category);
    const message = t(item.translationKey as any, item.params);

    return (
      <View
        style={[
          styles.logCard,
          {
            backgroundColor: theme.surfaceCard,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />

        <View style={styles.logBody}>
          <View style={styles.logMetaRow}>
            <View
              style={[
                styles.categoryBadge,
                {
                  borderColor: `${categoryColor}66`,
                  backgroundColor: `${categoryColor}0D`,
                },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                {item.category}
              </Text>
            </View>

            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {item.timeFormatted}
            </Text>
          </View>

          <Text style={[styles.messageText, { color: theme.textPrimary }]}>
            {message}
          </Text>

          {item.rawTopic && (
            <Text style={[styles.topicSub, { color: theme.textSecondary }]}>
              MQTT: {item.rawTopic}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {t('eventPageTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('logCountLabel')} {logs.length}/50
          </Text>
        </View>

        {logs.length > 0 && (
          <TouchableOpacity
            style={[
              styles.clearBtn,
              { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
            ]}
            onPress={clearLogs}
            activeOpacity={0.7}
          >
            <AppIcons.Close size={14} color="#EF4444" />
            <Text style={styles.clearBtnText}>{t('btnClearLogs')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* System Audit / Event Summary Banner (SSOT Figma 2-115 & Prototype Event Hero Card) */}
      <SystemAuditCard />

      {/* Filter Tabs Bar (Underline / Outline Style) */}
      <View
        style={[
          styles.filterBar,
          {
            borderBottomColor: isDarkMode
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterChips.map((chip) => {
            const isSelected = activeFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setFilter(chip.key)}
                style={[
                  styles.filterTab,
                  {
                    borderBottomColor: isSelected
                      ? isDarkMode
                        ? '#FFFFFF'
                        : '#111216'
                      : 'transparent',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: isSelected
                        ? theme.textPrimary
                        : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppIcons.EventsOutline size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {t('logEmptyTitle')}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {t('logEmptySub')}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitleCol: {
    flex: 1,
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
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: 4,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  filterBar: {
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: 16,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2.5,
    marginBottom: -1,
  },
  filterTabText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110, // Avoid overlapping floating dock
    gap: 10,
  },
  logCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryIndicator: {
    width: 5,
  },
  logBody: {
    flex: 1,
    padding: spacing.md,
  },
  logMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  topicSub: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});

