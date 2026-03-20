import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
const BASE_URL = 'https://oson-pay-backend-3.onrender.com/api';
// For physical device, use your PC's local IP:
// const BASE_URL = 'http://192.168.1.100:3000/api';

async function request(method: string, path: string, body?: any) {
  const token = await AsyncStorage.getItem('token');

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Xatolik yuz berdi');
    }

    return data;
  } catch (err: any) {
    if (err.message === 'Network request failed') {
      throw new Error('Internet aloqasini tekshiring');
    }
    throw err;
  }
}

export const api = {
  // Auth
  sendOTP: (phone: string) =>
    request('POST', '/auth/send-otp', { phone }),

  verifyOTP: (phone: string, code: string, fullName?: string) =>
    request('POST', '/auth/verify-otp', { phone, code, fullName }),

  getProfile: () => request('GET', '/auth/profile'),

  updateProfile: (fullName: string) =>
    request('PUT', '/auth/profile', { fullName }),

  logout: () => request('POST', '/auth/logout'),

  // Transactions
  sendMoney: (receiverPhone: string, amount: number, description?: string) =>
    request('POST', '/transactions/send', { receiverPhone, amount, description }),

  topUp: (amount: number, description?: string) =>
    request('POST', '/transactions/topup', { amount, description }),

  getHistory: (page = 1, type?: string) =>
    request('GET', `/transactions?page=${page}${type ? `&type=${type}` : ''}`),

  getTransaction: (id: string) =>
    request('GET', `/transactions/${id}`),

  getStats: (period = 30) =>
    request('GET', `/transactions/stats?period=${period}`),

  // Cards
  getCards: () => request('GET', '/cards'),

  addCard: (card: {
    cardNumber: string;
    cardHolder: string;
    expiryMonth: string;
    expiryYear: string;
    cardType: string;
  }) => request('POST', '/cards', card),

  setDefaultCard: (cardId: string) =>
    request('PUT', `/cards/${cardId}/default`, {}),

  deleteCard: (cardId: string) =>
    request('DELETE', `/cards/${cardId}`),
};

// Auth helpers
export const Auth = {
  async saveToken(token: string) {
    await AsyncStorage.setItem('token', token);
  },
  async getToken() {
    return await AsyncStorage.getItem('token');
  },
  async removeToken() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },
  async saveUser(user: any) {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  async getUser() {
    const u = await AsyncStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  async isLoggedIn() {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },
};
