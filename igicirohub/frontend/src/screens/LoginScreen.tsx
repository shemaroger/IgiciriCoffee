import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Eye, EyeOff, Phone, Lock, Leaf } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth, UserRole } from '../auth/AuthContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SPACING } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { login, loginAsGuest } = useAuth();
  const { showToast } = useAppToast();
  const [role, setRole] = useState<UserRole>('cooperative');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Enter email and password', 'error'); return;
    }
    setLoading(true);
    const res = await login(email.trim(), password, role);
    setLoading(false);
    if (res.success) showToast('Welcome back! 👋', 'success');
    else showToast(res.error || 'Login failed', 'error');
  };

  const handleDemo = async () => {
    setLoading(true);
    const demoEmail = role === 'cooperative' ? 'farmer@test.com' : 'buyer@test.com';
    const res = await login(demoEmail, '1234', role);
    setLoading(false);
    if (res.success) showToast(`Demo ${role} login! 👋`, 'success');
    else showToast(res.error || 'Demo login failed', 'error');
  };

  return (
    <ScreenWrapper scrollable padded>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary + '15' }]}>
            <Leaf size={28} color={colors.primary} />
          </View>
          <Text style={[styles.brand, { color: colors.text }]}>IgiciroHub</Text>
          <Text style={[styles.brandSub, { color: colors.textSecondary }]}>Smart Farming Platform</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome back 👋</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to access your dashboard</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={[styles.roleRow, { backgroundColor: colors.surfaceVariant }]}>
          {(['cooperative', 'buyer'] as UserRole[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && { backgroundColor: colors.primary }]}
              onPress={() => setRole(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.roleText, { color: role === r ? '#FFFFFF' : colors.textSecondary }]}>
                {r === 'cooperative' ? '🌾 Cooperative' : '🛒 Buyer'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(500)} style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Phone size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: FONT.regular }]}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(500)} style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Lock size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: FONT.regular }]}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
          />
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
            {showPwd ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(550).duration(500)}>
          <GradientButton title="Sign In" onPress={handleLogin} loading={loading} />
        </Animated.View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Animated.View entering={FadeInDown.delay(650).duration(500)}>
          <TouchableOpacity
            style={[styles.demoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleDemo}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🧪</Text>
            <Text style={[styles.demoBtnText, { color: colors.text }]}>Demo Login ({role})</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(500)}>
          <GradientButton
            title="Continue as Guest"
            variant="outline"
            onPress={() => { loginAsGuest(); showToast('Browsing as Guest', 'info'); }}
          />
        </Animated.View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterChoice')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  logoCircle: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  brand: { fontSize: 22, fontFamily: FONT.bold },
  brandSub: { fontSize: 11, fontFamily: FONT.regular },
  title: { fontSize: 28, fontFamily: FONT.bold, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: FONT.regular, marginBottom: 20 },
  roleRow: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: 4, marginBottom: 20 },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' },
  roleText: { fontSize: 14, fontFamily: FONT.semibold },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, marginBottom: 12, gap: 12 },
  input: { flex: 1, fontSize: 14 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, fontFamily: FONT.medium },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: FONT.regular },
  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: RADIUS.lg, borderWidth: 1, gap: 10, marginBottom: 12 },
  demoBtnText: { fontSize: 14, fontFamily: FONT.medium },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 20 },
  footerText: { fontSize: 13, fontFamily: FONT.regular },
  footerLink: { fontSize: 13, fontFamily: FONT.semibold },
});