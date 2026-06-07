import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

export const OTPVerificationScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Code verified! ✅', 'success');
      navigation.navigate('ResetPassword');
    }, 1000);
  };

  return (
    <ScreenWrapper scrollable padded>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, marginBottom: 16 }}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={[styles.title, { color: colors.text }]}>Verify Code 📱</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>Enter the 6-digit code sent to your email</Text>
      </Animated.View>
      <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <TextInput style={[styles.input, { color: colors.text, fontFamily: FONT.semibold, textAlign: 'center', letterSpacing: 8, fontSize: 24 }]} placeholder="• • • • • •" placeholderTextColor={colors.textMuted} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
      </View>
      <GradientButton title="Verify" onPress={handleVerify} loading={loading} />
      <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }}>
        <Text style={[{ color: colors.primary, fontFamily: FONT.medium, fontSize: 14 }]}>Resend Code</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontFamily: FONT.bold, marginBottom: 4 },
  sub: { fontSize: 14, fontFamily: FONT.regular, marginBottom: 32 },
  inputWrap: { borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, marginBottom: 24 },
  input: { fontSize: 14 },
});
