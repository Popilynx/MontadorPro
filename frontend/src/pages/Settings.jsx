import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    Bell, 
    Shield, 
    Smartphone, 
    Info, 
    LogOut, 
    Trash2, 
    ChevronRight, 
    Moon, 
    Sun,
    Vibrate,
    Lock,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';

const Settings = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('montador') || '{}');
    
    // Estados persistentes
    const [notifications, setNotifications] = useState(() => localStorage.getItem('config_notifications') !== 'false');
    const [vibration, setVibration] = useState(() => localStorage.getItem('config_vibration') !== 'false');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('config_theme') === 'dark');
    const [showPassModal, setShowPassModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        // Garantir tema correto ao carregar
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleToggleNotifications = async () => {
        const newValue = !notifications;
        if (newValue) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Você precisa permitir notificações no navegador para ativar esta opção.');
                return;
            }
            const success = await subscribeToPush();
            if (!success) {
                alert('Erro ao ativar notificações no servidor.');
                return;
            }
        } else {
            await unsubscribeFromPush();
        }
        setNotifications(newValue);
        localStorage.setItem('config_notifications', newValue);
    };

    const handleToggleVibration = () => {
        const newValue = !vibration;
        setVibration(newValue);
        localStorage.setItem('config_vibration', newValue);
        if (newValue && 'vibrate' in navigator) {
            navigator.vibrate(200);
        }
    };

    const handleToggleTheme = () => {
        const newValue = !darkMode;
        setDarkMode(newValue);
        localStorage.setItem('config_theme', newValue ? 'dark' : 'light');
    };

    const handleLogout = () => {
        if (window.confirm('Deseja realmente encerrar sua sessão?')) {
            localStorage.clear();
            navigate('/login');
        }
    };

    const handleClearCache = () => {
        if (window.confirm('Isso irá limpar dados temporários do app. Continuar?')) {
            const keysToKeep = ['montador', 'accessToken', 'config_notifications', 'config_vibration', 'config_theme', 'app_cache_version']; 
            Object.keys(localStorage).forEach(key => {
                if (!keysToKeep.includes(key)) localStorage.removeItem(key);
            });
            alert('Cache limpo com sucesso!');
            window.location.reload();
        }
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            alert('As senhas não coincidem!');
            return;
        }
        // Simulação de chamada API
        alert('Senha alterada com sucesso! (Simulado)');
        setShowPassModal(false);
        setPasswords({ current: '', new: '', confirm: '' });
    };

    useEffect(() => {
        gsap.fromTo(".settings-card", 
            { opacity: 0, y: 30 },
            { 
                opacity: 1, 
                y: 0, 
                stagger: 0.1, 
                duration: 1, 
                ease: "power4.out" 
            }
        );
    }, []);

    return (
        <Layout title="Configurações">
            <div className="max-w-4xl mx-auto pb-20">
                
                {/* Perfil Rápido */}
                <div className="settings-card bg-white rounded-[2rem] p-8 mb-8 shadow-2xl shadow-primary/10 border border-primary-light/10 flex items-center justify-between transition-all hover:border-accent/20">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center border border-accent/20 overflow-hidden shadow-lg shadow-primary/20">
                            {user.foto_url ? (
                                <img src={user.foto_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="text-accent" size={32} />
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-sans font-extrabold text-primary">{user.nome || 'Operador'}</h3>
                            <p className="text-xs font-mono text-primary-light/80 uppercase tracking-[0.2em] font-bold mt-1">{user.role === 'admin' ? 'Acesso Alpha' : 'Montador Padrão'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/perfil')}
                        className="p-4 bg-background rounded-2xl text-accent hover:bg-accent hover:text-primary transition-all duration-300 shadow-sm border border-primary-light/5"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Notificações */}
                    <div className="settings-card bg-white rounded-[2rem] p-8 shadow-xl shadow-primary/10 border border-primary-light/10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-accent/10 rounded-2xl text-accent border border-accent/20">
                                <Bell size={24} />
                            </div>
                            <h4 className="text-lg font-drama font-bold text-primary uppercase tracking-widest">Notificações</h4>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-5 bg-background border border-primary-light/5 rounded-2xl transition-all hover:border-accent/20">
                                <div className="flex items-center gap-3">
                                    <Smartphone size={20} className="text-accent" />
                                    <span className="text-base font-sans font-bold text-primary">Push Messages</span>
                                </div>
                                <button 
                                    onClick={handleToggleNotifications}
                                    className={`w-14 h-7 rounded-full transition-all relative ${notifications ? 'bg-accent shadow-[0_0_20px_rgba(201,168,76,0.4)]' : 'bg-primary-light/20'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${notifications ? 'left-8 shadow-md' : 'left-1'}`} />
                                </button>
                            </div>
                            
                            <div className="flex items-center justify-between p-5 bg-background border border-primary-light/5 rounded-2xl transition-all hover:border-accent/20">
                                <div className="flex items-center gap-3">
                                    <Vibrate size={20} className="text-accent" />
                                    <span className="text-base font-sans font-bold text-primary">Vibrar no Convite</span>
                                </div>
                                <button 
                                    onClick={handleToggleVibration}
                                    className={`w-14 h-7 rounded-full transition-all relative ${vibration ? 'bg-accent shadow-[0_0_20px_rgba(201,168,76,0.4)]' : 'bg-primary-light/20'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${vibration ? 'left-8 shadow-md' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Segurança & Preferências */}
                    <div className="settings-card bg-white rounded-[2rem] p-8 shadow-xl shadow-primary/10 border border-primary-light/10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-accent/10 rounded-2xl text-accent border border-accent/20">
                                <Lock size={24} />
                            </div>
                            <h4 className="text-lg font-drama font-bold text-primary uppercase tracking-widest">Segurança</h4>
                        </div>
                        
                        <div className="space-y-6">
                            <div 
                                onClick={() => setShowPassModal(true)}
                                className="flex items-center justify-between p-5 bg-background border border-primary-light/5 rounded-2xl transition-all hover:border-accent/20 cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <Eye size={20} className="text-accent group-hover:scale-110 transition-transform" />
                                    <span className="text-base font-sans font-bold text-primary">Alterar Senha</span>
                                </div>
                                <ChevronRight size={18} className="text-primary-light/30 transition-all group-hover:translate-x-1" />
                            </div>
                            
                            <div className="flex items-center justify-between p-5 bg-background border border-primary-light/5 rounded-2xl transition-all hover:border-accent/20">
                                <div className="flex items-center gap-3">
                                    <Moon size={20} className="text-accent" />
                                    <span className="text-base font-sans font-bold text-primary">Modo Noturno</span>
                                </div>
                                <button 
                                    onClick={handleToggleTheme}
                                    className={`w-14 h-7 rounded-full transition-all relative ${darkMode ? 'bg-primary border border-accent/20' : 'bg-accent shadow-[0_0_15px_rgba(201,168,76,0.2)]'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 rounded-full transition-all flex items-center justify-center ${darkMode ? 'left-8 bg-accent' : 'left-1 bg-white shadow-md'}`}>
                                        {darkMode ? <Moon size={10} className="text-primary" /> : <Sun size={10} className="text-accent" />}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Informações */}
                    <div className="settings-card bg-white rounded-[2rem] p-8 shadow-xl shadow-primary/10 border border-primary-light/10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-accent/10 rounded-2xl text-accent border border-accent/20">
                                <div className="animate-pulse"><Info size={24} /></div>
                            </div>
                            <h4 className="text-lg font-drama font-bold text-primary uppercase tracking-widest">Suporte</h4>
                        </div>
                        
                        <div className="space-y-5 text-sm font-mono">
                            <div className="flex justify-between py-3 border-b border-primary-light/10">
                                <span className="text-primary-light uppercase tracking-widest font-bold">Versão</span>
                                <span className="text-primary font-black underline decoration-accent/30 decoration-2">2.1.0-GOLD</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-primary-light/10">
                                <span className="text-primary-light uppercase tracking-widest font-bold">Build</span>
                                <span className="text-primary font-black">March 2026</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-primary-light uppercase tracking-widest font-bold">Status API</span>
                                <span className="text-emerald-500 font-black flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    ONLINE
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ações Especiais */}
                    <div className="settings-card bg-primary rounded-[2rem] p-8 shadow-2xl shadow-primary/40 border border-accent/20 flex flex-col justify-between overflow-hidden relative group">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
                        
                        <div className="mb-8 z-10">
                            <h4 className="text-xl font-drama font-bold text-accent uppercase tracking-[0.3em] mb-3 italic">Zona Alpha</h4>
                            <p className="text-[11px] font-mono text-white/80 uppercase tracking-widest font-bold">Comandos de nível administrativo</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 z-10">
                            <button 
                                onClick={handleClearCache}
                                className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-accent/40 transition-all group/btn"
                            >
                                <Trash2 size={28} className="text-white/40 group-hover/btn:text-accent transition-colors" />
                                <span className="text-[11px] font-mono font-bold text-white/70 tracking-widest uppercase">Cache</span>
                            </button>
                            
                            <button 
                                onClick={handleLogout}
                                className="flex flex-col items-center gap-3 p-6 bg-red-500/10 rounded-3xl border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all group/btn shadow-lg"
                            >
                                <LogOut size={28} className="text-red-500/80 group-hover/btn:text-white transition-colors" />
                                <span className="text-[11px] font-mono font-bold text-white/70 tracking-widest uppercase group-hover/btn:text-white">Sair</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal Alterar Senha */}
            {showPassModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm" onClick={() => setShowPassModal(false)} />
                    <div className="bg-white dark:bg-primary-dark w-full max-w-md rounded-[2.5rem] p-8 border border-accent/20 shadow-2xl z-10 animate-[scale-in_0.3s_ease-out]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-drama font-bold text-primary dark:text-accent italic tracking-widest">Alterar Senha</h3>
                            <button onClick={() => setShowPassModal(false)} className="text-primary/40 hover:text-accent font-mono font-bold text-xl">×</button>
                        </div>
                        
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-mono font-bold text-primary-light/60 uppercase tracking-widest mb-2">Senha Atual</label>
                                <input 
                                    type="password"
                                    required
                                    className="w-full bg-background border border-primary-light/10 p-4 rounded-2xl focus:border-accent outline-none text-primary font-mono transition-all"
                                    value={passwords.current}
                                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono font-bold text-primary-light/60 uppercase tracking-widest mb-2">Nova Senha</label>
                                <input 
                                    type="password"
                                    required
                                    className="w-full bg-background border border-primary-light/10 p-4 rounded-2xl focus:border-accent outline-none text-primary font-mono transition-all"
                                    value={passwords.new}
                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono font-bold text-primary-light/60 uppercase tracking-widest mb-2">Confirmar Senha</label>
                                <input 
                                    type="password"
                                    required
                                    className="w-full bg-background border border-primary-light/10 p-4 rounded-2xl focus:border-accent outline-none text-primary font-mono transition-all"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                />
                            </div>
                            
                            <button type="submit" className="w-full bg-primary text-accent font-drama font-bold py-4 rounded-2xl border border-accent/20 hover:bg-accent hover:text-primary hover:shadow-[0_0_30px_rgba(201,168,76,0.2)] transition-all uppercase tracking-[0.2em]">
                                Salvar Alterações
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Settings;
