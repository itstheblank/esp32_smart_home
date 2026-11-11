import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Paho from 'paho-mqtt';
import { BrokerStatus, MQTT_TOPICS } from '@repo/contracts';
import { installMqttPolyfill } from '../services/mqttPolyfill';
import { calculateBackoffWithJitter } from '../services/backoffPolicy';
import { SubscriptionDispatcher, TopicHandler } from '../services/subscriptionDispatcher';
import { useI18n } from './I18nContext';

// Ensure safe environment before Paho initialization
installMqttPolyfill();

export interface BrokerConfig {
  host: string;
  port: number;
  path: string;
  clientId: string;
  keepAlive: number;
  useSsl: boolean;
}

export const DEFAULT_BROKER_CONFIG: BrokerConfig = {
  host: '192.168.137.1',
  port: 8083,
  path: '/mqtt',
  clientId: `App_Mobile_${Math.random().toString(16).substring(2, 10)}`,
  keepAlive: 30,
  useSsl: false,
};

export interface MqttContextValue {
  status: BrokerStatus;
  isConnected: boolean;
  config: BrokerConfig;
  brokerConfig: BrokerConfig;
  lastError: string | null;
  reconnectAttempt: number;

  connect: (customConfig?: Partial<BrokerConfig> | string, port?: number, path?: string) => void;
  reconnect: () => void;
  disconnect: () => void;
  publish: (topic: string, payload: string, qos?: 0 | 1 | 2, retain?: boolean) => Promise<void>;
  subscribe: (topicPattern: string, handler: TopicHandler) => () => void;
  updateConfig: (newConfig: Partial<BrokerConfig>) => void;
}

const STORAGE_BROKER_CONFIG_KEY = 'MQTT_BROKER_CONFIG';

const MqttContext = createContext<MqttContextValue | null>(null);

export const MqttProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: Partial<BrokerConfig>;
  autoConnect?: boolean;
}> = ({ children, initialConfig, autoConnect = false }) => {
  const { t } = useI18n();

  // Synchronous web hydration for persistent Broker config
  const [config, setConfig] = useState<BrokerConfig>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_BROKER_CONFIG_KEY);
      if (saved) {
        try {
          return { ...DEFAULT_BROKER_CONFIG, ...JSON.parse(saved), ...initialConfig };
        } catch (_) {}
      }
    }
    return {
      ...DEFAULT_BROKER_CONFIG,
      ...initialConfig,
    };
  });

  // Async restore for Native
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_BROKER_CONFIG_KEY)
      .then((saved) => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setConfig((prev) => ({ ...prev, ...parsed }));
          } catch (_) {}
        }
      })
      .catch(() => {});
  }, []);

  const [status, setStatus] = useState<BrokerStatus>('DISCONNECTED');
  const [lastError, setLastError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const clientRef = useRef<Paho.Client | null>(null);
  const dispatcherRef = useRef<SubscriptionDispatcher>(new SubscriptionDispatcher());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManuallyDisconnectedRef = useRef(false);
  const configRef = useRef(config);
  configRef.current = config;

  // Clear pending reconnect timer
  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const connectInternal = useCallback(
    (targetConfig: BrokerConfig) => {
      try {
        clearReconnectTimer();
        setStatus('CONNECTING');
        setLastError(null);

        const client = new Paho.Client(
          targetConfig.host,
          targetConfig.port,
          targetConfig.path,
          targetConfig.clientId
        );

        clientRef.current = client;

        client.onConnectionLost = (responseObject) => {
          setStatus('DISCONNECTED');
          if (responseObject.errorCode !== 0) {
            setLastError(responseObject.errorMessage);
            scheduleReconnect();
          }
        };

        client.onMessageArrived = (message) => {
          dispatcherRef.current.dispatch(message.destinationName, message.payloadString);
        };

        client.connect({
          useSSL: targetConfig.useSsl,
          keepAliveInterval: targetConfig.keepAlive,
          cleanSession: true,
          timeout: 10,
          onSuccess: () => {
            setStatus('CONNECTED');
            setReconnectAttempt(0);
            setLastError(null);

            // Contract v2.0.0: every device state/event arrives on smarthome/logs
            client.subscribe(MQTT_TOPICS.LOGS);
          },
          onFailure: (err) => {
            setStatus('DISCONNECTED');
            setLastError(err.errorMessage);
            scheduleReconnect();
          },
        });
      } catch (err: any) {
        setStatus('DISCONNECTED');
        setLastError(err.message ?? t('mqttClientError'));
        scheduleReconnect();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  const scheduleReconnect = useCallback(() => {
    if (isManuallyDisconnectedRef.current) return;

    clearReconnectTimer();
    const waitMs = calculateBackoffWithJitter(reconnectAttempt);
    setReconnectAttempt((prev) => prev + 1);

    reconnectTimerRef.current = setTimeout(() => {
      connectInternal(configRef.current);
    }, waitMs);
  }, [reconnectAttempt, connectInternal]);

  const saveConfigToStorage = (target: BrokerConfig) => {
    AsyncStorage.setItem(STORAGE_BROKER_CONFIG_KEY, JSON.stringify(target)).catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_BROKER_CONFIG_KEY, JSON.stringify(target));
    }
  };

  const connect = useCallback(
    (customConfig?: Partial<BrokerConfig> | string, port?: number, path?: string) => {
      isManuallyDisconnectedRef.current = false;
      let target: BrokerConfig = { ...configRef.current };
      let hasChanged = false;

      if (typeof customConfig === 'string') {
        target.host = customConfig;
        hasChanged = true;
        if (port !== undefined) target.port = port;
        if (path !== undefined) target.path = path;
      } else if (customConfig && Object.keys(customConfig).length > 0) {
        target = { ...target, ...customConfig };
        hasChanged = true;
      }

      if (hasChanged) {
        setConfig(target);
        saveConfigToStorage(target);
      }
      connectInternal(target);
    },
    [connectInternal]
  );

  const reconnect = useCallback(() => {
    connect(configRef.current);
  }, [connect]);

  const disconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = true;
    clearReconnectTimer();
    if (clientRef.current && clientRef.current.isConnected()) {
      clientRef.current.disconnect();
    }
    clientRef.current = null;
    setStatus('DISCONNECTED');
  }, []);

  const publish = useCallback(
    async (
      topic: string,
      payload: string,
      qos: 0 | 1 | 2 = 0,
      retain: boolean = false
    ): Promise<void> => {
      if (!clientRef.current || !clientRef.current.isConnected()) {
        throw new Error(t('mqttSendNotConnected'));
      }
      const message = new Paho.Message(payload);
      message.destinationName = topic;
      message.qos = qos;
      message.retained = retain;
      clientRef.current.send(message);
    },
    [t]
  );

  const subscribe = useCallback((topicPattern: string, handler: TopicHandler): (() => void) => {
    return dispatcherRef.current.subscribe(topicPattern, handler);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<BrokerConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      saveConfigToStorage(merged);
      return merged;
    });
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      clearReconnectTimer();
      if (clientRef.current && clientRef.current.isConnected()) {
        clientRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  const value: MqttContextValue = {
    status,
    isConnected: status === 'CONNECTED',
    config,
    brokerConfig: config,
    lastError,
    reconnectAttempt,
    connect,
    reconnect,
    disconnect,
    publish,
    subscribe,
    updateConfig,
  };

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = (): MqttContextValue => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqtt must be used within an MqttProvider');
  }
  return context;
};
