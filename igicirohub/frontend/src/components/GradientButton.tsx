import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS } from '../theme/tokens';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'warm' | 'outline';
  style?: ViewStyle;
  disabled?: boolean;
}

export const GradientButton = ({ title, onPress, loading, variant = 'primary', style, disabled }: Props) => {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        style={[styles.btn, { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' }, style]}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        {loading ? <ActivityIndicator color={colors.primary} /> : (
          <Text style={[styles.text, { color: colors.primary }]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  const gradientColors = variant === 'warm'
    ? [colors.gradientWarmStart, colors.gradientWarmEnd] as const
    : [colors.gradientStart, colors.gradientEnd] as const;

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled || loading} activeOpacity={0.85} style={style}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : (
          <Text style={[styles.text, { color: '#FFFFFF' }]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: FONT.semibold,
  },
});
