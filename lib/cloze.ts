// Tarjetas de "concepto con hueco" (cloze deletion): el usuario escribe una
// frase y marca la(s) palabra(s) a ocultar envolviéndolas en doble corchete,
// ej: "La mitosis tiene [[4]] fases y produce células [[genéticamente
// idénticas]]." Puede haber uno o varios huecos en el mismo texto.

const CLOZE_PATTERN = /\[\[([^\]]+)\]\]/g;

// Marcador que reemplaza cada hueco dentro del texto guardado en `front`.
export const CLOZE_BLANK = "{{}}";

export function parseCloze(raw: string): { front: string; answers: string[] } | null {
  const answers: string[] = [];
  const front = raw.replace(CLOZE_PATTERN, (_match, word: string) => {
    const trimmed = word.trim();
    if (trimmed) answers.push(trimmed);
    return CLOZE_BLANK;
  });
  return answers.length > 0 ? { front, answers } : null;
}

// Inversa de parseCloze: reconstruye la sintaxis [[...]] a partir del texto
// guardado y las respuestas, para poder volver a editar una tarjeta existente.
export function renderClozeSource(front: string, answers: string[]): string {
  let i = 0;
  return front.split(CLOZE_BLANK).reduce((acc, segment, idx, arr) => {
    if (idx === arr.length - 1) return acc + segment;
    const answer = answers[i] ?? "";
    i += 1;
    return acc + segment + `[[${answer}]]`;
  }, "");
}

export function splitClozeFront(front: string): string[] {
  return front.split(CLOZE_BLANK);
}
