import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Phone as PhoneIcon, MessageCircle, MapPin, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { useAppToast } from '../hooks/useAppToast';
import { canPostMarketplaceListing } from '../auth/rbac';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';

const CATEGORIES = ['All', 'Vegetables', 'Grains', 'Fruits', 'Tubers', 'Legumes'];

export const MarketplaceScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { showToast } = useAppToast();
  const [selectedCat, setSelectedCat] = useState('All');
  const [search, setSearch] = useState('');
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callingId, setCallingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedCat !== 'All') params.append('category', selectedCat.toLowerCase());
    if (search.trim()) params.append('search', search.trim());
    const qs = params.toString();
    const { data } = await api.get<any[]>(`/crops/marketplace/${qs ? '?' + qs : ''}`, false);
    if (data) setCrops(data);
    setLoading(false); setRefreshing(false);
  }, [selectedCat, search]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = () => {
    if (canPostMarketplaceListing(session?.role)) navigation.navigate('AddCrop');
    else showToast('Only cooperatives can post listings', 'error');
  };

  const handleCall = (id: string) => {
    setCallingId(id);
    setTimeout(() => { setCallingId(null); showToast('Call simulation ended', 'info'); }, 2000);
  };

  const handleMessage = (crop: any) => {
    navigation.navigate('MessagePreview', {
      cropId: crop.id, cropName: crop.name,
      price: parseFloat(crop.price), unit: crop.unit,
      farmerId: crop.farmer_id,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Marketplace 🛒</Text>
          <View style={[styles.searchWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text, fontFamily: FONT.regular }]}
              placeholder="Search crops..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={load}
              returnKeyType="search"
            />
          </View>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c} onPress={() => setSelectedCat(c)}
              style={[styles.chip, { backgroundColor: selectedCat === c ? colors.primary : colors.surfaceVariant }]}>
              <Text style={[styles.chipText, { color: selectedCat === c ? '#FFFFFF' : colors.textSecondary }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : crops.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text style={{ fontSize: 40 }}>🌾</Text>
            <Text style={[{ color: colors.textSecondary, fontSize: 14, fontFamily: FONT.regular, marginTop: 8 }]}>No crops found</Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            {crops.map((item, i) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                <TouchableOpacity onPress={() => navigation.navigate('CropDetail', { cropId: String(item.id) })} activeOpacity={0.9}>
                  <View style={[styles.listingCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
                    <View style={styles.listingRow}>
                      <LinearGradient colors={[colors.primary + '20', colors.primaryLight + '20']} style={styles.listingEmoji}>
                        <Text style={{ fontSize: 28 }}>{item.emoji || '🌱'}</Text>
                      </LinearGradient>
                      <View style={styles.listingInfo}>
                        <Text style={[styles.listingName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.listingQty, { color: colors.textSecondary }]}>{item.quantity_display}</Text>
                        <View style={styles.listingMeta}>
                          <MapPin size={12} color={colors.textMuted} />
                          <Text style={[styles.listingMetaText, { color: colors.textMuted }]}>{item.location || item.district}</Text>
                        </View>
                      </View>
                      <View style={styles.listingPriceCol}>
                        <Text style={[styles.listingPrice, { color: colors.primary }]}>{item.price}</Text>
                        <Text style={[styles.listingUnit, { color: colors.textSecondary }]}>RWF/{item.unit}</Text>
                      </View>
                    </View>
                    <View style={styles.listingSeller}>
                      <Text style={[styles.sellerText, { color: colors.textSecondary }]}>By {item.farmer_name}</Text>
                    </View>
                    <View style={styles.btnRow}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]} onPress={() => handleCall(String(item.id))}>
                        <PhoneIcon size={16} color={colors.success} />
                        <Text style={[styles.actionBtnText, { color: colors.success }]}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]} onPress={() => handleMessage(item)}>
                        <MessageCircle size={16} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity onPress={handleAdd} style={styles.fab} activeOpacity={0.85}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.fabInner}>
          <Plus size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={!!callingId} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.modalText, { color: colors.text }]}>Calling...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  title: { fontSize: 22, fontFamily: FONT.bold, marginBottom: 12 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14 },
  catScroll: { marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, marginRight: 8 },
  chipText: { fontSize: 12, fontFamily: FONT.medium },
  listSection: { paddingHorizontal: SPACING.lg },
  listingCard: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  listingRow: { flexDirection: 'row', alignItems: 'center' },
  listingEmoji: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listingInfo: { flex: 1 },
  listingName: { fontSize: 15, fontFamily: FONT.semibold },
  listingQty: { fontSize: 12, fontFamily: FONT.regular, marginTop: 2 },
  listingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  listingMetaText: { fontSize: 11, fontFamily: FONT.regular },
  listingPriceCol: { alignItems: 'flex-end' },
  listingPrice: { fontSize: 18, fontFamily: FONT.bold },
  listingUnit: { fontSize: 10, fontFamily: FONT.regular },
  listingSeller: { marginTop: 8, marginBottom: 10 },
  sellerText: { fontSize: 12, fontFamily: FONT.regular },
  btnRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md },
  actionBtnText: { fontSize: 13, fontFamily: FONT.medium },
  fab: { position: 'absolute', bottom: 90, right: 20 },
  fabInner: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { borderRadius: RADIUS.xl, padding: 32, alignItems: 'center', gap: 16 },
  modalText: { fontSize: 16, fontFamily: FONT.semibold },
});