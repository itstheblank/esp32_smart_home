import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  MQTT_TOPICS,
  LightState,
  DoorState,
  MotionState,
  LightFsmState,
  DoorFsmState,
  AccessEventPayload,
} from '@repo/contracts';
import { parseAccessEventPayload } from '@repo/validators';
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

  // Subscribe to device states & access events
  useEffect(() => {
    const unsubState = subscribe('smarthome/state/+', (topic, payload) => {
      switch (topic) {
        case MQTT_TOPICS.STATE_ONLINE:
          dispatch({
            type: 'ESP32_ONLINE_CHANGED',
            online: payload.trim().toUpperCase() === 'ONLINE',
          });
          break;

        case MQTT_TOPICS.STATE_LIGHT:
          if (payload === 'ON' || payload === 'OFF') {
            dispatch({ type: 'LIGHT_STATE_RECEIVED', state: payload as LightState });
          }
          break;

        case MQTT_TOPICS.STATE_DOOR:
          if (payload === 'OPEN' || payload === 'CLOSED') {
            dispatch({ type: 'DOOR_STATE_RECEIVED', state: payload as DoorState });
          }
          break;

        case MQTT_TOPICS.STATE_MOTION:
          if (payload === 'DETECTED' || payload === 'CLEAR') {
            dispatch({
              type: 'MOTION_STATE_RECEIVED',
              state: payload as MotionState,
            });
          }
          break;

        default:
          break;
      }
    });

    const unsubAccess = subscribe(MQTT_TOPICS.EVENT_ACCESS, (_topic, payload) => {
      const parsed = parseAccessEventPayload(payload);
      if (parsed.success && parsed.data) {
        dispatch({
          type: 'ACCESS_EVENT_RECEIVED',
          event: parsed.data as AccessEventPayload,
        });
      }
    });

    return () => {
      unsubState();
      unsubAccess();
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
