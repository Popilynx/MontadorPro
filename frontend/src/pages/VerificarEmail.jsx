import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/api';

const VerificarEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [mensagem, setMensagem] = useState('');

    const email = searchParams.get('email');
    const code = searchParams.get('code');

    useEffect(() => {
        if (email && code) {
            handleVerificar(email, code);
        }
    }, []);

    const handleVerificar = async (vEmail, vCode) => {
        setLoading(true);
        setStatus('loading');
        try {
            const response = await api.post('/montadores/verificar', { email: vEmail, code: vCode });
            setMensagem(response.data.message);
            setStatus('success');
        } catch (err) {
            console.error('Erro na verificação:', err);
            setMensagem(err.response?.data?.error || 'Código inválido ou expirado.');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-slate-50">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 text-center space-y-8">
                
                {status === 'idle' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-primary/10 p-5 rounded-full text-primary">
                                <Mail size={48} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Verificação <span className="text-accent italic">de Conta</span></h2>
                            <p className="text-slate-500 mt-2 text-sm">
                                Se você clicou no link do e-mail, sua conta será ativada automaticamente.
                            </p>
                        </div>
                        {!email && (
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs text-slate-400 font-mono">
                                Aguardando parâmetros de verificação...
                            </div>
                        )}
                    </div>
                )}

                {status === 'loading' && (
                    <div className="py-12 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-accent" size={48} />
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Processando Ativação...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center">
                            <div className="bg-green-500/10 p-5 rounded-full text-green-500">
                                <CheckCircle size={48} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Conta <span className="text-green-500">Ativada!</span></h2>
                            <p className="text-slate-500 mt-2 text-sm">{mensagem}</p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-primary-light transition-all shadow-lg shadow-primary/20"
                        >
                            Ir para Login
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center">
                            <div className="bg-red-500/10 p-5 rounded-full text-red-500">
                                <AlertCircle size={48} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ops! <span className="text-red-500">Falhou</span></h2>
                            <p className="text-slate-500 mt-2 text-sm">{mensagem}</p>
                        </div>
                        <button
                            onClick={() => setStatus('idle')}
                            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-50">
                    <p className="text-[10px] text-slate-300 uppercase tracking-tighter font-mono font-bold">
                        MontadorPro &copy; 2026 \ Gestão Inteligente
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerificarEmail;
