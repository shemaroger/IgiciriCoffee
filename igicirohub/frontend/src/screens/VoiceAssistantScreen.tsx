import React, { useState, useRef, useEffect } from 'react';
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
  Brain, StopCircle, Mic, MicOff, AlertCircle,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAppToast } from '../hooks/useAppToast';
import { FONT, RADIUS, SHADOWS } from '../theme/tokens';
import { coffeeAPI, getCoffeeCategories, getCoffeeLanguages, initializeCoffeeAssistant } from '../services/api';

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

// =====================================================
// COFFEE QUESTIONS DATASET
// =====================================================

const COFFEE_QUESTIONS_BY_CATEGORY: Record<string, Record<string, { category: string; questions: string[] }[]>> = {
  en: [
    {
      category: '☕ Prices',
      questions: [
        'What is the current price of Arabica Bourbon?',
        'What is the export price of Rwanda coffee in USD?',
        'Which district has the highest coffee price?',
        'What is the price difference between Arabica and Robusta?',
        'What is the price of macadamia this season?',
      ],
    },
    {
      category: '📅 Seasons',
      questions: [
        'When is the main coffee harvest season in Rwanda?',
        'When is the fly crop season for coffee?',
        'When is the best time to sell coffee for the highest price?',
        'How does season affect coffee prices?',
        'When does tea harvest peak in Rwanda?',
      ],
    },
    {
      category: '🌿 Cash Crops',
      questions: [
        'What is the price of tea per kg in Rwanda?',
        'Which cash crop has the best export price?',
        'What is the price of pyrethrum this season?',
        'How much does chili pepper sell for per kg?',
        'Is avocado a good cash crop in Rwanda?',
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
        "Arabica Bourbon iracuruzwa ku giciro cy'angahe ubu?",
        "Ikawa y'u Rwanda ikoherezwa hanze ku giciro cy'angahe mu dollar?",
        "Uturere two hehe tufite ibiciro by'ikawa byiza cyane?",
        "Ubutungane bw'ibiciro hagati ya Arabica na Robusta ni ubuhe?",
        "Macadamia iracuruzwa ku giciro cy'angahe muri iki gihe?",
      ],
    },
    {
      category: '📅 Igihe',
      questions: [
        "Igihe cy'isarura ry'ibihangange ni ryari mu Rwanda?",
        'Imbuto nto isarurwa ryari?',
        "Ni ryari ibiciro by'ikawa bikuze cyane mu mwaka?",
        "Igihe cy'isarura gitera ite impinduka ku biciro?",
        'Icyayi gisarurwa ryari mu Rwanda?',
      ],
    },
    {
      category: '🌿 Cash Crops',
      questions: [
        "Icyayi giracuruzwa ku giciro cy'angahe kuri kg?",
        'Ni ibihingwa ibihe bifite agaciro gakomeye ko kohereza?',
        "Umuravumba uracuruzwa ku giciro cy'angahe?",
        "Urusenda rw'umunyu uracuruzwa ku giciro cy'angahe?",
        "Avoka ni igihingwa cy'indashyikirwa mu Rwanda?",
      ],
    },
    {
      category: '📦 Gutunganya',
      questions: [
        'Ikawa isukuwe neza itera ite ibiciro byiza?',
        "Ubutumburuke bw'uturere butera ite ubwiza bw'ikawa?",
        'Ubutungane hagati ya parchment na green bean ni ubuhe?',
        "Ninde niteza imbere ubwiza bw'ikawa yanjye?",
        'Ikawa ya natural process ni iki?',
      ],
    },
    {
      category: '🌍 Kohereza',
      questions: [
        'Ninde kohereza ikawa mu mahanga avuye mu Rwanda?',
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
        'Ninde kwirinda inzoka ya antestia mu kawa?',
        "Ibimenyetso by'indwara y'urupfu rwa kawa ni ibihe?",
      ],
    },
  ],
};

// ── Text to Speech helper ──────────────────────────────────────────────────
const speakText = async (
  text: string,
  langCode: string,
  onStart?: () => void,
  onDone?: () => void,
) => {
  try {
    await Speech.stop();

    const voices = await Speech.getAvailableVoicesAsync();
    const langTag = langCode === 'rw' ? 'rw' : 'en';
    const matchedVoice = voices.find(
      v => v.language.startsWith(langTag) || v.identifier.includes(langTag)
    );

    onStart?.();

    Speech.speak(text, {
      language: langCode === 'rw' ? 'rw-RW' : 'en-US',
      voice: matchedVoice?.identifier,
      rate: langCode === 'rw' ? 0.80 : 0.88,
      pitch: 1.0,
      onStart: onStart,
      onDone: onDone,
      onStopped: onDone,
      onError: (err) => {
        console.log('[Speech error]', err);
        Speech.speak(text, {
          language: 'en-US',
          rate: 0.88,
          onDone: onDone,
          onStopped: onDone,
          onError: onDone,
        });
      },
    });
  } catch (e) {
    console.log('[Speech exception]', e);
    onDone?.();
  }
};

export const VoiceAssistantScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [lang, setLang] = useState<'en' | 'rw'>('en');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [serviceReady, setServiceReady] = useState(false);
  const [serviceError, setServiceError] = useState(false);

  const micScale = useSharedValue(1);
  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const questions = COFFEE_QUESTIONS_BY_CATEGORY[lang];
  const voiceAvailable = !!ExpoSpeechRecognitionModule;

  // Initialize Coffee Assistant on mount
  useEffect(() => {
    const init = async () => {
      const ready = await initializeCoffeeAssistant();
      setServiceReady(ready);
      if (!ready) {
        setServiceError(true);
        showToast(
          lang === 'rw'
            ? 'AI ntakinzira. Kontakta IT umwete.'
            : 'Coffee Assistant not available. Check connection.',
          'error'
        );
      }
    };
    init();
  }, []);

  // Speech recognition events
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
    if (event.isFinal && text.trim()) {
      askQuestion(text.trim());
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    setListening(false);
    micScale.value = withSpring(1);
    showToast(
      lang === 'rw'
        ? 'Kwiyumvisha ijwi byanze. Ongera ugerageze.'
        : `Voice error: ${event.message}`,
      'error'
    );
  });

  const handleMic = async () => {
    if (!voiceAvailable) {
      showToast(
        lang === 'rw'
          ? 'Ijwi ntirishoboka muri Expo Go. Andika ikibazo hepfo.'
          : 'Voice input not available in Expo Go. Type your question instead.',
        'info'
      );
      return;
    }
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    Speech.stop();
    setSpeaking(false);
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      showToast(
        lang === 'rw'
          ? 'Ntitwabonye uruhushya rwo gukoresha microphone'
          : 'Microphone permission denied',
        'error'
      );
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: lang === 'rw' ? 'rw-RW' : 'en-US',
      interimResults: true,
      continuous: false,
    });
  };

  // =====================================================
  // ASK QUESTION - Using Coffee Assistant API
  // =====================================================

  const askQuestion = async (question: string) => {
    if (!question.trim() || loading || !serviceReady) return;

    setCurrentQuestion(question);
    setCurrentAnswer('');
    setInput('');
    setTranscript('');
    setLoading(true);
    Speech.stop();
    setSpeaking(false);

    try {
      // Use coffee API with full context
      const response = await coffeeAPI.ask({
        question,
        category: questions[activeCategory]?.category.split(' ').slice(1).join(' ') || 'General',
        language: lang,
        history: history.slice(-10),
      });

      setLoading(false);

      if (response.error || !response.data?.success) {
        const errorMsg = lang === 'rw'
          ? 'Ntibishoboye kubona igisubizo'
          : 'Could not get answer';
        showToast(errorMsg, 'error');
        return;
      }

      const answer = response.data.answer || (
        lang === 'rw'
          ? 'Mbabarira, sinshobora kubona igisubizo.'
          : 'Sorry, I could not find an answer.'
      );

      setCurrentAnswer(answer);

      // Update history
      setHistory(prev => [
        ...prev.slice(-10),
        { role: 'user', content: question },
        { role: 'assistant', content: answer },
      ]);

      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);

      // Auto-play response
      await speakText(
        answer,
        lang,
        () => setSpeaking(true),
        () => setSpeaking(false),
      );
    } catch (error) {
      setLoading(false);
      console.error('[Coffee Assistant Error]', error);
      showToast(
        lang === 'rw' ? 'Ikosa ryabaye' : 'An error occurred',
        'error'
      );
    }
  };

  const handlePlay = async () => {
    if (!currentAnswer) return;
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }
    await speakText(
      currentAnswer,
      lang,
      () => setSpeaking(true),
      () => setSpeaking(false),
    );
  };

  const handleSend = () => {
    if (input.trim() && serviceReady) askQuestion(input.trim());
  };

  const handleClear = () => {
    setCurrentQuestion('');
    setCurrentAnswer('');
    setHistory([]);
    setInput('');
    setTranscript('');
    Speech.stop();
    setSpeaking(false);
    if (listening && voiceAvailable) ExpoSpeechRecognitionModule.stop();
  };

  const handleLanguageChange = (newLang: 'en' | 'rw') => {
    setLang(newLang);
    setActiveCategory(0);
    handleClear();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontFamily: FONT.bold, color: '#fff' }}>
              ☕ Coffee Expert
            </Text>
            <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.75)' }}>
              {lang === 'rw'
                ? 'AI y\'umujyanama w\'ikawa — Vuga cyangwa Andika'
                : 'Gemini AI Coffee Advisor — Speak or Type'}
            </Text>
          </View>

          {(currentQuestion || history.length > 0) && (
            <TouchableOpacity
              onPress={handleClear}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Language Selector */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {getCoffeeLanguages().map((l) => (
            <TouchableOpacity
              key={l.code}
              onPress={() => handleLanguageChange(l.code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: RADIUS.full,
                backgroundColor: lang === l.code ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
              }}
            >
              <Text style={{ fontSize: 14 }}>{l.flag}</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: FONT.semibold,
                  color: lang === l.code ? colors.primary : '#FFFFFF',
                }}
              >
                {l.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Service Status */}
        {serviceError && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              backgroundColor: 'rgba(255,255,255,0.1)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: RADIUS.lg,
            }}
          >
            <AlertCircle size={16} color="#ff9500" />
            <Text
              style={{
                fontSize: 11,
                fontFamily: FONT.regular,
                color: '#FFFFFF',
                flex: 1,
              }}
            >
              {lang === 'rw'
                ? 'AI ntakinzira. Tegeka koneksyon.'
                : 'Service unavailable. Check connection.'}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input Box */}
        <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 12, marginBottom: 20 }, SHADOWS.sm]}>
          {listening && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={{
                backgroundColor: colors.primary + '10',
                borderRadius: RADIUS.lg,
                padding: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: FONT.semibold, color: colors.primary, marginBottom: 2 }}>
                {lang === 'rw' ? '🎤 Niyumva...' : '🎤 Listening...'}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: FONT.regular, color: colors.text }}>
                {transcript || (lang === 'rw' ? 'Vuga ikibazo cy\'ikawa...' : 'Speak your question...')}
              </Text>
            </Animated.View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            {/* Microphone Button */}
            <Animated.View style={micStyle}>
              <TouchableOpacity
                onPress={handleMic}
                disabled={loading || !serviceReady}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: listening
                    ? colors.error
                    : voiceAvailable
                      ? colors.primary + '15'
                      : colors.surfaceVariant,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: listening ? colors.error : voiceAvailable ? colors.primary : colors.border,
                  opacity: loading || !serviceReady ? 0.5 : 1,
                }}
              >
                {listening ? (
                  <MicOff size={22} color={colors.error} />
                ) : (
                  <Mic size={22} color={voiceAvailable ? colors.primary : colors.textMuted} />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Text Input */}
            <TextInput
              style={{
                flex: 1,
                fontSize: 14,
                fontFamily: FONT.regular,
                color: colors.text,
                maxHeight: 100,
                minHeight: 44,
                paddingVertical: 8,
              }}
              placeholder={
                lang === 'rw'
                  ? "Andika ikibazo cy'ikawa..."
                  : 'Type your coffee question...'
              }
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={serviceReady}
            />

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || loading || !serviceReady}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: input.trim() && !loading && serviceReady ? colors.primary : colors.surfaceVariant,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Send size={18} color={input.trim() && serviceReady ? '#fff' : colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 10,
              fontFamily: FONT.regular,
              color: colors.textMuted,
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            {speaking
              ? lang === 'rw'
                ? '🔊 AI irimo kuvuga igisubizo...'
                : '🔊 AI is speaking the response...'
              : lang === 'rw'
                ? '✏️ Andika ikibazo — AI izagisubiza kandi ikivuge'
                : '✏️ Type a question — AI will answer and read it aloud'}
          </Text>
        </View>

        {/* Q&A Display */}
        {currentQuestion ? (
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 24 }}>
            {/* Question Display */}
            <View
              style={{
                backgroundColor: colors.primary + '12',
                borderRadius: RADIUS.xl,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: FONT.semibold, color: colors.primary, marginBottom: 4 }}>
                {lang === 'rw' ? 'IKIBAZO CYAWE' : 'YOUR QUESTION'}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: FONT.medium, color: colors.text }}>
                {currentQuestion}
              </Text>
            </View>

            {/* Answer Display or Loading */}
            {loading ? (
              <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 24, alignItems: 'center' }, SHADOWS.sm]}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: FONT.regular, marginTop: 12 }}>
                  {lang === 'rw' ? '🤖 Gemini AI irimo gutekereza...' : '🤖 Gemini AI is thinking...'}
                </Text>
              </View>
            ) : currentAnswer ? (
              <Animated.View entering={FadeInDown.duration(300)}>
                <View style={[{ backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: 16 }, SHADOWS.sm]}>
                  {/* Response Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Brain size={16} color={colors.success} />
                    <Text style={{ fontSize: 11, fontFamily: FONT.semibold, color: colors.success }}>
                      {lang === 'rw' ? "IGISUBIZO CY'AI (Gemini)" : 'AI RESPONSE (Gemini 1.5)'}
                    </Text>
                    {speaking && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                        <Text style={{ fontSize: 10, fontFamily: FONT.regular, color: colors.success }}>
                          {lang === 'rw' ? 'Irimo kuvuga' : 'Speaking'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Answer Text */}
                  <Text style={{ fontSize: 14, fontFamily: FONT.regular, color: colors.text, lineHeight: 22, marginBottom: 14 }}>
                    {currentAnswer}
                  </Text>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={handlePlay}
                      style={[
                        {
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          backgroundColor: speaking ? colors.error : colors.primary,
                          paddingVertical: 10,
                          borderRadius: RADIUS.lg,
                        },
                        SHADOWS.sm,
                      ]}
                    >
                      {speaking ? (
                        <StopCircle size={16} color="#fff" />
                      ) : (
                        <Volume2 size={16} color="#fff" />
                      )}
                      <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: '#fff' }}>
                        {speaking
                          ? lang === 'rw'
                            ? 'Hagarika'
                            : 'Stop'
                          : lang === 'rw'
                            ? '🔊 Umva'
                            : '🔊 Play'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setCurrentQuestion('');
                        setCurrentAnswer('');
                        Speech.stop();
                        setSpeaking(false);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: RADIUS.lg,
                        backgroundColor: colors.surfaceVariant,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontFamily: FONT.medium, color: colors.textSecondary }}>
                        {lang === 'rw' ? 'Indi' : 'New Q'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}

        {/* Quick Questions */}
        <Text style={{ fontSize: 15, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
          {lang === 'rw' ? '☕ Ibibazo bishije cyane' : '☕ Quick Questions'}
        </Text>

        {/* Category Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {questions.map((cat, i) => (
            <TouchableOpacity
              key={cat.category}
              onPress={() => setActiveCategory(i)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: RADIUS.full,
                marginRight: 8,
                backgroundColor: activeCategory === i ? colors.primary : colors.surfaceVariant,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: FONT.medium,
                  color: activeCategory === i ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {cat.category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Questions List */}
        <Animated.View entering={FadeInDown.duration(300)}>
          {questions[activeCategory]?.questions.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => askQuestion(q)}
              disabled={loading || listening || !serviceReady}
              style={[
                {
                  padding: 14,
                  borderRadius: RADIUS.lg,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor:
                    currentQuestion === q ? colors.primary + '12' : colors.surface,
                  borderWidth: currentQuestion === q ? 1 : 0,
                  borderColor: currentQuestion === q ? colors.primary : 'transparent',
                  opacity: loading || listening || !serviceReady ? 0.6 : 1,
                },
                SHADOWS.sm,
              ]}
            >
              <Text style={{ fontSize: 18 }}>
                {questions[activeCategory].category.split(' ')[0]}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontFamily: FONT.regular,
                  color: currentQuestion === q ? colors.primary : colors.text,
                  lineHeight: 18,
                }}
              >
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Conversation History */}
        {history.length >= 4 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 14, fontFamily: FONT.semibold, color: colors.text, marginBottom: 12 }}>
              {lang === 'rw' ? "📜 Amateka y'ikiganiro" : '📜 Conversation History'}
            </Text>
            {history.slice(-8).map((h: any, i: number) => (
              <View
                key={i}
                style={{
                  padding: 12,
                  borderRadius: RADIUS.lg,
                  marginBottom: 6,
                  backgroundColor:
                    h.role === 'user' ? colors.surfaceVariant : colors.primary + '10',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: FONT.semibold,
                    color: colors.textMuted,
                    marginBottom: 3,
                  }}
                >
                  {h.role === 'user'
                    ? lang === 'rw'
                      ? '👤 WEWE'
                      : '👤 YOU'
                    : '🤖 GEMINI AI'}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: FONT.regular,
                    color: colors.text,
                    lineHeight: 18,
                  }}
                >
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