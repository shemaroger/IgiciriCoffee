import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { PricesScreen } from '../screens/PricesScreen';
import { PredictScreen } from '../screens/PredictScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CustomTabBar } from './CustomTabBar';
import type { AppTabParamList } from './types';

console.log('Screens:', { HomeScreen, PricesScreen, PredictScreen, MarketplaceScreen, ProfileScreen });

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator = () => (
  <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Prices" component={PricesScreen} />
    <Tab.Screen name="Predict" component={PredictScreen} />
    <Tab.Screen name="Market" component={MarketplaceScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);