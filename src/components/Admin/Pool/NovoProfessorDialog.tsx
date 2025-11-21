import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { usePessoasPool } from "@/hooks/usePessoasPool";
import { useLotacoesGestao } from "@/hooks/useLotacoesGestao";
import { useEscolas } from "@/hooks/useEscolas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NovoProfessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfilPadrao?: 'PROFESSOR' | 'COORDENADOR';
}

export function NovoProfessorDialog({ open, onOpenChange, perfilPadrao = 'PROFESSOR' }: NovoProfessorDialogProps) {
  // Dados da Pessoa
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState<Date>();

  // Lotação Opcional
  const [criarLotacao, setCriarLotacao] = useState(false);
  const [escolaSaesc, setEscolaSaesc] = useState<string>("");
  const [cargaHoraria, setCargaHoraria] = useState<string>("20");
  const [dataInicio, setDataInicio] = useState<Date>(new Date());

  const { criarPessoa, isSaving: salvandoPessoa } = usePessoasPool({ perfil: perfilPadrao });
  const { criarLotacao: criarLotacaoFn, isSaving: salvandoLotacao } = useLotacoesGestao();
  const { data: escolas = [] } = useEscolas();

  const isSaving = salvandoPessoa || salvandoLotacao;

  const handleSubmit = async () => {
    // Validações
    if (!nomeCompleto || !cpf || !email) {
      toast.error("Preencha os campos obrigatórios (nome, CPF e email)");
      return;
    }

    if (criarLotacao && (!escolaSaesc || !cargaHoraria)) {
      toast.error("Selecione a escola e a carga horária para a lotação");
      return;
    }

    try {
      // 1. Criar PESSOA
      const { data: pessoaData, error: pessoaError } = await supabase
        .from('pessoas')
        .insert({
          nome_completo: nomeCompleto,
          cpf: cpf.replace(/\D/g, ''),
          email,
          telefone: telefone || null,
          data_nascimento: dataNascimento ? format(dataNascimento, 'yyyy-MM-dd') : null,
          ativo: true,
        })
        .select()
        .single();

      if (pessoaError) throw pessoaError;
      if (!pessoaData) throw new Error("Erro ao criar pessoa");

      // 2. Criar USUARIO no auth.users
      const senha = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome: nomeCompleto,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário no auth");

      // 3. Criar registro em usuarios
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nome: nomeCompleto,
          email,
          pessoa_id: pessoaData.id,
          ativo: true,
        });

      if (usuarioError) throw usuarioError;

      // 4. Criar ROLE
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: perfilPadrao,
        });

      if (roleError) throw roleError;

      // 5. [OPCIONAL] Criar LOTACAO
      if (criarLotacao && escolaSaesc) {
        await criarLotacaoFn({
          pessoa_id: pessoaData.id,
          escola_saesc: escolaSaesc,
          perfil: perfilPadrao,
          carga_horaria: parseInt(cargaHoraria),
          data_inicio: format(dataInicio, 'yyyy-MM-dd'),
        });
      }

      const tipoPessoa = perfilPadrao === 'PROFESSOR' ? 'Professor' : 'Coordenador';
      toast.success(`${tipoPessoa} cadastrado com sucesso!${criarLotacao ? ' Lotação criada.' : ''}`);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao cadastrar professor:", error);
      toast.error(error.message || "Erro ao cadastrar professor");
    }
  };

  const resetForm = () => {
    setNomeCompleto("");
    setCpf("");
    setEmail("");
    setTelefone("");
    setDataNascimento(undefined);
    setCriarLotacao(false);
    setEscolaSaesc("");
    setCargaHoraria("20");
    setDataInicio(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo {perfilPadrao === 'PROFESSOR' ? 'Professor' : 'Coordenador'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* SEÇÃO 1: Dados Pessoais */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Dados Pessoais</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joao@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataNascimento && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataNascimento ? format(dataNascimento, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataNascimento}
                        onSelect={setDataNascimento}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 2: Lotação Opcional */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="criar-lotacao"
                  checked={criarLotacao}
                  onCheckedChange={(checked) => setCriarLotacao(checked as boolean)}
                />
                <Label htmlFor="criar-lotacao" className="font-semibold cursor-pointer">
                  Criar lotação imediatamente
                </Label>
              </div>

              {criarLotacao && (
                <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label>Escola *</Label>
                    <Select value={escolaSaesc} onValueChange={setEscolaSaesc}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola" />
                      </SelectTrigger>
                      <SelectContent>
                        {escolas.map((escola) => (
                          <SelectItem key={escola.id} value={escola.codigo_saesc}>
                            {escola.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carga">Carga Horária Semanal *</Label>
                    <Input
                      id="carga"
                      type="number"
                      min="1"
                      max="60"
                      value={cargaHoraria}
                      onChange={(e) => setCargaHoraria(e.target.value)}
                      placeholder="20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dataInicio}
                          onSelect={(date) => date && setDataInicio(date)}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">O que será criado:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Registro de <strong>Pessoa</strong> com dados pessoais</li>
                    <li>Conta de <strong>Usuário</strong> com email e senha gerada</li>
                    <li>Perfil de <strong>{perfilPadrao}</strong> no sistema</li>
                    {criarLotacao && <li>Lotação na escola selecionada</li>}
                  </ul>
                  {!criarLotacao && (
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Você poderá criar lotações posteriormente no Pool de {perfilPadrao === 'PROFESSOR' ? 'Professores' : 'Coordenadores'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Cadastrando..." : `Cadastrar ${perfilPadrao === 'PROFESSOR' ? 'Professor' : 'Coordenador'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
