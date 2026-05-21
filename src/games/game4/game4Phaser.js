import Phaser from 'phaser';
import { ROUTINES, getLevelConfig } from './levelConfig';
import game4Cover from '../../assets/game4.png';
import imgAcordar from '../../assets/game4_acordar.png';
import imgEscovar from '../../assets/game4_escovar.png';
import imgTomar from '../../assets/game4_tomar.png';
import imgEscola from '../../assets/game4_escola.png';
import imgBrincar from '../../assets/game4_brincar.png';
import imgDormir from '../../assets/game4_dormir.png';
import { createCenteredHitArea, resolveDropSlotIndex } from './game4Utils';

const POSITIVE_MESSAGES = ['Muito bem!', 'Voce conseguiu!', 'Otimo trabalho!'];
const RETRY_MESSAGES = ['Tudo bem, tente de novo!', 'Vamos tentar novamente!', 'Quase la, continue!'];
const SLOT_DEFAULT_FILL = 0xffffff;
const SLOT_DEFAULT_STROKE = 0xcbd5f5;
const SLOT_FILLED_FILL = 0xf8fafc;
const SLOT_FILLED_STROKE = 0x38bdf8;
const SLOT_SUCCESS_FILL = 0xf0fdf4;
const SLOT_SUCCESS_STROKE = 0x22c55e;
const SLOT_INCORRECT_FILL = 0xffedd5;
const SLOT_INCORRECT_STROKE = 0xf97316;
const SLOT_ACTIVE_FILL = 0xeff6ff;
const SLOT_ACTIVE_STROKE = 0x3b82f6;
const CARD_DEFAULT_FILL = 0xfef3c7;
const CARD_DEFAULT_STROKE = 0xfacc15;
const CARD_SELECTED_FILL = 0xdbeafe;
const CARD_SELECTED_STROKE = 0x2563eb;
const CARD_LOCKED_FILL = 0xecfeff;
const CARD_LOCKED_STROKE = 0x06b6d4;

const ACTIVITY_TEXTURES = {
  acordar: 'game4-acordar',
  escovar: 'game4-escovar',
  cafe: 'game4-tomar',
  escola: 'game4-escola',
  brincar: 'game4-brincar',
  dormir: 'game4-dormir'
};

const createTouchCue = (scene, x, y) => {
  const container = scene.add.container(x, y);
  const ripple = scene.add.circle(0, 0, 17, 0x93c5fd, 0.18).setStrokeStyle(2, 0x60a5fa, 0.35);
  const badge = scene.add.circle(0, 0, 13, 0xbfdbfe, 0.95).setStrokeStyle(2, 0x60a5fa, 0.45);
  const hand = scene.add.graphics();

  hand.fillStyle(0xffffff, 1);
  hand.fillRoundedRect(-2, -8, 4, 12, 2);
  hand.fillRoundedRect(-6, 1, 12, 6, 3);
  hand.fillRoundedRect(2, -3, 3, 8, 2);
  hand.fillRoundedRect(-5, -2, 3, 7, 2);
  hand.fillCircle(0, -9, 3);

  container.add([ripple, badge, hand]);
  container.setVisible(false);
  container.setAlpha(0);

  return container;
};

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.image('game4-cover', game4Cover);
    this.load.image('game4-acordar', imgAcordar);
    this.load.image('game4-escovar', imgEscovar);
    this.load.image('game4-tomar', imgTomar);
    this.load.image('game4-escola', imgEscola);
    this.load.image('game4-brincar', imgBrincar);
    this.load.image('game4-dormir', imgDormir);
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

    const coverWidth = Math.min(260, width * 0.55);
    const coverHeight = coverWidth * 0.6;
    const coverY = height / 2 - 140;
    const titleY = Math.max(60, coverY - coverHeight / 2 - 24);
    const levelY = coverY + coverHeight / 2 + 20;
    const buttonY = levelY + 60;

    this.add.text(width / 2, titleY, 'Routine Builder', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#0f172a',
      align: 'center'
    }).setOrigin(0.5);

    const cover = this.add.image(width / 2, coverY, 'game4-cover');
    cover.setDisplaySize(coverWidth, coverHeight);

    const levelId = this.game.registry.get('levelId') || 1;
    const levelConfig = getLevelConfig(levelId);

    this.add.text(width / 2, levelY, `Nivel ${levelConfig.levelId} - ${levelConfig.label}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#475569'
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, buttonY, 240, 56, 0x2563eb, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x1d4ed8);

    this.add.text(width / 2, buttonY, 'Comecar', {
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
    this.routine = null;
    this.activities = [];
    this.slots = [];
    this.cards = [];
    this.placedCount = 0;
    this.attempts = 0;
    this.errors = 0;
    this.startTime = null;
    this.progressFill = null;
    this.progressText = null;
    this.progressBarWidth = null;
    this.feedbackText = null;
    this.selectionText = null;
    this.selectedCard = null;
    this.finishTimer = null;
    this.selectionPanel = null;
    this.selectionBadge = null;
    this.selectionCaption = null;
    this.slotHintTweens = new Map();
    this.soundEnabled = false;
    this.soundToggle = null;
    this.soundToggleText = null;
    this.soundToggleDot = null;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0xeef2ff).setOrigin(0);

    const levelId = this.game.registry.get('levelId') || 1;
    this.levelConfig = getLevelConfig(levelId);

    const customRoutines = this.game.registry.get('customRoutines');
    const routinePool = Array.isArray(customRoutines) && customRoutines.length
      ? [...ROUTINES, ...customRoutines]
      : ROUTINES;

    this.routine = Phaser.Utils.Array.GetRandom(routinePool);
    const totalCount = Math.min(this.levelConfig.activitiesCount || 3, this.routine.activities.length);
    this.activities = this.routine.activities.slice(0, totalCount);

    this.placedCount = 0;
    this.attempts = 0;
    this.errors = 0;
    this.startTime = Date.now();
    this.soundEnabled = this.loadSoundPreference();

    this.renderHeader();
    this.renderProgress();
    this.renderSlots();
    this.renderCards();
    this.createFeedbackText();
    this.createSelectionText();
    this.renderSoundToggle();

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (gameObject.getData('locked')) return;
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragstart', (pointer, gameObject) => {
      if (!gameObject || gameObject.getData('locked')) return;
      this.setSelectedCard(gameObject);
      gameObject.setDepth(20);
    });

    this.input.on('drop', (pointer, gameObject, dropZone) => {
      if (!gameObject || !dropZone || gameObject.getData('locked')) return;
      const slotIndex = dropZone.getData('index');
      this.handleDrop(gameObject, slotIndex);
    });

    this.input.on('dragend', (pointer, gameObject, dropped) => {
      if (!gameObject || gameObject.getData('locked')) return;
      const overlappingSlotIndex = this.findDropSlotForCard(gameObject);

      if (overlappingSlotIndex !== null) {
        this.handleDrop(gameObject, overlappingSlotIndex);
        return;
      }

      if (!dropped) {
        this.resetCardPosition(gameObject);
      }
    });

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: {
          type: 'routine_start',
          routineId: this.routine.id,
          routineType: this.routine.id,
          activities: this.activities,
          activitiesCount: this.activities.length
        }
      });
    }
  }

  renderHeader() {
    const { width } = this.scale;
    this.add.rectangle(width / 2, 55, width - 120, 80, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xdbeafe);

    this.add.text(width / 2, 40, this.routine.label, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#0f172a'
    }).setOrigin(0.5);

    this.add.text(width / 2, 68, `Nivel ${this.levelConfig.levelId} - ${this.levelConfig.label}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#64748b'
    }).setOrigin(0.5);
  }

  renderProgress() {
    const { width } = this.scale;
    this.add.text(60, 110, 'Progresso', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#475569'
    });

    const barWidth = width - 120;
    this.progressBarWidth = barWidth;
    this.add.rectangle(width / 2, 135, barWidth, 14, 0xe2e8f0).setOrigin(0.5);
    this.progressFill = this.add.rectangle(width / 2 - barWidth / 2, 135, 0, 14, 0x22c55e).setOrigin(0, 0.5);

    this.progressText = this.add.text(width - 60, 110, '0%', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#475569'
    }).setOrigin(1, 0);
  }

  getBoardLayout() {
    const { width, height } = this.scale;
    const count = Math.max(this.activities.length, 1);
    const isCompact = width < 800;
    const slotWidth = isCompact ? width - 180 : 280;
    const cardWidth = isCompact ? width - 180 : 280;
    const baseHeight = isCompact ? 50 : 54;
    const rowHeight = Math.max(40, baseHeight - Math.max(0, count - 5) * 4);
    const startY = 242;
    const maxY = height - 56;
    const gapY = count > 1
      ? Math.max(rowHeight + 4, Math.floor((maxY - startY) / (count - 1)))
      : 0;

    return {
      isCompact,
      slotWidth,
      cardWidth,
      rowHeight,
      startY,
      gapY
    };
  }

  renderSlots() {
    const { width } = this.scale;
    const { isCompact, slotWidth, rowHeight, startY, gapY } = this.getBoardLayout();
    const startX = isCompact ? width / 2 : width - slotWidth / 2 - 60;

    this.slots = this.activities.map((activity, index) => {
      const y = startY + index * gapY;
      const slot = this.add.rectangle(startX, y, slotWidth, rowHeight, SLOT_DEFAULT_FILL)
        .setStrokeStyle(2, SLOT_DEFAULT_STROKE)
        .setInteractive(
          createCenteredHitArea(slotWidth, rowHeight),
          Phaser.Geom.Rectangle.Contains
        );
      const zone = this.add.zone(startX, y, slotWidth + 72, rowHeight + 24)
        .setRectangleDropZone(slotWidth + 72, rowHeight + 24);
      zone.setData('index', index);
      zone.setData('filled', false);
      zone.setData('card', null);
      zone.setData('status', 'empty');

      const label = this.add.text(startX - slotWidth / 2 + 16, y, `${index + 1}.`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#94a3b8'
      }).setOrigin(0, 0.5);

      const hintText = this.add.text(startX, y, 'Toque aqui', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#94a3b8',
        align: 'center'
      }).setOrigin(0.5);
      const touchCue = createTouchCue(this, startX + slotWidth / 2 - 28, y);

      slot.on('pointerdown', () => this.handleSlotPress(index));
      label.setInteractive({ useHandCursor: true });
      label.on('pointerdown', () => this.handleSlotPress(index));
      hintText.setInteractive({ useHandCursor: true });
      hintText.on('pointerdown', () => this.handleSlotPress(index));
      touchCue.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);
      touchCue.on('pointerdown', () => this.handleSlotPress(index));

      return { rect: slot, zone, label, hintText, touchCue, index };
    });

    this.refreshAllSlots();
  }

  renderCards() {
    const { width } = this.scale;
    const { isCompact, cardWidth, rowHeight, startY, gapY } = this.getBoardLayout();
    const startX = isCompact ? width / 2 : 140;
    const iconSize = isCompact ? 28 : 32;
    const iconPadding = 16;
    const fontSize = isCompact ? '14px' : '16px';

    const shuffled = Phaser.Utils.Array.Shuffle([...this.activities]);

    this.cards = shuffled.map((activity, index) => {
      const y = startY + index * gapY;
      const container = this.add.container(startX, y);
      const bg = this.add.rectangle(0, 0, cardWidth, rowHeight, CARD_DEFAULT_FILL)
        .setStrokeStyle(2, CARD_DEFAULT_STROKE);

      container.add(bg);

      const textureKey = ACTIVITY_TEXTURES[activity.id];
      const hasTexture = textureKey && this.textures.exists(textureKey);
      let textX = 0;
      let textOrigin = 0.5;
      let icon = null;

      if (hasTexture) {
        icon = this.add.image(-cardWidth / 2 + iconPadding + iconSize / 2, 0, textureKey);
        icon.setDisplaySize(iconSize, iconSize);
        container.add(icon);
        textX = -cardWidth / 2 + iconPadding + iconSize + 12;
        textOrigin = 0;
      }

      const text = this.add.text(textX, 0, activity.label, {
        fontFamily: 'Arial',
        fontSize,
        color: '#92400e',
        align: hasTexture ? 'left' : 'center'
      }).setOrigin(textOrigin, 0.5);

      container.add(text);
      container.setSize(cardWidth, rowHeight);
      container.setInteractive(
        createCenteredHitArea(cardWidth, rowHeight),
        Phaser.Geom.Rectangle.Contains
      );
      this.input.setDraggable(container);
      container.setData('activity', activity);
      container.setData('startX', startX);
      container.setData('startY', y);
      container.setData('locked', false);
      container.setData('slotIndex', null);
      container.setData('background', bg);
      container.setData('labelText', text);
      container.setData('icon', icon);
      this.bindCardInteractions(container);
      this.refreshCardVisual(container);

      return container;
    });
  }

  createFeedbackText() {
    const { width } = this.scale;
    this.feedbackText = this.add.text(width / 2, 152, '', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#2563eb'
    }).setOrigin(0.5);
  }

  createSelectionText() {
    const { width } = this.scale;
    const panelWidth = Math.min(width - 320, 500);
    const panelLeft = 60;
    const panelCenterX = panelLeft + (panelWidth / 2);

    this.selectionPanel = this.add.rectangle(panelCenterX, 190, panelWidth, 42, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xdbeafe);

    this.selectionBadge = this.add.text(panelLeft + 52, 190, 'Passo 1', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#1d4ed8',
      backgroundColor: '#dbeafe',
      padding: { left: 10, right: 10, top: 6, bottom: 6 }
    }).setOrigin(0.5);

    this.selectionText = this.add.text(panelCenterX + 36, 184, 'Toque em um item.', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#0f172a',
      align: 'center'
    }).setOrigin(0.5);

    this.selectionCaption = this.add.text(panelCenterX + 36, 198, 'Depois toque no numero da sequencia para posicionar.', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#475569',
      align: 'center'
    }).setOrigin(0.5);
  }

  renderSoundToggle() {
    const { width } = this.scale;

    this.soundToggle = this.add.rectangle(width - 150, 190, 210, 42, 0xffffff, 0.92)
      .setStrokeStyle(2, 0xdbeafe)
      .setInteractive({ useHandCursor: true });

    this.soundToggleDot = this.add.circle(width - 235, 190, 6, 0x94a3b8);
    this.soundToggleText = this.add.text(width - 222, 190, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#334155'
    }).setOrigin(0, 0.5);

    this.soundToggle.on('pointerdown', () => this.toggleSoftSound());
    this.soundToggleText.setInteractive({ useHandCursor: true });
    this.soundToggleText.on('pointerdown', () => this.toggleSoftSound());
    this.soundToggleDot.setInteractive({ useHandCursor: true });
    this.soundToggleDot.on('pointerdown', () => this.toggleSoftSound());

    this.updateSoundToggle();
  }

  updateSoundToggle() {
    if (!this.soundToggle || !this.soundToggleText || !this.soundToggleDot) return;

    if (this.soundEnabled) {
      this.soundToggle.setFillStyle(0xecfdf5, 0.98);
      this.soundToggle.setStrokeStyle(2, 0x86efac);
      this.soundToggleDot.setFillStyle(0x22c55e);
      this.soundToggleText.setText('Som suave ligado');
      this.soundToggleText.setColor('#166534');
      return;
    }

    this.soundToggle.setFillStyle(0xffffff, 0.92);
    this.soundToggle.setStrokeStyle(2, 0xdbeafe);
    this.soundToggleDot.setFillStyle(0x94a3b8);
    this.soundToggleText.setText('Som suave desligado');
    this.soundToggleText.setColor('#334155');
  }

  loadSoundPreference() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    return window.localStorage.getItem('autisconnect_game4_soft_sound') === '1';
  }

  saveSoundPreference() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem('autisconnect_game4_soft_sound', this.soundEnabled ? '1' : '0');
  }

  toggleSoftSound() {
    this.soundEnabled = !this.soundEnabled;
    this.saveSoundPreference();
    this.updateSoundToggle();
    this.showFeedback(
      this.soundEnabled ? 'Som suave ativado.' : 'Som suave desligado.',
      this.soundEnabled ? '#166534' : '#475569'
    );

    if (this.soundEnabled) {
      this.playSoftConfirmationTone(440, 0.14, 0.015);
    }
  }

  playSoftConfirmationTone(frequency = 520, durationSeconds = 0.16, volume = 0.018) {
    if (!this.soundEnabled || typeof window === 'undefined') {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    if (!GameScene.sharedAudioContext) {
      GameScene.sharedAudioContext = new AudioContextClass();
    }

    const context = GameScene.sharedAudioContext;
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume().catch(() => {});
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startTime = context.currentTime;
    const stopTime = startTime + durationSeconds;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.linearRampToValueAtTime(frequency * 1.04, stopTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(stopTime + 0.02);
  }

  updateSelectionText() {
    if (!this.selectionText || !this.selectionCaption || !this.selectionBadge || !this.selectionPanel) return;

    if (!this.selectedCard) {
      this.selectionBadge.setText('Passo 1');
      this.selectionBadge.setColor('#1d4ed8');
      this.selectionBadge.setBackgroundColor('#dbeafe');
      this.selectionPanel.setStrokeStyle(2, 0xdbeafe);
      this.selectionText.setText('Toque em um item.');
      this.selectionText.setColor('#0f172a');
      this.selectionCaption.setText('Depois toque no numero da sequencia para posicionar.');
      this.selectionCaption.setColor('#475569');
      return;
    }

    const activity = this.selectedCard.getData('activity');
    this.selectionBadge.setText('Passo 2');
    this.selectionBadge.setColor('#166534');
    this.selectionBadge.setBackgroundColor('#dcfce7');
    this.selectionPanel.setStrokeStyle(2, SLOT_ACTIVE_STROKE);
    this.selectionText.setText(`Item selecionado: ${activity?.label || 'atividade'}.`);
    this.selectionText.setColor('#1d4ed8');
    this.selectionCaption.setText('Agora toque no quadrante onde deseja colocar esse item.');
    this.selectionCaption.setColor('#2563eb');
  }

  refreshCardVisual(card) {
    if (!card) return;

    const background = card.getData('background');
    const labelText = card.getData('labelText');
    const icon = card.getData('icon');

    if (!background || !labelText) return;

    if (card === this.selectedCard) {
      background.setFillStyle(CARD_SELECTED_FILL);
      background.setStrokeStyle(3, CARD_SELECTED_STROKE);
      labelText.setColor('#1d4ed8');
      if (icon) {
        icon.setTint(0x2563eb);
      }
      return;
    }

    if (card.getData('locked')) {
      background.setFillStyle(CARD_LOCKED_FILL);
      background.setStrokeStyle(2, CARD_LOCKED_STROKE);
      labelText.setColor('#0f766e');
      if (icon) {
        icon.clearTint();
      }
      return;
    }

    background.setFillStyle(CARD_DEFAULT_FILL);
    background.setStrokeStyle(2, CARD_DEFAULT_STROKE);
    labelText.setColor('#92400e');
    if (icon) {
      icon.clearTint();
    }
  }

  bindCardInteractions(card) {
    if (!card) return;

    const background = card.getData('background');
    const labelText = card.getData('labelText');
    const icon = card.getData('icon');
    const onPress = () => this.handleCardPress(card);

    card.on('pointerdown', onPress);

    if (background) {
      background.setInteractive(
        createCenteredHitArea(card.width, card.height),
        Phaser.Geom.Rectangle.Contains
      );
      background.on('pointerdown', onPress);
    }

    if (labelText) {
      labelText.setInteractive({ useHandCursor: true });
      labelText.on('pointerdown', onPress);
    }

    if (icon) {
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerdown', onPress);
    }
  }

  setSelectedCard(card) {
    const nextSelectedCard = this.selectedCard === card ? null : card;
    const previousSelectedCard = this.selectedCard;
    this.selectedCard = nextSelectedCard;
    this.refreshCardVisual(previousSelectedCard);
    this.refreshCardVisual(nextSelectedCard);
    this.updateSelectionText();
    this.refreshAllSlots();
  }

  stopSlotPromptTween(index) {
    const tween = this.slotHintTweens.get(index);
    if (tween) {
      tween.remove();
      this.slotHintTweens.delete(index);
    }
  }

  refreshSlotVisual(slot) {
    if (!slot) return;

    const slotCard = slot.zone.getData('card');
    const isFilled = slot.zone.getData('filled');
    const slotStatus = slot.zone.getData('status');
    const shouldPrompt = Boolean(this.selectedCard) && !isFilled;

    this.stopSlotPromptTween(slot.index);
    slot.rect.setScale(1);
    slot.hintText.setScale(1);
    slot.touchCue.setScale(1);
    slot.rect.setAlpha(1);
    slot.hintText.setAlpha(1);
    slot.touchCue.setAlpha(1);

    if (slotCard) {
      if (slotStatus === 'correct') {
        slot.rect.setStrokeStyle(2, SLOT_SUCCESS_STROKE);
        slot.rect.setFillStyle(SLOT_SUCCESS_FILL);
        slot.label.setColor('#16a34a');
        slot.hintText.setText('Correto');
        slot.hintText.setColor('#16a34a');
      } else if (slotStatus === 'incorrect') {
        slot.rect.setStrokeStyle(2, SLOT_INCORRECT_STROKE);
        slot.rect.setFillStyle(SLOT_INCORRECT_FILL);
        slot.label.setColor('#ea580c');
        slot.hintText.setText('Pode trocar');
        slot.hintText.setColor('#ea580c');
      } else {
        slot.rect.setStrokeStyle(2, SLOT_FILLED_STROKE);
        slot.rect.setFillStyle(SLOT_FILLED_FILL);
        slot.label.setColor('#0284c7');
        slot.hintText.setText('Item colocado');
        slot.hintText.setColor('#0284c7');
      }
      slot.touchCue.setVisible(false);
      return;
    }

    if (shouldPrompt) {
      slot.rect.setStrokeStyle(3, SLOT_ACTIVE_STROKE);
      slot.rect.setFillStyle(SLOT_ACTIVE_FILL);
      slot.label.setColor('#2563eb');
      slot.hintText.setText('Toque para colocar');
      slot.hintText.setColor('#2563eb');
      slot.touchCue.setVisible(true);
      slot.touchCue.setAlpha(1);

      const tween = this.tweens.add({
        targets: [slot.rect, slot.hintText, slot.touchCue],
        scaleX: 1.02,
        scaleY: 1.06,
        alpha: 0.92,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
      this.slotHintTweens.set(slot.index, tween);
      return;
    }

    slot.rect.setStrokeStyle(2, SLOT_DEFAULT_STROKE);
    slot.rect.setFillStyle(SLOT_DEFAULT_FILL);
    slot.label.setColor('#94a3b8');
    slot.hintText.setText('Toque aqui');
    slot.hintText.setColor('#94a3b8');
    slot.touchCue.setVisible(false);
  }

  refreshAllSlots() {
    this.slots.forEach((slot) => this.refreshSlotVisual(slot));
  }

  evaluateSequenceIfReady() {
    if (this.placedCount < this.activities.length) {
      return;
    }

    const incorrectSlots = [];
    const incorrectActivityIds = [];

    this.slots.forEach((slot) => {
      const card = slot.zone.getData('card');
      const activity = card?.getData('activity');
      const expected = this.activities[slot.index];
      const isCorrect = activity?.id === expected?.id;

      slot.zone.setData('status', isCorrect ? 'correct' : 'incorrect');

      if (!isCorrect) {
        incorrectSlots.push(slot.index);
        if (activity?.id) {
          incorrectActivityIds.push(activity.id);
        }
      }
    });

    this.refreshAllSlots();

    const onEvent = this.game.registry.get('onEvent');

    if (incorrectSlots.length === 0) {
      if (onEvent) {
        onEvent({
          eventType: 'regulation_success',
          data: {
            type: 'routine_sequence_correct',
            correctCount: this.activities.length
          }
        });
      }
      this.showFeedback('Sequencia completa! Muito bem!', '#16a34a');
      this.scheduleFinishIfReady();
      return;
    }

    this.errors += incorrectSlots.length;
    this.cancelFinishIfPending();
    this.showFeedback('Alguns itens precisam trocar de lugar.', '#f97316');
    incorrectSlots.forEach((slotIndex) => this.highlightSlot(slotIndex));

    if (onEvent) {
      onEvent({
        eventType: 'dysregulation',
        data: {
          type: 'sequence_needs_adjustment',
          incorrectCount: incorrectSlots.length,
          incorrectSlots,
          incorrectActivityIds
        }
      });
    }
  }

  handleCardPress(card) {
    if (!card) return;

    if (card.getData('locked')) {
      const slotIndex = card.getData('slotIndex');
      const slot = this.slots.find((item) => item.index === slotIndex);
      if (slot) {
        this.releaseCardFromSlot(slot, { selectCard: true });
        this.showFeedback('Item liberado. Escolha um novo quadrante.', '#2563eb');
      }
      return;
    }

    this.setSelectedCard(card);
    if (this.selectedCard) {
      this.showFeedback('Item selecionado. Agora toque no quadrante desejado.', '#2563eb');
    }
  }

  handleSlotPress(slotIndex) {
    const slot = this.slots.find((item) => item.index === slotIndex);
    if (!slot) return;

    const slotCard = slot.zone.getData('card');

    if (slotCard && (!this.selectedCard || this.selectedCard === slotCard)) {
      this.releaseCardFromSlot(slot, { selectCard: true });
      this.showFeedback('Item removido. Toque em outro quadrante para reposicionar.', '#2563eb');
      return;
    }

    if (slotCard && this.selectedCard && this.selectedCard !== slotCard) {
      this.releaseCardFromSlot(slot, { selectCard: false });
    }

    if (!this.selectedCard) {
      this.showFeedback('Escolha um item primeiro.', '#2563eb');
      return;
    }

    this.handleDrop(this.selectedCard, slotIndex);
  }

  releaseCardFromSlot(slot, options = {}) {
    if (!slot) return;

    const card = slot.zone.getData('card');
    if (!card) return;

    slot.zone.setData('filled', false);
    slot.zone.setData('card', null);
    slot.zone.setData('status', 'empty');
    slot.rect.setStrokeStyle(2, SLOT_DEFAULT_STROKE);
    slot.rect.setFillStyle(SLOT_DEFAULT_FILL);

    card.setData('locked', false);
    card.setData('slotIndex', null);
    this.placedCount = Math.max(0, this.placedCount - 1);
    this.cancelFinishIfPending();
    this.resetCardPosition(card);
    this.updateProgress();
    this.refreshAllSlots();

    if (options.selectCard) {
      this.setSelectedCard(card);
      return;
    }

    if (this.selectedCard === card) {
      this.setSelectedCard(null);
      return;
    }

    this.refreshCardVisual(card);
  }

  handleDrop(card, slotIndex) {
    const slot = this.slots.find((item) => item.index === slotIndex);
    if (!slot) {
      this.resetCardPosition(card);
      return;
    }

    const activity = card.getData('activity');
    this.attempts += 1;
    const previousSlotIndex = card.getData('slotIndex');

    if (slot.zone.getData('card') === card) {
      this.setSelectedCard(null);
      this.refreshAllSlots();
      return;
    }

    if (previousSlotIndex !== null && previousSlotIndex !== undefined) {
      const previousSlot = this.slots.find((item) => item.index === previousSlotIndex);
      if (previousSlot && previousSlot !== slot) {
        previousSlot.zone.setData('filled', false);
        previousSlot.zone.setData('card', null);
        previousSlot.zone.setData('status', 'empty');
        this.placedCount = Math.max(0, this.placedCount - 1);
      }
    }

    if (slot.zone.getData('filled')) {
      this.releaseCardFromSlot(slot, { selectCard: false });
    }

    slot.zone.setData('filled', true);
    slot.zone.setData('card', card);
    slot.zone.setData('status', 'filled');

    card.x = slot.rect.x;
    card.y = slot.rect.y;
    card.setDepth(10);
    card.setData('locked', true);
    card.setData('slotIndex', slotIndex);
    this.setSelectedCard(null);
    this.refreshCardVisual(card);

    this.placedCount += 1;
    this.showFeedback(Phaser.Utils.Array.GetRandom(POSITIVE_MESSAGES), '#16a34a');
    this.playSoftConfirmationTone(520, 0.16, 0.018);
    this.updateProgress();
    this.refreshAllSlots();

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: {
          type: 'card_placed',
          activityId: activity?.id,
          slotIndex
        }
      });
    }

    this.evaluateSequenceIfReady();
  }

  resetCardPosition(card) {
    const startX = card.getData('startX');
    const startY = card.getData('startY');
    this.tweens.add({
      targets: card,
      x: startX,
      y: startY,
      duration: 180,
      ease: 'Quad.Out'
    });
    card.setDepth(1);
  }

  findDropSlotForCard(card) {
    if (!card) return null;

    const cardBounds = card.getBounds();
    const slots = this.slots.map((slot) => ({
      index: slot.index,
      filled: slot.zone.getData('filled'),
      bounds: slot.zone.getBounds()
    }));

    return resolveDropSlotIndex(cardBounds, slots);
  }

  cancelFinishIfPending() {
    if (this.finishTimer) {
      this.finishTimer.remove(false);
      this.finishTimer = null;
    }
  }

  scheduleFinishIfReady() {
    this.cancelFinishIfPending();

    if (this.placedCount < this.activities.length) {
      return;
    }

    this.finishTimer = this.time.delayedCall(800, () => {
      this.finishTimer = null;
      this.finishRoutine();
    });
  }

  highlightSlot(index) {
    const slot = this.slots[index];
    if (!slot) return;
    slot.hintText.setText('Tente este');
    slot.hintText.setColor('#f97316');
    slot.touchCue.setVisible(true);
    slot.touchCue.setAlpha(1);
    this.tweens.add({
      targets: [slot.rect, slot.hintText, slot.touchCue],
      alpha: 0.6,
      yoyo: true,
      duration: 120,
      repeat: 3,
      onComplete: () => {
        slot.rect.setAlpha(1);
        slot.hintText.setAlpha(1);
        this.refreshSlotVisual(slot);
      }
    });
  }

  showFeedback(message, color) {
    if (!this.feedbackText) return;
    this.feedbackText.setText(message);
    this.feedbackText.setColor(color);
    this.feedbackText.setAlpha(1);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.Out'
    });
  }

  updateProgress() {
    if (!this.progressFill || !this.progressText) return;
    const percent = this.activities.length > 0 ? (this.placedCount / this.activities.length) : 0;
    const barWidth = this.progressBarWidth || (this.scale.width - 120);
    const fillWidth = barWidth * percent;
    this.progressFill.width = fillWidth;
    this.progressText.setText(`${Math.round(percent * 100)}%`);
  }

  finishRoutine(abandoned = false) {
    const durationMs = Date.now() - this.startTime;

    if (!abandoned) {
      this.playSoftConfirmationTone(523, 0.18, 0.02);
      this.time.delayedCall(110, () => this.playSoftConfirmationTone(659, 0.2, 0.018));
    }

    const onEvent = this.game.registry.get('onEvent');
    if (onEvent) {
      onEvent({
        eventType: 'trigger',
        data: {
          type: 'routine_complete',
          routineId: this.routine.id,
          routineType: this.routine.id,
          durationMs,
          attempts: this.attempts,
          errors: this.errors
        }
      });
    }

    const summary = {
      routineLabel: this.routine.label,
      placedCount: this.placedCount,
      total: this.activities.length,
      attempts: this.attempts,
      errors: this.errors,
      durationMs,
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
    const durationSeconds = summary.durationMs ? Math.round(summary.durationMs / 1000) : 0;
    const isCompleted = !summary.abandoned;

    this.add.rectangle(0, 0, width, height, 0xf8fafc).setOrigin(0);

    this.add.text(width / 2, height / 2 - 90, summary.abandoned ? 'Sessao encerrada' : 'Rotina concluida', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#0f172a'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, summary.routineLabel || '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#475569'
    }).setOrigin(0.5);

    if (isCompleted) {
      this.add.rectangle(width / 2, height / 2 - 4, 220, 34, 0xdcfce7)
        .setStrokeStyle(2, 0x22c55e);

      this.add.text(width / 2, height / 2 - 4, 'Sequencia correta', {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#166534'
      }).setOrigin(0.5);
    }

    this.add.text(width / 2, height / 2 + 28, `Acertos: ${summary.placedCount || 0}/${summary.total || 0}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#475569'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 56, `Erros: ${summary.errors || 0} | Tempo: ${durationSeconds}s`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#64748b'
    }).setOrigin(0.5);

    if (isCompleted) {
      this.add.text(width / 2, height / 2 + 82, 'Toque em Finalizar para liberar o proximo nivel.', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#2563eb'
      }).setOrigin(0.5);
    }

    const button = this.add.rectangle(width / 2, height / 2 + 122, 220, 52, 0x2563eb)
      .setStrokeStyle(2, 0x1d4ed8)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height / 2 + 122, 'Finalizar', {
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

export const createGame4Game = (containerElement, options = {}) => {
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
        if (options.customRoutines) {
          game.registry.set('customRoutines', options.customRoutines);
        }
      }
    },
    scene: [PreloadScene, MenuScene, GameScene, ResultScene]
  };

  return new Phaser.Game(config);
};
