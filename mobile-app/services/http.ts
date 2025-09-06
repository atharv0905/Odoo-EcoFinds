import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err?.response?.data?.error || err?.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);


