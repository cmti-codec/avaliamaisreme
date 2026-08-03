import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEscolas from "./tools/list-escolas";
import listTurmas from "./tools/list-turmas";
import listAlunos from "./tools/list-alunos";
import getHorarioTurma from "./tools/get-horario-turma";
import listLotacoesEscola from "./tools/list-lotacoes-escola";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "avaliamais",
  title: "avaliamais",
  version: "0.1.0",
  instructions:
    "Ferramentas de leitura do Avalia+ (gestão escolar da REME). Use list_escolas para localizar uma escola, list_turmas para suas turmas, list_alunos para os alunos de uma turma, get_horario_turma para a grade horária e list_lotacoes_escola para as lotações ativas. Todos os dados respeitam as permissões do usuário autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listEscolas, listTurmas, listAlunos, getHorarioTurma, listLotacoesEscola],
});
