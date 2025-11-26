import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventoCalendario {
  data: string;
  tipo: string;
  descricao: string;
}

/**
 * Exporta o calendário anual completo para impressão (abre janela de impressão do navegador)
 * @param eventos - Lista de eventos do calendário
 * @param ano - Ano do calendário
 * @param nomeEscola - Nome da escola (opcional)
 */
export const exportarCalendarioAnualParaImpressao = (
  eventos: EventoCalendario[],
  ano: number,
  nomeEscola?: string
) => {
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Agrupar eventos por data
  const eventosPorData = eventos.reduce((acc, evento) => {
    if (!acc[evento.data]) {
      acc[evento.data] = [];
    }
    acc[evento.data].push(evento);
    return acc;
  }, {} as Record<string, EventoCalendario[]>);

  // Gerar HTML para todos os meses
  const mesesHTML = meses.map((nomeMes, index) => {
    const mesAtual = index;
    return `
      <div class="mes-container">
        <h3 class="mes-titulo">${nomeMes} ${ano}</h3>
        ${gerarDiasCalendario(mesAtual, ano, eventosPorData)}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Calendário Escolar ${ano}${nomeEscola ? ` - ${nomeEscola}` : ''}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
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
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          
          .header h1 {
            font-size: 16pt;
            margin-bottom: 4px;
          }
          
          .header h2 {
            font-size: 11pt;
            font-weight: normal;
            color: #555;
          }
          
          .calendario-anual {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          
          .mes-container {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .mes-titulo {
            font-size: 11pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 6px;
            padding: 4px;
            background-color: #e8e8e8;
            border-radius: 3px;
          }
          
          .calendario {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            border: 1px solid #ccc;
            background-color: #ccc;
          }
          
          .dia-semana, .dia {
            background-color: white;
            padding: 3px;
            min-height: 28px;
            font-size: 8pt;
          }
          
          .dia-semana {
            font-weight: bold;
            text-align: center;
            background-color: #f5f5f5;
            padding: 4px 2px;
          }
          
          .dia {
            position: relative;
            text-align: left;
          }
          
          .dia.vazio {
            background-color: #fafafa;
          }
          
          .dia.fim-semana {
            background-color: #f8f8f8;
          }
          
          .dia-numero {
            font-weight: bold;
            font-size: 9pt;
            display: block;
            margin-bottom: 2px;
          }
          
          .evento-mini {
            font-size: 6.5pt;
            padding: 1px 2px;
            margin: 1px 0;
            border-radius: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .evento-FERIADO { background-color: #fee; color: #a00; }
          .evento-SABADO_LETIVO { background-color: #efe; color: #070; }
          .evento-CONSELHO { background-color: #fef; color: #707; }
          .evento-EVENTO_INSTITUCIONAL { background-color: #ffe; color: #880; }
          .evento-ENTREGA_DIARIOS { background-color: #eef; color: #007; }
          
          .legenda {
            margin-top: 15px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f9f9f9;
            page-break-inside: avoid;
          }
          
          .legenda h3 {
            font-size: 10pt;
            margin-bottom: 6px;
          }
          
          .legenda-itens {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .legenda-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 8pt;
          }
          
          .legenda-cor {
            width: 16px;
            height: 12px;
            border-radius: 2px;
            border: 1px solid #999;
          }
          
          @media print {
            .mes-container {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Calendário Escolar ${ano}</h1>
          ${nomeEscola ? `<h2>${nomeEscola}</h2>` : ''}
        </div>
        
        <div class="calendario-anual">
          ${mesesHTML}
        </div>
        
        <div class="legenda">
          <h3>Legenda</h3>
          <div class="legenda-itens">
            <div class="legenda-item">
              <div class="legenda-cor evento-FERIADO"></div>
              <span>Feriado</span>
            </div>
            <div class="legenda-item">
              <div class="legenda-cor evento-SABADO_LETIVO"></div>
              <span>Sábado Letivo</span>
            </div>
            <div class="legenda-item">
              <div class="legenda-cor evento-CONSELHO"></div>
              <span>Conselho de Classe</span>
            </div>
            <div class="legenda-item">
              <div class="legenda-cor evento-EVENTO_INSTITUCIONAL"></div>
              <span>Evento Institucional</span>
            </div>
            <div class="legenda-item">
              <div class="legenda-cor evento-ENTREGA_DIARIOS"></div>
              <span>Entrega de Diários</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // Abrir nova janela e iniciar impressão
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

/**
 * Exporta o calendário mensal para impressão (abre janela de impressão do navegador)
 */
export const exportarCalendarioParaImpressao = (
  eventos: EventoCalendario[],
  mes: number,
  ano: number,
  escolaNome: string
) => {
  const mesNome = format(new Date(ano, mes, 1), "MMMM 'de' yyyy", { locale: ptBR });
  
  // Agrupar eventos por data
  const eventosPorData = eventos.reduce((acc, evento) => {
    if (!acc[evento.data]) {
      acc[evento.data] = [];
    }
    acc[evento.data].push(evento);
    return acc;
  }, {} as Record<string, EventoCalendario[]>);

  // Criar HTML para impressão
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Calendário - ${mesNome}</title>
      <style>
        @media print {
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 10px;
        }
        
        h2 {
          text-align: center;
          color: #666;
          font-weight: normal;
          margin-bottom: 30px;
        }
        
        .legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
        }
        
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          background-color: #ddd;
          border: 2px solid #ddd;
        }
        
        .calendar-day {
          background-color: white;
          min-height: 100px;
          padding: 8px;
          position: relative;
        }
        
        .calendar-day.header {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center;
          min-height: auto;
          padding: 10px;
        }
        
        .day-number {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .event {
          font-size: 9px;
          padding: 2px 4px;
          margin: 2px 0;
          border-radius: 3px;
          line-height: 1.3;
        }
        
        .event.feriado {
          background-color: #fee;
          color: #c00;
        }
        
        .event.sabado {
          background-color: #e3f2fd;
          color: #1565c0;
        }
        
        .event.conselho {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }
        
        .event.entrega {
          background-color: #fff3e0;
          color: #e65100;
        }
        
        .event.evento {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>${escolaNome}</h1>
      <h2>Calendário Escolar - ${mesNome}</h2>
      
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color" style="background-color: #fee;"></div>
          <span>Feriados</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #e3f2fd;"></div>
          <span>Sábados Letivos</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #f3e5f5;"></div>
          <span>Conselhos</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #fff3e0;"></div>
          <span>Entregas</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #e8f5e9;"></div>
          <span>Eventos</span>
        </div>
      </div>
      
      <div class="calendar-grid">
        <div class="calendar-day header">Domingo</div>
        <div class="calendar-day header">Segunda</div>
        <div class="calendar-day header">Terça</div>
        <div class="calendar-day header">Quarta</div>
        <div class="calendar-day header">Quinta</div>
        <div class="calendar-day header">Sexta</div>
        <div class="calendar-day header">Sábado</div>
        ${gerarDiasCalendario(mes, ano, eventosPorData)}
      </div>
      
      <div class="footer">
        Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
  const janela = window.open("", "_blank");
  if (janela) {
    janela.document.write(html);
    janela.document.close();
  }
};

function gerarDiasCalendario(
  mes: number,
  ano: number,
  eventosPorData: Record<string, EventoCalendario[]>
): string {
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay();
  
  let html = "";
  
  // Dias vazios antes do início do mês
  for (let i = 0; i < diaSemanaInicio; i++) {
    html += '<div class="dia vazio"></div>';
  }
  
  // Dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const eventosNoDia = eventosPorData[dataStr] || [];
    
    const diaSemana = new Date(ano, mes, dia).getDay();
    const isFimSemana = diaSemana === 0 || diaSemana === 6;
    
    html += `<div class="dia${isFimSemana ? ' fim-semana' : ''}">`;
    html += `<div class="dia-numero">${dia}</div>`;
    
    eventosNoDia.forEach((evento) => {
      const descricaoLimitada = evento.descricao.length > 20 
        ? evento.descricao.substring(0, 20) + "..." 
        : evento.descricao;
      
      html += `<div class="evento-mini evento-${evento.tipo}">${descricaoLimitada}</div>`;
    });
    
    html += '</div>';
  }
  
  return html;
}