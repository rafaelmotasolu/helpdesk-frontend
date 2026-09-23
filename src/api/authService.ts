import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/users/auth/login', { email, password });
    return res.data;
  },
};