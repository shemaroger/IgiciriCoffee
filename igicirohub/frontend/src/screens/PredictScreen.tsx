import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, FlatList, Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Brain, ChevronDown, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ── Coffee varieties (hardcoded so screen works offline) ──────────────────
const COFFEE_VARIETIES = [
  { name: 'Bourbon Arabica', emoji: '☕', type: 'arabica' },
  { name: 'Red Bourbon',     emoji: '☕', type: 'arabica' },
  { name: 'Yellow Bourbon',  emoji: '☕', type: 'arabica' },
  { name: 'Jackson',         emoji: '☕', type: 'arabica' },
  { name: 'Mibirizi',        emoji: '☕', type: 'arabica' },
  { name: 'Robusta',         emoji: '🫘', type: 'robusta' },
];

const PRICE_TYPES = [
  { key: 'Farm Gate',   label: '🌱 Farm Gate',   desc: 'Price paid to farmer' },
  { key: 'Cooperative', label: '🤝 Cooperative', desc: 'After processing' },
  { key: 'Export',      label: '🌍 Export (USD)', desc: 'International price' },
];

const HORIZONS = [
  { label: '7 days',  days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
];

const HISTORICAL = [
  { label: '3 months',  months: 3 },
  { label: '6 months',  months: 6 },
  { label: '12 months', months: 12 },
];

// ── Line chart ────────────────────────────────────────────────────────────
const LineChart = ({ data, color, label }: { data: number[]; color: string; label: string }) => {
  if (!data || data.length < 2) return null;
  const W = width - 64, H = 100;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 20) - 5,
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 10, fontFamily: FONT.medium, color, marginBottom: 4 }}>
        {label}
      </Text>
      <Svg width={W} height={H}>
        <Polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 2.5} fill={color} />
        ))}
      </Svg>
    </View>
  );
};

// ── Selector row ──────────────────────────────────────────────────────────
const SelectorRow = ({ options, selected, onSelect, colors, keyFn, labelFn }: any) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {options.map((opt: any) => {
      const key = keyFn(opt);
      const isSelected = key === selected;
      return (
        <TouchableOpacity
          key={key}
          onPress={() => onSelect(opt)}
          style={{
            paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: RADIUS.full, marginRight: 8,
            backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
            borderWidth: 1,
            borderColor: isSelected ? colors.primary : 'transparent',
          }}
        >
          <Text style={{
            fontSize: 12, fontFamily: FONT.medium,
            color: isSelected ? '#fff' : colors.textSecondary,
          }}>
            {labelFn(opt)}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

export const PredictScreen = () => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();

  const [variety, setVariety]           = useState(COFFEE_VARIETIES[0]);
  const [priceType, setPriceType]       = useState(PRICE_TYPES[0]);
  const [horizon, setHorizon]           = useState(HORIZONS[2]);
  const [historical, setHistorical]     = useState(HISTORICAL[1]);
  const [result, setResult]             = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [varietyModal, setVarietyModal] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    const { data, error } = await api.post<any>('/predictions/run/', {
      crop_name:         variety.name,
      price_type:        priceType.key,
      horizon_days:      horizon.days,
      historical_months: historical.months,
    });
    setLoading(false);
    if (error) { showToast(error, 'error'); return; }
    setResult(data);
  };

  const getTrendColor = (trend: any) => {
    if (!trend) return colors.textMuted;
    const key = trend?.key || trend;
    if (key === 'rising')  return colors.success;
    if (key === 'falling') return colors.error;
    return colors.textMuted;
  };

  const TrendIcon = ({ trend }: any) => {
    const key = trend?.key || trend;
    if (key === 'rising')  return <TrendingUp  size={16} color={colors.success} />;
    if (key === 'falling') return <TrendingDown size={16} color={colors.error} />;
    return <Minus size={16} color={colors.textMuted} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Brain size={22} color="#fff" />
          <View>
            <Text style={{ fontSize: 20, fontFamily: FONT.bold, color: '#fff' }}>
              Price Prediction
            </Text>
            <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.75)' }}>
              Random Forest ML · 6 Coffee Varieties
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Variety Picker ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 }, SHADOWS.sm]}>
          <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
            ☕ Select Coffee Variety
          </Text>
          <TouchableOpacity
            onPress={() => setVarietyModal(true)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: colors.primary + '10', borderRadius: RADIUS.lg,
              padding: 14, borderWidth: 1.5, borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 24 }}>{variety.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: FONT.semibold, color: colors.primary }}>
                {variety.name}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted, marginTop: 1 }}>
                {variety.type === 'robusta' ? 'Robusta variety' : 'Arabica variety'}
              </Text>
            </View>
            <ChevronDown size={18} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── 2. Price Type ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 }, SHADOWS.sm]}>
          <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
            💰 Price Type
          </Text>
          <View style={{ gap: 8 }}>
            {PRICE_TYPES.map(pt => (
              <TouchableOpacity
                key={pt.key}
                onPress={() => setPriceType(pt)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  padding: 12, borderRadius: RADIUS.lg,
                  backgroundColor: priceType.key === pt.key ? colors.primary + '12' : colors.surfaceVariant,
                  borderWidth: 1.5,
                  borderColor: priceType.key === pt.key ? colors.primary : 'transparent',
                }}
              >
                <Text style={{ fontSize: 18 }}>{pt.label.split(' ')[0]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 13, fontFamily: FONT.semibold,
                    color: priceType.key === pt.key ? colors.primary : colors.text,
                  }}>
                    {pt.label.split(' ').slice(1).join(' ')}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted }}>
                    {pt.desc}
                  </Text>
                </View>
                {priceType.key === pt.key && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── 3. Prediction Horizon ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 }, SHADOWS.sm]}>
          <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
            📅 Prediction Horizon
          </Text>
          <SelectorRow
            options={HORIZONS}
            selected={horizon.days}
            onSelect={setHorizon}
            colors={colors}
            keyFn={(h: any) => h.days}
            labelFn={(h: any) => h.label}
          />
        </Animated.View>

        {/* ── 4. Historical Period ── */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16, marginBottom: 20 }, SHADOWS.sm]}>
          <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
            📊 Historical Period
          </Text>
          <SelectorRow
            options={HISTORICAL}
            selected={historical.months}
            onSelect={setHistorical}
            colors={colors}
            keyFn={(h: any) => h.months}
            labelFn={(h: any) => h.label}
          />
        </Animated.View>

        {/* ── Predict button ── */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)}>
          <GradientButton
            title="🔮 Predict Price"
            onPress={handlePredict}
            loading={loading}
          />
        </Animated.View>

        {/* ── Results ── */}
        {result && (
          <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: 20 }}>

            {/* Main result card */}
            <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 }, SHADOWS.md]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 24 }}>{result.emoji || '☕'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: FONT.bold, color: colors.text }}>{result.variety}</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted }}>
                    {result.season} · {result.price_type} · {horizon.label} forecast
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
                  backgroundColor: result.confidence === 'High' ? colors.success + '20' : colors.warning + '20',
                }}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.semibold, color: result.confidence === 'High' ? colors.success : colors.warning }}>
                    {result.confidence}
                  </Text>
                </View>
              </View>

              {/* Current vs Predicted */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={[{ flex: 1, padding: 12, borderRadius: RADIUS.lg, backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: colors.textMuted, marginBottom: 4 }}>NOW</Text>
                  <Text style={{ fontSize: 20, fontFamily: FONT.bold, color: colors.text }}>
                    {priceType.key === 'Export' ? `$${result.current_price}` : result.current_price?.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.textMuted }}>
                    {result.price_unit}
                  </Text>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 32 }}>
                  <TrendIcon trend={result.trend} />
                </View>
                <View style={[{ flex: 1, padding: 12, borderRadius: RADIUS.lg, backgroundColor: getTrendColor(result.trend) + '15' }]}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: colors.textMuted, marginBottom: 4 }}>
                    IN {horizon.label.toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 20, fontFamily: FONT.bold, color: getTrendColor(result.trend) }}>
                    {priceType.key === 'Export' ? `$${result.predicted_price}` : result.predicted_price?.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.textMuted }}>
                    {result.price_unit}
                  </Text>
                </View>
              </View>

              {/* Change badge */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: getTrendColor(result.trend) + '15',
                borderRadius: RADIUS.lg, padding: 10,
              }}>
                <TrendIcon trend={result.trend} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: getTrendColor(result.trend) }}>
                    {result.change_pct >= 0 ? '+' : ''}{result.change_pct}% · {result.trend?.label || 'Stable'}
                  </Text>
                </View>
              </View>
            </View>

            {/* All 3 prices summary */}
            <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 }, SHADOWS.sm]}>
              <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
                💰 All Price Types — Current
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { label: '🌱 Farm Gate', value: `${result.current_farmgate?.toLocaleString()} RWF`, color: colors.primary },
                  { label: '🤝 Cooperative', value: `${result.current_cooperative?.toLocaleString()} RWF`, color: colors.success },
                  { label: '🌍 Export', value: `$${result.current_export_usd}`, color: colors.warning },
                ].map(item => (
                  <View key={item.label} style={{ flex: 1, backgroundColor: colors.surfaceVariant, borderRadius: RADIUS.lg, padding: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, fontFamily: FONT.medium, color: colors.textMuted, marginBottom: 4 }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: item.color }}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Charts */}
            <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 }, SHADOWS.sm]}>
              <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text, marginBottom: 8 }}>
                📈 Historical Trend — Last {historical.label}
              </Text>
              <LineChart
                data={result.chart_farmgate}
                color={colors.primary}
                label="🌱 Farm Gate (RWF/kg)"
              />
              <LineChart
                data={result.chart_export}
                color={colors.success}
                label="🌍 Export (USD/kg)"
              />
            </View>

            {/* Season info */}
            <View style={[{ backgroundColor: colors.primary + '10', borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: colors.primary }, SHADOWS.sm]}>
              <Text style={{ fontSize: 12, fontFamily: FONT.semibold, color: colors.primary, marginBottom: 4 }}>
                📅 {result.season}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: colors.text, lineHeight: 18 }}>
                {result.season_description}
              </Text>
            </View>

            {/* Recommendation */}
            <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16 }, SHADOWS.sm]}>
              <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: colors.text, marginBottom: 8 }}>
                🤖 AI Recommendation
              </Text>
              <Text style={{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary, lineHeight: 20 }}>
                {result.recommendation}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.textMuted, marginTop: 8 }}>
                Method: {result.method} · Confidence: {result.confidence}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Variety picker modal */}
      <Modal visible={varietyModal} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setVarietyModal(false)}
        >
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 }}>
            <Text style={{ fontSize: 18, fontFamily: FONT.semibold, color: colors.text, marginBottom: 16 }}>
              Select Coffee Variety
            </Text>
            {COFFEE_VARIETIES.map(v => (
              <TouchableOpacity
                key={v.name}
                onPress={() => { setVariety(v); setVarietyModal(false); setResult(null); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  padding: 14, borderRadius: RADIUS.lg, marginBottom: 8,
                  backgroundColor: variety.name === v.name ? colors.primary + '12' : colors.surfaceVariant,
                  borderWidth: 1.5,
                  borderColor: variety.name === v.name ? colors.primary : 'transparent',
                }}
              >
                <Text style={{ fontSize: 24 }}>{v.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15, fontFamily: FONT.semibold,
                    color: variety.name === v.name ? colors.primary : colors.text,
                  }}>
                    {v.name}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted }}>
                    {v.type === 'robusta' ? 'Robusta' : 'Arabica'} variety
                  </Text>
                </View>
                {variety.name === v.name && (
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};