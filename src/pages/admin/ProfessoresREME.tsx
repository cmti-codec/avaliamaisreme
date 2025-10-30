import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Mail, Phone, GraduationCap, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
interface Professor {
  id: string;
  nome: string;
  email: string | null;
  cpf: string | null;
  matricula: string | null;
  telefone: string | null;
  cargo: string | null;
  formacoes: string[] | null;
  ativo: boolean;
  usuario_id: string | null;
  carga_horaria_contratual: number | null;
  tipo_vinculo: string | null;
}
export default function ProfessoresREME() {
  const {
    user
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Verificar se é admin
  const isAdmin = user?.roles?.includes("ADMIN");
  const {
    data: professores,
    isLoading
  } = useQuery({
    queryKey: ["professores-reme"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase
        .from("professores")
        .select(`
          *,
          usuario:usuarios(nome, email)
        `)
        .is("escola_id", null)
        .order("nome", { ascending: true });
      
      if (error) throw error;
      
      // Priorizar dados de usuarios quando disponível
      return (data || []).map(prof => ({
        ...prof,
        nome: prof.usuario?.nome || prof.nome,
        email: prof.usuario?.email || prof.email
      })) as Professor[];
    },
    enabled: isAdmin
  });
  if (!isAdmin) {
    return <Alert variant="destructive">
        <AlertDescription>
          Acesso negado. Apenas administradores podem acessar esta página.
        </AlertDescription>
      </Alert>;
  }
  const filteredProfessores = professores?.filter(prof => prof.nome.toLowerCase().includes(searchTerm.toLowerCase()) || prof.email?.toLowerCase().includes(searchTerm.toLowerCase()) || prof.cpf?.includes(searchTerm) || prof.matricula?.includes(searchTerm));
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Professores da REME</h1>
          <p className="text-muted-foreground mt-2">
            Professores disponíveis para lotação em escolas da rede
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, email, CPF ou matrícula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        {isLoading ? <div className="text-center py-8 text-muted-foreground">
            Carregando professores...
          </div> : filteredProfessores && filteredProfessores.length > 0 ? <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead>Status Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>CH</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessores.map(professor => <TableRow key={professor.id}>
                    <TableCell className="font-medium">
                      {professor.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant={professor.tipo_vinculo === 'CONVOCADO' ? "outline" : "secondary"}>
                        {professor.tipo_vinculo === 'CONVOCADO' ? '📋 Convocado' : '✓ Efetivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {professor.usuario_id ? <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Cadastrado
                        </Badge> : <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Sem acesso
                        </Badge>}
                    </TableCell>
                    <TableCell>
                      {professor.email ? <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{professor.email}</span>
                        </div> : <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{professor.matricula || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{professor.carga_horaria_contratual || 20}h</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={professor.ativo ? "default" : "secondary"}>
                        {professor.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div> : <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhum professor encontrado com os critérios de busca." : "Nenhum professor no pool REME. Importe professores via CSV."}
          </div>}

        {filteredProfessores && filteredProfessores.length > 0 && <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
            <div>
              Total: {filteredProfessores.length} professor(es)
              {" · "}
              {filteredProfessores.filter(p => p.usuario_id).length} com acesso ao sistema
              {" · "}
              {filteredProfessores.filter(p => !p.usuario_id).length} sem acesso
            </div>
          </div>}
      </Card>
    </div>;
}