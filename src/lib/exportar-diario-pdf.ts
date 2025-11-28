import { format } from "date-fns";
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
  };
}

interface AlunoFrequencia {
  id: string;
  nomalu: string;
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
 * Exporta o diário de classe completo (frequências + avaliações) para impressão
 */
export const exportarDiarioParaImpressao = (
  dadosDiario: DadosDiario,
  alunosFrequencia: AlunoFrequencia[],
  alunosAvaliacoes: AlunoAvaliacao[],
  bimestre: { numero: number; data_inicio: string; data_fim: string },
  escolaNome: string
) => {
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  // HTML para frequências
  const tabelaFrequenciasHTML = gerarTabelaFrequencias(alunosFrequencia);
  
  // HTML para avaliações
  const tabelaAvaliacoesHTML = gerarTabelaAvaliacoes(alunosAvaliacoes);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Diário de Classe - ${dadosDiario.turma.turma}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #333;
          }
          
          .header h1 {
            font-size: 18pt;
            margin-bottom: 5px;
          }
          
          .header h2 {
            font-size: 13pt;
            font-weight: normal;
            color: #555;
            margin-bottom: 3px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 25px;
            padding: 12px;
            background-color: #f8f8f8;
            border-radius: 5px;
            border: 1px solid #ddd;
          }
          
          .info-item {
            display: flex;
            gap: 5px;
          }
          
          .info-label {
            font-weight: bold;
            color: #555;
          }
          
          .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin: 25px 0 15px 0;
            padding: 8px;
            background-color: #e8e8e8;
            border-left: 4px solid #333;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9pt;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            padding: 8px 5px;
            text-align: left;
            border: 1px solid #ccc;
          }
          
          td {
            padding: 6px 5px;
            border: 1px solid #ddd;
          }
          
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          
          .aluno-nome {
            font-weight: bold;
          }
          
          .presente {
            text-align: center;
            color: #0a0;
            font-weight: bold;
          }
          
          .falta {
            text-align: center;
            color: #c00;
            font-weight: bold;
          }
          
          .nota-cell {
            text-align: center;
            font-weight: bold;
          }
          
          .nota-alta {
            color: #0a0;
          }
          
          .nota-media {
            color: #f80;
          }
          
          .nota-baixa {
            color: #c00;
          }
          
          .estatisticas {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 15px;
            font-size: 9pt;
          }
          
          .stat-box {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            text-align: center;
            background-color: #f9f9f9;
          }
          
          .stat-value {
            font-size: 16pt;
            font-weight: bold;
            color: #333;
            margin-top: 5px;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 8pt;
            color: #666;
          }
          
          .assinatura-area {
            margin-top: 40px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
          }
          
          .assinatura-box {
            text-align: center;
          }
          
          .assinatura-linha {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 9pt;
          }
          
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .section-title {
              page-break-after: avoid;
            }
            
            table {
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escolaNome}</h1>
          <h2>Diário de Classe - ${bimestre.numero}º Bimestre</h2>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Turma:</span>
            <span>${dadosDiario.turma.turma} - ${dadosDiario.turma.etapa_modalidade} (${dadosDiario.turma.grupo_ano})</span>
          </div>
          <div class="info-item">
            <span class="info-label">Turno:</span>
            <span>${dadosDiario.turno_diario ? (dadosDiario.turno_diario === 'MATUTINO' ? 'Matutino' : 'Vespertino') : dadosDiario.turma.turno}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Componente:</span>
            <span>${dadosDiario.componente_curricular}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Professor(a):</span>
            <span>${dadosDiario.professor.nome}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Período:</span>
            <span>${format(new Date(bimestre.data_inicio), "dd/MM/yyyy")} a ${format(new Date(bimestre.data_fim), "dd/MM/yyyy")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total de Alunos:</span>
            <span>${alunosFrequencia.length}</span>
          </div>
        </div>
        
        <h3 class="section-title">📋 Registro de Frequências</h3>
        ${tabelaFrequenciasHTML}
        
        <h3 class="section-title">📝 Registro de Avaliações</h3>
        ${tabelaAvaliacoesHTML}
        
        <div class="assinatura-area">
          <div class="assinatura-box">
            <div class="assinatura-linha">
              Professor(a): ${dadosDiario.professor.nome}
            </div>
          </div>
          <div class="assinatura-box">
            <div class="assinatura-linha">
              Coordenação Pedagógica
            </div>
          </div>
        </div>
        
        <div class="footer">
          Documento gerado em ${dataGeracao}
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  // Abrir em nova janela e imprimir
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

function gerarTabelaFrequencias(alunosFrequencia: AlunoFrequencia[]): string {
  if (alunosFrequencia.length === 0) {
    return '<p style="text-align: center; color: #999; padding: 20px;">Nenhuma frequência registrada neste período.</p>';
  }

  // Coletar todas as datas/tempos únicos
  const dataTempos = new Set<string>();
  alunosFrequencia.forEach(aluno => {
    aluno.frequencias.forEach(freq => {
      dataTempos.add(`${freq.data_aula}|${freq.tempo}`);
    });
  });
  
  const dataTemposOrdenados = Array.from(dataTempos).sort();
  
  // Calcular estatísticas
  const totalAulas = dataTemposOrdenados.length;
  const totalPresencas = alunosFrequencia.reduce((sum, a) => sum + a.total_presencas, 0);
  const totalFaltas = alunosFrequencia.reduce((sum, a) => sum + a.total_faltas, 0);
  const mediaPresenca = totalAulas > 0 ? ((totalPresencas / (totalAulas * alunosFrequencia.length)) * 100).toFixed(1) : 0;

  let html = '<table>';
  
  // Cabeçalho
  html += '<thead><tr>';
  html += '<th style="min-width: 150px;">Aluno</th>';
  
  dataTemposOrdenados.forEach(dt => {
    const [data, tempo] = dt.split('|');
    const dataFormatada = format(new Date(data), "dd/MM", { locale: ptBR });
    html += `<th style="min-width: 45px; text-align: center;">${dataFormatada}<br/>T${tempo}</th>`;
  });
  
  html += '<th style="min-width: 50px; text-align: center;">Presenças</th>';
  html += '<th style="min-width: 50px; text-align: center;">Faltas</th>';
  html += '<th style="min-width: 50px; text-align: center;">%</th>';
  html += '</tr></thead>';
  
  // Corpo
  html += '<tbody>';
  alunosFrequencia.forEach(aluno => {
    html += '<tr>';
    html += `<td class="aluno-nome">${aluno.nomalu}</td>`;
    
    // Criar mapa de frequências
    const freqMap = new Map<string, boolean>();
    aluno.frequencias.forEach(freq => {
      freqMap.set(`${freq.data_aula}|${freq.tempo}`, freq.presente);
    });
    
    dataTemposOrdenados.forEach(dt => {
      const presente = freqMap.get(dt);
      if (presente === undefined) {
        html += '<td style="text-align: center; color: #999;">-</td>';
      } else if (presente) {
        html += '<td class="presente">✓</td>';
      } else {
        html += '<td class="falta">✗</td>';
      }
    });
    
    html += `<td style="text-align: center;">${aluno.total_presencas}</td>`;
    html += `<td style="text-align: center;">${aluno.total_faltas}</td>`;
    html += `<td style="text-align: center; font-weight: bold;">${aluno.percentual_presenca.toFixed(1)}%</td>`;
    html += '</tr>';
  });
  html += '</tbody>';
  html += '</table>';
  
  // Estatísticas gerais
  html += '<div class="estatisticas">';
  html += `<div class="stat-box"><div>Total de Aulas</div><div class="stat-value">${totalAulas}</div></div>`;
  html += `<div class="stat-box"><div>Total de Presenças</div><div class="stat-value">${totalPresencas}</div></div>`;
  html += `<div class="stat-box"><div>Média de Presença</div><div class="stat-value">${mediaPresenca}%</div></div>`;
  html += '</div>';
  
  return html;
}

function gerarTabelaAvaliacoes(alunosAvaliacoes: AlunoAvaliacao[]): string {
  if (alunosAvaliacoes.length === 0) {
    return '<p style="text-align: center; color: #999; padding: 20px;">Nenhuma avaliação registrada neste período.</p>';
  }

  // Coletar todos os títulos de avaliações únicos
  const titulosSet = new Set<string>();
  alunosAvaliacoes.forEach(aluno => {
    aluno.avaliacoes.forEach(av => {
      titulosSet.add(av.titulo);
    });
  });
  
  const titulos = Array.from(titulosSet).sort();
  
  // Calcular estatísticas
  const mediaGeral = alunosAvaliacoes.reduce((sum, a) => sum + (a.media || 0), 0) / alunosAvaliacoes.length;
  const aprovados = alunosAvaliacoes.filter(a => (a.media || 0) >= 6).length;
  const reprovados = alunosAvaliacoes.filter(a => a.media !== null && a.media < 6).length;

  let html = '<table>';
  
  // Cabeçalho
  html += '<thead><tr>';
  html += '<th style="min-width: 150px;">Aluno</th>';
  
  titulos.forEach(titulo => {
    html += `<th style="min-width: 60px; text-align: center;">${titulo}</th>`;
  });
  
  html += '<th style="min-width: 60px; text-align: center;">Média</th>';
  html += '</tr></thead>';
  
  // Corpo
  html += '<tbody>';
  alunosAvaliacoes.forEach(aluno => {
    html += '<tr>';
    html += `<td class="aluno-nome">${aluno.nomalu}</td>`;
    
    // Criar mapa de avaliações
    const avMap = new Map<string, { nota: number | null; nota_maxima: number }>();
    aluno.avaliacoes.forEach(av => {
      avMap.set(av.titulo, { nota: av.nota, nota_maxima: av.nota_maxima });
    });
    
    titulos.forEach(titulo => {
      const avaliacao = avMap.get(titulo);
      if (!avaliacao) {
        html += '<td style="text-align: center; color: #999;">-</td>';
      } else if (avaliacao.nota === null) {
        html += '<td style="text-align: center; color: #999;">-</td>';
      } else {
        const percentual = (avaliacao.nota / avaliacao.nota_maxima) * 10;
        const classe = percentual >= 7 ? 'nota-alta' : percentual >= 5 ? 'nota-media' : 'nota-baixa';
        html += `<td class="nota-cell ${classe}">${avaliacao.nota.toFixed(1)}</td>`;
      }
    });
    
    if (aluno.media === null) {
      html += '<td class="nota-cell" style="color: #999;">-</td>';
    } else {
      const classe = aluno.media >= 7 ? 'nota-alta' : aluno.media >= 5 ? 'nota-media' : 'nota-baixa';
      html += `<td class="nota-cell ${classe}">${aluno.media.toFixed(1)}</td>`;
    }
    
    html += '</tr>';
  });
  html += '</tbody>';
  html += '</table>';
  
  // Estatísticas gerais
  html += '<div class="estatisticas">';
  html += `<div class="stat-box"><div>Média Geral</div><div class="stat-value">${mediaGeral.toFixed(1)}</div></div>`;
  html += `<div class="stat-box"><div>Aprovados (≥6)</div><div class="stat-value" style="color: #0a0;">${aprovados}</div></div>`;
  html += `<div class="stat-box"><div>Reprovados (&lt;6)</div><div class="stat-value" style="color: #c00;">${reprovados}</div></div>`;
  html += '</div>';
  
  return html;
}
