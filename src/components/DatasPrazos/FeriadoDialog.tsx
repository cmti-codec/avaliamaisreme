import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useCriarFeriado, useAtualizarFeriado } from "@/hooks/useFeriados";
import { verificarSobreposicao, formatarMensagemSobreposicao } from "@/lib/validacao-sobreposicao";
import { toast } from "sonner";
import { useState } from "react";

const formSchema = z.object({
  data: z.date({ message: "Data é obrigatória" }),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  tipo: z.enum(["FERIADO", "PONTO_FACULTATIVO"]),
  abrangencia: z.enum(["NACIONAL", "ESTADUAL", "MUNICIPAL"]),
  ano: z.coerce.number(),
});

interface FeriadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feriado?: {
    id: string;
    data: string;
    descricao: string;
    tipo: string;
    abrangencia: string;
    ano: number;
  };
}

export function FeriadoDialog({ open, onOpenChange, feriado }: FeriadoDialogProps) {
  const [sobreposicaoInfo, setSobreposicaoInfo] = useState<string | null>(null);
  const criarFeriado = useCriarFeriado();
  const atualizarFeriado = useAtualizarFeriado();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: feriado ? {
      data: new Date(feriado.data),
      descricao: feriado.descricao,
      tipo: feriado.tipo as "FERIADO" | "PONTO_FACULTATIVO",
      abrangencia: feriado.abrangencia as "NACIONAL" | "ESTADUAL" | "MUNICIPAL",
      ano: feriado.ano,
    } : {
      tipo: "FERIADO",
      abrangencia: "MUNICIPAL",
      ano: new Date().getFullYear(),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const dataStr = format(values.data, "yyyy-MM-dd");
    
    // Verificar sobreposição (sem escolaId pois feriados são gerais)
    const { temSobreposicao, eventos } = await verificarSobreposicao(
      dataStr,
      "00000000-0000-0000-0000-000000000000", // ID genérico para feriados
      feriado?.id,
      "FERIADO"
    );
    
    if (temSobreposicao) {
      const mensagem = formatarMensagemSobreposicao(eventos);
      setSobreposicaoInfo(mensagem);
      toast.warning("Atenção: Há eventos sobrepostos nesta data", {
        description: "Verifique o aviso abaixo antes de confirmar.",
      });
      return; // Não submete automaticamente, permite usuário decidir
    }
    
    if (feriado) {
      await atualizarFeriado.mutateAsync({
        id: feriado.id,
        updates: {
          data: dataStr,
          descricao: values.descricao,
          tipo: values.tipo,
          abrangencia: values.abrangencia,
          ano: values.ano,
        },
      });
    } else {
      await criarFeriado.mutateAsync({
        data: dataStr,
        descricao: values.descricao,
        tipo: values.tipo,
        abrangencia: values.abrangencia,
        ano: values.ano,
      });
    }
    
    onOpenChange(false);
    form.reset();
    setSobreposicaoInfo(null);
  };
  
  const handleForcarCriacao = async () => {
    const values = form.getValues();
    const dataStr = format(values.data, "yyyy-MM-dd");
    
    if (feriado) {
      await atualizarFeriado.mutateAsync({
        id: feriado.id,
        updates: {
          data: dataStr,
          descricao: values.descricao,
          tipo: values.tipo,
          abrangencia: values.abrangencia,
          ano: values.ano,
        },
      });
    } else {
      await criarFeriado.mutateAsync({
        data: dataStr,
        descricao: values.descricao,
        tipo: values.tipo,
        abrangencia: values.abrangencia,
        ano: values.ano,
      });
    }
    
    onOpenChange(false);
    form.reset();
    setSobreposicaoInfo(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{feriado ? "Editar Feriado" : "Cadastrar Feriado"}</DialogTitle>
          <DialogDescription>
            {feriado ? "Atualize as informações do feriado" : "Cadastre um novo feriado nacional, estadual ou municipal"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione a data"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          if (date) {
                            form.setValue("ano", date.getFullYear());
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dia da Consciência Negra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FERIADO">Feriado</SelectItem>
                      <SelectItem value="PONTO_FACULTATIVO">Ponto Facultativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abrangencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abrangência</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NACIONAL">Nacional</SelectItem>
                      <SelectItem value="ESTADUAL">Estadual</SelectItem>
                      <SelectItem value="MUNICIPAL">Municipal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sobreposicaoInfo && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Eventos sobrepostos nesta data:</strong>
                  <pre className="text-xs mt-1 whitespace-pre-wrap">{sobreposicaoInfo}</pre>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                onOpenChange(false);
                setSobreposicaoInfo(null);
                form.reset();
              }}>
                Cancelar
              </Button>
              {sobreposicaoInfo ? (
                <Button 
                  type="button" 
                  onClick={handleForcarCriacao}
                  disabled={criarFeriado.isPending || atualizarFeriado.isPending}
                  variant="destructive"
                >
                  {(criarFeriado.isPending || atualizarFeriado.isPending) ? "Processando..." : "Cadastrar Mesmo Assim"}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={criarFeriado.isPending || atualizarFeriado.isPending}
                >
                  {(criarFeriado.isPending || atualizarFeriado.isPending) ? "Processando..." : (feriado ? "Atualizar" : "Cadastrar")}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
