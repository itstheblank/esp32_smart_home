import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { MQTT_TOPICS } from '@repo/contracts';
import { parseLogPayload, mapLogToActions } from '../services/mqttLogAdapter';
import { useMqtt } from './MqttContext';
import { useI18n } from './I18nContext';
import {
  deviceStateReducer,
  INITIAL_DEVICE_STATE,
  DeviceStateModel,
} from '../services/deviceStateMachine';

export interface SystemAuditViewModel {
  status: 'SECURE' | 'WARNING' | 'ALERT' | 'OFFLINE';
  score: number;
  title: string;
  isSecure: boolean;
}

export interface DeviceContextValue extends DeviceStateModel {
  systemAudit: SystemAuditViewModel;
  resolveSecurityAlert: () => void;
  resetDoorJam: () => void;
  dispatchAction: React.Dispatch<any>;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useI18n();
  const { isConnected, subscribe } = useMqtt();
  const [state, dispatch] = useReducer(deviceStateReducer, INITIAL_DEVICE_STATE);

  // Sync Broker status to state machine
  useEffect(() => {
    dispatch({ type: 'BROKER_STATUS_CHANGED', connected: isConnected });
  }, [isConnected]);

  // Subscribe to firmware logs (contract v2.0.0: smarthome/logs carries every
  // state change and event as JSON {device,id,action,success,data})
  useEffect(() => {
    const unsubLogs = subscribe(MQTT_TOPICS.LOGS, (_topic, payload) => {
      const log = parseLogPayload(payload);
      if (!log) return; // fail-closed: ignore off-contract payloads
      mapLogToActions(log).forEach((action) => dispatch(action));
    });

    return () => {
      unsubLogs();
    };
  }, [subscribe]);

  const resolveSecurityAlert = useCallback(() => {
    dispatch({ type: 'RESOLVE_SECURITY_ALERT' });
  }, []);

  const resetDoorJam = useCallback(() => {
    dispatch({ type: 'DOOR_JAM_RESET' });
  }, []);

  // Compute System Audit View Model
  const getAuditViewModel = (): SystemAuditViewModel => {
    if (!state.brokerConnected || !state.esp32Online) {
      return {
        status: 'OFFLINE',
        score: 0,
        title: !state.brokerConnected ? t('auditBrokerDisconnected') : t('auditEspOffline'),
        isSecure: false,
      };
    }
    if (state.isSecurityAlert) {
      return {
        status: 'ALERT',
        score: state.systemAuditScore,
        title: t('auditSecurityAlert'),
        isSecure: false,
      };
    }
    return {
      status: 'SECURE',
      score: 100,
      title: t('auditStatus'),
      isSecure: true,
    };
  };

  const value: DeviceContextValue = {
    ...state,
    systemAudit: getAuditViewModel(),
    resolveSecurityAlert,
    resetDoorJam,
    dispatchAction: dispatch,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};

export const useDevice = (): DeviceContextValue => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
