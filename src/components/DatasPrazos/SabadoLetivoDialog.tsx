import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useCriarSabadoLetivo, useAtualizarSabadoLetivo } from "@/hooks/useSabadosLetivos";

const formSchema = z.object({
  escola_id: z.string().min(1, "Escola é obrigatória"),
  data: z.date({ message: "Data é obrigatória" }),
  tipo: z.enum(["REPLICA_DIA_SEMANA", "EVENTO_GERAL"]),
  dia_replica: z.enum(["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"]).optional(),
  descricao: z.string().optional(),
  exige_chamada: z.boolean().default(true),
});

interface SabadoLetivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolaId?: string;
}

export function SabadoLetivoDialog({ open, onOpenChange, escolaId }: SabadoLetivoDialogProps) {
  const criarSabadoLetivo = useCriarSabadoLetivo();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      escola_id: escolaId || "",
      tipo: "REPLICA_DIA_SEMANA",
      exige_chamada: true,
    },
  });

  const tipoSelecionado = form.watch("tipo");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await criarSabadoLetivo.mutateAsync({
      escola_id: values.escola_id,
      data: format(values.data, "yyyy-MM-dd"),
      tipo: values.tipo,
      dia_replica: values.dia_replica,
      descricao: values.descricao,
      exige_chamada: values.exige_chamada,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Sábado Letivo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Sábado</FormLabel>
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
                        disabled={(date) => date.getDay() !== 6}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Apenas sábados podem ser selecionados</FormDescription>
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
                      <SelectItem value="REPLICA_DIA_SEMANA">Replicar Dia da Semana</SelectItem>
                      <SelectItem value="EVENTO_GERAL">Evento Geral</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipoSelecionado === "REPLICA_DIA_SEMANA" && (
              <FormField
                control={form.control}
                name="dia_replica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da Semana a Replicar</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SEGUNDA">Segunda-feira</SelectItem>
                        <SelectItem value="TERCA">Terça-feira</SelectItem>
                        <SelectItem value="QUARTA">Quarta-feira</SelectItem>
                        <SelectItem value="QUINTA">Quinta-feira</SelectItem>
                        <SelectItem value="SEXTA">Sexta-feira</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Os horários deste dia serão replicados no sábado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {tipoSelecionado === "EVENTO_GERAL" && (
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Evento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Festa Junina, Reunião de Pais" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="exige_chamada"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Exige chamada/frequência</FormLabel>
                    <FormDescription>
                      Marque se os professores devem lançar frequência neste dia
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarSabadoLetivo.isPending}>
                {criarSabadoLetivo.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
