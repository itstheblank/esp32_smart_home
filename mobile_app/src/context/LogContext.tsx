import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StructuredLogEvent, LogCategory, ASYNC_CONFIG } from '@repo/contracts';

const STORAGE_LOGS_KEY = 'APP_LOGS_CACHE';

export interface LogContextValue {
  logs: StructuredLogEvent[];
  activeFilter: LogCategory | 'ALL';
  filteredLogs: StructuredLogEvent[];
  appendLog: (
    category: LogCategory,
    level: StructuredLogEvent['level'],
    translationKey: string,
    params?: Record<string, string | number>,
    rawTopic?: string,
    rawPayload?: string
  ) => void;
  setFilter: (category: LogCategory | 'ALL') => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextValue | null>(null);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous web hydration for logs
  const [logs, setLogs] = useState<StructuredLogEvent[]>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_LOGS_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (_) {}
      }
    }
    return [];
  });

  const [activeFilter, setActiveFilter] = useState<LogCategory | 'ALL'>('ALL');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_LOGS_KEY)
      .then((saved) => {
        if (saved) {
          try {
            setLogs(JSON.parse(saved));
          } catch (_) {}
        }
      })
      .catch(() => {});
  }, []);

  const saveLogsToStorage = (updatedLogs: StructuredLogEvent[]) => {
    AsyncStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updatedLogs)).catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updatedLogs));
    }
  };

  const appendLog = useCallback(
    (
      category: LogCategory,
      level: StructuredLogEvent['level'],
      translationKey: string,
      params: Record<string, string | number> = {},
      rawTopic?: string,
      rawPayload?: string
    ) => {
      const now = new Date();
      const timeFormatted = now.toTimeString().split(' ')[0] ?? '00:00:00';
      const newEntry: StructuredLogEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(16).substring(2, 6)}`,
        timestamp: now.toISOString(),
        timeFormatted,
        category,
        level,
        translationKey,
        params,
        rawTopic,
        rawPayload,
      };

      setLogs((prev) => {
        // Enforce Ring Buffer bound of 50 items O(1)
        const updated = [newEntry, ...prev];
        if (updated.length > ASYNC_CONFIG.RING_BUFFER_MAX_SIZE) {
          updated.length = ASYNC_CONFIG.RING_BUFFER_MAX_SIZE;
        }
        saveLogsToStorage(updated);
        return updated;
      });
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    saveLogsToStorage([]);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'ALL') return true;
    return log.category === activeFilter;
  });

  const value: LogContextValue = {
    logs,
    activeFilter,
    filteredLogs,
    appendLog,
    setFilter: setActiveFilter,
    clearLogs,
  };

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
};

export const useAppLogs = (): LogContextValue => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useAppLogs must be used within a LogProvider');
  }
  return context;
};
