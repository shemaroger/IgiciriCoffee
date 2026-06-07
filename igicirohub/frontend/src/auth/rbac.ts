import { UserRole } from './AuthContext';

export const canAccessStack = (role: UserRole | undefined, stack: string): boolean => {
  console.log('[RBAC] canAccessStack called with:', { role, stack });
  if (!role || !stack) return false;
  const cooperativeStacks = ['AddCrop', 'MyCrops', 'DiseaseDetection'];
  const buyerStacks = ['Orders', 'SavedCrops'];
  const commonStacks = ['Settings', 'Notifications', 'VoiceAssistant', 'Chat', 'MessagePreview', 'PriceDetail', 'CropDetail'];
  if (commonStacks.includes(stack)) return true;
  if (role === 'cooperative') return cooperativeStacks.includes(stack) || commonStacks.includes(stack);
  if (role === 'buyer') return buyerStacks.includes(stack) || commonStacks.includes(stack);
  return false;
};

export const canPostMarketplaceListing = (role: UserRole | undefined) => role === 'cooperative';
export const profileShowsListings = (role: UserRole | undefined) => role === 'cooperative';
export const profileShowsOrders = (role: UserRole | undefined) => role === 'buyer';
export const profileShowsSaved = (role: UserRole | undefined) => role === 'buyer' || role === 'cooperative';