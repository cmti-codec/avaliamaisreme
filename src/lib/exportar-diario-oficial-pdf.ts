import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DadosDiario {
  turma: {
    turma: string;
    etapa_modalidade: string;
    grupo_ano: string;
    turno: string;
  };
  componente_curricular: string;
  turno_diario?: string | null;
  professor: {
    nome: string;
    matricula?: string;
  };
}

interface AlunoFrequencia {
  id: string;
  nomalu: string;
  numalu: string;
  frequencias: Array<{
    data_aula: string;
    tempo: number;
    presente: boolean;
  }>;
  total_presencas: number;
  total_faltas: number;
  percentual_presenca: number;
}

interface AlunoAvaliacao {
  id: string;
  nomalu: string;
  avaliacoes: Array<{
    titulo: string;
    tipo_avaliacao: string;
    data_avaliacao: string;
    nota: number | null;
    nota_maxima: number;
  }>;
  media: number | null;
}

/**
 * Exporta o diário de classe no formato oficial SEMED Campo Grande
 * Replica o layout do diário impresso oficial com 3 páginas:
 * - Página 1: Grid de frequências (datas x alunos)
 * - Página 2: Conteúdo ministrado e assinaturas
 * - Página 3: Canhoto com resumo de faltas e aproveitamento
 */
export const exportarDiarioOficialPDF = (
  dadosDiario: DadosDiario,
  alunosFrequencia: AlunoFrequencia[],
  alunosAvaliacoes: AlunoAvaliacao[],
  bimestre: { numero: number; data_inicio: string; data_fim: string },
  escolaNome: string
) => {
  const anoLetivo = new Date(bimestre.data_inicio).getFullYear();
  
  // Página 1: Frequências
  const pagina1HTML = gerarPagina1Frequencias(
    dadosDiario,
    alunosFrequencia,
    bimestre,
    escolaNome,
    anoLetivo
  );
  
  // Página 2: Conteúdo Ministrado
  const pagina2HTML = gerarPagina2Conteudo(
    dadosDiario,
    bimestre,
    alunosFrequencia
  );
  
  // Página 3: Canhoto (Resumo)
  const pagina3HTML = gerarPagina3Canhoto(
    dadosDiario,
    alunosFrequencia,
    alunosAvaliacoes,
    bimestre,
    escolaNome,
    anoLetivo
  );

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Diário Oficial - ${dadosDiario.turma.turma} - ${bimestre.numero}º Bimestre</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.3;
            color: #000;
          }
          
          .page {
            page-break-after: always;
            min-height: 277mm;
            padding: 10mm;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          .header-oficial {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 2px solid #000;
          }
          
          .header-oficial h1 {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          
          .header-oficial h2 {
            font-size: 9pt;
            font-weight: normal;
            margin-bottom: 2px;
          }
          
          .header-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 8pt;
            font-weight: bold;
          }
          
          .titulo-diario {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin: 10px 0;
            text-decoration: underline;
          }
          
          .info-professor {
            margin-bottom: 10px;
            font-size: 9pt;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          
          .info-label {
            font-weight: bold;
          }
          
          .tabela-previsao {
            width: 200px;
            float: right;
            margin-left: 10px;
            margin-bottom: 10px;
            border-collapse: collapse;
            font-size: 8pt;
          }
          
          .tabela-previsao th,
          .tabela-previsao td {
            border: 1px solid #000;
            padding: 3px 5px;
            text-align: center;
          }
          
          .tabela-previsao th {
            background-color: #e0e0e0;
            font-weight: bold;
          }
          
          .grid-frequencias {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
            clear: both;
          }
          
          .grid-frequencias th,
          .grid-frequencias td {
            border: 1px solid #000;
            padding: 2px 3px;
            text-align: center;
            min-width: 20px;
          }
          
          .grid-frequencias th {
            background-color: #e0e0e0;
            font-weight: bold;
          }
          
          .grid-frequencias .col-dia {
            min-width: 30px;
            font-weight: bold;
          }
          
          .grid-frequencias .col-aluno {
            min-width: 25px;
          }
          
          .marca-falta {
            color: #c00;
            font-weight: bold;
          }
          
          .marca-presente {
            color: #000;
          }
          
          .secao-conteudo {
            margin-top: 20px;
          }
          
          .secao-titulo {
            font-size: 11pt;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
          }
          
          .conteudo-lista {
            margin-left: 15px;
            margin-bottom: 20px;
          }
          
          .conteudo-lista li {
            margin-bottom: 5px;
          }
          
          .totais-bimestre {
            margin-top: 30px;
            padding: 10px;
            border: 2px solid #000;
            font-size: 10pt;
          }
          
          .totais-bimestre .titulo {
            font-weight: bold;
            font-size: 11pt;
            text-decoration: underline;
            margin-bottom: 8px;
          }
          
          .totais-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          
          .observacoes {
            margin-top: 20px;
            padding: 10px;
            border: 1px solid #000;
            min-height: 60px;
            font-size: 9pt;
          }
          
          .observacoes-titulo {
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .assinaturas {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          
          .assinatura-linha {
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
            font-size: 9pt;
          }
          
          .canhoto-header {
            font-size: 9pt;
            margin-bottom: 10px;
          }
          
          .canhoto-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          .canhoto-secao {
            border: 2px solid #000;
            padding: 10px;
          }
          
          .canhoto-secao-titulo {
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          
          .canhoto-tabela {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
          }
          
          .canhoto-tabela th,
          .canhoto-tabela td {
            border: 1px solid #000;
            padding: 3px 5px;
            text-align: center;
          }
          
          .canhoto-tabela th {
            background-color: #e0e0e0;
            font-weight: bold;
          }
          
          .canhoto-rodape {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .canhoto-aulas {
            font-size: 10pt;
          }
          
          .canhoto-assinatura {
            width: 300px;
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
            font-size: 9pt;
          }
          
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${pagina1HTML}
        ${pagina2HTML}
        ${pagina3HTML}
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

function gerarPagina1Frequencias(
  dadosDiario: DadosDiario,
  alunosFrequencia: AlunoFrequencia[],
  bimestre: { numero: number; data_inicio: string; data_fim: string },
  escolaNome: string,
  anoLetivo: number
): string {
  const turnoDisplay = dadosDiario.turno_diario 
    ? (dadosDiario.turno_diario === 'MATUTINO' ? 'MATUTINO' : 'VESPERTINO')
    : dadosDiario.turma.turno?.toUpperCase() || 'NÃO INFORMADO';

  // Calcular previsão de aulas por mês
  const previsaoPorMes = calcularPrevisaoAulasPorMes(alunosFrequencia, bimestre);
  const totalAulasPrevistas = previsaoPorMes.reduce((sum, m) => sum + m.previstas, 0);

  // Coletar todas as datas únicas de aulas (sem separar por tempo)
  const datasAulasSet = new Set<string>();
  alunosFrequencia.forEach(aluno => {
    aluno.frequencias.forEach(freq => {
      datasAulasSet.add(freq.data_aula);
    });
  });
  const datasAulas = Array.from(datasAulasSet).sort();

  let html = `
    <div class="page">
      <div class="header-oficial">
        <h1>PREFEITURA MUNICIPAL DE CAMPO GRANDE</h1>
        <h2>SECRETARIA MUNICIPAL DE EDUCAÇÃO</h2>
      </div>
      
      <div class="header-info">
        <span>ESCOLA: ${escolaNome}</span>
        <span>BIMESTRE: ${bimestre.numero}º</span>
        <span>ANO: ${anoLetivo}</span>
        <span>TURNO: ${turnoDisplay}</span>
      </div>
      
      <h1 class="titulo-diario">DIÁRIO DE CLASSE</h1>
      
      <table class="tabela-previsao">
        <thead>
          <tr>
            <th>MÊS</th>
            <th>PREVISTAS</th>
          </tr>
        </thead>
        <tbody>
  `;

  previsaoPorMes.forEach(item => {
    html += `
      <tr>
        <td>${item.mes}</td>
        <td>${item.previstas}</td>
      </tr>
    `;
  });

  html += `
          <tr style="font-weight: bold;">
            <td>TOTAL</td>
            <td>${totalAulasPrevistas}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="info-professor">
        <div class="info-row">
          <span><span class="info-label">PROFESSOR(A):</span> ${dadosDiario.professor.nome}</span>
        </div>
        <div class="info-row">
          <span><span class="info-label">CADASTRO:</span> ${dadosDiario.professor.matricula || 'NÃO INFORMADO'}</span>
        </div>
        <div class="info-row">
          <span><span class="info-label">COMPONENTE CURRICULAR:</span> ${dadosDiario.componente_curricular}</span>
        </div>
        <div class="info-row">
          <span><span class="info-label">ANO:</span> ${dadosDiario.turma.grupo_ano}</span>
          <span><span class="info-label">TURMA:</span> ${dadosDiario.turma.turma}</span>
        </div>
      </div>
      
      <table class="grid-frequencias">
        <thead>
          <tr>
            <th class="col-dia">DIA</th>
            <th class="col-aluno">ALUNO</th>
  `;

  // Cabeçalho com números dos alunos
  alunosFrequencia.forEach((aluno, idx) => {
    html += `<th class="col-aluno">${idx + 1}</th>`;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  // Linhas de frequência por data
  datasAulas.forEach(data => {
    const dia = format(parseISO(data), "dd");
    
    // Criar mapa de frequências por aluno para essa data
    const frequenciasPorAluno = new Map<string, boolean>();
    alunosFrequencia.forEach(aluno => {
      // Verificar se o aluno tem alguma frequência nessa data
      const freqNaData = aluno.frequencias.filter(f => f.data_aula === data);
      if (freqNaData.length > 0) {
        // Se tem pelo menos uma presença, considerar presente
        const temPresenca = freqNaData.some(f => f.presente);
        frequenciasPorAluno.set(aluno.id, temPresenca);
      }
    });

    html += `
      <tr>
        <td class="col-dia">${dia}</td>
        <td class="col-aluno">${format(parseISO(data), "d", { locale: ptBR })}</td>
    `;

    alunosFrequencia.forEach(aluno => {
      const presente = frequenciasPorAluno.get(aluno.id);
      if (presente === undefined) {
        html += '<td>--</td>'; // Sem registro
      } else if (presente) {
        html += '<td class="marca-presente">--</td>';
      } else {
        html += '<td class="marca-falta">F</td>';
      }
    });

    html += '</tr>';
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function gerarPagina2Conteudo(
  dadosDiario: DadosDiario,
  bimestre: { numero: number; data_inicio: string; data_fim: string },
  alunosFrequencia: AlunoFrequencia[]
): string {
  // Calcular total de aulas dadas
  const datasAulasSet = new Set<string>();
  alunosFrequencia.forEach(aluno => {
    aluno.frequencias.forEach(freq => {
      datasAulasSet.add(freq.data_aula);
    });
  });
  const aulasDadas = datasAulasSet.size;

  const dataHoje = format(new Date(), "dd/MM/yy");

  return `
    <div class="page">
      <div class="secao-conteudo">
        <h2 class="secao-titulo">Resumo do Conteúdo Ministrado</h2>
        
        <ul class="conteudo-lista">
          <li>Conteúdo programático conforme plano de ensino</li>
          <li>Atividades práticas e teóricas</li>
          <li>Avaliações diagnósticas e formativas</li>
        </ul>
      </div>
      
      <div class="totais-bimestre">
        <div class="titulo">TOTAL DO ${bimestre.numero}º BIMESTRE</div>
        <div class="totais-row">
          <strong>Aulas Previstas:</strong>
          <span>${aulasDadas}</span>
        </div>
        <div class="totais-row">
          <strong>Aulas Dadas:</strong>
          <span>${aulasDadas}</span>
        </div>
        <div class="totais-row">
          <strong>Data:</strong>
          <span>${dataHoje}</span>
        </div>
      </div>
      
      <div class="observacoes">
        <div class="observacoes-titulo">Reservado para observações da SEMED e/ou Direção:</div>
        <div style="min-height: 80px;"></div>
      </div>
      
      <div class="assinaturas">
        <div>
          <div style="height: 40px;"></div>
          <div class="assinatura-linha">
            Assinatura do(a) Professor(a)
          </div>
        </div>
        <div>
          <div style="height: 40px;"></div>
          <div class="assinatura-linha">
            Assinatura do(a) Diretor(a) Adjunto(a) ou Pedagógico(a)
          </div>
        </div>
      </div>
    </div>
  `;
}

function gerarPagina3Canhoto(
  dadosDiario: DadosDiario,
  alunosFrequencia: AlunoFrequencia[],
  alunosAvaliacoes: AlunoAvaliacao[],
  bimestre: { numero: number; data_inicio: string; data_fim: string },
  escolaNome: string,
  anoLetivo: number
): string {
  const turnoDisplay = dadosDiario.turno_diario 
    ? (dadosDiario.turno_diario === 'MATUTINO' ? 'MATUTINO' : 'VESPERTINO')
    : dadosDiario.turma.turno?.toUpperCase() || '';

  // Calcular total de aulas dadas
  const datasAulasSet = new Set<string>();
  alunosFrequencia.forEach(aluno => {
    aluno.frequencias.forEach(freq => {
      datasAulasSet.add(freq.data_aula);
    });
  });
  const aulasDadas = datasAulasSet.size;

  let html = `
    <div class="page">
      <div class="canhoto-header">
        <div style="font-weight: bold; margin-bottom: 5px;">${escolaNome}</div>
        <div style="display: flex; justify-content: space-between; font-size: 8pt;">
          <span>BIM: ${bimestre.numero}º</span>
          <span>ANO: ${anoLetivo}</span>
          <span>ANO: ${dadosDiario.turma.grupo_ano}</span>
          <span>TURMA: ${dadosDiario.turma.turma}</span>
          <span>TURNO: ${turnoDisplay}</span>
        </div>
      </div>
      
      <div class="canhoto-grid">
        <div class="canhoto-secao">
          <h3 class="canhoto-secao-titulo">FALTAS</h3>
          <table class="canhoto-tabela">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
  `;

  alunosFrequencia.forEach((aluno, idx) => {
    html += `
      <tr>
        <td>${String(idx + 1).padStart(2, '0')}</td>
        <td>${aluno.total_faltas > 0 ? String(aluno.total_faltas).padStart(2, '0') : '--'}</td>
      </tr>
    `;
  });

  html += `
            </tbody>
          </table>
        </div>
        
        <div class="canhoto-secao">
          <h3 class="canhoto-secao-titulo">APROVEITAMENTO</h3>
          <table class="canhoto-tabela">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Média</th>
              </tr>
            </thead>
            <tbody>
  `;

  // Criar mapa de avaliações por aluno
  const avaliacoesMap = new Map<string, number | null>();
  alunosAvaliacoes.forEach(aluno => {
    avaliacoesMap.set(aluno.id, aluno.media);
  });

  alunosFrequencia.forEach((aluno, idx) => {
    const media = avaliacoesMap.get(aluno.id);
    const mediaDisplay = media !== null && media !== undefined 
      ? media.toFixed(1)
      : '--';

    html += `
      <tr>
        <td>${String(idx + 1).padStart(2, '0')}</td>
        <td>${mediaDisplay}</td>
      </tr>
    `;
  });

  html += `
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="canhoto-rodape">
        <div class="canhoto-aulas">
          <div><strong>Aulas Dadas:</strong> ${aulasDadas}</div>
        </div>
        <div>
          <div style="height: 40px;"></div>
          <div class="canhoto-assinatura">
            Professor(a) do(a) ${dadosDiario.componente_curricular}
          </div>
        </div>
      </div>
    </div>
  `;

  return html;
}

function calcularPrevisaoAulasPorMes(
  alunosFrequencia: AlunoFrequencia[],
  bimestre: { data_inicio: string; data_fim: string }
): Array<{ mes: string; previstas: number }> {
  const datasAulasSet = new Set<string>();
  alunosFrequencia.forEach(aluno => {
    aluno.frequencias.forEach(freq => {
      datasAulasSet.add(freq.data_aula);
    });
  });

  const mesesCount = new Map<string, number>();
  
  datasAulasSet.forEach(data => {
    const mes = format(parseISO(data), "MMMM", { locale: ptBR }).toUpperCase();
    mesesCount.set(mes, (mesesCount.get(mes) || 0) + 1);
  });

  const resultado: Array<{ mes: string; previstas: number }> = [];
  mesesCount.forEach((count, mes) => {
    resultado.push({ mes, previstas: count });
  });

  return resultado.sort((a, b) => {
    const mesesOrdem = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    return mesesOrdem.indexOf(a.mes) - mesesOrdem.indexOf(b.mes);
  });
}
