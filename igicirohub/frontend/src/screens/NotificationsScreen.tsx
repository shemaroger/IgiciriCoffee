import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Bell, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { api } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Helper: extract text from last_message (object or string) ─────────────
const getLastMessageText = (last_message: any): string => {
  if (!last_message) return 'Start chatting...';
  if (typeof last_message === 'string') return last_message;
  if (typeof last_message === 'object') {
    return last_message.content || last_message.message || last_message.text || 'New message';
  }
  return 'New message';
};

const getTimeAgo = (dateStr: string): string => {
  if (!dateStr) return '';
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

export const NotificationsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [convs, setConvs]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get<any[]>('/chat/conversations/');
    if (data) setConvs(data);
    setLoading(false); setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalUnread = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const getOtherUserName = (c: any): string => {
    if (c.other_user_name) return c.other_user_name;
    if (typeof c.other_user === 'object') return c.other_user?.display_name || c.other_user?.username || 'User';
    return 'User';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontFamily: FONT.bold, color: '#fff' }}>
              Messages 💬
            </Text>
            <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.75)' }}>
              {totalUnread > 0
                ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
                : 'All conversations'}
            </Text>
          </View>
          {totalUnread > 0 && (
            <View style={{ backgroundColor: colors.error, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontFamily: FONT.semibold }}>
                {totalUnread}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
        >
          {convs.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Bell size={32} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontFamily: FONT.semibold, marginBottom: 6 }}>
                No messages yet
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: FONT.regular, textAlign: 'center' }}>
                When buyers or sellers message you,{'\n'}their conversations appear here.
              </Text>
            </View>
          ) : (
            convs.map((c, i) => {
              const name        = getOtherUserName(c);
              const lastMsg     = getLastMessageText(c.last_message);
              const timeAgo     = getTimeAgo(c.last_message_time || c.updated_at);
              const hasUnread   = (c.unread_count || 0) > 0;
              const initials    = name[0].toUpperCase();

              return (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Chat', { conversationId: c.id })}
                    style={[{
                      flexDirection: 'row', alignItems: 'center',
                      padding: 14, borderRadius: RADIUS.xl, marginBottom: 10,
                      backgroundColor: hasUnread ? colors.primary + '08' : colors.surface,
                      borderWidth: hasUnread ? 1 : 0,
                      borderColor: hasUnread ? colors.primary + '30' : 'transparent',
                    }, SHADOWS.sm]}
                    activeOpacity={0.8}
                  >
                    {/* Avatar */}
                    <View style={{
                      width: 50, height: 50, borderRadius: 25,
                      backgroundColor: hasUnread ? colors.primary + '25' : colors.surfaceVariant,
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 22, fontFamily: FONT.bold, color: colors.primary }}>
                        {initials}
                      </Text>
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <Text style={{
                          fontSize: 15,
                          fontFamily: hasUnread ? FONT.bold : FONT.medium,
                          color: colors.text,
                          flex: 1,
                        }}>
                          {name}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted, marginLeft: 8 }}>
                          {timeAgo}
                        </Text>
                      </View>

                      {/* Crop tag */}
                      {c.crop_name ? (
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: colors.primary, marginBottom: 3 }}>
                          ☕ {c.crop_name}
                        </Text>
                      ) : null}

                      {/* Last message */}
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: hasUnread ? FONT.medium : FONT.regular,
                          color: hasUnread ? colors.text : colors.textSecondary,
                        }}
                        numberOfLines={1}
                      >
                        {lastMsg}
                      </Text>
                    </View>

                    {/* Unread badge */}
                    {hasUnread && (
                      <View style={{
                        backgroundColor: colors.primary, borderRadius: 10,
                        minWidth: 22, height: 22, alignItems: 'center',
                        justifyContent: 'center', marginLeft: 8, paddingHorizontal: 5,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontFamily: FONT.bold }}>
                          {c.unread_count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};