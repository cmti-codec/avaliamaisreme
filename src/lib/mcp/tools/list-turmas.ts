import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_turmas",
  title: "Listar turmas",
  description: "Lista as turmas de uma escola (por id da escola), opcionalmente filtrando por turno.",
  inputSchema: {
    escola_id: z.string().describe("UUID da escola."),
    turno: z.string().optional().describe("Turno da turma, ex: MATUTINO, VESPERTINO, INTEGRAL."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ escola_id, turno }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("turmas")
      .select("id, turma, grupo_ano, etapa_modalidade, turno, ativa, escola_id")
      .eq("escola_id", escola_id)
      .order("turma")
      .limit(300);
    if (turno) query = query.eq("turno", turno);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { turmas: data ?? [] },
    };
  },
});
