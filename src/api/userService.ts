import api from './api';
import type {
  User,
  UserCreatePayload,
  UserUpdatePayload,
  UserPasswordUpdatePayload,
} from '../types';

export const userService = {
  async getAll(): Promise<User[]> {
    const res = await api.get<User[]>('/users');
    return res.data;
  },

  async getById(id: number): Promise<User> {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },

  async create(payload: UserCreatePayload): Promise<User> {
    const res = await api.post<User>('/users', payload);
    return res.data;
  },

  async update(id: number, payload: UserUpdatePayload): Promise<User> {
    const res = await api.put<User>(`/users/${id}`, payload);
    return res.data;
  },

  async inactivate(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async updatePassword(id: number, payload: UserPasswordUpdatePayload): Promise<void> {
    await api.patch(`/users/${id}/password`, payload);
  },
};