import React, { useEffect, useState } from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';
import api from '../api/api';

const DocumentosModal = ({ montador, onClose }) => {
    const [docs, setDocs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        const fetchDocs = async () => {
            if (!montador?.id) return;
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/admin/montadores/${montador.id}?view=docs`);
                if (active) setDocs(res.data);
            } catch (err) {
                if (active) setError('Erro ao carregar documentos.');
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchDocs();
        return () => { active = false; };
    }, [montador?.id]);

    if (!montador) return null;

    const documentos = [
        { label: 'Foto Perfil', value: docs?.foto_perfil || docs?.foto_url },
        { label: 'Documento Frente', value: docs?.doc_frente },
        { label: 'Documento Verso', value: docs?.doc_verso },
        { label: 'Comprovante', value: docs?.comprovante_residencia },
        { label: 'Antecedentes', value: docs?.doc_antecedente }
    ].filter(d => d.value);

    const abrirArquivo = (url) => {
        if (!url) return;
        const novaAba = window.open();
        if (!novaAba) return;
        if (url.startsWith('data:image') || url.startsWith('http')) {
            novaAba.document.write(
                `<body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;">
                    <img src="${url}" style="max-width:100%;max-height:100vh;box-shadow:0 0 50px rgba(0,0,0,0.5)" />
                </body>`
            );
        } else {
            novaAba.location.href = url;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-primary-light/10 overflow-hidden">
                <div className="bg-primary p-6 flex items-center justify-between text-background">
                    <div className="flex items-center gap-3">
                        <div className="bg-accent/20 p-2 rounded-xl">
                            <FileText className="text-accent" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-sans font-bold">Documentos</h3>
                            <p className="text-xs text-background/60">{montador.nome}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-3">
                    {loading && (
                        <div className="text-center py-8 text-primary-light/50 font-mono text-xs uppercase tracking-widest">
                            Carregando documentos...
                        </div>
                    )}
                    {!loading && error && (
                        <div className="text-center py-8 text-red-400/70 font-mono text-xs uppercase tracking-widest">
                            {error}
                        </div>
                    )}
                    {!loading && !error && documentos.length === 0 && (
                        <div className="text-center py-8 text-primary-light/50 font-mono text-xs uppercase tracking-widest">
                            Nenhum documento enviado
                        </div>
                    )}
                    {!loading && !error && documentos.length > 0 && documentos.map((doc) => (
                            <button
                                key={doc.label}
                                onClick={() => abrirArquivo(doc.value)}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-primary-light/10 hover:border-accent/30 hover:bg-accent/5 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                        <ImageIcon size={18} className="text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-primary">{doc.label}</p>
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-primary-light/40">Visualizar arquivo</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono uppercase tracking-widest text-accent">Abrir</span>
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default DocumentosModal;
