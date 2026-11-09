import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';
import { useDevice } from '../../context/DeviceContext';
import { useMqtt } from '../../context/MqttContext';
import { useAppTheme } from '../../context/ThemeContext';

interface RobotAvatarProps {
  size?: number;
  onPress?: () => void;
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({ size = 44, onPress }) => {
  const { isConnected } = useMqtt();
  const { esp32Online } = useDevice();
  const { theme, isDarkMode } = useAppTheme();

  const isHealthy = isConnected && esp32Online;
  const statusColor = isHealthy ? '#22C55E' : isConnected ? '#FFC700' : '#EF4444';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, { width: size, height: size }]}
    >
      {/* 100% Vector Robot Avatar Matching Figma Prototype */}
      <Svg width={size} height={size} viewBox="0 0 44 44">
        {/* Yellow-Orange Rounded Background */}
        <Circle cx="22" cy="22" r="22" fill="#FFAA00" />

        {/* Robot Antenna */}
        <Rect x="21" y="8" width="2" height="4" fill="#E2E8F0" />
        <Circle cx="22" cy="7" r="2" fill="#FFDD00" />

        {/* Robot Ears */}
        <Rect x="8" y="19" width="3" height="6" rx="1.5" fill="#70A82C" />
        <Rect x="33" y="19" width="3" height="6" rx="1.5" fill="#70A82C" />

        {/* Robot Head */}
        <Rect x="10.5" y="13" width="23" height="18" rx="5" fill="#8AC926" />

        {/* Screen/Faceplate Area */}
        <Rect x="13.5" y="16" width="17" height="8" rx="2" fill="#1A2E05" />

        {/* Glowing Eyes */}
        <Rect x="15.5" y="18" width="4" height="4" rx="1" fill="#00F5D4" />
        <Rect x="24.5" y="18" width="4" height="4" rx="1" fill="#00F5D4" />

        {/* Robot Mouth Grid */}
        <Rect x="16" y="26" width="12" height="3" rx="0.5" fill="#FFFFFF" opacity={0.9} />
        <LineDivider x="19" />
        <LineDivider x="22" />
        <LineDivider x="25" />
      </Svg>

      {/* Online Status Dot in Bottom Right with Card-Themed Border */}
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: statusColor,
            borderColor: theme.surfaceCard,
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const LineDivider = ({ x }: { x: string }) => (
  <Rect x={x} y="26" width="0.75" height="3" fill="#8AC926" />
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
