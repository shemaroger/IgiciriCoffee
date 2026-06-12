import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Coffee ONLY ────────────────────────────────────────────────────────────
const COFFEE_VARIETIES = [
  { name: 'Bourbon Arabica', emoji: '☕', type: 'arabica' },
  { name: 'Red Bourbon',     emoji: '☕', type: 'arabica' },
  { name: 'Yellow Bourbon',  emoji: '☕', type: 'arabica' },
  { name: 'Jackson',         emoji: '☕', type: 'arabica' },
  { name: 'Mibirizi',        emoji: '☕', type: 'arabica' },
  { name: 'Robusta',         emoji: '🫘', type: 'robusta' },
];

const PROCESSING_TYPES = [
  'Cherry (Fresh)',
  'Parchment (Dried)',
  'Green Bean (Export)',
  'Fully Washed',
  'Natural Process',
  'Honey Process',
];

const UNITS    = ['kg', 'bag', 'tonne'];
const STATUSES = ['listed', 'harvesting', 'sold', 'inactive'];

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
        {value}
      </Text>
      <ChevronDown size={16} color={colors.textMuted} />
    </TouchableOpacity>
  </View>
);

export const AddCropScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();

  const [variety, setVariety]       = useState(COFFEE_VARIETIES[0]);
  const [processing, setProcessing] = useState(PROCESSING_TYPES[0]);
  const [qty, setQty]               = useState('');
  const [unit, setUnit]             = useState('kg');
  const [price, setPrice]           = useState('');
  const [location, setLocation]     = useState('');
  const [district, setDistrict]     = useState('');
  const [description, setDesc]      = useState('');
  const [status, setStatus]         = useState('listed');
  const [loading, setLoading]       = useState(false);
  const [picker, setPicker]         = useState<any>(null);

  const handlePost = async () => {
    if (!qty)             { showToast('Quantity is required', 'error'); return; }
    if (!price)           { showToast('Price is required', 'error'); return; }
    if (!location.trim()) { showToast('Location is required', 'error'); return; }

    setLoading(true);
    const { error } = await api.post<any>('/crops/create/', {
      name:        `${variety.name} — ${processing}`,
      emoji:       variety.emoji,
      category:    'other',
      quantity:    parseFloat(qty),
      unit,
      price:       parseFloat(price),
      location:    location.trim(),
      district:    district.trim() || location.trim(),
      description: description.trim() ||
        `${variety.name} coffee, ${processing}. ${variety.type === 'arabica' ? 'Arabica' : 'Robusta'} variety.`,
      status,
    });
    setLoading(false);

    if (error) { showToast(error, 'error'); return; }

    showToast('Listing posted! ☕', 'success');
    setQty(''); setPrice('');
    setLocation(''); setDistrict(''); setDesc('');
    setVariety(COFFEE_VARIETIES[0]);
    setProcessing(PROCESSING_TYPES[0]);
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
          <Text style={s.headerTitle}>New Coffee Listing ☕</Text>
          <Text style={s.headerSub}>Post your coffee for buyers</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Section 1: Coffee Variety ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>☕ Select Variety</Text>
          <View style={{ gap: 8 }}>
            {COFFEE_VARIETIES.map((v) => (
              <TouchableOpacity
                key={v.name}
                onPress={() => setVariety(v)}
                style={[s.varietyRow, {
                  backgroundColor: variety.name === v.name ? colors.primary + '12' : colors.surfaceVariant,
                  borderColor:     variety.name === v.name ? colors.primary : 'transparent',
                }]}
              >
                <Text style={{ fontSize: 22 }}>{v.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14, fontFamily: FONT.semibold,
                    color: variety.name === v.name ? colors.primary : colors.text,
                  }}>
                    {v.name}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted }}>
                    {v.type === 'robusta' ? 'Robusta variety' : 'Arabica variety'}
                  </Text>
                </View>
                {variety.name === v.name && (
                  <View style={[s.checkCircle, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Section 2: Processing Type ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>📦 Processing Type</Text>
          <PickerField
            label="How is the coffee processed?"
            value={processing}
            colors={colors}
            onPress={() => setPicker({ label: 'Processing Type', options: PROCESSING_TYPES, onSelect: setProcessing })}
          />

          {/* Listing preview */}
          <View style={[s.previewBox, { backgroundColor: colors.primary + '10', marginTop: 12 }]}>
            <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textSecondary }}>
              Listing name preview:
            </Text>
            <Text style={{ fontSize: 14, fontFamily: FONT.semibold, color: colors.primary, marginTop: 2 }}>
              {variety.emoji} {variety.name} — {processing}
            </Text>
          </View>
        </Animated.View>

        {/* ── Section 3: Quantity & Price ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
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
              label="Farm Gate Price (RWF/kg) *"
              placeholder="e.g. 1580"
              value={price}
              onChangeText={setPrice}
              colors={colors}
              keyboardType="numeric"
            />

            {price && qty ? (
              <View style={[s.previewBox, { backgroundColor: colors.success + '10' }]}>
                <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textSecondary }}>
                  Total estimated value:
                </Text>
                <Text style={{ fontSize: 14, fontFamily: FONT.semibold, color: colors.success, marginTop: 2 }}>
                  {(parseFloat(qty) * parseFloat(price)).toLocaleString()} RWF
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* ── Section 4: Location ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>📍 Location</Text>
          <View style={{ gap: 14 }}>
            <Field
              label="Village / Sector *"
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

        {/* ── Section 5: Details ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={[s.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>📝 Details</Text>
          <View style={{ gap: 14 }}>
            <Field
              label="Description (optional)"
              placeholder="Quality, altitude, certifications, lot number..."
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
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={{ gap: 8 }}>
          <GradientButton
            title="Post Coffee Listing ☕"
            onPress={handlePost}
            loading={loading}
          />
          <Text style={[s.hint, { color: colors.textMuted }]}>
            Visible to all buyers on the coffee marketplace
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
                    {item}
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
  varietyRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5 },
  checkCircle:  { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  previewBox:   { borderRadius: RADIUS.lg, padding: 12, gap: 2 },
  hint:         { fontSize: 11, fontFamily: FONT.regular, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox:     { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 },
  modalTitle:   { fontSize: 18, fontFamily: FONT.semibold, marginBottom: 12 },
  modalItem:    { paddingVertical: 14, borderBottomWidth: 1 },
});