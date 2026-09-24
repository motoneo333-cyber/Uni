// Algoritmo SM-2 (SuperMemo 2) para repetición espaciada.
// grade: 0-5, donde >=3 es "recordado" y <3 es "fallado".
// Referencia: https://super-memory.com/english/ol/sm2.htm

export type Sm2State = {
  easeFactor: number;
  interval: number; // días (sin sentido mientras learningStep > 0)
  repetitions: number;
  learningStep: number; // 0 = fuera de reaprendizaje
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

// Pasos de reaprendizaje el mismo día para una tarjeta marcada "De nuevo":
// primero vuelve a los 10 minutos: si se vuelve a fallar, vuelve al día
// siguiente (24hs) antes de recién ahí entrar al ciclo normal de SM-2 con
// intervalos en días. Sin esto, SM-2 "de fábrica" manda una tarjeta fallada
// directo a mañana, perdiendo la chance de corregirla en la misma sesión
// mientras el error todavía está fresco.
export const LEARNING_STEPS_MINUTES = [10, 24 * 60];

export function applySm2(
  state: Sm2State,
  grade: number,
  maxIntervalDays: number = MAX_INTERVAL_DAYS
): Sm2Result {
  let { easeFactor, interval, repetitions, learningStep } = state;
  let dueDate: Date;

  if (grade < 3) {
    repetitions = 0;
    const stepIndex = Math.min(learningStep, LEARNING_STEPS_MINUTES.length - 1);
    const minutes = LEARNING_STEPS_MINUTES[stepIndex];
    learningStep += 1;
    interval = 0;
    dueDate = new Date(Date.now() + minutes * 60 * 1000);
  } else {
    learningStep = 0;
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    interval = Math.min(interval, maxIntervalDays);
    repetitions += 1;
    dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interval);
  }

  easeFactor =
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  easeFactor = Math.max(easeFactor, 1.3);

  return { easeFactor, interval, repetitions, learningStep, dueDate };
}
