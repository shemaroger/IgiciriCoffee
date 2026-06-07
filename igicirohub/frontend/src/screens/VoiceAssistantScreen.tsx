import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring } from 'react-native-reanimated';
import { ArrowLeft, Mic, Volume2, RotateCcw } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { api } from '../services/api';

const LANGUAGES = [
  { label: 'English', code: 'en', flag: '🇬🇧' },
  { label: 'Kinyarwanda', code: 'rw', flag: '🇷🇼' },
  { label: 'Français', code: 'fr', flag: '🇫🇷' },
  { label: 'Swahili', code: 'sw', flag: '🇹🇿' },
];

const QUICK_QUESTIONS: Record<string, string[]> = {
  en: [
    'What is the current price of potatoes?',
    'When should I plant maize in Rwanda?',
    'How do I prevent bean rust?',
    'What is the best season to sell tomatoes?',
  ],
  rw: [
    'Ibiciro by\'ibirayi ni bingahe ubu?',
    'Ni ryari ntera ibigori mu Rwanda?',
    'Ninde wirinda ikirire cy\'ibishyimbo?',
  ],
};

export const VoiceAssistantScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const scale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const askQuestion = async (question: string) => {
    setQuery(question);
    setLoading(true);
    const { data, error } = await api.post<any>('/predictions/ask/', { question, history, language: lang.code });
    setLoading(false);
    if (error) { showToast('Could not get answer', 'error'); return; }
    const answer = data.answer || 'Sorry, I could not find an answer.';
    setResponse(answer);
    setHistory(prev => [...prev.slice(-6), { role: 'user', content: question }, { role: 'assistant', content: answer }]);
  };

  const handleMic = () => {
    if (listening) return;
    setListening(true);
    scale.value = withRepeat(withTiming(1.25, { duration: 500 }), -1, true);
    // Simulate voice recognition (real implementation needs expo-speech-recognition or similar)
    setTimeout(() => {
      scale.value = withSpring(1);
      setListening(false);
      const demos = QUICK_QUESTIONS[lang.code] || QUICK_QUESTIONS.en;
      askQuestion(demos[Math.floor(Math.random() * demos.length)]);
    }, 2000);
  };

  const handlePlay = () => {
    if (!response) return;
    Speech.speak(response, {
      language: lang.code === 'rw' ? 'rw' : lang.code === 'fr' ? 'fr-FR' : lang.code === 'sw' ? 'sw' : 'en-US',
      rate: 0.9,
    });
    showToast('Playing audio...', 'info');
  };

  const handleClear = () => { setQuery(''); setResponse(''); setHistory([]); };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: 20, fontFamily: FONT.bold, color: colors.text }]}>Voice Assistant 🎤</Text>
          <Text style={[{ fontSize: 12, fontFamily: FONT.regular, color: colors.textSecondary }]}>Ask about crop prices in your language</Text>
        </View>
        {(query || response) && (
          <TouchableOpacity onPress={handleClear}><RotateCcw size={18} color={colors.textMuted} /></TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Language tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity key={l.code} onPress={() => setLang(l)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: lang.code === l.code ? colors.primary : colors.surfaceVariant }]}>
              <Text style={{ fontSize: 14 }}>{l.flag}</Text>
              <Text style={[{ fontSize: 12, fontFamily: FONT.medium, color: lang.code === l.code ? '#FFFFFF' : colors.textSecondary }]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mic button */}
        <View style={{ alignItems: 'center', marginVertical: 24 }}>
          <Animated.View style={pulseStyle}>
            <TouchableOpacity onPress={handleMic} disabled={listening || loading}
              style={[{ width: 88, height: 88, borderRadius: 44, backgroundColor: listening ? colors.error : colors.primary, alignItems: 'center', justifyContent: 'center' }, SHADOWS.lg]}>
              {loading ? <ActivityIndicator color="#fff" size="large" /> : <Mic size={36} color="#FFFFFF" />}
            </TouchableOpacity>
          </Animated.View>
          <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.textSecondary, marginTop: 12 }]}>
            {listening ? 'Listening...' : loading ? 'Thinking...' : 'Tap to speak'}
          </Text>
        </View>

        {/* Quick questions */}
        {!query && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[{ fontSize: 14, fontFamily: FONT.semibold, color: colors.text, marginBottom: 10 }]}>Quick Questions</Text>
            {(QUICK_QUESTIONS[lang.code] || QUICK_QUESTIONS.en).map((q) => (
              <TouchableOpacity key={q} onPress={() => askQuestion(q)} disabled={loading}
                style={[{ padding: 14, borderRadius: RADIUS.lg, backgroundColor: colors.surface, marginBottom: 8 }, SHADOWS.sm]}>
                <Text style={[{ fontSize: 13, fontFamily: FONT.regular, color: colors.text }]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Q&A */}
        {query ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={[{ backgroundColor: colors.surfaceVariant, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 }]}>
              <Text style={[{ fontSize: 11, fontFamily: FONT.medium, color: colors.textMuted, marginBottom: 4 }]}>YOU ASKED</Text>
              <Text style={[{ fontSize: 14, fontFamily: FONT.medium, color: colors.text }]}>{query}</Text>
            </View>
            {loading ? (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[{ color: colors.textSecondary, fontSize: 13, fontFamily: FONT.regular, marginTop: 8 }]}>AI is thinking...</Text>
              </View>
            ) : response ? (
              <View style={[{ backgroundColor: colors.primary + '0E', borderRadius: RADIUS.xl, padding: 16 }]}>
                <Text style={[{ fontSize: 11, fontFamily: FONT.medium, color: colors.primary, marginBottom: 6 }]}>AI RESPONSE</Text>
                <Text style={[{ fontSize: 14, fontFamily: FONT.regular, color: colors.text, lineHeight: 22 }]}>{response}</Text>
                <TouchableOpacity onPress={handlePlay} style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md }]}>
                  <Volume2 size={16} color="#FFFFFF" />
                  <Text style={[{ fontSize: 13, fontFamily: FONT.medium, color: '#FFFFFF' }]}>Play Audio</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
};
