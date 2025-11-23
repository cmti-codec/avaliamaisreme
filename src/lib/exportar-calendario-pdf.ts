import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventoCalendario {
  data: string;
  tipo: string;
  descricao: string;
}

/**
 * Exporta o calendário para impressão (abre janela de impressão do navegador)
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
    html += '<div class="calendar-day"></div>';
  }
  
  // Dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const eventosNoDia = eventosPorData[dataStr] || [];
    
    html += '<div class="calendar-day">';
    html += `<div class="day-number">${dia}</div>`;
    
    eventosNoDia.forEach((evento) => {
      let classe = "";
      if (evento.tipo === "FERIADO") classe = "feriado";
      else if (evento.tipo === "SABADO_LETIVO") classe = "sabado";
      else if (evento.tipo === "CONSELHO") classe = "conselho";
      else if (evento.tipo === "ENTREGA") classe = "entrega";
      else if (evento.tipo === "EVENTO") classe = "evento";
      
      const descricaoLimitada = evento.descricao.length > 30 
        ? evento.descricao.substring(0, 30) + "..." 
        : evento.descricao;
      
      html += `<div class="event ${classe}">${descricaoLimitada}</div>`;
    });
    
    html += '</div>';
  }
  
  return html;
}
