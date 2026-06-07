import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS } from '../theme/tokens';
import { api } from '../services/api';

const CATEGORIES = ['vegetables','grains','fruits','tubers','legumes','other'];
const UNITS      = ['kg','bunch','bag','tonne','crate','box'];
const STATUSES   = ['listed','harvesting','sold','inactive'];
const EMOJIS     = ['☕','🫘','🍃','🌼','🌶️','🥜','🥑','🥔','🌽','🍅','🥕','🍌','🍚','🌾','🥦','🍎','🌱','🫑'];

const Field = ({ label, value, onChangeText, colors, style, ...props }: any) => (
  <View style={{ gap: 4 }}>
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
  <View style={{ gap: 4 }}>
    <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
    <TouchableOpacity
      onPress={onPress}
      style={[s.dropdown, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
    >
      <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: colors.text }}>{value}</Text>
      <ChevronDown size={16} color={colors.textMuted} />
    </TouchableOpacity>
  </View>
);

export const AddCropScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
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
    if (!name.trim() || !qty || !price) {
      showToast('Name, quantity and price are required', 'error'); return;
    }
    setLoading(true);
    const { data, error } = await api.post<any>('/crops/create/', {
      name: name.trim(), emoji, category,
      quantity: parseFloat(qty), unit, price: parseFloat(price),
      location: location.trim(), district: district.trim(),
      description: description.trim(), status,
    });
    setLoading(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Listing posted! ☕', 'success');
    setName(''); setQty(''); setPrice('');
    setLocation(''); setDistrict(''); setDesc('');
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, marginBottom: 16 }}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[s.title, { color: colors.text }]}>Add New Listing ☕</Text>

          <View style={{ gap: 14, marginTop: 20 }}>

            <Field
              label="Name *"
              placeholder="e.g. Arabica Bourbon Cherry"
              value={name}
              onChangeText={setName}
              colors={colors}
            />

            <View style={{ gap: 4 }}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Emoji</Text>
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

            <Field
              label="Location"
              placeholder="e.g. Huye"
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

            <Field
              label="Description"
              placeholder="Describe your crop or product..."
              value={description}
              onChangeText={setDesc}
              colors={colors}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />

            <PickerField
              label="Status"
              value={status}
              colors={colors}
              onPress={() => setPicker({ label: 'Status', options: STATUSES, onSelect: setStatus })}
            />

            <GradientButton
              title="Post Listing ☕"
              onPress={handlePost}
              loading={loading}
              style={{ marginTop: 8 }}
            />

          </View>
        </Animated.View>
      </ScrollView>

      <Modal visible={!!picker} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setPicker(null)}
        >
          <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Select {picker?.label}</Text>
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
              style={{ maxHeight: 300 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  title:        { fontSize: 22, fontFamily: FONT.bold },
  label:        { fontSize: 12, fontFamily: FONT.medium },
  input:        { borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, fontSize: 14 },
  dropdown:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1 },
  emojiBtn:     { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox:     { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 },
  modalTitle:   { fontSize: 18, fontFamily: FONT.semibold, marginBottom: 12 },
  modalItem:    { paddingVertical: 14, borderBottomWidth: 1 },
});