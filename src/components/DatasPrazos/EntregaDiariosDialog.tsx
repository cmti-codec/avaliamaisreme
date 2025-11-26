import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useCriarEntregaDiarios, useAtualizarEntregaDiarios } from "@/hooks/useEntregasDiarios";
import { useBimestres } from "@/hooks/useAnosLetivos";
import { verificarSobreposicao, formatarMensagemSobreposicao } from "@/lib/validacao-sobreposicao";
import { toast } from "sonner";
import { useState } from "react";

const formSchema = z.object({
  escola_id: z.string().min(1, "Escola é obrigatória"),
  ano_letivo_id: z.string().min(1, "Ano letivo é obrigatório"),
  bimestre_id: z.string().min(1, "Bimestre é obrigatório"),
  data: z.date({ message: "Data é obrigatória" }),
  descricao: z.string().optional(),
});

interface EntregaDiariosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolaId?: string;
  anoLetivoId?: string;
}

export function EntregaDiariosDialog({ open, onOpenChange, escolaId, anoLetivoId }: EntregaDiariosDialogProps) {
  const [sobreposicaoInfo, setSobreposicaoInfo] = useState<string | null>(null);
  const criarEntrega = useCriarEntregaDiarios();
  const { data: bimestres } = useBimestres(anoLetivoId || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      escola_id: escolaId || "",
      ano_letivo_id: anoLetivoId || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const dataStr = format(values.data, "yyyy-MM-dd");
    
    // Verificar sobreposição
    const { temSobreposicao, eventos } = await verificarSobreposicao(
      dataStr,
      values.escola_id,
      undefined,
      "ENTREGA_DIARIOS"
    );
    
    if (temSobreposicao) {
      const mensagem = formatarMensagemSobreposicao(eventos);
      setSobreposicaoInfo(mensagem);
      toast.warning("Atenção: Há eventos sobrepostos nesta data", {
        description: "Verifique o aviso abaixo antes de confirmar.",
      });
      return;
    }
    
    await criarEntrega.mutateAsync({
      escola_id: values.escola_id,
      ano_letivo_id: values.ano_letivo_id,
      bimestre_id: values.bimestre_id,
      data: dataStr,
      descricao: values.descricao,
    });
    onOpenChange(false);
    form.reset();
    setSobreposicaoInfo(null);
  };
  
  const handleForcarCriacao = async () => {
    const values = form.getValues();
    const dataStr = format(values.data, "yyyy-MM-dd");
    
    await criarEntrega.mutateAsync({
      escola_id: values.escola_id,
      ano_letivo_id: values.ano_letivo_id,
      bimestre_id: values.bimestre_id,
      data: dataStr,
      descricao: values.descricao,
    });
    onOpenChange(false);
    form.reset();
    setSobreposicaoInfo(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Entrega de Diários</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bimestre_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bimestre</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o bimestre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bimestres?.map((bimestre) => (
                        <SelectItem key={bimestre.id} value={bimestre.id}>
                          {bimestre.numero}º Bimestre ({format(new Date(bimestre.data_inicio), "dd/MM")} a {format(new Date(bimestre.data_fim), "dd/MM")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Limite para Entrega</FormLabel>
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
                        onSelect={field.onChange}
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
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Entrega dos diários preenchidos" {...field} />
                  </FormControl>
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
                  disabled={criarEntrega.isPending}
                  variant="destructive"
                >
                  {criarEntrega.isPending ? "Processando..." : "Cadastrar Mesmo Assim"}
                </Button>
              ) : (
                <Button type="submit" disabled={criarEntrega.isPending}>
                  {criarEntrega.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
