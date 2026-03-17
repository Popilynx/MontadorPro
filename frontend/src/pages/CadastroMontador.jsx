import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, User, Briefcase, FileText, ArrowRight, ArrowLeft, Loader2, Phone, Mail, CreditCard, Lock } from 'lucide-react';
import api from '../api/api';

const MAX_DOC_MB = 3;
const MAX_IMG_DIM = 1280;

const toBase64 = file => new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const compressImageToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(MAX_IMG_DIM / img.width, MAX_IMG_DIM / img.height, 1);
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Falha ao processar a imagem. Tente novamente.'));
            }
            ctx.drawImage(img, 0, 0, w, h);
            try {
                const compressed = canvas.toDataURL('image/jpeg', 0.8);
                resolve(compressed);
            } catch (err) {
                reject(new Error('Falha ao comprimir a imagem. Use uma foto menor.'));
            }
        };
        img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
        img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
});

const fileToBase64 = async (file) => {
    if (!file) return null;
    const maxBytes = MAX_DOC_MB * 1024 * 1024;
    if (file.size > maxBytes) {
        throw new Error(`Arquivo acima de ${MAX_DOC_MB}MB. Compacte e tente novamente.`);
    }
    if (file.type && file.type.startsWith('image/')) {
        return await compressImageToBase64(file);
    }
    return await toBase64(file);
};

const CadastroMontador = () => {
    const navigate = useNavigate();

    // Estado do Stepper
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [erro, setErro] = useState(null);

    // Estado do Formulário (Todos os campos do testenf)
    const [formData, setFormData] = useState({
        // Etapa 1: Pessoais
        nome: '',
        cpf: '',
        nascimento: '',
        telefone: '',
        email: '',
        senha: '',
        cep: '',
        endereco: '',
        cidade: '',
        estado: 'GO',
        latitude: null,
        longitude: null,

        // Etapa 2: Experiência
        nivelExperiencia: '',
        anosExperiencia: '',
        cnpjStatus: '',
        cnpj: '',
        especialidades: [],
        ferramentas: '',
        referencias: '',
        disponibilidade: '',

        // Etapa 3: Documentos (Mockados por enquanto, simulando Base64/URLs)
        docRg: '',
        docCpf: '',
        docComprovante: '',
        docFoto: '',

        // Etapa 4: Termos
        aceitoLGPD: false,
        aceitoConduta: false,
    });

    // Geolocalização no carregamento
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }));
                },
                (error) => console.log('Geolocalização não permitida ou falhou:', error)
            );
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'cep') {
            const onlyNums = value.replace(/\D/g, '').slice(0, 8);
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
            
            if (onlyNums.length === 8) {
                buscarCEP(onlyNums);
            }
            return;
        }

        if (name === 'cpf') {
            let val = value.replace(/\D/g, '');
            if (val.length > 11) val = val.slice(0, 11);
            val = val.replace(/(\d{3})(\d)/, '$1.$2');
            val = val.replace(/(\d{3})(\d)/, '$1.$2');
            val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            setFormData(prev => ({ ...prev, [name]: val }));
            return;
        }

        if (name === 'telefone') {
            let val = value.replace(/\D/g, '');
            if (val.length > 11) val = val.slice(0, 11);
            if (val.length > 2) {
                val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
            }
            if (val.length > 10) {
                val = `${val.substring(0, 10)}-${val.substring(10)}`;
            }
            setFormData(prev => ({ ...prev, [name]: val }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const buscarCEP = async (cep) => {
        try {
            setLoading(true);
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    endereco: `${data.logradouro}${data.bairro ? ', ' + data.bairro : ''}`,
                    cidade: data.localidade,
                    estado: data.uf
                }));
                setErro(null);
            } else {
                setErro('CEP não encontrado.');
            }
        } catch (err) {
            console.error('Erro ao buscar CEP:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEspecialidade = (esp) => {
        setFormData(prev => {
            const extra = prev.especialidades.includes(esp)
                ? prev.especialidades.filter(e => e !== esp)
                : [...prev.especialidades, esp];
            return { ...prev, especialidades: extra };
        });
    };

    const handleDocUpload = async (field, file) => {
        if (!file) return;
        setErro(null);
        try {
            const base64 = await fileToBase64(file);
            setFormData(prev => ({ ...prev, [field]: base64 }));
        } catch (err) {
            setErro(err.message || 'Erro ao processar arquivo.');
        }
    };

    const isStep1Valid = () => formData.nome && formData.cpf && formData.telefone && formData.senha && formData.email && formData.cidade;
    const isStep2Valid = () => formData.nivelExperiencia && formData.anosExperiencia;
    const isStep4Valid = () => formData.aceitoLGPD && formData.aceitoConduta;

    const avancar = () => {
        setErro(null);
        if (step === 1 && !isStep1Valid()) return setErro('Preencha os campos obrigatórios da etapa 1.');
        if (step === 2 && !isStep2Valid()) return setErro('Selecione seu nível de experiência e anos trabalhados.');
        setStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const voltar = () => {
        setErro(null);
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const finalizar = async () => {
        if (!isStep4Valid()) {
            return setErro('Você precisa aceitar os termos para prosseguir.');
        }

        setLoading(true);
        setErro(null);

        try {
            await api.post('/auth/register', formData);
            setSucesso(true);
            setTimeout(() => {
                navigate('/login');
            }, 5000);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 413) {
                setErro('Arquivos muito grandes. Envie fotos menores e tente novamente.');
            } else {
                setErro(err.response?.data?.error || 'Ocorreu um erro ao enviar seu cadastro. Tente novamente.');
            }
        } finally {
            setLoading(false);
            window.scrollTo(0, 0);
        }
    };

    if (sucesso) {
        return (
            <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
                <div className="bg-primary-light/5 border border-white/10 p-10 rounded-3xl max-w-lg text-center backdrop-blur-md">
                    <div className="bg-accent/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-accent" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white font-drama mb-4">Cadastro em Análise!</h2>
                    <p className="text-white/60 mb-8 leading-relaxed">
                        Seu perfil foi recebido com sucesso. Nossa equipe fará a validação dos seus documentos e experiência. 
                        Você receberá um e-mail ou WhatsApp quando for aprovado!
                    </p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="btn-primary w-full"
                    >
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary text-white flex flex-col items-center py-12 px-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] -left-1/4 w-[700px] h-[700px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] -right-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Stepper Header */}
            <div className="w-full max-w-3xl mb-12 flex justify-between items-center relative z-10">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10 -translate-y-1/2 rounded-full"></div>
                <div className="absolute top-1/2 left-0 h-1 bg-accent transition-all duration-500 ease-in-out -z-10 -translate-y-1/2 rounded-full" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

                {[
                    { num: 1, icon: User, label: "Pessoais" },
                    { num: 2, icon: Briefcase, label: "Experiência" },
                    { num: 3, icon: FileText, label: "Docs" },
                    { num: 4, icon: CheckCircle, label: "Termos" }
                ].map((s) => (
                    <div key={s.num} className="flex flex-col items-center gap-2 bg-primary px-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.num ? 'border-accent bg-accent text-primary shadow-lg shadow-accent/20' : 'border-white/20 bg-primary-light/50 text-white/50'}`}>
                            <s.icon size={20} />
                        </div>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${step >= s.num ? 'text-accent' : 'text-white/40'}`}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="w-full max-w-3xl bg-primary-light/10 border border-white/5 rounded-[2rem] p-6 md:p-12 backdrop-blur-xl relative z-10 shadow-2xl">
                
                {erro && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-center text-sm font-medium">
                        {erro}
                    </div>
                )}

                {/* ETAPA 1: DADOS PESSOAIS */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="mb-8 border-b border-white/10 pb-6">
                            <h2 className="text-3xl font-bold font-drama text-white mb-2">Dados Pessoais</h2>
                            <p className="text-white/50">Precisamos te conhecer melhor para direcionar serviços na sua região.</p>
                        </div>
                        
                        {formData.latitude ? (
                            <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3 text-accent">
                                <MapPin size={24} className="shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">Localização Capturada!</p>
                                    <p className="text-xs text-accent/70">Usaremos isso para encontrar serviços perto de você.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 text-white/60">
                                <MapPin size={24} className="shrink-0" />
                                <p className="text-sm">Permita o acesso à localização no navegador para otimizar seus serviços.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-white/70">Nome Completo *</label>
                                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none" placeholder="Como no seu documento" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">CPF *</label>
                                <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none" placeholder="000.000.000-00" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Telefone / WhatsApp *</label>
                                <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none" placeholder="(00) 90000-0000" />
                            </div>
            <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-white/70">E-mail *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none" placeholder="seu@email.com" />
            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-white/70">Senha de Acesso *</label>
                                <input type="password" name="senha" value={formData.senha} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none" placeholder="Crie uma senha forte" />
                            </div>

                            <div className="space-y-2 mt-4 md:col-span-2 border-t border-white/10 pt-6">
                                <h4 className="text-lg font-bold font-drama mb-2 text-white">Endereço Principal</h4>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">CEP</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="cep" 
                                        value={formData.cep} 
                                        onChange={handleChange} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none" 
                                        placeholder="00000-000" 
                                        maxLength={9}
                                    />
                                    {loading && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="animate-spin text-accent" size={18} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-white/70">Endereço / Rua</label>
                                <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none" placeholder="Rua, Número, Bairro" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Cidade *</label>
                                <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none" placeholder="Ex: Goiânia" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Estado</label>
                                <select name="estado" value={formData.estado} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none appearance-none">
                                    <option value="GO">Goiás (GO)</option>
                                    <option value="DF">Distrito Federal (DF)</option>
                                    <option value="SP">São Paulo (SP)</option>
                                    <option value="MG">Minas Gerais (MG)</option>
                                    <option value="RJ">Rio de Janeiro (RJ)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ETAPA 2: EXPERIÊNCIA */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="mb-8 border-b border-white/10 pb-6">
                            <h2 className="text-3xl font-bold font-drama text-white mb-2">Sua Experiência</h2>
                            <p className="text-white/50">Conte-nos sobre suas habilidades para te enviar os projetos certos.</p>
                        </div>

                        <div className="space-y-8">
                            {/* Nível XP */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-white/70 uppercase tracking-widest">Nível de Montagem</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'simples', title: 'Simples', desc: 'Móveis de caixa fechada, fáceis.' },
                                        { id: 'medio_complexo', title: 'Médio a Complexo', desc: 'Guarda-roupas grandes, cozinhas modulares.' },
                                        { id: 'luxo', title: 'Super Luxo / Marcenaria', desc: 'Móveis planejados de alto padrão, sob medida.' }
                                    ].map(nivel => (
                                        <div 
                                            key={nivel.id}
                                            onClick={() => setFormData({...formData, nivelExperiencia: nivel.id})}
                                            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 ${formData.nivelExperiencia === nivel.id ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/30 bg-black/20'}`}
                                        >
                                            <h4 className={`font-bold mb-1 ${formData.nivelExperiencia === nivel.id ? 'text-accent' : 'text-white'}`}>{nivel.title}</h4>
                                            <p className="text-xs text-white/50 leading-relaxed">{nivel.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Anos XP e CNPJ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Tempo de Experiência</label>
                                    <select name="anosExperiencia" value={formData.anosExperiencia} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent appearance-none">
                                        <option value="">Selecione...</option>
                                        <option value="menos_1">Menos de 1 ano</option>
                                        <option value="1_a_3">1 a 3 anos</option>
                                        <option value="3_a_5">3 a 5 anos</option>
                                        <option value="mais_5">Mais de 5 anos</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Possui CNPJ? (MEI)</label>
                                    <select name="cnpjStatus" value={formData.cnpjStatus} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent appearance-none">
                                        <option value="">Selecione...</option>
                                        <option value="sim">Sim, possuo CNPJ</option>
                                        <option value="nao">Não, atuo como Pessoa Física</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Especialidades */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-white/70 uppercase tracking-widest">Especialidades Adicionais</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Montagem de Cozinhas', 'Instalação de TV', 'Marcenaria', 'Móveis de Escritório', 'Desmontagem', 'Instalações Elétricas Básicas'].map(esp => (
                                        <button
                                            key={esp}
                                            type="button"
                                            onClick={() => handleEspecialidade(esp)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${formData.especialidades.includes(esp) ? 'bg-accent border-accent text-primary' : 'bg-transparent border-white/20 text-white/60 hover:border-white/50'}`}
                                        >
                                            {esp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ETAPA 3: DOCUMENTOS */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                         <div className="mb-8 border-b border-white/10 pb-6">
                            <h2 className="text-3xl font-bold font-drama text-white mb-2">Envio de Documentos</h2>
                            <p className="text-white/50">A MontadorPRO é um ambiente seguro. Precisamos confirmar sua identidade para garantir a segurança dos clientes.</p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className={`p-4 border ${formData.docFoto ? 'border-accent bg-accent/5' : 'border-white/10 bg-black/20'} rounded-xl relative overflow-hidden group transition-colors`}>
                                <h4 className="font-bold text-white mb-1">Selfie Clara (Rosto)</h4>
                                <p className="text-xs text-white/40 mb-4">Esta foto será exibida para os clientes.</p>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleDocUpload('docFoto', e.target.files[0])}
                                    className="block w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" 
                                />
                                {formData.docFoto && <span className="absolute top-4 right-4 text-accent"><CheckCircle size={20} /></span>}
                            </div>
                            
                            <div className={`p-4 border ${formData.docRg ? 'border-accent bg-accent/5' : 'border-white/10 bg-black/20'} rounded-xl relative overflow-hidden group transition-colors`}>
                                <h4 className="font-bold text-white mb-1">Documento com Foto (Frente)</h4>
                                <p className="text-xs text-white/40 mb-4">Frente do RG ou CNH</p>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleDocUpload('docRg', e.target.files[0])}
                                    className="block w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" 
                                />
                                {formData.docRg && <span className="absolute top-4 right-4 text-accent"><CheckCircle size={20} /></span>}
                            </div>

                            <div className={`p-4 border ${formData.docCpf ? 'border-accent bg-accent/5' : 'border-white/10 bg-black/20'} rounded-xl relative overflow-hidden group transition-colors`}>
                                <h4 className="font-bold text-white mb-1">Documento com Foto (Verso)</h4>
                                <p className="text-xs text-white/40 mb-4">Verso do RG ou CNH</p>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleDocUpload('docCpf', e.target.files[0])}
                                    className="block w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" 
                                />
                                {formData.docCpf && <span className="absolute top-4 right-4 text-accent"><CheckCircle size={20} /></span>}
                            </div>

                            <div className={`p-4 border ${formData.docComprovante ? 'border-accent bg-accent/5' : 'border-white/10 bg-black/20'} rounded-xl relative overflow-hidden group transition-colors`}>
                                <h4 className="font-bold text-white mb-1">Comprovante de Residência</h4>
                                <p className="text-xs text-white/40 mb-4">Água, luz, ou internet recente.</p>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleDocUpload('docComprovante', e.target.files[0])}
                                    className="block w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" 
                                />
                                {formData.docComprovante && <span className="absolute top-4 right-4 text-accent"><CheckCircle size={20} /></span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* ETAPA 4: TERMOS */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                         <div className="mb-8 border-b border-white/10 pb-6">
                            <h2 className="text-3xl font-bold font-drama text-white mb-2">Termos e Condições</h2>
                            <p className="text-white/50">Por favor, leia atentamente as políticas da nossa parceria.</p>
                        </div>
                        
                        <div className="space-y-6 bg-black/40 p-6 rounded-2xl border border-white/10">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input 
                                        type="checkbox" 
                                        name="aceitoConduta" 
                                        checked={formData.aceitoConduta} 
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/20 bg-primary-dark checked:bg-accent checked:border-accent text-accent focus:ring-accent/50 focus:ring-offset-primary cursor-pointer transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="text-white font-medium group-hover:text-accent transition-colors">Termo de Parceria e Conduta</span>
                                    <p className="text-sm text-white/50 mt-1 leading-relaxed">
                                        Compreendo que a MontadorPRO é intermediadora de serviços. Concordo em agir com profissionalismo, usar trajes adequados, manter a limpeza do local de montagem e ser cordial com o cliente.
                                    </p>
                                </div>
                            </label>

                            <div className="w-full h-px bg-white/10"></div>

                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input 
                                        type="checkbox" 
                                        name="aceitoLGPD" 
                                        checked={formData.aceitoLGPD} 
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/20 bg-primary-dark checked:bg-accent checked:border-accent text-accent focus:ring-accent/50 focus:ring-offset-primary cursor-pointer transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="text-white font-medium group-hover:text-accent transition-colors">Política de Privacidade (LGPD)</span>
                                    <p className="text-sm text-white/50 mt-1 leading-relaxed">
                                        Estou ciente que meus dados pessoais e localização GPS serão coletados e tratados pela plataforma exclusivamente para me direcionar aos serviços e validarem minha identidade, conforme a Lei Geral de Proteção de Dados.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between">
                    {step > 1 ? (
                        <button 
                            onClick={voltar}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
                        >
                            <ArrowLeft size={18} /> Voltar
                        </button>
                    ) : (
                        <div></div> // Spacer para manter 'Avançar' na direita
                    )}

                    {step < 4 ? (
                        <button 
                            onClick={avancar}
                            className="btn-primary group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">Próxima Etapa</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button 
                            onClick={finalizar}
                            disabled={loading || !isStep4Valid()}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin" size={20} /> Processando...</>
                            ) : (
                                <><CheckCircle size={20} /> Finalizar Cadastro</>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CadastroMontador; 
