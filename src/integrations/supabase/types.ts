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
      anos_letivos: {
        Row: {
          ano: number
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          data_fim: string
          data_inicio: string
          escola_id: string
          id: string
        }
        Insert: {
          ano: number
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim: string
          data_inicio: string
          escola_id: string
          id?: string
        }
        Update: {
          ano?: number
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          escola_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anos_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anos_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anos_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "anos_letivos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_impersonation: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          session_token: string
          target_user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          session_token: string
          target_user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          session_token?: string
          target_user_id?: string
        }
        Relationships: []
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
      avaliacoes: {
        Row: {
          aluno_id: string
          created_at: string | null
          data_avaliacao: string
          diario_id: string
          id: string
          lancado_em: string | null
          lancado_por: string | null
          nota: number | null
          nota_maxima: number | null
          observacao: string | null
          tipo_avaliacao: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          data_avaliacao: string
          diario_id: string
          id?: string
          lancado_em?: string | null
          lancado_por?: string | null
          nota?: number | null
          nota_maxima?: number | null
          observacao?: string | null
          tipo_avaliacao: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          data_avaliacao?: string
          diario_id?: string
          id?: string
          lancado_em?: string | null
          lancado_por?: string | null
          nota?: number | null
          nota_maxima?: number | null
          observacao?: string | null
          tipo_avaliacao?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_diario_id_fkey"
            columns: ["diario_id"]
            isOneToOne: false
            referencedRelation: "diarios_classe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_lancado_por_fkey"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_lancado_por_fkey"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_lancado_por_fkey"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      bimestres: {
        Row: {
          ano_letivo_id: string
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          numero: number
        }
        Insert: {
          ano_letivo_id: string
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          numero: number
        }
        Update: {
          ano_letivo_id?: string
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "bimestres_ano_letivo_id_fkey"
            columns: ["ano_letivo_id"]
            isOneToOne: false
            referencedRelation: "anos_letivos"
            referencedColumns: ["id"]
          },
        ]
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
      conselhos_classe: {
        Row: {
          ano_letivo_id: string
          bimestre_id: string
          bloqueia_edicao_avaliacoes: boolean | null
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string | null
          escola_id: string
          id: string
          segmentos: Json | null
          turmas_ids: Json | null
        }
        Insert: {
          ano_letivo_id: string
          bimestre_id: string
          bloqueia_edicao_avaliacoes?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao?: string | null
          escola_id: string
          id?: string
          segmentos?: Json | null
          turmas_ids?: Json | null
        }
        Update: {
          ano_letivo_id?: string
          bimestre_id?: string
          bloqueia_edicao_avaliacoes?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string | null
          escola_id?: string
          id?: string
          segmentos?: Json | null
          turmas_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conselhos_classe_ano_letivo_id_fkey"
            columns: ["ano_letivo_id"]
            isOneToOne: false
            referencedRelation: "anos_letivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conselhos_classe_bimestre_id_fkey"
            columns: ["bimestre_id"]
            isOneToOne: false
            referencedRelation: "bimestres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conselhos_classe_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conselhos_classe_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conselhos_classe_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "conselhos_classe_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      diarios_classe: {
        Row: {
          ano_letivo: string
          ativo: boolean | null
          componente_curricular: string
          created_at: string | null
          id: string
          professor_id: string
          tipo_diario: string | null
          turma_id: string
          turno_diario: string | null
          updated_at: string | null
        }
        Insert: {
          ano_letivo?: string
          ativo?: boolean | null
          componente_curricular: string
          created_at?: string | null
          id?: string
          professor_id: string
          tipo_diario?: string | null
          turma_id: string
          turno_diario?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_letivo?: string
          ativo?: boolean | null
          componente_curricular?: string
          created_at?: string | null
          id?: string
          professor_id?: string
          tipo_diario?: string | null
          turma_id?: string
          turno_diario?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diarios_classe_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diarios_classe_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["professor_id"]
          },
          {
            foreignKeyName: "diarios_classe_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diarios_classe_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas_com_matriz"
            referencedColumns: ["turma_id"]
          },
        ]
      }
      dias_nao_letivos: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string
          escola_id: string | null
          id: string
          justificativa: string
          origem: string
          precisa_compensacao: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao: string
          escola_id?: string | null
          id?: string
          justificativa: string
          origem: string
          precisa_compensacao?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string
          escola_id?: string | null
          id?: string
          justificativa?: string
          origem?: string
          precisa_compensacao?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dias_nao_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dias_nao_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dias_nao_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "dias_nao_letivos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas_diarios: {
        Row: {
          ano_letivo_id: string
          bimestre_id: string
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string | null
          escola_id: string
          id: string
          professores_entregaram: Json | null
          segmentos: Json | null
          turmas_ids: Json | null
        }
        Insert: {
          ano_letivo_id: string
          bimestre_id: string
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao?: string | null
          escola_id: string
          id?: string
          professores_entregaram?: Json | null
          segmentos?: Json | null
          turmas_ids?: Json | null
        }
        Update: {
          ano_letivo_id?: string
          bimestre_id?: string
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string | null
          escola_id?: string
          id?: string
          professores_entregaram?: Json | null
          segmentos?: Json | null
          turmas_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_diarios_ano_letivo_id_fkey"
            columns: ["ano_letivo_id"]
            isOneToOne: false
            referencedRelation: "anos_letivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_diarios_bimestre_id_fkey"
            columns: ["bimestre_id"]
            isOneToOne: false
            referencedRelation: "bimestres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_diarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_diarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_diarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "entregas_diarios_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
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
      eventos_institucionais: {
        Row: {
          bloqueia_letivo: boolean | null
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string
          escola_id: string
          id: string
          observacoes: string | null
          participantes: Json | null
          tipo: string
        }
        Insert: {
          bloqueia_letivo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao: string
          escola_id: string
          id?: string
          observacoes?: string | null
          participantes?: Json | null
          tipo: string
        }
        Update: {
          bloqueia_letivo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string
          escola_id?: string
          id?: string
          observacoes?: string | null
          participantes?: Json | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_institucionais_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_institucionais_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_institucionais_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "eventos_institucionais_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      exames_finais: {
        Row: {
          ano_letivo_id: string
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string | null
          id: string
        }
        Insert: {
          ano_letivo_id: string
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao?: string | null
          id?: string
        }
        Update: {
          ano_letivo_id?: string
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exames_finais_ano_letivo_id_fkey"
            columns: ["ano_letivo_id"]
            isOneToOne: true
            referencedRelation: "anos_letivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_finais_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_finais_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_finais_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      feriados: {
        Row: {
          abrangencia: string
          ano: number
          compensacao_sabado_id: string | null
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string
          id: string
          tipo: string
        }
        Insert: {
          abrangencia: string
          ano: number
          compensacao_sabado_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao: string
          id?: string
          tipo: string
        }
        Update: {
          abrangencia?: string
          ano?: number
          compensacao_sabado_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "feriados_compensacao_sabado_id_fkey"
            columns: ["compensacao_sabado_id"]
            isOneToOne: false
            referencedRelation: "sabados_letivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feriados_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feriados_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feriados_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
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
      frequencias: {
        Row: {
          aluno_id: string
          created_at: string | null
          data_aula: string
          diario_id: string
          id: string
          justificativa: string | null
          lancado_em: string | null
          lancado_por: string | null
          observacao: string | null
          presente: boolean
          tempo: number
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          data_aula: string
          diario_id: string
          id?: string
          justificativa?: string | null
          lancado_em?: string | null
          lancado_por?: string | null
          observacao?: string | null
          presente?: boolean
          tempo: number
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          data_aula?: string
          diario_id?: string
          id?: string
          justificativa?: string | null
          lancado_em?: string | null
          lancado_por?: string | null
          observacao?: string | null
          presente?: boolean
          tempo?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frequencias_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencias_diario_id_fkey"
            columns: ["diario_id"]
            isOneToOne: false
            referencedRelation: "diarios_classe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencias_lancado_por_fkey"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencias_lancado_por_fkey"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencias_lancado_por_fkey"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
        ]
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
            foreignKeyName: "horarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "horarios_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["professor_id"]
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
      impersonation_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          ended_at: string | null
          expires_at: string
          id: string
          session_token: string
          target_user_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          ended_at?: string | null
          expires_at: string
          id?: string
          session_token: string
          target_user_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          session_token?: string
          target_user_id?: string
        }
        Relationships: []
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
      lotacoes: {
        Row: {
          ano_letivo: string | null
          ativo: boolean
          carga_horaria: number | null
          carga_total: number | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          escola_saesc: string
          horas_aula: number | null
          id: string
          observacoes: string | null
          perfil: string
          pessoa_id: string
          pl: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          ano_letivo?: string | null
          ativo?: boolean
          carga_horaria?: number | null
          carga_total?: number | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          escola_saesc: string
          horas_aula?: number | null
          id?: string
          observacoes?: string | null
          perfil: string
          pessoa_id: string
          pl?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          ano_letivo?: string | null
          ativo?: boolean
          carga_horaria?: number | null
          carga_total?: number | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          escola_saesc?: string
          horas_aula?: number | null
          id?: string
          observacoes?: string | null
          perfil?: string
          pessoa_id?: string
          pl?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "lotacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      lotacoes_professores_backup: {
        Row: {
          ano_letivo: string | null
          carga_total: number | null
          created_at: string | null
          escola_id: string | null
          horas_aula: number | null
          id: string | null
          pl: number | null
          professor_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ano_letivo?: string | null
          carga_total?: number | null
          created_at?: string | null
          escola_id?: string | null
          horas_aula?: number | null
          id?: string | null
          pl?: number | null
          professor_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_letivo?: string | null
          carga_total?: number | null
          created_at?: string | null
          escola_id?: string | null
          horas_aula?: number | null
          id?: string | null
          pl?: number | null
          professor_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lotacoes_professores_deprecated: {
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
          {
            foreignKeyName: "lotacoes_professores_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["professor_id"]
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
      pessoas: {
        Row: {
          ativo: boolean
          cpf: string
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cpf: string
          created_at?: string
          data_nascimento?: string | null
          email: string
          id?: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cpf?: string
          created_at?: string
          data_nascimento?: string | null
          email?: string
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
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
          {
            foreignKeyName: "professor_eventos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["professor_id"]
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
          {
            foreignKeyName: "professores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      professores_backup: {
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
          id: string | null
          matricula: string | null
          nome: string | null
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
          id?: string | null
          matricula?: string | null
          nome?: string | null
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
          id?: string | null
          matricula?: string | null
          nome?: string | null
          telefone?: string | null
          tipo_vinculo?: Database["public"]["Enums"]["tipo_vinculo"] | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string
          expires_at: string
          id: string
          key: string
        }
        Insert: {
          count?: number
          created_at?: string
          expires_at?: string
          id?: string
          key: string
        }
        Update: {
          count?: number
          created_at?: string
          expires_at?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      sabados_letivos: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string | null
          dia_replica: string | null
          escola_id: string
          exige_chamada: boolean | null
          id: string
          segmentos: Json | null
          tipo: string
          turnos: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao?: string | null
          dia_replica?: string | null
          escola_id: string
          exige_chamada?: boolean | null
          id?: string
          segmentos?: Json | null
          tipo: string
          turnos?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string | null
          dia_replica?: string | null
          escola_id?: string
          exige_chamada?: boolean | null
          id?: string
          segmentos?: Json | null
          tipo?: string
          turnos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sabados_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabados_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabados_letivos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "sabados_letivos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_contexto: {
        Row: {
          atualizado_em: string
          escola_saesc: string
          id: string
          iniciado_em: string
          lotacao_id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          escola_saesc: string
          id?: string
          iniciado_em?: string
          lotacao_id: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          escola_saesc?: string
          id?: string
          iniciado_em?: string
          lotacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_contexto_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "lotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_contexto_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_contexto_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_contexto_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
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
          id: string
          impersonated_by: string | null
          nome: string
          pessoa_id: string | null
          ultimo_acesso: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          impersonated_by?: string | null
          nome: string
          pessoa_id?: string | null
          ultimo_acesso?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          impersonated_by?: string | null
          nome?: string
          pessoa_id?: string | null
          ultimo_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_impersonated_by_fkey"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_impersonated_by_fkey"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_impersonated_by_fkey"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "usuarios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      usuarios_backup: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string | null
          escola_id: string | null
          id: string | null
          impersonated_by: string | null
          nome: string | null
          pessoa_id: string | null
          ultimo_acesso: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          escola_id?: string | null
          id?: string | null
          impersonated_by?: string | null
          nome?: string | null
          pessoa_id?: string | null
          ultimo_acesso?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          escola_id?: string | null
          id?: string | null
          impersonated_by?: string | null
          nome?: string | null
          pessoa_id?: string | null
          ultimo_acesso?: string | null
        }
        Relationships: []
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
      usuarios_completos: {
        Row: {
          ativo: boolean | null
          carga_horaria_contratual: number | null
          cargo: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          formacoes: Json | null
          funcao_atual: string | null
          horas_pl: number | null
          id: string | null
          impersonated_by: string | null
          matricula: string | null
          nome: string | null
          professor_id: string | null
          roles: Json | null
          telefone: string | null
          tipo_vinculo: Database["public"]["Enums"]["tipo_vinculo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_impersonated_by_fkey"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_impersonated_by_fkey"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "usuarios_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_impersonated_by_fkey"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "usuarios_contextualizados"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      usuarios_contextualizados: {
        Row: {
          carga_horaria_total: number | null
          cpf: string | null
          email: string | null
          lotacoes_ativas: Json | null
          nome_completo: string | null
          pessoa_id: string | null
          telefone: string | null
          total_lotacoes_ativas: number | null
          usuario_ativo: boolean | null
          usuario_id: string | null
        }
        Relationships: []
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
      calcular_frequencia_total_aluno: {
        Args: {
          p_aluno_id: string
          p_componente: string
          p_data_fim: string
          p_data_inicio: string
          p_turma_id: string
        }
        Returns: {
          percentual_presenca: number
          total_aulas: number
          total_faltas: number
          total_presencas: number
        }[]
      }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      clear_impersonations_for: { Args: { _user_id: string }; Returns: number }
      get_effective_user_id: { Args: never; Returns: string }
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
      sanitize_audit_data: { Args: { data: Json }; Returns: Json }
      sincronizar_diarios_com_horarios: { Args: never; Returns: undefined }
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
