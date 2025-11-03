-- Corrigir RLS da tabela public.usuarios
-- Remover políticas restritivas atuais
drop policy if exists "Admin gerencia usuarios" on public.usuarios;
drop policy if exists "Admin ve usuarios" on public.usuarios;
drop policy if exists "Usuario ve proprio" on public.usuarios;

-- Criar políticas PERMISSIVE adequadas para SELECT
create policy "usuario_ve_proprio"
on public.usuarios for select
to authenticated
using (id = public.get_effective_user_id());

create policy "admin_ve_todos_usuarios"
on public.usuarios for select
to authenticated
using (public.has_role(public.get_effective_user_id(), 'ADMIN'));

-- Políticas para INSERT (apenas admin)
create policy "admin_insere_usuarios"
on public.usuarios for insert
to authenticated
with check (public.has_role(public.get_effective_user_id(), 'ADMIN'));

-- Políticas para UPDATE (apenas admin)
create policy "admin_atualiza_usuarios"
on public.usuarios for update
to authenticated
using (public.has_role(public.get_effective_user_id(), 'ADMIN'))
with check (public.has_role(public.get_effective_user_id(), 'ADMIN'));

-- Políticas para DELETE (apenas admin)
create policy "admin_deleta_usuarios"
on public.usuarios for delete
to authenticated
using (public.has_role(public.get_effective_user_id(), 'ADMIN'));

-- Corrigir RLS da tabela public.user_roles
-- Remover políticas restritivas atuais
drop policy if exists "Admins gerenciam roles" on public.user_roles;
drop policy if exists "Usuários veem suas roles" on public.user_roles;

-- Criar políticas PERMISSIVE adequadas para SELECT
create policy "usuario_ve_suas_roles"
on public.user_roles for select
to authenticated
using (user_id = public.get_effective_user_id());

create policy "admin_ve_todas_roles"
on public.user_roles for select
to authenticated
using (public.has_role(public.get_effective_user_id(), 'ADMIN'));

-- Políticas para INSERT (apenas admin)
create policy "admin_insere_roles"
on public.user_roles for insert
to authenticated
with check (public.has_role(public.get_effective_user_id(), 'ADMIN'));

-- Políticas para UPDATE (apenas admin)
create policy "admin_atualiza_roles"
on public.user_roles for update
to authenticated
using (public.has_role(public.get_effective_user_id(), 'ADMIN'))
with check (public.has_role(public.get_effective_user_id(), 'ADMIN'));

-- Políticas para DELETE (apenas admin)
create policy "admin_deleta_roles"
on public.user_roles for delete
to authenticated
using (public.has_role(public.get_effective_user_id(), 'ADMIN'));