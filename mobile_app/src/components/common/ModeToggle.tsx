import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { AppIcons } from './AppIcons';

export const ModeToggle: React.FC<{ size?: number }> = ({ size = 36 }) => {
  const { isDarkMode, toggleTheme, theme } = useAppTheme();
  const rotateAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isDarkMode ? 1 : 0,
      friction: 6,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isDarkMode, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const scale = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.8, 1],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={toggleTheme}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.surfaceCard,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate: spin }, { scale }] }}>
        {isDarkMode ? (
          <AppIcons.Moon size={size * 0.55} color="#60A5FA" />
        ) : (
          <AppIcons.Sun size={size * 0.55} color="#FFAA00" />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
