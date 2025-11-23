import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCriarFeriado, useAtualizarFeriado } from "@/hooks/useFeriados";

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

export function FeriadoDialog({ open, onOpenChange }: FeriadoDialogProps) {
  const criarFeriado = useCriarFeriado();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: "FERIADO",
      abrangencia: "MUNICIPAL",
      ano: new Date().getFullYear(),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await criarFeriado.mutateAsync({
      data: format(values.data, "yyyy-MM-dd"),
      descricao: values.descricao,
      tipo: values.tipo,
      abrangencia: values.abrangencia,
      ano: values.ano,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Feriado</DialogTitle>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarFeriado.isPending}>
                {criarFeriado.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
