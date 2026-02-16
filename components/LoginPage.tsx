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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl mb-4">
                        <span className="text-2xl font-black text-white">GDP</span>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">GDP Cloud</h1>
                    <p className="text-sm text-slate-400 mt-1">Sistema de Gestión de Decretos</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
                    <h2 className="text-xl font-black text-white mb-6 text-center">
                        {mode === 'login' && 'Iniciar Sesión'}
                        {mode === 'forgot' && 'Recuperar Contraseña'}
                    </h2>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                            <p className="text-sm text-emerald-200">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Password - Solo en modo login */}
                        {mode === 'login' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Forgot password link */}
                        {mode === 'login' && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-black rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    {mode === 'login' && 'Iniciar Sesión'}
                                    {mode === 'forgot' && 'Enviar Instrucciones'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Google Sign In - Solo en modo login */}
                    {mode === 'login' && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-slate-500 font-bold backdrop-blur-xl">O también</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full py-3.5 bg-white hover:bg-slate-50 disabled:bg-slate-400 text-slate-900 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                                Continuar con Google
                            </button>
                        </>
                    )}

                    {/* Back to login (solo en modo forgot) */}
                    {mode === 'forgot' && (
                        <div className="mt-6 pt-6 border-t border-white/10 text-center">
                            <button
                                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                                className="text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                            >
                                ← Volver al inicio de sesión
                            </button>
                        </div>
                    )}

                    {/* Info para usuarios sin cuenta */}
                    {mode === 'login' && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-xs text-slate-500 text-center">
                                Las cuentas son creadas por el administrador del sistema.
                                Si necesitas acceso, contacta al administrador.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    © {new Date().getFullYear()} GDP Cloud · Todos los derechos reservados
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
