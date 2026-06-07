import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Settings, Mic, ChevronRight, LogOut, Moon, Sun, Leaf, Heart, ShoppingBag, Sprout, Edit2, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { useAppToast } from '../hooks/useAppToast';
import { profileShowsListings, profileShowsOrders, profileShowsSaved } from '../auth/rbac';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import type { ThemeMode } from '../theme/tokens';
import { api } from '../services/api';

export const ProfileScreen = ({ navigation }: any) => {
  const { colors, mode, setMode } = useTheme();
  const { session, logout, refreshUser } = useAuth();
  const { showToast } = useAppToast();
  const role = session?.role;
  const name = session?.displayName ?? 'Guest';

  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editPhone, setEditPhone] = useState(session?.phone || '');
  const [editLocation, setEditLocation] = useState(session?.location || '');
  const [saving, setSaving] = useState(false);

  const themes: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
    { key: 'light', icon: Sun, label: 'Light' },
    { key: 'dark', icon: Moon, label: 'Dark' },
    { key: 'nature', icon: Leaf, label: 'Nature' },
  ];

  const menuItems = [
    ...(profileShowsListings(role) ? [{ icon: Sprout, label: 'My Crops', route: 'MyCrops' }] : []),
    ...(profileShowsOrders(role) ? [{ icon: ShoppingBag, label: 'My Orders', route: 'Orders' }] : []),
    ...(profileShowsSaved(role) ? [{ icon: Heart, label: 'Saved Crops', route: 'SavedCrops' }] : []),
    { icon: Bell, label: 'Notifications', route: 'Notifications' },
    { icon: Mic, label: 'Voice Assistant', route: 'VoiceAssistant' },
    { icon: Settings, label: 'Settings', route: 'Settings' },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await api.patch('/auth/profile/update/', {
      display_name: editName,
      phone: editPhone,
      location: editLocation,
    });
    setSaving(false);
    if (error) { showToast(error, 'error'); return; }
    await refreshUser();
    showToast('Profile updated! ✅', 'success');
    setEditModal(false);
  };

  const handleLogout = () => { logout(); showToast('Logged out', 'info'); };

  const roleLabel = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : 'Guest';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.banner}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.avatarSection}>
          <TouchableOpacity onPress={() => {
            setEditName(name);
            setEditPhone(session?.phone || '');
            setEditLocation(session?.location || '');
            setEditModal(true);
          }}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.editBadge}>
              <Edit2 size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.nameText}>{name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
          {session?.district ? (
            <Text style={styles.locationText}>📍 {session.district}</Text>
          ) : null}
        </Animated.View>
      </LinearGradient>

      {/* Theme */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.themeCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
        <Text style={[styles.themeLabel, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeRow}>
          {themes.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => { setMode(t.key); showToast(`${t.label} mode`, 'info'); }}
              style={[styles.themeBtn, { backgroundColor: mode === t.key ? colors.primary : colors.surfaceVariant }]}
            >
              <t.icon size={16} color={mode === t.key ? '#FFFFFF' : colors.textSecondary} />
              <Text style={[styles.themeBtnText, { color: mode === t.key ? '#FFFFFF' : colors.textSecondary }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Menu */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.menuSection}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => navigation.navigate(item.route)}
            style={[
              styles.menuItem,
              { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
              i === menuItems.length - 1 && { borderBottomWidth: 0 },
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + '12' }]}>
              <item.icon size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.logoutSection}>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.error + '10' }]}
        >
          <LogOut size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setEditModal(false)}
        >
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Display Name', value: editName, setter: setEditName, keyboard: undefined },
              { label: 'Phone', value: editPhone, setter: setEditPhone, keyboard: 'phone-pad' as const },
              { label: 'Location', value: editLocation, setter: setEditLocation, keyboard: undefined },
            ].map(({ label, value, setter, keyboard }) => (
              <View key={label} style={{ marginBottom: 14 }}>
                <Text style={[{ fontSize: 12, fontFamily: FONT.medium, color: colors.textSecondary, marginBottom: 4 }]}>
                  {label}
                </Text>
                <TextInput
                  style={[{
                    borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12,
                    borderWidth: 1, fontSize: 14, fontFamily: FONT.regular,
                    backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text,
                  }]}
                  value={value}
                  onChangeText={setter}
                  keyboardType={keyboard}
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              style={{ backgroundColor: colors.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ fontSize: 16, fontFamily: FONT.semibold, color: '#fff' }}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { paddingTop: 60, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatarSection: { alignItems: 'center' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontFamily: FONT.bold, color: '#FFFFFF' },
  editBadge: { position: 'absolute', bottom: 10, right: -4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 },
  nameText: { fontSize: 22, fontFamily: FONT.bold, color: '#FFFFFF' },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 4, borderRadius: RADIUS.full, marginTop: 6 },
  roleText: { fontSize: 12, fontFamily: FONT.medium, color: '#FFFFFF' },
  locationText: { fontSize: 11, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  themeCard: { marginHorizontal: SPACING.lg, marginTop: -16, borderRadius: RADIUS.xl, padding: 16 },
  themeLabel: { fontSize: 14, fontFamily: FONT.semibold, marginBottom: 10 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md },
  themeBtnText: { fontSize: 12, fontFamily: FONT.medium },
  menuSection: { marginHorizontal: SPACING.lg, marginTop: 16, borderRadius: RADIUS.xl, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: FONT.medium },
  logoutSection: { paddingHorizontal: SPACING.lg, marginTop: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.lg },
  logoutText: { fontSize: 15, fontFamily: FONT.semibold },
  modalBox: { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: FONT.semibold },
});