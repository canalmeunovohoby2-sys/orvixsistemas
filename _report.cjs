const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = require('docx');
const fs = require('fs');

const H = (t, lvl=HeadingLevel.HEADING_1) => new Paragraph({ heading: lvl, children:[new TextRun({text:t, bold:true})] });
const P = (t, opts={}) => new Paragraph({ children:[new TextRun({text:t, ...opts})], spacing:{after:120} });
const B = (t) => new Paragraph({ bullet:{level:0}, children:[new TextRun(t)] });
const code = (t) => new Paragraph({ children:[new TextRun({text:t, font:'Consolas', size:18})], spacing:{after:80} });

const cell = (t, bold=false) => new TableCell({ children:[new Paragraph({children:[new TextRun({text:t, bold})]})] });
const row = (cells) => new TableRow({ children: cells.map((c,i)=>cell(c, i===0)) });

const table = new Table({
  width:{size:100, type:WidthType.PERCENTAGE},
  rows: [
    new TableRow({ children:[cell('Arquivo',true), cell('Tipo de mudança',true)] }),
    row(['src/lib/mock-data.ts','Reescrita de CATS, SUPS, PROD_SEEDS e TOP_PRODUCTS']),
    row(['src/routes/produtos.tsx','Categoria como input de texto livre + placeholder universal']),
    row(['src/components/HelpCenter.tsx','Exemplos do manual adaptados ao varejo geral']),
  ]
});

const doc = new Document({
  sections:[{
    children:[
      H('Relatório de Refatoração — Generalização do Sistema (Nicho Agnóstico)'),
      P('Data: 28 de junho de 2026', {italics:true}),
      P('Versão: Meu Saas — release atual'),

      H('1. Objetivo', HeadingLevel.HEADING_2),
      P('Eliminar o foco rígido em materiais de construção do ERP/PDV, tornando o sistema agnóstico de segmento e adequado a lojas de variedades, utilidades domésticas, minimercados, papelarias, hortifrutis e comércios em geral. Preservar 100% das regras lógicas de fracionamento, atalhos de teclado, crediário e relatórios.'),

      H('2. Arquivos impactados', HeadingLevel.HEADING_2),
      table,
      P(''),

      H('3. Mudanças detalhadas', HeadingLevel.HEADING_2),

      H('3.1 src/lib/mock-data.ts — Mocks de varejo geral', HeadingLevel.HEADING_3),
      B('CATS reescrito de [Cimento, Tintas, Hidráulica, Elétrica, Ferragens, Madeiras, Pisos, Ferramentas] para [Alimentos, Bebidas, Limpeza, Higiene, Hortifruti, Papelaria, Eletrônicos, Utilidades, Vestuário, Variedades].'),
      B('SUPS trocados de fornecedores de construção (Votorantim, Suvinil, Tigre, Tramontina, Gerdau, Eucatex) para distribuidores genéricos (Distribuidora Central, Atacado União, Comercial Brasil, Importadora Norte, Distribuidora Sul, Atacadão Geral).'),
      B('PROD_NAMES + heurística de unidade substituídos por PROD_SEEDS — array tipado de 33 itens com {name, unit, category} pré-classificados, cobrindo intencionalmente:'),
      B('  • Itens unitários (un): arroz, açúcar, refrigerante, sabão, vassoura, pilha, lâmpada, caderno, caneta, papel higiênico…'),
      B('  • Itens por peso (kg): banana, tomate, maçã, batata, queijo mussarela, presunto.'),
      B('  • Itens por metro (m): tecido algodão, fita LED, mangueira de jardim, corda.'),
      B('  • Itens por volume (L): suco a granel.'),
      B('TOP_PRODUCTS atualizado para refletir os campeões de giro de um varejo comum (arroz, refrigerante, sabão em pó, banana, detergente, papel higiênico).'),
      B('MOVEMENTS agora usa PROD_SEEDS.name no lugar do antigo PROD_NAMES — integridade do histórico de estoque mantida.'),
      B('Faixa de custo ajustada de num(8, 450) para num(3, 180) para refletir o ticket médio do varejo de bairro.'),

      H('3.2 src/routes/produtos.tsx — Categoria livre e placeholder universal', HeadingLevel.HEADING_3),
      B('Campo Categoria deixou de ser um <select> com opções fixas de construção e passou a ser um <input type="text"> livre, permitindo digitar qualquer rótulo (ex: Alimentos, Papelaria, Eletrônicos, Utensílios).'),
      B('Placeholder do nome do produto alterado de "Ex: Cimento CP-II 50kg" para "Ex: Produto ou Item Comercial".'),
      B('Placeholder da Categoria: "Ex: Alimentos, Papelaria, Eletrônicos…".'),
      B('Filtros laterais da tabela (Todos / Estoque baixo / Inativos) permanecem — não havia sub-aba rígida de categorias de construção a remover.'),

      H('3.3 src/components/HelpCenter.tsx — Manual neutralizado', HeadingLevel.HEADING_3),
      B('Exemplo de quantidade decimal trocado: antes "2.5 metros de cabo" → agora "1.250 kg de produto a granel ou 2.5 m de tecido".'),
      B('Texto sobre unidades inteiras reescrito para "itens vendidos em caixas/unidades (un) travam em números inteiros".'),
      B('Filtro de reposição: "isolar os insumos críticos" → "isolar os produtos críticos".'),
      B('Todas as demais seções (atalhos F1/F2/F4/F12, split de pagamento, FIFO do crediário, taxas de maquininha, Curva ABC) preservadas sem alteração.'),

      H('4. Preservação de regras críticas', HeadingLevel.HEADING_2),
      B('Engenharia de fracionamento por unidade (un, m, m², m³, kg, L) — intocada.'),
      B('Alertas visuais de estoque mínimo e filtro "⚠ Necessita Reposição" — intocados.'),
      B('Atalhos globais do PDV (F1 busca, F2 desconto, F4 pagamento, F12 conclusão, Esc cancela) — intocados.'),
      B('Sistema de split de pagamento e bloqueio de limite de crediário — intocados.'),
      B('Fechamento de caixa com taxas reais e Curva ABC — intocados.'),

      H('5. Validação', HeadingLevel.HEADING_2),
      B('Typecheck: bunx tsgo --noEmit → 0 erros.'),
      B('Compatibilidade Light/Dark Mode preservada (todas as cores via variáveis semânticas).'),
      B('Nenhum import quebrado; PROD_SEEDS substitui PROD_NAMES em todas as referências internas.'),

      H('6. Resultado prático', HeadingLevel.HEADING_2),
      P('O sistema deixou de ser percebido como vertical de "depósito de construção" e passou a operar como ERP/PDV horizontal, pronto para demonstração comercial em qualquer segmento de varejo tradicional — desde minimercados de bairro até papelarias, lojas de variedades e utilidades domésticas. O lojista pode cadastrar sua própria taxonomia de categorias livremente, sem termos técnicos pré-definidos.'),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/documents/Relatorio_Generalizacao_Varejo.docx', buf);
  console.log('OK');
});
