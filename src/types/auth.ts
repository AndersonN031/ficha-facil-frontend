export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  role: string;
  active: boolean;
  healthUnitId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  password: string;
}
