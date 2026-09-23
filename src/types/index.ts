export type Role = 'CLIENT' | 'TECHNICIAN' | 'ADMIN';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Status = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';

export type Category = 'HARDWARE' | 'SOFTWARE' | 'NETWORK';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
  createdAt?: string;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password?: string;
  role: Role;
}

export interface UserUpdatePayload {
  name: string;
  email: string;
  role: Role;
}

export interface UserPasswordUpdatePayload {
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  category: Category;
  customerId: number;
  technicianId?: number | null;
  ticketEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketCreatePayload {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  customerId: number;
}

