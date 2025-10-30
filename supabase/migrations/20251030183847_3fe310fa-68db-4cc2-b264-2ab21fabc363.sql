-- Criar função para sincronizar dados de usuario para professor
CREATE OR REPLACE FUNCTION public.sync_usuario_to_professor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar professor quando usuario for atualizado
  UPDATE public.professores
  SET 
    nome = NEW.nome,
    email = NEW.email
  WHERE usuario_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS sync_usuario_to_professor_trigger ON public.usuarios;
CREATE TRIGGER sync_usuario_to_professor_trigger
  AFTER UPDATE OF nome, email ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_usuario_to_professor();

-- Sincronização inicial: atualizar todos os professores com dados dos usuarios
UPDATE public.professores p
SET 
  nome = u.nome,
  email = u.email
FROM public.usuarios u
WHERE p.usuario_id = u.id;