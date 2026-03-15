import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle, Clock, MapPin, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
    const navigate = useNavigate();
    const landingRef = useRef(null);
    const featureRef = useRef(null);
    const philosophyRef = useRef(null);
    const protocolRef = useRef(null);
    const shufflerCardRef = useRef(null);
    const shufflerCards = useRef([]);
    const typewriterRef = useRef(null);
    const schedulerRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            // --- Hero Animation (Split Fade Up) ---
            gsap.fromTo('.hero-text',
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
            );

            // --- Philosophy SplitText (Simulated) ---
            gsap.fromTo('.phil-text',
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out',
                    scrollTrigger: {
                        trigger: philosophyRef.current,
                        start: 'top 70%',
                    }
                }
            );

            // --- Protocol Sticky Stacking ---
            const protocolCards = gsap.utils.toArray('.protocol-card');
            protocolCards.forEach((card, i) => {
                if (i < protocolCards.length - 1) {
                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top top',
                        endTrigger: protocolCards[protocolCards.length - 1],
                        end: 'top top',
                        pin: true,
                        pinSpacing: false,
                    });

                    gsap.to(card, {
                        scale: 0.9,
                        opacity: 0.5,
                        filter: 'blur(10px)',
                        scrollTrigger: {
                            trigger: protocolCards[i + 1],
                            start: 'top bottom',
                            end: 'top top',
                            scrub: true,
                        }
                    });
                } else {
                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top top',
                        end: '+=100%',
                        pin: true,
                    });
                }
            });

        }, landingRef); // Escopo global do componente

        // --- Shuffler Card Interaction ---
        const shuffleInterval = setInterval(() => {
            if (shufflerCards.current.length) {
                const first = shufflerCards.current.shift();
                shufflerCards.current.push(first);
                gsap.to(shufflerCards.current, {
                    y: (i) => i * 15,
                    scale: (i) => 1 - (2 - i) * 0.05,
                    zIndex: (i) => i,
                    opacity: (i) => 0.5 + (i * 0.25),
                    duration: 0.6,
                    ease: 'back.out(1.5)',
                    stagger: 0.05
                });
            }
        }, 3000);

        // --- Typewriter Effect ---
        const messages = ["Processando status da OS #0452...", "Montador alocado: João S.", "Tracking GPS ativado.", "Finalizada com sucesso."];
        let msgIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeWriterTimeout;

        const typeWriter = () => {
            if (!typewriterRef.current) return;

            const currentMsg = messages[msgIndex];

            if (isDeleting) {
                typewriterRef.current.innerText = currentMsg.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typewriterRef.current.innerText = currentMsg.substring(0, charIndex + 1);
                charIndex++;
            }

            let speed = isDeleting ? 30 : 70;

            if (!isDeleting && charIndex === currentMsg.length) {
                speed = 2000; // Pause at end
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                msgIndex = (msgIndex + 1) % messages.length;
                speed = 500; // Pause before next word
            }

            typeWriterTimeout = setTimeout(typeWriter, speed);
        };

        typeWriterTimeout = setTimeout(typeWriter, 1000);

        return () => {
            ctx.revert();
            clearInterval(shuffleInterval);
            clearTimeout(typeWriterTimeout);
        };
    }, []);

    return (
        <div ref={landingRef} className="bg-primary text-white min-h-screen relative font-sans overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary/80 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 flex items-center justify-between w-[90%] max-w-5xl shadow-2xl shadow-black/50 transition-all">
                <div className="font-drama text-2xl font-bold italic tracking-wider text-white">Montador<span className="text-accent">Pro</span></div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-white/70">
                    <a href="#features" className="hover:text-accent transition-colors">Features</a>
                    <a href="#philosophy" className="hover:text-accent transition-colors">Manifesto</a>
                    <a href="#protocol" className="hover:text-accent transition-colors">Protocol</a>
                </div>
                <button onClick={() => navigate('/login')} className="bg-accent hover:bg-accent-hover text-primary py-2 px-6 rounded-full text-sm font-bold transition-all">
                    Acessar Sistema
                </button>
            </nav>

            {/* Hero Section */}
            <section className="h-[100dvh] relative flex flex-col justify-end pb-24 px-8 md:px-24 bg-[url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"></div>

                <div className="relative z-10 max-w-4xl">
                    <p className="hero-text text-accent font-mono uppercase tracking-[0.2em] mb-4 text-sm font-bold flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-accent inline-block"></span> A Marcenaria que encontra a
                    </p>
                    <h1 className="hero-text text-5xl md:text-8xl font-sans font-bold text-white leading-[1.1] tracking-tight mb-2">
                        A Marcenaria que encontra a <br />
                        <span className="font-drama italic text-7xl md:text-9xl text-accent font-light block mt-4">Perfeição.</span>
                    </h1>
                    <p className="hero-text text-lg md:text-xl text-white/80 max-w-2xl mt-8 mb-10 font-light leading-relaxed">
                        Móveis sob medida com qualidade premium em Goiás. Do projeto 3D à instalação final, transformamos seu ambiente com exclusividade.
                    </p>
                    <button onClick={() => navigate('/login')} className="hero-text btn-primary text-lg px-8 py-4">
                        Experimente Agora
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" ref={featureRef} className="py-32 px-8 md:px-24 bg-primary relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="mb-20 text-center">
                        <h2 className="text-sm font-mono text-accent uppercase tracking-widest mb-4">Artefatos Operacionais</h2>
                        <h3 className="text-4xl md:text-6xl font-sans font-bold text-white tracking-tight">Instrumentos de Controle</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1: Shuffler - Gestão em Tempo Real */}
                        <div className="bg-primary-dark/80 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col h-[400px]">
                            <h4 className="font-sans font-bold text-2xl text-white mb-2">Gestão em Tempo Real</h4>
                            <p className="text-white/60 text-sm mb-8">Tracking de montadores e status da frota ao vivo no mapa.</p>

                            <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black/50 mt-4">
                                {/* Dark Map Background */}
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-transparent to-transparent"></div>
                                
                                <div className="relative w-full max-w-[240px] h-[160px]" ref={shufflerCardRef}>
                                    {[
                                        { label: "Status: Em Rota (Felipe)", icon: <MapPin size={16} />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                        { label: "OS #0452 Pendente", icon: <Clock size={16} />, color: "text-amber-500", bg: "bg-amber-500/10" },
                                        { label: "Ricardo S. Online", icon: <CheckCircle size={16} />, color: "text-blue-500", bg: "bg-blue-500/10" }
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            ref={el => shufflerCards.current[i] = el}
                                            className="absolute bottom-4 w-full bg-primary-dark/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center gap-3"
                                            style={{ transform: `translateY(${i * 15}px) scale(${1 - (2 - i) * 0.05})`, zIndex: i, opacity: 0.5 + (i * 0.25) }}
                                        >
                                            <div className={`p-2 rounded-full ${item.bg} ${item.color}`}>
                                                {item.icon}
                                            </div>
                                            <span className="font-medium text-sm text-white">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Typewriter - Controle Completo */}
                        <div className="bg-primary-dark/80 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col h-[400px]">
                            <h4 className="font-sans font-bold text-2xl text-white mb-2">Controle Completo</h4>
                            <p className="text-white/60 text-sm mb-8">Auditoria de ponta a ponta e log de execução financeiro.</p>

                            <div className="flex-1 bg-black/80 rounded-2xl p-6 relative overflow-hidden flex flex-col border border-white/5 mt-4">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
                                <div className="relative z-10 flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Live Trace Feed</span>
                                </div>
                                <p className="relative z-10 font-mono text-sm text-accent leading-relaxed mt-auto shadow-black drop-shadow-md">
                                    <span ref={typewriterRef}></span><span className="animate-pulse">_</span>
                                </p>
                            </div>
                        </div>

                        {/* Card 3: Scheduler - Automação Operacional */}
                        <div className="bg-primary-dark/80 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col h-[400px]">
                            <h4 className="font-sans font-bold text-2xl text-white mb-2">Automação</h4>
                            <p className="text-white/60 text-sm mb-8">Roteirização e agendamentos inteligentes da sua operação.</p>

                            <div className="flex-1 border border-white/10 rounded-2xl p-4 relative bg-black/30 mt-4 overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
                                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]"></div>
                                <div className="grid grid-cols-5 gap-2 h-full relative z-10">
                                    {[...Array(15)].map((_, i) => (
                                        <div key={i} className={`rounded-md border border-white/10 transition-colors duration-1000 ${i === 7 ? 'bg-accent/20 border-accent/50 shadow-[0_0_15px_rgba(201,168,76,0.3)] backdrop-blur-md' : 'bg-black/40 hover:bg-white/10 backdrop-blur-sm'} flex items-center justify-center`}>
                                            {i === 7 && <Zap size={14} className="text-accent" />}
                                        </div>
                                    ))}
                                </div>
                                {/* Mock SVG Cursor moving over */}
                                <svg className="absolute top-1/2 left-1/2 -ml-2 -mt-4 w-6 h-6 text-white animate-[bounce_3s_ease-in-out_infinite] z-20 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 5z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy Section */}
            <section id="philosophy" ref={philosophyRef} className="py-40 px-8 md:px-24 bg-primary-dark relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

                <div className="max-w-5xl mx-auto relative z-10 flex flex-col justify-center min-h-[50vh]">
                    <p className="phil-text text-white/60 text-2xl md:text-4xl font-light mb-12 max-w-2xl leading-relaxed">
                        A maioria do setor foca em processos <br className="hidden md:block" /> manuais e planilhas desorganizadas.
                    </p>
                    <p className="phil-text text-white text-5xl md:text-8xl font-sans tracking-tight leading-[1.1]">
                        Nós focamos em <br />
                        <span className="font-drama italic text-accent font-light">controle absoluto.</span>
                    </p>
                </div>
            </section>

            {/* Protocol Stacking Section */}
            <section id="protocol" ref={protocolRef} className="bg-primary relative">
                {/* Card 1 */}
                <div className="protocol-card h-screen w-full flex items-center justify-center sticky top-0 bg-primary border-b border-white/5">
                    <div className="max-w-4xl mx-auto px-8 w-full flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 relative h-64 md:h-96 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop" alt="Recebimento da OS" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" />
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/80 to-transparent"></div>
                            {/* Decorative Corner */}
                            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-accent/50"></div>
                            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-accent/50"></div>
                        </div>
                        <div className="flex-1">
                            <span className="font-mono text-accent text-sm tracking-widest uppercase block mb-4">FASE 01.</span>
                            <h2 className="text-5xl font-sans font-bold text-white tracking-tight mb-6">Recebimento da OS</h2>
                            <p className="text-white/70 text-lg font-light leading-relaxed">Integre seus pedidos e orçamentos num fluxo único. As ordens de serviço entram no sistema já formatadas para execução.</p>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="protocol-card h-screen w-full flex items-center justify-center sticky top-0 bg-primary border-b border-white/5">
                    <div className="max-w-4xl mx-auto px-8 w-full flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 relative h-64 md:h-96 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" alt="Roteirização Mapa" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" />
                            <div className="absolute inset-0 bg-gradient-to-l from-primary-dark via-primary-dark/80 to-transparent md:hidden"></div>
                            
                            {/* Radar Sweep Effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-accent/20"></div>
                            <div className="absolute top-1/2 left-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent to-accent origin-left animate-[spin_4s_linear_infinite]"></div>
                            
                            {/* Map Pin */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent bg-primary-dark/80 p-3 rounded-full border border-accent/30 shadow-[0_0_20px_rgba(201,168,76,0.3)]">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <span className="font-mono text-accent text-sm tracking-widest uppercase block mb-4">FASE 02.</span>
                            <h2 className="text-5xl font-sans font-bold text-white tracking-tight mb-6">Roteirização Inteligente</h2>
                            <p className="text-white/70 text-lg font-light leading-relaxed">O sistema identifica o melhor montador ativo no mapa e notifica proativamente. Minimizando tempo e distância de deslocamento.</p>
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="protocol-card h-screen w-full flex items-center justify-center sticky top-0 bg-primary shadow-2xl">
                    <div className="max-w-4xl mx-auto px-8 w-full flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 relative h-64 md:h-96 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop" alt="Tracking Execução" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" />
                            <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]"></div>
                            
                            {/* Shield Centerpiece */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="w-32 h-32 rounded-full bg-primary-dark/90 backdrop-blur-md flex items-center justify-center border border-accent/30 shadow-[0_0_30px_rgba(201,168,76,0.2)]">
                                    <div className="absolute inset-0 rounded-full border border-accent/50 animate-ping opacity-30"></div>
                                    <ShieldCheck size={48} className="text-accent" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <span className="font-mono text-accent text-sm tracking-widest uppercase block mb-4">FASE 03.</span>
                            <h2 className="text-5xl font-sans font-bold text-white tracking-tight mb-6">Tracking Execução</h2>
                            <p className="text-white/70 text-lg font-light leading-relaxed">Auditoria visual e fechamento em tempo real. O montador finaliza o serviço via app, gera faturamento e atualiza o seu dashboard.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Table */}
            <section className="py-28 px-8 md:px-24 bg-primary-dark border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs font-mono text-accent uppercase tracking-widest mb-3">Ganhe por Projeto</p>
                        <h2 className="text-4xl md:text-6xl font-sans font-bold text-white tracking-tight">Tabela de Valores</h2>
                        <p className="text-white/60 text-sm md:text-base mt-4">Quanto mais complexo o trabalho, maior o seu ganho.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Simples', valor: 'R$300', desc: 'Quarto ou cozinha basica' },
                            { label: 'Medio', valor: 'R$600', desc: 'Cozinha completa ou closet' },
                            { label: 'Complexo', valor: 'R$900', desc: 'Ambientes integrados' },
                            { label: 'Super Luxo', valor: 'R$1200', desc: 'Projetos premium completos' }
                        ].map((plan) => (
                            <div key={plan.label} className="bg-primary/70 border border-white/10 rounded-3xl p-7 text-center shadow-2xl hover:shadow-accent/20 hover:-translate-y-1 transition-all">
                                <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-3">{plan.label}</div>
                                <div className="font-drama text-5xl text-accent mb-2">{plan.valor}</div>
                                <p className="text-xs text-white/50">{plan.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing / Call to Action */}
            <section className="py-40 px-8 bg-primary-dark border-t border-white/5">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-5xl md:text-7xl font-sans font-bold text-white leading-tight mb-8 tracking-tight">
                        Pronto para assumir o <span className="font-drama italic text-accent font-light">Controle</span>.
                    </h2>
                    <div className="flex justify-center mt-12">
                        <button onClick={() => navigate('/login')} className="btn-primary text-xl px-12 py-5 uppercase tracking-wide font-mono">
                            Acessar Primeira Classe
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-primary pt-24 pb-12 px-8 rounded-t-[4rem]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
                    <div>
                        <div className="font-drama text-2xl font-bold italic tracking-wider text-white mb-4">Montador<span className="text-accent">Pro</span></div>
                        <p className="text-white/50 font-light text-sm max-w-xs">A plataforma definitiva para gestão de alta performance operacional.</p>

                        <div className="mt-8 flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <span className="font-mono text-emerald-500 text-xs uppercase tracking-widest">System Operational</span>
                        </div>
                    </div>
                    <div className="flex gap-16 text-sm">
                        <div className="flex flex-col gap-4 text-white/60">
                            <span className="text-white font-mono font-bold tracking-widest uppercase text-xs mb-2">Plataforma</span>
                            <a href="#" className="hover:text-accent transition-colors">Workspace</a>
                            <a href="#" className="hover:text-accent transition-colors">Integrações</a>
                            <a href="#" className="hover:text-accent transition-colors">Preços</a>
                        </div>
                        <div className="flex flex-col gap-4 text-white/60">
                            <span className="text-white font-mono font-bold tracking-widest uppercase text-xs mb-2">Firma</span>
                            <a href="#" className="hover:text-accent transition-colors">Manifesto</a>
                            <a href="#" className="hover:text-accent transition-colors">Legal</a>
                            <a href="#" className="hover:text-accent transition-colors">Suporte</a>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-background/10 text-center md:text-left flex flex-col md:flex-row justify-between text-xs font-mono text-white/40">
                    <div className="flex flex-col gap-2">
                        <span>© 2026 MontadorPro Systems. All rights reserved.</span>
                        <span>Desenhado por <a href="https://portfolio-renato-beta.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors underline decoration-accent/30 underline-offset-4">Renato Rocha</a></span>
                    </div>
                    <span className="mt-4 md:mt-0 uppercase tracking-widest">Strictly Precision.</span>
                </div>
            </footer>

            {/* Global Noise applied via CSS but can inject empty div here if needed by user setup */}
            <div className="noise-overlay"></div>
        </div>
    );
};

export default Landing;
