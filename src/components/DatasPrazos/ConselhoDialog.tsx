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
import { useCriarConselho } from "@/hooks/useConselhos";
import { useBimestres } from "@/hooks/useAnosLetivos";

const formSchema = z.object({
  escola_id: z.string().min(1, "Escola é obrigatória"),
  ano_letivo_id: z.string().min(1, "Ano letivo é obrigatório"),
  bimestre_id: z.string().min(1, "Bimestre é obrigatório"),
  data: z.date({ message: "Data é obrigatória" }),
  descricao: z.string().optional(),
  bloqueia_edicao_avaliacoes: z.boolean().default(true),
});

interface ConselhoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolaId?: string;
  anoLetivoId?: string;
}

export function ConselhoDialog({ open, onOpenChange, escolaId, anoLetivoId }: ConselhoDialogProps) {
  const criarConselho = useCriarConselho();
  const { data: bimestres } = useBimestres(anoLetivoId || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      escola_id: escolaId || "",
      ano_letivo_id: anoLetivoId || "",
      bloqueia_edicao_avaliacoes: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await criarConselho.mutateAsync({
      escola_id: values.escola_id,
      ano_letivo_id: values.ano_letivo_id,
      bimestre_id: values.bimestre_id,
      data: format(values.data, "yyyy-MM-dd"),
      descricao: values.descricao,
      bloqueia_edicao_avaliacoes: values.bloqueia_edicao_avaliacoes,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Conselho de Classe</DialogTitle>
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
                  <FormLabel>Data do Conselho</FormLabel>
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
                    <Input placeholder="Ex: Conselho ordinário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloqueia_edicao_avaliacoes"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Bloquear edição de avaliações</FormLabel>
                    <FormDescription>
                      Após a data do conselho, professores não poderão editar notas e avaliações do bimestre
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarConselho.isPending}>
                {criarConselho.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
