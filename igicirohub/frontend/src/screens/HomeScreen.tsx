import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Sun, BarChart3, Brain, Store, Camera, TrendingUp, TrendingDown, ChevronRight, Plus, Search, Heart, Leaf } from 'lucide-react-native';
import { GradientCard } from '../components/GradientCard';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { session } = useAuth();
  const role = session?.role ?? 'guest';
  const name = session?.displayName ?? 'Guest';
  const isFarmer = role === 'farmer';

  const [trendingPrices, setTrendingPrices] = useState<any[]>([]);
  const [recentCrops, setRecentCrops] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCrops: 0, activeListed: 0 });
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [priceRes, unreadRes] = await Promise.all([
        api.get<any[]>('/prices/trending/'),
        session?.id ? api.get<any>('/chat/unread/') : Promise.resolve({ data: { unread_count: 0 } }),
      ]);
      if (priceRes.data) setTrendingPrices(priceRes.data.slice(0, 4));
      if (unreadRes.data) setUnread(unreadRes.data.unread_count || 0);

      if (isFarmer && session?.id) {
        const cropsRes = await api.get<any[]>('/crops/my-crops/');
        if (cropsRes.data) {
          setRecentCrops(cropsRes.data.slice(0, 4));
          setStats({
            totalCrops: cropsRes.data.length,
            activeListed: cropsRes.data.filter((c: any) => c.status === 'listed').length,
          });
        }
      } else if (role === 'buyer' || role === 'guest') {
        const mktRes = await api.get<any[]>('/crops/marketplace/', false);
        if (mktRes.data) setRecentCrops(mktRes.data.slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [session?.id, isFarmer, role]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = isFarmer
    ? [
        { icon: Plus,    label: 'Add Crop',  gradient: 'primary' as const, route: 'AddCrop' },
        { icon: Store,   label: 'Market',    gradient: 'warm'    as const, route: 'Market' },
        { icon: Brain,   label: 'AI Predict',gradient: 'primary' as const, route: 'Predict' },
        { icon: Camera,  label: 'Scan',      gradient: 'warm'    as const, route: 'DiseaseDetection' },
      ]
    : [
        { icon: Search,  label: 'Browse',    gradient: 'primary' as const, route: 'Market' },
        { icon: BarChart3,label:'Prices',    gradient: 'warm'    as const, route: 'Prices' },
        { icon: Heart,   label: 'Saved',     gradient: 'primary' as const, route: 'SavedCrops' },
        { icon: Brain,   label: 'AI Predict',gradient: 'warm'    as const, route: 'Predict' },
      ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()} 👋</Text>
          <Text style={[styles.name, { color: colors.text }]}>{isFarmer ? `${name}, Farmer` : `${name}, ${role === 'buyer' ? 'Buyer' : 'Explorer'}`}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={[styles.bellWrap, { backgroundColor: colors.surfaceVariant }]}>
          <Bell size={20} color={colors.text} />
          {unread > 0 && <View style={[styles.bellDot, { backgroundColor: colors.error }]} />}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ paddingHorizontal: SPACING.lg }}>
        <GradientCard>
          <View style={styles.weatherRow}>
            <View>
              <Text style={styles.weatherLocation}>📍 Kigali, Rwanda</Text>
              <View style={styles.weatherTempRow}><Text style={styles.weatherTemp}>24°</Text><Text style={styles.weatherDesc}>Sunny</Text></View>
              <Text style={styles.weatherTip}>Great day for harvesting 🌾</Text>
            </View>
            <Sun size={48} color="#FFD54F" />
          </View>
        </GradientCard>
      </Animated.View>

      {isFarmer && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.statsRow}>
          {[
            { label: 'My Crops', value: String(stats.totalCrops), emoji: '🌱' },
            { label: 'Listed', value: String(stats.activeListed), emoji: '📦' },
            { label: 'Messages', value: String(unread), emoji: '💬' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity key={a.label} onPress={() => navigation.navigate(a.route)} activeOpacity={0.7} style={styles.actionItem}>
              <LinearGradient colors={a.gradient === 'warm' ? [colors.gradientWarmStart, colors.gradientWarmEnd] : [colors.gradientStart, colors.gradientEnd]} style={styles.actionIcon}>
                <a.icon size={22} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={{ paddingHorizontal: SPACING.lg }}>
        <TouchableOpacity onPress={() => navigation.navigate('Market')} activeOpacity={0.85}>
          <LinearGradient colors={[colors.gradientWarmStart, colors.gradientWarmEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
            <View>
              <Text style={styles.bannerTag}>MARKETPLACE</Text>
              <Text style={styles.bannerTitle}>{isFarmer ? 'Sell Your Crops\nDirectly' : 'Browse Fresh\nCrops'}</Text>
              <View style={styles.bannerCta}><Text style={styles.bannerCtaText}>Explore</Text><ChevronRight size={14} color="#FFFFFF" /></View>
            </View>
            <Text style={styles.bannerEmoji}>🌽🥔🫘</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}><Leaf size={16} color={colors.primary} /><Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Prices</Text></View>
          <TouchableOpacity onPress={() => navigation.navigate('Prices')}><Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text></TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : trendingPrices.length === 0 ? (
          <Text style={[{ color: colors.textSecondary, fontSize: 13, fontFamily: FONT.regular }]}>No price data yet.</Text>
        ) : (
          trendingPrices.map((crop) => (
            <TouchableOpacity key={crop.id} onPress={() => navigation.navigate('PriceDetail', { cropId: String(crop.id) })} style={[styles.cropCard, { backgroundColor: colors.surface }, SHADOWS.sm]} activeOpacity={0.8}>
              <View style={[styles.cropEmoji, { backgroundColor: colors.surfaceVariant }]}><Text style={{ fontSize: 22 }}>{crop.emoji}</Text></View>
              <View style={styles.cropInfo}>
                <Text style={[styles.cropName, { color: colors.text }]}>{crop.name}</Text>
                <Text style={[styles.cropPrice, { color: colors.textSecondary }]}>{crop.price} RWF/{crop.unit}</Text>
              </View>
              <View style={styles.cropTrend}>
                {crop.trend === 'up' ? <TrendingUp size={14} color={colors.success} /> : <TrendingDown size={14} color={colors.error} />}
                <Text style={[styles.cropChange, { color: crop.trend === 'up' ? colors.success : colors.error }]}>
                  {parseFloat(crop.change) >= 0 ? '+' : ''}{crop.change}%
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{isFarmer ? 'My Recent Crops' : 'Available Near You'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentCrops.map((item: any) => (
            <TouchableOpacity key={item.id} onPress={() => navigation.navigate(isFarmer ? 'MyCrops' : 'CropDetail', { cropId: String(item.id) })} style={[styles.recentCard, { backgroundColor: colors.surface }, SHADOWS.sm]} activeOpacity={0.8}>
              <LinearGradient colors={[colors.primary + '20', colors.primaryLight + '20']} style={styles.recentEmoji}>
                <Text style={{ fontSize: 32 }}>{item.emoji || '🌱'}</Text>
              </LinearGradient>
              <Text style={[styles.recentName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.recentSub, { color: colors.textSecondary }]}>{item.quantity_display || `${item.quantity} ${item.unit}`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, marginBottom: 16 },
  greeting: { fontSize: 13, fontFamily: FONT.regular },
  name: { fontSize: 20, fontFamily: FONT.bold },
  bellWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF' },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherLocation: { fontSize: 12, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  weatherTempRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  weatherTemp: { fontSize: 38, fontFamily: FONT.bold, color: '#FFFFFF' },
  weatherDesc: { fontSize: 13, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.7)' },
  weatherTip: { fontSize: 11, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: 10, marginTop: 16 },
  statCard: { flex: 1, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center' },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 20, fontFamily: FONT.bold },
  statLabel: { fontSize: 10, fontFamily: FONT.regular, marginTop: 2 },
  section: { paddingHorizontal: SPACING.lg, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontFamily: FONT.semibold, marginBottom: 12 },
  seeAll: { fontSize: 12, fontFamily: FONT.medium },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  actionItem: { alignItems: 'center', width: (width - 64) / 4 },
  actionIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 11, fontFamily: FONT.medium },
  banner: { borderRadius: RADIUS.xl, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bannerTag: { fontSize: 10, fontFamily: FONT.semibold, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  bannerTitle: { fontSize: 18, fontFamily: FONT.bold, color: '#FFFFFF', lineHeight: 24 },
  bannerCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  bannerCtaText: { fontSize: 12, fontFamily: FONT.medium, color: '#FFFFFF' },
  bannerEmoji: { fontSize: 36 },
  cropCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: RADIUS.lg, marginBottom: 10 },
  cropEmoji: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cropInfo: { flex: 1 },
  cropName: { fontSize: 14, fontFamily: FONT.medium },
  cropPrice: { fontSize: 12, fontFamily: FONT.regular, marginTop: 2 },
  cropTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cropChange: { fontSize: 13, fontFamily: FONT.semibold },
  recentCard: { width: 140, borderRadius: RADIUS.lg, padding: 12, marginRight: 12 },
  recentEmoji: { width: '100%', height: 80, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recentName: { fontSize: 13, fontFamily: FONT.medium },
  recentSub: { fontSize: 11, fontFamily: FONT.regular, marginTop: 2 },
});
