import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_escolas",
  title: "Listar escolas",
  description: "Lista as escolas da rede visíveis para o usuário autenticado.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("escolas")
      .select("id, nome, saesc, tipo, regiao, localidade, ativa")
      .order("nome")
      .limit(200);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { escolas: data ?? [] },
    };
  },
});
