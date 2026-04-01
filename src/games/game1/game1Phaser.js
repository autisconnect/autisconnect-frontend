import Phaser from 'phaser';
import { SCENARIOS, STRATEGIES, getLevelConfig } from './levelConfig';
import scenarioBarulho from '../../assets/game1_1.jpg';
import scenarioMudanca from '../../assets/game1_2.jpg';
import scenarioFrustracao from '../../assets/game1_3.jpg';
import scenarioFila from '../../assets/game1_4.jpg';
import scenarioSocial from '../../assets/game1_5.jpg';

const SCENARIO_IMAGE_MAP = {
  scenario_barulho: scenarioBarulho,
  scenario_mudanca: scenarioMudanca,
  scenario_frustracao: scenarioFrustracao,
  scenario_fila: scenarioFila,
  scenario_social: scenarioSocial
};

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.setPath('');

    SCENARIOS.forEach((scenario) => {
      const imageKey = scenario.imageKey;
      const imageSrc = imageKey ? SCENARIO_IMAGE_MAP[imageKey] : null;
      if (imageKey && imageSrc) {
        this.load.image(imageKey, imageSrc);
      }
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0xf4f7ff).setOrigin(0);

    this.add.text(width / 2, height / 2 - 60, 'Emotional Regulation Adventures', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#0f172a',
      align: 'center'
    }).setOrigin(0.5);

    const levelId = this.game.registry.get('levelId') || 1;
    const levelConfig = getLevelConfig(levelId);

    this.add.text(width / 2, height / 2 - 10, `Nivel ${levelConfig.levelId} - ${levelConfig.label}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#475569'
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height / 2 + 50, 260, 56, 0x2563eb, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x1d4ed8);

    this.add.text(width / 2, height / 2 + 50, 'Comecar', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.on('pointerdown', () => {
      this.scene.start('GameScene');
      this.scene.launch('HUDScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.emotionValue = 40;
    this.triggerCount = 0;
    this.successCount = 0;
    this.dysregulations = 0;
    this.strategyCounts = {};
    this.maxTriggers = 5;
    this.levelConfig = null;
    this.levelId = 1;
    this.scenarios = [];
    this.triggerTimer = null;
    this.scenarioImage = null;
    this.scenarioImageFrame = null;
    this.scenarioImageArea = null;
    this.scenarioCaption = null;
    this.canShowScenarioImage = true;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0xeef2ff).setOrigin(0);

    this.levelId = this.game.registry.get('levelId') || 1;
    this.levelConfig = getLevelConfig(this.levelId);
    this.maxTriggers = this.levelConfig.maxTriggers;
    this.emotionValue = this.levelConfig.emotionStart;
    this.scenarios = this.levelConfig.scenarios.length > 0 ? this.levelConfig.scenarios : [];

    const hudOffset = 110;
    const isCompact = height < 700 || width < 720;
    const scenarioPanelY = hudOffset + (isCompact ? 60 : 70);
    const scenarioPanelHeight = isCompact ? 120 : 130;
    const scenarioImageHeight = Math.min(
      isCompact ? 220 : 320,
      Math.max(isCompact ? 140 : 220, height * (isCompact ? 0.32 : 0.38))
    );
    const scenarioImageY = scenarioPanelY + scenarioPanelHeight / 2 + (isCompact ? 90 : 130);
    const scenarioImageWidth = Math.max(isCompact ? 240 : 360, width - (isCompact ? 60 : 140));
    const captionOffset = isCompact ? 16 : 22;

    this.canShowScenarioImage = true;

    this.scenarioPanel = this.add.rectangle(
      width / 2,
      scenarioPanelY,
      width - (isCompact ? 80 : 120),
      scenarioPanelHeight,
      0xffffff,
      0.92
    ).setStrokeStyle(2, 0xdbeafe);

    this.scenarioText = this.add.text(width / 2, scenarioPanelY - 22, '', {
      fontFamily: 'Arial',
      fontSize: isCompact ? '20px' : '22px',
      color: '#0f172a',
      align: 'center',
      wordWrap: { width: width - (isCompact ? 120 : 180) }
    }).setOrigin(0.5);

    this.infoText = this.add.text(
      width / 2,
      scenarioPanelY + 28,
      `Nivel ${this.levelConfig.levelId} - ${this.levelConfig.label}. Observe a situacao e escolha uma estrategia.`,
      {
        fontFamily: 'Arial',
        fontSize: isCompact ? '14px' : '16px',
        color: '#64748b'
      }
    ).setOrigin(0.5);

    this.scenarioImageArea = {
      x: width / 2,
      y: scenarioImageY,
      width: scenarioImageWidth,
      height: scenarioImageHeight
    };

    this.scenarioImageFrame = this.add.rectangle(
      this.scenarioImageArea.x,
      this.scenarioImageArea.y,
      this.scenarioImageArea.width,
      this.scenarioImageArea.height,
      0xffffff,
      0.9
    ).setStrokeStyle(2, 0xe2e8f0);
    this.scenarioImageFrame.setVisible(false);

    this.scenarioCaption = this.add.text(
      this.scenarioImageArea.x,
      this.scenarioImageArea.y + this.scenarioImageArea.height / 2 + captionOffset,
      '',
      {
        fontFamily: 'Arial',
        fontSize: isCompact ? '14px' : '16px',
        color: '#475569',
        align: 'center',
        wordWrap: { width: this.scenarioImageArea.width - 40 }
      }
    ).setOrigin(0.5);
    this.scenarioCaption.setVisible(false);

    this.game.events.on('strategy:chosen', this.handleStrategy, this);
    this.game.events.on('game:quit', this.handleQuit, this);

    this.triggerScenario();
    this.scheduleNextTrigger();

    this.emitEmotion();
  }

  getNextTriggerDelay() {
    const base = this.levelConfig.triggerIntervalMs;
    const variance = this.levelConfig.triggerIntervalVarianceMs || 0;
    const offset = variance ? Phaser.Math.Between(-variance, variance) : 0;
    return Math.max(2500, base + offset);
  }

  scheduleNextTrigger() {
    if (this.triggerTimer) {
      this.triggerTimer.remove();
    }

    this.triggerTimer = this.time.addEvent({
      delay: this.getNextTriggerDelay(),
      callback: this.triggerScenario,
      callbackScope: this
    });
  }

  renderScenarioImage(scenario) {
    if (!this.canShowScenarioImage) {
      if (this.scenarioImage) this.scenarioImage.setVisible(false);
      if (this.scenarioImageFrame) this.scenarioImageFrame.setVisible(false);
      if (this.scenarioCaption) this.scenarioCaption.setVisible(false);
      return;
    }

    const imageKey = scenario?.imageKey;
    if (!imageKey || !this.textures.exists(imageKey)) {
      if (this.scenarioImage) this.scenarioImage.setVisible(false);
      if (this.scenarioImageFrame) this.scenarioImageFrame.setVisible(false);
      if (this.scenarioCaption) this.scenarioCaption.setVisible(false);
      return;
    }

    if (!this.scenarioImage) {
      this.scenarioImage = this.add.image(this.scenarioImageArea.x, this.scenarioImageArea.y, imageKey);
    } else {
      this.scenarioImage.setTexture(imageKey);
      this.scenarioImage.setPosition(this.scenarioImageArea.x, this.scenarioImageArea.y);
    }

    const texture = this.textures.get(imageKey).getSourceImage();
    if (texture && texture.width && texture.height) {
      const scale = Math.min(
        this.scenarioImageArea.width / texture.width,
        this.scenarioImageArea.height / texture.height
      );
      this.scenarioImage.setDisplaySize(texture.width * scale, texture.height * scale);
    }

    this.scenarioImageFrame.setVisible(true);
    this.scenarioImage.setVisible(true);
    this.scenarioImage.setAlpha(0);

    if (this.scenarioCaption) {
      this.scenarioCaption.setText(scenario?.text || '');
      this.scenarioCaption.setVisible(true);
      this.scenarioCaption.setAlpha(0);
    }

    this.tweens.killTweensOf(this.scenarioImage);
    this.tweens.add({
      targets: this.scenarioImage,
      alpha: 1,
      duration: 420,
      ease: 'Quad.Out'
    });

    if (this.scenarioCaption) {
      this.tweens.killTweensOf(this.scenarioCaption);
      this.tweens.add({
        targets: this.scenarioCaption,
        alpha: 1,
        duration: 360,
        delay: 80,
        ease: 'Quad.Out'
      });
    }
  }

  triggerScenario() {
    if (this.triggerCount >= this.maxTriggers) {
      this.finishLevel();
      return;
    }

    const scenario = Phaser.Utils.Array.GetRandom(this.scenarios);
    this.currentScenario = scenario;
    this.triggerCount += 1;

    this.scenarioText.setText(scenario.text);
    this.renderScenarioImage(scenario);

    const [minIncrease, maxIncrease] = this.levelConfig.emotionIncreaseRange;
    this.increaseEmotion(Phaser.Math.Between(minIncrease, maxIncrease));

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: { scenarioId: scenario.id, text: scenario.text }
      });
    }

    if (this.triggerCount >= this.maxTriggers) {
      this.time.delayedCall(1200, () => this.finishLevel());
      return;
    }

    this.scheduleNextTrigger();
  }

  handleStrategy(strategyKey) {
    const strategy = STRATEGIES.find((item) => item.key === strategyKey);
    if (!strategy) return;

    this.strategyCounts[strategy.key] = (this.strategyCounts[strategy.key] || 0) + 1;

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'strategy_choice',
        data: { strategy: strategy.key }
      });
    }

    const reduction = this.levelConfig.strategyReduction[strategy.key] ?? 18;
    this.decreaseEmotion(reduction);

    if (this.emotionValue <= this.levelConfig.successThreshold) {
      this.successCount += 1;
      const onEvent = this.game.registry.get('onEvent');
      if (onEvent) {
        onEvent({
          eventType: 'regulation_success',
          data: { strategy: strategy.key, emotion: this.emotionValue }
        });
      }
    }
  }

  handleQuit() {
    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'abandon',
        data: { reason: 'user_quit' }
      });
    }
    this.finishLevel(true);
  }

  increaseEmotion(amount) {
    this.emotionValue = Math.min(100, this.emotionValue + amount);

    if (this.emotionValue >= this.levelConfig.dysregulationThreshold) {
      this.dysregulations += 1;
      const onEvent = this.game.registry.get('onEvent');
      if (onEvent) {
        onEvent({
          eventType: 'dysregulation',
          data: { intensity: this.emotionValue }
        });
      }
    }

    this.emitEmotion();
  }

  decreaseEmotion(amount) {
    this.emotionValue = Math.max(0, this.emotionValue - amount);
    this.emitEmotion();
  }

  emitEmotion() {
    this.game.events.emit('emotion:update', this.emotionValue);
  }

  finishLevel(abandoned = false) {
    if (this.triggerTimer) {
      this.triggerTimer.remove();
    }

    this.game.events.off('strategy:chosen', this.handleStrategy, this);
    this.game.events.off('game:quit', this.handleQuit, this);

    const summary = {
      triggers: this.triggerCount,
      successes: this.successCount,
      dysregulations: this.dysregulations,
      abandoned
    };

    this.scene.stop('HUDScene');
    this.scene.start('ResultScene', { summary });
  }
}

class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
    this.emotionValue = 40;
  }

  create() {
    const { width, height } = this.scale;

    this.topBar = this.add.rectangle(0, 0, width, 90, 0x1e293b, 0.92).setOrigin(0);

    this.add.text(30, 18, 'Barra emocional', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#e2e8f0'
    });

    this.emotionBarBg = this.add.rectangle(30, 50, width - 220, 20, 0x334155).setOrigin(0, 0.5);
    this.emotionBarFill = this.add.rectangle(30, 50, width - 220, 20, 0x22c55e).setOrigin(0, 0.5);

    this.emotionLabel = this.add.text(width - 170, 40, 'Calmo', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#e2e8f0'
    });

    const levelId = this.game.registry.get('levelId') || 1;
    this.add.text(width - 170, 18, `Nivel ${levelId}`, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#e2e8f0'
    });

    const strategiesY = height - 70;
    const spacing = 220;
    const startX = width / 2 - spacing;

    STRATEGIES.forEach((strategy, index) => {
      const x = startX + index * spacing;
      this.createStrategyButton(x, strategiesY, strategy);
    });

    this.createQuitButton(width - 110, 50);

    this.game.events.on('emotion:update', this.updateEmotion, this);
  }

  createStrategyButton(x, y, strategy) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 190, 58, 0x2563eb)
      .setStrokeStyle(2, 0x1d4ed8)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, strategy.label, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    bg.on('pointerdown', () => {
      this.game.events.emit('strategy:chosen', strategy.key);
    });

    container.add([bg, text]);
  }

  createQuitButton(x, y) {
    const bg = this.add.rectangle(x, y, 150, 38, 0xb91c1c)
      .setStrokeStyle(2, 0x7f1d1d)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, 'Encerrar', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    bg.on('pointerdown', () => {
      this.game.events.emit('game:quit');
    });
  }

  updateEmotion(value) {
    this.emotionValue = value;
    const { width } = this.scale;
    const maxWidth = width - 220;
    const clamped = Phaser.Math.Clamp(value, 0, 100);
    const barWidth = (clamped / 100) * maxWidth;
    this.emotionBarFill.width = barWidth;

    if (clamped >= 80) {
      this.emotionBarFill.fillColor = 0xef4444;
      this.emotionLabel.setText('Muito intenso');
    } else if (clamped >= 55) {
      this.emotionBarFill.fillColor = 0xf97316;
      this.emotionLabel.setText('Em atencao');
    } else {
      this.emotionBarFill.fillColor = 0x22c55e;
      this.emotionLabel.setText('Calmo');
    }
  }
}

class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create(data) {
    const { width, height } = this.scale;
    const summary = data?.summary || {};

    this.add.rectangle(0, 0, width, height, 0xf8fafc).setOrigin(0);

    this.add.text(width / 2, height / 2 - 80, summary.abandoned ? 'Sessao encerrada' : 'Sessao concluida', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#0f172a'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, `Gatilhos: ${summary.triggers || 0} | Sucessos: ${summary.successes || 0}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#475569'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, `Momentos de frustracao: ${summary.dysregulations || 0}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#64748b'
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height / 2 + 70, 220, 52, 0x2563eb)
      .setStrokeStyle(2, 0x1d4ed8)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height / 2 + 70, 'Finalizar', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.on('pointerdown', () => {
      const onSessionComplete = this.game.registry.get('onSessionComplete');
      if (onSessionComplete) {
        onSessionComplete({ reason: summary.abandoned ? 'abandon' : 'completed' });
      }
    });
  }
}

export const createGame1Game = (containerElement, options = {}) => {
  if (!containerElement) return null;

  const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: containerElement,
    backgroundColor: '#eef2ff',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: { default: 'arcade' },
    callbacks: {
      preBoot: (game) => {
        const levelId = options.levelId || 1;
        game.registry.set('levelId', levelId);
      }
    },
    scene: [PreloadScene, MenuScene, GameScene, HUDScene, ResultScene]
  };

  return new Phaser.Game(config);
};
