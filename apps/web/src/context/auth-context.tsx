"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    getCurrentUser,
    login as loginApi,
    logout as logoutApi,
} from "@/lib/auth";

export type AuthenticatedUser = {
    userId: string;
    role: "RIDER" | "DRIVER" | "ADMIN";
};

type LoginResult = {
    accessToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: "RIDER" | "DRIVER" | "ADMIN";
    };
};

type AuthContextValue = {
    user: AuthenticatedUser | null;
    loading: boolean;
    login: (
        email: string,
        password: string
    ) => Promise<LoginResult>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext =
    createContext<AuthContextValue | null>(null);

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] =
        useState<AuthenticatedUser | null>(null);

    const [loading, setLoading] =
        useState(true);

    const refreshUser = useCallback(async () => {
        const token =
            sessionStorage.getItem("accessToken");

        if (!token) {
            setUser(null);
            return;
        }

        try {
            const currentUser =
                await getCurrentUser();

            setUser({
                userId: currentUser.user.userId,
                role: currentUser.user.role,
            });
        } catch {
            sessionStorage.removeItem(
                "accessToken"
            );
            setUser(null);
        }
    }, []);

    useEffect(() => {
        refreshUser().finally(() => {
            setLoading(false);
        });
    }, [refreshUser]);

    const login = useCallback(
        async (
            email: string,
            password: string
        ) => {
            const result =
                await loginApi(
                    email,
                    password
                );

            sessionStorage.setItem(
                "accessToken",
                result.accessToken
            );

            setUser({
                userId: result.user.id,
                role: result.user.role,
            });

            return result;
        },
        []
    );

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } finally {
            sessionStorage.removeItem(
                "accessToken"
            );

            setUser(null);

            window.location.replace(
                "/login"
            );
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}