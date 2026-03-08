import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, FileText, CheckCircle, Clock, UserCheck, ChevronDown, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const STATUS_LABELS = {
    DISPONIVEL: { label: 'Disponível', color: 'bg-primary-light/10 text-primary border-primary-light/20' },
    CONVITE_ENVIADO: { label: 'Convite Enviado', color: 'bg-accent/10 text-accent border-accent/20' },
    ACEITA: { label: 'Aceita', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    CONCLUIDA: { label: 'Concluída', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    CANCELADA: { label: 'Cancelada', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

const DetalhesOrdemModal = ({ isOpen, onClose, ordem, onRefresh }) => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('montador') || '{}');
    const isAdmin = currentUser?.role === 'admin';

    const [montadores, setMontadores] = useState([]);
    const [selectedMontadorId, setSelectedMontadorId] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (isOpen && isAdmin) {
            api.get('/montadores').then(res => setMontadores(res.data || [])).catch(() => {});
        }
        if (ordem) {
            setSelectedMontadorId(ordem.montador_id || '');
            setNewStatus(ordem.status || '');
            setMsg(null);
        }
    }, [isOpen, ordem]);

    if (!isOpen || !ordem) return null;

    const handleVerRelatorio = () => {
        navigate(`/convite/${ordem.id}`);
        onClose();
    };

    const handleSalvarVinculo = async () => {
        if (!selectedMontadorId) {
            setMsg({ type: 'error', text: 'Selecione um montador para vincular.' });
            return;
        }
        setSaving(true);
        setMsg(null);
        try {
            const payload = { status: newStatus, montador_id: Number(selectedMontadorId) };
            await api.patch(`/os/${ordem.id}/status`, payload);
            setMsg({ type: 'success', text: `OS #${ordem.id.toString().padStart(4,'0')} atualizada com sucesso!` });
            if (onRefresh) onRefresh();
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao atualizar. Tente novamente.' });
        } finally {
            setSaving(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const s = STATUS_LABELS[status] || STATUS_LABELS.DISPONIVEL;
        return (
            <div className={`inline-flex items-center gap-2 font-bold px-4 py-2 rounded-full text-sm font-mono tracking-wider border ${s.color}`}>
                <CheckCircle size={16} />
                {s.label}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm transition-all duration-300">
            <div
                className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-primary/10 animate-[fadeInUp_0.3s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header do Modal */}
                <div className="bg-primary p-6 md:p-8 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542621323-22ea67fe99f9?q=80&w=2070&auto=format&fit=crop')] opacity-10 mix-blend-luminosity object-cover"></div>
                    <div className="relative z-10">
                        <span className="font-mono text-accent text-xs tracking-widest uppercase mb-2 block animate-pulse">Detalhes da Ordem</span>
                        <h2 className="text-3xl font-sans font-bold text-background tracking-tight">OS #{ordem.id.toString().padStart(4, '0')}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Corpo do Modal */}
                <div className="p-6 md:p-8 space-y-6 bg-background max-h-[70vh] overflow-y-auto">
                    {/* Status Badge e Valor */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-5 bg-white rounded-2xl border border-primary/5 shadow-sm">
                        <div>
                            <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Status Atual</p>
                            <StatusBadge status={ordem.status} />
                        </div>
                        <div className="sm:text-right">
                            <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Valor do Serviço</p>
                            <p className="text-2xl font-bold text-primary font-sans flex items-center sm:justify-end gap-1">
                                <span className="text-accent">R$</span> {Number(ordem.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Informações Principais Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl text-primary"><User size={20} /></div>
                                <div>
                                    <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Cliente</p>
                                    <p className="font-bold text-primary text-lg">{ordem.cliente_nome}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl text-primary"><FileText size={20} /></div>
                                <div>
                                    <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Descrição / Observações</p>
                                    <p className="text-primary-light/80 text-sm leading-relaxed">{ordem.descricao || 'Nenhuma descrição detalhada fornecida.'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl text-primary"><Calendar size={20} /></div>
                                <div>
                                    <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Data Agendada</p>
                                    <p className="font-bold text-primary text-lg">{ordem.data_agendamento ? new Date(ordem.data_agendamento).toLocaleDateString() : 'Não definida'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl text-primary"><MapPin size={20} /></div>
                                <div>
                                    <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Endereço de Execução</p>
                                    <p className="text-primary-light/80 text-sm leading-relaxed">{ordem.endereco}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Painel Admin: Vínculo com Montador ── */}
                    {isAdmin && (
                        <div className="bg-white rounded-2xl border border-accent/20 p-6 space-y-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-accent/10 rounded-xl"><UserCheck size={18} className="text-accent" /></div>
                                <div>
                                    <h4 className="font-sans font-bold text-primary text-sm">Vincular Montador Responsável</h4>
                                    <p className="text-[10px] font-mono text-primary-light/40 uppercase tracking-widest">Operação Admin — Atualiza métricas individuais</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Seletor de Montador */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono font-bold text-primary-light/50 uppercase tracking-widest ml-1">Montador</label>
                                    <div className="relative">
                                        <select
                                            value={selectedMontadorId}
                                            onChange={e => setSelectedMontadorId(e.target.value)}
                                            className="w-full appearance-none bg-background border border-primary-light/10 rounded-xl px-4 py-3 pr-10 text-sm text-primary font-mono focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                                        >
                                            <option value="">Selecionar montador...</option>
                                            {montadores.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.nome} — {m.cidade || 'Sem cidade'}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-light/40 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Seletor de Status */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono font-bold text-primary-light/50 uppercase tracking-widest ml-1">Novo Status</label>
                                    <div className="relative">
                                        <select
                                            value={newStatus}
                                            onChange={e => setNewStatus(e.target.value)}
                                            className="w-full appearance-none bg-background border border-primary-light/10 rounded-xl px-4 py-3 pr-10 text-sm text-primary font-mono focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                                        >
                                            {Object.entries(STATUS_LABELS).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-light/40 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Feedback */}
                            {msg && (
                                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-mono font-bold ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    <AlertCircle size={14} />
                                    {msg.text}
                                </div>
                            )}

                            <button
                                onClick={handleSalvarVinculo}
                                disabled={saving}
                                className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition-all ${saving ? 'bg-primary/20 cursor-not-allowed text-primary/40' : 'bg-accent text-primary hover:bg-accent/80 shadow-lg shadow-accent/20'}`}
                            >
                                {saving ? 'Salvando...' : '✓ Salvar Vínculo & Status'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer do Modal */}
                <div className="bg-white p-6 border-t border-primary/5 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 font-mono text-sm tracking-widest uppercase font-bold text-primary-light hover:text-primary transition-colors"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={handleVerRelatorio}
                        className="btn-primary px-8 py-3"
                    >
                        Ver Relatório Completo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalhesOrdemModal;
