import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Professores = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Professores</h1>
          <p className="text-muted-foreground mt-1">Gerencie o corpo docente da sua escola</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Professor
        </Button>
      </div>

      <div className="bg-muted/30 rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Módulo em desenvolvimento</p>
      </div>
    </div>
  );
};

export default Professores;
