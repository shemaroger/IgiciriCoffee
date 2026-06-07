import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('OTP sent to your email! 📧', 'success');
      navigation.navigate('OTPVerification');
    }, 1200);
  };

  return (
    <ScreenWrapper scrollable padded>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, marginBottom: 16 }}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={[styles.title, { color: colors.text }]}>Forgot Password 🔐</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>Enter your email to receive a verification code</Text>
      </Animated.View>
      <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <Mail size={18} color={colors.textMuted} />
        <TextInput style={[styles.input, { color: colors.text, fontFamily: FONT.regular }]} placeholder="Email address" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>
      <GradientButton title="Send OTP" onPress={handleSend} loading={loading} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontFamily: FONT.bold, marginBottom: 4 },
  sub: { fontSize: 14, fontFamily: FONT.regular, marginBottom: 32 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, gap: 12, marginBottom: 24 },
  input: { flex: 1, fontSize: 14 },
});
