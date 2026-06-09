import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, ChevronDown, MapPin, Tag, FileText, Hash } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = ['other', 'vegetables', 'grains', 'fruits', 'tubers', 'legumes'];
const UNITS      = ['kg', 'bunch', 'bag', 'tonne', 'crate', 'box'];
const STATUSES   = ['listed', 'harvesting', 'sold', 'inactive'];
const EMOJIS     = ['☕', '🫘', '🍃', '🌼', '🌶️', '🥜', '🥑', '🥔', '🌽', '🍅', '🥕', '🍌', '🍚', '🌾', '🥦', '🍎', '🌱', '🫑'];

// ── Defined OUTSIDE to prevent letter-by-letter input bug ─────────────────
const Field = ({ label, value, onChangeText, colors, style, ...props }: any) => (
  <View style={{ gap: 6 }}>
    <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
    <TextInput
      style={[s.input, {
        backgroundColor: colors.surfaceVariant,
        borderColor: colors.border,
        color: colors.text,
        fontFamily: FONT.regular,
      }, style]}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
  </View>
);

const PickerField = ({ label, value, colors, onPress }: any) => (
  <View style={{ gap: 6 }}>
    <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
    <TouchableOpacity
      onPress={onPress}
      style={[s.dropdown, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
    >
      <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: colors.text, flex: 1 }}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Text>
      <ChevronDown size={16} color={colors.textMuted} />
    </TouchableOpacity>
  </View>
);

export const AddCropScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();

  const [name, setName]         = useState('');
  const [emoji, setEmoji]       = useState('☕');
  const [category, setCategory] = useState('other');
  const [qty, setQty]           = useState('');
  const [unit, setUnit]         = useState('kg');
  const [price, setPrice]       = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('');
  const [description, setDesc]  = useState('');
  const [status, setStatus]     = useState('listed');
  const [loading, setLoading]   = useState(false);
  const [picker, setPicker]     = useState<any>(null);

  const handlePost = async () => {
    if (!name.trim())     { showToast('Name is required', 'error'); return; }
    if (!qty)             { showToast('Quantity is required', 'error'); return; }
    if (!price)           { showToast('Price is required', 'error'); return; }
    if (!location.trim()) { showToast('Location is required', 'error'); return; }

    setLoading(true);
    const { error } = await api.post<any>('/crops/create/', {
      name: name.trim(), emoji, category,
      quantity: parseFloat(qty), unit,
      price: parseFloat(price),
      location: location.trim(),
      district: district.trim() || location.trim(),
      description: description.trim(),
      status,
    });
    setLoading(false);

    if (error) { showToast(error, 'error'); return; }

    showToast('Listing posted! ☕', 'success');
    setName(''); setQty(''); setPrice('');
    setLocation(''); setDistrict(''); setDesc('');
    setEmoji('☕'); setCategory('other');
    setUnit('kg'); setStatus('listed');
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>New Listing ☕</Text>
          <Text style={s.headerSub}>Post your coffee or cash crop</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Section 1: Basic Info ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>📋 Basic Info</Text>
          <View style={{ gap: 14 }}>
            <Field
              label="Crop / Product Name *"
              placeholder="e.g. Arabica Bourbon Cherry"
              value={name}
              onChangeText={setName}
              colors={colors}
            />

            <View style={{ gap: 6 }}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Select Emoji</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {EMOJIS.map(e => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => setEmoji(e)}
                    style={[s.emojiBtn, {
                      backgroundColor: emoji === e ? colors.primary + '20' : colors.surfaceVariant,
                      borderColor: emoji === e ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <PickerField
              label="Category"
              value={category}
              colors={colors}
              onPress={() => setPicker({ label: 'Category', options: CATEGORIES, onSelect: setCategory })}
            />
          </View>
        </Animated.View>

        {/* ── Section 2: Quantity & Price ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>💰 Quantity & Price</Text>
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Field
                  label="Quantity *"
                  placeholder="e.g. 500"
                  value={qty}
                  onChangeText={setQty}
                  colors={colors}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <PickerField
                  label="Unit"
                  value={unit}
                  colors={colors}
                  onPress={() => setPicker({ label: 'Unit', options: UNITS, onSelect: setUnit })}
                />
              </View>
            </View>

            <Field
              label="Price per unit (RWF) *"
              placeholder="e.g. 1580"
              value={price}
              onChangeText={setPrice}
              colors={colors}
              keyboardType="numeric"
            />

            {price ? (
              <View style={[s.pricePreview, { backgroundColor: colors.primary + '10' }]}>
                <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: colors.textSecondary }}>
                  Preview:
                </Text>
                <Text style={{ fontSize: 14, fontFamily: FONT.semibold, color: colors.primary }}>
                  {emoji} {name || 'Your crop'} — {price} RWF/{unit}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* ── Section 3: Location ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>📍 Location</Text>
          <View style={{ gap: 14 }}>
            <Field
              label="Location / Village *"
              placeholder="e.g. Huye Town"
              value={location}
              onChangeText={setLocation}
              colors={colors}
            />
            <Field
              label="District"
              placeholder="e.g. Huye"
              value={district}
              onChangeText={setDistrict}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* ── Section 4: Description & Status ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>📝 Details</Text>
          <View style={{ gap: 14 }}>
            <Field
              label="Description"
              placeholder="Describe your crop — variety, quality, how it was processed..."
              value={description}
              onChangeText={setDesc}
              colors={colors}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <PickerField
              label="Listing Status"
              value={status}
              colors={colors}
              onPress={() => setPicker({ label: 'Status', options: STATUSES, onSelect: setStatus })}
            />
          </View>
        </Animated.View>

        {/* ── Submit ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ gap: 8 }}>
          <GradientButton
            title="Post Listing ☕"
            onPress={handlePost}
            loading={loading}
          />
          <Text style={[s.hint, { color: colors.textMuted }]}>
            Your listing will be visible to all buyers on the marketplace
          </Text>
        </Animated.View>

      </ScrollView>

      {/* ── Picker Modal ── */}
      <Modal visible={!!picker} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setPicker(null)}
        >
          <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              Select {picker?.label}
            </Text>
            <FlatList
              data={picker?.options || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { picker?.onSelect(item); setPicker(null); }}
                  style={[s.modalItem, { borderBottomColor: colors.borderLight }]}
                >
                  <Text style={{ fontSize: 15, fontFamily: FONT.regular, color: colors.text }}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 320 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 20 },
  backBtn:      { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 20, fontFamily: FONT.bold, color: '#fff' },
  headerSub:    { fontSize: 12, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  section:      { borderRadius: RADIUS.xl, padding: 16 },
  sectionTitle: { fontSize: 14, fontFamily: FONT.semibold, marginBottom: 14 },
  label:        { fontSize: 12, fontFamily: FONT.medium },
  input:        { borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, fontSize: 14 },
  dropdown:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1 },
  emojiBtn:     { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5 },
  pricePreview: { borderRadius: RADIUS.lg, padding: 12, gap: 2 },
  hint:         { fontSize: 11, fontFamily: FONT.regular, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox:     { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 },
  modalTitle:   { fontSize: 18, fontFamily: FONT.semibold, marginBottom: 12 },
  modalItem:    { paddingVertical: 14, borderBottomWidth: 1 },
});