import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert, Modal, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Plus, Trash2, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { api } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_COLORS: Record<string, string> = {
  listed: '#16A34A', harvesting: '#F59E0B', sold: '#6B7280', inactive: '#EF4444'
};
const STATUSES = ['listed','harvesting','sold','inactive'];

export const MyCropsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusPicker, setStatusPicker] = useState<any>(null);

  const load = useCallback(async () => {
    const { data } = await api.get<any[]>('/crops/my-crops/');
    if (data) setCrops(data);
    setLoading(false); setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (crop: any) => {
    Alert.alert('Delete Crop', `Delete "${crop.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await api.delete(`/crops/${crop.id}/delete/`);
        if (error) showToast(error, 'error');
        else { showToast('Crop deleted', 'info'); load(); }
      }},
    ]);
  };

  const handleStatusChange = async (cropId: number, newStatus: string) => {
    const { error } = await api.patch(`/crops/${cropId}/status/`, { status: newStatus });
    if (error) showToast(error, 'error');
    else { load(); showToast('Status updated', 'success'); }
    setStatusPicker(null);
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
          <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text }]}>My Crops </Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddCrop')}>
            <View style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 8 }}>
              <Plus size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          >
            {crops.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <Text style={{ fontSize: 48 }}>🌱</Text>
                <Text style={[{ color: colors.textSecondary, fontSize: 16, fontFamily: FONT.medium, marginTop: 12 }]}>No crops yet</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddCrop')} style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.lg }}>
                  <Text style={[{ color: '#fff', fontFamily: FONT.semibold }]}>Add Your First Crop</Text>
                </TouchableOpacity>
              </View>
            ) : (
              crops.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                  <View style={[{ borderRadius: RADIUS.xl, backgroundColor: colors.surface, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }, SHADOWS.sm]}>
                    <LinearGradient colors={[colors.primary + '20', colors.primaryLight + '20']} style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 26 }}>{c.emoji || '🌱'}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 15, fontFamily: FONT.semibold, color: colors.text }]}>{c.name}</Text>
                      <Text style={[{ fontSize: 12, fontFamily: FONT.regular, color: colors.textSecondary, marginTop: 2 }]}>
                        {c.quantity_display} · {c.price} RWF/{c.unit}
                      </Text>
                      {c.location ? <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted, marginTop: 1 }]}>📍 {c.location}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                      <TouchableOpacity onPress={() => setStatusPicker({ cropId: c.id, current: c.status })}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: (STATUS_COLORS[c.status] || '#6B7280') + '20' }}>
                        <Text style={[{ fontSize: 11, fontFamily: FONT.medium, color: STATUS_COLORS[c.status] || '#6B7280' }]}>{c.status}</Text>
                        <ChevronDown size={10} color={STATUS_COLORS[c.status] || '#6B7280'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(c)}>
                        <Trash2 size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      <Modal visible={!!statusPicker} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setStatusPicker(null)}>
          <View style={[{ borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 }, { backgroundColor: colors.surface }]}>
            <Text style={[{ fontSize: 18, fontFamily: FONT.semibold, marginBottom: 12, color: colors.text }]}>Update Status</Text>
            {STATUSES.map(s => (
              <TouchableOpacity key={s} onPress={() => handleStatusChange(statusPicker?.cropId, s)}
                style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: STATUS_COLORS[s] }} />
                <Text style={[{ fontSize: 15, fontFamily: s === statusPicker?.current ? FONT.semibold : FONT.regular, color: colors.text }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
};
