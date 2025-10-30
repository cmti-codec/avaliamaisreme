export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          datmtr: string | null
          desoca: string | null
          dtomtrc: string | null
          id: string
          nomalu: string
          numalu: string
          nummtr: string | null
          saesc: string
          sigeta: string
          sigla: string | null
          sigtur: string
          sioca: string | null
          trmcla: string
          turma_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          datmtr?: string | null
          desoca?: string | null
          dtomtrc?: string | null
          id?: string
          nomalu: string
          numalu: string
          nummtr?: string | null
          saesc: string
          sigeta: string
          sigla?: string | null
          sigtur: string
          sioca?: string | null
          trmcla: string
          turma_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          datmtr?: string | null
          desoca?: string | null
          dtomtrc?: string | null
          id?: string
          nomalu?: string
          numalu?: string
          nummtr?: string | null
          saesc?: string
          sigeta?: string
          sigla?: string | null
          sigtur?: string
          sioca?: string | null
          trmcla?: string
          turma_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_saesc_fkey"
            columns: ["saesc"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas_com_matriz"
            referencedColumns: ["turma_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          acao: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          timestamp: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          timestamp?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          timestamp?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_roles: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          metadata: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          metadata?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          metadata?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: []
      }
      cargas_horarias_componentes: {
        Row: {
          carga_horaria_semanal: number
          componente_nome: string
          created_at: string | null
          etapa_modalidade: string
          grupo_ano: string
          id: string
        }
        Insert: {
          carga_horaria_semanal: number
          componente_nome: string
          created_at?: string | null
          etapa_modalidade: string
          grupo_ano: string
          id?: string
        }
        Update: {
          carga_horaria_semanal?: number
          componente_nome?: string
          created_at?: string | null
          etapa_modalidade?: string
          grupo_ano?: string
          id?: string
        }
        Relationships: []
      }
      componentes_curriculares: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          id: string
          nome: string
          segmentos: Json | null
          sigla: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
          segmentos?: Json | null
          sigla?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          segmentos?: Json | null
          sigla?: string | null
        }
        Relationships: []
      }
      escola_matrizes: {
        Row: {
          created_at: string | null
          escola_id: string
          id: string
          matriz_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          escola_id: string
          id?: string
          matriz_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          escola_id?: string
          id?: string
          matriz_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escola_matrizes_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escola_matrizes_matriz_id_fkey"
            columns: ["matriz_id"]
            isOneToOne: false
            referencedRelation: "matrizes_curriculares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escola_matrizes_matriz_id_fkey"
            columns: ["matriz_id"]
            isOneToOne: false
            referencedRelation: "turmas_com_matriz"
            referencedColumns: ["matriz_id"]
          },
        ]
      }
      escolas: {
        Row: {
          ativa: boolean | null
          codigo_inep: string | null
          codigo_saesc: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          localidade: string | null
          matriz_curricular_id: string | null
          nome: string
          regiao: string | null
          saesc: string | null
          telefone: string | null
          tipo: string | null
        }
        Insert: {
          ativa?: boolean | null
          codigo_inep?: string | null
          codigo_saesc?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          localidade?: string | null
          matriz_curricular_id?: string | null
          nome: string
          regiao?: string | null
          saesc?: string | null
          telefone?: string | null
          tipo?: string | null
        }
        Update: {
          ativa?: boolean | null
          codigo_inep?: string | null
          codigo_saesc?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          localidade?: string | null
          matriz_curricular_id?: string | null
          nome?: string
          regiao?: string | null
          saesc?: string | null
          telefone?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escolas_matriz_curricular_id_fkey"
            columns: ["matriz_curricular_id"]
            isOneToOne: false
            referencedRelation: "matrizes_curriculares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escolas_matriz_curricular_id_fkey"
            columns: ["matriz_curricular_id"]
            isOneToOne: false
            referencedRelation: "turmas_com_matriz"
            referencedColumns: ["matriz_id"]
          },
        ]
      }
      formacoes: {
        Row: {
          ativo: boolean | null
          componentes_permitidos: Json | null
          created_at: string | null
          id: string
          nome: string
          segmentos: Json | null
        }
        Insert: {
          ativo?: boolean | null
          componentes_permitidos?: Json | null
          created_at?: string | null
          id?: string
          nome: string
          segmentos?: Json | null
        }
        Update: {
          ativo?: boolean | null
          componentes_permitidos?: Json | null
          created_at?: string | null
          id?: string
          nome?: string
          segmentos?: Json | null
        }
        Relationships: []
      }
      horarios: {
        Row: {
          componente_curricular: string
          created_at: string | null
          created_by: string | null
          dia_semana: string | null
          id: string
          professor_id: string
          tempo: number | null
          turma_id: string
          updated_at: string | null
        }
        Insert: {
          componente_curricular: string
          created_at?: string | null
          created_by?: string | null
          dia_semana?: string | null
          id?: string
          professor_id: string
          tempo?: number | null
          turma_id: string
          updated_at?: string | null
        }
        Update: {
          componente_curricular?: string
          created_at?: string | null
          created_by?: string | null
          dia_semana?: string | null
          id?: string
          professor_id?: string
          tempo?: number | null
          turma_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas_com_matriz"
            referencedColumns: ["turma_id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string | null
          detalhes_erros: Json | null
          id: string
          linhas_erro: number
          linhas_sucesso: number
          nome_arquivo: string
          status: string
          tipo_importacao: string
          total_linhas: number
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          detalhes_erros?: Json | null
          id?: string
          linhas_erro: number
          linhas_sucesso: number
          nome_arquivo: string
          status: string
          tipo_importacao: string
          total_linhas: number
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          detalhes_erros?: Json | null
          id?: string
          linhas_erro?: number
          linhas_sucesso?: number
          nome_arquivo?: string
          status?: string
          tipo_importacao?: string
          total_linhas?: number
          usuario_id?: string
        }
        Relationships: []
      }
      lotacoes_professores: {
        Row: {
          ano_letivo: string
          carga_total: number | null
          created_at: string | null
          escola_id: string
          horas_aula: number | null
          id: string
          pl: number | null
          professor_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ano_letivo: string
          carga_total?: number | null
          created_at?: string | null
          escola_id: string
          horas_aula?: number | null
          id?: string
          pl?: number | null
          professor_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_letivo?: string
          carga_total?: number | null
          created_at?: string | null
          escola_id?: string
          horas_aula?: number | null
          id?: string
          pl?: number | null
          professor_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotacoes_professores_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotacoes_professores_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_componentes: {
        Row: {
          carga_horaria_semanal: number
          componente_nome: string
          grupo_ano: string
          id: string
          matriz_id: string
          ordem: number | null
        }
        Insert: {
          carga_horaria_semanal: number
          componente_nome: string
          grupo_ano: string
          id?: string
          matriz_id: string
          ordem?: number | null
        }
        Update: {
          carga_horaria_semanal?: number
          componente_nome?: string
          grupo_ano?: string
          id?: string
          matriz_id?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matriz_componentes_componente_nome_fkey"
            columns: ["componente_nome"]
            isOneToOne: false
            referencedRelation: "componentes_curriculares"
            referencedColumns: ["nome"]
          },
          {
            foreignKeyName: "matriz_componentes_matriz_id_fkey"
            columns: ["matriz_id"]
            isOneToOne: false
            referencedRelation: "matrizes_curriculares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriz_componentes_matriz_id_fkey"
            columns: ["matriz_id"]
            isOneToOne: false
            referencedRelation: "turmas_com_matriz"
            referencedColumns: ["matriz_id"]
          },
        ]
      }
      matrizes_curriculares: {
        Row: {
          ativa: boolean | null
          codigo: string
          created_at: string | null
          descricao: string | null
          etapa_modalidade: string
          grupo_ano: string
          id: string
          nome: string
          tipo_jornada: string | null
          total_horas_semanais: number | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          etapa_modalidade: string
          grupo_ano: string
          id?: string
          nome: string
          tipo_jornada?: string | null
          total_horas_semanais?: number | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          etapa_modalidade?: string
          grupo_ano?: string
          id?: string
          nome?: string
          tipo_jornada?: string | null
          total_horas_semanais?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permissoes_funcionalidade: {
        Row: {
          funcionalidade: string
          id: string
          perfil: Database["public"]["Enums"]["app_role"]
          pode_aprovar: boolean | null
          pode_escrever: boolean | null
          pode_ler: boolean | null
        }
        Insert: {
          funcionalidade: string
          id?: string
          perfil: Database["public"]["Enums"]["app_role"]
          pode_aprovar?: boolean | null
          pode_escrever?: boolean | null
          pode_ler?: boolean | null
        }
        Update: {
          funcionalidade?: string
          id?: string
          perfil?: Database["public"]["Enums"]["app_role"]
          pode_aprovar?: boolean | null
          pode_escrever?: boolean | null
          pode_ler?: boolean | null
        }
        Relationships: []
      }
      professor_eventos: {
        Row: {
          created_at: string | null
          dia_semana: string | null
          id: string
          professor_id: string
          tempo: number | null
          tipo_evento: string | null
        }
        Insert: {
          created_at?: string | null
          dia_semana?: string | null
          id?: string
          professor_id: string
          tempo?: number | null
          tipo_evento?: string | null
        }
        Update: {
          created_at?: string | null
          dia_semana?: string | null
          id?: string
          professor_id?: string
          tempo?: number | null
          tipo_evento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_eventos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          ativo: boolean | null
          carga_horaria_contratual: number | null
          cargo: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          escola_id: string | null
          formacoes: Json | null
          funcao_atual: string | null
          horas_pl: number | null
          id: string
          matricula: string | null
          nome: string
          telefone: string | null
          tipo_vinculo: Database["public"]["Enums"]["tipo_vinculo"] | null
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          carga_horaria_contratual?: number | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          escola_id?: string | null
          formacoes?: Json | null
          funcao_atual?: string | null
          horas_pl?: number | null
          id?: string
          matricula?: string | null
          nome: string
          telefone?: string | null
          tipo_vinculo?: Database["public"]["Enums"]["tipo_vinculo"] | null
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          carga_horaria_contratual?: number | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          escola_id?: string | null
          formacoes?: Json | null
          funcao_atual?: string | null
          horas_pl?: number | null
          id?: string
          matricula?: string | null
          nome?: string
          telefone?: string | null
          tipo_vinculo?: Database["public"]["Enums"]["tipo_vinculo"] | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professores_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          escola_id: string
          etapa_modalidade: string
          grupo_ano: string
          id: string
          matriz_curricular: Json | null
          turma: string
          turno: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          escola_id: string
          etapa_modalidade: string
          grupo_ano: string
          id?: string
          matriz_curricular?: Json | null
          turma: string
          turno?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          escola_id?: string
          etapa_modalidade?: string
          grupo_ano?: string
          id?: string
          matriz_curricular?: Json | null
          turma?: string
          turno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turmas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          escola_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          escola_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          escola_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          escola_id: string | null
          id: string
          impersonated_by: string | null
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          escola_id?: string | null
          id: string
          impersonated_by?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          escola_id?: string | null
          id?: string
          impersonated_by?: string | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_impersonated_by_fkey"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      turmas_com_matriz: {
        Row: {
          componentes: Json | null
          etapa_modalidade: string | null
          grupo_ano: string | null
          matriz_codigo: string | null
          matriz_id: string | null
          matriz_nome: string | null
          nome_escola: string | null
          saesc: string | null
          total_horas_semanais: number | null
          turma: string | null
          turma_id: string | null
          turno: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turmas_escola_id_fkey"
            columns: ["saesc"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_upsert_turma: {
        Args: {
          p_escola_id: string
          p_etapa_modalidade: string
          p_grupo_ano: string
          p_turma: string
          p_turno: string
        }
        Returns: string
      }
      get_user_escola_id: { Args: { _user_id?: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      tem_permissao: { Args: { func: string; tipo: string }; Returns: boolean }
      validar_horario: {
        Args: {
          p_componente: string
          p_dia_semana: string
          p_professor_id: string
          p_tempo: number
          p_turma_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "ADMIN"
        | "GESTOR_SEMED"
        | "TECNICO_SEMED"
        | "DIRETOR"
        | "SECRETARIO"
        | "COORDENADOR"
        | "PROFESSOR"
      perfil_usuario:
        | "ADMIN"
        | "GESTOR_SEMED"
        | "TECNICO_SEMED"
        | "DIRETOR"
        | "SECRETARIO"
        | "COORDENADOR"
        | "PROFESSOR"
      tipo_vinculo: "EFETIVO" | "CONVOCADO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "ADMIN",
        "GESTOR_SEMED",
        "TECNICO_SEMED",
        "DIRETOR",
        "SECRETARIO",
        "COORDENADOR",
        "PROFESSOR",
      ],
      perfil_usuario: [
        "ADMIN",
        "GESTOR_SEMED",
        "TECNICO_SEMED",
        "DIRETOR",
        "SECRETARIO",
        "COORDENADOR",
        "PROFESSOR",
      ],
      tipo_vinculo: ["EFETIVO", "CONVOCADO"],
    },
  },
} as const
