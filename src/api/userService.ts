import api from './api';
import { User } from '../types';

export const userService = {
  async getAll(): Promise<User[]> {
    const res = await api.get<User[]>('/users');
    return res.data;
  },
};