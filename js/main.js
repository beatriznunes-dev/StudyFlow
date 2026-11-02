// Ponto de entrada do StudyFlow: carrega os dados, inicializa as seções
// e controla a navegação entre elas.

import { qs, qsAll } from './utils.js';
import { initState } from './state.js';
import { initSubjects } from './subjects.js';

const SECTIONS = ['cronograma', 'materias', 'tarefas', 'progresso'];
const DEFAULT_SECTION = SECTIONS[0];

/** Lê a seção atual a partir do endereço (ex.: #tarefas). */
function getSectionFromHash() {
  const name = location.hash.slice(1);
  return SECTIONS.includes(name) ? name : DEFAULT_SECTION;
}

/** Mostra a seção escolhida, esconde as outras e marca o link ativo. */
function showSection(name) {
  qsAll('.section').forEach((section) => {
    section.hidden = section.dataset.section !== name;
  });

  qsAll('.nav__link').forEach((link) => {
    if (link.dataset.section === name) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  const label = qs(`.nav__link[data-section="${name}"]`).textContent.trim();
  document.title = `${label} · StudyFlow`;
  window.scrollTo(0, 0);
}

function init() {
  initState();
  initSubjects();

  showSection(getSectionFromHash());
  window.addEventListener('hashchange', () => showSection(getSectionFromHash()));
}

init();
