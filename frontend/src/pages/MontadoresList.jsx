import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import { readCache, writeCache } from '../utils/cache';
import {
    Search,
    MapPin,
    Star,
    Phone,
    ShieldCheck,
    Circle,
    Loader2,
    Edit,
    User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditMontadorModal from '../components/EditMontadorModal';
import DocumentosModal from '../components/DocumentosModal';

const MontadoresList = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('montador') || '{}');
    const isAdmin = currentUser.role === 'admin';

    const initialCache = readCache('montadores_todos_v1', null);
    const [montadores, setMontadores] = useState(() => initialCache || []);
    const [loading, setLoading] = useState(() => !initialCache);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMontador, setSelectedMontador] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDocsOpen, setIsDocsOpen] = useState(false);
    const [docsMontador, setDocsMontador] = useState(null);
    const [statusFilter, setStatusFilter] = useState('todos');

    const fetchMontadores = async () => {
        try {
            const cacheKey = `montadores_${statusFilter}_v1`;
            const cached = readCache(cacheKey, null);
            if (cached) {
                setMontadores(cached);
                setLoading(false);
            } else {
                setLoading(true);
            }
            const query = new URLSearchParams();
            if (statusFilter !== 'todos') query.set('status', statusFilter);
            query.set('view', 'list');
            const qs = query.toString();
            const response = await api.get(`/admin/montadores?${qs}`);
            setMontadores(response.data);
            writeCache(cacheKey, response.data || []);
        } catch (err) {
            console.error('Erro ao buscar montadores:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMontadores();
    }, [statusFilter]);

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'online': return <Circle size={10} className="fill-emerald-500 text-emerald-500" />;
            case 'disponivel': return <Circle size={10} className="fill-emerald-500 text-emerald-500" />;
            case 'aprovado': return <Circle size={10} className="fill-emerald-500 text-emerald-500" />;
            case 'ocupado': return <Circle size={10} className="fill-amber-500 text-amber-500" />;
            case 'pendente': return <Circle size={10} className="fill-amber-500 text-amber-500" />;
            case 'rejeitado': return <Circle size={10} className="fill-red-500 text-red-500" />;
            default: return <Circle size={10} className="fill-slate-400 text-slate-400" />;
        }
    };

    const handleAprovar = async (id) => {
        if (!confirm('Aprovar este profissional?')) return;
        try {
            await api.post('/admin/aprovar-montador', { montador_id: id });
            fetchMontadores();
        } catch (err) {
            alert('Erro ao aprovar montador.');
        }
    };

    const handleRejeitar = async (id) => {
        const motivo = prompt('Motivo da rejeicao:');
        if (motivo === null) return;
        try {
            await api.post('/admin/rejeitar-montador', { montador_id: id, motivo });
            fetchMontadores();
        } catch (err) {
            alert('Erro ao rejeitar montador.');
        }
    };

    const filteredMontadores = montadores.filter(m =>
        m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.cidade_display || m.cidade || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout title="Equipe de Montadores">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou cidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/50 border border-primary-light/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-1 focus:ring-accent focus:border-accent transition-all font-mono placeholder:text-primary-light/30 shadow-sm outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {['todos', 'pendente', 'aprovado', 'rejeitado', 'disponivel', 'indisponivel'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border transition-all ${
                                    statusFilter === s
                                        ? 'bg-accent/20 text-accent border-accent/40'
                                        : 'text-primary-light/40 border-primary-light/10 hover:border-accent/20'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-accent mb-4" size={40} />
                        <p className="text-primary-light/50 font-mono tracking-widest uppercase text-sm">Escaneando profissionais...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-3 md:p-10 shadow-2xl shadow-primary/5 border border-primary-light/5">
                        <div className="overflow-x-auto">
                            <div className="inline-block min-w-full align-middle">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="text-left border-b border-primary-light/10">
                                            <th className="pb-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-light/40">Profissional</th>
                                            <th className="pb-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-light/40 hidden sm:table-cell">Região</th>
                                            <th className="pb-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-light/40">Status</th>
                                            <th className="pb-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-light/40 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary-light/5">
                                        {filteredMontadores.length > 0 ? (
                                            filteredMontadores.map((m) => (
                                                <tr key={m.id} className="group hover:bg-background/50 transition-colors">
                                                    <td className="py-4 md:py-6">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="w-9 h-9 md:w-12 md:h-12 bg-primary rounded-xl flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform overflow-hidden shadow-lg">
                                                                {m.foto_url ? (
                                                                    <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User size={20} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-sans font-bold text-primary text-sm md:text-base">{m.nome}</p>
                                                                <p className="text-xs font-mono text-primary-light/40 uppercase tracking-widest mt-1">{m.telefone}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 hidden sm:table-cell">
                                                        <div className="flex flex-col gap-1 text-primary-light/60">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin size={14} className="text-accent" />
                                                                <span className="text-sm font-medium">{m.cidade_display || m.cidade || '—'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Star size={12} className="text-accent/50" />
                                                                <span className="text-xs uppercase tracking-widest font-mono text-primary-light/50">{m.nivelExperiencia || 'Não Informado'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 md:py-6">
                                                        <div className="flex items-center gap-1.5 md:gap-2">
                                                            {getStatusIcon(m.status)}
                                                            <span className="text-[12px] md:text-sm font-mono text-primary-light/70 capitalize">{m.status || 'Offline'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 md:py-6 text-right">
                                                        <div className="flex items-center justify-end gap-1 md:gap-2">
                                                            {isAdmin && m.telefone && (
                                                                <a 
                                                                    href={`https://wa.me/55${m.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá *${m.nome?.split(' ')[0]}*!\nSeu cadastro foi *APROVADO* na MontadorPro! 🔧✅\n\nAcesse o Painel do Montador pelo link abaixo:\n${window.location.origin}`)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 md:p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors"
                                                                    title="Avisar Aprovação via WhatsApp"
                                                                >
                                                                    <Phone className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                                                                </a>
                                                            )}
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => {
                                                                        setDocsMontador(m);
                                                                        setIsDocsOpen(true);
                                                                    }}
                                                                    className="p-1.5 md:p-2 text-primary-light/40 hover:bg-background rounded-xl transition-colors hover:text-accent"
                                                                    title="Ver documentos"
                                                                >
                                                                    <ShieldCheck className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                                                                </button>
                                                            )}
                                                            {isAdmin && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setSelectedMontador(m);
                                                                        setIsEditModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 md:p-2 text-primary-light/40 hover:bg-background rounded-xl transition-colors hover:text-accent"
                                                                    title="Editar Montador"
                                                                >
                                                                    <Edit className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => navigate(`/montadores/${m.id}`)}
                                                                className="text-accent hover:text-accent-hover text-[10px] md:text-xs font-mono tracking-widest uppercase px-2 md:px-3 py-2 rounded-xl transition-colors hover:bg-accent/5"
                                                            >
                                                                Dossier
                                                            </button>
                                                            {isAdmin && m.status === 'pendente' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleAprovar(m.id)}
                                                                        className="text-emerald-500 hover:text-emerald-600 text-[10px] md:text-xs font-mono tracking-widest uppercase px-2 md:px-3 py-2 rounded-xl transition-colors hover:bg-emerald-500/10"
                                                                    >
                                                                        Aprovar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejeitar(m.id)}
                                                                        className="text-red-400 hover:text-red-500 text-[10px] md:text-xs font-mono tracking-widest uppercase px-2 md:px-3 py-2 rounded-xl transition-colors hover:bg-red-500/10"
                                                                    >
                                                                        Rejeitar
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-20 text-center opacity-50 font-mono text-sm tracking-widest">
                                                    Nenhum profissional encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {isEditModalOpen && selectedMontador && (
                    <EditMontadorModal 
                        montador={selectedMontador} 
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedMontador(null);
                        }} 
                        onUpdate={fetchMontadores}
                    />
                )}
                {isDocsOpen && docsMontador && (
                    <DocumentosModal
                        montador={docsMontador}
                        onClose={() => {
                            setIsDocsOpen(false);
                            setDocsMontador(null);
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

export default MontadoresList;
