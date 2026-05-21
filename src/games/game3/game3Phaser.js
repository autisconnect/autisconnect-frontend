import Phaser from 'phaser';
import { MISSIONS, getLevelConfig } from './levelConfig';
import jornadaImg from '../../assets/game3_jornada.png';
import defesaImg from '../../assets/game3_defesa.png';
import escolaImg from '../../assets/game3_escola.png';
import mudancaImg from '../../assets/game3_mudanca.png';
import inibicaoImg from '../../assets/game3_inibicao.png';
import memoriaImg from '../../assets/game3_memoria.png';

const MISSION_IMAGE_MAP = {
  jornada: jornadaImg,
  defesa: defesaImg,
  escola: escolaImg
};

const SUPPORT_IMAGE_MAP = {
  mudanca: mudancaImg,
  inibicao: inibicaoImg,
  memoria: memoriaImg
};

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.setPath('');
    Object.entries(MISSION_IMAGE_MAP).forEach(([key, src]) => {
      if (key && src) {
        this.load.image(`mission_${key}`, src);
      }
    });
    Object.entries(SUPPORT_IMAGE_MAP).forEach(([key, src]) => {
      if (key && src) {
        this.load.image(`support_${key}`, src);
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

    this.add.text(width / 2, height / 2 - 70, 'Executive Function Builders', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#0f172a',
      align: 'center'
    }).setOrigin(0.5);

    const levelId = this.game.registry.get('levelId') || 1;
    const levelConfig = getLevelConfig(levelId);

    this.add.text(width / 2, height / 2 - 20, `Nivel ${levelConfig.levelId} - ${levelConfig.label}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#475569'
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height / 2 + 50, 280, 56, 0x2563eb, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x1d4ed8);

    this.add.text(width / 2, height / 2 + 50, 'Iniciar planejamento', {
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
    this.levelId = 1;
    this.levelConfig = null;
    this.mission = null;
    this.planSteps = [];
    this.currentStepIndex = 0;
    this.correctSteps = 0;
    this.attempts = 0;
    this.wrongClicks = 0;
    this.perseverationErrors = 0;
    this.hintsUsed = 0;
    this.impulseErrors = 0;
    this.planChanged = false;
    this.changeStartAt = null;
    this.adaptationTimeMs = null;
    this.oldExpectedStepId = null;
    this.stepNodes = [];
    this.labelsHidden = false;
    this.highlightTween = null;
    this.stepsStartY = 150;
    this.missionImage = null;
    this.missionImageFrame = null;
    this.missionCaption = null;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0xeef2ff).setOrigin(0);

    this.levelId = this.game.registry.get('levelId') || 1;
    this.levelConfig = getLevelConfig(this.levelId);

    this.mission = Phaser.Utils.Array.GetRandom(MISSIONS);
    const stepsCount = Math.min(this.levelConfig.stepsCount || 3, this.mission.steps.length);
    this.planSteps = this.mission.steps.slice(0, stepsCount);
    this.currentStepIndex = 0;

    this.correctSteps = 0;
    this.attempts = 0;
    this.wrongClicks = 0;
    this.perseverationErrors = 0;
    this.hintsUsed = 0;
    this.impulseErrors = 0;
    this.planChanged = false;
    this.changeStartAt = null;
    this.adaptationTimeMs = null;
    this.oldExpectedStepId = null;
    this.stepNodes = [];
    this.labelsHidden = false;

    this.renderHeader();
    this.renderMissionImage();
    this.renderPlanSteps();
    this.renderProgress();
    this.renderHintButton();
    this.scheduleImpulses();
    this.highlightCurrentStep();

    if (this.levelConfig.showLabelsDuration) {
      this.time.delayedCall(this.levelConfig.showLabelsDuration, () => {
        this.setLabelsVisible(false);
      });
    }

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: {
          type: 'mission_start',
          missionId: this.mission.id,
          stepsTotal: this.planSteps.length
        }
      });
    }
  }

  renderHeader() {
    const { width } = this.scale;
    const header = this.add.rectangle(width / 2, 55, width - 120, 80, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xdbeafe);

    this.add.text(width / 2, 40, this.mission.title, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#0f172a'
    }).setOrigin(0.5);

    this.add.text(width / 2, 68, `Nivel ${this.levelConfig.levelId} - ${this.levelConfig.label}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#64748b'
    }).setOrigin(0.5);

    header.setDepth(1);
  }

  renderMissionImage() {
    const { width, height } = this.scale;
    const isCompact = height < 620 || width < 760;
    const imageKey = `mission_${this.mission.id}`;

    const frameWidth = width - (isCompact ? 120 : 200);
    const frameHeight = isCompact ? 140 : 180;
    const frameY = isCompact ? 160 : 180;

    this.stepsStartY = frameY + frameHeight / 2 + (isCompact ? 50 : 70);

    this.missionImageFrame = this.add.rectangle(width / 2, frameY, frameWidth, frameHeight, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xe2e8f0);

    if (this.textures.exists(imageKey)) {
      this.missionImage = this.add.image(width / 2, frameY, imageKey);
      const texture = this.textures.get(imageKey).getSourceImage();
      if (texture && texture.width && texture.height) {
        const scale = Math.min((frameWidth - 20) / texture.width, (frameHeight - 20) / texture.height);
        this.missionImage.setDisplaySize(texture.width * scale, texture.height * scale);
      }
    } else {
      this.add.text(width / 2, frameY, 'Imagem da missao', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#94a3b8'
      }).setOrigin(0.5);
    }

    this.missionCaption = this.add.text(width / 2, frameY + frameHeight / 2 + 20, this.mission.title, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#475569'
    }).setOrigin(0.5);
  }

  renderPlanSteps() {
    const { width } = this.scale;
    const isCompact = width < 720;
    const columns = isCompact ? 1 : 2;
    const cardWidth = isCompact ? width - 140 : (width - 240) / 2;
    const cardHeight = 46;
    const rowGap = 60;
    const colGap = 40;
    const startY = this.stepsStartY || 150;

    const leftX = width / 2 - (columns === 2 ? cardWidth / 2 + colGap / 2 : 0);
    const rightX = width / 2 + (columns === 2 ? cardWidth / 2 + colGap / 2 : 0);

    this.planSteps.forEach((step, index) => {
      const col = columns === 1 ? 0 : index % 2;
      const row = columns === 1 ? index : Math.floor(index / 2);
      const x = columns === 1 ? width / 2 : col === 0 ? leftX : rightX;
      const y = startY + row * rowGap;

      const container = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff)
        .setStrokeStyle(2, 0xcbd5f5)
        .setInteractive({ useHandCursor: true });

      const text = this.add.text(0, 0, this.getStepLabel(step, index), {
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
    const { width, height } = this.scale;
    this.progressText = this.add.text(width / 2, height - 80, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#475569'
    }).setOrigin(0.5);

    this.updateProgress();
  }

  renderHintButton() {
    if (!this.levelConfig.allowHints) return;

    const { width, height } = this.scale;
    const hintButton = this.add.rectangle(width - 130, height - 40, 180, 40, 0x0ea5e9)
      .setStrokeStyle(2, 0x0284c7)
      .setInteractive({ useHandCursor: true });

    this.add.text(width - 130, height - 40, 'Mostrar dica', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);

    hintButton.on('pointerdown', () => this.useHint());
  }

  setLabelsVisible(visible) {
    this.labelsHidden = !visible;
    this.stepNodes.forEach((node, index) => {
      if (!node || node.done) return;
      node.text.setAlpha(visible ? 1 : 0.25);
      node.text.setText(this.getStepLabel(node.step, index));
    });
  }

  getStepLabel(step, index) {
    if (!step) return '';
    if (this.labelsHidden) {
      return `${index + 1}. •••`;
    }
    return `${index + 1}. ${step.label}`;
  }

  updateProgress() {
    if (!this.progressText) return;
    this.progressText.setText(`Passos concluidos: ${this.correctSteps}/${this.planSteps.length}`);
  }

  highlightCurrentStep() {
    if (!this.levelConfig.allowHints) return;
    this.stepNodes.forEach((node, idx) => {
      if (node.done) return;
      node.bg.setStrokeStyle(idx === this.currentStepIndex ? 3 : 2, idx === this.currentStepIndex ? 0x2563eb : 0xcbd5f5);
    });
  }

  handleStepClick(index) {
    const node = this.stepNodes[index];
    if (!node || node.done) return;

    this.attempts += 1;
    const expectedStep = this.planSteps[this.currentStepIndex];

    if (node.step?.id === expectedStep?.id) {
      node.done = true;
      node.bg.setFillStyle(0xbbf7d0);
      node.bg.setStrokeStyle(2, 0x16a34a);
      this.correctSteps += 1;

      const onEvent = this.game.registry.get('onEvent');
      if (onEvent) {
        onEvent({
          eventType: 'regulation_success',
          data: {
            type: 'step_complete',
            stepId: node.step?.id,
            orderIndex: this.currentStepIndex
          }
        });
      }

      if (this.planChanged && this.changeStartAt && this.adaptationTimeMs === null) {
        this.adaptationTimeMs = Date.now() - this.changeStartAt;
      }

      this.currentStepIndex += 1;
      this.updateProgress();
      this.highlightCurrentStep();

      if (!this.planChanged && this.currentStepIndex === this.levelConfig.changeAtStep) {
        this.applyPlanChange();
      }

      if (this.correctSteps >= this.planSteps.length) {
        this.time.delayedCall(800, () => this.finishMission());
      }
    } else {
      this.wrongClicks += 1;
      const perseveration = this.planChanged && node.step?.id === this.oldExpectedStepId;
      if (perseveration) {
        this.perseverationErrors += 1;
      }

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
            type: 'wrong_step',
            stepId: node.step?.id,
            expectedId: expectedStep?.id,
            perseveration
          }
        });
      }
    }
  }

  applyPlanChange() {
    if (this.planChanged) return;
    if (!this.planSteps[this.currentStepIndex]) return;

    const oldStep = this.planSteps[this.currentStepIndex];
    const alternatives = this.mission.alternatives || [];
    const alternative = alternatives.length > 0
      ? Phaser.Utils.Array.GetRandom(alternatives)
      : null;

    let newStep = alternative && alternative.id !== oldStep.id ? alternative : null;

    if (!newStep) {
      const swapIndex = Math.min(this.planSteps.length - 1, this.currentStepIndex + 1);
      newStep = this.planSteps[swapIndex];
      this.planSteps[swapIndex] = oldStep;
    }

    this.planSteps[this.currentStepIndex] = newStep;
    this.oldExpectedStepId = oldStep?.id || null;
    this.planChanged = true;
    this.changeStartAt = Date.now();

    this.stepNodes.forEach((node, idx) => {
      if (idx < this.currentStepIndex || node.done) return;
      node.step = this.planSteps[idx];
      node.text.setText(this.getStepLabel(node.step, idx));
      node.bg.setFillStyle(0xffffff);
      node.bg.setStrokeStyle(2, 0xcbd5f5);
    });

    this.showPlanChangeNotice(oldStep, newStep);

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: {
          type: 'plan_change',
          fromStep: oldStep?.id,
          toStep: newStep?.id
        }
      });
    }
  }

  showPlanChangeNotice(oldStep, newStep) {
    const { width } = this.scale;
    const overlay = this.add.rectangle(width / 2, 150, width - 200, 70, 0x0f172a, 0.9)
      .setStrokeStyle(2, 0xfacc15);
    const message = this.add.text(width / 2, 150, `Mudanca inesperada: substitua ${oldStep?.label || 'passo'} por ${newStep?.label || 'novo passo'}`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#f8fafc',
        align: 'center',
        wordWrap: { width: width - 240 }
      })
      .setOrigin(0.5);

    const iconKey = 'support_mudanca';
    let icon = null;
    if (this.textures.exists(iconKey)) {
      const overlayWidth = width - 200;
      const iconX = width / 2 - overlayWidth / 2 + 28;
      icon = this.add.image(iconX, 150, iconKey);
      icon.setDisplaySize(36, 36);
    }

    this.time.delayedCall(2200, () => {
      overlay.destroy();
      message.destroy();
      if (icon) {
        icon.destroy();
      }
    });
  }

  useHint() {
    if (!this.levelConfig.allowHints) return;

    this.hintsUsed += 1;
    const memoryKey = 'support_memoria';
    if (this.textures.exists(memoryKey)) {
      const { width, height } = this.scale;
      const memoryIcon = this.add.image(width - 140, height - 100, memoryKey);
      memoryIcon.setDisplaySize(48, 48);
      this.time.delayedCall(1500, () => {
        if (memoryIcon.active) {
          memoryIcon.destroy();
        }
      });
    }
    const expectedNode = this.stepNodes[this.currentStepIndex];
    if (expectedNode) {
      if (this.highlightTween) {
        this.highlightTween.stop();
      }
      this.highlightTween = this.tweens.add({
        targets: expectedNode.bg,
        scale: 1.05,
        yoyo: true,
        duration: 200,
        repeat: 3
      });
    }

    if (this.labelsHidden) {
      this.setLabelsVisible(true);
      this.time.delayedCall(2000, () => this.setLabelsVisible(false));
    }

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'strategy_choice',
        data: {
          strategy: 'hint',
          stepId: expectedNode?.step?.id
        }
      });
    }
  }

  scheduleImpulses() {
    const impulseCount = Math.max(0, Math.min(3, this.levelId - 1));
    if (!impulseCount) return;

    for (let i = 0; i < impulseCount; i += 1) {
      const delay = Phaser.Math.Between(3000, 7000) + i * 2500;
      this.time.delayedCall(delay, () => this.spawnImpulse());
    }
  }

  spawnImpulse() {
    const { width } = this.scale;
    const x = Phaser.Math.Between(120, width - 120);
    const y = Phaser.Math.Between(120, 220);

    const bubble = this.add.circle(x, y, 40, 0xf97316)
      .setStrokeStyle(2, 0xea580c)
      .setInteractive({ useHandCursor: true });
    const iconKey = 'support_inibicao';
    let icon = null;
    if (this.textures.exists(iconKey)) {
      icon = this.add.image(x, y, iconKey);
      icon.setDisplaySize(36, 36);
    }
    const label = this.add.text(x, y, 'Clique!', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({ eventType: 'trigger', data: { type: 'impulse_prompt' } });
    }

    bubble.on('pointerdown', () => {
      this.impulseErrors += 1;
      bubble.destroy();
      label.destroy();
      if (icon) {
        icon.destroy();
      }

      if (onEvent) {
        onEvent({
          eventType: 'dysregulation',
          data: { type: 'impulse_click' }
        });
      }
    });

    this.time.delayedCall(1800, () => {
      if (bubble.active) {
        bubble.destroy();
      }
      if (label.active) {
        label.destroy();
      }
      if (icon && icon.active) {
        icon.destroy();
      }
    });
  }

  finishMission(abandoned = false) {
    const summary = {
      stepsTotal: this.planSteps.length,
      correctSteps: this.correctSteps,
      attempts: this.attempts,
      wrongClicks: this.wrongClicks,
      hintsUsed: this.hintsUsed,
      perseverationErrors: this.perseverationErrors,
      adaptationTimeMs: this.adaptationTimeMs,
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
    const adaptationSeconds = summary.adaptationTimeMs ? (summary.adaptationTimeMs / 1000).toFixed(1) : '--';

    this.add.rectangle(0, 0, width, height, 0xf8fafc).setOrigin(0);

    this.add.text(width / 2, height / 2 - 90, summary.abandoned ? 'Sessao encerrada' : 'Missao concluida', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#0f172a'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, `Acertos: ${summary.correctSteps || 0}/${summary.stepsTotal || 0}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#475569'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 10, `Tentativas: ${summary.attempts || 0} | Perseveracoes: ${summary.perseverationErrors || 0}`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#64748b'
      }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 15, `Tempo de adaptacao: ${adaptationSeconds}s`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#64748b'
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height / 2 + 80, 220, 52, 0x2563eb)
      .setStrokeStyle(2, 0x1d4ed8)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height / 2 + 80, 'Finalizar', {
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

export const createGame3Game = (containerElement, options = {}) => {
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
      }
    },
    scene: [PreloadScene, MenuScene, GameScene, ResultScene]
  };

  return new Phaser.Game(config);
};










