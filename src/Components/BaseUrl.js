import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const instance = axios.create({
  // baseURL: 'http://182.180.140.100:8001/api',https://backend.tasteland.com.pk/
  baseURL: 'https://backend.tasteland.com.pk/api',
});

instance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  },
);

export default instance;
