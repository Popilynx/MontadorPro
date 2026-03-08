import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Settings,
    LogOut,
    ChevronRight,
    TrendingUp,
    Bell,
    User as UserIcon,
    Menu as MenuIcon,
    X as CloseIcon
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const user = JSON.parse(localStorage.getItem('montador') || '{}');
    const isAdmin = user?.role === 'admin';

    const allMenuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard', adminOnly: false },
        { icon: <ClipboardList size={20} />, label: 'Ordens de Serviço', path: '/ordens', adminOnly: true },
        { icon: <Users size={20} />, label: 'Montadores', path: '/montadores', adminOnly: true },
        { icon: <Bell size={20} />, label: 'Convite Ativo', path: '/convite', adminOnly: false },
        { icon: <TrendingUp size={20} />, label: 'Histórico de Faturamento', path: '/historico', adminOnly: true },
        { icon: <UserIcon size={20} />, label: 'Meu Perfil', path: '/perfil', adminOnly: false },
        { icon: <Settings size={20} />, label: 'Configurações', path: '/configuracoes', adminOnly: true },
    ];

    const menuItems = allMenuItems.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.montadorOnly && isAdmin) return false;
        return true;
    });

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
    };

    return (
        <aside className={`
            fixed top-0 left-0 z-50 h-screen
            w-[80vw] max-w-xs lg:w-64
            bg-primary border-r border-primary-light/10 flex flex-col 
            shadow-2xl transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <div className="p-8 flex items-center justify-between gap-3">
                <div className="font-drama text-2xl font-bold italic tracking-wider text-background">
                    Montador<span className="text-accent">Pro</span>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden text-background/50 hover:text-white"
                >
                    <CloseIcon size={24} />
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                            if (window.innerWidth < 1024) setIsOpen(false);
                        }}
                        className={({ isActive }) =>
                            `flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-accent/10 border border-accent/20 text-accent shadow-inner'
                                : 'text-background/50 hover:bg-primary-light/30 border border-transparent hover:text-background'
                            }`
                        }
                    >
                        <div className="flex items-center gap-3">
                            {item.icon}
                            <span className="font-sans text-sm tracking-wide">{item.label}</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-primary-light/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-background/40 hover:bg-red-950/30 hover:text-red-400 rounded-2xl transition-all text-sm font-mono tracking-widest uppercase"
                >
                    <LogOut size={16} />
                    <span>Desconectar</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
