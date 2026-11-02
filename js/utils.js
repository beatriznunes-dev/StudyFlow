// Funções auxiliares usadas em vários módulos.

/** Retorna o primeiro elemento que corresponde ao seletor. */
export const qs = (selector, scope = document) => scope.querySelector(selector);

/** Retorna todos os elementos que correspondem ao seletor, como array. */
export const qsAll = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/** Gera um ID curto e único, com prefixo (ex.: "m-lq3k9x2a"). */
export function createId(prefix) {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${time}${random}`;
}

/** Formata horas decimais: 6 → "6h", 1.5 → "1h30", 0.5 → "30min". */
export function formatHours(hours) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) return `${minutes}min`;
  return minutes ? `${whole}h${String(minutes).padStart(2, '0')}` : `${whole}h`;
}

/** Converte número para texto com vírgula decimal: 1.5 → "1,5". */
export const formatDecimal = (value) => String(value).replace('.', ',');

/** Lê um número digitado com vírgula ou ponto. Retorna NaN se for inválido ou vazio. */
export function parseDecimal(text) {
  const normalized = text.trim().replace(',', '.');
  return normalized === '' ? NaN : Number(normalized);
}

/** Monta "1 tarefa" / "3 tarefas". */
export const pluralize = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

/** Fecha a janela ao clicar no fundo escuro (fora do conteúdo). */
export function closeOnBackdropClick(dialog) {
  // Só fecha se o clique começou e terminou no fundo, para não fechar
  // quando o usuário seleciona texto num campo e solta o mouse fora.
  let pressedOnBackdrop = false;
  dialog.addEventListener('pointerdown', (event) => {
    pressedOnBackdrop = event.target === dialog;
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && pressedOnBackdrop) dialog.close();
  });
}

/**
 * Abre a janela de confirmação e resolve com true se o usuário confirmar.
 * Fechar com Esc, Cancelar ou clique no fundo conta como "não".
 */
export function confirmAction({ title, message, confirmLabel = 'Excluir' }) {
  const dialog = qs('#confirm-dialog');
  qs('#confirm-title').textContent = title;
  qs('#confirm-message').textContent = message;
  qs('#confirm-button').textContent = confirmLabel;

  dialog.returnValue = '';
  dialog.showModal();

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
  });
}
