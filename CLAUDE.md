# StudyFlow

## Contexto e objetivo

Organizador de estudos para estudantes: a pessoa cadastra suas matérias (com cor e meta semanal de horas), monta o cronograma da semana com blocos de estudo e, nas próximas etapas, acompanhará tarefas e o progresso. O progresso será calculado como **horas planejadas no cronograma comparadas com a meta semanal** de cada matéria — o app não registra horas efetivamente estudadas.

Situação atual:

| Seção | Estado |
|---|---|
| Estrutura e navegação | Pronta |
| Matérias | Pronta: criar, editar, excluir |
| Cronograma | Pronto: adicionar e excluir blocos (sem edição) |
| Tarefas | Só o estado vazio; `state.tasks` existe e já é salvo, mas nada o preenche |
| Progresso | Só o estado vazio |

### Como trabalhar neste projeto

- Uma funcionalidade por vez. Antes de alterar arquivos, apresentar o entendimento, os arquivos a criar/modificar e o plano, e **esperar aprovação**.
- Não criar funcionalidades fora do escopo pedido.
- Conversar e escrever textos da interface em português (pt-BR).

## Tecnologias

- HTML, CSS e JavaScript puros, com módulos ES (`<script type="module">`).
- `localStorage` para guardar os dados.
- **Sem** frameworks, bibliotecas externas, build, `package.json` ou testes automatizados. Não adicionar nenhum deles.
- Só tema claro. Layout responsivo (celular e computador).

## Estrutura

```
index.html          Página única: navegação, as 4 seções, <template>s e <dialog>s
README.md
css/
  variables.css     Tokens do tema: cores, fontes, espaçamentos, raios, sombras, layout
  base.css          Reset, layout do app, barra lateral e navegação (inclui a versão celular)
  components.css    Peças reutilizáveis: cabeçalho de seção, card, estado vazio, botões,
                    janelas, confirmação, campos de formulário, seletor de cor
  sections.css      Estilos específicos de cada seção (Matérias, Cronograma)
js/
  main.js           Ponto de entrada: initState(), init de cada seção e navegação por hash
  state.js          Dados em memória e todas as funções que os alteram
  storage.js        loadData() / saveData() no localStorage
  subjects.js       Seção Matérias (lista, formulário, exclusão) e paleta SUBJECT_COLORS
  schedule.js       Seção Cronograma (grade da semana, formulário de bloco, exclusão)
  utils.js          qs/qsAll, createId, formatação de horas e números, dialogs
```

Ordem de carregamento do CSS (em `index.html`): `variables` → `base` → `components` → `sections`. Regras de `sections.css` sobrescrevem as de `components.css` com a mesma especificidade.

## Arquitetura

### Fluxo de dados

1. `state.js` guarda um único objeto `{ subjects, tasks, schedule }`.
2. Toda alteração passa por uma função exportada de `state.js` (`addSubject`, `removeBlock`…), que muda o objeto e chama `commit()`.
3. `commit()` salva **o objeto inteiro** com `saveData()` na chave `studyflow` do localStorage e avisa todos os inscritos.
4. Cada seção se inscreve com `subscribe(render)` e redesenha sua lista inteira com `replaceChildren(...)`.

Os módulos de seção nunca alteram os arrays diretamente nem chamam `storage.js`.

### Modelos de dados

```js
subject = { id: 'm-…', name, color, weeklyGoalHours }  // horas decimais, 0,5 a 40, de meia em meia hora
block   = { id: 'b-…', subjectId, day, start, end }    // day: 0 = segunda … 6 = domingo; start/end: "HH:MM"
```

- IDs são gerados com `createId(prefixo)` (`m` para matérias, `b` para blocos).
- Blocos guardam só o `subjectId`; nome e cor são buscados com `getSubject()` na hora de desenhar. Por isso, editar uma matéria atualiza o cronograma automaticamente.
- `removeSubject(id)` também apaga as tarefas e os blocos da matéria. `countSubjectLinks(id)` informa quantos são, para a mensagem de confirmação.
- `initState()` só aceita do localStorage chaves cujo valor seja array; o resto é ignorado.

### Navegação

Página única. A seção vem do hash (`#cronograma`, `#materias`, `#tarefas`, `#progresso`; padrão `#cronograma`). `showSection()` em `main.js` usa o atributo `hidden` nas `.section`, marca o link com `aria-current="page"` e atualiza o título da aba. Uma seção nova precisa entrar em `SECTIONS` (main.js), na navegação e ter seu `data-section`.

## Convenções

### JavaScript

- Nomes de variáveis e funções em inglês; comentários e textos da interface em português.
- Cada seção é um módulo com `initX()` chamado por `main.js`, que guarda os elementos em `const els = {}` e registra os eventos uma única vez.
- Cards e itens repetidos são clonados de um `<template>` do `index.html` (`template.content.firstElementChild.cloneNode(true)`).
- Cliques em listas usam **delegação**: um listener na lista e `event.target.closest('[data-action]')`.
- Dados digitados pelo usuário entram no DOM só por `textContent` ou atributos — nunca por `innerHTML`.
- Cores de matéria vão para o CSS pela variável `--subject-color` (`style.setProperty`).
- Use os auxiliares de `utils.js` em vez de reescrevê-los: `qs`, `qsAll`, `createId`, `formatHours`, `formatDecimal`, `parseDecimal`, `pluralize`, `closeOnBackdropClick`, `confirmAction`.

### Formulários

- `<dialog class="dialog">` aberto com `showModal()`; botões com `data-close` fecham; `closeOnBackdropClick(dialog)` fecha pelo fundo.
- `<form novalidate>`: a validação é feita no JS, numa função `validate(data)` que retorna `{ campo: 'mensagem' }`.
- Cada erro aparece no `<p class="field__error" data-error-for="campo">` e marca o campo com `aria-invalid`. O erro some quando o campo é editado e o foco vai para o primeiro campo inválido.
- `<select>` com opção inicial "Selecione…" usa `disabled` + `defaultSelected`; sem o `defaultSelected`, o navegador escolhe sozinho a primeira opção válida.
- Exclusões sempre pedem confirmação com `await confirmAction({ title, message })`, que reutiliza o `#confirm-dialog`. O `closeOnBackdropClick` desse dialog já é registrado em `subjects.js`; não registrar de novo.

### CSS

- Classes no padrão BEM: `bloco`, `bloco__elemento`, `bloco--modificador` (ex.: `subject-card__name`, `btn--primary`).
- Toda cor, espaçamento, fonte, raio e sombra vem de variáveis de `variables.css` (`--color-*`, `--space-*`, `--fs-*`, `--radius-*`, `--shadow-*`). Não usar valores soltos quando existe variável.
- Cada seção tem a cor de destaque `--accent`, definida por `[data-section]` em `base.css`.
- Responsivo: o breakpoint principal é `max-width: 768px` (barra lateral vira barra superior e a navegação fica fixa embaixo). O cronograma mostra os 7 dias lado a lado só a partir de `min-width: 1200px`.
- A paleta `SUBJECT_COLORS` (`subjects.js`) só tem cores legíveis com texto branco; cores novas precisam manter isso.

### Acessibilidade

- Botões só com ícone têm `aria-label` (ex.: "Excluir bloco de JavaScript, Segunda-feira, 19:00–20:30").
- Ícones SVG decorativos usam `aria-hidden="true"`; textos só para leitores de tela usam `.visually-hidden`.
- Mensagens de erro têm `aria-live="polite"`. Animações respeitam `prefers-reduced-motion` (em `base.css`).

### Regras do cronograma

- Horários `"HH:MM"` são comparados como texto (`start < end`), o que funciona porque o formato é fixo com dois dígitos.
- O término deve ser depois do início; um bloco não atravessa a meia-noite.
- Blocos não podem se sobrepor no mesmo dia. Encostar é permitido (20:30 logo após um bloco que termina às 20:30).
- Qualquer minuto é aceito (sem intervalos fixos).

## Comandos úteis

**Rodar o app.** Os módulos ES não carregam com o `index.html` aberto direto do disco. No VS Code, use a extensão **Live Server**: botão direito no `index.html` → **Open with Live Server**.

**Verificar a sintaxe de todos os módulos JS** (PowerShell, precisa do Node instalado na máquina; o Node não é dependência do projeto):

```powershell
Get-ChildItem js\*.js | ForEach-Object { Get-Content $_.FullName -Raw -Encoding UTF8 | node --input-type=module --check; if ($LASTEXITCODE -eq 0) { "ok $($_.Name)" } else { "ERRO em $($_.Name)" } }
```

Não use `node --check js\arquivo.js` direto: nos arquivos com `import`, ele não acusa erros de sintaxe.

**Apagar os dados salvos** (console do navegador, com o app aberto):

```js
localStorage.removeItem('studyflow'); location.reload();
```

## Como preservar o que já funciona

- **Não mudar o formato dos dados salvos** (nomes de campos, `day` de 0 a 6, horários `"HH:MM"`, chave `studyflow`) sem necessidade. Dados já gravados no navegador de quem usa o app dependem dele. Campo novo deve ter um valor padrão para registros antigos.
- **Manter a exclusão em cascata**: qualquer dado novo ligado a uma matéria precisa ser removido em `removeSubject()` e contado em `countSubjectLinks()`.
- Alterar dados só por funções de `state.js`, para que tudo continue sendo salvo e todas as telas se atualizem.
- Ao mexer em componentes compartilhados (`components.css`, `utils.js`, `#confirm-dialog`, `.field`, `.btn`, `.dialog`), lembrar que Matérias e Cronograma usam os mesmos. Prefira adicionar um modificador a mudar a regra base.
- Não remover os IDs e atributos `data-*` usados pelo JS (`data-section`, `data-action`, `data-close`, `data-error-for`, IDs dos templates e dialogs).
- Depois de uma alteração, conferir no navegador:
  1. Sem matérias: Cronograma e Matérias mostram o estado vazio.
  2. Criar, editar e excluir matéria; a confirmação informa os blocos ligados.
  3. Adicionar bloco (ex.: JavaScript, segunda, 19:00–20:30); sobreposição no mesmo dia é recusada; excluir bloco.
  4. Recarregar a página e ver que tudo continua salvo.
  5. Layout em celular (~390px), tablet (~900px) e computador (≥1200px).
  6. Console do navegador sem erros.
- Atualizar o `README.md` (lista de funcionalidades e estrutura) e este arquivo quando a arquitetura mudar.
