import api from './api';

export interface NotificationItem {
  id: number;
  ticketId: number;
  userId: number | null;
  customerId: number | null;
  recipientRole: string | null;
  title: string;
  message: string;
  eventType: string;
  read: boolean;
  ticketEnabled: boolean;
  createdAt: string;
}

export interface NotificationPageResponse {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const notificationService = {
  getNotifications: async (page = 0, size = 20, enabledFilter = 'ativados'): Promise<NotificationPageResponse> => {
    const response = await api.get<NotificationPageResponse>('/notifications', {
      params: { page, size, enabledFilter },
    });
    return response.data;
  },

  getNotificationById: async (id: number): Promise<NotificationItem> => {
    const response = await api.get<NotificationItem>(`/notifications/${id}`);
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};

