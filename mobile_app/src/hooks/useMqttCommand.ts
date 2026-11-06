import { useRef, useCallback } from 'react';
import { MQTT_TOPICS, ASYNC_CONFIG, LightCommand, DoorCommand } from '@repo/contracts';
import { useMqtt } from '../context/MqttContext';
import { useDevice } from '../context/DeviceContext';
import { WatchdogEngine } from '../services/watchdogEngine';

export interface CommandExecutionResult {
  success: boolean;
  error?: string;
}

export function useMqttCommand() {
  const { publish } = useMqtt();
  const { canSendCommands, lightFsm, doorFsm, dispatchAction } = useDevice();

  const watchdogRef = useRef<WatchdogEngine>(new WatchdogEngine());

  const sendLightCommand = useCallback(
    async (targetCmd: LightCommand): Promise<CommandExecutionResult> => {
      // 1. Check Device Guard
      if (!canSendCommands) {
        return {
          success: false,
          error: 'Không thể điều khiển: Hệ thống hoặc ESP32 đang ngoại tuyến!',
        };
      }

      // 2. Race Condition Guard: Ignore clicks if already pending
      if (lightFsm === 'PENDING_ON' || lightFsm === 'PENDING_OFF') {
        return {
          success: false,
          error: 'Lệnh đang được xử lý, vui lòng chờ phản hồi từ thiết bị...',
        };
      }

      try {
        // 3. Optimistic FSM update
        dispatchAction({ type: 'LIGHT_CMD_SENT', targetState: targetCmd });

        // 4. Arm Watchdog timer (3000ms)
        watchdogRef.current.arm('light', {
          timeoutMs: ASYNC_CONFIG.WATCHDOG_LIGHT_MS,
          onTimeout: () => {
            dispatchAction({ type: 'LIGHT_ROLLBACK' });
          },
        });

        // 5. Publish to MQTT
        await publish(MQTT_TOPICS.CMD_LIGHT, targetCmd, 0, false);
        return { success: true };
      } catch (err: any) {
        watchdogRef.current.disarm('light');
        dispatchAction({ type: 'LIGHT_ROLLBACK' });
        return { success: false, error: err.message };
      }
    },
    [canSendCommands, lightFsm, dispatchAction, publish]
  );

  const sendDoorCommand = useCallback(
    async (targetCmd: DoorCommand): Promise<CommandExecutionResult> => {
      // 1. Check Device Guard
      if (!canSendCommands) {
        return {
          success: false,
          error: 'Không thể điều khiển: Hệ thống hoặc ESP32 đang ngoại tuyến!',
        };
      }

      // 2. Check Jammed state
      if (doorFsm === 'JAMMED') {
        return {
          success: false,
          error: 'Cửa đang trong trạng thái KẸT CƠ KHÍ. Hãy xử lý vật lý trước!',
        };
      }

      // 3. Race Condition Guard
      if (doorFsm === 'PENDING_OPEN' || doorFsm === 'PENDING_CLOSE') {
        return {
          success: false,
          error: 'Cửa đang chuyển động, vui lòng chờ...',
        };
      }

      try {
        // 4. Optimistic FSM update
        dispatchAction({ type: 'DOOR_CMD_SENT', targetState: targetCmd });

        // 5. Arm Watchdog timer (4000ms)
        watchdogRef.current.arm('door', {
          timeoutMs: ASYNC_CONFIG.WATCHDOG_DOOR_MS,
          onTimeout: () => {
            dispatchAction({ type: 'DOOR_JAMMED' });
          },
        });

        // 6. Publish to MQTT
        await publish(MQTT_TOPICS.CMD_DOOR, targetCmd, 0, false);
        return { success: true };
      } catch (err: any) {
        watchdogRef.current.disarm('door');
        return { success: false, error: err.message };
      }
    },
    [canSendCommands, doorFsm, dispatchAction, publish]
  );

  // Helper to manually disarm when state confirmation is received
  const confirmLightState = useCallback(() => {
    watchdogRef.current.disarm('light');
  }, []);

  const confirmDoorState = useCallback(() => {
    watchdogRef.current.disarm('door');
  }, []);

  return {
    sendLightCommand,
    sendDoorCommand,
    confirmLightState,
    confirmDoorState,
    isLightPending: lightFsm === 'PENDING_ON' || lightFsm === 'PENDING_OFF',
    isDoorPending: doorFsm === 'PENDING_OPEN' || doorFsm === 'PENDING_CLOSE',
    isDoorJammed: doorFsm === 'JAMMED',
  };
}
