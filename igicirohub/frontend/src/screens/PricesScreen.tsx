import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search, TrendingUp, TrendingDown, Minus, RefreshCw, DollarSign } from 'lucide-react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';

const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const W = 70, H = 32;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(' ');
  return (
    <Svg width={W} height={H}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const TrendIcon = ({ trend, colors }: { trend: string; colors: any }) => {
  if (trend === 'rising')  return <TrendingUp  size={14} color={colors.success} />;
  if (trend === 'falling') return <TrendingDown size={14} color={colors.error} />;
  return <Minus size={14} color={colors.textMuted} />;
};

const SEASON_FILTERS = ['All', 'Season A', 'Season B', 'Off Season'];
const PRICE_TYPE_FILTERS = ['Farm Gate', 'Cooperative', 'Export'];

export const PricesScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const [search, setSearch]         = useState('');
  const [seasonFilter, setSeasonFilter] = useState('All');
  const [priceType, setPriceType]   = useState('Farm Gate');
  const [prices, setPrices]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating]     = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim())              params.append('search', search.trim());
    if (seasonFilter !== 'All')     params.append('season', seasonFilter);
    const qs = params.toString();
    const { data } = await api.get<any[]>(`/prices/list/${qs ? '?' + qs : ''}`, false);
    if (data) setPrices(data);
    setLoading(false); setRefreshing(false);
  }, [search, seasonFilter]);

  useEffect(() => { load(); }, [load]);

  const handleMLUpdate = async () => {
    setUpdating(true);
    const { data, error } = await api.post<any>('/predictions/update-prices/', {}, false);
    setUpdating(false);
    if (error) { showToast('Update failed', 'error'); return; }
    showToast(`✅ ${data.total} prices updated by Random Forest`, 'success');
    load();
  };

  const getDisplayPrice = (p: any) => {
    if (priceType === 'Export')      return { value: `$${p.export_usd}`, unit: '/kg' };
    if (priceType === 'Cooperative') return { value: `${p.cooperative_rwf}`, unit: ' RWF/kg' };
    return { value: `${p.farmgate_rwf}`, unit: ' RWF/kg' };
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'rising')  return colors.success;
    if (trend === 'falling') return colors.error;
    return colors.textMuted;
  };

  const featured = prices[0];

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: FONT.bold, color: colors.text }}>☕ Coffee Prices</Text>
            <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textSecondary, marginTop: 2 }}>
              6 varieties · 3 price types · Random Forest ML
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleMLUpdate}
            disabled={updating}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: colors.primary + '15',
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg,
            }}
          >
            {updating
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <RefreshCw size={14} color={colors.primary} />}
            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: colors.primary }}>
              {updating ? 'Updating...' : 'ML Update'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: colors.surfaceVariant, borderRadius: RADIUS.lg,
          paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1,
          borderColor: colors.border, marginTop: 12, marginBottom: 12,
        }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, fontSize: 14, fontFamily: FONT.regular, color: colors.text }}
            placeholder="Search varieties..."
            placeholderTextColor={colors.textMuted}
            value={search} onChangeText={setSearch}
            onSubmitEditing={load} returnKeyType="search"
          />
        </View>

        {/* Price Type tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {PRICE_TYPE_FILTERS.map(pt => (
            <TouchableOpacity
              key={pt}
              onPress={() => setPriceType(pt)}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: RADIUS.lg, alignItems: 'center',
                backgroundColor: priceType === pt ? colors.primary : colors.surfaceVariant,
              }}
            >
              <Text style={{
                fontSize: 11, fontFamily: FONT.semibold,
                color: priceType === pt ? '#fff' : colors.textSecondary,
              }}>
                {pt === 'Export' ? '🌍 Export' : pt === 'Cooperative' ? '🤝 Coop' : '🌱 Farm Gate'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Season filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {SEASON_FILTERS.map(sf => (
            <TouchableOpacity
              key={sf}
              onPress={() => setSeasonFilter(sf)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7,
                borderRadius: RADIUS.full, marginRight: 8,
                backgroundColor: seasonFilter === sf ? colors.primary + '20' : colors.surfaceVariant,
                borderWidth: 1,
                borderColor: seasonFilter === sf ? colors.primary : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12, fontFamily: FONT.medium,
                color: seasonFilter === sf ? colors.primary : colors.textSecondary,
              }}>
                {sf === 'Season A' ? '🌾 Season A' : sf === 'Season B' ? '🍂 Season B' : sf === 'Off Season' ? '☀️ Off Season' : '🌍 All'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Featured card */}
      {featured && (
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ paddingHorizontal: SPACING.lg, marginBottom: 20 }}>
          <View style={[{
            backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16,
            borderLeftWidth: 4, borderLeftColor: getTrendColor(featured.trend),
          }, SHADOWS.md]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: colors.textMuted, marginBottom: 4 }}>
                  FEATURED · {featured.season?.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 16, fontFamily: FONT.bold, color: colors.text }}>
                  {featured.emoji} {featured.name}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: FONT.medium, color: colors.primary, marginTop: 4 }}>
                  {getDisplayPrice(featured).value}
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>{getDisplayPrice(featured).unit}</Text>
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <MiniChart data={featured.chart_data} color={getTrendColor(featured.trend)} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <TrendIcon trend={featured.trend} colors={colors} />
                  <Text style={{ fontSize: 12, fontFamily: FONT.semibold, color: getTrendColor(featured.trend) }}>
                    {featured.trend_label}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
              <View>
                <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.textMuted }}>Farm Gate</Text>
                <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text }}>{featured.farmgate_rwf} RWF</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.textMuted }}>Cooperative</Text>
                <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text }}>{featured.cooperative_rwf} RWF</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.textMuted }}>Export</Text>
                <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.success }}>${featured.export_usd}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Price list */}
      <View style={{ paddingHorizontal: SPACING.lg }}>
        <Text style={{ fontSize: 15, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
          All Varieties ({prices.length}) — {priceType}
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 32 }} />
        ) : prices.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ fontSize: 36 }}>☕</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: FONT.regular, marginTop: 8 }}>
              No prices found. Tap ML Update.
            </Text>
          </View>
        ) : (
          prices.map((p, i) => {
            const display = getDisplayPrice(p);
            const tc = getTrendColor(p.trend);
            return (
              <Animated.View key={p.id} entering={FadeInDown.delay(i * 50).duration(300)}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('PriceDetail', { cropId: String(p.id) })}
                  style={[{
                    flexDirection: 'row', alignItems: 'center',
                    padding: 14, borderRadius: RADIUS.lg,
                    backgroundColor: colors.surface, marginBottom: 10,
                  }, SHADOWS.sm]}
                  activeOpacity={0.8}
                >
                  <View style={[{
                    width: 46, height: 46, borderRadius: 14,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }]}>
                    <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: FONT.semibold, color: colors.text }}>
                      {p.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: colors.primary }}>
                        {display.value}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted }}>
                        {display.unit}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.textMuted }}>
                        {p.season}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <MiniChart data={p.chart_data} color={tc} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <TrendIcon trend={p.trend} colors={colors} />
                      <Text style={{ fontSize: 11, fontFamily: FONT.semibold, color: tc }}>
                        {parseFloat(p.change) >= 0 ? '+' : ''}{p.change}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};