export type UserRole =
  | "RIDER"
  | "DRIVER"
  | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}