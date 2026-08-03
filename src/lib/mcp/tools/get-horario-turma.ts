import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_horario_turma",
  title: "Consultar horário da turma",
  description: "Retorna a grade de horários (dia, tempo, componente, professor) de uma turma.",
  inputSchema: {
    turma_id: z.string().describe("UUID da turma."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ turma_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("horarios")
      .select("id, turma_id, dia_semana, tempo, componente_curricular, professor_id")
      .eq("turma_id", turma_id)
      .order("dia_semana")
      .order("tempo")
      .limit(500);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { horarios: data ?? [] },
    };
  },
});
