import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, TrendingUp, TrendingDown, Brain, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PriceChart = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const W = width - 48, H = 180;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - 30 - ((v - min) / range) * (H - 50),
  }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <Svg width={W} height={H}>
      {pts.map((p, i) =>
        i > 0 && (
          <Line
            key={i} x1={pts[i-1].x} y1={pts[i-1].y}
            x2={p.x} y2={p.y} stroke={color + '30'} strokeWidth={1}
          />
        )
      )}
      <Polyline
        points={poly} fill="none"
        stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 6 : 3} fill={color} />
      ))}
      {data.map((v, i) => (
        <SvgText key={i} x={pts[i].x} y={H - 8} fontSize="10" fill="#9CA3AF" textAnchor="middle">
          {MONTHS[i]}
        </SvgText>
      ))}
    </Svg>
  );
};

export const PriceDetailScreen = ({ route, navigation }: any) => {
  const { cropId } = route.params || {};
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();
  const [price, setPrice]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>(`/prices/${cropId}/detail/`, false).then(({ data }) => {
      if (data) setPrice(data);
      setLoading(false);
    });
  }, [cropId]);

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (!price) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.textSecondary }}>Not found.</Text>
    </View>
  );

  const isRising   = price.trend === 'rising';
  const trendColor = isRising ? colors.success : price.trend === 'falling' ? colors.error : colors.textMuted;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* ── Hero ── */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={[s.hero, { paddingTop: insets.top + 16 }]}
      >
        {/* Back button — properly spaced with safe area */}
        <View style={[s.navRow, { marginBottom: 20 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.navTitle}>Price Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={s.emoji}>{price.emoji}</Text>
        <Text style={s.name}>{price.name}</Text>

        {/* Season badge */}
        <View style={s.seasonBadge}>
          <Calendar size={12} color="rgba(255,255,255,0.8)" />
          <Text style={s.seasonText}>{price.season || 'Off Season'}</Text>
        </View>

        {/* Price + trend */}
        <View style={s.priceRow}>
          <Text style={s.price}>{price.farmgate_rwf || price.price} RWF/kg</Text>
          <View style={[s.trendBadge, { backgroundColor: trendColor + '30' }]}>
            {isRising
              ? <TrendingUp  size={14} color="#fff" />
              : <TrendingDown size={14} color="#fff" />}
            <Text style={s.trendText}>
              {parseFloat(price.change) >= 0 ? '+' : ''}{price.change}%
            </Text>
          </View>
        </View>

        {/* All 3 price types */}
        <View style={s.priceTypesRow}>
          <View style={s.priceTypeItem}>
            <Text style={s.priceTypeLabel}>🌱 Farm Gate</Text>
            <Text style={s.priceTypeValue}>{price.farmgate_rwf || price.price} RWF</Text>
          </View>
          <View style={s.priceTypeDivider} />
          <View style={s.priceTypeItem}>
            <Text style={s.priceTypeLabel}>🤝 Cooperative</Text>
            <Text style={s.priceTypeValue}>{price.cooperative_rwf || '—'} RWF</Text>
          </View>
          <View style={s.priceTypeDivider} />
          <View style={s.priceTypeItem}>
            <Text style={s.priceTypeLabel}>🌍 Export</Text>
            <Text style={s.priceTypeValue}>${price.export_usd}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ padding: SPACING.lg }}>

        {/* Chart */}
        <Animated.View entering={FadeInDown.duration(400)} style={[s.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>6-Month Price Trend</Text>
          <PriceChart data={price.chart_data} color={trendColor} />
        </Animated.View>

        {/* Market Trend Indicator */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[s.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>📊 Market Trend</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[s.trendIndicator, {
              backgroundColor:
                price.trend === 'rising'  ? colors.success + '20' :
                price.trend === 'falling' ? colors.error   + '20' :
                colors.textMuted + '20',
            }]}>
              {price.trend === 'rising'
                ? <TrendingUp  size={22} color={colors.success} />
                : price.trend === 'falling'
                  ? <TrendingDown size={22} color={colors.error} />
                  : <Text style={{ fontSize: 22 }}>→</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: FONT.semibold, color: colors.text }}>
                {price.trend_label || (
                  price.trend === 'rising'  ? 'Rising Market ↑' :
                  price.trend === 'falling' ? 'Falling Market ↓' :
                  'Stable Market →'
                )}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: colors.textSecondary, marginTop: 2 }}>
                {price.trend === 'rising'
                  ? 'Prices increasing — consider holding stock'
                  : price.trend === 'falling'
                    ? 'Prices declining — consider selling sooner'
                    : 'Prices stable — good time to sell'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* AI Insight */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[s.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <View style={s.aiHeader}>
            <Brain size={18} color={colors.primary} />
            <Text style={[s.cardTitle, { color: colors.text }]}>AI Insight</Text>
          </View>
          <Text style={[s.aiText, { color: colors.textSecondary }]}>
            {price.name} is currently in <Text style={{ fontFamily: FONT.semibold, color: colors.text }}>{price.season || 'Off Season'}</Text>.{' '}
            {isRising
              ? `Prices are rising (+${price.change}%). Consider holding your stock for better returns.`
              : price.trend === 'falling'
                ? `Prices are declining (${price.change}%). Selling now may be a good strategy.`
                : `Prices are stable (${price.change}%). A good time to sell at current market rates.`}
          </Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={s.statsRow}>
          {[
            { label: 'Farm Gate', value: `${price.farmgate_rwf || price.price} RWF`,  color: colors.primary },
            { label: 'Change',    value: `${parseFloat(price.change) >= 0 ? '+' : ''}${price.change}%`, color: trendColor },
            { label: 'Export',    value: `$${price.export_usd}`,                        color: colors.success },
          ].map(item => (
            <View key={item.label} style={[s.statBox, { backgroundColor: colors.surface }, SHADOWS.sm]}>
              <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>

      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  hero:            { paddingHorizontal: 16, paddingBottom: 28, alignItems: 'center' },
  navRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  backBtn:         { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  navTitle:        { fontSize: 16, fontFamily: FONT.semibold, color: '#fff' },
  emoji:           { fontSize: 56, marginBottom: 6 },
  name:            { fontSize: 22, fontFamily: FONT.bold, color: '#fff', marginBottom: 8, textAlign: 'center' },
  seasonBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  seasonText:      { fontSize: 12, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.9)' },
  priceRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  price:           { fontSize: 22, fontFamily: FONT.semibold, color: '#fff' },
  trendBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  trendText:       { fontSize: 12, fontFamily: FONT.semibold, color: '#fff' },
  priceTypesRow:   { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.xl, padding: 14, width: '100%', gap: 0 },
  priceTypeItem:   { flex: 1, alignItems: 'center' },
  priceTypeLabel:  { fontSize: 10, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  priceTypeValue:  { fontSize: 13, fontFamily: FONT.bold, color: '#fff' },
  priceTypeDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  card:            { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  cardTitle:       { fontSize: 15, fontFamily: FONT.semibold, marginBottom: 12 },
  trendIndicator:  { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  aiHeader:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiText:          { fontSize: 13, fontFamily: FONT.regular, lineHeight: 20 },
  statsRow:        { flexDirection: 'row', gap: 10 },
  statBox:         { flex: 1, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center' },
  statValue:       { fontSize: 14, fontFamily: FONT.bold },
  statLabel:       { fontSize: 11, fontFamily: FONT.regular, marginTop: 4 },
});