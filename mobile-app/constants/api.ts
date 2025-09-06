import { Platform } from 'react-native';

const envUrl = process.env.EXPO_PUBLIC_API_URL;

export const getApiBaseUrl = () => {
  if (envUrl) return envUrl;
  if (Platform.OS === 'android') return 'https://9884b45b0fc2.ngrok-free.app ';
  return 'https://9884b45b0fc2.ngrok-free.app ';
};

export const API_BASE_URL = getApiBaseUrl();