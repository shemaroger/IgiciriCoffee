import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, runOnJS,
} from 'react-native-reanimated';
import { Check, X, Info } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

const { width } = Dimensions.get('window');

export const AppToastProvider = ({ children }: { children: ReactNode }) => {
  const { colors } = useTheme();
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
  const translateY = useSharedValue(-100);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type, visible: true });
    translateY.value = -100;
    translateY.value = withTiming(0, { duration: 350 });
    translateY.value = withDelay(2500, withTiming(-100, { duration: 300 }, () => {
      runOnJS(hideToast)();
    }));
  }, [translateY, hideToast]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const getToastColor = () => {
    switch (toast.type) {
      case 'success': return colors.success;
      case 'error': return colors.error;
      case 'info': return colors.info;
    }
  };

  const getIcon = () => {
    const iconColor = '#FFFFFF';
    switch (toast.type) {
      case 'success': return <Check size={18} color={iconColor} />;
      case 'error': return <X size={18} color={iconColor} />;
      case 'info': return <Info size={18} color={iconColor} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View style={[styles.container, animStyle]}>
          <View style={[styles.toast, { backgroundColor: getToastColor() }, SHADOWS.md]}>
            <View style={styles.iconWrap}>{getIcon()}</View>
            <Text style={[styles.text, { fontFamily: FONT.medium }]}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    width: width - 32,
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
});
