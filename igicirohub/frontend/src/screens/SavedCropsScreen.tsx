import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, HeartOff, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { api } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export const SavedCropsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get<any[]>('/crops/saved/');
    if (data) setCrops(data);
    setLoading(false); setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleUnsave = async (crop: any) => {
    const { error } = await api.delete(`/crops/${crop.id}/unsave/`);
    if (error) showToast(error, 'error');
    else { setCrops(prev => prev.filter(c => c.id !== crop.id)); showToast('Removed from saved', 'info'); }
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
          <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text }]}>Saved Crops ❤️</Text>
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
                <Text style={{ fontSize: 48 }}>❤️</Text>
                <Text style={[{ color: colors.textSecondary, fontSize: 16, fontFamily: FONT.medium, marginTop: 12 }]}>No saved crops</Text>
                <Text style={[{ color: colors.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }]}>Browse the marketplace and tap the heart icon to save crops</Text>
              </View>
            ) : (
              crops.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                  <TouchableOpacity onPress={() => navigation.navigate('CropDetail', { cropId: String(c.id) })} activeOpacity={0.85}
                    style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: RADIUS.xl, backgroundColor: colors.surface, marginBottom: 10 }, SHADOWS.sm]}>
                    <LinearGradient colors={[colors.primary + '20', colors.primaryLight + '20']} style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 26 }}>{c.emoji || '🌱'}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 15, fontFamily: FONT.semibold, color: colors.text }]}>{c.name}</Text>
                      <Text style={[{ fontSize: 12, fontFamily: FONT.regular, color: colors.primary, marginTop: 1 }]}>{c.price} RWF/{c.unit}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={11} color={colors.textMuted} />
                        <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted }]}>{c.farmer_name} · {c.location || c.district}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleUnsave(c)} style={{ padding: 8 }}>
                      <HeartOff size={20} color={colors.error} />
                    </TouchableOpacity>
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
