import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { useAlunos, useAlunosPorEscola, Aluno } from "@/hooks/useAlunos";
import { AlunosTable } from "@/components/Alunos/AlunosTable";
import { AlunoViewDialog } from "@/components/Alunos/AlunoViewDialog";

const Alunos = () => {
  const { user } = useAuth();
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { escolaAtual } = useSchool();

  const isAdmin = user?.roles.includes("ADMIN") || 
                  user?.roles.includes("GESTOR_SEMED") || 
                  user?.roles.includes("TECNICO_SEMED");

  const { data: alunosAdmin, isLoading: isLoadingAdmin } = useAlunos();
  const { data: alunosEscola, isLoading: isLoadingEscola } = useAlunosPorEscola(
    !isAdmin ? escolaAtual?.saesc || null : null
  );

  const alunos = isAdmin ? alunosAdmin : alunosEscola;
  const isLoading = isAdmin ? isLoadingAdmin : isLoadingEscola;

  const handleViewAluno = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setIsViewDialogOpen(true);
  };

  const titulo = isAdmin 
    ? "Alunos - Rede Municipal" 
    : `Alunos - ${alunos?.[0]?.escola?.nome || "Escola"}`;

  const subtitulo = isAdmin
    ? "Visão geral de todos os alunos da rede"
    : "Gerencie os alunos da sua escola";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{titulo}</h1>
          <p className="text-muted-foreground mt-1">{subtitulo}</p>
        </div>
      </div>

      <AlunosTable
        alunos={alunos || []}
        isLoading={isLoading}
        isAdmin={isAdmin}
        onViewAluno={handleViewAluno}
      />

      <AlunoViewDialog
        aluno={selectedAluno}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </div>
  );
};

export default Alunos;
