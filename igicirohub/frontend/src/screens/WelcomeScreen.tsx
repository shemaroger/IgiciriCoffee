import React from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  ImageBackground, StatusBar,
} from 'react-native';
import Animated, {
  FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Sprout, ShieldCheck, Brain, Star } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SPACING } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: TrendingUp,  title: 'Real-Time Prices',   desc: 'ML-updated coffee & crop prices',  color: '#4CAF50' },
  { icon: Brain,       title: 'AI Predictions',      desc: 'Random Forest price forecasts',     color: '#2196F3' },
  { icon: ShieldCheck, title: 'Disease Detection',   desc: 'Scan crops with Gemini Vision AI',  color: '#FF9800' },
  { icon: Sprout,      title: 'Direct Market Access',desc: 'Connect buyers & cooperatives',     color: '#9C27B0' },
];

export const WelcomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* Full screen background image */}
      <ImageBackground
        source={require('../../assets/images/home.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Dark gradient overlay for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,30,10,0.75)', 'rgba(0,20,5,0.95)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Content */}
      <View style={{ flex: 1, paddingTop: insets.top }}>

        {/* ── Top hero section ── */}
        <View style={styles.heroSection}>
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.badgeRow}>
            <View style={styles.badge}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Text style={styles.badgeText}>Rwanda's #1 Coffee Platform</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(700)}>
            <Text style={styles.heroEmoji}>☕</Text>
            <Text style={styles.heroTitle}>IgiciroHub</Text>
            <Text style={styles.heroSub}>
              Smart Coffee & Cash Crop Market{'\n'}Powered by AI & Random Forest ML
            </Text>
          </Animated.View>

          {/* Stats row */}
          <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.statsRow}>
            {[
              { value: '20+', label: 'Districts' },
              { value: '3',   label: 'Coffee Types' },
              { value: 'ML',  label: 'Powered' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* ── Feature cards ── */}
        <View style={styles.featuresSection}>
          <Animated.View entering={FadeInUp.delay(500).duration(600)}>
            <View style={styles.featuresGrid}>
              {FEATURES.map((f, i) => (
                <Animated.View
                  key={f.title}
                  entering={FadeInUp.delay(550 + i * 80).duration(500)}
                  style={styles.featureCard}
                >
                  <View style={[styles.featureIconWrap, { backgroundColor: f.color + '25' }]}>
                    <f.icon size={20} color={f.color} />
                  </View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ── Buttons ── */}
          <Animated.View entering={FadeInUp.delay(800).duration(600)} style={[styles.buttons, { paddingBottom: insets.bottom + 24 }]}>
            <GradientButton
              title="🌱 Join as Cooperative"
              onPress={() => navigation.navigate('Auth', { screen: 'RegisterChoice' } as any)}
            />
            <View style={{ height: 12 }} />
            <TouchableOutline
              title="Already have an account? Sign In"
              onPress={() => navigation.navigate('Auth', { screen: 'Login' } as any)}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

// ── Transparent outline button ─────────────────────────────────────────────
const TouchableOutline = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <View
    style={{
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)',
      borderRadius: RADIUS.lg, paddingVertical: 14,
      alignItems: 'center',
    }}
  >
    <Text
      onPress={onPress}
      style={{ fontSize: 14, fontFamily: FONT.semibold, color: 'rgba(255,255,255,0.9)' }}
    >
      {title}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  heroSection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    paddingTop: 20,
  },
  badgeRow: {
    marginBottom: 20,
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
    fontSize: 52,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 42,
    fontFamily: FONT.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: FONT.regular,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 22,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: FONT.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
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
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 13,
    fontFamily: FONT.semibold,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 15,
  },
  buttons: {
    gap: 0,
  },
});