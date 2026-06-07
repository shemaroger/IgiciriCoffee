import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, FlatList, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Brain, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react-native';
import { GradientButton } from '../components/GradientButton';
import { GradientCard } from '../components/GradientCard';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';
import Svg, { Polyline, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const HORIZONS = [{ label: '7 days', days: 7 }, { label: '14 days', days: 14 }, { label: '30 days', days: 30 }];

const LineChart = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const W = width - 48, H = 160;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 20) - 10,
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <Svg width={W} height={H} style={{ marginVertical: 8 }}>
      <Polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3} fill={color} />)}
    </Svg>
  );
};

export const PredictScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const [availableCrops, setAvailableCrops] = useState<any[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('Gasabo');
  const [horizon, setHorizon] = useState(HORIZONS[0]);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [pickerModal, setPickerModal] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const [cRes, rRes] = await Promise.all([
        api.get<any[]>('/predictions/available-crops/', false),
        api.get<any>('/predictions/regions/', false),
      ]);
      if (cRes.data) { setAvailableCrops(cRes.data); setSelectedCrop(cRes.data[0] || null); }
      if (rRes.data) setDistricts(rRes.data.districts || []);
      setInitLoading(false);
    })();
  }, []);

  const handlePredict = async () => {
    if (!selectedCrop) { showToast('Select a crop', 'error'); return; }
    setLoading(true);
    const { data, error } = await api.post<any>('/predictions/run/', {
      crop_name: selectedCrop.name,
      district: selectedDistrict,
      province: 'Kigali',
      horizon_days: horizon.days,
      current_price: selectedCrop.base_price,
    });
    setLoading(false);
    if (error) { showToast(error, 'error'); return; }
    setResult(data);
    showToast('Prediction generated! 🧠', 'success');
  };

  const DropdownField = ({ label, value, options, onSelect, displayKey = 'name' }: any) => (
    <TouchableOpacity onPress={() => setPickerModal({ label, options, onSelect, displayKey })} style={[styles.dropdown, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]} activeOpacity={0.7}>
      <View>
        <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.dropdownValue, { color: colors.text }]}>{typeof value === 'string' ? value : (value?.[displayKey] || '—')}</Text>
      </View>
      <ChevronDown size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const predChange = result?.predicted_change ?? 0;
  const isUp = parseFloat(predChange) >= 0;

  if (initLoading) return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerSection}>
          <View style={styles.headerRow}><Brain size={22} color={colors.primary} /><Text style={[styles.title, { color: colors.text }]}>AI Price Prediction</Text></View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Get smart forecasts powered by machine learning</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.formSection}>
          <DropdownField label="Crop" value={selectedCrop} displayKey="name" options={availableCrops} onSelect={setSelectedCrop} />
          {selectedCrop && (
            <View style={[styles.readonlyField, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Category</Text>
              <Text style={[styles.dropdownValue, { color: colors.text }]}>{selectedCrop.emoji} {selectedCrop.category} · Base: {selectedCrop.base_price} RWF</Text>
            </View>
          )}
          <DropdownField label="District" value={selectedDistrict} options={districts} onSelect={setSelectedDistrict} />
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Prediction Horizon</Text>
          <View style={styles.horizonRow}>
            {HORIZONS.map((h) => (
              <TouchableOpacity key={h.label} onPress={() => setHorizon(h)} style={[styles.horizonChip, { backgroundColor: horizon.days === h.days ? colors.primary : colors.surfaceVariant }]}>
                <Text style={[styles.horizonText, { color: horizon.days === h.days ? '#FFFFFF' : colors.textSecondary }]}>{h.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <GradientButton title="🧠 Run AI Prediction" onPress={handlePredict} loading={loading} />
        </Animated.View>

        {result && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.resultSection}>
            <GradientCard>
              <Text style={styles.resultLabel}>Prediction Result</Text>
              <View style={styles.resultRow}>
                <View>
                  <Text style={styles.resultSmall}>Current Price</Text>
                  <Text style={styles.resultBig}>{result.current_price} RWF</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.resultSmall}>{horizon.label}</Text>
                  <Text style={styles.resultBig}>{parseFloat(predChange) >= 0 ? '+' : ''}{predChange}%</Text>
                </View>
              </View>
              <View style={styles.trendRow}>
                {isUp ? <TrendingUp size={16} color="#FFFFFF" /> : <TrendingDown size={16} color="#FFFFFF" />}
                <Text style={styles.trendText}>{isUp ? 'Expected Rise' : 'Expected Drop'} · {result.confidence} confidence</Text>
              </View>
            </GradientCard>

            <View style={{ marginTop: 16 }}>
              <Text style={[styles.chartLabel, { color: colors.text }]}>Price Forecast Chart</Text>
              <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 12, alignItems: 'center' }, SHADOWS.sm]}>
                <LineChart data={result.chart_data || []} color={isUp ? colors.success : colors.error} />
              </View>
            </View>

            <View style={[styles.recCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
              <Text style={[styles.recTitle, { color: colors.text }]}>💡 AI Recommendation</Text>
              <Text style={[styles.recText, { color: colors.textSecondary }]}>{result.recommendation}</Text>
              <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.textMuted, marginTop: 8 }]}>Method: {result.method} · District: {result.district}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Modal visible={!!pickerModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerModal(null)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select {pickerModal?.label}</Text>
            <FlatList
              data={pickerModal?.options || []}
              keyExtractor={(item, idx) => String(idx)}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => { pickerModal?.onSelect(item); setPickerModal(null); }} style={[styles.modalItem, { borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {typeof item === 'string' ? item : `${item.emoji || ''} ${item.name}`}
                  </Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 350 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 22, fontFamily: FONT.bold },
  subtitle: { fontSize: 13, fontFamily: FONT.regular, marginBottom: 16 },
  formSection: { paddingHorizontal: SPACING.lg, gap: 12 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1 },
  dropdownLabel: { fontSize: 11, fontFamily: FONT.regular },
  dropdownValue: { fontSize: 14, fontFamily: FONT.medium, marginTop: 2 },
  readonlyField: { borderRadius: RADIUS.lg, padding: 14 },
  fieldLabel: { fontSize: 12, fontFamily: FONT.medium },
  horizonRow: { flexDirection: 'row', gap: 10 },
  horizonChip: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  horizonText: { fontSize: 13, fontFamily: FONT.medium },
  resultSection: { paddingHorizontal: SPACING.lg, marginTop: 24 },
  resultLabel: { fontSize: 14, fontFamily: FONT.semibold, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resultSmall: { fontSize: 11, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.7)' },
  resultBig: { fontSize: 24, fontFamily: FONT.bold, color: '#FFFFFF', marginTop: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  trendText: { fontSize: 12, fontFamily: FONT.medium, color: '#FFFFFF' },
  chartLabel: { fontSize: 14, fontFamily: FONT.semibold, marginBottom: 8 },
  recCard: { borderRadius: RADIUS.xl, padding: 16, marginTop: 16 },
  recTitle: { fontSize: 15, fontFamily: FONT.semibold, marginBottom: 8 },
  recText: { fontSize: 13, fontFamily: FONT.regular, lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontFamily: FONT.semibold, marginBottom: 16 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1 },
  modalItemText: { fontSize: 15, fontFamily: FONT.regular },
});
