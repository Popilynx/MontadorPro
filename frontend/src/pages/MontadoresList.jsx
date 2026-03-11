import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import {
    Search,
    MapPin,
    Star,
    Phone,
    MoreVertical,
    UserPlus,
    ShieldCheck,
    Circle,
    Loader2,
    Edit,
    User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditMontadorModal from '../components/EditMontadorModal';

const MontadoresList = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('montador') || '{}');
    const isAdmin = currentUser.role === 'admin';

    const [montadores, setMontadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMontador, setSelectedMontador] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchMontadores = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/montadores');
            setMontadores(response.data);
        } catch (err) {
            console.error('Erro ao buscar montadores:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMontadores();
    }, []);

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'online': return <Circle size={10} className="fill-emerald-500 text-emerald-500" />;
            case 'disponivel': return <Circle size={10} className="fill-emerald-500 text-emerald-500" />;
            case 'ocupado': return <Circle size={10} className="fill-amber-500 text-amber-500" />;
            default: return <Circle size={10} className="fill-slate-400 text-slate-400" />;
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
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/montadores/novo')}
                            className="btn-primary flex items-center justify-center gap-2 py-3.5"
                        >
                            <UserPlus size={18} />
                            Convidar Montador
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-accent mb-4" size={40} />
                        <p className="text-primary-light/50 font-mono tracking-widest uppercase text-sm">Escaneando profissionais...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-4 md:p-10 shadow-2xl shadow-primary/5 border border-primary-light/5">
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                            <div className="inline-block min-w-full align-middle px-4 md:px-0">
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
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform overflow-hidden shadow-lg">
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
                                                        <div className="flex items-center gap-2 text-primary-light/60">
                                                            <MapPin size={14} className="text-accent" />
                                                            <span className="text-sm font-medium">{m.cidade_display || m.cidade || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(m.status)}
                                                            <span className="text-sm font-mono text-primary-light/70 capitalize">{m.status || 'Offline'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {isAdmin && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setSelectedMontador(m);
                                                                        setIsEditModalOpen(true);
                                                                    }}
                                                                    className="p-2 text-primary-light/40 hover:bg-background rounded-xl transition-colors hover:text-accent"
                                                                    title="Editar Montador"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => navigate(`/montadores/${m.id}`)}
                                                                className="text-accent hover:text-accent-hover text-xs font-mono tracking-widest uppercase px-3 py-2 rounded-xl transition-colors hover:bg-accent/5"
                                                            >
                                                                Dossier
                                                            </button>
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
            </div>
        </Layout>
    );
};

export default MontadoresList;
