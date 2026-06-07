import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export const ChatScreen = ({ route, navigation }: any) => {
  const { conversationId } = route.params || {};
  const { colors } = useTheme();
  const { session } = useAuth();
  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [conv, setConv] = useState<any>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!conversationId) { setLoading(false); return; }
    const { data } = await api.get<any>(`/chat/conversations/${conversationId}/`);
    if (data) { setMessages(data.messages); setConv(data.conversation); }
    setLoading(false);
  }, [conversationId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !conversationId) return;
    setSending(true);
    const { data, error } = await api.post<any>(`/chat/conversations/${conversationId}/reply/`, { content: text.trim() });
    if (error) { showToast(error, 'error'); setSending(false); return; }
    setText('');
    setMessages(prev => [...prev, data]);
    setSending(false);
  };

  if (loading) return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  const otherName = conv?.other_user_name || 'Seller';

  const renderMsg = ({ item }: any) => {
    const isMine = item.is_mine;
    return (
      <View style={[s.msgRow, isMine && s.msgRowRight]}>
        <View style={[s.bubble, isMine ? [s.bubbleMine, { backgroundColor: colors.primary }] : [s.bubbleOther, { backgroundColor: colors.surface }], SHADOWS.sm]}>
          <Text style={[s.bubbleText, { color: isMine ? '#fff' : colors.text }]}>{item.content}</Text>
          <Text style={[s.bubbleTime, { color: isMine ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBack}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerAvatar}>
          <Text style={[s.headerAvatarText, { color: colors.primary }]}>{otherName[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerName, { color: colors.text }]}>{otherName}</Text>
          {conv?.crop_name ? <Text style={[s.headerSub, { color: colors.textSecondary }]}>About: {conv.crop_name}</Text> : null}
        </View>
      </View>

      {messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36 }}>💬</Text>
          <Text style={[{ color: colors.textSecondary, fontFamily: FONT.regular, marginTop: 8 }]}>Start the conversation</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderMsg}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input */}
      <View style={[s.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={[s.input, { backgroundColor: colors.surfaceVariant, color: colors.text, fontFamily: FONT.regular }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={[s.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.surfaceVariant }]}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color={text.trim() ? '#fff' : colors.textMuted} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerBack: { padding: 4 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 18, fontFamily: FONT.bold },
  headerName: { fontSize: 16, fontFamily: FONT.semibold },
  headerSub: { fontSize: 11, fontFamily: FONT.regular },
  msgRow: { flexDirection: 'row', marginBottom: 10 },
  msgRowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: FONT.regular, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
