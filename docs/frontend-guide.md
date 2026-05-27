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
│   ├── globals.css
│   └── layout.tsx            # layout raiz com AuthProvider
├── contexts/
│   └── auth.context.tsx      # contexto global de autenticação
├── hooks/
│   ├── useQueue.ts           # lógica da fila + Socket.io
│   └── useHealthUnits.ts     # listagem de postos
├── services/
│   └── auth.service.ts       # chamadas de autenticação
├── lib/
│   └── api.ts                # instância configurada do Axios
├── types/
│   └── auth.ts               # tipos de autenticação
└── middleware.ts             # proteção automática de rotas
```

O agrupamento com parênteses — `(auth)`, `(patient)` — organiza rotas sem afetar a URL. `/fila` fica em `(patient)/fila/page.tsx` mas é acessada como `http://localhost:3001/fila`.

---

## Autenticação

O `AuthContext` gerencia o estado global de autenticação e persiste a sessão entre navegações.

**Onde os dados ficam:**

| Dado | Onde | Por quê |
|------|------|---------|
| Access Token | Cookie `session` | Lido pelo middleware do servidor para proteger rotas |
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

---

## Proteção de rotas

O `middleware.ts` protege automaticamente todas as rotas não públicas:

```typescript
const publicRoutes = ['/login', '/cadastro'];

export function middleware(request: NextRequest) {
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute) return NextResponse.next();

  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

Qualquer rota não listada em `publicRoutes` exige o cookie `session`. Sem ele, o middleware redireciona para `/login` antes de carregar qualquer componente.

---

## Hook useQueue

Centraliza toda a lógica da fila virtual — conexão Socket.io, entrar, sair e acompanhar posição.

**Estado gerenciado:**

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `entry` | `QueueEntry \| null` | Entrada ativa do paciente na fila |
| `position` | `number \| null` | Posição atual na fila |
| `isCalled` | `boolean` | Se o paciente foi chamado pela recepcionista |
| `loading` | `boolean` | Operação em andamento |
| `error` | `string` | Mensagem de erro |

**Persistência entre navegações:**

O `entry` e `position` são inicializados com lazy initializer lendo do `sessionStorage`:

```typescript
const [entry, setEntry] = useState<QueueEntry | null>(() => {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem('queueEntry');
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

---

## Hook useHealthUnits

Busca a lista de postos disponíveis com filtro opcional por cidade e estado.

```typescript
const { units, loading, error } = useHealthUnits('Caruaru', 'PE');
```

A requisição é refeita automaticamente quando `city` ou `state` mudam.

---

## Páginas implementadas

### `/login`
Formulário de login com e-mail e senha. Após autenticação bem sucedida redireciona para `/fila`.

### `/cadastro`
Formulário de cadastro com nome, e-mail, CPF, telefone (opcional) e senha. CPF aceita apenas dígitos — formatação é feita pelo frontend, armazenamento no backend é sem pontuação. Após cadastro redireciona para `/fila`.

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

---

## Tratamento de erros HTTP

O Axios retorna erros com a estrutura:

```typescript
err as { response?: { data?: { message?: string } } }
```

Os erros da API são exibidos inline nas páginas — sem alerts ou modals. Mensagem padrão quando o backend não retorna `message`.

---

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
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