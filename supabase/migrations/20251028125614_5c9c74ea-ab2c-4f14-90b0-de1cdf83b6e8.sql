-- Add RLS policy for admins to update escolas
CREATE POLICY "Admin atualiza escolas" 
ON public.escolas 
FOR UPDATE 
USING (has_role(auth.uid(), 'ADMIN'::app_role));