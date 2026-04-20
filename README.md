# 📚 Mesa de Estudos Inteligente

> Plataforma web para organização inteligente de estudos para concursos públicos — com ciclos adaptativos, rastreamento de progresso e controle de sessões em tempo real.

---

## 📌 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura e Estrutura](#arquitetura-e-estrutura)
- [Telas e Fluxo de Uso](#telas-e-fluxo-de-uso)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Como Rodar o Projeto](#como-rodar-o-projeto)
- [Ciclo de Estudos Inteligente](#ciclo-de-estudos-inteligente)
  - [Por que um ciclo de estudos?](#por-que-um-ciclo-de-estudos)
  - [Fila contínua de sessões](#o-conceito-central-fila-contínua-de-sessões)
  - [Etapa 1 — Seleção de disciplinas](#etapa-1--seleção-de-disciplinas)
  - [Etapa 2 — Score de importância](#etapa-2--cálculo-do-score-de-importância)
  - [Etapa 3 — Frequência e ciclo dinâmico](#etapa-3--cálculo-de-frequência-ciclo-dinâmico)
  - [Etapa 4 — Categoria cognitiva](#etapa-4--organização-da-fila-por-categoria-cognitiva)
  - [Etapa 5 — Reparação de espaçamento](#etapa-5--reparação-de-espaçamento)
  - [Comparativo com o mercado](#resumo-por-que-este-algoritmo-é-melhor-do-que-o-que-existe-no-mercado)
  - [Ciclo adaptativo futuro](#o-futuro-ciclo-adaptativo)
  - [Referências científicas](#referências-científicas)
- [Banco de Dados](#banco-de-dados)
  - [Filosofia de design](#visão-geral-e-filosofia-de-design)
  - [Schema `auth`](#schema-auth--identidade-e-autenticação)
  - [Schema `concurso`](#schema-concurso--estrutura-dos-concursos)
  - [Schema `planejamento`](#schema-planejamento--ciclos-e-progresso-individual)
  - [Mapa de relacionamentos](#mapa-de-relacionamentos)
  - [Desempenho adaptativo e dados externos](#sobre-desempenho-adaptativo-e-dados-externos)

---

## 🚀 Sobre o Projeto

A **Mesa de Estudos Inteligente** foi criada para resolver um problema real do concurseiro: estudar muito sem estudar bem.

A maioria dos candidatos organiza os estudos manualmente — planilhas, cadernos, achismo. Isso gera desequilíbrio: matérias fáceis recebem atenção demais, matérias difíceis e importantes são negligenciadas. O resultado é chegar na prova forte em duas matérias e zerado nas demais.

A plataforma resolve isso com três pilares:

- **Ciclo Inteligente** — Uma fila de sessões de estudo gerada automaticamente com base no edital, no tipo da disciplina (específica vs. básica) e na dificuldade pessoal do candidato. A frequência de cada matéria é proporcional ao seu score de importância, calculado por algoritmo.
- **Progresso Granular** — Rastreamento de progresso por tópico, disciplina e ciclo. O candidato sabe exatamente o que já estudou, o que está pendente e qual é sua velocidade real.
- **Sessões em Tempo Real** — Controle de sessões de estudo com início, pausa e conclusão registrados no banco. Cada sessão é linkada à posição da fila do ciclo que a originou, construindo a base de dados para o ciclo adaptativo futuro.

O produto é orientado a concurseiros que estudam para provas específicas (SEFAZ, Receita Federal, PGFN, TCU etc.) e querem eliminar o achismo da rotina de estudos.

---

## 📂 Arquitetura e Estrutura

O projeto segue a arquitetura do **Next.js App Router** com separação clara entre camadas:

```text
Mesa-de-estudos/
│
├── src/
│   └── app/                          # Camada de apresentação (Next.js App Router)
│       ├── layout.tsx                # Layout raiz com fontes e providers
│       ├── page.tsx                  # Landing page
│       ├── login/page.tsx
│       ├── cadastro/page.tsx
│       ├── assinatura/page.tsx       # Planos e benefícios
│       ├── pagamento/page.tsx
│       ├── dashboard/page.tsx        # Visão geral do ciclo ativo
│       ├── ciclos/page.tsx           # Criação e visualização do ciclo
│       ├── editais/page.tsx          # Navegação de concursos e editais
│       ├── recuperar-senha/page.tsx
│       ├── redefinir/page.tsx
│       └── api/                      # Route Handlers (API REST interna)
│           ├── cadastro/route.ts
│           ├── login/route.ts
│           ├── ciclos/route.ts       # GET, POST, PATCH, DELETE
│           ├── concursos/route.ts
│           ├── concursos/[id]/route.ts
│           ├── recuperar-senha/route.ts
│           └── redefinir-senha/route.ts
│
├── service/                          # Lógica de negócio
│   ├── ciclo.service.ts              # Algoritmo do ciclo + serviços CRUD
│   ├── concurso.service.ts
│   ├── user.auth.service.ts          # Autenticação JWT + sessões
│   ├── email.service.ts              # Envio de emails transacionais
│   └── mapper/
│       └── concurso.mapper.ts
│
├── repository/                       # Acesso ao banco via Prisma
│   ├── ciclo.repository.ts
│   ├── concurso.repository.ts
│   └── user.repository.ts
│
├── schema/                           # Validação de entrada (Zod)
│   ├── ciclo.schema.ts
│   ├── cadastro.schema.ts
│   ├── login.schema.ts
│   └── reset.schema.ts
│
├── dto/                              # Tipos de transferência de dados
│   ├── ciclo.dto.ts
│   ├── concurso.dto.ts
│   ├── cadastro.dto.ts
│   ├── login.dto.ts
│   └── reset.dto.ts
│
├── lib/
│   └── prisma.ts                     # Singleton do Prisma Client
│
└── prisma/
    └── schema.prisma                 # Modelos do banco (schemas: auth, concurso, planejamento)
```

**Fluxo de uma requisição:**
`page.tsx` → `api/route.ts` → `service/*.ts` → `repository/*.ts` → PostgreSQL via Prisma

---

## 🖥️ Telas e Fluxo de Uso

### 🔵 Entrada e Autenticação

| Tela | Rota | Descrição |
|------|------|-----------|
| Landing | `/` | Apresentação do produto, proposta de valor |
| Login | `/login` | Autenticação com email e senha. JWT + refresh token. |
| Cadastro | `/cadastro` | Criação de conta. Email de verificação enviado após cadastro. |
| Recuperar Senha | `/recuperar-senha` | Envio de link de redefinição por email |
| Redefinir Senha | `/redefinir` | Formulário para nova senha via token |

### 🟠 Onboarding e Plano

| Tela | Rota | Descrição |
|------|------|-----------|
| Assinatura | `/assinatura` | Visualização de planos e benefícios. Desbloqueio de acesso ao produto. |
| Pagamento | `/pagamento` | Fluxo de pagamento |

### 🟢 Produto Principal

| Tela | Rota | Descrição |
|------|------|-----------|
| Dashboard | `/dashboard` | Visão geral: ciclo ativo, próximas sessões do dia, progresso por disciplina |
| Editais | `/editais` | Navegação de concursos, editais e cargos disponíveis |
| Ciclos | `/ciclos` | Criação do ciclo inteligente: seleção de disciplinas, definição de dificuldade, visualização da fila gerada |
| Minha Mesa | `/mesa` *(em desenvolvimento)* | Execução das sessões: cronômetro, avançar fila, marcar tópicos como concluídos |

### Fluxo típico de um usuário novo

```
Cadastro → Verificação de email → Assinatura → Dashboard
    → Editais (seleciona concurso/cargo)
    → Ciclos (cria ciclo, define dificuldades)
    → Minha Mesa (executa as sessões dia a dia)
    → Dashboard (acompanha progresso)
```

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Versão | Por que |
|--------|-----------|--------|---------|
| Framework | Next.js (App Router) | 16.x | SSR, API Routes e App Router em um único projeto |
| UI | React | 19.x | Componentes declarativos com Server/Client Components |
| Estilo | Tailwind CSS | v4 | Utilitários CSS com design system consistente |
| Linguagem | TypeScript | 5.x | Tipagem estática em todas as camadas |
| ORM | Prisma | 7.x | Type-safe, multi-schema PostgreSQL |
| Banco de Dados | PostgreSQL | — | Multi-schema (`auth`, `concurso`, `planejamento`), JOINs entre schemas |
| Driver PG | pg + @prisma/adapter-pg | — | Adapter nativo do Prisma para PostgreSQL |
| Autenticação | jose + jsonwebtoken | — | JWT (access token curto) + refresh token persistido no banco |
| Hash de senha | bcryptjs | — | Hash seguro de senhas com salt |
| Email | Resend + nodemailer | — | Envio de emails transacionais (verificação, reset) |
| Validação | Zod | v4 | Schema-first com inferência de tipos TypeScript |
| Ícones | lucide-react | — | Biblioteca de ícones consistente com o design |

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+ com os schemas `auth`, `concurso` e `planejamento` criados
- Conta no [Resend](https://resend.com) para envio de emails (ou configure SMTP via nodemailer)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@host:5432/nome_banco"

# JWT
JWT_SECRET="sua_chave_secreta_longa"
JWT_REFRESH_SECRET="sua_chave_refresh_secreta"

# Email
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@seudominio.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Sincronizar o schema com o banco

```bash
npx prisma db push
```

> Para ambientes de produção, use `npx prisma migrate deploy` com migrations versionadas.

### 4. Gerar o Prisma Client

```bash
npx prisma generate
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`.

---

## Ciclo de Estudos Inteligente

### Fluxo de criação do ciclo — as 4 etapas

O ciclo é criado por um assistente de 4 etapas. Cada etapa coleta um conjunto de informações que alimenta o algoritmo de geração. Entender o que cada etapa significa é fundamental para entender por que o ciclo é gerado do jeito que é.

---

#### Etapa 1 — Carga horária

O usuário informa **quantas horas por dia** pretende estudar.

Este número controla dois parâmetros do algoritmo:

| Parâmetro derivado | Fórmula | Significado |
|---|---|---|
| `máximo_disciplinas` | `horasDiarias × 2` | Quantas disciplinas distintas podem entrar no ciclo |
| `discsPorDia` | `f(horasDiarias, ritmo)` | Quantas disciplinas distintas o usuário vê por dia (ver Etapa 4) |

**Limite prático:** o slider aceita de 1 a 8 horas. Acima de 8h seria pouco realista para estudo de qualidade contínua.

---

#### Etapa 2 — Edital e cargo

O usuário seleciona o **edital** e o **cargo** para o qual está estudando.

Esta etapa é crítica porque é aqui que o sistema obtém os dados objetivos que alimentarão o score de cada disciplina:

- `peso` — pontuação por questão definida no edital
- `qtd_questoes` — quantidade de questões por disciplina
- `tipo` — se é específica (E) ou básica (B)
- `categoria_cognitiva` — se exige raciocínio (R) ou memorização (M)
- `qtd_topicos` — contagem de tópicos cadastrados para a disciplina (fallback quando edital não tem dados)

Sem esses dados, o algoritmo ainda funciona — mas com menor diferenciação entre disciplinas.

---

#### Etapa 3 — Método: Automático ou Personalizado

O usuário escolhe o nível de controle que quer exercer sobre o ciclo.

| Modo | Para quem | O que o sistema faz | O que o usuário faz |
|------|-----------|---------------------|---------------------|
| **Automático** | Iniciantes, quem quer começar rápido | Seleciona todas as disciplinas do cargo, define dificuldade como Médio para todas | Nada além de escolher o ritmo |
| **Personalizado** | Intermediários/avançados que conhecem o edital | Respeita a seleção do usuário, usa a dificuldade informada | Escolhe quais disciplinas entram e define a dificuldade de cada uma |

**Impacto no score:**

No modo automático, `dificNorm = 0.3` (Médio) para todas as disciplinas. A diferenciação vem do edital (`iNorm`) e do tipo (`tipoFator`). No modo personalizado, o `dificNorm` varia por disciplina (0 = Baixo, 0.3 = Médio, 0.7 = Alto), permitindo que a dificuldade pessoal do candidato influencie diretamente a frequência de cada matéria.

**Persistência do nível de dificuldade:**

Sempre que um ciclo é criado, o nível de dificuldade é persistido na tabela `disciplina_nivel_usuario`:
- Automático: grava `MEDIO` para todas as disciplinas do ciclo (sobrescreve qualquer valor anterior)
- Personalizado: grava o nível informado pelo usuário (sobrescreve também)

Isso garante que o que é exibido na visualização do ciclo (nível da disciplina) seja sempre consistente com o que foi usado no cálculo do score.

---

#### Etapa 4 — Organização: ritmo de estudo

O usuário define como prefere organizar seus estudos dentro de cada dia.

O **ritmo** controla exclusivamente a variabilidade diária — não altera o total de horas estudadas por dia, nem quais disciplinas entram no ciclo. Apenas redistribui as horas entre mais ou menos disciplinas.

| Ritmo | Fórmula `discsPorDia` | Comportamento |
|---|---|---|
| Focado | `max(1, ceil(horasDiarias × 0.4))` | Menos disciplinas distintas, maior profundidade por sessão |
| Equilibrado | `max(1, ceil(horasDiarias × 0.6))` | Balanceia variedade e repetição |
| Variado | `horasDiarias` | Uma disciplina diferente por hora, máxima variedade |

**Recomendação automática baseada nas horas:**

O sistema pré-seleciona o ritmo mais adequado conforme a carga horária declarada na Etapa 1:

| Horas/dia | Recomendado | Por que |
|---|---|---|
| 1–3h | Variado | Com poucas horas, `ceil(h×0.6)` = h — equilibrado e variado são idênticos. Variado maximiza cobertura. |
| 4–7h | Equilibrado | Faixa onde os três modos produzem resultados meaningfully diferentes. Equilibrado é o ponto ótimo. |
| 8+h | Focado | Com muitas horas, alta variedade (8 disciplinas diferentes) gera fadiga cognitiva excessiva por troca de contexto. |

O usuário pode alterar livremente — a recomendação é pré-seleção, não obrigação.

**Modo automático:** o seletor de ritmo aparece na Etapa 4.
**Modo personalizado:** o seletor de ritmo aparece junto com a lista de seleção de disciplinas.

---

### Por que um ciclo de estudos?

Antes de entrar nos detalhes técnicos, é importante entender o problema que o ciclo resolve.

A maioria dos concurseiros estuda de forma desordenada: estudam a matéria que gostam mais, ignoram as difíceis, perdem dias inteiros em uma única disciplina e esquecem de revisar as outras. O resultado? Desequilíbrio. Chegam na prova fortes em duas matérias e zerados nas demais.

Um ciclo de estudos é uma solução para isso. Em vez de decidir todos os dias "o que vou estudar hoje?", o sistema já organizou uma fila inteligente de sessões. O candidato só precisa seguir a fila.

Mas não basta qualquer fila. Uma fila eficiente precisa responder a perguntas como:
- Qual disciplina é mais importante para **essa prova específica**?
- Em qual disciplina **eu tenho mais dificuldade**?
- Com quantas horas disponíveis por dia, **quantas vezes cada disciplina deve aparecer**?
- Como garantir que não vou estudar a mesma matéria duas vezes seguidas?

É exatamente isso que o algoritmo desta plataforma resolve.

---

### O conceito central: fila contínua de sessões

O ciclo **não é um cronograma semanal**. Não existe "segunda-feira é dia de Português". O ciclo é uma **fila contínua e ordenada de sessões de estudo**, onde cada sessão tem duração fixa de **60 minutos**.

O candidato avança pela fila sessão a sessão. Quando a fila termina, ela reinicia automaticamente do começo. O ciclo é infinito por design — o candidato nunca "termina" o ciclo, ele simplesmente continua estudando.

**Por que 60 minutos por sessão?**

Com base no conceito de **ritmo ultradiano** (Lavie, 1982), o cérebro humano opera em ciclos naturais de aproximadamente 90 minutos, com picos de concentração de ~60 minutos. Sessões de 1 hora respeitam esses picos naturais de foco, maximizando a retenção sem gerar fadiga cognitiva excessiva.

**O que é a meta diária?**

A meta diária é simplesmente o número de sessões que o candidato pretende cumprir por dia, igual ao número de horas diárias informadas na criação do ciclo. Se o candidato tem 4 horas por dia, sua meta é 4 sessões de 60 minutos.

A meta diária é uma **referência**, não uma prisão. O candidato pode parar antes de completá-la, ou estudar além dela. O sistema apenas mostra as próximas N sessões da fila como sugestão do dia.

---

### Etapa 1 — Seleção de disciplinas

O primeiro passo do algoritmo é decidir **quais disciplinas entram no ciclo** e quantas podem ser selecionadas.

#### Limite de disciplinas distintas

O número máximo de disciplinas distintas no ciclo é calculado como:

```
máximo_disciplinas = horasDiarias × 2
```

**Por quê?** Esse valor representa o dobro da meta diária. Com 4 horas por dia, o ciclo pode ter até 8 disciplinas distintas. Isso garante que o candidato veja cada disciplina pelo menos a cada 2 dias, mantendo o conteúdo fresco na memória sem dispersar demais o foco.

#### Prioridade por tipo: Específicas primeiro

As disciplinas do edital são divididas em dois grupos:

| Tipo | Descrição |
|------|-----------|
| **E** (Específica) | Conhecimentos específicos do cargo — Direito Tributário, Contabilidade, etc. |
| **B** (Básica) | Conhecimentos básicos — Português, Raciocínio Lógico, Informática, etc. |

O algoritmo reserva **até 60% das vagas** para disciplinas específicas, e preenche o restante com básicas ordenadas por peso.

**Por quê?** Disciplinas específicas são o principal diferencial em uma prova. Em concursos como SEFAZ, PGFN e Receita Federal, as questões de conhecimentos específicos valem mais, são mais difíceis e eliminam mais candidatos. Faz sentido estratégico garantir que elas tenham presença garantida no ciclo.

Dentro de cada grupo, as disciplinas são ordenadas pelo **peso descrescente**, ou seja, as mais importantes entram primeiro.

---

### Etapa 2 — Cálculo do score de importância

Cada disciplina selecionada recebe um **score** que representa sua importância estratégica para aquela prova específica, combinada com a dificuldade pessoal do candidato.

O score determina **com que frequência a disciplina aparecerá na fila**. Score alto = aparece mais vezes. Score baixo = aparece menos vezes.

#### A fórmula completa

```
score = (1 + I_norm) × tipo_fator × dific_fator × desempenho
```

Vamos entender cada componente:

---

#### Componente 1: Importância no edital (I_norm)

Este componente captura o quanto a disciplina "vale" na prova, usando os dados disponíveis do edital.

**Passo 1 — Calcular a contribuição bruta (I):**

```
I = peso × qtd_questoes
```

| Variável | O que é | Exemplo |
|----------|---------|---------|
| `peso` | Pontuação por questão definida no edital. Se não informado, assume **1**. | SEFAZ: questões específicas valem 2 pontos cada |
| `qtd_questoes` | Quantidade de questões daquela disciplina na prova. Se não informado, assume **0**. | 70 questões de Contabilidade |

**Exemplo prático:**
- Contabilidade: peso=2, qtd=70 → I = 140
- Português: peso=1, qtd=50 → I = 50
- Informática: peso=1, qtd=0 (não informado) → I = 0

Ou seja, `I` representa o **total de pontos que aquela disciplina pode gerar na prova**. É a métrica mais honesta de importância objetiva.

**Passo 2 — Normalizar (I_norm):**

```
I_norm = I / I_max
```

Onde `I_max` é o maior valor de `I` entre todas as disciplinas selecionadas. Isso normaliza o valor entre 0 e 1.

No exemplo acima, I_max = 140 (Contabilidade).
- Contabilidade: I_norm = 140/140 = **1.0**
- Português: I_norm = 50/140 = **0.36**
- Informática: I_norm = 0/140 = **0** (sem dados = sem bônus)

**Por que somar 1 antes de multiplicar?**

A fórmula usa `(1 + I_norm)` e não apenas `I_norm`. Isso é intencional: mesmo quando não há nenhum dado de edital (I_norm = 0), o score não zera — a disciplina ainda conta com o tipo e a dificuldade para se diferenciar. O `1` é o piso que garante que toda disciplina tem ao menos alguma importância.

Com `I_norm`, o componente varia entre **1.0** (sem dados) e **2.0** (máximo do edital). Ou seja, os dados do edital podem no máximo **dobrar** a importância base de uma disciplina.

---

#### Componente 2: Fator do tipo (tipo_fator)

```
tipo_fator = 1.5  se a disciplina é Específica (E)
tipo_fator = 1.0  se a disciplina é Básica (B)
```

Este fator existe para garantir uma vantagem estrutural às disciplinas específicas, independente dos dados do edital. Em editais onde não há peso nem quantidade de questões definidos, este fator é o principal diferenciador estratégico.

**Por quê 1.5?** Um aumento de 50% representa uma vantagem significativa sem ser extremo. Significa que uma disciplina específica, em igualdade de condições, aparecerá ~22% mais vezes no ciclo do que uma básica de mesmo score base.

---

#### Componente 3: Fator de dificuldade (dific_fator)

```
dific_fator = 1  se dificuldade = Baixo
dific_fator = 2  se dificuldade = Médio
dific_fator = 3  se dificuldade = Alto
```

Este é o componente **mais pessoal** do score. Ele é informado pelo próprio candidato na etapa 3 de criação do ciclo, e reflete o quanto ele sente dificuldade naquela matéria.

**Por que a dificuldade aumenta a frequência?**

Porque dificuldade = necessidade de repetição. Uma matéria que você já domina não precisa aparecer toda semana. Uma matéria em que você trava a cada questão precisa de muito mais exposição. Este é o princípio da **prática deliberada** (Ericsson, 1993): o esforço focado nos pontos de fraqueza é o que gera melhoria real.

A escala multiplicativa (1, 2, 3) foi escolhida para que a dificuldade tenha peso proporcional. Uma disciplina com dificuldade Alta tem score 3× maior do que a mesma disciplina com dificuldade Baixa, o que pode resultar em 1 a 2 aparições extras por ciclo.

**E se o usuário usar o modo automático?**

No modo automático, o candidato não informa dificuldades. O sistema assume `dificuldade = Médio` para todas as disciplinas, garantindo que o ciclo seja gerado sem travar e que haja ao menos diferenciação por peso e tipo.

---

#### Componente 4: Fator de desempenho (desempenho) — preparado para o futuro

```
desempenho = 1.0  (neutro, valor atual)
```

Este parâmetro existe hoje mas ainda não é utilizado de forma ativa. Ele está na assinatura da função `calcularScore` preparado para receber dados reais de performance do candidato — como percentual de acertos em simulados ou questões resolvidas.

No futuro, quando houver dados históricos suficientes:
- Candidato com 80% de acertos em Português → `desempenho` baixo → disciplina aparece menos
- Candidato com 30% de acertos em Direito Tributário → `desempenho` alto → disciplina aparece mais

Isso tornará o ciclo **adaptativo**: ele se ajusta automaticamente conforme o candidato melhora.

---

#### Exemplo completo de score

Candidato estudando para SEFAZ (CEBRASPE, sem peso explícito):

| Disciplina | Tipo | qtd_questoes | I | I_norm | tipo_fator | dific | dific_fator | score |
|-----------|------|-------------|---|--------|-----------|-------|------------|-------|
| Contabilidade | E | 70 | 70 | 1.0 | 1.5 | Alto | 3 | (1+1.0)×1.5×3 = **9.0** |
| Direito Tributário | E | 40 | 40 | 0.57 | 1.5 | Alto | 3 | (1+0.57)×1.5×3 = **7.07** |
| Português | B | 50 | 50 | 0.71 | 1.0 | Médio | 2 | (1+0.71)×1.0×2 = **3.43** |
| Informática | B | 10 | 10 | 0.14 | 1.0 | Baixo | 1 | (1+0.14)×1.0×1 = **1.14** |

---

### Etapa 3 — Cálculo de frequência (ciclo dinâmico)

Com os scores em mãos, o algoritmo calcula quantas vezes cada disciplina aparecerá na fila.

#### Por que usar raiz quadrada do score?

A frequência é proporcional a `√score`, não ao score direto. Isso é uma escolha deliberada para **comprimir a escala** e evitar monopolização.

Se usássemos o score diretamente, uma disciplina com score 9 apareceria 9× mais do que uma com score 1 — o que tornaria o ciclo monótono e desequilibrado. Com a raiz quadrada, a disciplina com score 9 aparece apenas 3× mais do que a com score 1, mantendo a diversidade de conteúdo enquanto ainda respeita a hierarquia de importância.

#### Âncora absoluta — o ponto mais importante

```
freq = max(1, round(√score))
```

O score mínimo possível é **1** (básica + Baixo + sem dados de edital):
```
(1 + 0) × 1.0 × 1 = 1  →  √1 = 1  →  freq = 1
```

O score máximo possível é **9** (específica + Alto + I_norm máximo):
```
(1 + 1) × 1.5 × 3 = 9  →  √9 = 3  →  freq = 3
```

Isso significa que o ciclo terá frequências variando entre **1 e 3 aparições por disciplina**.

A âncora é **absoluta e fixa**, não relativa ao grupo. Isso é fundamental. Se todas as disciplinas têm score alto, todas aparecem mais vezes — porque genuinamente precisam. Não é uma comparação interna. Uma disciplina com score 4.5 sempre terá frequência 2, independente do que está ao lado dela.

**Mapeamento score → frequência:**

| Score | √score | Frequência |
|-------|--------|------------|
| 1 | 1.00 | 1 |
| 2 | 1.41 | 1 |
| 3 | 1.73 | 2 |
| 4 | 2.00 | 2 |
| 4.5 | 2.12 | 2 |
| 6 | 2.45 | 2 |
| 9 | 3.00 | 3 |

#### Tamanho do ciclo é dinâmico

```
totalSlots = soma de todas as frequências individuais
```

O ciclo não tem tamanho fixo. Seu tamanho é consequência natural dos scores. Se as disciplinas são todas importantes e difíceis, o ciclo é maior. Se são fáceis e básicas, é menor. Isso garante que o candidato passe o tempo certo em cada matéria sem desperdício.

**Exemplo:** 4 disciplinas com frequências [3, 2, 2, 1] → ciclo com **8 sessões** = 8 horas de estudo para completar um ciclo.

---

### Etapa 4 — Organização da fila por categoria cognitiva

As disciplinas são separadas em duas categorias cognitivas:

| Categoria | Código | Exemplos |
|-----------|--------|---------|
| Raciocínio | R | Matemática, Raciocínio Lógico, Estatística, Direito |
| Memorização | M | Português, História, Geografia, Contabilidade |

O algoritmo constrói duas filas separadas via **round-robin** (cada disciplina da categoria aparece uma vez por rodada, em rotação) e depois **intercala R e M** na fila final:

```
R1 → M1 → R2 → M2 → R3 → M3 → ...
```

**Por que intercalar?**

Com base nos estudos de **interleaving** (Rohrer & Bjork, 2008), alternar entre tipos cognitivos diferentes melhora a retenção comparado a estudar o mesmo tipo em bloco. Quando o cérebro alterna entre raciocínio analítico e memorização, os dois processos se consolidam melhor porque não competem pelos mesmos recursos cognitivos (Teoria da Carga Cognitiva, Sweller, 1988).

Na prática: estudar Matemática (R) seguido de Português (M) é mais eficiente do que estudar Matemática seguido de Raciocínio Lógico (dois R em sequência).

---

### Etapa 5 — Reparação de espaçamento

Após montar a fila, o algoritmo aplica uma última verificação: garantir que nenhuma disciplina apareça muito próxima de si mesma.

#### A regra de espaçamento

```
gap mínimo = 2 × disciplinasPorDia
```

Isso significa que entre duas aparições consecutivas da mesma disciplina, devem existir pelo menos `2 × disciplinasPorDia` sessões de distância.

**Por que `disciplinasPorDia` e não `horasDiarias`?**

Antes desta revisão, o gap usava `horasDiarias` diretamente. O problema: o gap semântico correto não é "horas por dia", mas "quantas disciplinas distintas o usuário estuda por dia" — que varia conforme o ritmo escolhido (ver Etapa 6). Com ritmo focado e 8h/dia, o usuário vê 4 disciplinas distintas por dia, não 8. Usar `horasDiarias` nesse caso produziria um gap excessivamente grande.

`disciplinasPorDia` é a unidade semanticamente correta: a disciplina não deve aparecer duas vezes na mesma "volta do dia" (gap = `discsPorDia`) nem na volta imediatamente seguinte (gap = `2 × discsPorDia`).

**Garantia prática:** há sempre pelo menos um dia de descanso entre dois estudos da mesma disciplina. Alinhado com os princípios da **repetição espaçada** (Ebbinghaus, 1885).

#### Como o reparo funciona

O algoritmo percorre a fila posição por posição. Quando encontra uma disciplina que viola o gap mínimo, tenta trocar essa posição com a primeira disciplina à frente na fila que satisfaça o espaçamento. Se não encontrar candidato válido, deixa como está (melhor esforço).

---

### Etapa 6 — Ritmo de estudo e variabilidade diária

#### O problema que esta etapa resolve

`horasDiarias` controlava duas coisas ao mesmo tempo: o total de horas por dia E a quantidade de disciplinas distintas por dia. Com 8h/dia e 8 disciplinas no ciclo, o usuário via 8 matérias diferentes em sequência — uma por hora. Isso é alta variabilidade cognitiva: o cérebro troca de contexto a cada sessão, sem tempo para aprofundar nenhuma disciplina.

Pesquisa sobre carga cognitiva (Sweller, 1988) sugere que muitos chaveamentos de contexto em um mesmo período reduzem a eficiência de aprendizado. Por outro lado, estudar a mesma matéria por horas consecutivas também tem rendimento decrescente.

O ponto de equilíbrio varia por candidato e por estilo de estudo — por isso a solução correta é **deixar o usuário escolher**, com uma interface acessível.

#### A separação dos dois conceitos

| Parâmetro | O que controla | Quem define |
|---|---|---|
| `horasDiarias` | Total de sessões por dia (carga total) | Slider na Etapa 1 |
| `ritmo` | Quantas disciplinas distintas por dia (variabilidade) | Seleção na Etapa 1 |

O total de horas estudadas por dia nunca muda — o `ritmo` apenas redistribui essas horas entre mais ou menos disciplinas.

#### Os três modos e suas fórmulas

```
focado:      discsPorDia = max(1, ceil(horasDiarias × 0.4))
equilibrado: discsPorDia = max(1, ceil(horasDiarias × 0.6))   ← padrão recomendado
variado:     discsPorDia = horasDiarias
```

**Exemplos práticos com 8h/dia:**

| Ritmo | discsPorDia | Resultado no dia |
|---|---|---|
| Focado | 4 | 4 disciplinas × 2h cada (as mais relevantes repetem) |
| Equilibrado | 5 | 5 disciplinas (3 com 2h, 2 com 1h) |
| Variado | 8 | 8 disciplinas × 1h cada |

**Por que esses multiplicadores (0.4 e 0.6)?**

- `0.6` para equilibrado: reduz a variabilidade em ~40% sem criar blocos excessivamente longos. Com 8h, o usuário faz 5 disciplinas — ainda diversificado, mas com profundidade maior do que 8.
- `0.4` para focado: reduz em ~60%, criando blocos de ~2h por disciplina — compatível com sessões de estudo profundo (deep work).
- `variado`: comportamento original do sistema, para quem prefere alta rotatividade.

#### Efeito em cascata: minGap do espaçamento

O ritmo também altera o espaçamento mínimo na geração do ciclo (Etapa 5). Com `discsPorDia` menor, o `minGap` também é menor — o ciclo não precisa espaçar as disciplinas por "8 posições" se o usuário só vê 4 por dia. O ciclo fica mais compacto e mais adequado à rotina real do usuário.

---

### Etapa 7 — Montagem da sessão diária com repetição controlada

Esta etapa acontece no **serviço de leitura** (`buscarCicloService`), não na geração do ciclo. Quando o usuário abre a tela de ciclos, o sistema monta dinamicamente quais sessões ele deve fazer hoje.

#### Quando a repetição dentro do dia é ativada

```
condição: discsPorDia < horasPorDia
```

Ou seja: sempre que o usuário não escolheu o modo `variado`. Com `focado` ou `equilibrado`, haverá menos disciplinas distintas do que horas disponíveis — as horas excedentes precisam ser preenchidas com repetições.

#### O algoritmo de montagem do dia

```
1. Toma discsPorDia slots consecutivos do ciclo (slots base)
2. Calcula o orçamento de repetições: extras = horasPorDia - discsPorDia
3. Para cada slot base, em ordem:
   a. Adiciona o slot (sempre)
   b. Se extras > 0 E freq(disciplina) >= 2 no ciclo E disciplina ainda não repetiu hoje:
      → Adiciona o slot novamente (repetição consecutiva)
      → Desconta 1 do orçamento de extras
      → Marca a disciplina como já repetida hoje
4. Se ainda sobrar orçamento após percorrer todos os slots base:
   → Toma os próximos slots do ciclo normalmente (sem repetição)
```

**Por que a repetição é consecutiva?** Para que o usuário estude a mesma matéria em bloco — 2h seguidas antes de mudar de disciplina. Intercalar repetiria o problema da alta variabilidade que estamos tentando resolver.

#### A condição `freq >= 2`

Uma disciplina com `freq = 1` no ciclo inteiro foi avaliada pelo score como de baixa importância proporcional. Forçar uma repetição no dia distorceria a distribuição calculada pelo algoritmo — a disciplina receberia o dobro do tempo previsto naquele giro do ciclo.

Com `freq >= 2`, a disciplina já tem "crédito" de múltiplas aparições no ciclo. Usar duas delas no mesmo dia é uma redistribuição temporal, não uma distorção de distribuição.

**Comportamento de longo prazo:** O ciclo é contínuo. Uma disciplina que apareceu 2× no dia de hoje simplesmente tem suas próximas ocorrências naturalmente deslocadas para dias posteriores — o ritmo médio de aparição ao longo do tempo permanece fiel ao score calculado.

#### Exemplo completo

Ciclo com 8 disciplinas, usuário com 8h/dia, ritmo equilibrado (`discsPorDia = 5`, `extras = 3`):

```
Ciclo (posição atual = 1):
  Slot 1: Contabilidade      (freq=3 no ciclo)
  Slot 2: Dir. Tributário    (freq=2)
  Slot 3: Português          (freq=1)
  Slot 4: Raciocínio Lógico  (freq=2)
  Slot 5: Informática        (freq=1)
  ...

Montagem do dia:
  → Contabilidade:    sempre + freq=3 ≥ 2 + não repetida → REPETE. extras=2. repetidas={Cont.}
  → Dir. Tributário:  sempre + freq=2 ≥ 2 + não repetida → REPETE. extras=1. repetidas={Cont., DT}
  → Português:        sempre + freq=1 < 2 → NÃO repete.
  → Raciocínio Lógico: sempre + freq=2 ≥ 2 + não repetida → REPETE. extras=0. repetidas={Cont., DT, RL}
  → Informática:      sempre + extras=0 → NÃO repete.

Sessões do dia (8 no total):
  Contabilidade · Contabilidade · Dir.Tributário · Dir.Tributário · Português · Raciocínio · Raciocínio · Informática
  └─ 2h ─────┘  └────── 2h ──────────────────┘  └── 1h ──┘  └────── 2h ──────────────┘  └── 1h ──┘
```

---

### Resumo: por que este algoritmo é melhor do que o que existe no mercado?

A maioria das plataformas de concurso oferece ciclos estáticos: você escolhe as matérias, define horas por semana manualmente, e o sistema apenas exibe um cronograma fixo. O candidato precisa saber de antemão quanto tempo dedicar a cada matéria — o que exige conhecimento técnico que a maioria não tem.

Este algoritmo faz isso automaticamente, com base em critérios objetivos:

| Critério | Plataformas comuns | Mesa de Estudos |
|----------|-------------------|-----------------|
| Distribuição de tempo | Manual pelo candidato | Automática por score |
| Considera peso do edital | Raramente | Sim |
| Considera dificuldade pessoal | Não | Sim |
| Considera tipo da disciplina | Não | Sim |
| Intercalação cognitiva | Não | Sim (R/M) |
| Espaçamento entre repetições | Não | Sim (2× discsPorDia) |
| Controle de variabilidade diária | Não | Sim (ritmo: focado/equilibrado/variado) |
| Repetição controlada dentro do dia | Não | Sim (respeitando freq do ciclo) |
| Ciclo adaptativo (futuro) | Não | Preparado |

---

### O futuro: ciclo adaptativo

O algoritmo foi projetado desde o início para evoluir. A função `calcularScore` recebe um parâmetro `desempenho` que hoje é neutro (1.0). Quando houver dados históricos de performance — percentual de acertos, tempo por questão, simulados — esse parâmetro será alimentado com valores reais.

Uma disciplina em que o candidato está melhorando progressivamente terá `desempenho` reduzido, diminuindo sua frequência no ciclo. Uma disciplina em que está estagnado terá `desempenho` aumentado. O ciclo se torna um organismo vivo que aprende junto com o candidato.

Da mesma forma, a função `calcularFrequencias` é separada e exportada justamente para poder ser chamada novamente com scores atualizados, reajustando a fila de um ciclo existente sem precisar recriá-lo do zero.

---

### Referências científicas

- **Ebbinghaus, H. (1885)** — Curva do esquecimento. Base da repetição espaçada.
- **Sweller, J. (1988)** — Teoria da Carga Cognitiva. Limite de ~4 contextos simultâneos na memória de trabalho.
- **Lavie, P. (1982)** — Ritmo ultradiano. Picos de foco de ~60 minutos.
- **Rohrer, D. & Bjork, R. (2008)** — Interleaving. Alternância entre tipos de conteúdo melhora retenção.
- **Ericsson, K. A. (1993)** — Prática deliberada. Foco em pontos de fraqueza maximiza melhoria.

---

## Banco de Dados

### Visão geral e filosofia de design

O banco de dados foi projetado em torno de uma pergunta central: **como modelar o estudo de um concurseiro de forma que seja possível, no futuro, personalizar e adaptar automaticamente o plano de estudos com base no desempenho real?**

Para responder isso, o banco foi dividido em três schemas PostgreSQL com responsabilidades bem definidas:

| Schema | Responsabilidade |
|--------|-----------------|
| `auth` | Quem é o usuário e como ele acessa o sistema |
| `concurso` | O que existe no mundo dos concursos (editais, cargos, disciplinas) |
| `planejamento` | O que o usuário está fazendo com esse conteúdo (ciclos, progresso, sessões) |

Essa separação não é apenas organizacional. Ela reflete uma distinção conceitual importante: os dados de `concurso` são **compartilhados entre todos os usuários** (um edital da SEFAZ é o mesmo para todo mundo), enquanto os dados de `planejamento` são **estritamente individuais** (o progresso de João não tem nada a ver com o de Maria). Misturar esses dois mundos numa mesma estrutura geraria acoplamento desnecessário e dificultaria futuras evoluções.

**Por que PostgreSQL com múltiplos schemas em vez de múltiplos bancos?**

Um schema PostgreSQL é como um "namespace" dentro do mesmo banco. Isso permite:
- Queries com JOIN entre schemas sem overhead de conexão
- Controle de permissões por schema
- Backups e migrações unificados
- Isolamento lógico sem isolamento físico

---

### Schema `auth` — Identidade e Autenticação

Este schema responde a uma única pergunta: **quem é este usuário e ele tem permissão para estar aqui?**

#### Tabela: `usuario`

É a entidade central de toda a plataforma. Todo dado de qualquer outro schema que pertença a uma pessoa específica aponta para esta tabela.

**Por que ela existe?** Porque precisamos de uma identidade única e estável para cada pessoa. Todos os dados de progresso, ciclos e sessões precisam saber "de quem é isso?".

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_usuario` | `BIGINT` PK | Identificador único interno. `BIGINT` (em vez de `INT`) porque a plataforma pode crescer para milhões de usuários — o custo de migrar um PK depois é alto. |
| `nome_completo` | `VARCHAR(150)` | Nome para exibição na interface. Tamanho 150 cobre nomes compostos longos. |
| `nome_usuario` | `VARCHAR(30)` UNIQUE | Handle público opcional do usuário. `UNIQUE` garante que não existam dois "@joaosilva". |
| `email` | `VARCHAR(150)` UNIQUE | Principal identificador de login. `UNIQUE` e indexado (`idx_usuario_email`) para buscas rápidas no login. |
| `foto_url` | `TEXT` | URL da foto de perfil armazenada externamente (S3, Cloudinary, etc.). `TEXT` sem limite porque URLs podem ser longas. |
| `ativo` | `BOOLEAN` | Permite desativar uma conta sem deletar os dados. Deleção permanente de usuário é irreversível — desativação não. |
| `primeiro_acesso` | `BOOLEAN` | Flag de onboarding. Quando `true`, o frontend exibe o fluxo de boas-vindas. Separado de `ativo` porque são conceitos distintos. |
| `data_criacao` | `TIMESTAMPTZ` | Registro auditável de quando a conta foi criada. `TIMESTAMPTZ` (com timezone) para evitar ambiguidades em servidores em timezones diferentes. |
| `email_verificado` | `BOOLEAN` | Impede uso da conta antes da confirmação de email. Separa "conta criada" de "email confirmado". |
| `email_verificacao_token` | `TEXT` | Token temporário enviado por email para confirmar o endereço. Nullable porque depois da verificação não é mais necessário. |
| `email_verificacao_expira_em` | `TIMESTAMP` | Validade do token de verificação. Sem expiração, um token vazado poderia ser usado indefinidamente. |

**Por que `id_usuario` é `BIGINT` e não `UUID`?**

UUIDs têm vantagens em sistemas distribuídos, mas em um banco PostgreSQL centralizado, `BIGINT` autoincrement é mais eficiente para índices (8 bytes sequenciais vs 16 bytes aleatórios), resulta em menos fragmentação de B-tree e é mais legível em logs e debug.

---

#### Tabela: `credencial`

Armazena exclusivamente os dados sensíveis de autenticação do usuário.

**Por que separada de `usuario`?** Separação de responsabilidades e segurança. A tabela `usuario` é lida constantemente (em qualquer página autenticada). A tabela `credencial` só é lida no momento do login. Ao separar, queries que precisam apenas do nome e email do usuário nunca tocam na senha hash — o que é uma boa prática de segurança.

Relacionamento: `credencial.id_usuario` → `usuario.id_usuario` com `@unique`, criando uma relação **1:1 obrigatória**. Todo usuário tem exatamente uma credencial. `onDelete: Cascade` garante que deletar o usuário deleta automaticamente suas credenciais — sem órfãos no banco.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_credencial` | `BIGINT` PK | Identificador da credencial. |
| `id_usuario` | `BIGINT` UNIQUE FK | Garante que cada usuário tem no máximo uma credencial. |
| `senha_hash` | `TEXT` | Hash bcrypt da senha. Nunca a senha em texto puro. `TEXT` porque hashes bcrypt têm tamanho fixo mas variável por versão. |
| `ultimo_login` | `TIMESTAMPTZ` | Registro de auditoria e segurança. Permite detectar logins suspeitos. |
| `reset_token` | `TEXT` | Token temporário gerado no fluxo "esqueci minha senha". Nullable quando não há reset em andamento. |
| `reset_token_expira_em` | `TIMESTAMPTZ` | Expiração do token de reset. Sem isso, um token interceptado poderia ser usado depois. |

---

#### Tabela: `sessao`

Controla as sessões ativas do usuário, implementando o padrão de **refresh token**.

**Por que ela existe?** A autenticação desta plataforma usa JWTs de curta duração (access token) + refresh tokens de longa duração armazenados nesta tabela. Quando o access token expira, o frontend usa o refresh token para obter um novo sem pedir a senha novamente. Esta tabela é o que torna isso seguro — ela permite **revogar** um refresh token específico (logout, senha trocada, dispositivo perdido) sem invalidar todos os outros.

Um usuário pode ter múltiplas sessões ativas (celular, notebook, trabalho) — por isso é 1:N com `usuario`.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_sessao` | `BIGINT` PK | Identificador único da sessão. |
| `id_usuario` | `BIGINT` FK | A qual usuário esta sessão pertence. Indexado (`idx_sessao_usuario`) para buscar todas as sessões de um usuário rapidamente. |
| `refresh_token` | `TEXT` | O token em si, gerado aleatoriamente. Indexado (`idx_refresh_token`) porque toda requisição de renovação busca por este valor. |
| `user_agent` | `TEXT` | Navegador/dispositivo que criou a sessão. Permite mostrar "sessões ativas" na tela de segurança. |
| `ip_address` | `TEXT` | IP de origem. Auditoria e detecção de anomalias. |
| `expira_em` | `TIMESTAMPTZ` | Quando o refresh token expira. Sessões expiradas são ignoradas mesmo se não revogadas. |
| `revogado` | `BOOLEAN` | Flag de revogação explícita (logout, troca de senha). Permite invalidar a sessão antes da expiração natural. |
| `data_criacao` | `TIMESTAMPTZ` | Quando o login foi feito. Auditoria. |

---

### Schema `concurso` — Estrutura dos Concursos

Este schema modela o **mundo externo**: a estrutura hierárquica dos concursos públicos brasileiros, que existe independentemente de qualquer usuário.

A hierarquia é: `orgao` → `concurso` → `edital` → `cargo` → `disciplina` → `topico`

Cada nível é necessário porque cada um tem características próprias que não podem ser achatadas no nível superior sem perda de informação.

---

#### Tabela: `orgao`

Representa o **órgão público** que realiza o concurso. Exemplos: SEFAZ-CE, Receita Federal, TCU, PGFN.

**Por que separado de `concurso`?** Porque um mesmo órgão realiza múltiplos concursos ao longo dos anos. SEFAZ-CE pode ter um concurso em 2022 e outro em 2026. Ao ter `orgao` como entidade separada, evitamos duplicar o nome do órgão em cada concurso e permitimos agrupar todos os concursos de um órgão facilmente.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_orgao` | `INT` PK | `INT` é suficiente — o número de órgãos é pequeno e estável. |
| `nome` | `VARCHAR(150)` UNIQUE | Nome completo do órgão. `UNIQUE` evita cadastros duplicados. |
| `sigla` | `VARCHAR(20)` UNIQUE | Sigla reconhecível (SEFAZ, RF, TCU). `UNIQUE` porque cada sigla identifica unicamente o órgão. |

---

#### Tabela: `concurso`

Representa um **concurso específico** promovido por um órgão.

**Por que separado de `edital`?** Porque um concurso pode ter mais de um edital (retificação, novo edital para o mesmo concurso). E um concurso tem identidade própria além do seu edital — nome, sigla, órgão.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_concurso` | `INT` PK | Identificador do concurso. |
| `nome` | `VARCHAR(255)` | Nome completo do concurso. 255 chars porque nomes oficiais podem ser longos. |
| `id_orgao` | `INT` FK | Qual órgão promove este concurso. `onDelete: NoAction` — deletar um órgão não deve cascatear para concursos (seria destrutivo demais). |
| `sigla` | `VARCHAR(50)` | Sigla do concurso (ex: "SEFAZ-CE 2026"). |

---

#### Tabela: `banca`

Representa a **banca organizadora** do concurso. Exemplos: CEBRASPE, FGV, CESPE, VUNESP.

**Por que existe?** Porque a banca afeta diretamente a forma como as questões são elaboradas (CEBRASPE usa certo/errado, FGV usa múltipla escolha) e os pesos das questões. No futuro, a banca pode ser usada para personalizar ainda mais o algoritmo do ciclo.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_banca` | `INT` PK | Identificador da banca. |
| `nome` | `VARCHAR(150)` UNIQUE | Nome completo da banca. |
| `sigla` | `VARCHAR(20)` UNIQUE | Sigla reconhecível (CEBRASPE, FGV). Exibida na interface por ser mais compacta. |

---

#### Tabela: `edital`

Representa o **edital publicado**, que é o documento oficial que define as regras do concurso para um ciclo específico.

**Por que separado de `concurso`?** Um concurso pode ter múltiplos editais: o edital original e retificações. Cada um pode ter datas, bancas e até cargos diferentes. Manter como entidade separada preserva esse histórico.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_edital` | `INT` PK | Identificador do edital. |
| `id_concurso` | `INT` FK | A qual concurso este edital pertence. `onDelete: Cascade` — se o concurso for removido, seus editais também são. |
| `ano` | `INT` | Ano do edital. Importante para ordenação e exibição. |
| `id_banca` | `INT` FK | Qual banca organizou este edital. `onDelete: NoAction` — deletar uma banca não deve apagar editais. |
| `ativo` | `BOOLEAN` | Se este edital está vigente. Permite manter histórico sem poluir a seleção ativa. |
| `status` | `VARCHAR(20)` | Estado do edital: ABERTO, PREVISTO, ENCERRADO. Exibido na interface para orientar o candidato. |
| `data_prova` | `DATE` | Data prevista da prova. Permite calcular tempo restante e priorizar estudos futuramente. |

---

#### Tabela: `cargo`

Representa um **cargo específico** dentro de um edital. Exemplos: Auditor Fiscal, Analista Administrativo, Técnico Tributário.

**Por que existe?** Porque cada cargo tem seu próprio conjunto de disciplinas, com pesos e quantidades de questões diferentes. O candidato estuda para um cargo específico, não para o concurso inteiro.

**Decisão importante:** `cargo` pertence a `edital` (não a `concurso`). Isso porque os cargos podem mudar entre editais do mesmo concurso — um edital pode abrir vagas para cargos que o anterior não tinha.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_cargo` | `INT` PK | Identificador do cargo. `INT` é suficiente — cargos são contados em centenas, não milhões. |
| `id_edital` | `INT` FK NOT NULL | A qual edital este cargo pertence. Não nullable — cargo sem edital não tem sentido no produto. `onDelete: Cascade` — edital removido, cargos também. |
| `nome` | `VARCHAR(150)` | Nome do cargo conforme o edital oficial. |

---

#### Tabela: `disciplina`

Esta é uma das tabelas mais importantes do schema `concurso`. Representa uma **disciplina do conteúdo programático** de um cargo específico.

**Por que não é genérica?** "Português" pode existir como disciplina em 100 cargos diferentes, mas com pesos e quantidades de questões diferentes em cada um. Por isso, `disciplina` pertence a `cargo` — é uma instância específica daquela matéria para aquele cargo. A constraint `UNIQUE([id_cargo, nome])` impede que a mesma disciplina apareça duas vezes no mesmo cargo.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_disciplina` | `INT` PK | Identificador. `INT` é suficiente. |
| `id_cargo` | `INT` FK | A qual cargo esta disciplina pertence. `onDelete: Cascade` — cargo removido, disciplinas também. |
| `nome` | `VARCHAR(100)` | Nome da disciplina conforme o edital. |
| `peso` | `DECIMAL(4,2)` | Peso da questão desta disciplina (ex: 1.0 = todas valem igual, 2.0 = cada questão vale o dobro). `DECIMAL(4,2)` permite pesos como 1.50, 2.00. Nullable porque nem todo edital define pesos. Default 1.0 quando não informado. |
| `qtd_questoes` | `INT` | Quantidade de questões desta disciplina na prova. Usado no cálculo do score. Nullable porque nem todo edital detalha isso. |
| `tipo` | `CHAR(1)` | `E` = Específica, `B` = Básica. Um único caractere é suficiente e eficiente. Tem CHECK constraint no banco para aceitar apenas esses valores. |
| `categoria_cognitiva` | `CHAR(1)` | `R` = Raciocínio, `M` = Memorização. Usado pelo algoritmo para intercalar tipos cognitivos na fila do ciclo. |

---

#### Tabela: `topico`

Representa um **tópico específico** dentro de uma disciplina. Exemplo: dentro de "Direito Constitucional" existem tópicos como "Direitos Fundamentais", "Organização do Estado", "Poder Judiciário".

**Por que existe?** Para permitir rastreamento granular do progresso. Saber que o candidato "está estudando Direito Constitucional" é pouco preciso. Saber que ele "concluiu 3 dos 8 tópicos de Direito Constitucional" é muito mais acionável.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_topico` | `BIGINT` PK | `BIGINT` aqui porque o número de tópicos pode ser muito maior que disciplinas — um edital detalhado pode ter centenas de tópicos por disciplina. |
| `id_disciplina` | `INT` FK | A qual disciplina este tópico pertence. `onDelete: Cascade`. |
| `descricao` | `TEXT` | Descrição textual do tópico conforme o edital. `TEXT` sem limite porque descrições de tópicos podem ser longas. |
| `ordem` | `INT` | Posição do tópico dentro da disciplina. Permite exibir na ordem do edital. UNIQUE com `id_disciplina` — dois tópicos da mesma disciplina não podem ter a mesma posição. |

---

### Schema `planejamento` — Ciclos e Progresso Individual

Este schema é o coração da experiência do usuário. Tudo aqui é individual — cada registro pertence a um usuário específico e registra o que ele está fazendo com o conteúdo do schema `concurso`.

---

#### Tabela: `plano_estudo`

É o **ponto de entrada** do planejamento. Quando o usuário cria um ciclo, o primeiro registro criado é aqui. O plano captura a intenção: "quero estudar para o cargo X com Y horas por dia".

**Por que existe separado de `ciclo_estudo`?** Porque o plano é a configuração de alto nível (cargo + horas diárias + método), enquanto o ciclo é a materialização dessa configuração em uma fila de sessões. Um mesmo plano pode gerar múltiplos ciclos ao longo do tempo (quando o usuário edita e recria o ciclo, cria um novo `ciclo_estudo` no mesmo `plano_estudo`).

Na prática atual, cada criação de ciclo gera um novo `plano_estudo` — mas a separação está pronta para o caso de reutilização futura.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_plano` | `BIGINT` PK | `BIGINT` porque usuários ativos criarão e recriarão planos com frequência. |
| `id_usuario` | `BIGINT` FK | A qual usuário pertence este plano. `onDelete: Cascade` — usuário deletado, planos deletados. |
| `id_cargo` | `INT` FK | Para qual cargo este plano foi criado. `onDelete: NoAction` — não queremos que deletar um cargo apague o histórico de estudo do usuário. |
| `metodo` | `VARCHAR(20)` | `AUTOMATICO` ou `PERSONALIZADO`. Define se o usuário deixou o sistema escolher as disciplinas ou escolheu manualmente. |
| `ritmo` | `VARCHAR(20)` | `FOCADO`, `EQUILIBRADO` ou `VARIADO`. Controla a variabilidade de disciplinas por dia (ver Etapa 6 do algoritmo). Default `EQUILIBRADO`. |
| `horas_por_dia` | `DECIMAL(4,2)` | Disponibilidade diária do usuário. `DECIMAL` (não `INT`) porque no futuro pode suportar 1.5h, 2.5h, etc. |
| `data_criacao` | `TIMESTAMPTZ` | Registro de quando o plano foi criado. Útil para análise de engajamento. |

---

#### Tabela: `ciclo_estudo`

Representa um **ciclo de estudos gerado** a partir de um plano. É o container da fila de sessões.

**Por que existe separado de `ciclo_disciplina`?** Porque o ciclo tem metadados próprios (data de início, se está ativo) que são independentes das disciplinas que o compõem. Também permite que um mesmo plano tenha múltiplos ciclos históricos.

A constraint de ter apenas um ciclo ativo por usuário é implementada por lógica de aplicação (`desativarCiclosUsuario` antes de criar novo), não por constraint de banco — o que dá mais flexibilidade para cenários futuros.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_ciclo` | `BIGINT` PK | Identificador único do ciclo. |
| `id_plano` | `BIGINT` FK | A qual plano este ciclo pertence. `onDelete: Cascade` — plano deletado, ciclo deletado. |
| `data_inicio` | `DATE` | Quando o ciclo foi iniciado. Default: data atual via `CURRENT_DATE`. |
| `data_fim` | `DATE` | Quando o ciclo foi encerrado. Nullable — ciclo ativo não tem data de fim. |
| `ativo` | `BOOLEAN` | Se este é o ciclo em execução atualmente. Permite manter histórico de ciclos anteriores sem confundir com o ativo. |

---

#### Tabela: `ciclo_disciplina`

Esta é a **fila de sessões do ciclo** — a estrutura de dados central de toda a plataforma. Cada linha representa uma sessão de 60 minutos de uma disciplina específica na posição `ordem` da fila.

**Por que é uma tabela separada e não um array em `ciclo_estudo`?** Porque cada sessão tem seus próprios atributos (`ordem`, `horas_planejadas`), precisa de relacionamento com `disciplina`, e o número de sessões por ciclo é variável. Arrays em colunas não permitem JOINs eficientes. A modelagem relacional garante integridade e consultas eficientes.

A constraint `UNIQUE([id_ciclo, ordem])` é crítica: garante que não existam duas sessões na mesma posição da fila para o mesmo ciclo. O índice `idx_ciclo_disciplina_ordem` acelera a consulta mais comum: "me dê as sessões do ciclo X ordenadas por posição".

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_ciclo_disciplina` | `BIGINT` PK | Identificador único de cada entrada na fila. `BIGINT` porque pode haver muitas sessões acumuladas ao longo do tempo. |
| `id_ciclo` | `BIGINT` FK | A qual ciclo esta sessão pertence. `onDelete: Cascade` — ciclo deletado, todas as sessões deletadas. |
| `id_disciplina` | `INT` FK | Qual disciplina será estudada nesta sessão. `onDelete: NoAction` — não queremos perder o histórico do ciclo se uma disciplina for removida. |
| `ordem` | `INT` | Posição desta sessão na fila (1, 2, 3...). É o que determina a ordem de execução. |
| `horas_planejadas` | `DECIMAL(4,2)` | Duração planejada em horas. Atualmente sempre 1.00 (60 minutos). `DECIMAL` deixa aberto para sessões de duração variável no futuro. |

---

#### Tabela: `ciclo_execucao`

Guarda **onde o usuário está na fila** em um dado momento. É o "marcador de página" do ciclo.

**Por que não está em `ciclo_estudo`?** Separação de responsabilidades. `ciclo_estudo` é a definição estática do ciclo (o que foi planejado). `ciclo_execucao` é o estado dinâmico (onde está a execução agora). Essa separação facilita, por exemplo, resetar a posição sem alterar a definição do ciclo, ou auditar o histórico de execução independentemente.

Relacionamento 1:1 com `ciclo_estudo` via `@unique` em `id_ciclo`. Todo ciclo tem exatamente um estado de execução.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_execucao` | `BIGINT` PK | Identificador. |
| `id_ciclo` | `BIGINT` UNIQUE FK | A qual ciclo esta execução pertence. `onDelete: Cascade`. |
| `posicao_atual` | `INT` | Índice da próxima sessão a ser executada. Começa em 1. Quando chega ao final da fila, volta para 1 (ciclo reinicia). |
| `data_ultima_execucao` | `TIMESTAMPTZ` | Quando foi a última vez que o usuário avançou na fila. Permite calcular dias sem estudar, enviar notificações, etc. |

---

#### Tabela: `disciplina_nivel_usuario`

Armazena o **nível de dificuldade que o usuário tem em cada disciplina** — a avaliação pessoal de "o quanto eu sei dessa matéria".

**Por que existe separado do ciclo?** Porque o nível de uma disciplina pertence ao usuário, não ao ciclo. Se o usuário recriar o ciclo, o nível que ele informou antes deve ser preservado e reutilizado. Também é a tabela que será atualizada futuramente pelo sistema adaptativo — quando os dados de desempenho indicarem que o usuário melhorou em uma matéria, `nivel` será atualizado automaticamente aqui.

A constraint `UNIQUE([id_usuario, id_disciplina])` garante que um usuário tem no máximo um nível por disciplina — e o `upsert` da aplicação atualiza esse nível quando o ciclo é recriado.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_nivel` | `BIGINT` PK | Identificador. |
| `id_usuario` | `BIGINT` FK | De qual usuário é esta avaliação. `onDelete: Cascade`. |
| `id_disciplina` | `INT` FK | Qual disciplina foi avaliada. `onDelete: Cascade`. |
| `nivel` | `VARCHAR(10)` | `BAIXO`, `MEDIO` ou `ALTO`. Mapeado do input do usuário (`Baixo`, `Médio`, `Alto`) para uppercase no banco. |
| `data_atualizacao` | `TIMESTAMPTZ` | Quando o nível foi definido ou atualizado pela última vez. Útil para saber se o nível está desatualizado. |

---

#### Tabela: `disciplina_progresso`

Agrega o **progresso geral do usuário em uma disciplina**, calculado a partir dos tópicos concluídos.

**Por que existe e não é calculado on-the-fly?** Porque calcular `topicos_concluidos / COUNT(topicos)` toda vez que o dashboard é carregado exigiria um `COUNT` sobre `topico_progresso` — uma operação cara para usuários com muito progresso. Esta tabela é uma **materialização** desse cálculo, atualizada incrementalmente pela aplicação a cada conclusão de tópico.

**Decisão de design:** `total_topicos` foi removido desta tabela. Anteriormente era armazenado aqui, mas isso criava risco de desatualização caso tópicos fossem adicionados ou removidos do catálogo. O `percentual` passou a ser calculado e atualizado pela aplicação no momento da escrita, usando `COUNT` sobre a tabela `topico` para garantir sempre o total correto. Isso troca um risco de inconsistência silenciosa por uma responsabilidade explícita da camada de serviço.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_disciplina_progresso` | `BIGINT` PK | Identificador. |
| `id_usuario` | `BIGINT` FK | De qual usuário é este progresso. |
| `id_disciplina` | `INT` FK | De qual disciplina. |
| `topicos_concluidos` | `INT` | Quantos tópicos o usuário já concluiu. Incrementado a cada conclusão de tópico. |
| `percentual` | `DECIMAL(5,2)` | Percentual calculado pela aplicação: `(topicos_concluidos / COUNT(topicos)) * 100`. Atualizado junto com `topicos_concluidos`. |
| `concluida` | `BOOLEAN` | Flag de conclusão total da disciplina. Permite queries rápidas de "disciplinas 100% concluídas" sem calcular percentual. |

---

#### Tabela: `topico_progresso`

Rastreia se o usuário **concluiu cada tópico específico**. É o nível mais granular de progresso.

**Por que `UNIQUE([id_usuario, id_topico])`?** Porque um usuário pode concluir um tópico apenas uma vez — não faz sentido ter dois registros do mesmo usuário para o mesmo tópico. Isso também permite o `upsert` eficiente na aplicação.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_topico_progresso` | `BIGINT` PK | Identificador. |
| `id_usuario` | `BIGINT` FK | De qual usuário. `onDelete: Cascade`. |
| `id_topico` | `BIGINT` FK | Qual tópico foi concluído. `onDelete: Cascade` — tópico removido, progresso removido. |
| `concluido` | `BOOLEAN` | Se o tópico foi marcado como concluído. Default `false` — permite criar o registro antes da conclusão. |
| `data_conclusao` | `TIMESTAMPTZ` | Quando foi concluído. Nullable enquanto não concluído. Útil para calcular velocidade de estudo. |

---

#### Tabela: `sessao_estudo`

Registra cada **sessão de estudo em tempo real** — quando o usuário abre um tópico para estudar, inicia um cronômetro, pode pausar e retomar.

**Por que existe?** É a fonte primária de dados de desempenho bruto. No futuro, será a tabela consultada para alimentar o `desempenho` no cálculo do score adaptativo. Quanto tempo o usuário passou em cada disciplina, com qual frequência, com qual status ao finalizar — tudo isso está aqui.

O índice `idx_sessao_estudo_status` é especialmente importante para a funcionalidade de "retomar sessão pausada" — a query busca sessões com `status = 'PAUSADO'` para um usuário específico. O índice `idx_sessao_estudo_ciclo_disciplina` acelera a consulta de todas as sessões executadas a partir de uma posição específica da fila.

| Coluna | Tipo | Por que existe |
|--------|------|---------------|
| `id_sessao` | `BIGINT` PK | Identificador único da sessão de estudo. |
| `id_usuario` | `BIGINT` FK | De qual usuário. `onDelete: Cascade`. |
| `id_disciplina` | `INT` FK | Qual disciplina está sendo estudada. Desnormalização intencional — permite queries por disciplina sem JOIN com tópico. |
| `id_topico` | `BIGINT` FK | Qual tópico específico está sendo estudado. |
| `id_ciclo_disciplina` | `BIGINT` FK nullable | Qual posição da fila do ciclo originou esta sessão. Nullable porque sessões podem ocorrer fora do ciclo. `onDelete: SetNull` — se a posição da fila for removida, a sessão é preservada com referência nula. Este campo é o elo entre "o que foi planejado no ciclo" e "o que foi efetivamente executado", fundamental para o ciclo adaptativo futuro. |
| `inicio` | `TIMESTAMPTZ` | Quando a sessão começou. Default `now()`. |
| `fim` | `TIMESTAMPTZ` | Quando a sessão terminou. Nullable enquanto em andamento. |
| `duracao_minutos` | `INT` | Duração total em minutos (descontando pausas). Calculado pela aplicação ao finalizar. Armazenado para evitar recalcular em queries analíticas. |
| `status` | `VARCHAR(20)` | `ATIVO`, `PAUSADO`, `CONCLUIDO`, `CANCELADO`. Controla o estado da sessão em tempo real. |

---

### Mapa de relacionamentos

```
orgao ──────────────────────── concurso
                                   │
banca ──────────────────────── edital
                                   │
                                cargo ──────────────────── plano_estudo ──── usuario
                                   │                             │
                              disciplina                    ciclo_estudo
                              │   │   │                          │
                          topico  │   └─── ciclo_disciplina ─────┘
                              │   │              │
                    topico_progresso  disciplina_nivel_usuario
                              │                 │
                    disciplina_progresso    sessao_estudo ◄── (id_ciclo_disciplina nullable)
```

A seta `sessao_estudo ◄── ciclo_disciplina` representa a ligação entre execução real e planejamento: quando o usuário executa uma sessão a partir da Minha Mesa, o `id_ciclo_disciplina` registra de qual posição da fila aquela sessão se originou.

#### Decisões de `onDelete` e por que importam

| Relacionamento | Comportamento | Justificativa |
|---------------|--------------|---------------|
| `concurso` → `edital` | CASCADE | Edital não tem sentido sem o concurso pai |
| `edital` → `cargo` | CASCADE | Cargo não tem sentido sem o edital — campo agora NOT NULL |
| `cargo` → `disciplina` | CASCADE | Disciplina não tem sentido sem o cargo |
| `disciplina` → `topico` | CASCADE | Tópico não tem sentido sem a disciplina |
| `usuario` → tudo em planejamento | CASCADE | Dados pessoais do usuário não têm sentido sem o usuário |
| `cargo` → `plano_estudo` | NO ACTION | Histórico de estudo do usuário deve ser preservado mesmo se o cargo for removido do sistema |
| `disciplina` → `ciclo_disciplina` | NO ACTION | A fila do ciclo deve ser preservada mesmo se os dados do edital forem atualizados |
| `ciclo_disciplina` → `sessao_estudo` | SET NULL | Sessão executada não deve ser perdida se a posição da fila for removida — apenas perde a referência |
| `banca` → `edital` | NO ACTION | Remover uma banca não deve apagar editais históricos |
| `orgao` → `concurso` | NO ACTION | Idem para órgãos |

A regra geral: CASCADE onde o filho é semanticamente dependente do pai. NO ACTION onde o filho tem valor histórico independente. SET NULL onde o filho tem valor próprio mas a referência ao pai é opcional.

---

### Sobre desempenho adaptativo e dados externos

O produto não possui banco de questões interno. O ciclo adaptativo futuro depende de dados de desempenho do candidato que virão de fontes externas (ex: QConcursos, Gran, Estratégia).

A estratégia recomendada quando chegar esse momento é criar uma tabela `desempenho_importado`:

```
desempenho_importado
├── id_usuario       → usuario
├── id_disciplina    → disciplina
├── fonte            (VARCHAR: 'QCONCURSOS', 'GRAN', etc.)
├── total_questoes   (INT)
├── acertos          (INT)
├── percentual_acerto (DECIMAL) — calculado pela aplicação
└── data_referencia  (DATE)
```

Esse registro seria criado/atualizado pelo usuário ao importar seus resultados, e o valor `percentual_acerto` alimentaria diretamente o parâmetro `desempenho` na função `calcularScore()`, tornando o ciclo adaptativo sem depender de questões internas.
