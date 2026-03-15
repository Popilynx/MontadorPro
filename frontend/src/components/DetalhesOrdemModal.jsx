import React, { useState, useEffect, useRef } from 'react';
import { 
    X, MapPin, CheckCircle, Clock, UserCheck, AlertCircle, 
    Camera, Upload, Trash2, Star, Package, CheckCircle2, 
    Calendar, User, FileText, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const STATUS_LABELS = {
    PENDENTE: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    AGENDADA: { label: 'Agendada', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
    DISPONIVEL: { label: 'Disponivel', color: 'bg-primary-light/10 text-primary border-primary-light/20' },
    CONVITE_ENVIADO: { label: 'Convite Enviado', color: 'bg-accent/10 text-accent border-accent/20' },
    ACEITA: { label: 'Aceita', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    CONCLUIDA: { label: 'Concluida', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    CANCELADA: { label: 'Cancelada', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

const PhotoGrid = ({ fotos, onAdd, onRemove }) => {
    const inputRef = useRef(null);

    const handleFiles = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (evt) => onAdd({ id: Date.now() + Math.random(), url: evt.target.result, file });
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-sans font-bold text-primary tracking-tight">Fotos do Movel Montado</h3>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-primary-light/40">Minimo de 4 fotos obrigatorias</p>
                </div>
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={fotos.length >= 10}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-primary font-mono font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all"
                >
                    <Camera size={14} /> Adicionar
                </button>
                <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFiles} />
            </div>

            {fotos.length === 0 ? (
                <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-primary-light/10 rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all group">
                    <Upload size={24} className="text-primary-light/20 group-hover:text-accent" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary-light/40">Enviar fotos do movel montado</span>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {fotos.map(f => (
                        <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden border border-primary-light/10 shadow-sm group">
                            <img src={f.url} alt="Envio" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button onClick={() => onRemove(f.id)} className="p-1.5 bg-red-500/80 rounded-lg text-white"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                    {fotos.length < 10 && (
                        <button onClick={() => inputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-primary-light/10 flex flex-col items-center justify-center gap-1 hover:border-accent/40 hover:bg-accent/5 transition-all text-primary-light/20 hover:text-accent">
                            <Camera size={16} />
                            <span className="font-mono text-[8px] uppercase">Add</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const DetalhesOrdemModal = ({ isOpen, onClose, ordem, onRefresh }) => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('montador') || '{}');
    const isAdmin = currentUser?.role === 'admin';

    const [montadores, setMontadores] = useState([]);
    const [selectedMontadorId, setSelectedMontadorId] = useState('');
    const [newStatus, setNewStatus] = useState('');

    const [checkedIn, setCheckedIn] = useState(false);
    const [performingCheckIn, setPerformingCheckIn] = useState(false);
    const [fotos, setFotos] = useState([]);
    const [nota, setNota] = useState(0);
    const [observacao, setObservacao] = useState('');
    const [finalizing, setFinalizing] = useState(false);

    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [adminNota, setAdminNota] = useState(0);
    const [adminComentario, setAdminComentario] = useState('');
    const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isAdmin) {
                api.get('/admin/montadores?view=list').then(res => setMontadores(res.data || [])).catch(() => {});
            }
            if (ordem) {
                setSelectedMontadorId(ordem.montadorId || ordem.montador_id || '');
                setNewStatus((ordem.status || '').toUpperCase());
                setMsg(null);
                setAdminNota(0);
                setAdminComentario('');

                const isMyOrder = Number(ordem.montadorId) === Number(currentUser.id) || Number(ordem.montador_id) === Number(currentUser.id);
                const sUpper = (ordem.status || '').toUpperCase();
                if (isMyOrder && (sUpper === 'ACEITA' || sUpper === 'EM_ANDAMENTO' || sUpper === 'AGENDADA')) {
                    api.get('/execucao/ativa').then(res => {
                        if (res.data && Number(res.data.ordemId) === Number(ordem.id)) {
                            setCheckedIn(!!res.data.chegadaAt);
                            if (res.data.fotos) {
                                const base = api.defaults.baseURL.split('/api/v1')[0];
                                setFotos(res.data.fotos.map(f => ({ 
                                    ...f, 
                                    url: f.url.startsWith('http') ? f.url : `${base}${f.url}` 
                                })));
                            }
                        }
                    }).catch(() => {});
                }
            }
        }
    }, [isOpen, ordem, isAdmin, currentUser.id]);

    if (!isOpen || !ordem) return null;

    const isAssignedToMe = Number(ordem.montadorId) === Number(currentUser.id) || Number(ordem.montador_id) === Number(currentUser.id);
    const statusUpper = (ordem.status || '').toUpperCase();
    const clienteNome = ordem.cliente_nome || ordem.clienteNome || ordem.cliente?.nome;
    const clienteContato = ordem.cliente_contato || ordem.clienteContato || ordem.cliente?.telefone;
    const endereco = ordem.endereco_instalacao || ordem.endereco;
    const dataAgendada = ordem.data_agendamento || ordem.dataInstalacao;
    const dataAgendadaLabel = dataAgendada ? new Date(dataAgendada).toLocaleDateString('pt-BR') : 'Nao informada';
    const clienteZapLink = clienteContato ? `https://wa.me/55${clienteContato.replace(/\D/g, '')}` : null;
    const valorBruto = Number(ordem.valorBruto || ordem.valor || 0);
    const valorLiquido = valorBruto - (ordem.comissao || 80);

    const handleVerRelatorio = () => {
        navigate(`/convite/${ordem.id}`);
        onClose();
    };

    const handleCheckIn = async () => {
        setPerformingCheckIn(true);
        try {
            if (!navigator.geolocation) throw new Error('GPS nao disponivel');
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    await api.post('/execucao/chegada', {
                        osId: ordem.id,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                    setCheckedIn(true);
                    setMsg({ type: 'success', text: 'Presenca confirmada! Pode iniciar a montagem.' });
                } catch (err) {
                    setMsg({ type: 'error', text: err.response?.data?.error || 'Erro ao validar localizacao.' });
                } finally {
                    setPerformingCheckIn(false);
                }
            }, () => {
                setMsg({ type: 'error', text: 'Permita o acesso ao GPS para fazer check-in.' });
                setPerformingCheckIn(false);
            });
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
            setPerformingCheckIn(false);
        }
    };

    const addFoto = async (foto) => {
        try {
            const formData = new FormData();
            formData.append('fotos', foto.file);
            await api.post(`/execucao/${ordem.id}/fotos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFotos(prev => [...prev, foto]);
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao enviar foto.' });
        }
    };

    const removeFoto = (id) => setFotos(prev => prev.filter(f => f.id !== id));

    const handleFinalizar = async () => {
        if (fotos.length < 4) {
             setMsg({ type: 'error', text: 'Adicione pelo menos 4 fotos para finalizar.' });
             return;
        }
        setFinalizing(true);
        try {
            await api.post(`/execucao/${ordem.id}/finalizar`, { nota, observacao });
            setMsg({ type: 'success', text: 'OS Finalizada com sucesso!' });
            setTimeout(() => {
                onClose();
                if (onRefresh) onRefresh();
            }, 1500);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Erro ao finalizar.' });
        } finally {
            setFinalizing(false);
        }
    };

    const handleSalvarVinculo = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const payload = { status: newStatus, montador_id: Number(selectedMontadorId) };
            await api.patch(`/os/${ordem.id}/status`, payload);
            setMsg({ type: 'success', text: 'OS atualizada com sucesso!' });
            if (onRefresh) onRefresh();
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao atualizar.' });
        } finally {
            setSaving(false);
        }
    };

    const handleConcluirAdmin = async () => {
        if (!confirm('Confirmar conclusao desta OS?')) return;
        try {
            await api.post('/admin/concluir-os', { os_id: ordem.id });
            setMsg({ type: 'success', text: 'OS concluida com sucesso!' });
            if (onRefresh) onRefresh();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.erro || err.response?.data?.error || 'Erro ao concluir OS.' });
        }
    };

    const StatusBadge = ({ status }) => {
        const s = STATUS_LABELS[status] || STATUS_LABELS.PENDENTE;
        return (
            <div className={`inline-flex items-center gap-2 font-bold px-4 py-2 rounded-full text-[10px] font-mono tracking-wider border uppercase ${s.color}`}>
                <CheckCircle size={14} />
                {s.label}
            </div>
        );
    };

    const handleSalvarAvaliacao = async () => {
        const montadorIdFinal = Number(ordem.montadorId || ordem.montador_id || selectedMontadorId);
        if (!montadorIdFinal) {
            setMsg({ type: 'error', text: 'Defina um montador responsavel antes de avaliar.' });
            return;
        }
        if (!adminNota || adminNota < 1) {
            setMsg({ type: 'error', text: 'Selecione uma nota de 1 a 5.' });
            return;
        }

        setSalvandoAvaliacao(true);
        setMsg(null);
        try {
            await api.post('/admin/avaliacoes', {
                ordemId: ordem.id,
                montadorId: montadorIdFinal,
                nota: adminNota,
                comentario: adminComentario
            });
            setMsg({ type: 'success', text: 'Avaliacao registrada com sucesso.' });
            if (onRefresh) onRefresh();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Erro ao registrar avaliacao.' });
        } finally {
            setSalvandoAvaliacao(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm transition-all duration-300">
            <div
                className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-primary/10 animate-[fadeInUp_0.3s_ease-out] flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-primary p-6 md:p-8 flex justify-between items-start relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542621323-22ea67fe99f9?q=80&w=2070&auto=format&fit=crop')] opacity-10 mix-blend-luminosity object-cover"></div>
                    <div className="relative z-10">
                        <span className="font-mono text-accent text-xs tracking-widest uppercase mb-2 block animate-pulse">Gestao de Servico</span>
                        <h2 className="text-3xl font-sans font-bold text-background tracking-tight">OS #{ordem.id.toString().padStart(4, '0')}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-6 bg-background max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-primary/10">
                            <p className="text-[10px] font-mono tracking-widest uppercase text-primary-light/50 mb-2">Status</p>
                            <StatusBadge status={statusUpper} />
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-primary/10">
                            <p className="text-[10px] font-mono tracking-widest uppercase text-primary-light/50 mb-2">Cliente / Endereco</p>
                            <p className="font-bold text-primary text-sm truncate">{clienteNome || 'Nao informado'}</p>
                            <p className="text-[10px] text-primary-light/60 truncate">{endereco || 'Nao informado'}</p>
                        </div>
                        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                            <p className="text-[10px] font-mono tracking-widest uppercase text-emerald-600/50 mb-1">Valor do Montador (Liquido)</p>
                            <p className="text-xl font-sans font-black text-emerald-600">R$ {valorLiquido.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <p className="text-[10px] font-mono tracking-widest uppercase text-primary-light/50 mb-1">Valor Total (Bruto)</p>
                            <p className="text-lg font-sans font-bold text-primary">R$ {valorBruto.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl text-primary"><User size={20} /></div>
                                <div>
                                    <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Cliente</p>
                                    <p className="font-bold text-primary text-lg">{clienteNome || 'Nao informado'}</p>
                                    {clienteZapLink && (
                                        <a href={clienteZapLink} target="_blank" rel="noopener noreferrer" className="text-xs font-mono tracking-widest uppercase text-accent hover:underline">
                                            {clienteContato}
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl text-primary"><FileText size={20} /></div>
                                <div>
                                    <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Descricao / Observacoes</p>
                                    <p className="text-primary-light/80 text-sm leading-relaxed">{ordem.descricao || ordem.observacoes || ordem.observacao || 'Nenhuma descricao detalhada fornecida.'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl text-primary"><Calendar size={20} /></div>
                                <div>
                                    <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Data Agendada</p>
                                    <p className="font-bold text-primary text-lg">{dataAgendadaLabel}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl text-primary"><MapPin size={20} /></div>
                                <div>
                                    <p className="text-xs font-mono tracking-widest uppercase text-primary-light/50 mb-1">Endereco de Execucao</p>
                                    <p className="text-primary-light/80 text-sm leading-relaxed">{endereco || 'Nao informado'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isAssignedToMe && (statusUpper === 'ACEITA' || statusUpper === 'EM_ANDAMENTO' || statusUpper === 'AGENDADA') && (
                        <div className="bg-white rounded-3xl border border-accent/20 p-6 md:p-8 space-y-6 shadow-xl shadow-accent/10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20"><Package size={18} className="text-accent" /></div>
                                <div>
                                    <h3 className="font-sans font-bold text-primary text-base">Execucao Premium</h3>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-primary-light/40">Fotos, descricao e avaliacao</p>
                                </div>
                            </div>

                            {!checkedIn ? (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={performingCheckIn}
                                    className="w-full py-4 bg-primary text-background font-mono font-bold uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    {performingCheckIn ? <Clock className="animate-spin" size={16} /> : <MapPin size={16} />}
                                    {performingCheckIn ? 'Validando GPS...' : 'Confirmar Chegada (Check-in)'}
                                </button>
                            ) : (
                                <>
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                        <span className="font-mono text-[10px] uppercase font-bold text-emerald-600">Presenca Validada no Local</span>
                                    </div>
                                    
                                    <PhotoGrid fotos={fotos} onAdd={addFoto} onRemove={removeFoto} />
                                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-primary-light/50">
                                        <span>{fotos.length} de 4 fotos obrigatorias</span>
                                        {fotos.length < 4 ? (
                                            <span className="text-red-400/70">Envie todas para finalizar</span>
                                        ) : (
                                            <span className="text-emerald-600/70">Requisito atendido</span>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-mono text-[10px] uppercase tracking-widest text-primary-light/50 mb-2">Avaliacao do Cliente (1 a 5)</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <button key={s} onClick={() => setNota(s)}><Star size={24} fill={s <= nota ? '#C9A84C' : 'none'} stroke={s <= nota ? '#C9A84C' : '#2A2A35'} /></button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            value={observacao}
                                            onChange={e => setObservacao(e.target.value)}
                                            placeholder="Descricao do servico, itens montados, observacoes do cliente..."
                                            className="w-full bg-background border border-primary-light/10 rounded-2xl p-4 text-sm font-sans resize-none outline-none focus:border-accent"
                                            rows={3}
                                        />
                                    </div>

                                    <button
                                        onClick={handleFinalizar}
                                        disabled={finalizing || fotos.length < 4}
                                        className="w-full py-4 bg-accent text-primary font-mono font-bold uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                                    >
                                        {finalizing ? 'Finalizando...' : <CheckCircle2 size={16} />}
                                        Finalizar Ordem de Servico
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {isAdmin && (
                        <div className="bg-white rounded-2xl border border-accent/20 p-6 space-y-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-accent/10 rounded-xl"><UserCheck size={18} className="text-accent" /></div>
                                <div>
                                    <h4 className="font-sans font-bold text-primary text-sm">Administracao: Gestao de Vinculo</h4>
                                    <p className="text-[10px] font-mono text-primary-light/40 uppercase tracking-widest">Operacao Admin</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-mono font-bold text-primary-light/50 uppercase tracking-widest ml-1">Montador Responsavel</label>
                                    <div className="relative">
                                        <select
                                            value={selectedMontadorId}
                                            onChange={e => setSelectedMontadorId(e.target.value)}
                                            className="w-full appearance-none bg-background border border-primary-light/10 rounded-xl px-4 py-3 pr-10 text-sm text-primary font-mono outline-none focus:border-accent"
                                        >
                                            <option value="">Nenhum</option>
                                            {montadores.map(m => (
                                                <option key={m.id} value={m.id}>{m.nome} ({m.telefone})</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-light/40 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-mono font-bold text-primary-light/50 uppercase tracking-widest ml-1">Alterar Status</label>
                                    <div className="relative">
                                        <select
                                            value={newStatus}
                                            onChange={e => setNewStatus(e.target.value)}
                                            className="w-full appearance-none bg-background border border-primary-light/10 rounded-xl px-4 py-3 pr-10 text-sm text-primary font-mono outline-none focus:border-accent"
                                        >
                                            {Object.entries(STATUS_LABELS).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-light/40 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSalvarVinculo}
                                disabled={saving}
                                className={`w-full py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${saving ? 'bg-primary/20 cursor-not-allowed text-primary/40' : 'bg-accent text-primary hover:bg-accent/80 shadow-lg shadow-accent/20'}`}
                            >
                                {saving ? 'Salvando...' : 'Atualizar OS (Admin)'}
                            </button>
                            {statusUpper !== 'CONCLUIDA' && (
                                <button onClick={handleConcluirAdmin} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest">
                                    Concluir OS
                                </button>
                            )}
                        </div>
                    )}

                    {isAdmin && (
                        <div className="bg-white rounded-2xl border border-primary-light/10 p-6 space-y-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-xl"><Star size={18} className="text-accent" /></div>
                                <div>
                                    <h4 className="font-sans font-bold text-primary text-sm">Avaliacao do Cliente</h4>
                                    <p className="text-[10px] font-mono text-primary-light/40 uppercase tracking-widest">Registro pos-vistoria</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setAdminNota(s)}
                                        className="transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <Star size={22} fill={s <= adminNota ? '#C9A84C' : 'none'} stroke={s <= adminNota ? '#C9A84C' : '#2A2A35'} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={adminComentario}
                                onChange={e => setAdminComentario(e.target.value)}
                                placeholder="Descricao do cliente, pontos positivos e ajustes..."
                                className="w-full bg-background border border-primary-light/10 rounded-2xl p-4 text-sm font-sans resize-none outline-none focus:border-accent"
                                rows={3}
                            />

                            <button
                                onClick={handleSalvarAvaliacao}
                                disabled={salvandoAvaliacao}
                                className={`w-full py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    salvandoAvaliacao ? 'bg-primary/20 cursor-not-allowed text-primary/40' : 'bg-primary text-background hover:bg-primary/90 shadow-lg shadow-primary/20'
                                }`}
                            >
                                {salvandoAvaliacao ? 'Salvando...' : 'Registrar Avaliacao'}
                            </button>
                        </div>
                    )}

                    {msg && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest border animate-pulse ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            <AlertCircle size={14} />
                            {msg.text}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-primary/5 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 font-mono text-xs uppercase font-bold text-primary-light tracking-widest">Fechar</button>
                    {!isAdmin && (
                        <button onClick={handleVerRelatorio} className="btn-primary text-xs px-6 py-3">Ver Relatorio Completo</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetalhesOrdemModal;
