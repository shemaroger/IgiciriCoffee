import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  tabScreen?: boolean;
}

export const ScreenWrapper = ({ children, scrollable = true, padded = true, tabScreen = false }: Props) => {
  const { colors, mode } = useTheme();

  const content = (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[padded && styles.padded, tabScreen && styles.tabPadding]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.padded]}>
          {children}
        </View>
      )}
    </View>
  );

  return <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>{content}</SafeAreaView>;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  padded: { paddingHorizontal: 16 },
  tabPadding: { paddingBottom: 100 },
});
