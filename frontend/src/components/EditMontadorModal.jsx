import React, { useState } from 'react';
import { X, Save, User, Phone, MapPin, Shield } from 'lucide-react';
import api from '../api/api';

const EditMontadorModal = ({ montador, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        nome: montador.nome || '',
        telefone: montador.telefone || '',
        cidade: montador.cidade || '',
        role: montador.role || 'montador',
        status: montador.status || 'pendente'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch(`/admin/montadores/${montador.id}`, formData);
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Erro ao atualizar montador:', err);
            alert('Erro ao atualizar montador.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-primary-light/10 overflow-hidden animate-[scale-up_0.3s_ease-out]">
                <div className="bg-primary p-6 flex items-center justify-between text-background">
                    <div className="flex items-center gap-3">
                        <div className="bg-accent/20 p-2 rounded-xl">
                            <Shield className="text-accent" size={20} />
                        </div>
                        <h3 className="text-xl font-sans font-bold">Editar Profissional</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono font-bold uppercase tracking-widest text-primary-light/40 flex items-center gap-2">
                                <User size={14} className="text-accent" /> Nome Completo
                            </label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full bg-background border border-primary-light/10 rounded-2xl px-5 py-3.5 font-sans text-primary focus:ring-1 focus:ring-accent outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-bold uppercase tracking-widest text-primary-light/40 flex items-center gap-2">
                                    <Phone size={14} className="text-accent" /> Telefone
                                </label>
                                <input
                                    type="text"
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                    className="w-full bg-background border border-primary-light/10 rounded-2xl px-5 py-3.5 font-sans text-primary focus:ring-1 focus:ring-accent outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-bold uppercase tracking-widest text-primary-light/40 flex items-center gap-2">
                                    <MapPin size={14} className="text-accent" /> Cidade
                                </label>
                                <input
                                    type="text"
                                    value={formData.cidade}
                                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                    className="w-full bg-background border border-primary-light/10 rounded-2xl px-5 py-3.5 font-sans text-primary focus:ring-1 focus:ring-accent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-bold uppercase tracking-widest text-primary-light/40 flex items-center gap-2">
                                    Nível de Acesso
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-background border border-primary-light/10 rounded-2xl px-5 py-3.5 font-sans text-primary focus:ring-1 focus:ring-accent outline-none appearance-none transition-all cursor-pointer"
                                >
                                    <option value="montador">Montador</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-bold uppercase tracking-widest text-primary-light/40 flex items-center gap-2">
                                    Status Atual
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-background border border-primary-light/10 rounded-2xl px-5 py-3.5 font-sans text-primary focus:ring-1 focus:ring-accent outline-none appearance-none transition-all cursor-pointer"
                                >
                                    <option value="pendente">Pendente</option>
                                    <option value="aprovado">Aprovado</option>
                                    <option value="rejeitado">Rejeitado</option>
                                    <option value="disponivel">Disponivel</option>
                                    <option value="indisponivel">Indisponivel</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-primary-light/5 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 font-mono text-xs font-bold uppercase tracking-widest text-primary-light/40 hover:text-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] btn-primary flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div> : <Save size={18} />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditMontadorModal;
