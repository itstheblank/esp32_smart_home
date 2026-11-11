import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform } from "react-native";
import { primitiveColors } from "@repo/design-tokens";

export type StatusDotVariant =
  | "ONLINE"
  | "WARNING"
  | "ALERT"
  | "DISCONNECTED"
  | "online"
  | "warning"
  | "alert"
  | "offline";

interface LiveStatusDotProps {
  status: StatusDotVariant;
  size?: number;
  pulsing?: boolean;
}

export const LiveStatusDot: React.FC<LiveStatusDotProps> = ({
  status,
  size = 8,
  pulsing = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulsing || status === "DISCONNECTED") {
      pulseAnim.setValue(1);
      return;
    }

    const useNativeDriver = Platform.OS !== "web";
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 900,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulsing, status, pulseAnim]);

  const getColor = (): string => {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case "ONLINE":
        return primitiveColors.emerald500;
      case "WARNING":
        return primitiveColors.amber400;
      case "ALERT":
        return primitiveColors.red500;
      case "DISCONNECTED":
      case "OFFLINE":
      default:
        return primitiveColors.gray400;
    }
  };

  const color = getColor();

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {pulsing && status !== "DISCONNECTED" && (
        <Animated.View
          style={[
            styles.halo,
            {
              width: size * 1.8,
              height: size * 1.8,
              borderRadius: size,
              backgroundColor: color,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    opacity: 0.25,
  },
  dot: {
    zIndex: 2,
  },
});

