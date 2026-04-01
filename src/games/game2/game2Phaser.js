import Phaser from 'phaser';
import { MISSIONS, getLevelConfig } from './levelConfig';

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.setPath('');
    const missionImages = this.registry.get('missionImages') || {};
    Object.entries(missionImages).forEach(([key, src]) => {
      if (key && src) {
        this.load.image(key, src);
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
    this.add.rectangle(0, 0, width, height, 0xf8fafc).setOrigin(0);

    this.add.text(width / 2, height / 2 - 60, 'Daily Life Quest', {
      fontFamily: 'Arial',
      fontSize: '30px',
      color: '#0f172a'
    }).setOrigin(0.5);

    const levelId = this.game.registry.get('levelId') || 1;
    const levelConfig = getLevelConfig(levelId);

    this.add.text(width / 2, height / 2 - 15, `Nivel ${levelConfig.levelId} - ${levelConfig.label}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#475569'
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height / 2 + 50, 240, 54, 0x2563eb, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x1d4ed8);

    this.add.text(width / 2, height / 2 + 50, 'Iniciar missao', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.levelConfig = null;
    this.levelId = 1;
    this.mission = null;
    this.currentStepIndex = 0;
    this.completedCount = 0;
    this.stepsWithoutHelp = 0;
    this.helpUsedForStep = false;
    this.wrongClicks = 0;
    this.wrongOrder = 0;
    this.interruptionCount = 0;
    this.missionStartAt = null;
    this.stepNodes = [];
    this.isPaused = false;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0xeef2ff).setOrigin(0);

    this.levelId = this.game.registry.get('levelId') || 1;
    this.levelConfig = getLevelConfig(this.levelId);
    this.mission = Phaser.Utils.Array.GetRandom(MISSIONS);
    this.currentStepIndex = 0;
    this.completedCount = 0;
    this.stepsWithoutHelp = 0;
    this.helpUsedForStep = false;
    this.wrongClicks = 0;
    this.wrongOrder = 0;
    this.interruptionCount = 0;
    this.stepNodes = [];
    this.isPaused = false;

    this.missionStartAt = Date.now();

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: {
          type: 'mission_start',
          missionId: this.mission.id,
          category: this.mission.category,
          stepsTotal: this.mission.steps.length
        }
      });
    }

    this.renderMissionHeader();
    this.renderMissionImage();
    this.renderSteps();
    this.renderProgress();
    this.renderHelpButton();
    this.scheduleInterruptions();
    this.highlightCurrentStep();
  }

  renderMissionHeader() {
    const { width } = this.scale;
    const levelConfig = this.levelConfig;

    this.add.rectangle(width / 2, 50, width - 100, 70, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xdbeafe);

    this.add.text(width / 2, 42, this.mission.title, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#0f172a'
    }).setOrigin(0.5);

    this.add.text(width / 2, 68, `Nivel ${levelConfig.levelId} - ${levelConfig.label}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#64748b'
    }).setOrigin(0.5);
  }

  renderMissionImage() {
    const { width } = this.scale;
    const imageKey = this.mission.imageKey;

    this.imageFrame = this.add.rectangle(width / 2, 170, width - 140, 160, 0xffffff, 0.9)
      .setStrokeStyle(2, 0xe2e8f0);

    if (imageKey && this.textures.exists(imageKey)) {
      this.missionImage = this.add.image(width / 2, 170, imageKey);
      const texture = this.textures.get(imageKey).getSourceImage();
      if (texture && texture.width && texture.height) {
        const scale = Math.min((width - 160) / texture.width, 150 / texture.height);
        this.missionImage.setDisplaySize(texture.width * scale, texture.height * scale);
      }
    } else {
      this.add.text(width / 2, 170, 'Foto personalizada da rotina', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#94a3b8'
      }).setOrigin(0.5);
    }
  }

  renderSteps() {
    const { width } = this.scale;
    const startY = 300;
    const gapY = 60;
    const gapX = 320;
    const leftX = width / 2 - gapX / 2;
    const rightX = width / 2 + gapX / 2;

    this.mission.steps.forEach((step, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column === 0 ? leftX : rightX;
      const y = startY + row * gapY;

      const container = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 260, 44, 0xffffff)
        .setStrokeStyle(2, 0xcbd5f5)
        .setInteractive({ useHandCursor: true });

      const labelText = this.levelConfig.guided
        ? `${index + 1}. ${step.label}`
        : step.label;

      const text = this.add.text(0, 0, labelText, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#0f172a',
        align: 'center'
      }).setOrigin(0.5);

      bg.on('pointerdown', () => this.handleStepClick(index));

      container.add([bg, text]);

      this.stepNodes.push({ step, bg, text, done: false });
    });
  }

  renderProgress() {
    const { width } = this.scale;
    this.progressText = this.add.text(width / 2, 250, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#475569'
    }).setOrigin(0.5);

    this.updateProgress();
  }

  renderHelpButton() {
    if (!this.levelConfig.allowHelp) return;

    const { width, height } = this.scale;
    const helpButton = this.add.rectangle(width - 130, height - 50, 180, 40, 0x22c55e)
      .setStrokeStyle(2, 0x16a34a)
      .setInteractive({ useHandCursor: true });

    this.add.text(width - 130, height - 50, 'Preciso de ajuda', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);

    helpButton.on('pointerdown', () => this.useHelp());
  }

  updateProgress() {
    if (!this.progressText) return;
    this.progressText.setText(`Passos concluidos: ${this.completedCount}/${this.mission.steps.length}`);
  }

  highlightCurrentStep() {
    if (!this.levelConfig.guided) return;
    this.stepNodes.forEach((node, idx) => {
      if (node.done) return;
      if (idx === this.currentStepIndex) {
        node.bg.setStrokeStyle(3, 0x2563eb);
      } else {
        node.bg.setStrokeStyle(2, 0xcbd5f5);
      }
    });
  }

  handleStepClick(index) {
    if (this.isPaused) return;
    const node = this.stepNodes[index];
    if (!node || node.done) return;

    if (index === this.currentStepIndex) {
      node.done = true;
      node.bg.setFillStyle(0xbbf7d0);
      node.bg.setStrokeStyle(2, 0x16a34a);
      this.completedCount += 1;

      const withoutHelp = !this.helpUsedForStep;
      if (withoutHelp) {
        this.stepsWithoutHelp += 1;
      }
      this.helpUsedForStep = false;

      const onEvent = this.game.registry.get('onEvent');
      if (onEvent) {
        onEvent({
          eventType: 'regulation_success',
          data: {
            type: 'step_complete',
            stepId: node.step.id,
            orderIndex: index,
            withoutHelp
          }
        });
      }

      this.currentStepIndex += 1;
      this.updateProgress();
      this.highlightCurrentStep();

      if (this.completedCount >= this.mission.steps.length) {
        this.time.delayedCall(900, () => this.finishMission());
      }
    } else {
      this.wrongClicks += 1;
      this.wrongOrder += 1;
      node.bg.setStrokeStyle(3, 0xef4444);
      this.tweens.add({
        targets: node.bg,
        x: node.bg.x + 6,
        yoyo: true,
        duration: 80,
        repeat: 3,
        onComplete: () => node.bg.setStrokeStyle(2, 0xcbd5f5)
      });

      const onEvent = this.game.registry.get('onEvent');
      if (onEvent) {
        onEvent({
          eventType: 'dysregulation',
          data: {
            stepId: node.step.id,
            expectedId: this.stepNodes[this.currentStepIndex]?.step?.id,
            wrongOrder: true
          }
        });
      }
    }
  }

  useHelp() {
    if (this.isPaused) return;
    if (!this.levelConfig.allowHelp) return;

    this.helpUsedForStep = true;
    this.highlightCurrentStep();

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'strategy_choice',
        data: {
          strategy: 'help',
          stepId: this.stepNodes[this.currentStepIndex]?.step?.id
        }
      });
    }
  }

  scheduleInterruptions() {
    const totalInterruptions = this.levelConfig.interruptions || 0;
    if (!totalInterruptions) return;

    const { width } = this.scale;
    for (let i = 0; i < totalInterruptions; i += 1) {
      const delay = Phaser.Math.Between(3000, 9000) + i * 2500;
      this.time.delayedCall(delay, () => {
        if (this.completedCount >= this.mission.steps.length) return;
        this.showInterruption(width);
      });
    }
  }

  showInterruption(width) {
    if (this.isPaused) return;
    this.isPaused = true;
    this.interruptionCount += 1;

    const overlay = this.add.rectangle(width / 2, 240, width - 160, 160, 0x0f172a, 0.9)
      .setStrokeStyle(2, 0xfacc15);
    const message = this.add.text(width / 2, 220, 'Interrupcao: um som chamou a atencao', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#f8fafc',
      align: 'center'
    }).setOrigin(0.5);
    const button = this.add.rectangle(width / 2, 275, 180, 40, 0xfacc15)
      .setStrokeStyle(2, 0x854d0e)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(width / 2, 275, 'Continuar', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#0f172a'
    }).setOrigin(0.5);

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: {
          type: 'interruption',
          missionId: this.mission.id
        }
      });
    }

    button.on('pointerdown', () => {
      overlay.destroy();
      message.destroy();
      button.destroy();
      buttonText.destroy();
      this.isPaused = false;
    });
  }

  finishMission(abandoned = false) {
    const durationMs = Date.now() - this.missionStartAt;

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: {
          type: 'mission_complete',
          missionId: this.mission.id,
          category: this.mission.category,
          stepsTotal: this.mission.steps.length,
          stepsWithoutHelp: this.stepsWithoutHelp,
          wrongOrder: this.wrongOrder,
          interruptions: this.interruptionCount,
          durationMs
        }
      });
    }

    const summary = {
      missionTitle: this.mission.title,
      stepsTotal: this.mission.steps.length,
      stepsWithoutHelp: this.stepsWithoutHelp,
      wrongOrder: this.wrongOrder,
      interruptions: this.interruptionCount,
      abandoned
    };

    this.scene.start('ResultScene', { summary });
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

    this.add.text(width / 2, height / 2 - 90, summary.abandoned ? 'Sessao encerrada' : 'Missao concluida', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#0f172a'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, summary.missionTitle || '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#475569'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, `Passos sem ajuda: ${summary.stepsWithoutHelp || 0}/${summary.stepsTotal || 0}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#475569'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 28, `Erros de ordem: ${summary.wrongOrder || 0} | Interrupcoes: ${summary.interruptions || 0}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#64748b'
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height / 2 + 90, 220, 52, 0x2563eb)
      .setStrokeStyle(2, 0x1d4ed8)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height / 2 + 90, 'Finalizar', {
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

export const createGame2Game = (containerElement, options = {}) => {
  if (!containerElement) return null;

  const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 600,
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
        if (options.missionImages) {
          game.registry.set('missionImages', options.missionImages);
        }
      }
    },
    scene: [PreloadScene, MenuScene, GameScene, ResultScene]
  };

  return new Phaser.Game(config);
};
