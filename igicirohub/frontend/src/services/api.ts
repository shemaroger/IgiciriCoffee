import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://192.168.8.163:8000/api';

const TOKEN_KEY = 'igicirohub_access_token';
const REFRESH_KEY = 'igicirohub_refresh_token';

export const tokenStorage = {
  getAccess:       () => AsyncStorage.getItem(TOKEN_KEY),
  setAccess:  (t: string) => AsyncStorage.setItem(TOKEN_KEY, t),
  getRefresh:      () => AsyncStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string) => AsyncStorage.setItem(REFRESH_KEY, t),
  clearAll:        () => Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
  ]),
};

type RequestResult<T> = { data?: T; error?: string; status?: number };

async function request<T>(
  method: string,
  endpoint: string,
  body?: any,
  requireAuth = true,
  retry = true,
): Promise<RequestResult<T>> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (requireAuth) {
      const token = await tokenStorage.getAccess();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${BASE_URL}${endpoint}`;
    console.log(`[API] ${method} ${url}`);

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && retry) {
      const refreshed = await refreshToken();
      if (refreshed) return request(method, endpoint, body, requireAuth, false);
    }

    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = { detail: text }; }

    if (!res.ok) {
      const errMsg = typeof json === 'object'
        ? (json.detail || Object.values(json).flat().join(', '))
        : 'Request failed';
      console.warn(`[API] ${res.status} ${errMsg}`);
      return { error: errMsg, status: res.status };
    }

    console.log(`[API] Response:`, JSON.stringify(json).slice(0, 200));
    return { data: json as T, status: res.status };
  } catch (e: any) {
    console.error('[API] Network error:', e.message);
    return { error: 'Network error. Check server connection.' };
  }
}

async function refreshToken(): Promise<boolean> {
  try {
    const refresh = await tokenStorage.getRefresh();
    if (!refresh) return false;
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.access) {
      await tokenStorage.setAccess(json.access);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// =====================================================
// MAIN API METHODS
// =====================================================

export const api = {
  get:    <T>(ep: string, auth = true) => request<T>('GET',    ep, undefined, auth),
  post:   <T>(ep: string, body: any, auth = true) => request<T>('POST',   ep, body, auth),
  patch:  <T>(ep: string, body: any, auth = true) => request<T>('PATCH',  ep, body, auth),
  delete: <T>(ep: string, auth = true) => request<T>('DELETE', ep, undefined, auth),
};

// =====================================================
// COFFEE ASSISTANT API HELPERS
// =====================================================

/**
 * Types for Coffee Assistant
 */
export interface CoffeeQuestion {
  question: string;
  category?: 'Growing' | 'Pricing & Markets' | 'Processing' | 'Quality & Grading' | 'Health & Nutrition' | 'General';
  language?: 'en' | 'rw';
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface CoffeeResponse {
  success: boolean;
  answer: string;
  question?: string;
  category?: string;
  language?: string;
  model?: string;
  error?: string;
}

export interface ConversationHistory {
  success: boolean;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  count: number;
}

export interface CoffeeHealth {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  service: string;
  ai_model: string;
  languages: string[];
  categories: string[];
  error?: string;
}

/**
 * Coffee Assistant API Endpoints
 */
export const coffeeAPI = {
  /**
   * Ask a coffee question (Bilingual: English & Kinyarwanda)
   * 
   * @param question The user's question about coffee
   * @param category Coffee topic category
   * @param language Language code ('en' or 'rw')
   * @param history Previous conversation messages for context
   * @returns Coffee expert response from Gemini AI
   * 
   * @example
   * const response = await coffeeAPI.ask({
   *   question: 'How do I grow coffee?',
   *   category: 'Growing',
   *   language: 'en',
   *   history: []
   * });
   */
  ask: async (question: CoffeeQuestion): Promise<RequestResult<CoffeeResponse>> => {
    return request<CoffeeResponse>(
      'POST',
      '/predictions/coffee/ask/',
      {
        question: question.question,
        category: question.category || 'General',
        language: question.language || 'en',
        history: question.history || [],
      },
      false // No auth required for coffee assistant
    );
  },

  /**
   * Get conversation history
   * Returns all previous questions and answers in the current conversation
   * 
   * @returns Array of conversation messages
   * 
   * @example
   * const history = await coffeeAPI.getHistory();
   */
  getHistory: async (): Promise<RequestResult<ConversationHistory>> => {
    return request<ConversationHistory>(
      'GET',
      '/predictions/coffee/history/',
      undefined,
      false // No auth required
    );
  },

  /**
   * Clear conversation history
   * Removes all previous messages from the conversation
   * 
   * @returns Success confirmation
   * 
   * @example
   * const result = await coffeeAPI.clearHistory();
   */
  clearHistory: async (): Promise<RequestResult<{ success: boolean; message: string }>> => {
    return request<{ success: boolean; message: string }>(
      'POST',
      '/predictions/coffee/clear-history/',
      {},
      false // No auth required
    );
  },

  /**
   * Check Coffee Assistant health status
   * Verifies that the Gemini AI service is running and available
   * 
   * @returns Service status and capabilities
   * 
   * @example
   * const health = await coffeeAPI.health();
   */
  health: async (): Promise<RequestResult<CoffeeHealth>> => {
    return request<CoffeeHealth>(
      'GET',
      '/predictions/coffee/health/',
      undefined,
      false // No auth required
    );
  },

  /**
   * Ask question with full conversation context
   * Convenience method that includes automatic history management
   * 
   * @param text Question text
   * @param language Language ('en' or 'rw')
   * @param category Coffee category
   * @returns Response from Gemini
   */
  askSimple: async (
    text: string,
    language: 'en' | 'rw' = 'en',
    category: string = 'General'
  ): Promise<RequestResult<CoffeeResponse>> => {
    return coffeeAPI.ask({
      question: text,
      language,
      category: category as any,
      history: []
    });
  },

  /**
   * Ask with automatic history retrieval
   * Fetches previous conversation and includes it in the request
   * 
   * @param text Question text
   * @param language Language ('en' or 'rw')
   * @returns Response with context
   */
  askWithHistory: async (
    text: string,
    language: 'en' | 'rw' = 'en'
  ): Promise<RequestResult<CoffeeResponse>> => {
    try {
      // Get previous conversation
      const historyResult = await coffeeAPI.getHistory();
      const history = historyResult.data?.history || [];

      // Ask with context
      return coffeeAPI.ask({
        question: text,
        language,
        category: 'General',
        history
      });
    } catch (error) {
      // Fallback if history fetch fails
      return coffeeAPI.askSimple(text, language);
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Initialize Coffee Assistant and check connectivity
 * Call this when app starts to verify service is available
 * 
 * @returns true if service is healthy
 */
export const initializeCoffeeAssistant = async (): Promise<boolean> => {
  try {
    const result = await coffeeAPI.health();
    if (result.data?.success && result.data.status === 'healthy') {
      console.log('[Coffee Assistant] Service initialized successfully');
      return true;
    }
    console.warn('[Coffee Assistant] Service unhealthy:', result.data?.error);
    return false;
  } catch (error) {
    console.error('[Coffee Assistant] Initialization failed:', error);
    return false;
  }
};

/**
 * Get supported coffee categories
 * 
 * @returns Array of category names
 */
export const getCoffeeCategories = (): string[] => {
  return [
    'Growing',
    'Pricing & Markets',
    'Processing',
    'Quality & Grading',
    'Health & Nutrition',
    'General'
  ];
};

/**
 * Get supported languages
 * 
 * @returns Array of language codes with names
 */
export const getCoffeeLanguages = (): Array<{ code: 'en' | 'rw'; name: string; flag: string }> => {
  return [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' }
  ];
};

/**
 * Test coffee assistant connectivity and API key
 * Use for debugging connection issues
 * 
 * @returns Object with test results
 */
export const testCoffeeAssistant = async () => {
  console.log('[Coffee Assistant] Running connectivity test...');
  
  try {
    // Test 1: Health check
    const health = await coffeeAPI.health();
    console.log('[Test 1] Health check:', health.data?.status);

    // Test 2: Simple question
    const response = await coffeeAPI.askSimple(
      'What is coffee?',
      'en',
      'General'
    );
    console.log('[Test 2] Ask question:', response.data?.success ? 'OK' : 'FAILED');

    // Test 3: Get history
    const history = await coffeeAPI.getHistory();
    console.log('[Test 3] Get history:', history.data?.count);

    // Test 4: Clear history
    const clear = await coffeeAPI.clearHistory();
    console.log('[Test 4] Clear history:', clear.data?.success);

    console.log('[Coffee Assistant] All tests passed! ✅');
    return {
      healthy: health.data?.status === 'healthy',
      canAsk: response.data?.success === true,
      canGetHistory: history.data?.count !== undefined,
      canClear: clear.data?.success === true
    };
  } catch (error) {
    console.error('[Coffee Assistant] Tests failed:', error);
    return {
      healthy: false,
      canAsk: false,
      canGetHistory: false,
      canClear: false,
      error: String(error)
    };
  }
};