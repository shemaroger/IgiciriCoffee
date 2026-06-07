import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Send } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { useAuth } from '../auth/AuthContext';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { api } from '../services/api';

export const MessagePreviewScreen = ({ route, navigation }: any) => {
  const { cropId, cropName, price, unit, farmerId } = route.params || {};
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const { session } = useAuth();
  const [msg, setMsg] = useState(
    `Hello, I am interested in your ${cropName || 'crop'} listed at ${price || ''} RWF/${unit || 'kg'}. Is it still available? I would like to discuss quantity and delivery options.`
  );
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!session?.id) { showToast('Login to send messages', 'error'); return; }
    if (!msg.trim()) { showToast('Write a message first', 'error'); return; }

    // farmerId may come from crop detail; fallback to looking it up
    let resolvedFarmerId = farmerId;
    if (!resolvedFarmerId && cropId) {
      const { data } = await api.get<any>(`/crops/${cropId}/detail/`, false);
      resolvedFarmerId = data?.farmer_id;
    }
    if (!resolvedFarmerId) { showToast('Could not find seller', 'error'); return; }

    setLoading(true);
    const { data, error } = await api.post<any>('/chat/send/', {
      farmer_id: resolvedFarmerId,
      crop_name: cropName || '',
      crop_price: price || null,
      crop_unit: unit || 'kg',
      content: msg.trim(),
    });
    setLoading(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Message sent! 📨', 'success');
    navigation.navigate('Chat', { conversationId: data.conversation_id });
  };

  return (
    <ScreenWrapper scrollable padded>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, marginBottom: 16 }}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>

      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[s.title, { color: colors.text }]}>Send Message 💬</Text>

        <View style={[s.cropBadge, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[s.cropBadgeText, { color: colors.primary }]}>
            🌾 {cropName} · {price} RWF/{unit}
          </Text>
        </View>

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

        <GradientButton title="Send Message" onPress={handleSend} loading={loading} style={{ marginTop: 20 }} />
      </Animated.View>
    </ScreenWrapper>
  );
};

const s = StyleSheet.create({
  title: { fontSize: 22, fontFamily: FONT.bold, marginBottom: 16 },
  cropBadge: { borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  cropBadgeText: { fontSize: 13, fontFamily: FONT.medium },
  textArea: { borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, fontSize: 14, minHeight: 160 },
});
