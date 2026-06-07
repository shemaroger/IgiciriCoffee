import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { useAuth } from '../auth/AuthContext';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { api } from '../services/api';

const QUICK_MESSAGES = [
  'Is this still available?',
  'Can you do bulk discount?',
  'What is the minimum order?',
  'Can you deliver to Kigali?',
  'Is the price negotiable?',
];

export const MessagePreviewScreen = ({ route, navigation }: any) => {
  const { cropId, cropName, price, unit, farmerId } = route.params || {};
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const { session } = useAuth();
  const [msg, setMsg] = useState(
    `Hello, I am interested in your ${cropName || 'product'} listed at ${price || ''} RWF/${unit || 'kg'}. Is it still available? I would like to discuss quantity and delivery options.`
  );
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!session?.id) { showToast('Login to send messages', 'error'); return; }
    if (!msg.trim())  { showToast('Write a message first', 'error'); return; }

    let resolvedFarmerId = farmerId;
    if (!resolvedFarmerId && cropId) {
      const { data } = await api.get<any>(`/crops/${cropId}/detail/`, false);
      resolvedFarmerId = data?.farmer_id;
    }
    if (!resolvedFarmerId) { showToast('Could not find seller', 'error'); return; }

    setLoading(true);
    const { data, error } = await api.post<any>('/chat/send/', {
      farmer_id:  resolvedFarmerId,
      crop_name:  cropName || '',
      crop_price: price || null,
      crop_unit:  unit || 'kg',
      content:    msg.trim(),
    });
    setLoading(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Message sent! 📨', 'success');
    navigation.navigate('Chat', { conversationId: data.conversation_id });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, marginBottom: 16 }}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[s.title, { color: colors.text }]}>Contact Seller 💬</Text>

          {/* Crop info card */}
          <View style={[s.cropCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            <Text style={[s.cropCardLabel, { color: colors.textSecondary }]}>Enquiring about</Text>
            <Text style={[s.cropCardName, { color: colors.text }]}>☕ {cropName}</Text>
            <View style={s.cropCardRow}>
              <View style={[s.cropCardBadge, { backgroundColor: colors.primary + '12' }]}>
                <Text style={[s.cropCardBadgeText, { color: colors.primary }]}>
                  {price} RWF/{unit || 'kg'}
                </Text>
              </View>
              <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted }]}>
                Farm gate price
              </Text>
            </View>
          </View>

          {/* Quick message chips */}
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>Quick messages</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {QUICK_MESSAGES.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => setMsg(q)}
                style={[s.quickChip, {
                  backgroundColor: msg === q ? colors.primary : colors.surfaceVariant,
                  borderColor: msg === q ? colors.primary : colors.border,
                }]}
              >
                <Text style={[s.quickChipText, { color: msg === q ? '#FFFFFF' : colors.textSecondary }]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Message input */}
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>Your message</Text>
          <TextInput
            multiline
            numberOfLines={7}
            style={[s.textArea, {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
              color: colors.text,
              fontFamily: FONT.regular,
            }]}
            value={msg}
            onChangeText={setMsg}
            textAlignVertical="top"
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[s.charCount, { color: colors.textMuted }]}>{msg.length} characters</Text>

          {/* Tips */}
          <View style={[s.tipsCard, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[s.tipsTitle, { color: colors.text }]}>💡 Tips for good offers</Text>
            <Text style={[s.tipsText, { color: colors.textSecondary }]}>
              • Mention your desired quantity{'\n'}
              • Ask about delivery or pickup options{'\n'}
              • Inquire about payment terms{'\n'}
              • Be respectful and professional
            </Text>
          </View>

          <GradientButton
            title="Send Message 📨"
            onPress={handleSend}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  title:            { fontSize: 22, fontFamily: FONT.bold, marginBottom: 16 },
  cropCard:         { borderRadius: RADIUS.xl, padding: 16, marginBottom: 20 },
  cropCardLabel:    { fontSize: 11, fontFamily: FONT.regular, marginBottom: 4 },
  cropCardName:     { fontSize: 17, fontFamily: FONT.bold, marginBottom: 8 },
  cropCardRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cropCardBadge:    { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full },
  cropCardBadgeText:{ fontSize: 13, fontFamily: FONT.semibold },
  sectionLabel:     { fontSize: 12, fontFamily: FONT.medium, marginBottom: 8 },
  quickChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, marginRight: 8, borderWidth: 1 },
  quickChipText:    { fontSize: 12, fontFamily: FONT.regular },
  textArea:         { borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, fontSize: 14, minHeight: 160 },
  charCount:        { fontSize: 11, fontFamily: FONT.regular, textAlign: 'right', marginTop: 4, marginBottom: 16 },
  tipsCard:         { borderRadius: RADIUS.lg, padding: 14, marginBottom: 8 },
  tipsTitle:        { fontSize: 13, fontFamily: FONT.semibold, marginBottom: 6 },
  tipsText:         { fontSize: 12, fontFamily: FONT.regular, lineHeight: 20 },
});