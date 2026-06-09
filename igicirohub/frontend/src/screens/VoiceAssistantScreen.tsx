import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSpring,
} from 'react-native-reanimated';
import {
  ArrowLeft, Send, Volume2, RotateCcw,
  Brain, StopCircle, Mic, MicOff,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { api } from '../services/api';

// Safe import for speech recognition
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = (_event: string, _cb: any) => {};
try {
  const sr = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = sr.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = sr.useSpeechRecognitionEvent;
} catch {
  // Not available in Expo Go
}

const LANGUAGES = [
  { code: 'en', name: 'English',     flag: '🇬🇧', speechLang: 'en-US' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼', speechLang: 'rw-RW' },
];

const QUICK_QUESTIONS: Record<string, { category: string; questions: string[] }[]> = {
  en: [
    {
      category: '☕ Prices',
      questions: [
        'What is the current price of Bourbon Arabica?',
        'What is the export price of Rwanda coffee in USD?',
        'What is the difference between Farm Gate and Cooperative price?',
        'Which coffee variety has the highest export price?',
        'What is the price of Robusta vs Arabica?',
      ],
    },
    {
      category: '📅 Seasons',
      questions: [
        'When is Season A for Rwanda coffee?',
        'When is Season B for Rwanda coffee?',
        'When is the Off Season and why are prices higher?',
        'When is the best time to sell coffee for the highest price?',
        'How does Season A affect Farm Gate prices?',
      ],
    },
    {
      category: '🌿 Varieties',
      questions: [
        'What are the 6 Rwanda coffee varieties?',
        'What is the difference between Red Bourbon and Yellow Bourbon?',
        'Which variety is best for specialty export?',
        'What is the Mibirizi variety known for?',
        'Is Robusta coffee good for export from Rwanda?',
      ],
    },
    {
      category: '📦 Processing',
      questions: [
        'What is fully washed coffee and why does it fetch higher prices?',
        'How does altitude affect coffee quality in Rwanda?',
        'What is the difference between parchment and green bean coffee?',
        'How do I improve my coffee quality to get better prices?',
        'What is natural processed coffee?',
      ],
    },
    {
      category: '🌍 Export',
      questions: [
        'How do I export coffee from Rwanda?',
        'What are the top buyers of Rwanda coffee?',
        'What is NAEB and how does it help cooperatives?',
        'What is the SCA score and why does it matter?',
        'Which countries buy the most Rwanda coffee?',
      ],
    },
    {
      category: '🔬 Disease',
      questions: [
        'How do I prevent Coffee Berry Disease?',
        'What is coffee leaf rust and how do I treat it?',
        'What causes the potato taste defect in coffee?',
        'How do I protect my coffee from antestia bug?',
        'What are signs of coffee wilt disease?',
      ],
    },
  ],
  rw: [
    {
      category: '☕ Ibiciro',
      questions: [
        "Bourbon Arabica iracuruzwa ku giciro cy'angahe ubu?",
        "Ikawa y'u Rwanda ikoherezwa hanze ku giciro cy'angahe mu dollar?",
        "Ubutungane hagati ya Farm Gate na Cooperative price ni ubuhe?",
        "Ni ubwoko ubuhe bw'ikawa bufite igiciro cy'ohereza gikomeye?",
        "Igiciro cya Robusta na Arabica ni ikihe?",
      ],
    },
    {
      category: '📅 Igihe',
      questions: [
        "Season A y'ikawa mu Rwanda ni ryari?",
        "Season B y'ikawa ni ryari?",
        "Off Season ni ryari kandi ibiciro bizamuka kubera iki?",
        "Ni ryari igihe cyiza cyo kugurisha ikawa ku giciro gikomeye?",
        "Season A itera ite impinduka ku biciro bya Farm Gate?",
      ],
    },
    {
      category: '🌿 Ubwoko',
      questions: [
        "Ni ubwoko bungahe bw'ikawa buriho mu Rwanda?",
        "Ubutungane hagati ya Red Bourbon na Yellow Bourbon ni ubuhe?",
        "Ni ubwoko ubuhe bwiza cyane ku isoko mpuzamahanga?",
        "Mibirizi yizwi kubera iki?",
        "Robusta yagwa neza mu mahanga avuye mu Rwanda?",
      ],
    },
    {
      category: '📦 Gutunganya',
      questions: [
        "Ikawa isukuwe neza itera ite ibiciro byiza?",
        "Ubutumburuke bw'uturere butera ite ubwiza bw'ikawa?",
        "Ubutungane hagati ya parchment na green bean ni ubuhe?",
        "Ninde niteza imbere ubwiza bw'ikawa yanjye?",
        "Ikawa ya natural process ni iki?",
      ],
    },
    {
      category: '🌍 Kohereza',
      questions: [
        "Ninde kohereza ikawa mu mahanga avuye mu Rwanda?",
        "Ni bande bagura ikawa y'u Rwanda cyane?",
        "NAEB igufasha ite nk'ikoperative?",
        "Ni ibihugu ibihe bigura ikawa y'u Rwanda cyane?",
        "Ninde kubona abashoramari b'ikawa mu mahanga?",
      ],
    },
    {
      category: '🔬 Indwara',
      questions: [
        "Ninde kwirinda indwara y'imbuto za kawa (CBD)?",
        "Isuri ry'amababi ya kawa ni iki kandi nirinda gute?",
        "Ubutane bw'ibirayi mu kawa buturuka he?",
        "Ninde kwirinda inzoka ya antestia mu kawa?",
        "Ibimenyetso by'indwara y'urupfu rwa kawa ni ibihe?",
      ],
    },
  ],
};

// ── TTS helper ─────────────────────────────────────────────────────────────
const speakText = (text: string, onDone?: () => void) => {
  try {
    Speech.stop();
    setTimeout(() => {
      Speech.speak(text, {
        language: 'en-US',
        rate: 0.85,
        pitch: 1.0,
        onDone:    onDone,
        onStopped: onDone,
        onError:   () => onDone?.(),
      });
    }, 300);
  } catch (e) {
    console.log('[Speech]', e);
    onDone?.();
  }
};

export const VoiceAssistantScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [lang, setLang]                       = useState(LANGUAGES[0]);
  const [input, setInput]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const [speaking, setSpeaking]               = useState(false);
  const [listening, setListening]             = useState(false);
  const [transcript, setTranscript]           = useState('');
  const [activeCategory, setActiveCategory]   = useState(0);
  const [history, setHistory]                 = useState<any[]>([]);
  const [currentAnswer, setCurrentAnswer]     = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');

  const micScale   = useSharedValue(1);
  const micStyle   = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }));
  const categories = QUICK_QUESTIONS[lang.code];
  const voiceAvailable = !!ExpoSpeechRecognitionModule;

  // ── Speech recognition events ──────────────────────────────────────────
  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    setTranscript('');
    micScale.value = withRepeat(withTiming(1.2, { duration: 500 }), -1, true);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    micScale.value = withSpring(1);
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const text = event.results?.[0]?.transcript || '';
    setTranscript(text);
    setInput(text);
    if (event.isFinal && text.trim()) askQuestion(text.trim());
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    setListening(false);
    micScale.value = withSpring(1);
    showToast(
      lang.code === 'rw'
        ? 'Kwiyumvisha ijwi byanze. Ongera ugerageze.'
        : `Voice error: ${event.message}`,
      'error'
    );
  });

  // ── Mic ────────────────────────────────────────────────────────────────
  const handleMic = async () => {
    if (!voiceAvailable) {
      showToast(
        lang.code === 'rw'
          ? 'Ijwi ntirishoboka muri Expo Go. Andika ikibazo hepfo.'
          : 'Voice input not available in Expo Go. Type your question instead.',
        'info'
      );
      return;
    }
    if (listening) { ExpoSpeechRecognitionModule.stop(); return; }
    Speech.stop(); setSpeaking(false);
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      showToast(
        lang.code === 'rw' ? 'Ntitwabonye uruhushya rwo gukoresha microphone' : 'Microphone permission denied',
        'error'
      );
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: lang.speechLang, interimResults: true, continuous: false });
  };

  // ── Ask question ───────────────────────────────────────────────────────
  const askQuestion = async (question: string) => {
    if (!question.trim() || loading) return;
    setCurrentQuestion(question);
    setCurrentAnswer('');
    setInput('');
    setTranscript('');
    setLoading(true);
    Speech.stop();
    setSpeaking(false);

    const { data, error } = await api.post<any>('/predictions/voice/', {
      question,
      history: history.slice(-10),
      language: lang.code,
    });

    setLoading(false);

    if (error) {
      showToast(
        lang.code === 'rw' ? 'Ntibishoboye kubona igisubizo' : 'Could not get answer',
        'error'
      );
      return;
    }

    const answer = data.answer || (
      lang.code === 'rw'
        ? 'Mbabarira, sinshobora kubona igisubizo.'
        : 'Sorry, I could not find an answer.'
    );

    setCurrentAnswer(answer);
    setHistory(prev => [
      ...prev.slice(-10),
      { role: 'user',      content: question },
      { role: 'assistant', content: answer },
    ]);

    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);

    // Auto-play response
    setSpeaking(true);
    speakText(answer, () => setSpeaking(false));
  };

  const handlePlay = () => {
    if (!currentAnswer) return;
    if (speaking) { Speech.stop(); setSpeaking(false); return; }
    setSpeaking(true);
    speakText(currentAnswer, () => setSpeaking(false));
  };

  const handleSend = () => { if (input.trim()) askQuestion(input.trim()); };

  const handleClear = () => {
    setCurrentQuestion(''); setCurrentAnswer('');
    setHistory([]); setInput(''); setTranscript('');
    Speech.stop(); setSpeaking(false);
    if (listening && voiceAvailable) ExpoSpeechRecognitionModule.stop();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontFamily: FONT.bold, color: '#fff' }}>
              ☕ Coffee AI Expert
            </Text>
            <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.75)' }}>
              {lang.code === 'rw'
                ? "Umujyanama w'ikawa — Vuga cyangwa Andika"
                : 'Gemini AI · 6 Varieties · 3 Price Types · Seasons'}
            </Text>
          </View>
          {(currentQuestion || history.length > 0) && (
            <TouchableOpacity
              onPress={handleClear}
              style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <RotateCcw size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Language toggle */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity
              key={l.code}
              onPress={() => { setLang(l); setActiveCategory(0); handleClear(); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full,
                backgroundColor: lang.code === l.code ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
              }}
            >
              <Text style={{ fontSize: 14 }}>{l.flag}</Text>
              <Text style={{
                fontSize: 13, fontFamily: FONT.semibold,
                color: lang.code === l.code ? colors.primary : '#FFFFFF',
              }}>
                {l.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Input box ── */}
        <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 12, marginBottom: 20 }, SHADOWS.sm]}>
          {listening && (
            <Animated.View entering={FadeInDown.duration(200)} style={{ backgroundColor: colors.primary + '10', borderRadius: RADIUS.lg, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontFamily: FONT.semibold, color: colors.primary, marginBottom: 2 }}>
                {lang.code === 'rw' ? '🎤 Niyumva...' : '🎤 Listening...'}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: FONT.regular, color: colors.text }}>
                {transcript || (lang.code === 'rw' ? "Vuga ikibazo cy'ikawa..." : 'Speak your question...')}
              </Text>
            </Animated.View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            {/* Mic */}
            <Animated.View style={micStyle}>
              <TouchableOpacity
                onPress={handleMic}
                disabled={loading}
                style={{
                  width: 48, height: 48, borderRadius: 16,
                  backgroundColor: listening ? colors.error : voiceAvailable ? colors.primary + '15' : colors.surfaceVariant,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: listening ? colors.error : voiceAvailable ? colors.primary : colors.border,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {listening
                  ? <MicOff size={22} color={colors.error} />
                  : <Mic size={22} color={voiceAvailable ? colors.primary : colors.textMuted} />}
              </TouchableOpacity>
            </Animated.View>

            {/* Text input */}
            <TextInput
              style={{ flex: 1, fontSize: 14, fontFamily: FONT.regular, color: colors.text, maxHeight: 100, minHeight: 44, paddingVertical: 8 }}
              placeholder={lang.code === 'rw' ? "Andika ikibazo cy'ikawa..." : 'Type your coffee question...'}
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />

            {/* Send */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: input.trim() && !loading ? colors.primary : colors.surfaceVariant,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {loading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Send size={18} color={input.trim() ? '#fff' : colors.textMuted} />}
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>
            {speaking
              ? (lang.code === 'rw' ? '🔊 AI irimo kuvuga igisubizo...' : '🔊 AI is speaking the response...')
              : voiceAvailable
                ? (lang.code === 'rw' ? '🎤 Vuga · ✏️ Andika' : '🎤 Tap mic to speak · ✏️ Or type')
                : (lang.code === 'rw' ? '✏️ Andika ikibazo — AI izagisubiza' : '✏️ Type a question — AI will answer and read it aloud')}
          </Text>
        </View>

        {/* ── Q&A ── */}
        {currentQuestion ? (
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 24 }}>
            <View style={{ backgroundColor: colors.primary + '12', borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
              <Text style={{ fontSize: 11, fontFamily: FONT.semibold, color: colors.primary, marginBottom: 4 }}>
                {lang.code === 'rw' ? 'IKIBAZO CYAWE' : 'YOUR QUESTION'}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: FONT.medium, color: colors.text }}>{currentQuestion}</Text>
            </View>

            {loading ? (
              <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 24, alignItems: 'center' }, SHADOWS.sm]}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: FONT.regular, marginTop: 12 }}>
                  {lang.code === 'rw' ? '🤖 Gemini AI irimo gutekereza...' : '🤖 Gemini AI is thinking...'}
                </Text>
              </View>
            ) : currentAnswer ? (
              <Animated.View entering={FadeInDown.duration(300)}>
                <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16 }, SHADOWS.sm]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Brain size={16} color={colors.success} />
                    <Text style={{ fontSize: 11, fontFamily: FONT.semibold, color: colors.success }}>
                      {lang.code === 'rw' ? "IGISUBIZO CY'AI (Gemini)" : 'AI RESPONSE (Gemini)'}
                    </Text>
                    {speaking && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                        <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.success }}>
                          {lang.code === 'rw' ? 'Irimo kuvuga' : 'Speaking'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, fontFamily: FONT.regular, color: colors.text, lineHeight: 22 }}>
                    {currentAnswer}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      onPress={handlePlay}
                      style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: speaking ? colors.error : colors.primary, paddingVertical: 10, borderRadius: RADIUS.lg }, SHADOWS.sm]}
                    >
                      {speaking ? <StopCircle size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
                      <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: '#fff' }}>
                        {speaking ? (lang.code === 'rw' ? 'Hagarika' : 'Stop') : (lang.code === 'rw' ? '🔊 Umva' : '🔊 Play')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setCurrentQuestion(''); setCurrentAnswer(''); Speech.stop(); setSpeaking(false); }}
                      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.lg, backgroundColor: colors.surfaceVariant }}
                    >
                      <Text style={{ fontSize: 13, fontFamily: FONT.medium, color: colors.textSecondary }}>
                        {lang.code === 'rw' ? 'Indi' : 'New Q'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}

        {/* ── Quick Questions ── */}
        <Text style={{ fontSize: 15, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
          {lang.code === 'rw' ? '☕ Ibibazo bishije cyane' : '☕ Quick Questions'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {categories.map((cat, i) => (
            <TouchableOpacity
              key={cat.category}
              onPress={() => setActiveCategory(i)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: RADIUS.full, marginRight: 8,
                backgroundColor: activeCategory === i ? colors.primary : colors.surfaceVariant,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: activeCategory === i ? '#FFFFFF' : colors.textSecondary }}>
                {cat.category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Animated.View entering={FadeInDown.duration(300)}>
          {categories[activeCategory]?.questions.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => askQuestion(q)}
              disabled={loading || listening}
              style={[{
                padding: 14, borderRadius: RADIUS.lg, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: currentQuestion === q ? colors.primary + '12' : colors.surface,
                borderWidth: currentQuestion === q ? 1 : 0,
                borderColor: currentQuestion === q ? colors.primary : 'transparent',
                opacity: (loading || listening) ? 0.6 : 1,
              }, SHADOWS.sm]}
            >
              <Text style={{ fontSize: 18 }}>{categories[activeCategory].category.split(' ')[0]}</Text>
              <Text style={{ flex: 1, fontSize: 13, fontFamily: FONT.regular, color: currentQuestion === q ? colors.primary : colors.text, lineHeight: 18 }}>
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── History ── */}
        {history.length >= 4 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 14, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
              {lang.code === 'rw' ? "📜 Amateka y'ikiganiro" : '📜 Conversation History'}
            </Text>
            {history.slice(-8).map((h: any, i: number) => (
              <View key={i} style={{ padding: 12, borderRadius: RADIUS.lg, marginBottom: 6, backgroundColor: h.role === 'user' ? colors.surfaceVariant : colors.primary + '10' }}>
                <Text style={{ fontSize: 10, fontFamily: FONT.semibold, color: colors.textMuted, marginBottom: 3 }}>
                  {h.role === 'user' ? (lang.code === 'rw' ? '👤 WEWE' : '👤 YOU') : '🤖 GEMINI AI'}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: colors.text, lineHeight: 18 }}>
                  {h.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};