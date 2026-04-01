const MISSIONS = [
  {
    id: 'mochila',
    title: 'Organizar a mochila',
    category: 'escola',
    imageKey: 'mission_mochila',
    steps: [
      { id: 'caderno', label: 'Colocar caderno' },
      { id: 'estojo', label: 'Guardar estojo' },
      { id: 'livro', label: 'Separar livro' },
      { id: 'lancheira', label: 'Colocar lancheira' },
      { id: 'ziper', label: 'Fechar ziper' }
    ]
  },
  {
    id: 'lanche',
    title: 'Preparar lanche simples',
    category: 'alimentacao',
    imageKey: 'mission_lanche',
    steps: [
      { id: 'lavar', label: 'Lavar as maos' },
      { id: 'pao', label: 'Pegar o pao' },
      { id: 'recheio', label: 'Colocar recheio' },
      { id: 'suco', label: 'Separar o suco' },
      { id: 'guardar', label: 'Guardar na lancheira' }
    ]
  },
  {
    id: 'higiene',
    title: 'Rotina de higiene',
    category: 'higiene',
    imageKey: 'mission_higiene',
    steps: [
      { id: 'escova', label: 'Pegar a escova' },
      { id: 'pasta', label: 'Colocar pasta' },
      { id: 'escovar', label: 'Escovar os dentes' },
      { id: 'enxaguar', label: 'Enxaguar' },
      { id: 'guardar', label: 'Guardar a escova' }
    ]
  },
  {
    id: 'roupa',
    title: 'Escolher roupa',
    category: 'vestuario',
    imageKey: 'mission_roupa',
    steps: [
      { id: 'camisa', label: 'Escolher camiseta' },
      { id: 'calca', label: 'Escolher calca' },
      { id: 'meia', label: 'Separar meias' },
      { id: 'tenis', label: 'Pegar tenis' },
      { id: 'conferir', label: 'Conferir no espelho' }
    ]
  },
  {
    id: 'cama',
    title: 'Arrumar a cama',
    category: 'organizacao',
    imageKey: 'mission_cama',
    steps: [
      { id: 'lencol', label: 'Esticar o lencol' },
      { id: 'cobertor', label: 'Arrumar o cobertor' },
      { id: 'travesseiro', label: 'Colocar o travesseiro' },
      { id: 'pelucia', label: 'Organizar a pelucia' },
      { id: 'verificar', label: 'Verificar se ficou alinhada' }
    ]
  }
];

const LEVEL_CONFIGS = {
  1: {
    label: 'Passos guiados',
    unlockThreshold: 60,
    allowHelp: true,
    guided: true,
    interruptions: 0
  },
  2: {
    label: 'Pouca ajuda',
    unlockThreshold: 65,
    allowHelp: true,
    guided: true,
    interruptions: 0
  },
  3: {
    label: 'Independencia parcial',
    unlockThreshold: 70,
    allowHelp: true,
    guided: false,
    interruptions: 1
  },
  4: {
    label: 'Com interrupcoes',
    unlockThreshold: 75,
    allowHelp: false,
    guided: false,
    interruptions: 1
  },
  5: {
    label: 'Independencia total',
    unlockThreshold: 80,
    allowHelp: false,
    guided: false,
    interruptions: 2
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
