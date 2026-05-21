const MISSIONS = [
  {
    id: 'jornada',
    title: 'Construir uma jornada',
    theme: 'aventura',
    steps: [
      { id: 'mapa', label: 'Analisar o mapa' },
      { id: 'rota', label: 'Escolher a rota' },
      { id: 'mochila', label: 'Preparar mochila' },
      { id: 'lanche', label: 'Separar lanche' },
      { id: 'horario', label: 'Confirmar horario' },
      { id: 'aviso', label: 'Avisar responsavel' }
    ],
    alternatives: [
      { id: 'clima', label: 'Checar clima' },
      { id: 'transito', label: 'Verificar transito' }
    ]
  },
  {
    id: 'defesa',
    title: 'Planejar defesa da base',
    theme: 'estrategia',
    steps: [
      { id: 'recursos', label: 'Coletar recursos' },
      { id: 'base', label: 'Escolher base' },
      { id: 'torres', label: 'Posicionar torres' },
      { id: 'muro', label: 'Reforcar muro' },
      { id: 'teste', label: 'Testar defesa' },
      { id: 'ajuste', label: 'Ajustar estrategia' }
    ],
    alternatives: [
      { id: 'armadilha', label: 'Adicionar armadilhas' },
      { id: 'energia', label: 'Recarregar energia' }
    ]
  },
  {
    id: 'escola',
    title: 'Rotina antes da escola',
    theme: 'rotina',
    steps: [
      { id: 'uniforme', label: 'Separar uniforme' },
      { id: 'material', label: 'Revisar material' },
      { id: 'caderno', label: 'Organizar cadernos' },
      { id: 'lanche', label: 'Colocar lanche' },
      { id: 'mochila', label: 'Fechar mochila' },
      { id: 'saida', label: 'Sair no horario' }
    ],
    alternatives: [
      { id: 'transporte', label: 'Confirmar transporte' },
      { id: 'agenda', label: 'Checar agenda' }
    ]
  }
];

const LEVEL_CONFIGS = {
  1: {
    label: 'Sequencias simples',
    stepsCount: 3,
    changeAtStep: 2,
    allowHints: true,
    showLabelsDuration: null,
    unlockThreshold: 60
  },
  2: {
    label: 'Sequencias medias',
    stepsCount: 4,
    changeAtStep: 2,
    allowHints: true,
    showLabelsDuration: 4000,
    unlockThreshold: 65
  },
  3: {
    label: 'Flexibilidade parcial',
    stepsCount: 4,
    changeAtStep: 3,
    allowHints: false,
    showLabelsDuration: 3000,
    unlockThreshold: 70
  },
  4: {
    label: 'Multiplas variaveis',
    stepsCount: 5,
    changeAtStep: 3,
    allowHints: false,
    showLabelsDuration: 2000,
    unlockThreshold: 75
  },
  5: {
    label: 'Planejamento avancado',
    stepsCount: 6,
    changeAtStep: 3,
    allowHints: false,
    showLabelsDuration: 1500,
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

export { MISSIONS, LEVEL_CONFIGS, getLevelConfig };
