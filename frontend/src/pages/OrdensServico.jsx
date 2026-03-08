import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
    Filter,
    Plus,
    Search,
    MoreVertical,
    ExternalLink,
    Clock
} from 'lucide-react';
import NovaOrdemModal from '../components/NovaOrdemModal';
import DetalhesOrdemModal from '../components/DetalhesOrdemModal';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const OrdensServico = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isNovaOrdemOpen, setIsNovaOrdemOpen] = useState(false);
    const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
    const [selectedOrdem, setSelectedOrdem] = useState(null);
    const [ordens, setOrdens] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchOrdens = async () => {
        try {
            setLoading(true);
            const response = await api.get('/os');
            setOrdens(response.data.ordens || []);
        } catch (err) {
            console.error('Erro ao buscar ordens:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdens();
    }, []);

    const getStatusBadge = (status) => {
        const styles = {
            CONCLUIDA: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
            ACEITA: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
            CONVITE_ENVIADO: 'bg-accent/10 text-accent border border-accent/20',
            DISPONIVEL: 'bg-primary-light/10 text-primary border border-primary-light/20',
        };
        const currentStyle = styles[status] || 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
        return (
            <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[9px] md:text-xs font-mono font-bold uppercase tracking-widest shadow-inner ${currentStyle}`}>
                {(status || 'DESCONHECIDO').replace('_', ' ')}
            </span>
        );
    };

    const handleVerDetalhes = (os) => {
        setSelectedOrdem(os);
        setIsDetalhesOpen(true);
    };

    const filteredOrdens = ordens.filter(os => 
        os.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.id.toString().includes(searchTerm)
    );

    return (
        <Layout title="Ordens de Serviço">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-primary/5 border border-primary-light/5 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 md:p-8 border-b border-primary-light/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar registros..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/50 border border-primary-light/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-1 focus:ring-accent outline-none font-mono placeholder:text-primary-light/30 shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3.5 border border-primary-light/20 rounded-2xl text-[10px] md:text-xs font-mono uppercase tracking-widest font-bold text-primary-light/70 hover:bg-background transition-all shadow-sm">
                            <Filter size={16} />
                            Filtros
                        </button>
                        <button 
                            onClick={() => setIsNovaOrdemOpen(true)}
                            className="flex-1 lg:flex-none btn-primary flex items-center justify-center gap-2 py-3.5"
                        >
                            <Plus size={18} />
                            Nova Ordem
                        </button>
                    </div>
                </div>

                {/* Table container with horizontal scroll for mobile */}
                <div className="overflow-x-auto -mx-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background text-primary-light/50 text-[10px] font-mono font-bold uppercase tracking-widest border-b border-primary-light/10">
                                <th className="px-4 md:px-8 py-4 md:py-5">Status</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 hidden sm:table-cell">OS</th>
                                <th className="px-4 md:px-8 py-4 md:py-5">Cliente</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 hidden md:table-cell">Agendamento</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-right">Valor</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-light/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center opacity-50 font-mono text-sm tracking-widest animate-pulse">
                                        Carregando ordens de serviço...
                                    </td>
                                </tr>
                            ) : filteredOrdens.length > 0 ? (
                                filteredOrdens.map((os) => (
                                    <tr key={os.id} className="hover:bg-background/50 transition-colors group">
                                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                                            {getStatusBadge(os.status)}
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-6 hidden sm:table-cell">
                                            <span className="font-mono font-bold text-primary text-sm">#{os.id.toString().padStart(4, '0')}</span>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-6">
                                            <div className="flex flex-col gap-0.5 min-w-[120px]">
                                                <span className="font-sans font-bold text-primary tracking-tight text-sm md:text-base leading-tight">{os.cliente_nome}</span>
                                                <span className="font-mono text-[9px] md:text-[10px] tracking-widest uppercase text-primary-light/50 truncate max-w-[150px] md:max-w-[250px]">{os.endereco}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm text-primary-light/70 font-mono hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-primary-light/40" />
                                                {os.data_agendamento ? new Date(os.data_agendamento).toLocaleDateString() : '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-6 text-right whitespace-nowrap">
                                            <span className="font-sans font-bold text-primary text-sm md:text-base italic">R$ {os.valor}</span>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-6 text-center">
                                            <div className="flex items-center justify-center gap-1 md:gap-3">
                                                <button 
                                                    onClick={() => navigate(`/convite/${os.id}`)}
                                                    className="p-2 text-primary-light/40 hover:text-accent hover:bg-accent/10 rounded-xl transition-all" 
                                                    title="Ver Relatório"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleVerDetalhes(os)}
                                                    className="p-2 text-primary-light/40 hover:text-primary hover:bg-background rounded-xl transition-all"
                                                    title="Mais Opções"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center opacity-50 font-mono text-sm tracking-widest">
                                        Nenhuma ordem encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer summary */}
                <div className="p-4 md:p-8 border-t border-primary-light/10 text-center bg-white">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-primary-light/40">Total de {filteredOrdens.length} registros</p>
                </div>
            </div>

            {/* Modals */}
            <NovaOrdemModal 
                isOpen={isNovaOrdemOpen} 
                onClose={() => {
                    setIsNovaOrdemOpen(false);
                    fetchOrdens();
                }} 
            />
            
            <DetalhesOrdemModal 
                isOpen={isDetalhesOpen} 
                onClose={() => setIsDetalhesOpen(false)} 
                ordem={selectedOrdem}
                onRefresh={fetchOrdens}
            />
        </Layout>
    );
};

export default OrdensServico;
