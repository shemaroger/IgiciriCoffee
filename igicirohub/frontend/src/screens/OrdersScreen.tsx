import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { FONT } from '../theme/tokens';

export const OrdersScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  return (
    <ScreenWrapper scrollable padded>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, marginBottom: 16 }}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        <ShoppingBag size={56} color={colors.textMuted} />
        <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text, marginTop: 16 }]}>Orders 📦</Text>
        <Text style={[{ fontSize: 14, fontFamily: FONT.regular, color: colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 }]}>
          Order tracking coming soon! Use the marketplace and messaging to negotiate and place orders directly with farmers.
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Market')} style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16 }}>
          <Text style={{ color: '#fff', fontFamily: FONT.semibold, fontSize: 15 }}>Browse Marketplace</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};
