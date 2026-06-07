import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { AppNavigator } from './AppNavigator';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterChoiceScreen } from '../screens/RegisterChoiceScreen';
import { RegisterFarmerScreen } from '../screens/RegisterFarmerScreen';
import { RegisterBuyerScreen } from '../screens/RegisterBuyerScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { AddCropScreen } from '../screens/AddCropScreen';
import { MyCropsScreen } from '../screens/MyCropsScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { SavedCropsScreen } from '../screens/SavedCropsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PriceDetailScreen } from '../screens/PriceDetailScreen';
import { CropDetailScreen } from '../screens/CropDetailScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { DiseaseDetectionScreen } from '../screens/DiseaseDetectionScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { VoiceAssistantScreen } from '../screens/VoiceAssistantScreen';
import { MessagePreviewScreen } from '../screens/MessagePreviewScreen';
import type { RootStackParamList, AuthStackParamList, AppStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack  = createNativeStackNavigator<AuthStackParamList>();
const AppStack   = createNativeStackNavigator<AppStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login"           component={LoginScreen} />
    <AuthStack.Screen name="RegisterChoice"  component={RegisterChoiceScreen} />
    <AuthStack.Screen name="RegisterFarmer"  component={RegisterFarmerScreen} />
    <AuthStack.Screen name="RegisterBuyer"   component={RegisterBuyerScreen} />
    <AuthStack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} />
    <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    <AuthStack.Screen name="ResetPassword"   component={ResetPasswordScreen} />
  </AuthStack.Navigator>
);

const AppNavigatorStack = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="MainTabs"        component={AppNavigator} />
    <AppStack.Screen name="AddCrop"         component={AddCropScreen} />
    <AppStack.Screen name="MyCrops"         component={MyCropsScreen} />
    <AppStack.Screen name="Orders"          component={OrdersScreen} />
    <AppStack.Screen name="SavedCrops"      component={SavedCropsScreen} />
    <AppStack.Screen name="Settings"        component={SettingsScreen} />
    <AppStack.Screen name="PriceDetail"     component={PriceDetailScreen} />
    <AppStack.Screen name="CropDetail"      component={CropDetailScreen} />
    <AppStack.Screen name="Chat"            component={ChatScreen} />
    <AppStack.Screen name="DiseaseDetection" component={DiseaseDetectionScreen} />
    <AppStack.Screen name="Notifications"   component={NotificationsScreen} />
    <AppStack.Screen name="VoiceAssistant"  component={VoiceAssistantScreen} />
    <AppStack.Screen name="MessagePreview"  component={MessagePreviewScreen} />
  </AppStack.Navigator>
);

export const RootNavigator = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Splash" component={SplashScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {session ? (
          <RootStack.Screen name="App" component={AppNavigatorStack} />
        ) : (
          <>
            <RootStack.Screen name="Welcome" component={WelcomeScreen} />
            <RootStack.Screen name="Splash"  component={SplashScreen} />
            <RootStack.Screen name="Auth"    component={AuthNavigator} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};