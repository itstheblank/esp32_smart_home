import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useI18n } from "../../context/I18nContext";
import { useAppTheme } from "../../context/ThemeContext";
import { AppIcons } from "./AppIcons";

export const LanguageToggle: React.FC = () => {
  const { currentLang, toggleLang } = useI18n();
  const { theme, isDarkMode } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={toggleLang}
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
        },
      ]}
    >
      <AppIcons.Globe size={15} color={theme.textPrimary} style={styles.icon} />
      <Text style={[styles.label, { color: theme.textPrimary }]}>
        {currentLang.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});

