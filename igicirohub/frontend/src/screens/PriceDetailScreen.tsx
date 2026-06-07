import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, TrendingUp, TrendingDown, Brain } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const MONTHS = ['Jul','Aug','Sep','Oct','Nov','Dec'];

const PriceChart = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const W = width - 48, H = 180;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - 30 - ((v - min) / range) * (H - 50) }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <Svg width={W} height={H}>
      {pts.map((p, i) => i > 0 && <Line key={i} x1={pts[i-1].x} y1={pts[i-1].y} x2={p.x} y2={p.y} stroke={color + '30'} strokeWidth={1} />)}
      <Polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length-1 ? 6 : 3} fill={color} />)}
      {data.map((v, i) => (
        <SvgText key={i} x={pts[i].x} y={H - 8} fontSize="10" fill="#9CA3AF" textAnchor="middle">{MONTHS[i]}</SvgText>
      ))}
    </Svg>
  );
};

export const PriceDetailScreen = ({ route, navigation }: any) => {
  const { cropId } = route.params || {};
  const { colors } = useTheme();
  const [price, setPrice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>(`/prices/${cropId}/detail/`, false).then(({ data }) => {
      if (data) setPrice(data);
      setLoading(false);
    });
  }, [cropId]);

  if (loading) return <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!price) return <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }]}><Text style={{ color: colors.textSecondary }}>Not found.</Text></View>;

  const isUp = price.trend === 'up';
  const trendColor = isUp ? colors.success : colors.error;

  return (
    <ScrollView style={[{ flex: 1, backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={s.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><ArrowLeft size={20} color="#fff" /></TouchableOpacity>
        <Text style={s.emoji}>{price.emoji}</Text>
        <Text style={s.name}>{price.name}</Text>
        <View style={s.priceRow}>
          <Text style={s.price}>{price.price} RWF/{price.unit}</Text>
          <View style={s.badge}>
            {isUp ? <TrendingUp size={14} color="#fff" /> : <TrendingDown size={14} color="#fff" />}
            <Text style={s.badgeText}>{parseFloat(price.change) >= 0 ? '+' : ''}{price.change}%</Text>
          </View>
        </View>
        <Text style={s.location}>📍 {price.location || price.district}</Text>
      </LinearGradient>

      <View style={{ padding: SPACING.lg }}>
        <Animated.View entering={FadeInDown.duration(400)} style={[s.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>6-Month Price Trend</Text>
          <PriceChart data={price.chart_data} color={trendColor} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[s.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <View style={s.aiHeader}><Brain size={18} color={colors.primary} /><Text style={[s.cardTitle, { color: colors.text }]}>AI Insight</Text></View>
          <Text style={[s.aiText, { color: colors.textSecondary }]}>
            Based on market trends, {price.name.split('(')[0].trim()} prices are expected to {isUp ? 'continue rising' : 'stabilise'} in the coming weeks.
            {isUp ? ' Consider holding your stock for better returns.' : ' Selling now may be a good strategy.'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[s.statsRow]}>
          {[
            { label: 'Current', value: `${price.price} RWF` },
            { label: 'Change',  value: `${parseFloat(price.change) >= 0 ? '+' : ''}${price.change}%` },
            { label: 'Trend',   value: price.trend },
          ].map(item => (
            <View key={item.label} style={[s.statBox, { backgroundColor: colors.surface }, SHADOWS.sm]}>
              <Text style={[s.statValue, { color: item.label === 'Change' ? trendColor : colors.text }]}>{item.value}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  hero: { paddingTop: 60, paddingBottom: 28, alignItems: 'center' },
  back: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: 6 },
  name: { fontSize: 22, fontFamily: FONT.bold, color: '#fff', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontSize: 20, fontFamily: FONT.semibold, color: '#fff' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: 12, fontFamily: FONT.semibold, color: '#fff' },
  location: { fontSize: 12, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  card: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontFamily: FONT.semibold, marginBottom: 12 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiText: { fontSize: 13, fontFamily: FONT.regular, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 16, fontFamily: FONT.bold },
  statLabel: { fontSize: 11, fontFamily: FONT.regular, marginTop: 4 },
});
