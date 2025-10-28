import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface EscolaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EscolaCreateDialog({ open, onOpenChange }: EscolaCreateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    codigo_inep: "",
    codigo_saesc: "",
    tipo: "",
    localidade: "",
    regiao: "",
    endereco: "",
    telefone: "",
    email: "",
    ativa: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("escolas")
        .insert({
          ...formData,
          saesc: crypto.randomUUID(),
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Escola criada com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        nome: "",
        codigo_inep: "",
        codigo_saesc: "",
        tipo: "",
        localidade: "",
        regiao: "",
        endereco: "",
        telefone: "",
        email: "",
        ativa: true,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Escola</DialogTitle>
          <DialogDescription>
            Cadastre uma nova escola na rede
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome da Escola *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="codigo_inep">Código INEP</Label>
              <Input
                id="codigo_inep"
                value={formData.codigo_inep}
                onChange={(e) => setFormData({ ...formData, codigo_inep: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="codigo_saesc">Código SAESC</Label>
              <Input
                id="codigo_saesc"
                value={formData.codigo_saesc}
                onChange={(e) => setFormData({ ...formData, codigo_saesc: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMEI">EMEI</SelectItem>
                  <SelectItem value="EMEF">EMEF</SelectItem>
                  <SelectItem value="CEI">CEI</SelectItem>
                  <SelectItem value="CEMEI">CEMEI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="localidade">Localidade</Label>
              <Select
                value={formData.localidade}
                onValueChange={(value) => setFormData({ ...formData, localidade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URBANA">Urbana</SelectItem>
                  <SelectItem value="RURAL">Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="regiao">Região</Label>
              <Input
                id="regiao"
                value={formData.regiao}
                onChange={(e) => setFormData({ ...formData, regiao: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Switch
                id="ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
              />
              <Label htmlFor="ativa">Escola Ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Escola"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
