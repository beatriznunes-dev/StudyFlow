// Leitura e gravação dos dados no localStorage do navegador.

const STORAGE_KEY = 'studyflow';

/** Retorna os dados salvos, ou null se não houver nada (ou se estiverem corrompidos). */
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('StudyFlow: não foi possível ler os dados salvos.', error);
    return null;
  }
}

/** Salva todos os dados de uma vez. */
export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('StudyFlow: não foi possível salvar os dados.', error);
  }
}
