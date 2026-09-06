import { api } from "./api";
import type {
  LoginResponse,
  RegisterResponse,
  User,
} from "@/types/auth";

export async function register(
  name: string,
  email: string,
  password: string,
) {
  return api<RegisterResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    },
  );
}

export async function login(
  email: string,
  password: string,
) {
  return api<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );
}

export async function getCurrentUser() {
  return api<{
    user: {
      userId: string;
      role: User["role"];
    };
    message: string;
  }>("/auth/me");
}


export async function logout() {
  try {
    await api("/auth/logout", {
      method: "POST",
    });
  } finally {
    // Always clear the client session, even if the API request fails.
    sessionStorage.removeItem("accessToken");
  }
}