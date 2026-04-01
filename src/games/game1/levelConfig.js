const SCENARIOS = [
  { id: 'barulho', text: 'Barulho inesperado no corredor', imageKey: 'scenario_barulho' },
  { id: 'mudanca', text: 'Mudanca de plano de ultima hora', imageKey: 'scenario_mudanca' },
  { id: 'frustracao', text: 'Tarefa dificil nao sai como esperado', imageKey: 'scenario_frustracao' },
  { id: 'fila', text: 'Espera maior do que o combinado', imageKey: 'scenario_fila' },
  { id: 'social', text: 'Interacao social confusa', imageKey: 'scenario_social' }
];

const STRATEGIES = [
  { key: 'respiracao', label: 'Respiracao' },
  { key: 'pausa', label: 'Pausa sensorial' },
  { key: 'reformulacao', label: 'Reformulacao' }
];

const LEVEL_CONFIGS = {
  1: {
    label: 'Previsivel',
    unlockThreshold: 60,
    maxTriggers: 4,
    triggerIntervalMs: 9000,
    triggerIntervalVarianceMs: 1000,
    emotionStart: 35,
    emotionIncreaseRange: [8, 16],
    successThreshold: 55,
    dysregulationThreshold: 85,
    strategyReduction: { respiracao: 30, pausa: 28, reformulacao: 24 },
    scenarioIds: ['barulho', 'fila', 'frustracao']
  },
  2: {
    label: 'Semi-dinamico',
    unlockThreshold: 65,
    maxTriggers: 5,
    triggerIntervalMs: 8200,
    triggerIntervalVarianceMs: 1400,
    emotionStart: 40,
    emotionIncreaseRange: [10, 20],
    successThreshold: 54,
    dysregulationThreshold: 84,
    strategyReduction: { respiracao: 27, pausa: 25, reformulacao: 22 },
    scenarioIds: ['barulho', 'mudanca', 'fila', 'frustracao']
  },
  3: {
    label: 'Social e frustracao',
    unlockThreshold: 70,
    maxTriggers: 6,
    triggerIntervalMs: 7600,
    triggerIntervalVarianceMs: 1800,
    emotionStart: 45,
    emotionIncreaseRange: [12, 24],
    successThreshold: 52,
    dysregulationThreshold: 82,
    strategyReduction: { respiracao: 24, pausa: 22, reformulacao: 20 },
    scenarioIds: ['barulho', 'mudanca', 'fila', 'frustracao', 'social']
  },
  4: {
    label: 'Imprevisivel',
    unlockThreshold: 75,
    maxTriggers: 7,
    triggerIntervalMs: 7000,
    triggerIntervalVarianceMs: 2200,
    emotionStart: 50,
    emotionIncreaseRange: [14, 26],
    successThreshold: 50,
    dysregulationThreshold: 80,
    strategyReduction: { respiracao: 22, pausa: 20, reformulacao: 18 },
    scenarioIds: ['barulho', 'mudanca', 'fila', 'frustracao', 'social']
  },
  5: {
    label: 'Complexo',
    unlockThreshold: 80,
    maxTriggers: 8,
    triggerIntervalMs: 6400,
    triggerIntervalVarianceMs: 2600,
    emotionStart: 52,
    emotionIncreaseRange: [16, 30],
    successThreshold: 48,
    dysregulationThreshold: 78,
    strategyReduction: { respiracao: 20, pausa: 18, reformulacao: 16 },
    scenarioIds: ['barulho', 'mudanca', 'fila', 'frustracao', 'social']
  }
};

const scenarioMap = SCENARIOS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

const getLevelConfig = (levelId = 1) => {
  const safeLevel = LEVEL_CONFIGS[levelId] ? levelId : 1;
  const base = LEVEL_CONFIGS[safeLevel];
  const scenarios = base.scenarioIds.map((id) => scenarioMap[id]).filter(Boolean);

  return {
    ...base,
    levelId: safeLevel,
    scenarios
  };
};

export { SCENARIOS, STRATEGIES, LEVEL_CONFIGS, getLevelConfig };
