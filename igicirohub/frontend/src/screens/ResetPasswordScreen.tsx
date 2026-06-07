import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Lock, ArrowLeft } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Password reset successfully! 🎉', 'success');
      navigation.navigate('Login');
    }, 1200);
  };

  return (
    <ScreenWrapper scrollable padded>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, marginBottom: 16 }}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={[{ fontSize: 26, fontFamily: FONT.bold, color: colors.text, marginBottom: 4 }]}>New Password 🔒</Text>
        <Text style={[{ fontSize: 14, fontFamily: FONT.regular, color: colors.textSecondary, marginBottom: 32 }]}>Create a strong password</Text>
      </Animated.View>
      <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <Lock size={18} color={colors.textMuted} />
        <TextInput style={[styles.input, { color: colors.text, fontFamily: FONT.regular }]} placeholder="New Password" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
      </View>
      <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <Lock size={18} color={colors.textMuted} />
        <TextInput style={[styles.input, { color: colors.text, fontFamily: FONT.regular }]} placeholder="Confirm Password" placeholderTextColor={colors.textMuted} value={confirm} onChangeText={setConfirm} secureTextEntry />
      </View>
      <GradientButton title="Reset Password" onPress={handleReset} loading={loading} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, gap: 12, marginBottom: 16 },
  input: { flex: 1, fontSize: 14 },
});
