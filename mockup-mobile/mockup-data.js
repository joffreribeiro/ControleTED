// mockup-mobile/mockup-data.js
// Dados fake para o mockup visual do "Modo Campo" (recorte mobile do Controle-TED).
// Espelha o shape real de `dados.teds` (js/main.js) só com os campos usados nas 3 telas
// do recorte aprovado: Lista, Detalhe, Registro de Entrega. Estados de badge/prazo/borda
// são pré-computados aqui (não reimplementam a lógica real de getDisplayStatus/prazo) —
// isso é só um mockup visual, a lógica de verdade continua em js/main.js.

const MOCK_TEDS = [
    {
        id: 1,
        numTed: '018/2026',
        numTedSiafi: '900001',
        objetivo: 'Aquisição de fardamento operacional para as unidades da 4ª Região Militar',
        orgaoConcedente: 'Comando do Exército',
        upResponsavel: 'FE',
        dataInicio: '15/01/2026',
        dataFim: '15/01/2027',
        valorTed: 2400000,
        gasto: 380000,
        progressoFisico: 22,
        progressoFinanceiro: 16,
        badgeClass: 'badge-execucao',
        badgeText: 'Em Execução',
        borderColor: '#639922',
        prazoClass: 'prazo-ok',
        prazoText: '183d',
        vigenciaVencida: false,
        entregas: [
            { data: '02/07/2026', descricao: 'Fardamento — Lote 1', quantidade: 500, nf: '12345' },
            { data: '18/06/2026', descricao: 'Fardamento — Lote 1', quantidade: 300, nf: '12290' }
        ]
    },
    {
        id: 2,
        numTed: '027/2026',
        numTedSiafi: '900002',
        objetivo: 'Modernização de equipamentos de comunicação tática',
        orgaoConcedente: 'Comando do Exército',
        upResponsavel: 'UA',
        dataInicio: '01/03/2026',
        dataFim: '10/08/2026',
        valorTed: 1150000,
        gasto: 610000,
        progressoFisico: 58,
        progressoFinanceiro: 53,
        badgeClass: 'badge-execucao',
        badgeText: 'Em Execução',
        borderColor: '#639922',
        prazoClass: 'prazo-atencao',
        prazoText: '24d',
        vigenciaVencida: false,
        entregas: [
            { data: '10/07/2026', descricao: 'Rádios táticos — Lote 2', quantidade: 40, nf: '55810' }
        ]
    },
    {
        id: 3,
        numTed: '031/2026',
        numTedSiafi: '900003',
        objetivo: 'Reforma de paióis e depósitos de munição',
        orgaoConcedente: 'Comando do Exército',
        upResponsavel: 'FI',
        dataInicio: '05/02/2026',
        dataFim: '20/07/2026',
        valorTed: 890000,
        gasto: 720000,
        progressoFisico: 81,
        progressoFinanceiro: 80,
        badgeClass: 'badge-execucao',
        badgeText: 'Em Execução',
        borderColor: '#639922',
        prazoClass: 'prazo-critico',
        prazoText: '9d',
        vigenciaVencida: false,
        entregas: [
            { data: '14/07/2026', descricao: 'Reforma — Etapa 3', quantidade: 1, nf: '77120' },
            { data: '01/06/2026', descricao: 'Reforma — Etapa 2', quantidade: 1, nf: '76980' }
        ]
    },
    {
        id: 4,
        numTed: '042/2025',
        numTedSiafi: '900004',
        objetivo: 'Aquisição de viaturas administrativas',
        orgaoConcedente: 'Comando do Exército',
        upResponsavel: 'FE',
        dataInicio: '31/12/2025',
        dataFim: '01/07/2026',
        valorTed: 1000000,
        gasto: 300000,
        progressoFisico: 50,
        progressoFinanceiro: 30,
        badgeClass: 'badge-vigencia-vencida',
        badgeText: 'Em Execução',
        borderColor: '#EF9F27',
        prazoClass: 'prazo-vencido',
        prazoText: 'Vencido há 15d',
        vigenciaVencida: true,
        entregas: [
            { data: '20/03/2026', descricao: 'Viaturas — Lote 1', quantidade: 3, nf: '44120' }
        ]
    },
    {
        id: 5,
        numTed: '009/2025',
        numTedSiafi: '900005',
        objetivo: 'Capacitação técnica de pessoal em manutenção industrial',
        orgaoConcedente: 'Comando do Exército',
        upResponsavel: 'FJF',
        dataInicio: '10/01/2025',
        dataFim: '10/01/2026',
        valorTed: 450000,
        gasto: 448500,
        progressoFisico: 100,
        progressoFinanceiro: 99,
        badgeClass: 'badge-finalizado',
        badgeText: 'TED Finalizado',
        borderColor: '#E24B4A',
        prazoClass: 'prazo-encerrado',
        prazoText: 'Encerrado',
        vigenciaVencida: false,
        entregas: [
            { data: '05/01/2026', descricao: 'Turma final — Certificação', quantidade: 30, nf: '39900' }
        ]
    },
    {
        id: 6,
        numTed: '014/2026',
        numTedSiafi: '900006',
        objetivo: 'Recuperação de pista de pouso e sinalização aeroportuária',
        orgaoConcedente: 'Comando do Exército',
        upResponsavel: 'FMCE',
        dataInicio: '20/01/2026',
        dataFim: '20/01/2027',
        valorTed: 3200000,
        gasto: 0,
        progressoFisico: 0,
        progressoFinanceiro: 0,
        badgeClass: 'badge-planejamento',
        badgeText: 'Planejamento',
        borderColor: '#888780',
        prazoClass: 'prazo-ok',
        prazoText: '188d',
        vigenciaVencida: false,
        entregas: []
    }
];

// Índice do TED pré-selecionado ao abrir a tela de Detalhe/Registrar a partir da Lista.
window.MOCK_TEDS = MOCK_TEDS;
