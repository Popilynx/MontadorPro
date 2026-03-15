import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import RealTimeMap from '../components/RealTimeMap';
import api from '../api/api';
import { readCache, writeCache } from '../utils/cache';
import {
    ClipboardCheck,
    Users,
    Clock,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DetalhesOrdemModal from '../components/DetalhesOrdemModal';

const Dashboard = () => {
    const statsCacheKey = 'dashboard_stats_v2';
    const defaultStats = [
        { title: 'Ordens ConcluÃ­das', value: '0', icon: <ClipboardCheck />, color: 'bg-primary', trend: 0 },
        { title: 'Montadores Ativos', value: '0', icon: <Users />, color: 'bg-emerald-500', trend: 0 },
        { title: 'Tempo MÃ©dio', value: '0h', icon: <Clock />, color: 'bg-amber-500', trend: 0 },
        { title: 'Faturamento Mes', value: 'R$ 0', icon: <TrendingUp />, color: 'bg-accent', trend: 0 },
    ];

    const buildStats = (data) => ([
        { title: 'Ordens ConcluÃ­das', value: data?.totalOS ?? 0, icon: <ClipboardCheck />, color: 'bg-primary', trend: 0 },
        { title: 'Montadores Ativos', value: data?.totalMontadores ?? 0, icon: <Users />, color: 'bg-emerald-500', trend: 0 },
        { title: 'Tempo MÃ©dio', value: '2.5h', icon: <Clock />, color: 'bg-amber-500', trend: 0 },
        { title: 'Faturamento Total', value: `R$ ${((data?.faturamento ?? 0)).toLocaleString('pt-BR')}`, icon: <TrendingUp />, color: 'bg-accent', trend: 0 },
    ]);

    const statsCache = readCache(statsCacheKey, null);
    const ordersCache = readCache('dashboard_orders_v1', null);
    const mapCache = readCache('dashboard_montadores_v1', null);

    const [stats, setStats] = useState(() => statsCache ? buildStats(statsCache) : defaultStats);
    const [montadores, setMontadores] = useState(() => mapCache || []);
    const [recentOrders, setRecentOrders] = useState(() => ordersCache || []);

    const [statsReady, setStatsReady] = useState(() => !!statsCache);
    const [ordersReady, setOrdersReady] = useState(() => ordersCache !== null);
    const [mapReady, setMapReady] = useState(() => mapCache !== null);

    const [statsLoading, setStatsLoading] = useState(() => !statsCache);
    const [ordersLoading, setOrdersLoading] = useState(() => !ordersCache);
    const [mapLoading, setMapLoading] = useState(() => !mapCache);
    const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
    const [selectedOrdem, setSelectedOrdem] = useState(null);
    const navigate = useNavigate();

    const fetchStats = async () => {
        if (!statsReady) setStatsLoading(true);
        try {
            const { data } = await api.get('/admin/stats');
            const nextStats = buildStats(data);
            setStats(nextStats);
            writeCache(statsCacheKey, {
                totalOS: data?.totalOS ?? 0,
                totalMontadores: data?.totalMontadores ?? 0,
                faturamento: data?.faturamento ?? 0
            });
            setStatsReady(true);
        } catch (err) {
            console.error('Erro ao buscar stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchOrders = async () => {
        if (!ordersReady) setOrdersLoading(true);
        try {
            const { data } = await api.get('/admin/ordens?limit=3');
            const ordersArray = Array.isArray(data) ? data : (data.ordens || []);
            const nextOrders = ordersArray.slice(0, 3);
            setRecentOrders(nextOrders);
            localStorage.setItem('dashboard_orders_v1', JSON.stringify(nextOrders));
            setOrdersReady(true);
        } catch (err) {
            console.error('Erro ao buscar ordens:', err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchMap = async () => {
        if (!mapReady) setMapLoading(true);
        try {
            const { data } = await api.get('/admin/montadores?view=map');
            setMontadores(data || []);
            localStorage.setItem('dashboard_montadores_v1', JSON.stringify(data || []));
            setMapReady(true);
        } catch (err) {
            console.error('Erro ao buscar montadores do mapa:', err);
        } finally {
            setMapLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchOrders();
        fetchMap();
        const interval = setInterval(() => {
            fetchStats();
            fetchOrders();
            fetchMap();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const displayStats = statsLoading && !statsReady
        ? stats.map((s) => ({ ...s, value: '...' }))
        : stats;

    return (
        <Layout title="Dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {displayStats.map((stat, idx) => (
                    <StatsCard key={idx} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-[#16161E] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-xl shadow-primary/5 border border-primary-light/5 dark:border-white/10">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xl font-sans font-bold text-primary dark:text-white tracking-tight">Ordens de ServiÃ§o Recentes</h4>
                        <button 
                            onClick={() => navigate('/ordens')}
                            className="text-primary-light/50 dark:text-white/40 text-xs font-mono tracking-widest uppercase hover:text-accent transition-colors"
                        >
                            Ver todas
                        </button>
                    </div>

                    <div className="space-y-4">
                        {ordersLoading && recentOrders.length === 0 ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((idx) => (
                                    <div key={idx} className="h-20 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse border border-primary-light/5" />
                                ))}
                            </div>
                        ) : recentOrders.length > 0 ? (
                            recentOrders.map((os) => (
                                <div 
                                    key={os.id} 
                                    onClick={() => {
                                        setSelectedOrdem(os);
                                        setIsDetalhesOpen(true);
                                    }}
                                    className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer border border-primary-light/5 dark:border-white/10 hover:border-primary-light/20 dark:hover:border-white/20 hover:shadow-md hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-white/10 p-3 rounded-xl shadow-sm border border-primary-light/5 dark:border-white/10 text-primary-light/60 dark:text-white/60">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="font-sans font-bold text-primary dark:text-white">{os.numero || os.numero_os || `OS #${os.id.toString().padStart(4, '0')}`}</p>
                                            <p className="text-sm text-primary-light/60 dark:text-white/50 font-medium mt-1">{os.cliente?.nome || os.cliente_nome || 'Cliente nÃ£o identificado'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase border shadow-inner ${
                                            os.status?.toUpperCase() === 'CONCLUIDA' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-accent/10 text-accent border-accent/20'
                                        }`}>
                                            {(os.status || '').replace('_', ' ')}
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
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h4 className="text-xl font-sans font-bold text-background tracking-tight">Mapa de Cobertura</h4>
                        <span className="flex items-center gap-2 text-xs font-mono tracking-widest font-bold text-accent bg-accent/10 px-3 py-1.5 border border-accent/20 rounded-full animate-pulse shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_10px_rgba(201,168,76,0.8)]"></span>
                            LIVE
                        </span>
                    </div>
                    <div className="h-[350px] md:h-[400px] rounded-2xl overflow-hidden border border-primary-light/20 relative z-10 shadow-inner">
                        <RealTimeMap montadores={montadores} />
                        {mapLoading && (
                            <div className="absolute inset-0 bg-primary/40 backdrop-blur-[1px] flex items-center justify-center text-xs font-mono uppercase tracking-widest text-background/60">
                                Carregando mapa...
                            </div>
                        )}
                    </div>
                    <p className="text-xs font-mono tracking-widest uppercase text-background/40 mt-6 text-center relative z-10">Monitoramento satelital ativo.</p>
                </div>
            </div>
            
            <DetalhesOrdemModal 
                isOpen={isDetalhesOpen} 
                onClose={() => setIsDetalhesOpen(false)} 
                ordem={selectedOrdem}
                onRefresh={() => {
                    fetchStats();
                    fetchOrders();
                    fetchMap();
                }} 
            />
        </Layout>
    );
};

export default Dashboard;
