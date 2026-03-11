import React, { useState } from 'react';
import { LogIn, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../api/api';

const Login = () => {
    const [telefone, setTelefone] = useState('');
    const [senha, setSenha] = useState('');
    const [showSenha, setShowSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { telefone, password: senha });
            const { accessToken, montador } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('montador', JSON.stringify(montador));
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao realizar login. Verifique seus dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden p-4">
            {/* Overlay Cinematográfico */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
            <div className="noise-overlay"></div>

            <div className="max-w-md w-full glass-panel bg-primary-light/40 backdrop-blur-2xl p-10 rounded-[2rem] border border-accent/20 shadow-2xl z-10 animate-[fade-in_1s_ease-out]">
                <div className="text-center mb-10">
                    <div className="font-drama text-4xl font-bold italic tracking-wider text-background mb-2">Montador<span className="text-accent">Pro</span></div>
                    <p className="font-mono text-accent text-xs uppercase tracking-widest mt-4">Acesso Restrito</p>
                </div>

                {error && (
                    <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-6 text-center font-mono">
                        [ERROR]: {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-background/60 ml-1">Credencial</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/50" size={18} />
                            <input
                                type="text"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                placeholder="Telefone ou ID"
                                className="w-full bg-primary-dark/50 border border-primary-light/30 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all placeholder:text-background/20 font-mono text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-background/60 ml-1">Código de Segurança</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/50" size={18} />
                            <input
                                type={showSenha ? 'text' : 'password'}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-primary-dark/50 border border-primary-light/30 text-white pl-12 pr-12 py-4 rounded-2xl focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all placeholder:text-background/20 font-mono text-sm tracking-widest"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowSenha(!showSenha)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/50 hover:text-accent transition-colors"
                            >
                                {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 uppercase tracking-widest text-xs font-mono mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Autenticar'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-primary-light/20 text-center">
                    <p className="text-background/40 font-mono text-xs">
                        Esqueceu as chaves? <a href="#" className="text-accent hover:text-accent-hover transition-colors">Solicite reset.</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
