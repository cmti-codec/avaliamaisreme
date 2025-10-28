import { useState } from "react";
import { useEscolas } from "@/hooks/useEscolas";
import { useUsuario } from "@/hooks/useUsuario";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, Search, Building2 } from "lucide-react";
import { EscolaEditDialog } from "@/components/Admin/EscolaEditDialog";
import { EscolaCreateDialog } from "@/components/Admin/EscolaCreateDialog";
import { EscolasAdminTable } from "@/components/Admin/EscolasAdminTable";

export default function EscolasAdmin() {
  const { data: escolas, isLoading } = useEscolas();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEscola, setSelectedEscola] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: usuario } = useUsuario();
  const isAdmin = usuario?.roles.includes("ADMIN");

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredEscolas = escolas?.filter(escola =>
    escola.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    escola.codigo_inep?.includes(searchTerm) ||
    escola.codigo_saesc?.includes(searchTerm)
  );

  const handleEdit = (escola: any) => {
    setSelectedEscola(escola);
    setIsEditOpen(true);
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Gestão de Escolas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as escolas da rede
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Escola
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escolas Cadastradas</CardTitle>
          <CardDescription>
            {escolas?.length || 0} escola(s) cadastrada(s)
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, INEP ou código SAESC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <EscolasAdminTable
              escolas={filteredEscolas || []}
              onEdit={handleEdit}
            />
          )}
        </CardContent>
      </Card>

      <EscolaEditDialog
        escola={selectedEscola}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <EscolaCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
