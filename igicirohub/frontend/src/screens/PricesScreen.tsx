import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search, TrendingUp, TrendingDown, Brain } from 'lucide-react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const W = 80, H = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(' ');
  return (
    <Svg width={W} height={H}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const PricesScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [prices, setPrices] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const [listRes] = await Promise.all([
      api.get<any[]>(`/prices/list/${qs}`, false),
    ]);
    if (listRes.data) {
      setPrices(listRes.data);
      setFeatured(listRes.data[0] || null);
    }
    setLoading(false); setRefreshing(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerSection}>
        <Text style={[styles.title, { color: colors.text }]}>Market Prices 📊</Text>
        <View style={[styles.searchWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput style={[styles.searchInput, { color: colors.text, fontFamily: FONT.regular }]} placeholder="Search crops..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} onSubmitEditing={load} returnKeyType="search" />
        </View>
      </Animated.View>

      {featured && (
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.aiCard, { backgroundColor: colors.surface }, SHADOWS.md]}>
          <View style={styles.aiHeader}><Brain size={18} color={colors.primary} /><Text style={[styles.aiTitle, { color: colors.text }]}>Featured: {featured.emoji} {featured.name}</Text></View>
          <View style={styles.aiRow}>
            <View><Text style={[styles.aiLabel, { color: colors.textSecondary }]}>Current Price</Text><Text style={[styles.aiValue, { color: colors.text }]}>{featured.price} RWF</Text></View>
            <View style={{ alignItems: 'center' }}><Text style={[styles.aiLabel, { color: colors.textSecondary }]}>Trend</Text><MiniChart data={featured.chart_data} color={featured.trend === 'up' ? colors.success : colors.error} /></View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.aiLabel, { color: colors.textSecondary }]}>Change</Text>
              <Text style={[styles.aiValue, { color: featured.trend === 'up' ? colors.success : colors.error }]}>{parseFloat(featured.change) >= 0 ? '+' : ''}{featured.change}%</Text>
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.listSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Crops</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 32 }} />
        ) : prices.length === 0 ? (
          <Text style={[{ color: colors.textSecondary, fontFamily: FONT.regular, fontSize: 14 }]}>No price data.</Text>
        ) : (
          prices.map((crop) => (
            <TouchableOpacity key={crop.id} onPress={() => navigation.navigate('PriceDetail', { cropId: String(crop.id) })} style={[styles.cropCard, { backgroundColor: colors.surface }, SHADOWS.sm]} activeOpacity={0.8}>
              <View style={[styles.cropEmoji, { backgroundColor: colors.surfaceVariant }]}><Text style={{ fontSize: 22 }}>{crop.emoji}</Text></View>
              <View style={styles.cropInfo}>
                <Text style={[styles.cropName, { color: colors.text }]}>{crop.name}</Text>
                <Text style={[styles.cropSub, { color: colors.textSecondary }]}>{crop.location || crop.district} · {crop.price} RWF/{crop.unit}</Text>
              </View>
              <View style={styles.rightCol}>
                <MiniChart data={crop.chart_data} color={crop.trend === 'up' ? colors.success : colors.error} />
                <View style={styles.cropTrend}>
                  {crop.trend === 'up' ? <TrendingUp size={12} color={colors.success} /> : <TrendingDown size={12} color={colors.error} />}
                  <Text style={[styles.cropChange, { color: crop.trend === 'up' ? colors.success : colors.error }]}>
                    {parseFloat(crop.change) >= 0 ? '+' : ''}{crop.change}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  title: { fontSize: 22, fontFamily: FONT.bold, marginBottom: 12 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14 },
  aiCard: { marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl, padding: 16, marginBottom: 20 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiTitle: { fontSize: 15, fontFamily: FONT.semibold },
  aiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  aiLabel: { fontSize: 11, fontFamily: FONT.regular },
  aiValue: { fontSize: 18, fontFamily: FONT.bold, marginTop: 2 },
  listSection: { paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 16, fontFamily: FONT.semibold, marginBottom: 12 },
  cropCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: RADIUS.lg, marginBottom: 10 },
  cropEmoji: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cropInfo: { flex: 1 },
  cropName: { fontSize: 14, fontFamily: FONT.medium },
  cropSub: { fontSize: 11, fontFamily: FONT.regular, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  cropTrend: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cropChange: { fontSize: 12, fontFamily: FONT.semibold },
});
