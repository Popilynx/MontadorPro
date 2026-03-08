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
                const [statsRes, montadoresRes, ordersRes] = await Promise.all([
                    api.get('/os/stats/dashboard'),
                    api.get('/montadores'),
                    api.get('/os?limit=3')
                ]);

                setStats([
                    { title: 'Ordens Concluídas', value: statsRes.data.concluidas, icon: <ClipboardCheck />, color: 'bg-primary', trend: 0 },
                    { title: 'Montadores Ativos', value: statsRes.data.montadoresAtivos, icon: <Users />, color: 'bg-emerald-500', trend: 0 },
                    { title: 'Tempo Médio', value: statsRes.data.tempoMedio || '2.4h', icon: <Clock />, color: 'bg-amber-500', trend: 0 },
                    { title: 'Faturamento Mes', value: `R$ ${statsRes.data.faturamento}`, icon: <TrendingUp />, color: 'bg-accent', trend: 0 },
                ]);

                setRecentOrders(ordersRes.data.ordens || []);

                const mappedMontadores = montadoresRes.data.map((m) => ({
                    ...m
                }));
                setMontadores(mappedMontadores);
            } catch (err) {
                console.error('Erro ao carregar dados do dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <Layout title="Dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <StatsCard key={idx} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-xl shadow-primary/5 border border-primary-light/5">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xl font-sans font-bold text-primary tracking-tight">Ordens de Serviço Recentes</h4>
                        <button className="text-primary-light/50 text-xs font-mono tracking-widest uppercase hover:text-accent transition-colors">Ver todas</button>
                    </div>

                    <div className="space-y-4">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((os) => (
                                <div 
                                    key={os.id} 
                                    onClick={() => navigate(`/convite/${os.id}`)}
                                    className="flex items-center justify-between p-5 bg-background/50 rounded-2xl hover:bg-background transition-all cursor-pointer border border-primary-light/5 hover:border-primary-light/20 hover:shadow-md hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-primary-light/5 text-primary-light/60">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="font-sans font-bold text-primary">OS #{os.id.toString().padStart(4, '0')}</p>
                                            <p className="text-sm text-primary-light/60 font-medium mt-1">{os.cliente_nome}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase border shadow-inner ${
                                            os.status === 'CONCLUIDA' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-accent/10 text-accent border-accent/20'
                                        }`}>
                                            {os.status.replace('_', ' ')}
                                        </span>
                                        <p className="text-xs text-primary-light/40 font-mono mt-2 uppercase tracking-widest">
                                            {os.data_agendamento ? new Date(os.data_agendamento).toLocaleDateString() : 'Hoje'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <p className="font-mono text-sm uppercase tracking-widest">Nenhuma ordem recente encontrada.</p>
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
                    <div className="flex-1 min-h-[300px] rounded-2xl overflow-hidden border border-primary-light/20 relative z-10 shadow-inner">
                        {!loading && <RealTimeMap montadores={montadores} />}
                    </div>
                    <p className="text-xs font-mono tracking-widest uppercase text-background/40 mt-6 text-center relative z-10">Monitoramento satelital ativo.</p>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
