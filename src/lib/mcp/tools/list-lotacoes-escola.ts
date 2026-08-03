import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_lotacoes_escola",
  title: "Listar lotações da escola",
  description: "Lista as lotações ativas (professores e gestores) de uma escola pelo código SAESC.",
  inputSchema: {
    escola_saesc: z.string().describe("Código SAESC da escola."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ escola_saesc }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("lotacoes")
      .select("id, pessoa_id, perfil, carga_horaria, carga_total, pl, ano_letivo, status, ativo, escola_saesc")
      .eq("escola_saesc", escola_saesc)
      .eq("ativo", true)
      .limit(500);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { lotacoes: data ?? [] },
    };
  },
});
