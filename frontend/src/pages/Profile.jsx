import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/api';
import { User, Phone, MapPin, Camera, Save, ArrowLeft, Clipboard, TrendingUp } from 'lucide-react';

const Profile = () => {
    const { id } = useParams();
    const fileInputRef = useRef(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        cidade: '',
        foto_url: ''
    });

    const isOwnProfile = !id;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const endpoint = id ? `/montadores/${id}` : '/montadores/me';
                const res = await api.get(endpoint);
                setUser(res.data);
                setFormData({
                    nome: res.data.nome || '',
                    telefone: res.data.telefone || '',
                    cidade: res.data.cidade || '',
                    foto_url: res.data.foto_url || ''
                });
                // Sincronizar com localStorage apenas se for o próprio perfil
                if (isOwnProfile) {
                    localStorage.setItem('montador', JSON.stringify(res.data));
                }
            } catch (err) {
                console.error('Erro ao buscar dados do perfil:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData({ ...formData, foto_url: event.target.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.patch('/montadores/me', formData);
            setUser(res.data);
            setFormData({
                nome: res.data.nome || '',
                telefone: res.data.telefone || '',
                cidade: res.data.cidade || '',
                foto_url: res.data.foto_url || ''
            });
            // Sincronizar com localStorage após salvar
            localStorage.setItem('montador', JSON.stringify(res.data));
            alert('Perfil atualizado com sucesso!');
            window.location.reload(); // Recarregar para atualizar o Header e outros componentes
        } catch (err) {
            console.error('Erro ao atualizar perfil:', err);
            alert('Erro ao atualizar perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Perfil">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Meu Perfil">
            <div className="max-w-5xl mx-auto pb-20">
                {/* Cabeçalho do Perfil com Decoração */}
                <div className="relative mb-8 p-1 rounded-[2.5rem] bg-gradient-to-br from-accent/20 via-primary-light/5 to-transparent shadow-2xl overflow-hidden">
                    <div className="bg-primary/95 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-12 relative z-10">
                        {/* Círculo decorativo de fundo */}
                        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-accent/5 blur-[80px] rounded-full"></div>
                        
                        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left">
                            {/* Foto Section */}
                            <div className="relative group shrink-0">
                                <div className="w-56 h-56 bg-background rounded-[2rem] overflow-hidden border-2 border-accent/20 flex items-center justify-center group-hover:border-accent transition-all duration-500 shadow-2xl relative">
                                    {formData.foto_url ? (
                                        <img src={formData.foto_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <User size={64} className="text-accent/20" />
                                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent/40">Sem Foto</span>
                                        </div>
                                    )}
                                    {/* Overlay no hover */}
                                    <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                />
                                {isOwnProfile && (
                                    <button 
                                        type="button"
                                        onClick={handleCameraClick}
                                        title="Alterar Foto" 
                                        className="absolute -bottom-2 -right-2 bg-accent p-5 rounded-2xl text-primary shadow-[0_10px_30px_rgba(201,168,76,0.4)] hover:scale-110 hover:-translate-y-1 active:scale-95 transition-all duration-300 group/cam z-20"
                                    >
                                        <Camera size={24} className="group-hover/cam:rotate-12 transition-transform" />
                                    </button>
                                )}
                            </div>

                            {/* Dados Section */}
                            <div className="flex-1 w-full space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-drama font-bold text-white italic tracking-tight">Informações <span className="text-accent underline underline-offset-8 decoration-accent/30">Pessoais</span></h3>
                                    <p className="text-xs font-mono text-white/60 uppercase tracking-[0.3em]">Gerencie sua identidade digital Pro</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-mono text-accent uppercase tracking-[0.2em] pl-1 font-bold">Nome Completo</label>
                                            <div className="relative group/input">
                                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/60 group-focus-within/input:text-accent transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    name="nome"
                                                    value={formData.nome}
                                                    onChange={handleChange}
                                                    readOnly={!isOwnProfile}
                                                    placeholder="Seu nome"
                                                    className={`w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-14 pr-4 transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none font-sans text-lg text-white ${!isOwnProfile ? 'cursor-not-allowed opacity-70' : ''}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-mono text-accent uppercase tracking-[0.2em] pl-1 font-bold">Telefone / WhatsApp</label>
                                            <div className="relative group/input">
                                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/60 group-focus-within/input:text-accent transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    name="telefone"
                                                    value={formData.telefone}
                                                    onChange={handleChange}
                                                    readOnly={!isOwnProfile}
                                                    placeholder="(00) 00000-0000"
                                                    className={`w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-14 pr-4 transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none font-mono text-lg text-white ${!isOwnProfile ? 'cursor-not-allowed opacity-70' : ''}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-mono text-accent uppercase tracking-[0.2em] pl-1 font-bold">Cidade / Região</label>
                                            <div className="relative group/input">
                                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/60 group-focus-within/input:text-accent transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    name="cidade"
                                                    value={formData.cidade}
                                                    onChange={handleChange}
                                                    readOnly={!isOwnProfile}
                                                    placeholder="Cidade, UF"
                                                    className={`w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-14 pr-4 transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none font-sans text-lg text-white ${!isOwnProfile ? 'cursor-not-allowed opacity-70' : ''}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-mono text-accent uppercase tracking-[0.2em] pl-1 font-bold">Nível de Acesso</label>
                                            <div className="w-full bg-accent/5 border border-accent/10 rounded-2xl px-6 py-5 flex items-center justify-between shadow-inner">
                                                <span className="text-white dark:text-accent font-bold font-sans tracking-wide">
                                                    {user?.role === 'admin' ? 'ADMINISTRADOR / ALPHA' : 'MONTADOR / OPERACIONAL'}
                                                </span>
                                                <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {isOwnProfile && (
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full bg-accent text-primary py-5 rounded-[1.5rem] font-drama font-bold text-lg uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(201,168,76,0.3)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.5)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-4 group/save disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving ? (
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            ) : (
                                                <>
                                                    <Save className="group-hover/save:scale-110 transition-transform" size={24} />
                                                    <span>Atualizar Credenciais Pro</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meus Registros Section */}
                <div className="mt-20">
                    <div className="flex items-center justify-between mb-10 border-b border-primary-light/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                                <Clipboard size={24} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold font-drama italic text-primary leading-tight">Métricas <span className="text-accent underline underline-offset-4 decoration-accent/20">de Performance</span></h3>
                                <p className="text-xs font-mono text-primary-light/40 uppercase tracking-[0.2em] mt-1">Seu histórico operacional consolidado</p>
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase border border-emerald-500/20">
                            Perfil Ativo
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-[2rem] p-10 border border-primary-light/5 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Clipboard size={80} className="text-primary" />
                            </div>
                            <p className="text-xs font-mono text-primary-light/40 uppercase tracking-[0.2em] mb-3 relative z-10">Montagens Concluídas</p>
                            <h4 className="text-6xl font-drama font-black text-primary italic relative z-10 group-hover:text-accent transition-colors">{user?.metrics?.total_concluidas || 0}</h4>
                            <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold font-mono">
                                <TrendingUp size={14} />
                                <span>Fluxo Ativo</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-10 border border-primary-light/5 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <User size={80} className="text-primary" />
                            </div>
                            <p className="text-xs font-mono text-primary-light/40 uppercase tracking-[0.2em] mb-3 relative z-10">Avaliação Média</p>
                            <h4 className="text-6xl font-drama font-black text-accent italic relative z-10">{user?.metrics?.media_nota || '5.0'}</h4>
                            <div className="mt-4 flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <div key={s} className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                                        <div className={`w-1.5 h-1.5 rounded-full ${s <= (user?.metrics?.media_nota || 5) ? 'bg-accent' : 'bg-accent/20'}`}></div>
                                    </div>
                                ))}
                                <span className="ml-2 text-primary-light/60 text-xs font-bold font-mono">({user?.metrics?.total_avaliacoes || 0} reviews)</span>
                            </div>
                        </div>

                        <div className="bg-primary rounded-[2rem] p-10 border border-accent/20 shadow-2xl hover:shadow-accent/20 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Save size={80} className="text-accent" />
                            </div>
                            <p className="text-xs font-mono text-white/40 uppercase tracking-[0.2em] mb-3 relative z-10">Tempo Médio</p>
                            <h4 className="text-6xl font-drama font-black text-accent italic relative z-10">{user?.metrics?.tempo_medio || '1.1h'}</h4>
                            <p className="mt-4 text-[10px] font-mono text-accent/50 tracking-widest uppercase font-bold">Otimização Operacional Ativa</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
