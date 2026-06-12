import React from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  ImageBackground, StatusBar, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Brain, ShieldCheck, Sprout, Star } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SPACING } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: TrendingUp,  title: 'Real-Time Prices',    desc: 'ML-updated coffee prices',        color: '#4CAF50' },
  { icon: Brain,       title: 'AI Predictions',       desc: 'Random Forest forecasts',          color: '#2196F3' },
  { icon: ShieldCheck, title: 'Disease Detection',    desc: 'Gemini Vision AI scan',            color: '#FF9800' },
  { icon: Sprout,      title: 'Direct Market',        desc: 'Buyers & cooperatives',            color: '#9C27B0' },
];

export const WelcomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* Background — Coffee.jpeg */}
      <ImageBackground
        source={require('../../assets/images/Coffee.jpeg')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'rgba(0,20,5,0.70)', 'rgba(0,10,2,0.97)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={{ flex: 1, paddingTop: insets.top }}>

        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.badgeRow}>
           
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(700)}>
            <Text style={styles.heroEmoji}>☕</Text>
            <Text style={styles.heroTitle}>IgiciroHub</Text>
            <Text style={styles.heroSub}>
              Smart Coffee Market{'\n'}Powered by AI & Random Forest ML
            </Text>
          </Animated.View>
        </View>

        ── Feature cards + Buttons ──
        <View style={[styles.featuresSection, { paddingBottom: insets.bottom + 24 }]}>
       

          {/* ── Buttons ── */}
          <Animated.View entering={FadeInUp.delay(700).duration(600)} style={{ gap: 12 }}>
            <GradientButton
              title="🌱 Join as Cooperative"
              onPress={() => navigation.navigate('Auth', { screen: 'RegisterChoice' } as any)}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('Auth', { screen: 'Login' } as any)}
              style={styles.outlineBtn}
            >
              <Text style={styles.outlineBtnText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  badgeRow: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: FONT.semibold,
    color: '#FFD700',
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 44,
    fontFamily: FONT.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: FONT.regular,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 22,
  },
  featuresSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  featureCard: {
    width: (width - SPACING.lg * 2 - 10) / 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: RADIUS.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontFamily: FONT.semibold,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 10,
    fontFamily: FONT.regular,
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 14,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.40)',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontFamily: FONT.semibold,
    color: 'rgba(255,255,255,0.90)',
  },
});