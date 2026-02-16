import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

type AuthMode = 'login' | 'forgot';

const LoginPage: React.FC = () => {
    const { signIn, signInWithGoogle, resetPassword } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await signIn(email, password);
                if (error) {
                    if (error.message.includes('Invalid login')) {
                        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
                    } else {
                        setError(error.message);
                    }
                }
            } else if (mode === 'forgot') {
                const { error } = await resetPassword(email);
                if (error) {
                    setError(error.message);
                } else {
                    setSuccess('Te enviamos un email con instrucciones para restablecer tu contraseña.');
                }
            }
        } catch (err) {
            setError('Ocurrió un error inesperado. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            const { error } = await signInWithGoogle();
            if (error) {
                if (error.code === 'auth/popup-closed-by-user') {
                    // No mostrar error si el usuario cerró el popup
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    setError('Ya existe una cuenta con este email pero usa un proveedor diferente.');
                } else {
                    setError(error.message);
                }
            }
        } catch (err) {
            setError('Error al iniciar sesión con Google.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6 sm:p-12 font-['Source_Sans_Pro']">
            <div className="w-full max-w-[480px]">
                {/* Card Container */}
                <div className="bg-white rounded-[32px] shadow-[0px_10px_40px_rgba(0,0,0,0.04)] p-8 sm:p-12 border border-slate-100">
                    {/* Header/Logo */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2F4DAA] rounded-[24px] shadow-xl shadow-blue-900/10 mb-6">
                            <span className="text-3xl font-bold text-white tracking-tighter italic">GDP</span>
                        </div>
                        <h1 className="text-3xl font-bold text-[#1A2B56] tracking-tight mb-2">¡Bienvenido!</h1>
                        <p className="text-slate-500 font-medium italic">Ingresa a tu portal GDP Cloud</p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-700 font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <p className="text-sm text-emerald-700 font-medium">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A2B56] mb-2 px-1">
                                Correo electrónico
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2F4DAA] transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nombre@empresa.com"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[18px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#2F4DAA] transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Password - Solo en modo login */}
                        {mode === 'login' && (
                            <div>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <label className="text-sm font-bold text-[#1A2B56]">
                                        Contraseña
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                                        className="text-sm text-[#2F4DAA] hover:text-[#253D88] font-bold transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2F4DAA] transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-[18px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#2F4DAA] transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#2F4DAA] hover:bg-[#253D88] disabled:bg-slate-300 text-white font-bold rounded-[18px] shadow-lg shadow-blue-900/10 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Iniciar Sesión' : 'Enviar instrucciones'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Google Sign In - Solo en modo login */}
                    {mode === 'login' && (
                        <>
                            <div className="relative my-8 text-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <span className="relative bg-white px-4 text-slate-400 text-sm font-medium">o continúa con</span>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full py-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-[18px] shadow-sm transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google
                            </button>
                        </>
                    )}

                    {/* Back to login (solo en modo forgot) */}
                    {mode === 'forgot' && (
                        <div className="mt-8 text-center px-1">
                            <button
                                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                                className="text-sm text-[#2F4DAA] hover:text-[#253D88] font-bold flex items-center justify-center gap-2 mx-auto"
                            >
                                ← Volver al inicio de sesión
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Labels */}
                <div className="mt-10 space-y-4 px-4">
                    <div className="flex items-center justify-center gap-6">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Seguro</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Confidencial</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Eficiente</span>
                    </div>
                </div>

                {/* Footer Copyright */}
                <p className="text-center text-xs text-slate-400 mt-12 font-medium">
                    © {new Date().getFullYear()} GDP Cloud · Todos los derechos reservados
                </p>
                <p className="text-center text-[10px] text-slate-300 mt-2 font-medium">
                    Impulsado por Buk Aesthetic Design System
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
