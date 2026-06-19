# Frontend — Guia técnico

Documentação técnica do frontend do FilaSaúde. Cobre arquitetura, decisões técnicas e o que foi implementado até o momento.

---

## Stack

- **Next.js 14** com App Router
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Axios** — cliente HTTP
- **Socket.io Client** — tempo real
- **js-cookie** — gerenciamento de cookies

---

## Estrutura de pastas

```
src/
├── app/
│   ├── (auth)/               # rotas públicas
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── cadastro/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (patient)/            # rotas do paciente
│   │   └── fila/
│   │       └── page.tsx
│   ├── (receptionist)/       # rotas da recepcionista
│   │   └── recepcionista/
│   │       └── page.tsx
│   ├── (doctor)/             # rotas do médico
│   │   └── medico/
│   │       └── page.tsx
│   ├── globals.css
│   └── layout.tsx            # layout raiz com AuthProvider
├── contexts/
│   └── auth.context.tsx      # contexto global de autenticação
├── hooks/
│   ├── useQueue.ts           # lógica da fila + Socket.io
│   └── useHealthUnits.ts     # listagem de postos
├── services/
│   ├── auth.service.ts          # chamadas de autenticação
│   ├── receptionist.service.ts  # chamadas da recepcionista
│   └── doctor.service.ts        # chamadas do médico
├── lib/
│   └── api.ts                # instância configurada do Axios
├── types/
│   ├── auth.ts                # tipos de autenticação
│   ├── ticket.ts               # tipo Ticket (compartilhado entre recepcionista e médico)
│   └── queue.ts                # tipo Queue
└── middleware.ts              # proteção automática de rotas
```

O agrupamento com parênteses — `(auth)`, `(patient)`, `(receptionist)`, `(doctor)` — organiza rotas sem afetar a URL. `/medico` fica em `(doctor)/medico/page.tsx` mas é acessada como `http://localhost:3001/medico`.

---

## Autenticação

O `AuthContext` gerencia o estado global de autenticação e persiste a sessão entre navegações.

**Onde os dados ficam:**

| Dado             | Onde             | Por quê                                               |
| ---------------- | ---------------- | ----------------------------------------------------- |
| Access Token     | Cookie `session` | Lido pelo middleware do servidor para proteger rotas  |
| Dados do usuário | `sessionStorage` | Restaurados ao navegar, expiram ao fechar o navegador |

**Por que `sessionStorage` e não `localStorage`?**

O `sessionStorage` expira quando o usuário fecha o navegador — comportamento adequado para um sistema de saúde onde sessões longas são um risco de segurança.

**Fluxo de restauração de sessão:**

```
Usuário abre o app
  → AuthProvider monta
  → useEffect lê cookie + sessionStorage
  → se existir → restaura user e accessToken no estado
  → setLoading(false)
  → páginas renderizam com usuário autenticado
```

O estado `loading` do contexto evita flash de tela branca enquanto a sessão está sendo restaurada.

**Redirecionamento por role após login/register:**

```typescript
const routes: Record<string, string> = {
  PATIENT: "/fila",
  RECEPTIONIST: "/recepcionista",
  DOCTOR: "/medico",
  ADMIN: "/admin",
};
```

Tanto `login` quanto `register` chamam `redirectByRole(user.role)` após autenticar com sucesso, mandando cada usuário direto para o painel correspondente.

---

## Proteção de rotas

O `middleware.ts` protege automaticamente todas as rotas não públicas:

```typescript
const publicRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

Qualquer rota não listada em `publicRoutes` exige o cookie `session`. Sem ele, o middleware redireciona para `/login` antes de carregar qualquer componente.

**Limitação conhecida:** o middleware valida apenas a _presença_ do token, não o `role` do usuário. Um paciente autenticado consegue acessar `/medico` ou `/recepcionista` visualmente, embora nenhuma request à API funcione (o backend rejeita com `403`). Proteção de rota por role no frontend está planejada para a Sprint 4.

---

## Hook useQueue

Centraliza toda a lógica da fila virtual — conexão Socket.io, entrar, sair e acompanhar posição.

**Estado gerenciado:**

| Estado     | Tipo                 | Descrição                                    |
| ---------- | -------------------- | -------------------------------------------- |
| `entry`    | `QueueEntry \| null` | Entrada ativa do paciente na fila            |
| `position` | `number \| null`     | Posição atual na fila                        |
| `isCalled` | `boolean`            | Se o paciente foi chamado pela recepcionista |
| `loading`  | `boolean`            | Operação em andamento                        |
| `error`    | `string`             | Mensagem de erro                             |

**Persistência entre navegações:**

O `entry` e `position` são inicializados com lazy initializer lendo do `sessionStorage`:

```typescript
const [entry, setEntry] = useState<QueueEntry | null>(() => {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("queueEntry");
  return stored ? JSON.parse(stored) : null;
});
```

Ao entrar na fila, salva no `sessionStorage`. Ao cancelar, remove. Assim ao atualizar a página ou voltar, o paciente vê sua posição sem precisar entrar de novo.

**Conexão Socket.io:**

```
Hook monta
  → conecta no servidor Socket.io
  → ao conectar emite join:unit com o healthUnitId
  → escuta queue:update → atualiza posição
  → escuta ticket:called → marca isCalled = true
  → ao desmontar emite leave:unit e desconecta
```

**Limitação conhecida:** ao ser chamado e atendido pelo médico (ticket vai para `DONE`), a tela do paciente não é notificada — ele permanece na tela de "você foi chamado" indefinidamente. O evento `ticket:done` ainda não é emitido pelo backend nem escutado pelo hook. Planejado para a Sprint 4.

---

## Hook useHealthUnits

Busca a lista de postos disponíveis com filtro opcional por cidade e estado.

```typescript
const { units, loading, error } = useHealthUnits("Caruaru", "PE");
```

A requisição é refeita automaticamente quando `city` ou `state` mudam.

---

## Páginas implementadas

### `/login`

Formulário de login com e-mail e senha. Após autenticação bem sucedida redireciona por role (ver seção Autenticação).

### `/register`

Formulário de cadastro com nome, e-mail, CPF, telefone (opcional) e senha. CPF aceita apenas dígitos — formatação é feita pelo frontend, armazenamento no backend é sem pontuação. Após cadastro redireciona por role.

### `/fila`

Página principal do paciente. Tem dois estados:

**Estado 1 — paciente não está na fila:**

- Filtros de cidade e estado
- Lista de postos disponíveis com horário e limite de fichas
- Botão "Entrar na fila" por posto

**Estado 2 — paciente está na fila:**

- Posição atual atualizada em tempo real via Socket.io
- Notificação visual quando chamado pela recepcionista
- Botão "Cancelar minha vez"

### `/recepcionista`

Painel da recepcionista. Sem guard de role na própria página — a proteção vem do middleware (token) e dos `403` da API (role). Composto por:

- Botão "Chamar próximo" — dispara `POST /tickets/call-next`, desabilitado quando não há ninguém aguardando
- Card "Fila atual" — lista pacientes com status `WAITING`, atualizada em tempo real via Socket.io (`queue:update`)
- Card "Fichas emitidas hoje" — lista tickets do dia com nome do paciente e status, carregada uma vez no mount via `GET /tickets/today`

### `/medico`

Painel do médico. Segue a mesma estrutura de carregamento da `/recepcionista`, sem guard de role na própria página (mesma justificativa: middleware + `403` da API já cobrem o caso).

**Carregamento inicial:**

```
useEffect monta
  → doctorService.getTodayTickets(accessToken)
  → GET /tickets/doctor/today
  → preenche o estado tickets
```

**Layout — três grupos derivados do mesmo array `tickets`:**

```typescript
const waiting = tickets.filter((t) => t.status === "WAITING");
const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS");
const done = tickets.filter((t) => t.status === "DONE");
```

Exibidos como contadores no topo da página (`{waiting.length} aguardando · {inProgress.length} em atendimento · {done.length} concluídos`).

**Cada ficha exibe:**

- Número da ficha e nome do paciente (`ticket.queueEntry.user.name`)
- Horário de chegada na fila, formatado em `pt-BR` (`ticket.createdAt`)
- Status atual como badge
- Botão de ação condicional ao status:
  - `WAITING` → botão **Iniciar**, chama `PATCH /tickets/:id/start`
  - `IN_PROGRESS` → botão **Concluir**, chama `PATCH /tickets/:id/complete`
  - `DONE` → sem ação, apenas badge

**Atualização otimista local:**

Após `start` ou `complete`, a resposta da API (ticket atualizado, já com `queueEntry.user` incluso) substitui o item correspondente no array `tickets`, sem precisar recarregar a lista inteira:

```typescript
setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
```

Isso depende do backend retornar o `queueEntry` completo no `PATCH` — sem esse `include`, o nome do paciente desaparecia da tela até a próxima recarga manual (bug identificado e corrigido durante a Sprint 3, ver `TICKETS.md`).

**Estado de loading por ação:** `loadingAction` guarda o `id` do ticket em processamento, desabilitando apenas o botão daquele ticket específico (não a página inteira) enquanto a request está em voo.

---

## Tratamento de erros HTTP

O Axios retorna erros com a estrutura:

```typescript
err as { response?: { data?: { message?: string } } };
```

Os erros da API são exibidos inline nas páginas — sem alerts ou modals. Mensagem padrão quando o backend não retorna `message`.

---

## Variáveis de ambiente

| Variável              | Descrição       | Exemplo                 |
| --------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | URL base da API | `http://localhost:3000` |

---

## Decisões técnicas

**Por que cookie para o token e não só sessionStorage?**
O middleware do Next.js roda no servidor e não tem acesso ao `sessionStorage`. O cookie é enviado automaticamente em toda requisição HTTP, permitindo que o middleware leia o token e redirecione sem autenticação antes de carregar qualquer página.

**Por que `suppressHydrationWarning` no `<body>`?**
Extensões de navegador como Grammarly injetam atributos no `<body>` após a renderização do servidor, causando hydration mismatch no React. O `suppressHydrationWarning` instrui o React a ignorar diferenças de atributos nesse elemento específico.

**Por que lazy initializer no useState em vez de useEffect para restaurar sessionStorage?**
Chamar `setState` dentro de um `useEffect` causa renders em cascata. O lazy initializer executa uma única vez durante a inicialização do componente — sem efeito colateral e sem render extra.

**Por que rooms no Socket.io em vez de broadcast global?**
Sem rooms, todo evento seria enviado para todos os clientes conectados no servidor. Com rooms por `healthUnitId`, cada paciente só recebe eventos do posto onde está na fila — sem ruído e sem vazar dados de outros postos.

**Por que não há guard de role nas páginas `/recepcionista` e `/medico`?**
O `redirectByRole` já garante que cada usuário cai na rota certa logo após autenticar, e qualquer request à API feita a partir de uma rota errada é rejeitada com `403` pelo backend. Um guard adicional na página seria redundante para o estágio atual do projeto — a lacuna real é o acesso _visual_ não autorizado (ver Proteção de rotas), tratada como task de Sprint 4.

---

## Pendências conhecidas (Sprint 4)

| Pendência                  | Camada                | Descrição                                                                                                                                                                                 |
| -------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proteção de rotas por role | Frontend (middleware) | Middleware hoje só valida presença de token, não o `role`. Paciente consegue visualizar `/medico` e `/recepcionista`, ainda que sem conseguir operar.                                     |
| Evento `ticket:done`       | Backend + Frontend    | Ao concluir o atendimento, o paciente não é notificado nem redirecionado — fica preso na tela de "você foi chamado". Requer emitir o evento no `completeTreatment` e ouvir no `useQueue`. |
