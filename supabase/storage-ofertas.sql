-- ObraFácil PRO: armazenamento das imagens das ofertas
-- Seguro para executar mais de uma vez: não apaga arquivos nem tabelas.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ofertas-imagens',
  'ofertas-imagens',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Imagens de ofertas visíveis publicamente'
  ) then
    create policy "Imagens de ofertas visíveis publicamente"
      on storage.objects for select
      to anon, authenticated
      using (bucket_id = 'ofertas-imagens');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Administradores enviam imagens de ofertas'
  ) then
    create policy "Administradores enviam imagens de ofertas"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'ofertas-imagens'
        and public.obrafacil_e_admin()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Administradores atualizam imagens de ofertas'
  ) then
    create policy "Administradores atualizam imagens de ofertas"
      on storage.objects for update
      to authenticated
      using (
        bucket_id = 'ofertas-imagens'
        and public.obrafacil_e_admin()
      )
      with check (
        bucket_id = 'ofertas-imagens'
        and public.obrafacil_e_admin()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Administradores removem imagens de ofertas'
  ) then
    create policy "Administradores removem imagens de ofertas"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'ofertas-imagens'
        and public.obrafacil_e_admin()
      );
  end if;
end
$$;
