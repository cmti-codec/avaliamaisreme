-- Criar trigger para sincronizar dados de usuarios para professores
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

-- Criar trigger que dispara após UPDATE em usuarios
CREATE TRIGGER sync_usuario_data
AFTER UPDATE OF nome, email ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.sync_usuario_to_professor();

-- Sincronizar dados existentes (one-time sync)
UPDATE public.professores p
SET 
  nome = u.nome,
  email = u.email
FROM public.usuarios u
WHERE p.usuario_id = u.id
  AND (p.nome != u.nome OR p.email != u.email);