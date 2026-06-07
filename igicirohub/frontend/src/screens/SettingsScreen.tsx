import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { ArrowLeft, Globe, Bell, Shield, CircleHelp } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, SHADOWS } from '../theme/tokens';

export const SettingsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const items = [
    { icon: Globe, label: 'Language', value: 'English' },
    { icon: Bell, label: 'Push Notifications', toggle: true },
    { icon: Shield, label: 'Privacy Policy' },
    { icon: CircleHelp, label: 'Help & Support' },
  ];

  return (
    <ScreenWrapper scrollable padded tabScreen>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, marginBottom: 16 }}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
      <Text style={[{ fontSize: 22, fontFamily: FONT.bold, color: colors.text, marginBottom: 16 }]}>Settings ⚙️</Text>
      <View style={[{ borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface }, SHADOWS.sm]}>
        {items.map((item, i) => (
          <TouchableOpacity key={item.label} onPress={() => showToast(`${item.label} tapped`, 'info')} style={[{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: colors.borderLight }]} activeOpacity={0.7}>
            <View style={[{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 12 }]}><item.icon size={18} color={colors.primary} /></View>
            <Text style={[{ flex: 1, fontSize: 15, fontFamily: FONT.medium, color: colors.text }]}>{item.label}</Text>
            {item.value && <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary }]}>{item.value}</Text>}
            {item.toggle && <Switch value={true} trackColor={{ true: colors.primary }} onValueChange={() => showToast('Toggle changed', 'info')} />}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[{ textAlign: 'center', fontSize: 12, fontFamily: FONT.regular, color: colors.textMuted, marginTop: 32 }]}>IgiciroHub v1.0.0</Text>
    </ScreenWrapper>
  );
};
