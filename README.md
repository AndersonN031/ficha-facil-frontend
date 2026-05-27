# FilaSaúde — Frontend

Interface web do sistema de fila virtual para postos de saúde públicos. Permite que pacientes entrem na fila pelo celular, acompanhem sua posição em tempo real e recebam notificação quando forem chamados — sem precisar estar presencialmente no local.

> 🚧 Projeto em desenvolvimento ativo

---

## O que é

O frontend do FilaSaúde serve diferentes painéis de acordo com o papel do usuário:

| Role              | Acesso                                                                        |
| ----------------- | ----------------------------------------------------------------------------- |
| **Paciente**      | Entra na fila virtual, acompanha posição em tempo real, cancela quando quiser |
| **Recepcionista** | Painel do dia, chama próximo da fila, emite ficha                             |
| **Médico**        | Visualiza fichas atribuídas, marca atendimento como concluído                 |
| **Admin**         | Gerencia postos, usuários e papéis, acessa relatórios                         |

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

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- API do FilaSaúde rodando em `http://localhost:3000`

### Setup

```bash
git clone https://github.com/seu-usuario/filasaude-web.git
cd filasaude-web
npm install
cp .env.example .env.local
npm run dev
```

Disponível em `http://localhost:3001`.

### Variáveis de ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Páginas implementadas

| Rota             | Status       | Descrição                                                       |
| ---------------- | ------------ | --------------------------------------------------------------- |
| `/login`         | ✅ Concluído | Autenticação com e-mail e senha                                 |
| `/cadastro`      | ✅ Concluído | Cadastro de novo paciente                                       |
| `/fila`          | ✅ Concluído | Listar postos, entrar na fila, acompanhar posição em tempo real |
| `/recepcionista` | 🚧 Sprint 3  | Painel da recepcionista                                         |
| `/medico`        | 🚧 Sprint 3  | Agenda do médico                                                |
| `/admin`         | ⏳ Pendente  | Painel administrativo                                           |

---

## Fluxo do paciente

```
/cadastro ou /login
  → autenticado → redireciona para /fila
  → lista postos disponíveis (filtrável por cidade/estado)
  → clica em "Entrar na fila"
  → vê posição em tempo real via Socket.io
  → recebe notificação quando chamado
  → pode cancelar a qualquer momento
```

---

## Documentação técnica

Para detalhes sobre arquitetura, hooks, contexto de auth e decisões técnicas consulte o [FRONTEND.md](./docs/FRONTEND.md).

---

## Autores

Projeto desenvolvido como portfólio pessoal.
