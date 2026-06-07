import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Tractor, ShoppingBag, ArrowLeft } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterChoice'>;

export const RegisterChoiceScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  return (
    <ScreenWrapper scrollable padded>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={[styles.title, { color: colors.text }]}>Join IgiciroHub 🌱</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>Choose your role to get started</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.md]}
          onPress={() => navigation.navigate('RegisterFarmer')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Tractor size={32} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>I'm a Cooperative 🌾</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Sell your crops, track prices, get AI predictions and disease detection
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).duration(500)}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.md]}
          onPress={() => navigation.navigate('RegisterBuyer')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary + '15' }]}>
            <ShoppingBag size={32} color={colors.secondary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>I'm a Buyer 🛒</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Browse marketplace, buy crops directly from cooperatives, track orders
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  back: { marginTop: 8, marginBottom: 16 },
  title: { fontSize: 28, fontFamily: FONT.bold, marginBottom: 4 },
  sub: { fontSize: 14, fontFamily: FONT.regular, marginBottom: 32 },
  card: { borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 20, fontFamily: FONT.bold, marginBottom: 8 },
  cardDesc: { fontSize: 13, fontFamily: FONT.regular, textAlign: 'center', lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 13, fontFamily: FONT.regular },
  footerLink: { fontSize: 13, fontFamily: FONT.semibold },
});