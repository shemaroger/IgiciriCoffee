import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft, Phone, MessageCircle, MapPin,
  Heart, Package, Edit2, Trash2, X, Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { useAuth } from '../auth/AuthContext';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';

// ── Defined OUTSIDE to prevent re-render on keystroke ─────────────────────
const EditField = ({ label, value, onChangeText, colors, keyboard, multiline }: any) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: colors.textSecondary, marginBottom: 6 }}>
      {label}
    </Text>
    <TextInput
      style={{
        borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1, fontSize: 14, fontFamily: FONT.regular,
        backgroundColor: colors.surfaceVariant, borderColor: colors.border,
        color: colors.text,
        minHeight: multiline ? 80 : undefined,
        textAlignVertical: multiline ? 'top' : undefined,
      }}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboard}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
    />
  </View>
);

export const CropDetailScreen = ({ route, navigation }: any) => {
  const { cropId } = route.params || {};
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const { session } = useAuth();

  const [crop, setCrop]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [saved, setSaved]           = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editModal, setEditModal]   = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [saving, setSaving]         = useState(false);

  // Edit state
  const [editName, setEditName]   = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty]     = useState('');
  const [editDesc, setEditDesc]   = useState('');
  const [editLoc, setEditLoc]     = useState('');

  const isOwner = !!(session?.id && crop?.farmer_id === session.id);

  useEffect(() => {
    (async () => {
      const { data } = await api.get<any>(`/crops/${cropId}/detail/`, false);
      if (data) {
        setCrop(data);
        setSaved(data.is_saved || false);
        setEditName(data.name || '');
        setEditPrice(String(data.price || ''));
        setEditQty(String(data.quantity || ''));
        setEditDesc(data.description || '');
        setEditLoc(data.location || data.district || '');
      }
      setLoading(false);
    })();
  }, [cropId]);

  const openEdit = () => {
    // Re-sync edit fields from current crop state
    setEditName(crop.name || '');
    setEditPrice(String(crop.price || ''));
    setEditQty(String(crop.quantity || ''));
    setEditDesc(crop.description || '');
    setEditLoc(crop.location || crop.district || '');
    setEditModal(true);
  };

  const handleSaveToggle = async () => {
    if (!session?.id) { showToast('Login to save crops', 'error'); return; }
    setSaveLoading(true);
    if (saved) {
      await api.delete(`/crops/${cropId}/unsave/`);
      setSaved(false); showToast('Removed from saved', 'info');
    } else {
      await api.post('/crops/save/', { crop_id: cropId });
      setSaved(true); showToast('Saved! ❤️', 'success');
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

  const handleEdit = async () => {
    if (!editName.trim()) {
      showToast('Name is required', 'error'); return;
    }
    setSaving(true);
    const { data, error } = await api.patch<any>(`/crops/${cropId}/update/`, {
      name:        editName.trim(),
      price:       parseFloat(editPrice) || crop.price,
      quantity:    parseFloat(editQty)   || crop.quantity,
      description: editDesc.trim(),
      location:    editLoc.trim(),
    });
    setSaving(false);
    if (error) { showToast(error, 'error'); return; }
    if (data) setCrop((prev: any) => ({ ...prev, ...data }));
    setEditModal(false);
    showToast('Listing updated! ✅', 'success');
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await api.delete(`/crops/${cropId}/delete/`);
    setDeleting(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Listing deleted', 'info');
    navigation.goBack();
  };

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (!crop) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.textSecondary, fontFamily: FONT.regular }}>Not found.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.primary }}>← Go back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero */}
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={s.hero}>
          <View style={s.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.navBtn}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {isOwner ? (
                <>
                  <TouchableOpacity onPress={openEdit} style={s.navBtn}>
                    <Edit2 size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={[s.navBtn, { backgroundColor: 'rgba(255,60,60,0.35)' }]}
                    disabled={deleting}
                  >
                    {deleting
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Trash2 size={18} color="#fff" />}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={handleSaveToggle} style={s.navBtn} disabled={saveLoading}>
                  <Heart
                    size={20}
                    color={saved ? '#FF6B6B' : '#fff'}
                    fill={saved ? '#FF6B6B' : 'transparent'}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={s.heroEmoji}>{crop.emoji || '☕'}</Text>
          <Text style={s.heroName}>{crop.name}</Text>
          <Text style={s.heroPrice}>{crop.price} RWF/{crop.unit}</Text>
          {isOwner && (
            <View style={s.ownerBadge}>
              <Text style={s.ownerBadgeText}>✏️ Your Listing</Text>
            </View>
          )}
        </LinearGradient>

        <View style={{ padding: SPACING.lg }}>
          {/* Info card */}
          <Animated.View entering={FadeInDown.duration(400)} style={[s.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            {[
              { icon: Package, label: 'Available', value: crop.quantity_display || `${crop.quantity} ${crop.unit}` },
              { icon: MapPin,  label: 'Location',  value: crop.location || crop.district || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <View key={label} style={s.infoRow}>
                <View style={[s.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Icon size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                  <Text style={[s.infoValue, { color: colors.text }]}>{value}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Seller card */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[s.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              {isOwner ? 'Your Cooperative' : 'Seller'}
            </Text>
            <View style={s.sellerRow}>
              <View style={[s.sellerAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[s.sellerAvatarText, { color: colors.primary }]}>
                  {(crop.farmer_name || 'C')[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[s.sellerName, { color: colors.text }]}>{crop.farmer_name || 'Cooperative'}</Text>
                {crop.farmer_phone
                  ? <Text style={[s.sellerPhone, { color: colors.textSecondary }]}>{crop.farmer_phone}</Text>
                  : null}
              </View>
            </View>
          </Animated.View>

          {/* Description */}
          {crop.description ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[s.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[s.descText, { color: colors.textSecondary }]}>{crop.description}</Text>
            </Animated.View>
          ) : null}

          {/* Action buttons */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={s.btnRow}>
            {isOwner ? (
              <>
                <TouchableOpacity style={[s.btn, { backgroundColor: colors.primary }]} onPress={openEdit}>
                  <Edit2 size={18} color="#fff" />
                  <Text style={[s.btnText, { color: '#fff' }]}>Edit Listing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: colors.error + '15' }]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting
                    ? <ActivityIndicator size="small" color={colors.error} />
                    : <Trash2 size={18} color={colors.error} />}
                  <Text style={[s.btnText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[s.btn, { backgroundColor: colors.success + '15' }]}>
                  <Phone size={18} color={colors.success} />
                  <Text style={[s.btnText, { color: colors.success }]}>Call Seller</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { backgroundColor: colors.primary }]} onPress={handleMessage}>
                  <MessageCircle size={18} color="#fff" />
                  <Text style={[s.btnText, { color: '#fff' }]}>Message</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Edit Listing ✏️</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <EditField
                label="Name *"
                value={editName}
                onChangeText={setEditName}
                colors={colors}
              />
              <EditField
                label="Price (RWF/kg) *"
                value={editPrice}
                onChangeText={setEditPrice}
                colors={colors}
                keyboard="numeric"
              />
              <EditField
                label="Quantity *"
                value={editQty}
                onChangeText={setEditQty}
                colors={colors}
                keyboard="numeric"
              />
              <EditField
                label="Location"
                value={editLoc}
                onChangeText={setEditLoc}
                colors={colors}
              />
              <EditField
                label="Description"
                value={editDesc}
                onChangeText={setEditDesc}
                colors={colors}
                multiline
              />
              <TouchableOpacity
                onPress={handleEdit}
                disabled={saving}
                style={[s.saveBtn, { backgroundColor: saving ? colors.primary + '80' : colors.primary }]}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <>
                      <Check size={18} color="#fff" />
                      <Text style={{ fontSize: 16, fontFamily: FONT.semibold, color: '#fff' }}>
                        Save Changes
                      </Text>
                    </>
                  )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  hero:             { paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  heroNav:          { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  navBtn:           { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroEmoji:        { fontSize: 64, marginBottom: 8 },
  heroName:         { fontSize: 24, fontFamily: FONT.bold, color: '#fff', marginBottom: 4 },
  heroPrice:        { fontSize: 18, fontFamily: FONT.semibold, color: 'rgba(255,255,255,0.85)' },
  ownerBadge:       { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  ownerBadgeText:   { fontSize: 12, fontFamily: FONT.medium, color: '#fff' },
  card:             { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  infoRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  infoIcon:         { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoLabel:        { fontSize: 11, fontFamily: FONT.regular },
  infoValue:        { fontSize: 15, fontFamily: FONT.medium, marginTop: 1 },
  sectionTitle:     { fontSize: 14, fontFamily: FONT.semibold, marginBottom: 12 },
  sellerRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerAvatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sellerAvatarText: { fontSize: 20, fontFamily: FONT.bold },
  sellerName:       { fontSize: 15, fontFamily: FONT.semibold },
  sellerPhone:      { fontSize: 13, fontFamily: FONT.regular, marginTop: 2 },
  descText:         { fontSize: 14, fontFamily: FONT.regular, lineHeight: 22 },
  btnRow:           { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn:              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.lg },
  btnText:          { fontSize: 15, fontFamily: FONT.semibold },
  modalBox:         { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40, maxHeight: '92%' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:       { fontSize: 18, fontFamily: FONT.semibold },
  saveBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: RADIUS.lg, paddingVertical: 14, marginTop: 8, marginBottom: 8 },
});