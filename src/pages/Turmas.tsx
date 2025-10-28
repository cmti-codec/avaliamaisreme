import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TurmasTable } from "@/components/Turmas/TurmasTable";
import { TurmaViewDialog } from "@/components/Turmas/TurmaViewDialog";

const Turmas = () => {
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleView = (id: string) => {
    setSelectedTurmaId(id);
    setViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as turmas e suas matrizes curriculares
          </p>
        </div>
        <Button className="gap-2" disabled>
          <Plus className="w-4 h-4" />
          Nova Turma
        </Button>
      </div>

      <TurmasTable onView={handleView} />

      <TurmaViewDialog
        turmaId={selectedTurmaId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </div>
  );
};

export default Turmas;
