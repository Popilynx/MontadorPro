import React, { useState } from 'react';
import { X, Calendar, MapPin, User, FileText, DollarSign } from 'lucide-react';
import api from '../api/api';

const NovaOrdemModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cliente_nome: '',
        telefone: '',
        endereco: '',
        descricao: '',
        data_agendamento: '',
        valor: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                cliente_nome: formData.cliente_nome,
                endereco: formData.endereco,
                valor: parseFloat(formData.valor),
                data_agendamento: formData.data_agendamento,
                descricao: formData.descricao // Embora o schema original não tenha, vou passar para o futuro
            };
            await api.post('/os', payload);
            onClose();
        } catch (err) {
            console.error('Erro ao criar OS:', err);
            alert('Erro ao criar ordem de serviço. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm transition-all duration-300">
            <div 
                className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-primary/10 animate-[fadeInUp_0.3s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary p-6 md:p-8 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop')] opacity-10 mix-blend-luminosity object-cover"></div>
                    <div className="relative z-10">
                        <span className="font-mono text-accent text-xs tracking-widest uppercase mb-2 block">Criação de OS</span>
                        <h2 className="text-3xl font-sans font-bold text-background tracking-tight">Nova Ordem de Serviço</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="relative z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar (Visual Only) */}
                <div className="h-1 bg-primary/5 w-full">
                    <div className={`h-full bg-accent transition-all duration-500 ease-out ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
                </div>

                {/* Body Form */}
                <div className="p-6 md:p-8 bg-background">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <h3 className="font-mono text-xs tracking-widest text-primary-light uppercase font-bold mb-4 flex items-center gap-2">
                                <span className="bg-primary/5 p-1 rounded">01</span> Informações do Cliente
                            </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Nome / Razão Social</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                                            <input 
                                                type="text" 
                                                name="cliente_nome"
                                                value={formData.cliente_nome}
                                                onChange={handleChange}
                                                placeholder="Ex: João da Silva" 
                                                className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Telefone / WhatsApp</label>
                                        <input 
                                            type="text" 
                                            name="telefone"
                                            value={formData.telefone}
                                            onChange={handleChange}
                                            placeholder="(48) 90000-0000" 
                                            className="w-full bg-white border border-primary/10 rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary font-mono" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Endereço Completo</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                                        <input 
                                            type="text" 
                                            name="endereco"
                                            value={formData.endereco}
                                            onChange={handleChange}
                                            placeholder="Rua, Número, Bairro, Cidade..." 
                                            className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary" 
                                        />
                                    </div>
                                </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-[fadeInRight_0.3s_ease-out]">
                             <h3 className="font-mono text-xs tracking-widest text-primary-light uppercase font-bold mb-4 flex items-center gap-2">
                                <span className="bg-primary/5 p-1 rounded">02</span> Detalhes do Serviço
                            </h3>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Descrição</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-4 text-primary-light/40" size={18} />
                                    <textarea 
                                        rows="3" 
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleChange}
                                        placeholder="O que será montado?" 
                                        className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Data Desejada</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                                        <input 
                                            type="date" 
                                            name="data_agendamento"
                                            value={formData.data_agendamento}
                                            onChange={handleChange}
                                            className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary font-mono" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Valor Estimado</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                                        <input 
                                            type="number" 
                                            name="valor"
                                            value={formData.valor}
                                            onChange={handleChange}
                                            placeholder="0.00" 
                                            className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary font-mono" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="bg-white p-6 border-t border-primary/5 flex justify-end gap-4">
                    {step === 2 && (
                        <button 
                            onClick={() => setStep(1)}
                            className="px-6 py-3 font-mono text-sm tracking-widest uppercase font-bold text-primary-light hover:text-primary transition-colors mr-auto"
                        >
                            Voltar
                        </button>
                    )}
                    
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 font-mono text-sm tracking-widest uppercase font-bold text-primary-light hover:text-primary transition-colors"
                    >
                        Cancelar
                    </button>
                    
                    {step === 1 ? (
                        <button 
                            onClick={() => setStep(2)}
                            className="btn-primary px-8 py-3 flex items-center"
                        >
                            Continuar
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`btn-primary px-8 py-3 bg-emerald-600 hover:bg-emerald-700 border-emerald-500 shadow-emerald-500/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Salvando...' : 'Salvar Ordem'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default NovaOrdemModal;
