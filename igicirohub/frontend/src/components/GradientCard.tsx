import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS, SHADOWS } from '../theme/tokens';

interface Props {
  children: ReactNode;
  variant?: 'primary' | 'warm';
  style?: ViewStyle;
}

export const GradientCard = ({ children, variant = 'primary', style }: Props) => {
  const { colors } = useTheme();
  const gradientColors = variant === 'warm'
    ? [colors.gradientWarmStart, colors.gradientWarmEnd] as const
    : [colors.gradientStart, colors.gradientEnd] as const;

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, SHADOWS.md, style]}>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    padding: 20,
    overflow: 'hidden',
  },
});
