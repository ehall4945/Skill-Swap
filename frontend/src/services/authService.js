import api, { storeTokenOnly } from '../api/client';
import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredUser,
  storeAuthSession,
  storeUser,
  fetchMyProfile, 
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

    storeTokenOnly({ access, refresh }); 

    const profileList = await fetchMyProfile();

    const profile = Array.isArray(profileList)
      ? profileList[0]
      : profileList; 

    const mergedUser = {
      ...user,
      profile_image: profile?.profile_image ?? null,
    };

    storeAuthSession({ access, refresh, user: mergedUser }); 

    return mergedUser;
  },

  async getCurrentUser(config = {}) {
    const response = await api.get('/auth/me/', config);
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