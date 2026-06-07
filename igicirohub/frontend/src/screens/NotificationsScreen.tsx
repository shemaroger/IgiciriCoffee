import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, MessageCircle, Bell } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { api } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export const NotificationsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get<any[]>('/chat/conversations/');
    if (data) setConvs(data);
    setLoading(false); setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalUnread = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
          <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text, flex: 1 }]}>Notifications</Text>
          {totalUnread > 0 && (
            <View style={{ backgroundColor: colors.error, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontFamily: FONT.semibold }}>{totalUnread} unread</Text>
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          >
            {convs.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <Bell size={48} color={colors.textMuted} />
                <Text style={[{ color: colors.textSecondary, fontSize: 15, fontFamily: FONT.medium, marginTop: 12 }]}>No messages yet</Text>
                <Text style={[{ color: colors.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 4 }]}>Messages from buyers/sellers appear here</Text>
              </View>
            ) : (
              convs.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Chat', { conversationId: c.id })}
                    style={[{
                      flexDirection: 'row', alignItems: 'center', padding: 14,
                      borderRadius: RADIUS.xl, marginBottom: 10,
                      backgroundColor: c.unread_count > 0 ? colors.primary + '08' : colors.surface,
                    }, SHADOWS.sm]}
                    activeOpacity={0.8}
                  >
                    <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 22, fontFamily: FONT.bold, color: colors.primary }}>
                        {(c.other_user_name || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ fontSize: 15, fontFamily: c.unread_count > 0 ? FONT.semibold : FONT.medium, color: colors.text }]}>
                          {c.other_user_name || 'User'}
                        </Text>
                        {c.last_message_time && (
                          <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted }]}>
                            {new Date(c.last_message_time).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      {c.crop_name ? <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.primary, marginBottom: 2 }]}>🌾 {c.crop_name}</Text> : null}
                      <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary }]} numberOfLines={1}>
                        {c.last_message || 'Start chatting...'}
                      </Text>
                    </View>
                    {c.unread_count > 0 && (
                      <View style={{ backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 8, paddingHorizontal: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontFamily: FONT.semibold }}>{c.unread_count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
};
