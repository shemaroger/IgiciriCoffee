import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sprout, TrendingUp, ShieldCheck } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SPACING } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;
const { width } = Dimensions.get('window');

const features = [
  { icon: TrendingUp, title: 'Real-Time Prices', desc: 'Track crop prices across Rwanda' },
  { icon: Sprout, title: 'AI Predictions', desc: 'Smart forecasts for your harvest' },
  { icon: ShieldCheck, title: 'Disease Detection', desc: 'Scan crops for diseases instantly' },
];

export const WelcomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.hero}>
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text style={styles.heroEmoji}>🌾</Text>
          <Text style={styles.heroTitle}>IgiciroHub</Text>
          <Text style={styles.heroSub}>Empowering Rwandan Farmers with Smart Technology</Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        {features.map((f, i) => (
          <Animated.View key={f.title} entering={FadeInDown.delay(400 + i * 120).duration(500)} style={[styles.featureRow, { backgroundColor: colors.surface }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
              <f.icon size={22} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.buttons}>
          <GradientButton title="Start Farming 🌱" onPress={() => navigation.navigate('Auth', { screen: 'RegisterChoice' } as any)} />
          <View style={{ height: 12 }} />
          <GradientButton title="Skip to Login" variant="outline" onPress={() => navigation.navigate('Auth', { screen: 'Login' } as any)} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingTop: 80, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 34, fontFamily: FONT.bold, color: '#FFFFFF', textAlign: 'center' },
  heroSub: { fontSize: 14, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  content: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: RADIUS.lg, marginBottom: 12 },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontFamily: FONT.semibold },
  featureDesc: { fontSize: 12, fontFamily: FONT.regular, marginTop: 2 },
  buttons: { marginTop: 'auto', paddingBottom: 40 },
});
