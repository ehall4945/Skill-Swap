import api from './api';
import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredUser,
  storeAuthSession,
  storeUser,
} from '../api/client';

const authService = {
  async register(email, firstName, lastName, password, passwordConfirm) {
    const response = await api.post('/auth/register/', {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      password_confirm: passwordConfirm,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login/', {
      email,
      password,
    });

    const { access, refresh, user } = response.data;
    storeAuthSession({ access, refresh, user });

    return { access, refresh, user };
  },

  async getCurrentUser(config = {}) {
    const response = await api.get('/auth/me/', config);
    storeUser(response.data);
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.put('/auth/me/update/', userData);
    storeUser(response.data);
    return response.data;
  },

  logout() {
    clearStoredAuth();
  },

  isAuthenticated() {
    return !!getStoredAccessToken();
  },

  getUser() {
    return getStoredUser();
  },
};

export default authService;