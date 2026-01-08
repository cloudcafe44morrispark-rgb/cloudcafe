import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    register: (email: string, password: string, metadata?: { firstName?: string; lastName?: string; shop_name?: string | null }) => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
    pendingCheckout: boolean;
    setPendingCheckout: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingCheckout, setPendingCheckout] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<{ error: string | null }> => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { error: error.message };
        }

        // Check if email is verified
        if (data.user && !data.user.email_confirmed_at) {
            await supabase.auth.signOut();
            return { error: 'Please verify your email before logging in. Check your inbox for the verification link.' };
        }

        return { error: null };
    };

    const register = async (
        email: string,
        password: string,
        metadata?: { firstName?: string; lastName?: string; shop_name?: string | null }
    ): Promise<{ error: string | null }> => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/verified`,
                data: {
                    first_name: metadata?.firstName,
                    last_name: metadata?.lastName,
                    shop_name: metadata?.shop_name,
                    role: 'user', // Always set role to 'user' for registration
                },
            },
        });

        if (error) {
            return { error: error.message };
        }
        return { error: null };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setPendingCheckout(false);
    };

    // Check if user is admin based on role in user_metadata
    const isAdmin = user?.user_metadata?.role === 'admin';

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isAuthenticated: user !== null,
                isLoading,
                isAdmin,
                login,
                register,
                logout,
                pendingCheckout,
                setPendingCheckout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
