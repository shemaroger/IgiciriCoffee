import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { User, Phone, Mail, Lock, ArrowLeft, Building } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterBuyer'>;

const InputRow = ({ icon: Icon, placeholder, value, onChangeText, colors, ...props }: any) => (
  <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
    <Icon size={18} color={colors.textMuted} />
    <TextInput
      style={[styles.input, { color: colors.text, fontFamily: FONT.regular }]}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
  </View>
);

export const RegisterBuyerScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { register } = useAuth();
  const { showToast } = useAppToast();
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [business, setBusiness] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      showToast('Email and password required', 'error'); return;
    }
    if (password.length < 4) {
      showToast('Password must be at least 4 characters', 'error'); return;
    }
    setLoading(true);
    const nameParts = name.trim().split(' ');
    const res = await register({
      email: email.trim(), password, password2: password,
      first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '',
      role: 'buyer', phone: phone.trim(), business_name: business.trim(),
      display_name: name.trim() || email.split('@')[0],
    });
    setLoading(false);
    if (res.success) {
      showToast('Account created! 🎉', 'success');
      setName('');
      setPhone('');
      setEmail('');
      setBusiness('');
      setPassword('');
      navigation.navigate('Login');
    } else {
      showToast(res.error || 'Registration failed', 'error');
    }
  };

  return (
    <ScreenWrapper scrollable padded>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.title, { color: colors.text }]}>Buyer Registration 🛒</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Create your buyer account</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
          <InputRow
            icon={User}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            colors={colors}
          />
          <InputRow
            icon={Phone}
            placeholder="+250 7XX XXX XXX"
            value={phone}
            onChangeText={setPhone}
            colors={colors}
            keyboardType="phone-pad"
          />
          <InputRow
            icon={Mail}
            placeholder="Email *"
            value={email}
            onChangeText={setEmail}
            colors={colors}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputRow
            icon={Building}
            placeholder="Business Name (optional)"
            value={business}
            onChangeText={setBusiness}
            colors={colors}
          />
          <InputRow
            icon={Lock}
            placeholder="Password (min 4 chars) *"
            value={password}
            onChangeText={setPassword}
            colors={colors}
            secureTextEntry
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <GradientButton title="Create Account" onPress={handleRegister} loading={loading} />
        </Animated.View>
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  back: { marginTop: 8, marginBottom: 16 },
  title: { fontSize: 26, fontFamily: FONT.bold, marginBottom: 4 },
  sub: { fontSize: 14, fontFamily: FONT.regular, marginBottom: 24 },
  form: { gap: 12, marginBottom: 24 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, gap: 12 },
  input: { flex: 1, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 32 },
  footerText: { fontSize: 13, fontFamily: FONT.regular },
  footerLink: { fontSize: 13, fontFamily: FONT.semibold },
});