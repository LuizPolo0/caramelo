create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  telefone text,
  role text check (role in ('reporter','volunteer','ong','vet')) default 'reporter',
  avatar_url text,
  bairro text,
  reputacao numeric default 5.0,
  created_at timestamptz default now()
);

create table public.ocorrencias (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  titulo text not null,
  descricao text,
  endereco text not null,
  bairro text,
  lat numeric(10,7),
  lng numeric(10,7),
  situacao text[] default '{}', 
  porte text check (porte in ('Pequeno','Médio','Grande')),
  urgencia text check (urgencia in ('Estável','Atenção','Urgente')) default 'Atenção',
  status text check (status in ('ativo','em_resgate','resgatado','arquivado')) default 'ativo',
  foto_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.resgates (
  id uuid default uuid_generate_v4() primary key,
  ocorrencia_id uuid references public.ocorrencias(id) on delete cascade,
  voluntario_id uuid references public.profiles(id) on delete set null,
  tipo text check (tipo in ('resgate','lar_temp','veterinario')) default 'resgate',
  status text check (status in ('confirmado','em_andamento','concluido','cancelado')) default 'confirmado',
  observacao text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.resgates enable row level security;

create policy "Perfis são públicos"
  on public.profiles
  for select
  using (true);

create policy "Usuário edita próprio perfil"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Usuário cria próprio perfil"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Ocorrências são públicas"
  on public.ocorrencias
  for select
  using (true);

create policy "Usuário autenticado cria ocorrência"
  on public.ocorrencias
  for insert
  with check (auth.uid() is not null);

create policy "Usuário edita própria ocorrência"
  on public.ocorrencias
  for update
  using (auth.uid() = user_id);

create policy "Resgates são públicos"
  on public.resgates
  for select
  using (true);

create policy "Voluntário cria resgate"
  on public.resgates
  for insert
  with check (auth.uid() is not null);

create policy "Voluntário atualiza próprio resgate"
  on public.resgates
  for update
  using (auth.uid() = voluntario_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, telefone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Usuário'),
    new.raw_user_meta_data->>'telefone',
    coalesce(new.raw_user_meta_data->>'role', 'reporter')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ocorrencias_updated_at
  before update on public.ocorrencias
  for each row
  execute procedure public.update_updated_at();