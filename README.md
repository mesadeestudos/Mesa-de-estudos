# 📚 Mesa de Estudos Inteligente

> Dashboard de alta performance para organização de estudos e controle de horas líquidas.

---

## 📌 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Estrutura de Pastas e Arquivos](#estrutura-de-pastas-e-arquivos)
- [Explicação das Telas](#explicação-das-telas)
- [Como o Tempo é Calculado](#como-o-tempo-é-calculado)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Como Utilizar o Projeto](#como-abrir-o-projeto)

---

## 🚀 Sobre o Projeto

A **Mesa de Estudos Inteligente** foi criada para transformar a rotina do estudante.

Diferente de cronogramas estáticos, o projeto oferece um dashboard interativo que monitora o progresso real através de:

- **Horas Líquidas** — Cronômetro com pausa sem reset.
- **Ciclos Dinâmicos** — Cálculo baseado no peso das matérias.
- **Edital Vertical** — Checklist granular.
- **Modo Foco** — Interface minimalista.

---

## 📂 Estrutura de Pastas e Arquivos

```text
Mesa-Estudos/
├── home.html
├── cadastro.html
├── assinatura.html
├── dashboard.html
├── estudar.html
├── config-ciclo.html
├── edital.html
├── edital-detalhes.html
├── blog.html
└── contador.js
```

---

## 🖥️ Explicação das Telas

### 🔵 Fluxo de Entrada

1. **Home** — Apresentação do produto  
2. **Cadastro** — Criação de conta  
3. **Assinatura** — Escolha de plano  

### 🟠 Gestão e Ciclo

- **Configuração de Ciclo** — Definição de pesos  
- **Edital** — Controle de progresso  

### 🟢 Execução

- **Dashboard** — Cronômetro e matérias do dia  
- **Modo Estudar** — Interface limpa e escura  

---

## ⚙️ Como o Tempo é Calculado

O sistema utiliza o arquivo `contador.js` para:

- Controlar segundos
- Permitir pausa inteligente
- Salvar dados no `localStorage`
- Converter para formato `00h 00m 00s`

---

## 🛠️ Tecnologias Utilizadas

| Item | Tecnologia |
|------|------------|
| Estilo | Tailwind CSS |
| Lógica | JavaScript ES6 |
| Dados | LocalStorage |

---

## 🚀 Como Utilizar o Projeto

🗺️ Fluxograma de Navegação: Mesa de Estudos

**Etapa 1: Acesso e Fidelização**

    Login / Cadastro: O usuário entra no ecossistema. Se for novo, o sistema o guia para o cadastro.

    Página de Plano (assinatura.html): O usuário visualiza os benefícios (Ciclo IA, Editais Ilimitados) e ativa sua assinatura. Isso desbloqueia o acesso ao Dashboard.

**Etapa 2: Planejamento (O Cérebro)**

    Gestão de Editais (edital.html): * O usuário importa o conteúdo programático via JSON.

        Ação Crítica: Define a Especialidade (ex: Técnico, Analista) e os Pesos (importância) de cada matéria.

        O "Pulo do Gato": Ao clicar em Sincronizar, o sistema calcula a carga horária ideal e envia para o Dashboard.

**Etapa 3: Execução Diária (O Coração)**

    Dashboard (dashboard.html): * O sistema lê os dados sincronizados e apresenta o Gráfico de Distribuição.

        O card "Próxima Meta" brilha, indicando qual matéria deve ser estudada agora para manter o equilíbrio.

    Modo Foco (estudar.html):

        O usuário entra em uma tela minimalista (sem distrações).

        Inicia o cronômetro. Ao terminar, o tempo é computado automaticamente.

**Etapa 4: Análise e Gamificação (O Sucesso)**

    Relatórios (metricas.html):

        O usuário vê o gráfico de Horas por Dia (consistência).

        Analisa a Disciplina Líder e identifica onde precisa se dedicar mais.

    Conquistas:

        O sistema libera badges (medalhas) por metas batidas (ex: "Maratonista: 5h de estudo seguidas"), mantendo o usuário motivado.

---

Feito com foco em performance e aprovação. 🚀

# Documentação do Banco de Dados

## Visão Geral
A plataforma tem como objetivo gerar automaticamente planos de estudo para concursos, considerando cargo, edital, disciplinas, tópicos e tempo disponível de estudo do usuário. O banco foi estruturado em três domínios principais (schemas): `auth`, `concurso` e `planejamento`.

---

## 1. Schema `auth` - Identidade e Autenticação
### 1.1 Tabela: `usuario`
- Função: Representa o usuário da plataforma.
- Exemplo de negócio: João Silva cria um perfil com foto e email.

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| id_usuario | BIGINT | PK | 1 |
| nome_completo | VARCHAR(150) | Nome completo do usuário | João Silva |
| nome_usuario | VARCHAR(30) | Nome de usuário único | joaosilva |
| email | VARCHAR(150) | Email único | joao@email.com |
| foto_url | TEXT | Foto de perfil | https://.../foto.jpg |
| ativo | BOOLEAN | Usuário ativo ou não | TRUE |
| primeiro_acesso | BOOLEAN | Indica onboarding concluído | TRUE |
| data_criacao | TIMESTAMP | Registro de criação | 2026-03-28 08:30 |
| email_verificado | BOOLEAN | Verifica se email foi verificado | FALSE |
| email_verificacao_token | TEXT | Registra token verificacao email | abc123 |
| email_verificacao_expira_em | TIMESTAMP | Registra tempo expiracao do token | 2026-03-28 10:15 |



### 1.2 Tabela: `credencial`
- Função: Gerencia senha, redefinição e segurança.

| Campo | Tipo | Exemplo |
|-------|------|---------|
| id_credencial | BIGINT | 1 |
| id_usuario | BIGINT | 1 |
| senha_hash | TEXT | hash123... |
| ultimo_login | TIMESTAMP | 2026-03-28 09:15 |
| reset_token | TEXT | abc123 |
| reset_token_expira_em | TIMESTAMP | 2026-03-28 10:15 |

### 1.3 Tabela: `sessao`
- Função: Controle de login, sessão e auditabilidade.

| Campo | Tipo | Exemplo |
|-------|------|---------|
| id_sessao | BIGINT | 1 |
| id_usuario | BIGINT | 1 |
| refresh_token | TEXT | token123 |
| user_agent | TEXT | Chrome Android |
| ip_address | TEXT | 192.168.0.10 |
| expira_em | TIMESTAMP | 2026-03-28 12:00 |
| revogado | BOOLEAN | FALSE |
| data_criacao | TIMESTAMP | 2026-03-28 08:30 |

---

## 2. Schema `concurso` - Estrutura de Concursos
### 2.1 Tabela: `orgao`
- Representa órgãos que realizam concursos, ex.: SEFAZ-CE.

### 2.2 Tabela: `banca`
- Representa a banca organizadora, ex.: FGV.

### 2.3 Tabela: `concurso`
- Representa concursos específicos, vinculados a um órgão.
- Ex.: Concurso SEFAZ-CE 2026.

### 2.4 Tabela: `edital`
- Representa editais específicos de um concurso.
- Ex.: SEFAZ-CE 2024 e SEFAZ-CE 2025.

### 2.5 Tabela: `cargo`
- Representa cargos dentro de um edital.
- Ex.: Auditor Fiscal, Analista Administrativo.

### 2.6 Tabela: `disciplina`
- Representa disciplinas de cada cargo, com peso e quantidade de questões.
- Ex.: Português (peso 1.5), Contabilidade (peso 2.0).

### 2.7 Tabela: `topico`
- Representa tópicos de cada disciplina.
- Controle granular do progresso do usuário.
- Ex.: Verbos (Português), ICMS (Direito Tributário).

---

## 3. Schema `planejamento` - Ciclos e Progresso
### 3.1 Tabela: `plano_estudo`
- Representa o plano inicial do usuário, incluindo cargo e horas diárias.
- Ex.: João estuda 2h/dia para Auditor Fiscal SEFAZ-CE.

### 3.2 Tabela: `ciclo_estudo`
- Ciclo automático baseado no plano de estudo.
- Ex.: Ciclo com 4 disciplinas para João.

### 3.3 Tabela: `ciclo_disciplina`
- Define quais disciplinas entram no ciclo e quanto tempo dedicar.
- Ex.: Português (1h), Direito Tributário (0.5h).

### 3.4 Tabela: `ciclo_execucao`
- Controla posição atual do usuário dentro do ciclo.
- Ex.: João terminou Português → `posicao_atual = 2`.

### 3.5 Tabela: `topico_progresso`
- Marca quais tópicos foram concluídos.
- Ex.: João concluiu Verbos → `concluido = TRUE`.

### 3.6 Tabela: `disciplina_progresso`
- Agrega progresso de uma disciplina a partir dos tópicos concluídos.
- Ex.: João concluiu 2 de 4 tópicos → percentual = 50%.

### 3.7 Tabela: `sessao_estudo`
- Controle de estudo em tempo real, permitindo pausar e retomar tópicos.
- Ex.: João estuda ICMS 30 min → `status = PAUSADO`.

---

## 4. Relacionamentos Principais
- `usuario` → `plano_estudo`: 1:N
- `plano_estudo` → `ciclo_estudo`: 1:N
- `ciclo_estudo` → `ciclo_disciplina`: 1:N
- `disciplina` → `topico`: 1:N
- `usuario` → `topico_progresso`: 1:N
- `usuario` → `disciplina_progresso`: 1:N
- `usuario` → `sessao_estudo`: 1:N

---

## 5. Diagramas Visuais (Markdown + PlantUML)

### 5.1 Diagrama ER (PlantUML)
![Diagrama UML](https://img.plantuml.biz/plantuml/svg/XLLDR-GW3BrNcl-0Ubnb_a2FbQggbpsizevSy4oycuIKZwghjlzz8K064gOzvXdydks78y72CnXaj-1iVylU3pUCuMJ9_cFEED2a8iRO3v8yGtVi_kdnwUVl63aUsQH6v4ADyu1MTGn7eA6BQBhJCOjwL8Q3GBBOiPEoYZljZu6bLn-VDOr8MeKJndX0Ud5SQ081EIT_HKqd4Y1tY3_4hVgBKok0RpDfu3W6nPz5aKAZn4aG36MT1RehrU3K0-_1z1tJQD1crkBZEf_nfK7LquJiU3IUVCO-PtS6DOUpJzCncZb8wQDcJPydy_5nFAhtegn6C38URlp5murS7I3K99msgdQ1qkTQRmJkcDVwyFZmgx90nmoT1zWM_GoJW3971AeSrL2Iacea6TipPr7RD2Z9rdDDI3D59kXO5hYJ1VfSQrg0PhR8jCqWoGYQ1vggRXHeMrcWyUy3WxWNA_cBGsCLccrwgsOIbSA4xCnLiQvfrXuderoAI8tBxWg2bWjB0n9Q9ooAIl6e9SIYXNAoH1e2qHSRzerDvm4c_0EZhtbZrH3nJzrO9wicb3UQhLXNrANPezzZOSVqIeFXizA-Ntj3a1XQX0lUP2gbf0L74mdA7oSQqpviSxKDj8krg9T3NJtvpez2uhYM6TL9s3ahLVg6mebw7QpO5vopCXIsC5YtVnFH5dpMwXmsMiE-HUoxwSKBtMAgmP5S_oBBjzdlY4ilsWgQyUzKb0ssofiuwJ9TgjRmLQ093riBByVtvY9yvxMuj1jck_R_-49JqQZiliLuqkdbRpdIv6nGPgmVsSKCrGFBpxTu0yjAADz4TQRU3zVFPKU5Ksb_LHlaCeZsdccDxEfVS5N--Hy0)

### 5.2 Fluxo do Ciclo de Estudos
1. Usuário cria plano de estudo (`plano_estudo`) com cargo e horas/dia.
2. Sistema gera ciclo (`ciclo_estudo`) baseado no plano.
3. Ciclo define disciplinas (`ciclo_disciplina`) e horas dedicadas.
4. Usuário estuda tópicos em qualquer ordem (`sessao_estudo`).
5. Conclusão de tópicos atualiza progresso (`topico_progresso` e `disciplina_progresso`).
6. Ciclo automático atualiza posição (`ciclo_execucao`).

---

## 6. Exemplos de Uso Negocial
- João Silva quer estudar para SEFAZ-CE: cria plano com 2h/dia.
- Ciclo flexível escolhe 4 disciplinas de maior peso.
- João estuda tópico “Verbos” por 30 minutos → `sessao_estudo` registra duração.
- João conclui tópico → `topico_progresso.concluido = TRUE`.
- Sistema recalcula `disciplina_progresso.percentual` automaticamente.
- Quando todas as disciplinas do ciclo são concluídas, ciclo finaliza e novo ciclo é gerado.
