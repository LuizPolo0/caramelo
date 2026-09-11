# 🐾 Caramelo do Bem

Plataforma colaborativa para reportar, mapear e coordenar o resgate de cães em situação de rua.
Qualquer pessoa pode reportar uma ocorrência (com foto, endereço e nível de urgência); a ocorrência
aparece no mapa e voluntários, ONGs ou veterinários podem se candidatar para o resgate, oferecer um
lar temporário ou registrar atendimento veterinário.

🚀 **Aplicação em produção:** https://caramelo-two.vercel.app
📄 **Diagramas e visão geral do projeto:** https://LuizPolo0.github.io/caramelo/

## Sumário

- [Funcionalidades](#funcionalidades)
- [Papéis de usuário](#papéis-de-usuário)
- [Stack técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Supabase](#configuração-do-supabase)
- [Rodando localmente](#rodando-localmente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Deploy em produção (Vercel)](#deploy-em-produção-vercel)
- [Publicando os diagramas no GitHub Pages](#publicando-os-diagramas-no-github-pages)

## Funcionalidades

- 🔐 Cadastro e login (e-mail/senha e Google OAuth)
- 📢 Reportar ocorrência com foto, endereço/geolocalização, porte e urgência do animal
- 🗺️ Mapa interativo (Leaflet) com todas as ocorrências ativas
- 🐕 Página de detalhe da ocorrência com histórico de resgates
- 🤲 Confirmação de resgate, lar temporário ou atendimento veterinário
- 📊 Painel dedicado para ONGs e veterinários acompanharem ocorrências e resgates
- 👤 Perfil do usuário com estatísticas de ocorrências reportadas e resgates

## Papéis de usuário

| Papel | O que pode fazer |
|---|---|
| **Reportador** | Registra ocorrências de cães encontrados na rua |
| **Voluntário** | Visualiza o mapa e se candidata a resgates / lar temporário |
| **ONG** | Acompanha ocorrências e resgates em um painel próprio |
| **Veterinário** | Registra atendimentos veterinários vinculados a uma ocorrência |

## Stack técnica

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Supabase](https://supabase.com/) — autenticação, banco Postgres e storage de fotos
- [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) para os componentes de interface
- [Leaflet](https://leafletjs.com/) / `react-leaflet` para o mapa

## Arquitetura

A aplicação é **client-first**: o Next.js serve as páginas e todo o acesso a dados e autenticação é
feito diretamente pelo navegador através do SDK do Supabase, usando apenas a chave pública (`anon key`).
Não há segredos de servidor nem rotas de API próprias — a segurança dos dados é garantida por
**Row Level Security (RLS)** configurada no Postgres do Supabase.

Diagramas de arquitetura, modelo de dados e fluxo de uso estão na página do projeto:
👉 **https://LuizPolo0.github.io/caramelo/**

## Estrutura do projeto

```
src/
├── app/                    # Rotas (App Router)
│   ├── login/              # Login
│   ├── cadastro/           # Cadastro de usuário
│   ├── inicio/             # Início / feed de ocorrências
│   ├── mapa/                # Mapa de ocorrências
│   ├── reportar/           # Formulário de nova ocorrência
│   ├── ocorrencia/[id]/    # Detalhe de uma ocorrência
│   ├── resgates/           # Resgates confirmados / meus resgates
│   ├── painel/              # Painel para ONG / Veterinário
│   └── perfil/              # Perfil do usuário
├── components/              # Componentes reutilizáveis (AppShell, MapView, UI...)
├── hooks/                    # useAuth, useToast
├── lib/                      # Cliente Supabase e utilitários
└── types/                    # Tipos TypeScript compartilhados

scriptBancoDeDadosSupabase.sql  # Schema do banco (tabelas, RLS, triggers)
docs/                            # Página estática publicada no GitHub Pages
```

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- Uma conta gratuita no [Supabase](https://supabase.com/)

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/).
2. Em **SQL Editor**, execute o conteúdo do arquivo [`scriptBancoDeDadosSupabase.sql`](./scriptBancoDeDadosSupabase.sql)
   para criar as tabelas `profiles`, `ocorrencias`, `resgates`, `mensagens`, as policies de RLS e os triggers.
3. Em **Authentication → Providers**, habilite o provedor de e-mail e, se for usar login social,
   o provedor Google.
4. Em **Storage**, crie um bucket público chamado **`fotos`** para armazenar as fotos das ocorrências
   (o código faz upload em `fotos/ocorrencias/...` e salva a URL pública no campo `foto_url`).
5. Em **Project Settings → API**, copie a **Project URL** e a **anon public key** — elas vão para as
   variáveis de ambiente no próximo passo.

> Se o seu projeto Supabase já existia antes desta versão, ele não tem a tabela `mensagens` nem as
> policies de atualização de status adicionadas depois. Rode este complemento uma única vez no **SQL Editor**:
> ```sql
> create table if not exists public.mensagens (
>   id uuid default uuid_generate_v4() primary key,
>   ocorrencia_id uuid references public.ocorrencias(id) on delete cascade,
>   user_id uuid references public.profiles(id) on delete set null,
>   texto text not null,
>   tipo text check (tipo in ('texto','sistema','foto')) default 'texto',
>   created_at timestamptz default now()
> );
> alter table public.mensagens enable row level security;
> create policy "Mensagens são públicas" on public.mensagens for select using (true);
> create policy "Usuário autenticado envia mensagem" on public.mensagens for insert with check (auth.uid() is not null);
> create policy "Usuário autenticado atualiza status da ocorrência" on public.ocorrencias for update using (auth.uid() is not null);
> create policy "ONG ou veterinário atualiza qualquer resgate" on public.resgates for update using (
>   exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('ong','vet'))
> );
> ```

## Rodando localmente

```bash
git clone https://github.com/LuizPolo0/caramelo.git
cd caramelo
npm install
```

Crie um arquivo `.env.local` na raiz do projeto com as credenciais do seu projeto Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Sobe o build de produção localmente |
| `npm run lint` | Roda o linter |

## Deploy em produção (Vercel)

A [Vercel](https://vercel.com/) é a forma mais simples de hospedar este projeto, pois é a criadora do Next.js
e faz deploy automático a cada push no GitHub.

1. Suba o repositório para o GitHub (veja a seção de publicação abaixo).
2. Acesse [vercel.com](https://vercel.com/) e faça login com sua conta do GitHub.
3. Clique em **Add New → Project** e selecione o repositório `caramelo`.
4. Em **Environment Variables**, adicione as mesmas duas variáveis do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **Deploy**. A Vercel detecta o Next.js automaticamente — nenhuma configuração adicional
   é necessária.
6. A cada `git push` na branch principal, a Vercel publica uma nova versão automaticamente.

Se o app usar login social (Google), adicione a URL de produção da Vercel na lista de **Redirect URLs**
em **Authentication → URL Configuration** no painel do Supabase.

## Publicando os diagramas no GitHub Pages

A pasta [`docs/`](./docs) contém uma página estática com a visão geral do projeto e os diagramas de
arquitetura, modelo de dados e fluxo de uso.

1. Suba o repositório para o GitHub.
2. No GitHub, vá em **Settings → Pages**.
3. Em **Source**, selecione **Deploy from a branch**.
4. Em **Branch**, selecione `main` e a pasta `/docs`, depois clique em **Save**.
5. Em alguns minutos a página ficará disponível em `https://LuizPolo0.github.io/caramelo/`.
