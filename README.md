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
