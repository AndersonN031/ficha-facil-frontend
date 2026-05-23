# FilaSaúde — Frontend

Interface web do sistema de fila virtual para postos de saúde públicos. Permite que pacientes entrem na fila pelo celular, acompanhem sua posição em tempo real e recebam notificação quando forem chamados — sem precisar estar presencialmente no local.

> 🚧 Projeto em desenvolvimento ativo

---

## O que é

O frontend do FilaSaúde é uma aplicação web construída com Next.js 14 que serve diferentes painéis de acordo com o papel do usuário:

| Role              | Acesso                                                                        |
| ----------------- | ----------------------------------------------------------------------------- |
| **Paciente**      | Entra na fila virtual, acompanha posição em tempo real, cancela quando quiser |
| **Recepcionista** | Painel do dia, chama próximo da fila, emite ficha                             |
| **Médico**        | Visualiza fichas atribuídas, marca atendimento como concluído                 |
| **Admin**         | Gerencia postos, usuários e papéis, acessa relatórios                         |

---

## Stack

- **Next.js 14** — framework React com App Router
- **TypeScript** — tipagem estática
- **Tailwind CSS** — estilização utilitária
- **shadcn/ui** — componentes de interface
- **Axios** — cliente HTTP para comunicação com a API
- **Socket.io Client** — notificações em tempo real
- **js-cookie** — gerenciamento de cookies para sessão

---

## Estrutura de pastas

```
src/
├── app/
│   ├── (auth)/           # rotas públicas
│   │   ├── login/
│   │   └── cadastro/
│   ├── (patient)/        # rotas do paciente
│   │   └── fila/
│   └── layout.tsx        # layout raiz com AuthProvider
├── contexts/
│   └── auth.context.tsx  # contexto global de autenticação
├── hooks/
│   ├── useQueue.ts       # lógica da fila + Socket.io
│   └── useHealthUnits.ts # listagem de postos
├── services/
│   └── auth.service.ts   # chamadas de autenticação
├── lib/
│   └── api.ts            # instância configurada do Axios
├── types/
│   └── auth.ts           # tipos de autenticação
└── middleware.ts          # proteção automática de rotas
```

O agrupamento com parênteses — `(auth)`, `(patient)` — é uma convenção do Next.js App Router para organizar rotas sem afetar a URL. A rota `/fila` fica em `(patient)/fila/page.tsx` mas é acessada como `http://localhost:3001/fila`.

---

## Autenticação

O sistema usa JWT com dois tokens — access token e refresh token — gerenciados pelo `AuthContext`.

**Onde os tokens ficam:**

| Token        | Onde fica        | Por quê                                                   |
| ------------ | ---------------- | --------------------------------------------------------- |
| Access Token | Cookie `session` | Acessível pelo middleware do servidor para proteger rotas |
| User data    | `sessionStorage` | Dados do usuário restaurados ao navegar                   |

O cookie `session` é lido pelo `middleware.ts` a cada navegação. Rotas não autenticadas são redirecionadas automaticamente para `/login` sem precisar de guard manual em cada página.

**Rotas públicas** (não exigem autenticação):

- `/login`
- `/cadastro`

Todas as demais rotas são protegidas automaticamente pelo middleware.

---

## Tempo real com Socket.io

A posição na fila é atualizada em tempo real via Socket.io. O hook `useQueue` gerencia a conexão:

```
Paciente entra na página /fila
  → conecta no Socket.io
  → emite join:unit com o healthUnitId do posto escolhido
  → passa a receber eventos queue:update daquele posto
  → posição atualizada automaticamente sem polling
```

**Eventos:**

| Evento          | Direção            | Descrição                                      |
| --------------- | ------------------ | ---------------------------------------------- |
| `join:unit`     | cliente → servidor | entra na room do posto                         |
| `leave:unit`    | cliente → servidor | sai da room do posto                           |
| `queue:update`  | servidor → cliente | fila atualizada (nova entrada ou cancelamento) |
| `ticket:called` | servidor → cliente | paciente foi chamado pela recepcionista        |

---

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- API do FilaSaúde rodando em `http://localhost:3000`

### Setup

```bash
# clone o repositório
git clone https://github.com/seu-usuario/filasaude-web.git
cd filasaude-web

# instale as dependências
npm install

# configure as variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Rodar

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3001`.

---

## Páginas implementadas

| Rota             | Status       | Descrição                                                       |
| ---------------- | ------------ | --------------------------------------------------------------- |
| `/login`         | ✅ Concluído | Autenticação com e-mail e senha                                 |
| `/cadastro`      | ✅ Concluído | Cadastro de novo paciente                                       |
| `/fila`          | ✅ Concluído | Listar postos, entrar na fila, acompanhar posição em tempo real |
| `/dashboard`     | ⏳ Pendente  | Painel inicial pós-login                                        |
| `/recepcionista` | ⏳ Pendente  | Painel da recepcionista                                         |
| `/medico`        | ⏳ Pendente  | Agenda do médico                                                |
| `/admin`         | ⏳ Pendente  | Painel administrativo                                           |

---

## Fluxo do paciente

```
/cadastro ou /login
  → autenticado → redireciona para /fila
  → lista postos disponíveis (filtrável por cidade/estado)
  → clica em "Entrar na fila"
  → vê posição em tempo real
  → recebe notificação quando chamado
  → pode cancelar a qualquer momento
```

---

## Decisões técnicas

**Por que cookie em vez de localStorage para o token?**
O middleware do Next.js roda no servidor e não tem acesso ao `localStorage` ou `sessionStorage` — que são APIs do browser. O cookie é enviado automaticamente em toda requisição, permitindo que o middleware leia o token e redirecione sem autenticação antes de carregar qualquer página.

**Por que `sessionStorage` para os dados do usuário?**
O `sessionStorage` expira quando o usuário fecha o navegador — comportamento adequado para um sistema de saúde onde sessões longas são um risco de segurança. O cookie do token tem o mesmo ciclo de vida implícito.

**Por que `suppressHydrationWarning` no `<body>`?**
Extensões de navegador como Grammarly injetam atributos no `<body>` após a renderização do servidor, causando mismatch de hidratação no React. O `suppressHydrationWarning` instrui o React a ignorar diferenças de atributos nesse elemento específico — não esconde bugs reais do código.
