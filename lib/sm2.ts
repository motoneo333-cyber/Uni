// Algoritmo SM-2 (SuperMemo 2) para repetición espaciada.
// grade: 0-5, donde >=3 es "recordado" y <3 es "fallado".
// Referencia: https://super-memory.com/english/ol/sm2.htm

export type Sm2State = {
  easeFactor: number;
  interval: number; // días
  repetitions: number;
};

export type Sm2Result = Sm2State & { dueDate: Date };

export const GRADE_LABELS = {
  1: "De nuevo",
  3: "Difícil",
  4: "Bien",
  5: "Fácil",
} as const;

// Tope máximo de intervalo. Las materias acá son todas cuatrimestrales
// (~16 semanas, no anuales): con SM-2 "puro" una tarjeta bien respondida
// varias veces seguidas puede terminar espaciándose 200+ días, es decir,
// dejar de aparecer antes del final. Limitamos el intervalo a un fragmento
// razonable de un cuatrimestre para garantizar varios repasos antes de
// cualquier examen, en línea con la evidencia de que el espaciado óptimo
// es una fracción del intervalo de retención objetivo, no equivalente a
// él (Cepeda et al., 2008 - "spacing effects... temporal ridgeline").
export const MAX_INTERVAL_DAYS = 60;

export function applySm2(
  state: Sm2State,
  grade: number,
  maxIntervalDays: number = MAX_INTERVAL_DAYS
): Sm2Result {
  let { easeFactor, interval, repetitions } = state;

  if (grade < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    interval = Math.min(interval, maxIntervalDays);
    repetitions += 1;
  }

  easeFactor =
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  easeFactor = Math.max(easeFactor, 1.3);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return { easeFactor, interval, repetitions, dueDate };
}
