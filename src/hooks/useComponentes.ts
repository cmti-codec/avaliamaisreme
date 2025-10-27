import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ComponenteCurricular {
  id: string;
  nome: string;
  sigla: string | null;
  segmentos: string[] | null;
  ativo: boolean;
  cor: string | null;
  created_at: string;
}

export const useComponentes = () => {
  return useQuery({
    queryKey: ["componentes-curriculares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("componentes_curriculares")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data as ComponenteCurricular[];
    },
  });
};

export const useCreateComponente = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (componente: {
      nome: string;
      sigla: string;
      segmentos: string[];
    }) => {
      const { data, error } = await supabase
        .from("componentes_curriculares")
        .insert({
          nome: componente.nome,
          sigla: componente.sigla,
          segmentos: componente.segmentos,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["componentes-curriculares"] });
      toast({
        title: "Componente criado",
        description: "O componente curricular foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar componente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
