import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf } from 'lucide-react-native';
import { FONT } from '../theme/tokens';
import { useAuth } from '../auth/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen = ({ navigation }: Props) => {
  const { session, isLoading } = useAuth();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 800 });
    opacity.value = withTiming(1, { duration: 600 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (session) {
        navigation.replace('App');
      } else {
        navigation.replace('Welcome');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isLoading, session]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <LinearGradient colors={['#1B5E20', '#2E7D32', '#4CAF50']} style={styles.container}>
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <View style={styles.iconCircle}>
          <Leaf size={48} color="#FFFFFF" strokeWidth={2} />
        </View>
      </Animated.View>
      <Animated.View style={textStyle}>
        <Text style={styles.title}>IgiciroHub</Text>
        <Text style={styles.subtitle}>Smart Farming Platform</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { marginBottom: 20 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontFamily: FONT.bold, color: '#FFFFFF', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4 },
});