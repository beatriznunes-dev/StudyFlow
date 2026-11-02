// Dados do app em memória. Toda alteração passa por aqui:
// os dados são salvos e as telas inscritas são avisadas.

import { loadData, saveData } from './storage.js';
import { createId } from './utils.js';

const state = {
  subjects: [], // { id, name, color, weeklyGoalHours }
  tasks: [],    // preenchido na etapa de tarefas
  schedule: [], // { id, subjectId, day (0 = segunda … 6 = domingo), start, end } — horários "HH:MM"
};

const listeners = new Set();

/** Carrega os dados salvos, ignorando o que não estiver no formato esperado. */
export function initState() {
  const saved = loadData();
  if (!saved || typeof saved !== 'object') return;

  for (const key of Object.keys(state)) {
    if (Array.isArray(saved[key])) state[key] = saved[key];
  }
}

/** Registra uma função chamada sempre que os dados mudarem. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit() {
  saveData(state);
  listeners.forEach((listener) => listener(state));
}

/* ---------- Matérias ---------- */

export const getSubjects = () => state.subjects;

export const getSubject = (id) => state.subjects.find((subject) => subject.id === id);

export function addSubject({ name, color, weeklyGoalHours }) {
  const subject = { id: createId('m'), name, color, weeklyGoalHours };
  state.subjects.push(subject);
  commit();
  return subject;
}

export function updateSubject(id, changes) {
  const subject = getSubject(id);
  if (!subject) return;
  Object.assign(subject, changes);
  commit();
}

/** Quantas tarefas e blocos do cronograma dependem da matéria. */
export function countSubjectLinks(id) {
  return {
    tasks: state.tasks.filter((task) => task.subjectId === id).length,
    blocks: state.schedule.filter((block) => block.subjectId === id).length,
  };
}

/** Exclui a matéria junto com suas tarefas e blocos do cronograma. */
export function removeSubject(id) {
  state.subjects = state.subjects.filter((subject) => subject.id !== id);
  state.tasks = state.tasks.filter((task) => task.subjectId !== id);
  state.schedule = state.schedule.filter((block) => block.subjectId !== id);
  commit();
}

/* ---------- Cronograma ---------- */

export const getSchedule = () => state.schedule;

export const getBlock = (id) => state.schedule.find((block) => block.id === id);

export function addBlock({ subjectId, day, start, end }) {
  const block = { id: createId('b'), subjectId, day, start, end };
  state.schedule.push(block);
  commit();
  return block;
}

export function removeBlock(id) {
  state.schedule = state.schedule.filter((block) => block.id !== id);
  commit();
}
