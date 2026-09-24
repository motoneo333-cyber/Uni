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

export function applySm2(state: Sm2State, grade: number): Sm2Result {
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
    repetitions += 1;
  }

  easeFactor =
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  easeFactor = Math.max(easeFactor, 1.3);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return { easeFactor, interval, repetitions, dueDate };
}
