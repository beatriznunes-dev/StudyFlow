// Cadastro de matérias: lista, formulário (criar/editar) e exclusão.

import {
  getSubjects,
  getSubject,
  addSubject,
  updateSubject,
  removeSubject,
  countSubjectLinks,
  subscribe,
} from './state.js';
import {
  qs,
  qsAll,
  formatHours,
  formatDecimal,
  parseDecimal,
  pluralize,
  closeOnBackdropClick,
  confirmAction,
} from './utils.js';

/** Paleta fixa: todas as cores ficam legíveis com texto branco. */
export const SUBJECT_COLORS = [
  { name: 'Azul', value: '#3b5bdb' },
  { name: 'Roxo', value: '#7048e8' },
  { name: 'Violeta', value: '#ae3ec9' },
  { name: 'Rosa', value: '#d6336c' },
  { name: 'Vermelho', value: '#e03131' },
  { name: 'Laranja', value: '#d9480f' },
  { name: 'Âmbar', value: '#b86e00' },
  { name: 'Verde', value: '#2b8a3e' },
  { name: 'Turquesa', value: '#0c8599' },
  { name: 'Celeste', value: '#1971c2' },
];

const NAME_MAX_LENGTH = 40;
const GOAL_MIN = 0.5;
const GOAL_MAX = 40;

const els = {};
let editingId = null;

export function initSubjects() {
  const section = qs('.section[data-section="materias"]');
  els.list = qs('#subject-list');
  els.summary = qs('#subject-summary');
  els.empty = qs('#subject-empty');
  els.headerAction = qs('.section-header__action', section);
  els.template = qs('#subject-card-template');
  els.dialog = qs('#subject-dialog');
  els.dialogTitle = qs('#subject-dialog-title');
  els.form = qs('#subject-form');

  renderColorOptions();

  qsAll('[data-action="new-subject"]').forEach((button) => {
    button.addEventListener('click', () => openForm());
  });
  els.list.addEventListener('click', handleListClick);
  els.form.addEventListener('submit', handleSubmit);
  els.form.addEventListener('input', (event) => setFieldError(event.target.name, ''));
  qsAll('[data-close]', els.dialog).forEach((button) => {
    button.addEventListener('click', () => els.dialog.close());
  });
  closeOnBackdropClick(els.dialog);
  closeOnBackdropClick(qs('#confirm-dialog'));

  subscribe(render);
  render();
}

/* ---------- Lista ---------- */

function render() {
  const subjects = getSubjects();
  const isEmpty = subjects.length === 0;

  els.empty.hidden = !isEmpty;
  els.list.hidden = isEmpty;
  els.summary.hidden = isEmpty;
  els.headerAction.hidden = isEmpty;

  els.list.replaceChildren(...subjects.map(createCard));

  const totalHours = subjects.reduce((sum, subject) => sum + subject.weeklyGoalHours, 0);
  els.summary.textContent =
    `${pluralize(subjects.length, 'matéria', 'matérias')} · ${formatHours(totalHours)} de meta semanal`;
}

function createCard(subject) {
  const card = els.template.content.firstElementChild.cloneNode(true);
  card.dataset.id = subject.id;
  card.style.setProperty('--subject-color', subject.color);

  qs('.subject-card__avatar', card).textContent = [...subject.name][0].toUpperCase();
  const name = qs('.subject-card__name', card);
  name.textContent = subject.name;
  name.title = subject.name;
  qs('.subject-card__goal-text', card).textContent = `${formatHours(subject.weeklyGoalHours)} por semana`;
  qs('[data-action="edit"]', card).setAttribute('aria-label', `Editar ${subject.name}`);
  qs('[data-action="delete"]', card).setAttribute('aria-label', `Excluir ${subject.name}`);

  return card;
}

function handleListClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { id } = button.closest('.subject-card').dataset;
  if (button.dataset.action === 'edit') openForm(id);
  if (button.dataset.action === 'delete') confirmDelete(id);
}

async function confirmDelete(id) {
  const subject = getSubject(id);
  const { tasks, blocks } = countSubjectLinks(id);

  const linked = [];
  if (tasks) linked.push(pluralize(tasks, 'tarefa', 'tarefas'));
  if (blocks) linked.push(pluralize(blocks, 'bloco do cronograma', 'blocos do cronograma'));

  let message = `A matéria “${subject.name}” será excluída permanentemente.`;
  if (linked.length) message += ` Também serão excluídos: ${linked.join(' e ')}.`;

  const confirmed = await confirmAction({ title: 'Excluir matéria?', message });
  if (confirmed) removeSubject(id);
}

/* ---------- Formulário ---------- */

function renderColorOptions() {
  const options = SUBJECT_COLORS.map(({ name, value }) => {
    const option = document.createElement('label');
    option.className = 'color-option';
    option.title = name;
    option.style.setProperty('--swatch', value);
    option.innerHTML = `
      <input class="color-option__input visually-hidden" type="radio" name="color" value="${value}">
      <span class="color-option__swatch" aria-hidden="true"></span>
      <span class="visually-hidden">${name}</span>
    `;
    return option;
  });
  qs('#subject-colors').replaceChildren(...options);
}

/** Primeira cor da paleta ainda não usada (ou volta ao início se todas estiverem em uso). */
function suggestColor() {
  const subjects = getSubjects();
  const used = new Set(subjects.map((subject) => subject.color));
  const free = SUBJECT_COLORS.find((color) => !used.has(color.value));
  return (free ?? SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]).value;
}

function openForm(id = null) {
  editingId = id;
  const subject = id ? getSubject(id) : null;
  const { elements } = els.form;

  els.form.reset();
  ['name', 'color', 'weeklyGoalHours'].forEach((field) => setFieldError(field, ''));

  els.dialogTitle.textContent = subject ? 'Editar matéria' : 'Nova matéria';
  elements.name.value = subject?.name ?? '';
  elements.weeklyGoalHours.value = subject ? formatDecimal(subject.weeklyGoalHours) : '';
  elements.color.value = subject?.color ?? suggestColor();
  if (!elements.color.value) elements.color[0].checked = true;

  els.dialog.showModal();
  elements.name.focus();
}

function readForm() {
  const { elements } = els.form;
  return {
    name: elements.name.value.trim().replace(/\s+/g, ' '),
    color: elements.color.value,
    weeklyGoalHours: parseDecimal(elements.weeklyGoalHours.value),
  };
}

function normalizeName(name) {
  return name.toLocaleLowerCase('pt-BR');
}

function isDuplicateName(name) {
  return getSubjects().some(
    (subject) => subject.id !== editingId && normalizeName(subject.name) === normalizeName(name),
  );
}

function validate({ name, color, weeklyGoalHours }) {
  const errors = {};

  if (!name) {
    errors.name = 'Informe o nome da matéria.';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Use no máximo ${NAME_MAX_LENGTH} caracteres.`;
  } else if (isDuplicateName(name)) {
    errors.name = 'Já existe uma matéria com esse nome.';
  }

  if (!color) errors.color = 'Escolha uma cor.';

  if (Number.isNaN(weeklyGoalHours)) {
    errors.weeklyGoalHours = 'Informe a meta em horas (ex.: 4 ou 1,5).';
  } else if (weeklyGoalHours < GOAL_MIN || weeklyGoalHours > GOAL_MAX) {
    errors.weeklyGoalHours = `A meta deve ficar entre ${formatDecimal(GOAL_MIN)} e ${GOAL_MAX} horas.`;
  } else if (!Number.isInteger(weeklyGoalHours * 2)) {
    errors.weeklyGoalHours = 'Use intervalos de meia hora (ex.: 2 ou 2,5).';
  }

  return errors;
}

function setFieldError(field, message) {
  const error = qs(`[data-error-for="${field}"]`, els.form);
  if (!error) return;
  error.textContent = message;

  const input = els.form.elements[field];
  if (input instanceof HTMLInputElement) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const data = readForm();
  const errors = validate(data);
  ['name', 'color', 'weeklyGoalHours'].forEach((field) => setFieldError(field, errors[field] ?? ''));

  const firstInvalid = Object.keys(errors)[0];
  if (firstInvalid) {
    const input = els.form.elements[firstInvalid];
    (input instanceof RadioNodeList ? input[0] : input).focus();
    return;
  }

  if (editingId) {
    updateSubject(editingId, data);
  } else {
    addSubject(data);
  }
  els.dialog.close();
}
