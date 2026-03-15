import React, { useState } from 'react';
import { LogIn, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../api/api';
import { subscribeToPush } from '../utils/pushNotifications';

const Login = () => {
    const [credencial, setCredencial] = useState('');
    const [senha, setSenha] = useState('');
    const [showSenha, setShowSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modo, setModo] = useState('montador'); // montador | admin

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const credencialTrim = (credencial || '').trim();
            if (!credencialTrim) {
                setError('Informe e-mail ou telefone para acessar.');
                setLoading(false);
                return;
            }

            const response = modo === 'admin'
                ? await api.post('/admin/login', {
                    credencial: credencialTrim,
                    password: senha
                })
                : await api.post('/auth/login', { 
                    telefone: credencialTrim,
                    password: senha 
                });
            const { accessToken, montador } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('montador', JSON.stringify(montador));
            
            if (modo !== 'admin' && localStorage.getItem('config_notifications') !== 'false') {
                subscribeToPush().catch(err => console.error('Erro push login:', err));
            }

            const redirectTo = montador.role === 'admin' ? '/dashboard' : '/ordens';
            window.location.href = redirectTo;
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao realizar login. Verifique seus dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden p-4">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
            <div className="noise-overlay"></div>

            <div className="max-w-md w-full bg-primary-dark/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
                
                <div className="text-center mb-10">
                    <div className="font-drama text-4xl font-bold italic tracking-wider text-background mb-2">Montador<span className="text-accent">Pro</span></div>
                    <p className="font-mono text-accent text-[10px] font-bold uppercase tracking-[0.3em] mt-4 opacity-80">Acesso Restrito</p>
                    
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setModo('montador')}
                            className={`px-4 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border transition-all ${
                                modo === 'montador' ? 'bg-accent/20 text-accent border-accent/40' : 'text-white/40 border-white/10 hover:border-accent/20'
                            }`}
                        >
                            Montador
                        </button>
                        <button
                            type="button"
                            onClick={() => setModo('admin')}
                            className={`px-4 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border transition-all ${
                                modo === 'admin' ? 'bg-accent/20 text-accent border-accent/40' : 'text-white/40 border-white/10 hover:border-accent/20'
                            }`}
                        >
                            Admin
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-6 text-center font-mono">
                        [ERROR]: {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 ml-1">Credencial</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/60">
                                {modo === 'admin' ? <Lock size={18} /> : <Phone size={18} />}
                            </div>
                            <input
                                type="text"
                                value={credencial}
                                onChange={(e) => setCredencial(e.target.value)}
                                placeholder={modo === 'admin' ? "admin@empresa.com ou Telefone" : "Telefone ou E-mail"}
                                className="w-full bg-primary-dark/60 border border-primary-light/20 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all placeholder:text-white/30 font-mono text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 ml-1">Código de Segurança</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/60" size={18} />
                            <input
                                type={showSenha ? 'text' : 'password'}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-primary-dark/60 border border-primary-light/20 text-white pl-12 pr-12 py-4 rounded-2xl focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all placeholder:text-white/30 font-mono text-sm tracking-widest"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowSenha(!showSenha)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/60 hover:text-accent transition-colors"
                            >
                                {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 uppercase tracking-widest text-xs font-mono mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Autenticar'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-2">
                    <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">
                        Esqueceu as chaves? <a href="#" className="text-accent hover:text-accent-hover transition-colors font-bold underline decoration-accent/30 decoration-offset-4">Solicite reset.</a>
                    </p>
                    <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest mt-4">
                        Ainda não é parceiro? <a href="/cadastro" className="text-accent hover:text-accent-hover transition-colors font-bold underline decoration-accent/30 decoration-offset-4">Faça seu cadastro.</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
