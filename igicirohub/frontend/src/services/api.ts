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

export const api = {
  get:    <T>(ep: string, auth = true) => request<T>('GET',    ep, undefined, auth),
  post:   <T>(ep: string, body: any, auth = true) => request<T>('POST',   ep, body, auth),
  patch:  <T>(ep: string, body: any, auth = true) => request<T>('PATCH',  ep, body, auth),
  delete: <T>(ep: string, auth = true) => request<T>('DELETE', ep, undefined, auth),
};