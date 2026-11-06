import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { LiveStatusDot, StatusDotVariant } from "./LiveStatusDot";
import { AppIcons } from "./AppIcons";

const USE_NATIVE_DRIVER = Platform.OS == "web";

export interface ToastData {
  id: string;
  variant: StatusDotVariant;
  title: string;
  message: string;
  onPress?: () => void;
  onClose?: () => void;
  durationMs?: number;
}

export interface InAppNotificationToastProps {
  data?: ToastData | null;
  visible?: boolean;
  type?: "success" | "warning" | "error" | "info";
  title?: string;
  description?: string;
  onPress?: () => void;
  onDismiss: () => void;
}

function mapTypeToVariant(type?: "success" | "warning" | "error" | "info"): StatusDotVariant {
  switch (type) {
    case "error":
      return "ALERT";
    case "warning":
      return "WARNING";
    case "success":
    case "info":
    default:
      return "ONLINE";
  }
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  data,
  visible,
  type,
  title,
  description,
  onPress,
  onDismiss,
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const resolvedData: ToastData | null =
    data !== undefined
      ? data
      : visible && title
      ? {
          id: `${type ?? "info"}-${title}`,
          variant: mapTypeToVariant(type),
          title,
          message: description ?? "",
          onPress,
        }
      : null;

  useEffect(() => {
    if (!resolvedData) {
      slideAnim.setValue(-120);
      return;
    }

    const duration = resolvedData.durationMs ?? 4500;

    // Slide down animation
    Animated.spring(slideAnim, {
      toValue: 50, // below Dynamic Island / status bar
      friction: 8,
      tension: 40,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    // Progress bar animation
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [resolvedData?.id, resolvedData?.title, resolvedData?.message]);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => {
      onDismiss();
    });
  };

  if (!resolvedData) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: theme.surfaceCard,
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(0, 0, 0, 0.08)",
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (resolvedData.onPress) resolvedData.onPress();
          dismiss();
        }}
        style={styles.contentRow}
      >
        <View style={styles.dotBox}>
          <LiveStatusDot status={resolvedData.variant} size={10} />
        </View>

        <View style={styles.textBox}>
          <Text
            style={[styles.title, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {resolvedData.title}
          </Text>
          <Text
            style={[styles.message, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {resolvedData.message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          style={styles.closeBtn}
        >
          <AppIcons.Close size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Progress countdown bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: isDarkMode ? "#60A5FA" : "#2563EB",
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    width: screenWidth - 32,
    zIndex: 1000,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  dotBox: {
    marginRight: 10,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    width: "100%",
  },
  progressBar: {
    height: "100%",
  },
});

