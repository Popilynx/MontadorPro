import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import {
    TrendingUp, DollarSign, Calendar, Award,
    ArrowUpRight, ArrowDownRight, BarChart2
} from 'lucide-react';

// ─── Componente de Gráfico de Barras em SVG Puro ───────────────────────────
const BarChart = ({ data, maxValue }) => {
    const barWidth = 32;
    const gap = 12;
    const height = 120;
    const svgWidth = data.length * (barWidth + gap);

    return (
        <div className="overflow-x-auto">
            <svg width={svgWidth} height={height + 28} className="overflow-visible">
                {data.map((item, i) => {
                    const barH = maxValue > 0 ? (item.valor / maxValue) * height : 0;
                    const x = i * (barWidth + gap);
                    const y = height - barH;
                    const isCurrentMonth = i === data.length - 1;
                    return (
                        <g key={i}>
                            {/* Background track */}
                            <rect
                                x={x} y={0}
                                width={barWidth} height={height}
                                rx={8}
                                fill="rgba(201,168,76,0.07)"
                            />
                            {/* Bar */}
                            <rect
                                x={x} y={y}
                                width={barWidth} height={barH}
                                rx={8}
                                fill={isCurrentMonth ? '#C9A84C' : 'rgba(201,168,76,0.35)'}
                                style={{ transition: 'height 0.6s ease, y 0.6s ease' }}
                            />
                            {/* Label */}
                            <text
                                x={x + barWidth / 2} y={height + 18}
                                textAnchor="middle"
                                fontSize="10"
                                fill="rgba(13,13,18,0.4)"
                                fontFamily="JetBrains Mono, monospace"
                            >
                                {item.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// ─── Card de Métrica ────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon: Icon, trend }) => (
    <div className="bg-white rounded-[2rem] border border-primary-light/10 shadow-xl shadow-primary/5 p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Icon size={22} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary-light/40 mb-1">{label}</p>
            <p className="font-sans font-bold text-2xl text-primary tracking-tight">{value}</p>
            {sub && <p className="font-mono text-xs text-primary-light/40 mt-0.5">{sub}</p>}
        </div>
        {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-400'}`}>
                {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(trend)}%
            </div>
        )}
    </div>
);

// ─── Componente Principal ───────────────────────────────────────────────────
const Historico = () => {
    const [dados, setDados] = useState(null);
    const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const mesAtual = new Date().getMonth() + 1;
    const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Buscar dados reais
    useEffect(() => {
        const fetchDados = async () => {
            setLoading(true);
            setErro(null); // Clear previous errors
            try {
                const { data } = await api.get(`/admin/historico?ano=${anoSelecionado}`);
                setDados(data);
            } catch (err) {
                console.error('Erro ao buscar histórico:', err);
                setErro('Não foi possível carregar o histórico. Tente novamente.');
                setDados(null); // Ensure dados is null on error
            } finally {
                setLoading(false);
            }
        };
        fetchDados();
    }, [anoSelecionado]);

    const mesesVazios = MESES.map((label, i) => ({ label, mes: i + 1, valor: 0, ordens: 0 }));
    const rawDados = dados || { meses: mesesVazios, totalAnual: 0, ordensTotal: 0, rating: 0 };
    const maxValor = Math.max(...rawDados.meses.map(m => m.valor), 1);
    const totalAnual = rawDados.totalAnual ?? rawDados.meses.reduce((a, m) => a + m.valor, 0);
    const mesCorrenteValor = rawDados.meses[mesAtual - 1]?.valor || 0;
    const mesPrevValor = rawDados.meses[mesAtual - 2]?.valor || 0;
    const tendencia = mesPrevValor > 0 ? Math.round(((mesCorrenteValor - mesPrevValor) / mesPrevValor) * 100) : 0;

    return (
        <Layout title="Histórico de Faturamento">
            <div className="space-y-6 max-w-5xl mx-auto">

                {erro && (
                    <div className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <span className="font-mono text-xs text-red-400 uppercase tracking-widest">{erro}</span>
                    </div>
                )}

                {/* Seletor de Ano */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-drama text-3xl font-bold text-primary">Histórico <span className="text-accent italic">de Faturamento</span></h1>
                        <p className="font-mono text-xs uppercase tracking-widest text-primary-light/40 mt-1">
                            Baseado nas Ordens de Serviço concluídas
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[anoSelecionado - 1, anoSelecionado].map(ano => (
                            <button
                                key={ano}
                                onClick={() => setAnoSelecionado(ano)}
                                className={`px-5 py-2 rounded-2xl font-mono text-xs font-bold uppercase tracking-widest transition-all ${ano === anoSelecionado
                                        ? 'bg-accent text-primary shadow-lg shadow-accent/20'
                                        : 'bg-background border border-primary-light/10 text-primary-light/50 hover:border-accent/30'
                                    }`}
                            >
                                {ano}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards de Métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="Total Anual"
                        icon={DollarSign}
                        value={`R$ ${totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        sub={`Exercício ${anoSelecionado}`}
                        trend={tendencia}
                    />
                    <MetricCard
                        label="Mês Atual"
                        icon={Calendar}
                        value={`R$ ${mesCorrenteValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        sub={MESES[mesAtual - 1]}
                    />
                    <MetricCard
                        label="Ticket Médio"
                        icon={TrendingUp}
                        value={`R$ ${rawDados.ordensTotal > 0 ? (totalAnual / rawDados.ordensTotal).toFixed(2) : '0,00'}`}
                        sub={`${rawDados.ordensTotal || 0} ordens concluídas`}
                    />
                    <MetricCard
                        label="Avaliação Média"
                        icon={Award}
                        value={`${rawDados.rating || '—'} ★`}
                        sub="Satisfação dos clientes"
                    />
                </div>

                {/* Gráfico de Barras Mensal */}
                <div className="bg-white rounded-[2rem] border border-primary-light/10 shadow-xl shadow-primary/5 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="font-sans font-bold text-xl text-primary">Faturamento Mensal</h2>
                            <p className="font-mono text-xs uppercase tracking-widest text-primary-light/40 mt-0.5">
                                Evolução mês a mês — {anoSelecionado}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-accent" />
                                <span className="font-mono text-xs text-primary-light/50">Mês atual</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-accent/35" />
                                <span className="font-mono text-xs text-primary-light/50">Meses anteriores</span>
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="h-[160px] flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <BarChart data={rawDados.meses} maxValue={maxValor} />
                    )}
                </div>

                {/* Tabela Detalhada */}
                <div className="bg-white rounded-[2rem] border border-primary-light/10 shadow-xl shadow-primary/5 overflow-hidden">
                    <div className="px-8 py-6 border-b border-primary-light/10 flex items-center gap-3">
                        <BarChart2 size={18} className="text-accent" />
                        <h2 className="font-sans font-bold text-xl text-primary">Detalhamento por Mês</h2>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-primary-light/10">
                                <th className="px-8 py-4 text-left font-mono text-[10px] uppercase tracking-widest text-primary-light/40">Mês</th>
                                <th className="px-8 py-4 text-right font-mono text-[10px] uppercase tracking-widest text-primary-light/40">Ordens</th>
                                <th className="px-8 py-4 text-right font-mono text-[10px] uppercase tracking-widest text-primary-light/40">Faturamento</th>
                                <th className="px-8 py-4 text-right font-mono text-[10px] uppercase tracking-widest text-primary-light/40">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rawDados.meses.map((m, i) => (
                                <tr
                                    key={i}
                                    className={`border-b border-primary-light/5 hover:bg-background/50 transition-colors ${i === mesAtual - 1 ? 'bg-accent/5' : ''}`}
                                >
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            {i === mesAtual - 1 && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                                            <span className="font-sans font-medium text-primary">{m.label} {anoSelecionado}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right font-mono text-sm text-primary-light/60">{m.ordens}</td>
                                    <td className="px-8 py-4 text-right">
                                        <span className={`font-mono font-bold text-sm ${m.valor > 0 ? 'text-primary' : 'text-primary-light/30'}`}>
                                            {m.valor > 0 ? `R$ ${m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        {i < mesAtual ? (
                                            <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest">
                                                Fechado
                                            </span>
                                        ) : i === mesAtual - 1 + 1 ? (
                                            <span className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest animate-pulse">
                                                Em Aberto
                                            </span>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </Layout>
    );
};

export default Historico;
