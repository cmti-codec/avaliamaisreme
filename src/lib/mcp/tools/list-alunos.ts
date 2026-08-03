import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_alunos",
  title: "Listar alunos da turma",
  description: "Lista os alunos matriculados em uma turma pelo id da turma.",
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
      .from("alunos")
      .select("id, nomalu, numalu, nummtr, sigtur, ativo, turma_id")
      .eq("turma_id", turma_id)
      .order("nomalu")
      .limit(500);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { alunos: data ?? [] },
    };
  },
});
