# Fila da Barbearia

Sistema web simples para gerenciar a fila de atendimento de uma barbearia
em tempo real. O cliente entra na fila escaneando um QR Code ou abrindo um
link — sem baixar app e sem criar conta. O barbeiro gerencia tudo por um
painel mobile-first.

- **Cliente:** escaneia o QR Code → digita o nome → acompanha a posição em
  tempo real.
- **Barbeiro:** faz login → abre a fila → chama o próximo com um toque.

---

## Sumário

1. [Stack utilizada](#stack-utilizada)
2. [Estrutura do projeto](#estrutura-do-projeto)
3. [Funcionalidades implementadas](#funcionalidades-implementadas)
4. [Pré-requisitos](#pré-requisitos)
5. [Configurar o Supabase](#configurar-o-supabase)
6. [Variáveis de ambiente](#variáveis-de-ambiente)
7. [Rodar localmente](#rodar-localmente)
8. [Rodar os testes](#rodar-os-testes)
9. [Deploy](#deploy)
10. [Segurança (RLS)](#segurança-rls)
11. [Limitações conhecidas / próximos passos](#limitações-conhecidas--próximos-passos)

---

## Stack utilizada

| Camada          | Tecnologia                                   |
| --------------- | --------------------------------------------- |
| Frontend        | Next.js 14 (App Router), React, TypeScript     |
| Estilização     | Tailwind CSS                                   |
| Backend         | Supabase (PostgreSQL, Auth, Realtime, RLS)     |
| Testes          | Vitest                                         |
| QR Code         | `qrcode.react`                                 |
| PWA             | Web App Manifest + ícones (instalável no celular) |

## Estrutura do projeto

```
barber-queue/
├── app/
│   ├── page.tsx                    # Landing (/)
│   ├── login/page.tsx              # Login/cadastro do barbeiro
│   ├── painel/
│   │   ├── layout.tsx              # Layout com navegação inferior
│   │   ├── page.tsx                # Onboarding (criar barbearia)
│   │   ├── fila/page.tsx           # Dashboard: fila em tempo real
│   │   └── configuracoes/page.tsx  # Nome, tempo médio, QR Code
│   ├── fila/[slug]/page.tsx        # Página pública da fila (cliente)
│   ├── layout.tsx, globals.css     # Layout raiz e estilos
│   ├── not-found.tsx, global-error.tsx
├── components/                     # Componentes de UI reutilizáveis
├── hooks/useQueueRealtime.ts       # Hook de Realtime (Supabase)
├── lib/
│   ├── supabase/{client,server}.ts # Clientes Supabase (browser/server)
│   ├── queue/estimate.ts           # Cálculo de tempo estimado (+ testes)
│   ├── queue/clientSession.ts      # Sessão anônima do cliente (localStorage)
│   └── slug.ts                     # Geração/validação de slugs
├── middleware.ts                   # Protege /painel e refresca sessão
├── supabase/migrations/            # SQL: schema, RLS, trigger de perfil
├── types/database.ts               # Tipos TypeScript do banco
└── public/                         # manifest.webmanifest, ícones PWA
```

## Funcionalidades implementadas

**MVP (prioridade 1, briefing seção 22):**

- [x] Criar barbearia (onboarding após cadastro)
- [x] Login/cadastro do barbeiro (Supabase Auth)
- [x] Abrir/fechar fila
- [x] Página pública da fila (`/fila/[slug]`), sem login
- [x] Cliente entrar na fila (só o nome)
- [x] Barbeiro visualizar a fila
- [x] Barbeiro adicionar cliente manualmente
- [x] Barbeiro remover cliente (com confirmação)
- [x] Barbeiro chamar próximo (função atômica no banco)
- [x] Atualização em tempo real (Supabase Realtime, sem polling)
- [x] Posição do cliente ("Você está em #3")
- [x] Estimativa de tempo de espera
- [x] QR Code da fila (visualizar, copiar link, imprimir)
- [x] Link público compartilhável (funciona em Stories do Instagram)

**Também implementado, além do MVP:**

- [x] Marcar atendimento como concluído
- [x] Base para média real de atendimento (`computeHistoricalAverageMinutes`,
      pronta para uso, não ligada à UI ainda — ver "Próximos passos")
- [x] PWA instalável (manifest + ícones)
- [x] Estados de loading, vazio e erro amigável em toda a aplicação
- [x] Suporte a "sem conexão" na página pública
- [x] Sessão anônima do cliente (evita entradas duplicadas do mesmo aparelho)

## Pré-requisitos

- Node.js 18.18 ou superior
- Uma conta gratuita no [Supabase](https://supabase.com)

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/dashboard).
2. Abra **SQL Editor** no painel do Supabase.
3. Execute, **nesta ordem**, o conteúdo de cada arquivo em
   `supabase/migrations/`:
   1. `0001_init.sql` — tabelas, enums, funções, triggers
   2. `0002_rls.sql` — políticas de Row Level Security
   3. `0003_auth_trigger.sql` — trigger `auth.users → public.profiles`

   (Se preferir usar a CLI do Supabase: `supabase db push` com este
   repositório como projeto local, apontando para o seu projeto remoto.)

4. Em **Authentication → Providers**, confirme que "Email" está habilitado
   (é o método usado pelo login do barbeiro). Para o MVP, você pode
   desativar a confirmação por e-mail em **Authentication → Settings** para
   testar mais rápido — reative antes de ir para produção.

5. Em **Project Settings → API**, copie a **URL do projeto** e a
   **anon public key** — você vai usá-las no próximo passo.

## Variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Preencha `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ Nunca coloque a **service role key** em variáveis `NEXT_PUBLIC_*` nem
> no frontend. O projeto não precisa dela para funcionar — toda a
> segurança é garantida pelas políticas de RLS usando a chave anônima.
> O campo `SUPABASE_SERVICE_ROLE_KEY` no `.env.example` está reservado
> para uma futura rota administrativa de servidor, caso necessário.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Fluxo de teste sugerido:

1. Abra `/login`, crie uma conta de barbeiro.
2. Você será redirecionado para criar sua barbearia (nome + link).
3. Vá em `/painel/fila`, clique em **Abrir fila**.
4. Em outra aba (ou no celular), acesse `/fila/seu-link` e entre na fila.
5. Volte ao painel e clique em **Chamar próximo** — veja a página do
   cliente atualizar sozinha, sem recarregar.

## Rodar os testes

```bash
npm run test
```

Os testes cobrem a lógica de cálculo de tempo estimado
(`lib/queue/estimate.ts`), incluindo formatação ("aproximadamente 1h15") e
o cálculo preparatório de média histórica.

## Deploy

O jeito mais simples é a [Vercel](https://vercel.com) (criadora do
Next.js):

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Em **Environment Variables**, adicione as mesmas três variáveis do
   `.env.local` (troque `NEXT_PUBLIC_SITE_URL` pela URL final, ex.
   `https://fila-barbearia.vercel.app`).
4. Clique em **Deploy**.

Qualquer outro host que suporte Next.js (Netlify, Railway, um servidor
Node próprio via `npm run build && npm run start`) também funciona — só
configure as mesmas variáveis de ambiente.

Depois do deploy, gere o QR Code definitivo em **Ajustes** no painel do
barbeiro (ele já vai apontar para a URL de produção).

## Segurança (RLS)

Resumo das regras aplicadas no banco (detalhes em
`supabase/migrations/0002_rls.sql`):

- Qualquer pessoa pode **ler** dados públicos da barbearia e da fila
  (necessário para a página pública funcionar sem login).
- Qualquer pessoa pode **entrar na fila** (inserir uma linha em
  `queue_entries`), mas só se a fila estiver aberta.
- Só o **dono da barbearia** (autenticado) pode abrir/fechar a fila,
  adicionar/remover clientes ou editar configurações.
- **Chamar o próximo** passa por uma função de banco (`call_next`) que
  roda com privilégios elevados só depois de confirmar que quem chamou é
  o dono da barbearia — e usa bloqueio de linha (`FOR UPDATE SKIP LOCKED`)
  para nunca chamar duas pessoas ao mesmo tempo, mesmo com cliques
  simultâneos.
- Nenhuma chave secreta é usada no frontend — só a `anon key`, que é
  segura para expor porque toda regra de acesso vive no banco.

## Limitações conhecidas / próximos passos

Seguindo a priorização do briefing (seção 22), o que ficou para depois do
MVP:

1. **Histórico de atendimentos** — tela dedicada; os dados já ficam salvos
   (`status = COMPLETED`, `called_at`, `completed_at`), falta só a UI.
2. **Média real de tempo de atendimento** — a função
   `computeHistoricalAverageMinutes()` já existe e está testada; falta
   uma rotina (ex. cron/edge function) que recalcule
   `average_service_minutes` periodicamente a partir do histórico.
3. **Web Push Notifications** — hoje a atualização "é a sua vez!" acontece
   dentro da própria página (Realtime); notificações fora do navegador
   exigiriam Service Worker + chaves VAPID.
4. **Múltiplos barbeiros por barbearia** — hoje `is_admin` é por usuário
   e a posse é 1 barbearia : 1 dono; dá para evoluir para uma tabela de
   membros no futuro sem quebrar o schema atual.
5. **App Android via WebView** — a arquitetura já é responsiva e
   PWA-ready, então basta apontar um WebView para a URL publicada.
