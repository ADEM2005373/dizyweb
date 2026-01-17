import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => {
    const userFromStorage = localStorage.getItem('user');
    let parsedUser = null;
    try {
      if (userFromStorage && userFromStorage !== "undefined") {
        parsedUser = JSON.parse(userFromStorage);
      }
    } catch {
      parsedUser = null;
    }

    return {
      token: localStorage.getItem('token') || null,
      user: parsedUser,
      error: null
    };
  },

  actions: {
    async login(credentials) {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: credentials.email,
          motDePasse: credentials.password
        });

        this.token = response.data.token;
        this.user = response.data.user || null;

        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));

        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed';
        throw this.error;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});
