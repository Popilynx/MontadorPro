import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import RealTimeMap from '../components/RealTimeMap';
import api from '../api/api';
import {
    ClipboardCheck,
    Users,
    Clock,
    TrendingUp,
    MapPin,
    Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState([
        { title: 'Ordens Concluídas', value: '0', icon: <ClipboardCheck />, color: 'bg-primary', trend: 0 },
        { title: 'Montadores Ativos', value: '0', icon: <Users />, color: 'bg-emerald-500', trend: 0 },
        { title: 'Tempo Médio', value: '0h', icon: <Clock />, color: 'bg-amber-500', trend: 0 },
        { title: 'Faturamento Mes', value: 'R$ 0', icon: <TrendingUp />, color: 'bg-accent', trend: 0 },
    ]);
    const [montadores, setMontadores] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Promise.allSettled garante que uma rota com erro (ex: 403 se não for admin)
                // não cancela as demais buscas.
                const [statsResult, montadoresResult, ordersResult] = await Promise.allSettled([
                    api.get('/admin/stats'),
                    api.get('/admin/montadores'),
                    api.get('/admin/ordens?limit=3'),
                ]);

                if (statsResult.status === 'fulfilled') {
                    const d = statsResult.value.data;
                    setStats([
                        { title: 'Ordens Concluídas', value: d.totalOS ?? 0, icon: <ClipboardCheck />, color: 'bg-primary', trend: 0 },
                        { title: 'Montadores Ativos', value: d.totalMontadores ?? 0, icon: <Users />, color: 'bg-emerald-500', trend: 0 },
                        { title: 'Tempo Médio', value: '2.5h', icon: <Clock />, color: 'bg-amber-500', trend: 0 },
                        { title: 'Faturamento Total', value: `R$ ${(d.faturamento ?? 0).toLocaleString('pt-BR')}`, icon: <TrendingUp />, color: 'bg-accent', trend: 0 },
                    ]);
                }

                if (ordersResult.status === 'fulfilled') {
                    // /admin/ordens retorna um array direto (não { ordens: [] })
                    const raw = ordersResult.value.data;
                    setRecentOrders(Array.isArray(raw) ? raw.slice(0, 3) : (raw.ordens ?? []).slice(0, 3));
                }

                if (montadoresResult.status === 'fulfilled') {
                    setMontadores(montadoresResult.value.data || []);
                }
            } catch (err) {
                console.error('Erro inesperado no dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);


    return (
        <Layout title="Dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <StatsCard key={idx} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-[#16161E] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-xl shadow-primary/5 border border-primary-light/5 dark:border-white/10">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xl font-sans font-bold text-primary dark:text-white tracking-tight">Ordens de Serviço Recentes</h4>
                        <button className="text-primary-light/50 dark:text-white/40 text-xs font-mono tracking-widest uppercase hover:text-accent transition-colors">Ver todas</button>
                    </div>

                    <div className="space-y-4">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((os) => (
                                <div 
                                    key={os.id} 
                                    onClick={() => navigate(`/convite/${os.id}`)}
                                    className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer border border-primary-light/5 dark:border-white/10 hover:border-primary-light/20 dark:hover:border-white/20 hover:shadow-md hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-white/10 p-3 rounded-xl shadow-sm border border-primary-light/5 dark:border-white/10 text-primary-light/60 dark:text-white/60">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="font-sans font-bold text-primary dark:text-white">{os.numero}</p>
                                            <p className="text-sm text-primary-light/60 dark:text-white/50 font-medium mt-1">{os.cliente?.nome || 'Cliente não identificado'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase border shadow-inner ${
                                            os.status === 'CONCLUIDA' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-accent/10 text-accent border-accent/20'
                                        }`}>
                                            {os.status.replace('_', ' ')}
                                        </span>
                                        <p className="text-xs text-primary-light/40 dark:text-white/30 font-mono mt-2 uppercase tracking-widest">
                                            {os.dataInstalacao ? new Date(os.dataInstalacao).toLocaleDateString() : 'Hoje'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <p className="font-mono text-sm uppercase tracking-widest dark:text-white/50">Nenhuma ordem recente encontrada.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-primary rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-2xl border border-accent/20 min-h-[400px] md:min-h-[500px] flex flex-col relative overflow-hidden">
                    {/* Decorative background blur */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h4 className="text-xl font-sans font-bold text-background tracking-tight">Mapa de Cobertura</h4>
                        <span className="flex items-center gap-2 text-xs font-mono tracking-widest font-bold text-accent bg-accent/10 px-3 py-1.5 border border-accent/20 rounded-full animate-pulse shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_10px_rgba(201,168,76,0.8)]"></span>
                            LIVE
                        </span>
                    </div>
                    <div className="h-[300px] md:h-[400px] rounded-2xl overflow-hidden border border-primary-light/20 relative z-10 shadow-inner">
                        {!loading && <RealTimeMap montadores={montadores} />}
                    </div>
                    <p className="text-xs font-mono tracking-widest uppercase text-background/40 mt-6 text-center relative z-10">Monitoramento satelital ativo.</p>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
