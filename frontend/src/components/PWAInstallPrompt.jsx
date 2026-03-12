import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detectar se é iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // Capturar o evento de instalação (Chrome/Android)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            
            // Só mostra se ainda não estiver instalado (stand-alone)
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                setIsVisible(true);
            }
        });

        // Verificação manual para Safari/iOS (que não emite beforeinstallprompt)
        if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
            // Verifica se o usuário já fechou hoje
            const hasClosed = localStorage.getItem('pwa_prompt_closed');
            if (!hasClosed) {
                setIsVisible(true);
            }
        }
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setInstallPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_prompt_closed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 z-[9999] animate-[slide-up_0.5s_ease-out]">
            <div className="bg-primary/95 backdrop-blur-2xl border border-accent/30 rounded-[2rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                {/* Linha de brilho decorativa */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
                
                <button 
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-white/40 hover:text-white"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-accent/20 shadow-lg shrink-0">
                        <img src="/favicon.png" alt="App Icon" className="w-10 h-10 object-contain" />
                    </div>
                    
                    <div className="flex-1">
                        <h4 className="text-white font-drama font-bold text-lg tracking-wide italic">Instalar App Pro</h4>
                        <p className="text-white/60 text-xs font-mono mt-1">
                            {isIOS 
                                ? 'Toque no ícone Compartilhar e depois em "Adicionar à Tela de Início"' 
                                : 'Adicione à sua tela para acesso rápido e notificações direto no sistema.'}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    {isIOS ? (
                        <div className="w-full flex items-center justify-center gap-3 bg-white/5 py-4 rounded-xl border border-white/10 text-accent font-bold font-mono text-xs uppercase tracking-widest">
                            <Share size={18} />
                            Aguardando Ação
                        </div>
                    ) : (
                        <button 
                            onClick={handleInstall}
                            className="w-full bg-accent text-primary py-4 rounded-xl font-drama font-bold text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(201,168,76,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Instalar Agora
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
