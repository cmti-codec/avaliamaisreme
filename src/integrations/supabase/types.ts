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
      escolas: {
        Row: {
          ativa: boolean | null
          codigo_inep: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          matriz_curricular_id: string | null
          nome: string
          telefone: string | null
        }
        Insert: {
          ativa?: boolean | null
          codigo_inep?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          matriz_curricular_id?: string | null
          nome: string
          telefone?: string | null
        }
        Update: {
          ativa?: boolean | null
          codigo_inep?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          matriz_curricular_id?: string | null
          nome?: string
          telefone?: string | null
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
      matriz_componentes: {
        Row: {
          carga_horaria_semanal: number
          componente_nome: string
          id: string
          matriz_id: string
          ordem: number | null
        }
        Insert: {
          carga_horaria_semanal: number
          componente_nome: string
          id?: string
          matriz_id: string
          ordem?: number | null
        }
        Update: {
          carga_horaria_semanal?: number
          componente_nome?: string
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
          created_at: string | null
          escola_id: string
          formacoes: Json | null
          horas_pl: number | null
          id: string
          nome: string
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          carga_horaria_contratual?: number | null
          created_at?: string | null
          escola_id: string
          formacoes?: Json | null
          horas_pl?: number | null
          id?: string
          nome: string
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          carga_horaria_contratual?: number | null
          created_at?: string | null
          escola_id?: string
          formacoes?: Json | null
          horas_pl?: number | null
          id?: string
          nome?: string
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
            isOneToOne: false
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
          grupo_ano: string
          id: string
          matriz_curricular: Json | null
          segmento: string
          turma: string
          turno: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          escola_id: string
          grupo_ano: string
          id?: string
          matriz_curricular?: Json | null
          segmento: string
          turma: string
          turno?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          escola_id?: string
          grupo_ano?: string
          id?: string
          matriz_curricular?: Json | null
          segmento?: string
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
      usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          escola_id: string | null
          id: string
          nome: string
          perfil: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          escola_id?: string | null
          id: string
          nome: string
          perfil?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          escola_id?: string | null
          id?: string
          nome?: string
          perfil?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
