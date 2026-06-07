import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Home, BarChart3, Brain, Store, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';

const TAB_ICONS: Record<string, typeof Home> = {
  Home, Prices: BarChart3, Predict: Brain, Market: Store, Profile: User,
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Home', Prices: 'Prices', Predict: 'AI', Market: 'Market', Profile: 'Profile',
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TabItem = ({ route, isFocused, onPress }: { route: string; isFocused: boolean; onPress: () => void }) => {
  const { colors } = useTheme();
  const Icon = TAB_ICONS[route] || Home;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { damping: 15 }) }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.tab, animStyle]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, isFocused && { backgroundColor: colors.primary + '18' }]}>
        <Icon size={22} color={isFocused ? colors.primary : colors.textMuted} strokeWidth={isFocused ? 2.5 : 1.8} />
      </View>
      <Text style={[styles.label, { color: isFocused ? colors.primary : colors.textMuted, fontFamily: isFocused ? FONT.semibold : FONT.regular }]}>
        {TAB_LABELS[route]}
      </Text>
      {isFocused && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
    </AnimatedTouchable>
  );
};

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { colors } = useTheme();

  if (!state || !state.routes) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder }, SHADOWS.lg]}>
      {state.routes.map((route, index) => {
        if (!route || !route.name) return null;
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return <TabItem key={route.key} route={route.name} isFocused={isFocused} onPress={onPress} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: 16,
    right: 16,
    borderRadius: RADIUS.xxl,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
