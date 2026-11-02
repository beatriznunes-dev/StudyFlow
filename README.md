# StudyFlow

Organizador de cronograma de estudos feito com HTML, CSS e JavaScript puros, sem frameworks nem bibliotecas externas.

## Funcionalidades

- [x] Estrutura visual e navegação responsiva
- [ ] Cadastro de matérias
- [ ] Lista de tarefas
- [ ] Cronograma semanal
- [ ] Painel de progresso (horas planejadas comparadas com a meta semanal)

## Como rodar

O projeto usa módulos JavaScript (`type="module"`), que o navegador não carrega quando o `index.html` é aberto direto do disco. Use um servidor local:

- **VS Code:** instale a extensão **Live Server**, clique com o botão direito no `index.html` e escolha **Open with Live Server**.

## Estrutura

```
index.html          Página única com a navegação e as seções
css/
  variables.css     Cores, fontes, espaçamentos e sombras
  base.css          Reset, layout e navegação
  components.css    Cabeçalhos, cards, estados vazios e botões
js/
  main.js           Ponto de entrada e navegação entre seções
  utils.js          Funções auxiliares
```
