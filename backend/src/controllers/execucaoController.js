const prisma = require('../config/db');
const { estaNoRaio } = require('../utils/geoUtils');

// Mappers internos
const mapExecucaoResponse = (exec) => {
    if (!exec) return exec;
    return {
        ...exec,
        ordem_numero: exec.ordem?.numero,
        cliente_nome: exec.ordem?.clienteNome,
        cliente_contato: exec.ordem?.clienteContato,
        endereco: exec.ordem?.endereco,
        fotos: exec.fotos?.map(f => f.url) || []
    };
};

// Controllers
exports.getAtiva = async (req, res) => {
    try {
        const mid = req.montadorId;

        const exec = await prisma.execucao.findFirst({
            where: { montadorId: mid, status: 'em_andamento' },
            include: {
                ordem: {
                    include: { cliente: true }
                },
                fotos: true
            }
        });

        if (!exec) return res.json(null);
        res.json(mapExecucaoResponse(exec));
    } catch (err) {
        console.error('Erro ao buscar execucao ativa:', err);
        res.status(500).json({ error: 'Erro interno' });
    }
};

exports.iniciarChegada = async (req, res) => {
    try {
        const { osId, lat, lng } = req.body;
        const mid = req.montadorId;

        if (!osId || !lat || !lng) return res.status(400).json({ error: 'Dados incompletos.' });

        const os = await prisma.ordemServico.findUnique({ where: { id: parseInt(osId) } });
        if (!os) return res.status(404).json({ error: 'OS nao encontrada.' });

        // Validação de Janela de Tempo (±30 minutos do agendado)
        const agora = new Date();
        const agendado = new Date(os.dataInstalacao);
        const diffMinutos = Math.abs((agora - agendado) / 1000 / 60);
        
        if (diffMinutos > 30) {
            return res.status(403).json({ 
                error: `Fora da janela de tempo. Seu agendamento foi para as ${agendado.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` 
            });
        }

        // Validação geográfica (200m)
        if (!estaNoRaio(lat, lng, os.lat, os.lng, 200)) {
            return res.status(403).json({ error: 'Distancia superior a 200m do local.' });
        }

        const updated = await prisma.execucao.updateMany({
            where: { ordemId: parseInt(osId), montadorId: mid, status: 'em_andamento' },
            data: {
                status: 'chegou',
                chegadaAt: new Date(),
                latChegada: parseFloat(lat),
                lngChegada: parseFloat(lng)
            }
        });

        if (updated.count === 0) return res.status(404).json({ error: 'Execucao nao encontrada ou ja processada.' });

        res.json({ sucesso: true, mensagem: 'Chegada confirmada.' });
    } catch (err) {
        console.error('Erro ao registrar chegada:', err);
        res.status(500).json({ error: 'Erro ao registrar chegada' });
    }
};

exports.uploadFotos = async (req, res) => {
    try {
        const { id } = req.params; // ordemId (ou execId, mas a rota usa osId habitualmente)
        const mid = req.montadorId;

        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Arquivos nao enviados.' });

        const exec = await prisma.execucao.findFirst({
            where: { ordemId: parseInt(id), montadorId: mid, status: 'em_andamento' }
        });

        if (!exec) return res.status(404).json({ error: 'Execucao ativa nao encontrada.' });

        const fotosCriadas = await Promise.all(req.files.map(file => {
            return prisma.foto.create({
                data: {
                    execucaoId: exec.id,
                    url: `/uploads/${file.filename}`,
                    tipo: 'instalacao'
                }
            });
        }));

        res.json({ sucesso: true, count: fotosCriadas.length });
    } catch (err) {
        console.error('Erro no upload de fotos:', err);
        res.status(500).json({ error: 'Erro ao salvar fotos' });
    }
};

exports.finalizarExecucao = async (req, res) => {
    try {
        const { id } = req.params; // ordemId
        const { nota, observacao } = req.body;
        const mid = req.montadorId;

        const exec = await prisma.execucao.findFirst({
            where: { ordemId: parseInt(id), montadorId: mid, status: 'em_andamento' },
            include: { _count: { select: { fotos: true } } }
        });

        if (!exec) return res.status(404).json({ error: 'Execucao ativa nao encontrada.' });
        
        // Validação de fotos (mínimo 4)
        if (exec._count.fotos < 4) {
             return res.status(400).json({ error: 'Mínimo de 4 fotos obrigatório para finalizar.' });
        }

        await prisma.$transaction([
            prisma.execucao.update({
                where: { id: exec.id },
                data: {
                    status: 'concluida',
                    conclusaoAt: new Date()
                }
            }),
            prisma.ordemServico.update({
                where: { id: parseInt(id) },
                data: { status: 'concluida' }
            }),
            prisma.montador.update({
                where: { id: mid },
                data: { status: 'disponivel' }
            }),
            ...(nota !== undefined ? [
                prisma.avaliacao.create({
                    data: {
                        ordemId: parseInt(id),
                        montadorId: mid,
                        nota: parseFloat(nota),
                        comentario: observacao || ''
                    }
                })
            ] : [])
        ]);

        res.json({ sucesso: true, mensagem: 'Servico finalizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao finalizar execucao:', err);
        res.status(500).json({ error: 'Erro ao finalizar servico.' });
    }
};
