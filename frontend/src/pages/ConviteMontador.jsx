import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import {
    MapPin, Clock, Package, CheckCircle2, XCircle,
    Camera, Upload, Trash2, ChevronRight, Star, AlertTriangle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { readCache, writeCache } from '../utils/cache';

// ─── Timer SVG Arc ─────────────────────────────────────────────────────────
const TimerArc = ({ totalSeconds, timeLeft, status }) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const progress = status === 'accepted' ? 1 : timeLeft / totalSeconds;
    const dashOffset = circumference * (1 - progress);
    const percent = Math.round(progress * 100);

    const color = status === 'accepted'
        ? '#10b981' // emerald
        : timeLeft < 60 ? '#ef4444' : '#C9A84C'; // accent/red

    return (
        <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx="70" cy="70" r={radius}
                    fill="none" stroke="rgba(42,42,53,0.3)" strokeWidth="8"
                />
                {/* Progress */}
                <circle
                    cx="70" cy="70" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                {status === 'accepted' ? (
                    <CheckCircle2 size={32} className="text-emerald-500" />
                ) : (
                    <>
                        <span className="font-mono font-bold text-2xl text-primary leading-none">
                            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-primary-light/50 mt-0.5">restante</span>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Photo Upload Grid ──────────────────────────────────────────────────────
const PhotoGrid = ({ fotos, onAdd, onRemove }) => {
    const inputRef = useRef(null);

    const handleFiles = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => onAdd({ id: Date.now() + Math.random(), url: e.target.result, file });
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-sans font-bold text-primary tracking-tight">Registro Fotográfico</h3>
                    <p className="font-mono text-xs uppercase tracking-widest text-primary-light/40 mt-0.5">
                        {fotos.length} de 10 fotos adicionadas
                    </p>
                </div>
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={fotos.length >= 10}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent text-primary font-mono font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Camera size={16} /> Adicionar
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                />
            </div>

            {fotos.length === 0 ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-primary-light/20 rounded-[2rem] p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all group"
                >
                    <Upload size={32} className="text-primary-light/30 group-hover:text-accent transition-colors" />
                    <span className="font-mono text-xs uppercase tracking-widest text-primary-light/40">
                        Clique para fazer upload das fotos da montagem
                    </span>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {fotos.map(foto => (
                        <div key={foto.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-primary-light/10 shadow-md">
                            <img src={foto.url} alt="Foto da montagem" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => onRemove(foto.id)}
                                    className="p-2 bg-red-500/80 rounded-xl text-white hover:bg-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {fotos.length < 10 && (
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="aspect-square rounded-2xl border-2 border-dashed border-primary-light/20 hover:border-accent/50 hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 group"
                        >
                            <Camera size={20} className="text-primary-light/30 group-hover:text-accent transition-colors" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-primary-light/30">Adicionar</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const ConviteMontador = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [osData, setOsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkedIn, setCheckedIn] = useState(false);
    const [performingCheckIn, setPerformingCheckIn] = useState(false);

    const [status, setStatus] = useState('pending');
    const [timeLeft, setTimeLeft] = useState(1200); // 20 min in seconds
    const [fotos, setFotos] = useState([]);
    const [nota, setNota] = useState(0);
    const [observacao, setObservacao] = useState('');
    const [finalizado, setFinalizado] = useState(false);
    const [osDisponivel, setOsDisponivel] = useState([]);
    const [loadingDisponivel, setLoadingDisponivel] = useState(false);
    const [aceitando, setAceitando] = useState(null);

    const mapStatus = (s) => {
        if (!s) return 'pending';
        const value = s.toString().toLowerCase();
        if (value === 'pendente' || value === 'enviado') return 'pending';
        if (value === 'aceito') return 'accepted';
        if (value === 'expirado') return 'expired';
        if (value === 'recusado') return 'declined';
        return value;
    };

    const applyConviteData = (data) => {
        if (!data) return;
        setOsData(data);
        setStatus(mapStatus(data.status));
        if (data.status === 'pendente' || data.status === 'enviado') {
            const exp = new Date(data.expira_em).getTime();
            const now = new Date().getTime();
            const calcLeft = Math.floor((exp - now) / 1000);
            setTimeLeft(calcLeft > 0 ? calcLeft : 0);
        }
    };

    useEffect(() => {
        if (id) {
            const cached = readCache(`convite_${id}_v1`, null);
            if (cached) {
                applyConviteData(cached);
                setLoading(false);
            }
            fetchOS();
        } else {
            const cachedList = readCache('convites_ativo_v1', null);
            if (cachedList) {
                setOsDisponivel(cachedList);
                setLoading(false);
            }
            fetchOsDisponiveis();
        }
        // eslint-disable-next-line
    }, [id]);

    useEffect(() => {
        let timer;
        if (status === 'pending' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setStatus('expired');
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    const addFoto = (foto) => setFotos(prev => [...prev, foto]);
    const removeFoto = (idToRemove) => setFotos(prev => prev.filter(f => f.id !== idToRemove));

    const handleRecusar = async () => {
        try {
            await api.post(`/public/convites/${id}/recusar`);
            setStatus('declined');
        } catch(err) {
            console.error(err);
        }
    };

    const handleCheckIn = async () => {
        if (!navigator.geolocation) {
            return alert('Geolocalização não suportada no seu navegador.');
        }
        
        setPerformingCheckIn(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                await api.post('/execucao/chegada', { 
                    osId: osData?.os_id || id, 
                    lat: latitude, 
                    lng: longitude 
                });
                setCheckedIn(true);
                alert('Chegada confirmada com sucesso!');
            } catch (err) {
                console.error('Erro no check-in:', err);
                alert(err.response?.data?.error || 'Erro ao confirmar chegada.');
            } finally {
                setPerformingCheckIn(false);
            }
        }, (err) => {
            alert('Erro ao obter localização GPS.');
            setPerformingCheckIn(false);
        });
    };


    const fetchOS = async () => {
        try {
            setLoading(true);
            
            // 1. Busca API Pública
            const response = await api.get(`/public/convites/${id}/detalhes`);
            applyConviteData(response.data);
            writeCache(`convite_${id}_v1`, response.data);

            // 3. Verifica se tem execução ativa se já tiver logado e aceito
            const localUser = localStorage.getItem('accessToken');
            if (localUser && response.data.status === 'aceito') {
                try {
                    const resExec = await api.get('/execucao/ativa');
                    if (resExec.data && resExec.data.ordemId === response.data.os_id) {
                        setCheckedIn(!!resExec.data.chegadaAt);
                        if (resExec.data.status === 'concluida') setFinalizado(true);
                    }
                } catch(e) {}
            }
            
        } catch (err) {
            console.error('Erro ao buscar OS:', err);
            if (err.response?.status === 400 && err.response?.data?.error?.includes('expirou')) {
                 setStatus('expired');
            } else {
                 setOsData(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchOsDisponiveis = async () => {
        try {
            setLoadingDisponivel(true);
            // v1: Busca o convite ativo atual do montador
            const response = await api.get('/convites/ativo');
            const list = response.data || [];
            setOsDisponivel(list);
            writeCache('convites_ativo_v1', list);
        } catch (err) {
            console.error('Erro ao buscar convites disponíveis:', err);
        } finally {
            setLoadingDisponivel(false);
            setLoading(false);
        }
    };

    const handleFinalizar = async () => {
        if (fotos.length < 4) return alert('O sistema exige no mínimo 4 fotos para finalizar o serviço.');
        try {
            setLoading(true);
            
            // 1. Enviar fotos via /execucao/:id/fotos
            const formData = new FormData();
            fotos.forEach(f => {
                if (f.file) formData.append('fotos', f.file);
            });
            await api.post(`/execucao/${osData?.os_id || id}/fotos`, formData);

            // 2. Finalizar serviço via /execucao/:id/finalizar
            await api.post(`/execucao/${osData?.os_id || id}/finalizar`);

            setFinalizado(true);
        } catch (err) {
            console.error('Erro ao finalizar OS:', err);
            alert(err.response?.data?.error || 'Erro ao finalizar. Verifique as fotos (mínimo 4).');
        } finally {
            setLoading(false);
        }
    };

    const handleAceitar = async () => {
        try {
            await api.post(`/public/convites/${id}/aceitar`);
            setStatus('accepted');
            fetchOS(); // Atualizar dados para pegar infos finalizadas
        } catch (err) {
            console.error('Erro ao aceitar OS:', err);
            const msg = err.response?.data?.error || 'Erro ao aceitar serviço.';
            if (msg.includes('excedido') || msg.includes('processado')) setStatus('expired');
            alert(msg);
        }
    };


    if (loading) {
        return (
            <Layout title="Carregando...">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="font-mono text-sm animate-pulse">Buscando dados da ordem de serviço...</p>
                </div>
            </Layout>
        );
    }

    if (!id) {
        // ── Tela: Lista de OS Disponíveis (Montador sem convite ativo) ──
        return (
            <Layout title="Ordens Disponíveis">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-drama text-3xl font-bold text-primary">Ordens <span className="text-accent italic">Disponíveis</span></h1>
                            <p className="font-mono text-xs uppercase tracking-widest text-primary-light/40 mt-1">Serviços aguardando um montador Pro</p>
                        </div>
                        <button onClick={fetchOsDisponiveis} className="flex items-center gap-2 px-5 py-2.5 border border-primary-light/20 rounded-2xl text-xs font-mono uppercase tracking-widest font-bold text-primary-light/70 hover:border-accent/30 hover:text-accent transition-all">
                            ↻ Atualizar
                        </button>
                    </div>

                    {loadingDisponivel ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : osDisponivel.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border border-primary-light/10 shadow-xl p-16 flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center">
                                <Package size={28} className="text-accent" />
                            </div>
                            <h3 className="font-drama font-bold text-xl text-primary">Sem ordens no momento</h3>
                            <p className="font-mono text-xs uppercase tracking-widest text-primary-light/40">Novas ordens aparecerão aqui assim que forem criadas</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {osDisponivel.map((os) => (
                                <div key={os.os_id || os.id} className="bg-white rounded-[2rem] border border-primary-light/10 shadow-xl shadow-primary/5 overflow-hidden hover:border-accent/20 hover:shadow-accent/10 transition-all group">
                                    <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Número OS */}
                                        <div className="shrink-0 w-16 h-16 bg-primary rounded-2xl flex flex-col items-center justify-center border border-accent/20">
                                            <span className="font-mono text-[10px] text-accent/60 uppercase tracking-widest">OS</span>
                                            <span className="font-drama font-bold text-lg text-accent leading-none">#{(os.os_id || os.id || '').toString().padStart(3, '0')}</span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="font-sans font-bold text-primary text-lg">{os.cliente_nome}</h3>
                                                <p className="font-mono text-xs uppercase tracking-widest text-primary-light/50 mt-0.5">{os.descricao || 'Serviço de montagem'}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-primary-light/10">
                                                    <MapPin size={13} className="text-accent" />
                                                    <span className="font-mono text-xs text-primary-light/70">{os.endereco}</span>
                                                </div>
                                                {os.data_agendamento && (
                                                    <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-primary-light/10">
                                                        <Clock size={13} className="text-primary-light/50" />
                                                        <span className="font-mono text-xs text-primary-light/70">{new Date(os.data_agendamento).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                                    <span className="font-mono text-xs font-bold text-emerald-600">R$ {Number(os.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botão Aceitar */}
                                        <button
                                            disabled={aceitando === (os.os_id || os.id)}
                                            onClick={async () => {
                                                setAceitando(os.os_id || os.id);
                                                try {
                                                    await api.post(`/public/convites/${os.os_id || os.id}/aceitar`);
                                                    navigate(`/convite/${os.os_id || os.id}`);
                                                } catch (err) {
                                                    alert('Erro ao aceitar. Tente novamente.');
                                                } finally {
                                                    setAceitando(null);
                                                }
                                            }}
                                            className={`shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl font-mono font-bold text-xs uppercase tracking-widest transition-all ${
                                                aceitando === (os.os_id || os.id)
                                                    ? 'bg-primary/20 text-primary/40 cursor-not-allowed'
                                                    : 'bg-accent text-primary shadow-lg shadow-accent/20 hover:shadow-accent/40'
                                            }`}
                                        >
                                            <CheckCircle2 size={16} />
                                            {aceitando === (os.os_id || os.id) ? 'Aceitando...' : 'Aceitar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Layout>
        );
    }

    if (!osData) {
        return (
            <Layout title="OS não encontrada">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                    <AlertTriangle size={40} className="text-primary-light/30" />
                    <p className="font-mono text-sm uppercase tracking-widest text-primary-light/50">Ordem de serviço não encontrada.</p>
                    <button onClick={() => navigate('/convite')} className="px-6 py-3 border border-primary-light/20 rounded-2xl text-xs font-mono font-bold uppercase tracking-widest text-primary-light/70 hover:border-accent/30 hover:text-accent transition-all">
                        Ver Ordens Disponíveis
                    </button>
                </div>
            </Layout>
        );
    }

    // ── Tela de Sucesso ──
    if (finalizado) {
        return (
            <Layout title="Ordem Finalizada">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
                    <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={48} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="font-drama text-3xl font-bold text-primary mb-2">Ordem Concluída!</h1>
                        <p className="font-mono text-sm uppercase tracking-widest text-primary-light/50">
                            OS #{(osData.os_id || osData.id || '').toString().padStart(4, '0')} — {fotos.length} foto{fotos.length > 1 ? 's' : ''} registrada{fotos.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={28} fill={s <= nota ? '#C9A84C' : 'none'} stroke={s <= nota ? '#C9A84C' : '#2A2A35'} />
                        ))}
                    </div>
                    <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-full">
                        Pagamento de R$ {osData.valor} liberado
                    </p>
                </div>
            </Layout>
        );
    }

    // ── Tela de Expirado ──
    if (status === 'expired') {
        return (
            <Layout title="Convite Expirado">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
                    <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                        <AlertTriangle size={48} className="text-red-400" />
                    </div>
                    <div>
                        <h1 className="font-drama text-3xl font-bold text-primary mb-2">Convite Expirado</h1>
                        <p className="font-mono text-sm uppercase tracking-widest text-primary-light/50">
                            O tempo de resposta para este convite acabou.
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Convite de Serviço">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── Header Card: Timer + Info ── */}
                <div className="bg-white rounded-[2rem] border border-primary-light/10 shadow-xl shadow-primary/5 overflow-hidden">
                    <div className="p-8 flex flex-col md:flex-row items-center gap-8">

                        {/* Timer */}
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <TimerArc totalSeconds={1200} timeLeft={timeLeft} status={status} />
                            {status === 'pending' && timeLeft < 60 && (
                                <span className="font-mono text-xs uppercase tracking-widest text-red-400 animate-pulse">
                                    Expirando em breve!
                                </span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="font-mono text-xs uppercase tracking-widest text-accent mb-1">Convite #OS-{osData.os_id || osData.id}</p>
                                <h2 className="font-drama text-2xl font-bold text-primary">{osData.cliente_nome}</h2>
                                <p className="font-mono text-sm text-primary-light/50 uppercase tracking-widest">{osData.descricao || 'Serviço de Montagem'}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-2xl border border-primary-light/10">
                                    <MapPin size={14} className="text-accent" />
                                    <span className="font-mono text-xs text-primary-light/70">{osData.endereco}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                                    <span className="font-mono text-xs font-bold text-emerald-600">R$ {osData.valor}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items da OS */}
                    <div className="border-t border-primary-light/10 px-8 py-5 bg-background/50">
                        <p className="font-mono text-xs uppercase tracking-widest text-primary-light/40 mb-3">Itens a montar</p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                <span className="font-sans text-sm text-primary">{osData.descricao || 'Montagem Geral'}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Botões de Aceite/Recusa */}
                    {status === 'pending' && (
                        <div className="px-8 py-6 border-t border-primary-light/10 flex gap-4">
                            <button
                                onClick={handleRecusar}
                                className="flex-1 flex items-center justify-center gap-2 py-4 border border-red-400/30 text-red-400 font-mono font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-red-500/5 transition-all"
                            >
                                <XCircle size={18} /> Recusar
                            </button>
                            <button
                                onClick={handleAceitar}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-accent text-primary font-mono font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all"
                            >
                                <CheckCircle2 size={18} /> Aceitar Serviço <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {status === 'declined' && (
                        <div className="px-8 py-6 border-t border-primary-light/10 text-center">
                            <p className="font-mono text-sm uppercase tracking-widest text-red-400">
                                Convite recusado. Este serviço foi devolvido para a fila.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Seção de Finalização (só aparece se aceito) ── */}
                {status === 'accepted' && (
                    <>
                        {/* Status badge */}
                        <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                            <div>
                                <p className="font-mono font-bold text-sm text-emerald-600">Serviço Aceito — Em Andamento</p>
                                <p className="font-mono text-xs text-emerald-600/60 uppercase tracking-widest">
                                    {checkedIn ? 'Localização Validada' : 'Valide sua localização para iniciar'}
                                </p>
                            </div>
                        </div>

                        {/* Botão de Check-in */}
                        {!checkedIn && (
                            <button
                                onClick={handleCheckIn}
                                disabled={performingCheckIn}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-background font-mono font-bold uppercase tracking-widest rounded-[2rem] shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                            >
                                <MapPin size={20} />
                                {performingCheckIn ? 'Validando local...' : 'Validar Presença (Check-in)'}
                                <ChevronRight size={18} />
                            </button>
                        )}

                        {/* O conteúdo abaixo só aparece após Check-in */}
                        {checkedIn && (
                            <>
                                {/* Upload de Fotos */}
                                <div className="bg-white rounded-[2rem] border border-primary-light/10 shadow-xl shadow-primary/5 p-8">
                                    <PhotoGrid fotos={fotos} onAdd={addFoto} onRemove={removeFoto} />
                                </div>

                                {/* Avaliação Interna & Observações */}
                                <div className="bg-white rounded-[2rem] border border-primary-light/10 shadow-xl shadow-primary/5 p-8 space-y-6">
                                    <div>
                                        <h3 className="font-sans font-bold text-primary mb-1">Auto-avaliação da Montagem</h3>
                                        <p className="font-mono text-xs uppercase tracking-widest text-primary-light/40">Como você avalia a qualidade desta montagem?</p>
                                    </div>

                                    <div className="flex gap-3">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setNota(s)}
                                                className="transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    size={32}
                                                    fill={s <= nota ? '#C9A84C' : 'none'}
                                                    stroke={s <= nota ? '#C9A84C' : '#2A2A35'}
                                                    className="transition-all"
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block font-mono text-xs uppercase tracking-widest text-primary-light/50 mb-2">
                                            Observações (opcional)
                                        </label>
                                        <textarea
                                            value={observacao}
                                            onChange={e => setObservacao(e.target.value)}
                                            placeholder="Dificuldades encontradas, itens danificados, informações relevantes..."
                                            rows={3}
                                            className="w-full bg-background border border-primary-light/10 rounded-2xl px-5 py-4 font-sans text-sm text-primary placeholder:text-primary-light/30 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Botão Finalizar */}
                                <button
                                    onClick={handleFinalizar}
                                    disabled={fotos.length === 0}
                                    className="w-full flex items-center justify-center gap-3 py-5 bg-accent text-primary font-mono font-bold uppercase tracking-widest rounded-[2rem] shadow-xl shadow-accent/30 hover:shadow-accent/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                >
                                    <Package size={20} />
                                    Finalizar Ordem de Serviço
                                    <ChevronRight size={18} />
                                </button>
                                {fotos.length === 0 && (
                                    <p className="text-center font-mono text-xs text-red-400/70 uppercase tracking-widest">
                                        Adicione pelo menos 1 foto para finalizar
                                    </p>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ConviteMontador;
