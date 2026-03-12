import React, { useState } from 'react';
import Layout from '../components/Layout';
import { UserPlus, Save, ArrowLeft, Phone, CreditCard, Key, Mail, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const NovoMontador = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        email: '',
        cpf: '',
        senha: '',
        chavePix: ''
    });
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [erro, setErro] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro(null);

        try {
            await api.post('/admin/montadores', formData);
            setSucesso(true);
        } catch (err) {
            console.error('Erro ao cadastrar montador:', err);
            setErro(err.response?.data?.error || 'Erro ao cadastrar montador. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    if (sucesso) {
        return (
            <Layout title="Cadastro Realizado">
                <div className="max-w-2xl mx-auto text-center py-12 space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-green-500/10 p-6 rounded-full text-green-500">
                            <CheckCircle size={64} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-primary dark:text-white">Montador Cadastrado!</h2>
                        <p className="text-primary-light/60 mt-2">
                            Um e-mail de verificação foi enviado para <strong>{formData.email}</strong>.<br />
                            O profissional precisa ativar a conta antes de conseguir acessar o sistema.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/montadores')}
                        className="btn-primary px-8"
                    >
                        Voltar para Listagem
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Cadastrar Novo Montador">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-primary-light/50 hover:text-accent transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Voltar para listagem
                </button>

                <div className="bg-white dark:bg-primary-dark/50 rounded-2xl shadow-sm border border-primary-light/10 overflow-hidden">
                    <div className="p-8 border-b border-primary-light/10 bg-primary-light/5">
                        <div className="flex items-center gap-4">
                            <div className="bg-accent/10 p-3 rounded-xl text-accent">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-primary dark:text-white">Novo Profissional</h3>
                                <p className="text-sm text-primary-light/50">Preencha os dados básicos para acesso ao sistema.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full bg-primary-light/5 border border-primary-light/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary dark:text-white"
                                    placeholder="Ex: João da Silva"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary-light/70 ml-1 flex items-center gap-2">
                                    <Mail size={14} /> E-mail
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-primary-light/5 border border-primary-light/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary dark:text-white"
                                    placeholder="email@exemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary-light/70 ml-1 flex items-center gap-2">
                                    <Phone size={14} /> Telefone
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                    className="w-full bg-primary-light/5 border border-primary-light/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary dark:text-white"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary-light/70 ml-1 flex items-center gap-2">
                                    <CreditCard size={14} /> CPF
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                    className="w-full bg-primary-light/5 border border-primary-light/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary dark:text-white"
                                    placeholder="000.000.000-00"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary-light/70 ml-1 flex items-center gap-2">
                                    <Key size={14} /> Senha Inicial
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={formData.senha}
                                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                    className="w-full bg-primary-light/5 border border-primary-light/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Chave PIX (Opcional)</label>
                                <input
                                    type="text"
                                    value={formData.chavePix}
                                    onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                                    className="w-full bg-primary-light/5 border border-primary-light/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary dark:text-white"
                                    placeholder="E-mail, CPF ou Aleatória"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-primary-light/10 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 text-primary-light/60 font-medium hover:bg-primary-light/5 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex items-center gap-2 px-8 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {loading ? 'Salvando...' : 'Salvar Montador'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default NovoMontador;
