import api from './api';
import { Ticket, TicketCreatePayload, Status, Priority, Category } from '../types';

export const ticketService = {
  async getAll(params?: {
    status?: Status;
    priority?: Priority;
    category?: Category;
    customerId?: number;
    technicianId?: number;
  }): Promise<Ticket[]> {
    const res = await api.get('/tickets', { params });
    // Trata resposta paginada ou lista direta
    return res.data.content ? res.data.content : res.data;
  },

  async getById(id: number): Promise<Ticket> {
    const res = await api.get<Ticket>(`/tickets/${id}`);
    return res.data;
  },

  async create(payload: TicketCreatePayload): Promise<Ticket> {
    const res = await api.post<Ticket>('/tickets', payload);
    return res.data;
  },

  async assignTechnician(ticketId: number, technicianId: number): Promise<Ticket> {
    const res = await api.patch<Ticket>(`/tickets/${ticketId}/assign`, { technicianId });
    return res.data;
  },

  async updateStatus(ticketId: number, status: Status): Promise<Ticket> {
    const res = await api.patch<Ticket>(`/tickets/${ticketId}/status`, { status });
    return res.data;
  },

  async close(ticketId: number): Promise<void> {
    await api.delete(`/tickets/${ticketId}`);
  },
};