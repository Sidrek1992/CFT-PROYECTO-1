import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    getIdToken
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserRole, Permissions, getPermissions, hasPermission, ROLE_LABELS, ROLE_COLORS } from '../types/roles';
import { appendAuditLog } from '../utils/audit';
import { getUserSecurityByEmail, loadUserRoles, touchUserLastAccess, updateUserSecurity } from '../utils/userAdminStorage';

interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    created_at: string;
}

interface AuthContextType {
    user: FirebaseUser | null;
    session: { access_token: string } | null;
    profile: UserProfile | null;
    role: UserRole;
    permissions: Permissions;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any | null }>;
    signUp: (email: string, password: string) => Promise<{ error: any | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: any | null }>;
    hasPermission: (permission: keyof Permissions) => boolean;
    roleLabel: string;
    roleColors: { bg: string; text: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

const getRoleFromEmail = (email: string | undefined): UserRole => {
    if (!email) return 'reader';
    const roles = loadUserRoles();
    return roles[email.toLowerCase()] || 'reader';
};

const resolveRoleFromMetadata = (metadata: Record<string, unknown> | null | undefined): UserRole | null => {
    if (!metadata) return null;
    const rawRole = String(metadata.role || '').toLowerCase();
    if (rawRole === 'admin' || rawRole === 'editor' || rawRole === 'reader') return rawRole as UserRole;
    return null;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [session, setSession] = useState<{ access_token: string } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Calcular rol basado en el perfil o email
    const role: UserRole =
        profile?.role ||
        getRoleFromEmail(user?.email || undefined);
    const permissions = getPermissions(role);
    const roleLabel = ROLE_LABELS[role];
    const roleColors = ROLE_COLORS[role];

    const checkPermission = (permission: keyof Permissions): boolean => {
        return hasPermission(role, permission);
    };

    // Cargar perfil desde Supabase (si existe la tabla profiles)
    // Esta función es opcional - si falla, usamos el rol basado en email
    const loadProfile = async (userId: string): Promise<void> => {
        // Saltamos la carga de perfil por ahora ya que no hay tabla profiles
        // Si quieres usar la tabla profiles en el futuro, descomenta el código abajo
        return;

        /*
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data && !error) {
                setProfile(data as UserProfile);
            }
        } catch (e) {
            console.debug('Tabla profiles no configurada');
        }
        */
    };

    useEffect(() => {
        // Escuchar cambios de autenticación con Firebase
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser?.email && getUserSecurityByEmail(currentUser.email).blocked) {
                await firebaseSignOut(auth);
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }

            setUser(currentUser);

            if (currentUser) {
                const token = await getIdToken(currentUser);
                setSession({ access_token: token });
                await loadProfile(currentUser.uid);
            } else {
                setSession(null);
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const normalizedEmail = email.trim().toLowerCase();

        // Fallback al API local si Supabase no está configurado
        const isSupabasePlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL;

        if (isSupabasePlaceholder) {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: normalizedEmail, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Mock de usuario para compatibilidad con Firebase
                    const mockUser = {
                        uid: 'mock-user-id',
                        email: normalizedEmail,
                        displayName: normalizedEmail.split('@')[0],
                        getIdToken: async () => data.token,
                    } as any;

                    setSession({ access_token: data.token });
                    setUser(mockUser);
                    sessionStorage.setItem('hrAppToken', data.token);

                    appendAuditLog({
                        scope: 'auth',
                        action: 'login_success_local',
                        actor: normalizedEmail,
                        target: normalizedEmail,
                        details: 'Inicio de sesión local exitoso'
                    });

                    return { error: null };
                } else {
                    return {
                        error: {
                            message: data.error || 'Error al iniciar sesión local'
                        }
                    };
                }
            } catch (err) {
                return {
                    error: {
                        message: 'Error de conexión con el servidor local'
                    }
                };
            }
        }

        const securityBeforeSignIn = getUserSecurityByEmail(normalizedEmail);
        if (securityBeforeSignIn.blocked) {
            return {
                error: {
                    message: 'Tu cuenta está bloqueada. Contacta al administrador.'
                }
            };
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const normalizedEmail = userCredential.user.email || '';

            touchUserLastAccess(normalizedEmail);
            appendAuditLog({
                scope: 'auth',
                action: 'login_success_firebase',
                actor: normalizedEmail,
                target: normalizedEmail,
                details: 'Inicio de sesión Firebase exitoso'
            });

            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const signOut = async () => {
        if (user?.email) {
            appendAuditLog({
                scope: 'auth',
                action: 'logout',
                actor: user.email,
                target: user.email,
                details: 'Cierre de sesión'
            });
        }
        setProfile(null);
        await firebaseSignOut(auth);
    };

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            updateUserSecurity(email, { forcePasswordChange: false });
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const value: AuthContextType = {
        user,
        session,
        profile,
        role,
        permissions,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        hasPermission: checkPermission,
        roleLabel,
        roleColors,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
