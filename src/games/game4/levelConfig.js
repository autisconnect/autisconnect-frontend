const ROUTINES = [
  {
    id: 'manha',
    label: 'Rotina da manha',
    activities: [
      { id: 'acordar', label: 'Acordar' },
      { id: 'escovar', label: 'Escovar os dentes' },
      { id: 'cafe', label: 'Tomar cafe' },
      { id: 'roupa', label: 'Trocar de roupa' },
      { id: 'mochila', label: 'Preparar mochila' },
      { id: 'escola', label: 'Ir para a escola' },
      { id: 'brincar', label: 'Brincar' }
    ]
  },
  {
    id: 'tarde',
    label: 'Rotina da tarde',
    activities: [
      { id: 'almoco', label: 'Almocar' },
      { id: 'descanso', label: 'Descansar' },
      { id: 'tarefa', label: 'Fazer tarefa' },
      { id: 'brincar', label: 'Brincar' },
      { id: 'lanche', label: 'Lanche' },
      { id: 'banho', label: 'Tomar banho' },
      { id: 'familia', label: 'Tempo com a familia' }
    ]
  },
  {
    id: 'noite',
    label: 'Rotina da noite',
    activities: [
      { id: 'jantar', label: 'Jantar' },
      { id: 'higiene', label: 'Higiene' },
      { id: 'pijama', label: 'Vestir pijama' },
      { id: 'historia', label: 'Ouvir historia' },
      { id: 'organizar', label: 'Organizar quarto' },
      { id: 'relaxar', label: 'Relaxar' },
      { id: 'dormir', label: 'Dormir' }
    ]
  }
];

const LEVEL_CONFIGS = {
  1: {
    label: 'Sequencia basica',
    activitiesCount: 3,
    unlockThreshold: 60
  },
  2: {
    label: 'Sequencia media',
    activitiesCount: 5,
    unlockThreshold: 70
  },
  3: {
    label: 'Sequencia avancada',
    activitiesCount: 7,
    unlockThreshold: 80
  }
};

const getLevelConfig = (levelId = 1) => {
  const safeLevel = LEVEL_CONFIGS[levelId] ? levelId : 1;
  const base = LEVEL_CONFIGS[safeLevel];

  return {
    ...base,
    levelId: safeLevel
  };
};

export { ROUTINES, LEVEL_CONFIGS, getLevelConfig };
