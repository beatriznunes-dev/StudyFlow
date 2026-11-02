// Cronograma semanal: grade de segunda a domingo, formulário de bloco e exclusão.

import {
  getSubjects,
  getSubject,
  getSchedule,
  getBlock,
  addBlock,
  removeBlock,
  subscribe,
} from './state.js';
import { qs, qsAll, closeOnBackdropClick, confirmAction } from './utils.js';

/** Dias na ordem do cronograma; o índice é o valor salvo em block.day. */
const DAYS = [
  { name: 'Segunda-feira', short: 'Segunda' },
  { name: 'Terça-feira', short: 'Terça' },
  { name: 'Quarta-feira', short: 'Quarta' },
  { name: 'Quinta-feira', short: 'Quinta' },
  { name: 'Sexta-feira', short: 'Sexta' },
  { name: 'Sábado', short: 'Sábado' },
  { name: 'Domingo', short: 'Domingo' },
];

const FIELDS = ['subjectId', 'day', 'start', 'end'];

const els = {};

export function initSchedule() {
  const section = qs('.section[data-section="cronograma"]');
  els.week = qs('#schedule-week');
  els.empty = qs('#schedule-empty');
  els.headerAction = qs('.section-header__action', section);
  els.dayTemplate = qs('#week-day-template');
  els.blockTemplate = qs('#schedule-block-template');
  els.dialog = qs('#block-dialog');
  els.form = qs('#block-form');

  renderDayOptions();

  els.headerAction.addEventListener('click', openForm);
  els.week.addEventListener('click', handleWeekClick);
  els.form.addEventListener('submit', handleSubmit);
  els.form.addEventListener('input', handleInput);
  qsAll('[data-close]', els.dialog).forEach((button) => {
    button.addEventListener('click', () => els.dialog.close());
  });
  closeOnBackdropClick(els.dialog);

  subscribe(render);
  render();
}

/* ---------- Horários ---------- */

const formatRange = (block) => `${block.start}–${block.end}`;

/** Dois intervalos se sobrepõem se um começa antes do outro terminar (encostar é permitido). */
const overlaps = (a, b) => a.start < b.end && b.start < a.end;

/* ---------- Grade ---------- */

function render() {
  // Sem matérias não há o que agendar: mostra o aviso para cadastrá-las.
  const hasSubjects = getSubjects().length > 0;
  els.empty.hidden = hasSubjects;
  els.week.hidden = !hasSubjects;
  els.headerAction.hidden = !hasSubjects;

  if (hasSubjects) els.week.replaceChildren(...DAYS.map(createDay));
}

function createDay(day, index) {
  const item = els.dayTemplate.content.firstElementChild.cloneNode(true);
  const blocks = getSchedule()
    .filter((block) => block.day === index && getSubject(block.subjectId))
    .sort((a, b) => a.start.localeCompare(b.start));

  qs('.week-day__name', item).textContent = day.short;
  qs('.week-day__blocks', item).replaceChildren(...blocks.map(createBlock));
  qs('.week-day__empty', item).hidden = blocks.length > 0;

  return item;
}

function createBlock(block) {
  const subject = getSubject(block.subjectId);
  const card = els.blockTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.id = block.id;
  card.style.setProperty('--subject-color', subject.color);

  qs('.schedule-block__subject', card).textContent = subject.name;
  qs('.schedule-block__time-text', card).textContent = formatRange(block);
  qs('[data-action="delete"]', card).setAttribute(
    'aria-label',
    `Excluir bloco de ${subject.name}, ${DAYS[block.day].name}, ${formatRange(block)}`,
  );

  return card;
}

function handleWeekClick(event) {
  const button = event.target.closest('[data-action="delete"]');
  if (!button) return;
  confirmDelete(button.closest('.schedule-block').dataset.id);
}

async function confirmDelete(id) {
  const block = getBlock(id);
  const subject = getSubject(block.subjectId);
  const day = DAYS[block.day].name.toLocaleLowerCase('pt-BR');

  const confirmed = await confirmAction({
    title: 'Excluir bloco?',
    message: `O bloco de “${subject.name}” (${day}, ${formatRange(block)}) será excluído.`,
  });
  if (confirmed) removeBlock(id);
}

/* ---------- Formulário ---------- */

function createOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

/** Opção inicial "Selecione…": marcada por padrão para o form.reset() voltar a ela. */
function createPlaceholder(label) {
  const option = createOption('', label);
  option.disabled = true;
  option.defaultSelected = true;
  return option;
}

function renderDayOptions() {
  els.form.elements.day.replaceChildren(
    createPlaceholder('Selecione o dia'),
    ...DAYS.map((day, index) => createOption(index, day.name)),
  );
}

/** As matérias mudam com o tempo, então a lista é refeita a cada abertura. */
function renderSubjectOptions() {
  els.form.elements.subjectId.replaceChildren(
    createPlaceholder('Selecione a matéria'),
    ...getSubjects().map((subject) => createOption(subject.id, subject.name)),
  );
}

function openForm() {
  renderSubjectOptions();
  els.form.reset();
  FIELDS.forEach((field) => setFieldError(field, ''));

  els.dialog.showModal();
  els.form.elements.subjectId.focus();
}

function readForm() {
  const { elements } = els.form;
  return {
    subjectId: elements.subjectId.value,
    day: elements.day.value === '' ? NaN : Number(elements.day.value),
    start: elements.start.value.slice(0, 5),
    end: elements.end.value.slice(0, 5),
  };
}

function validate(data) {
  const errors = {};

  if (!getSubject(data.subjectId)) errors.subjectId = 'Escolha uma matéria.';
  if (!DAYS[data.day]) errors.day = 'Escolha o dia da semana.';
  if (!data.start) errors.start = 'Informe o horário de início.';

  if (!data.end) {
    errors.end = 'Informe o horário de término.';
  } else if (data.start && data.end <= data.start) {
    errors.end = 'O término deve ser depois do início.';
  }

  if (!errors.day && !errors.start && !errors.end) {
    const conflict = getSchedule().find(
      (block) => block.day === data.day && getSubject(block.subjectId) && overlaps(block, data),
    );
    if (conflict) {
      const day = DAYS[data.day].name.toLocaleLowerCase('pt-BR');
      const subject = getSubject(conflict.subjectId).name;
      errors.start = `Esse horário coincide com outro bloco de ${day} (${subject}, ${formatRange(conflict)}).`;
    }
  }

  return errors;
}

function setFieldError(field, message) {
  const error = qs(`[data-error-for="${field}"]`, els.form);
  error.textContent = message;
  els.form.elements[field].setAttribute('aria-invalid', message ? 'true' : 'false');
}

function handleInput(event) {
  const { name } = event.target;
  // O aviso de conflito fica no início, mas depende do dia e dos dois horários.
  if (['day', 'start', 'end'].includes(name)) setFieldError('start', '');
  setFieldError(name, '');
}

function handleSubmit(event) {
  event.preventDefault();

  const data = readForm();
  const errors = validate(data);
  FIELDS.forEach((field) => setFieldError(field, errors[field] ?? ''));

  const firstInvalid = FIELDS.find((field) => errors[field]);
  if (firstInvalid) {
    els.form.elements[firstInvalid].focus();
    return;
  }

  addBlock(data);
  els.dialog.close();
}
