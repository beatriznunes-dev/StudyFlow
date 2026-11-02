# StudyFlow

Organizador de cronograma de estudos feito com HTML, CSS e JavaScript puros, sem frameworks nem bibliotecas externas.

## Funcionalidades

- [x] Estrutura visual e navegação responsiva
- [x] Cadastro de matérias
- [ ] Lista de tarefas
- [x] Cronograma semanal
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
  components.css    Cabeçalhos, cards, estados vazios, botões, janelas e campos
  sections.css      Estilos específicos de cada seção
js/
  main.js           Ponto de entrada e navegação entre seções
  state.js          Dados em memória; toda alteração é salva e avisa as telas
  storage.js        Leitura e gravação no localStorage
  subjects.js       Cadastro de matérias
  schedule.js       Cronograma semanal
  utils.js          Funções auxiliares
```
