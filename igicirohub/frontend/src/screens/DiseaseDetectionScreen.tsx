import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, Modal, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Camera, Upload, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { api } from '../services/api';

const CROPS = ['Potatoes (Ibirayi)', 'Beans (Ibishyimbo)', 'Maize (Ibigori)', 'Tomatoes (Inyanya)', 'Rice (Umuceri)', 'Bananas (Ibitoki)', 'Carrots (Karoti)', 'Other'];

export const DiseaseDetectionScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'choose' | 'scanning' | 'result'>('choose');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [result, setResult] = useState<any>(null);
  const [cropPicker, setCropPicker] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || '');
      }
    } catch {
      showToast('Could not access camera/gallery', 'error');
    }
  };

  const handleScan = async () => {
    if (!imageBase64) { showToast('Select an image first', 'error'); return; }
    setPhase('scanning');
    const { data, error } = await api.post<any>('/predictions/detect-disease/', {
      image_base64: imageBase64,
      crop_name: selectedCrop,
      mime_type: 'image/jpeg',
    });
    if (error || !data) {
      showToast('Scan failed', 'error'); setPhase('choose'); return;
    }
    setResult(data);
    setPhase('result');
    showToast('Scan complete! 🔬', 'success');
  };

  if (phase === 'scanning') return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text, marginTop: 16 }]}>Analyzing leaf...</Text>
      <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary, marginTop: 4 }]}>AI is processing your image</Text>
    </View>
  );

  if (phase === 'result' && result) {
    const sevColor = result.severity === 'High' ? colors.error : result.severity === 'Medium' ? colors.warning : colors.success;
    return (
      <ScrollView style={[{ flex: 1, backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => { setPhase('choose'); setImageUri(null); setImageBase64(null); }}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text }]}>Scan Results 🔬</Text>
        </View>
        <View style={{ padding: 16 }}>
          {imageUri && <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: RADIUS.xl, marginBottom: 16 }} resizeMode="cover" />}
          <Animated.View entering={FadeInDown.duration(500)} style={[{ borderRadius: RADIUS.xl, padding: 20, marginBottom: 12, backgroundColor: colors.surface }, SHADOWS.md]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {result.healthy ? <CheckCircle size={28} color={colors.success} /> : <AlertTriangle size={28} color={colors.error} />}
              <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text }]}>{result.healthy ? 'Healthy Plant' : result.disease_name || 'Disease Detected'}</Text>
            </View>
            <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary, marginBottom: 16 }]}>Crop: {selectedCrop}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={[{ flex: 1, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', backgroundColor: colors.primary + '15' }]}>
                <Text style={[{ fontSize: 18, fontFamily: FONT.bold, color: colors.primary }]}>{result.confidence}</Text>
                <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.textSecondary, marginTop: 4 }]}>Confidence</Text>
              </View>
              <View style={[{ flex: 1, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', backgroundColor: sevColor + '15' }]}>
                <Text style={[{ fontSize: 18, fontFamily: FONT.bold, color: sevColor }]}>{result.severity}</Text>
                <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.textSecondary, marginTop: 4 }]}>Severity</Text>
              </View>
            </View>
            {result.symptoms ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={[{ fontSize: 14, fontFamily: FONT.semibold, color: colors.text, marginBottom: 4 }]}>Symptoms</Text>
                <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary, lineHeight: 20 }]}>{result.symptoms}</Text>
              </View>
            ) : null}
            <View style={{ marginBottom: 12 }}>
              <Text style={[{ fontSize: 14, fontFamily: FONT.semibold, color: colors.text, marginBottom: 4 }]}>Treatment</Text>
              <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary, lineHeight: 20 }]}>{result.treatment}</Text>
            </View>
            <View>
              <Text style={[{ fontSize: 14, fontFamily: FONT.semibold, color: colors.text, marginBottom: 4 }]}>Prevention</Text>
              <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary, lineHeight: 20 }]}>{result.prevention}</Text>
            </View>
          </Animated.View>
          <GradientButton title="Scan Another" onPress={() => { setPhase('choose'); setImageUri(null); setImageBase64(null); }} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[{ flex: 1, backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
        <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text }]}>Disease Detection 🌿</Text>
      </View>
      <View style={{ padding: 16 }}>
        <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary, marginBottom: 20 }]}>Scan your crop leaves using AI for instant disease diagnosis</Text>

        {/* Crop selector */}
        <TouchableOpacity onPress={() => setCropPicker(true)} style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: RADIUS.lg, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.border, marginBottom: 20 }]}>
          <Text style={[{ fontFamily: FONT.medium, fontSize: 14, color: colors.text }]}>🌱 {selectedCrop}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Change ▾</Text>
        </TouchableOpacity>

        {/* Image options */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {[
            { icon: Camera, label: 'Scan Leaf', desc: 'Use camera', onPress: () => pickImage(true), iconColor: colors.primary },
            { icon: Upload, label: 'Upload', desc: 'From gallery', onPress: () => pickImage(false), iconColor: colors.secondary },
          ].map(({ icon: Icon, label, desc, onPress, iconColor }) => (
            <TouchableOpacity key={label} onPress={onPress} style={[{ flex: 1, borderRadius: RADIUS.xl, padding: 20, alignItems: 'center', backgroundColor: colors.surface }, SHADOWS.md]} activeOpacity={0.8}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: iconColor + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={28} color={iconColor} />
              </View>
              <Text style={[{ fontSize: 14, fontFamily: FONT.semibold, color: colors.text, marginBottom: 4 }]}>{label}</Text>
              <Text style={[{ fontSize: 11, fontFamily: FONT.regular, color: colors.textSecondary }]}>{desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        {imageUri && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 20 }}>
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: RADIUS.xl }} resizeMode="cover" />
            <GradientButton title="🔬 Analyze with AI" onPress={handleScan} style={{ marginTop: 14 }} />
          </Animated.View>
        )}
      </View>

      <Modal visible={cropPicker} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setCropPicker(false)}>
          <View style={[{ borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 }, { backgroundColor: colors.surface }]}>
            <Text style={[{ fontSize: 18, fontFamily: FONT.semibold, marginBottom: 12, color: colors.text }]}>Select Crop</Text>
            <FlatList data={CROPS} keyExtractor={i => i} renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { setSelectedCrop(item); setCropPicker(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                <Text style={[{ fontSize: 15, fontFamily: selectedCrop === item ? FONT.semibold : FONT.regular, color: selectedCrop === item ? colors.primary : colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )} style={{ maxHeight: 320 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};
