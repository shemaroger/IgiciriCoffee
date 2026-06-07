import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Phone, MessageCircle, MapPin, Heart, HeartOff, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { useAuth } from '../auth/AuthContext';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';

export const CropDetailScreen = ({ route, navigation }: any) => {
  const { cropId } = route.params || {};
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const { session } = useAuth();
  const [crop, setCrop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.get<any>(`/crops/${cropId}/detail/`, false);
      if (data) { setCrop(data); setSaved(data.is_saved || false); }
      setLoading(false);
    })();
  }, [cropId]);

  const handleSave = async () => {
    if (!session?.id) { showToast('Login to save crops', 'error'); return; }
    setSaveLoading(true);
    if (saved) {
      await api.delete(`/crops/${cropId}/unsave/`);
      setSaved(false); showToast('Removed from saved', 'info');
    } else {
      await api.post('/crops/save/', { crop_id: cropId });
      setSaved(true); showToast('Crop saved! ❤️', 'success');
    }
    setSaveLoading(false);
  };

  const handleMessage = () => {
    if (!crop) return;
    navigation.navigate('MessagePreview', {
      cropId: crop.id, cropName: crop.name,
      price: parseFloat(crop.price), unit: crop.unit,
      farmerId: crop.farmer_id,
    });
  };

  if (loading) return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (!crop) return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: colors.background }]}>
      <Text style={[{ color: colors.textSecondary, fontFamily: FONT.regular }]}>Crop not found.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}><Text style={{ color: colors.primary }}>← Go back</Text></TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={[{ flex: 1, backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Header */}
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={s.hero}>
        <View style={s.heroNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.navBtn}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={s.navBtn} disabled={saveLoading}>
            {saved ? <Heart size={20} color="#FF6B6B" fill="#FF6B6B" /> : <Heart size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
        <Text style={s.heroEmoji}>{crop.emoji || '🌱'}</Text>
        <Text style={s.heroName}>{crop.name}</Text>
        <Text style={s.heroPrice}>{crop.price} RWF/{crop.unit}</Text>
      </LinearGradient>

      <View style={{ padding: SPACING.lg }}>
        <Animated.View entering={FadeInDown.duration(400)} style={[s.infoCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          {[
            { icon: Package, label: 'Available', value: crop.quantity_display },
            { icon: MapPin,  label: 'Location',  value: crop.location || crop.district || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <View key={label} style={s.infoRow}>
              <View style={[s.infoIcon, { backgroundColor: colors.primary + '15' }]}><Icon size={18} color={colors.primary} /></View>
              <View>
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[s.infoValue, { color: colors.text }]}>{value}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[s.infoCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Seller</Text>
          <View style={s.sellerRow}>
            <View style={[s.sellerAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[s.sellerAvatarText, { color: colors.primary }]}>{(crop.farmer_name || 'F')[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={[s.sellerName, { color: colors.text }]}>{crop.farmer_name || 'Farmer'}</Text>
              {crop.farmer_phone ? <Text style={[s.sellerPhone, { color: colors.textSecondary }]}>{crop.farmer_phone}</Text> : null}
            </View>
          </View>
        </Animated.View>

        {crop.description ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[s.infoCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[s.descText, { color: colors.textSecondary }]}>{crop.description}</Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={s.btnRow}>
          <TouchableOpacity style={[s.callBtn, { backgroundColor: colors.success + '15' }]}>
            <Phone size={20} color={colors.success} />
            <Text style={[s.callBtnText, { color: colors.success }]}>Call Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.msgBtn, { backgroundColor: colors.primary }]} onPress={handleMessage}>
            <MessageCircle size={20} color="#fff" />
            <Text style={[s.msgBtnText]}>Message</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  hero: { paddingTop: 56, paddingBottom: 32, alignItems: 'center' },
  heroNav: { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  navBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 64, marginBottom: 8 },
  heroName: { fontSize: 24, fontFamily: FONT.bold, color: '#fff', marginBottom: 4 },
  heroPrice: { fontSize: 18, fontFamily: FONT.semibold, color: 'rgba(255,255,255,0.85)' },
  infoCard: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, fontFamily: FONT.regular },
  infoValue: { fontSize: 15, fontFamily: FONT.medium, marginTop: 1 },
  sectionTitle: { fontSize: 14, fontFamily: FONT.semibold, marginBottom: 12 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sellerAvatarText: { fontSize: 20, fontFamily: FONT.bold },
  sellerName: { fontSize: 15, fontFamily: FONT.semibold },
  sellerPhone: { fontSize: 13, fontFamily: FONT.regular, marginTop: 2 },
  descText: { fontSize: 14, fontFamily: FONT.regular, lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.lg },
  callBtnText: { fontSize: 15, fontFamily: FONT.semibold },
  msgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.lg },
  msgBtnText: { fontSize: 15, fontFamily: FONT.semibold, color: '#fff' },
});
