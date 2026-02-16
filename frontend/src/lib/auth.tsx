'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserResponse } from './types';
import { registerUser, getUser } from './api';

interface AuthContextType {
    user: UserResponse | null;
    loading: boolean;
    login: (username: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('brainbolt_user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                getUser(parsed.userId)
                    .then((u) => {
                        setUser(u);
                    })
                    .catch(() => {
                        localStorage.removeItem('brainbolt_user');
                    })
                    .finally(() => setLoading(false));
            } catch {
                localStorage.removeItem('brainbolt_user');
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (username: string) => {
        const u = await registerUser(username);
        setUser(u);
        localStorage.setItem('brainbolt_user', JSON.stringify(u));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('brainbolt_user');
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
