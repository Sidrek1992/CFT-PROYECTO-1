import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
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
    signInWithGoogle: () => Promise<{ error: any | null }>;
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
        console.log('[Auth] Initializing Auth Provider...');

        // Escuchar cambios de autenticación con Firebase
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('[Auth] Auth state changed. User:', currentUser?.email || 'null');

            try {
                if (currentUser?.email && getUserSecurityByEmail(currentUser.email).blocked) {
                    console.warn('[Auth] User is blocked:', currentUser.email);
                    await firebaseSignOut(auth);
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                setUser(currentUser);

                if (currentUser) {
                    try {
                        console.log('[Auth] Getting ID token...');
                        const token = await getIdToken(currentUser);
                        setSession({ access_token: token });
                        await loadProfile(currentUser.uid);
                    } catch (tokenErr) {
                        console.error('[Auth] Error getting token or profile:', tokenErr);
                    }
                } else {
                    setSession(null);
                    setProfile(null);
                }
            } catch (err) {
                console.error('[Auth] Unexpected error in onAuthStateChanged:', err);
            } finally {
                setLoading(false);
                console.log('[Auth] Auth initialization finished. Loading set to false.');
            }
        }, (error) => {
            console.error('[Auth] onAuthStateChanged observer error:', error);
            setLoading(false);
        });

        // Timeout de seguridad: si después de 10 segundos sigue cargando, forzar false
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn('[Auth] Auth initialization timeout. Forcing loading = false.');
                setLoading(false);
            }
        }, 10000);

        return () => {
            unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const normalizedEmail = email.trim().toLowerCase();

        // Usar Firebase si la API Key está configurada, de lo contrario usar fallback local
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
        const isFirebaseConfigured = !!apiKey && !apiKey.includes('placeholder');

        console.log('[Auth] Attempting login. Firebase configured:', isFirebaseConfigured);
        if (!isFirebaseConfigured) {
            console.warn('[Auth] Firebase not configured or using placeholders. Falling back to local server.');
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

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const email = user.email || '';

            // Verificar si el usuario está bloqueado localmente (opcional si usas Firebase)
            if (email && getUserSecurityByEmail(email).blocked) {
                await firebaseSignOut(auth);
                return {
                    error: { message: 'Tu cuenta está bloqueada.' }
                };
            }

            touchUserLastAccess(email);
            appendAuditLog({
                scope: 'auth',
                action: 'login_success_google',
                actor: email,
                target: email,
                details: 'Inicio de sesión con Google exitoso'
            });

            return { error: null };
        } catch (error: any) {
            console.error('[Auth] Error signing in with Google:', error);
            return { error };
        }
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
        signInWithGoogle,
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
