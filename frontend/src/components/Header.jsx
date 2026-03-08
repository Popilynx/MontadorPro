import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User as UserIcon, X, Info, Menu as MenuIcon } from 'lucide-react';
import { gsap } from 'gsap';

const Header = ({ title, toggleSidebar }) => {
    const navigate = useNavigate();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('montador') || '{}');

    const displayName = user.nome ? user.nome.split(' ')[0] : 'Operador';
    const displayRole = user.role === 'admin' ? 'Alpha' : 'Padrão';

    useEffect(() => {
        if (isNotifOpen) {
            gsap.fromTo(notifRef.current, 
                { opacity: 0, y: -20, scale: 0.95 }, 
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
            );
        }
    }, [isNotifOpen]);

    return (
        <header className="h-20 md:h-24 bg-background/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between border-b border-primary-light/10 transition-all">
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 lg:hidden text-primary group"
                >
                    <MenuIcon size={24} className="group-hover:text-accent transition-colors" />
                </button>
                <h2 className="text-xl md:text-3xl font-sans font-bold text-primary tracking-tight truncate max-w-[150px] md:max-w-none">
                    {title}
                </h2>
            </div>

            <div className="flex items-center gap-3 md:gap-8">
                <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar registros..."
                        className="bg-white/50 border border-primary-light/10 rounded-2xl pl-12 pr-4 py-3 text-sm w-72 focus:ring-1 focus:ring-accent focus:border-accent transition-all outline-none font-mono placeholder:text-primary-light/30 shadow-sm"
                    />
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`relative p-3 rounded-2xl transition-all ${isNotifOpen ? 'bg-accent text-primary' : 'text-primary-light/60 hover:text-accent hover:bg-accent/10'}`}
                    >
                        <Bell size={20} />
                        {!isNotifOpen && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background animate-pulse"></span>}
                    </button>

                    {isNotifOpen && (
                    <div 
                        ref={notifRef}
                        className="absolute right-0 mt-4 w-80 bg-primary/98 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_20px_rgba(201,168,76,0.15)] p-6 z-[60] border border-accent/20 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-xl font-drama font-bold italic text-accent tracking-wide">Notificações</h4>
                            <button onClick={() => setIsNotifOpen(false)} className="text-background/40 hover:text-accent transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                            <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                                    <Info size={32} />
                                </div>
                                <div>
                                    <p className="text-background font-bold font-sans">Sem novas mensagens</p>
                                    <p className="text-[10px] font-mono text-background/40 uppercase tracking-widest mt-1">Você está em dia com suas tarefas</p>
                                </div>
                            </div>
                            <div className="p-4 bg-accent/5 text-center">
                                <button className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.2em] hover:text-white transition-colors">LIMPAR TUDO</button>
                            </div>
                        </div>
                    )}
                </div>

                <div 
                    onClick={() => navigate('/perfil')}
                    className="flex items-center gap-4 pl-6 border-l border-primary-light/10 cursor-pointer group hover:opacity-80 transition-all"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-sans font-bold text-primary group-hover:text-accent transition-colors">{displayName}</p>
                        <p className="text-xs font-mono text-primary-light/50 uppercase tracking-widest">Nível {displayRole}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-accent border border-accent/20 shadow-lg shadow-primary/10 overflow-hidden">
                        {user.foto_url ? (
                            <img src={user.foto_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={20} />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
