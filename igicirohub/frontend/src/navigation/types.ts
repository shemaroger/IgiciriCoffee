export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  RegisterChoice: undefined;
  RegisterFarmer: undefined;
  RegisterBuyer: undefined;
  ForgotPassword: undefined;
  OTPVerification: undefined;
  ResetPassword: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  AddCrop: undefined;
  MyCrops: undefined;
  Orders: undefined;
  SavedCrops: undefined;
  Settings: undefined;
  PriceDetail: { cropId: string };
  CropDetail: { cropId: string };
  Chat: { conversationId?: number; cropId?: string };
  DiseaseDetection: undefined;
  Notifications: undefined;
  VoiceAssistant: undefined;
  MessagePreview: { cropId?: number; cropName: string; price: number; unit?: string; farmerId?: number };
};

export type AppTabParamList = {
  Home: undefined;
  Prices: undefined;
  Predict: undefined;
  Market: undefined;
  Profile: undefined;
};
