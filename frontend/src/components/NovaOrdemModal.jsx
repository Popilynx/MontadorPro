import React, { useState } from 'react';
import { X, Calendar, MapPin, User, FileText, DollarSign } from 'lucide-react';
import api from '../api/api';

const NovaOrdemModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [createdConvites, setCreatedConvites] = useState([]);
    const [formData, setFormData] = useState({
        cliente_nome: '',
        telefone: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        descricao: '',
        data_agendamento: '',
        valor: '',
        valor_liquido: '',
        comissao: '80.00',
        tipoProjeto: '',
        observacoes: '',
        raio_busca: '100'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'tipoProjeto') {
            const tabelas = {
                simples: '300.00',
                medio: '600.00',
                complexo: '900.00',
                luxo: '1200.00'
            };
            const valorSugerido = tabelas[value] || '';
            setFormData(prev => {
                const bruto = parseFloat(valorSugerido) || 0;
                const comissao = parseFloat(prev.comissao) || 0;
                return { 
                    ...prev, 
                    [name]: value, 
                    valor: valorSugerido,
                    valor_liquido: (bruto - comissao).toFixed(2)
                };
            });
            return;
        }

        if (name === 'valor' || name === 'comissao') {
            setFormData(prev => {
                const newVal = name === 'valor' ? value : prev.valor;
                const newCom = name === 'comissao' ? value : prev.comissao;
                const bruto = parseFloat(newVal) || 0;
                const comissao = parseFloat(newCom) || 0;
                return { 
                    ...prev, 
                    [name]: value,
                    valor_liquido: (bruto - comissao).toFixed(2)
                };
            });
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 2) value = `(${value.slice(0,2)}) ${value.slice(2)}`;
        if (value.length > 10) value = `${value.slice(0,10)}-${value.slice(10)}`;
        setFormData(prev => ({ ...prev, telefone: value }));
    };

    const buscarCep = async (cepNumbers) => {
        if (cepNumbers.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        logradouro: data.logradouro || '',
                        bairro: data.bairro || '',
                        cidade: data.localidade || '',
                        uf: data.uf || ''
                    }));
                }
            } catch (e) {
                console.error('Erro ao buscar CEP', e);
            }
        }
    };

    const handleCepChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        const cepNumbers = value;
        if (value.length > 5) value = `${value.slice(0,5)}-${value.slice(5)}`;
        setFormData(prev => ({ ...prev, cep: value }));
        if (cepNumbers.length === 8) buscarCep(cepNumbers);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const enderecoCompleto = `${formData.logradouro}, ${formData.numero}${formData.complemento ? ' - ' + formData.complemento : ''}, ${formData.bairro}, ${formData.cidade} - ${formData.uf}, CEP: ${formData.cep}`;

            const payload = {
                cliente_nome: formData.cliente_nome,
                cliente_contato: formData.telefone,
                endereco_instalacao: enderecoCompleto,
                cidade: formData.cidade,
                estado: formData.uf,
                valor: parseFloat(formData.valor),
                data_agendamento: formData.data_agendamento,
                descricao: formData.descricao,
                tipo_projeto: formData.tipoProjeto,
                observacoes: formData.observacoes,
                raio_busca: parseInt(formData.raio_busca, 10) || 100
            };

            const response = await api.post('/admin/criar-os', payload);
            if (response.data?.convites?.length > 0) {
                setCreatedConvites(response.data.convites);
                setStep(3);
            } else {
                onClose();
            }
        } catch (err) {
            console.error('Erro ao criar OS:', err);
            alert('Erro ao criar ordem de servico. Verifique os dados.');
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
                <div className="bg-primary p-6 md:p-8 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop')] opacity-10 mix-blend-luminosity object-cover"></div>
                    <div className="relative z-10">
                        <span className="font-mono text-accent text-xs tracking-widest uppercase mb-2 block">Criacao de OS</span>
                        <h2 className="text-3xl font-sans font-bold text-background tracking-tight">Nova Ordem de Servico</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="relative z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="h-1 bg-primary/5 w-full">
                    <div className={`h-full bg-accent transition-all duration-500 ease-out ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
                </div>

                <div className="p-6 md:p-8 bg-background overflow-y-auto max-h-[60vh]">
                    {step === 3 ? (
                        <div className="space-y-6 text-center animate-[fadeInUp_0.3s_ease-out]">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h3 className="text-2xl font-bold text-primary">Ordem Criada com Sucesso!</h3>
                            <p className="text-primary-light text-sm">Encontramos os montadores mais proximos e geramos os convites.</p>

                            <div className="space-y-3 text-left mt-6">
                                <p className="font-mono text-xs tracking-widest text-primary-light uppercase font-bold mb-2">Enviar Convites via WhatsApp:</p>
                                {createdConvites.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div>
                                            <p className="font-bold text-primary">{c.montador_nome}</p>
                                            <p className="text-xs text-primary-light">Aprox. {c.distancia_km}km de distancia</p>
                                        </div>
                                        {c.whatsapp_link ? (
                                            <a 
                                                href={c.whatsapp_link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors shrink-0 whitespace-nowrap"
                                            >
                                                Enviar WhatsApp
                                            </a>
                                        ) : (
                                            <span className="text-xs text-rose-500 mr-2">Sem WhatsApp</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : step === 1 ? (
                        <div className="space-y-6">
                            <h3 className="font-mono text-xs tracking-widest text-primary-light uppercase font-bold mb-4 flex items-center gap-2">
                                <span className="bg-primary/5 p-1 rounded">01</span> Informacoes do Cliente
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Nome / Razao Social</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                                        <input 
                                            type="text" 
                                            name="cliente_nome"
                                            value={formData.cliente_nome}
                                            onChange={handleChange}
                                            placeholder="Ex: Joao da Silva" 
                                            className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Telefone / WhatsApp</label>
                                    <input 
                                        type="tel" 
                                        name="telefone"
                                        value={formData.telefone}
                                        onChange={handlePhoneChange}
                                        placeholder="(48) 90000-0000" 
                                        className="w-full bg-white border border-primary/10 rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary font-mono" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-4 mb-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Endereco Completo</label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div className="sm:col-span-1 border border-primary/10 rounded-2xl bg-white overflow-hidden focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all relative">
                                        <input 
                                            type="text" 
                                            name="cep"
                                            value={formData.cep}
                                            onChange={handleCepChange}
                                            placeholder="CEP" 
                                            className="w-full bg-transparent px-4 py-3 text-sm outline-none text-primary font-mono placeholder:text-primary-light/40" 
                                        />
                                    </div>
                                    <div className="sm:col-span-2 border border-primary/10 rounded-2xl bg-white focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                                        <input 
                                            type="text" 
                                            name="logradouro"
                                            value={formData.logradouro}
                                            onChange={handleChange}
                                            placeholder="Rua, Avenida, etc..." 
                                            className="w-full bg-transparent px-4 py-3 text-sm outline-none text-primary" 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="col-span-1 border border-primary/10 rounded-2xl bg-white focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                                        <input 
                                            type="text" 
                                            name="numero"
                                            value={formData.numero}
                                            onChange={handleChange}
                                            placeholder="Numero" 
                                            className="w-full bg-transparent px-4 py-3 text-sm outline-none text-primary" 
                                        />
                                    </div>
                                    <div className="col-span-1 sm:col-span-3 border border-primary/10 rounded-2xl bg-white focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                                        <input 
                                            type="text" 
                                            name="complemento"
                                            value={formData.complemento}
                                            onChange={handleChange}
                                            placeholder="Complemento (Apto, Bloco, etc)" 
                                            className="w-full bg-transparent px-4 py-3 text-sm outline-none text-primary" 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                    <div className="border border-primary/10 rounded-2xl bg-white focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                                        <input 
                                            type="text" 
                                            name="bairro"
                                            value={formData.bairro}
                                            onChange={handleChange}
                                            placeholder="Bairro" 
                                            className="w-full bg-transparent px-4 py-3 text-sm outline-none text-primary" 
                                        />
                                    </div>
                                    <div className="border border-primary/10 rounded-2xl bg-white focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                                        <input 
                                            type="text" 
                                            name="cidade"
                                            value={formData.cidade}
                                            onChange={handleChange}
                                            placeholder="Cidade" 
                                            className="w-full bg-transparent px-4 py-3 text-sm outline-none text-primary" 
                                        />
                                    </div>
                                    <div className="border border-primary/10 rounded-2xl bg-white focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                                        <input 
                                            type="text" 
                                            name="uf"
                                            value={formData.uf}
                                            onChange={handleChange}
                                            placeholder="UF" 
                                            maxLength="2"
                                            className="w-full bg-transparent px-4 py-3 text-sm outline-none text-primary font-mono uppercase" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-[fadeInRight_0.3s_ease-out]">
                             <h3 className="font-mono text-xs tracking-widest text-primary-light uppercase font-bold mb-4 flex items-center gap-2">
                                <span className="bg-primary/5 p-1 rounded">02</span> Detalhes do Servico
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Tipo de Projeto</label>
                                    <select 
                                        name="tipoProjeto"
                                        value={formData.tipoProjeto || ''}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-primary/10 rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary font-mono appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="simples">Simples (Cozinha/Quarto)</option>
                                        <option value="medio">Medio (Apartamento Completo)</option>
                                        <option value="complexo">Complexo (Casa/Escritorio)</option>
                                        <option value="luxo">Super Luxo / Alto Padrao</option>
                                    </select>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Observacoes Internas</label>
                                    <input 
                                        type="text" 
                                        name="observacoes"
                                        value={formData.observacoes || ''}
                                        onChange={handleChange}
                                        placeholder="Ex: Cliente exigente, levar escada..." 
                                        className="w-full bg-white border border-primary/10 rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary/70 italic"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Descricao para o Montador</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-4 text-primary-light/40" size={18} />
                                    <textarea 
                                        rows="3" 
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleChange}
                                        placeholder="O que sera montado?" 
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
                                    <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Raio de Busca (km)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                                        <input 
                                            type="number" 
                                            name="raio_busca"
                                            value={formData.raio_busca}
                                            onChange={handleChange}
                                            min="5"
                                            max="500"
                                            className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary font-mono" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 pt-2 bg-primary/5 p-6 rounded-3xl border border-primary/10 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Valor Bruto (Total Cliente)</label>
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
                                        <div className="space-y-2">
                                            <label className="text-xs font-mono uppercase tracking-widest text-primary-light/70 ml-1">Comissao Administrativa</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={18} />
                                                <input 
                                                    type="number" 
                                                    name="comissao"
                                                    value={formData.comissao}
                                                    onChange={handleChange}
                                                    placeholder="80.00" 
                                                    className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none text-primary font-mono" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between px-2 pt-2 border-t border-primary/5">
                                        <span className="text-xs font-mono uppercase tracking-widest text-primary-light/70">Valor Liquido (Montador):</span>
                                        <span className="text-xl font-sans font-black text-emerald-600">R$ {formData.valor_liquido || '0.00'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 border-t border-primary/5 flex justify-end gap-4">
                    {step === 2 && (
                        <button 
                            onClick={() => setStep(1)}
                            className="px-6 py-3 font-mono text-sm tracking-widest uppercase font-bold text-primary-light hover:text-primary transition-colors mr-auto"
                        >
                            Voltar
                        </button>
                    )}
                    
                    {step === 3 ? (
                        <button 
                            onClick={onClose}
                            className="btn-primary w-full py-3 bg-primary text-white"
                        >
                            Concluir e Fechar
                        </button>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NovaOrdemModal;
