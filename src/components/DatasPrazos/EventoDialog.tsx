import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCriarEventoInstitucional, useAtualizarEventoInstitucional } from "@/hooks/useEventosInstitucionais";

interface EventoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolaId: string;
  evento?: {
    id: string;
    data: string;
    descricao: string;
    tipo: string;
    bloqueia_letivo: boolean;
    observacoes?: string;
    participantes?: string[];
  };
}

const formSchema = z.object({
  data: z.date({ message: "Selecione uma data" }),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  tipo: z.string().min(1, "Selecione um tipo"),
  bloqueia_letivo: z.boolean(),
  observacoes: z.string().optional(),
  participantes: z.array(z.string()).optional(),
});

export function EventoDialog({ open, onOpenChange, escolaId, evento }: EventoDialogProps) {
  const criarEvento = useCriarEventoInstitucional();
  const atualizarEvento = useAtualizarEventoInstitucional();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: evento ? {
      data: new Date(evento.data),
      descricao: evento.descricao,
      tipo: evento.tipo,
      bloqueia_letivo: evento.bloqueia_letivo,
      observacoes: evento.observacoes || "",
      participantes: evento.participantes || [],
    } : {
      data: new Date(),
      descricao: "",
      tipo: "REUNIAO",
      bloqueia_letivo: false,
      observacoes: "",
      participantes: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const dataFormatada = format(values.data, "yyyy-MM-dd");
    
    if (evento) {
      await atualizarEvento.mutateAsync({
        id: evento.id,
        updates: {
          ...values,
          data: dataFormatada,
        },
      });
    } else {
      await criarEvento.mutateAsync({
        escola_id: escolaId,
        ...values,
        data: dataFormatada,
      });
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{evento ? 'Editar' : 'Novo'} Evento Institucional</DialogTitle>
          <DialogDescription>
            {evento ? 'Atualize as informações do evento.' : 'Cadastre um novo evento institucional da escola.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Evento</FormLabel>
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
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={ptBR}
                        initialFocus
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
                    <Input placeholder="Ex: Reunião Pedagógica, Formação de Professores..." {...field} />
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
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="REUNIAO">Reunião</SelectItem>
                      <SelectItem value="FORMACAO">Formação</SelectItem>
                      <SelectItem value="EVENTO_CULTURAL">Evento Cultural</SelectItem>
                      <SelectItem value="EVENTO_ESPORTIVO">Evento Esportivo</SelectItem>
                      <SelectItem value="COMEMORACAO">Comemoração</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloqueia_letivo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Bloqueia Dia Letivo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Marque se este evento impede aulas normais
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes adicionais sobre o evento..." 
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarEvento.isPending || atualizarEvento.isPending}>
                {(criarEvento.isPending || atualizarEvento.isPending) ? "Salvando..." : (evento ? "Atualizar" : "Cadastrar")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
