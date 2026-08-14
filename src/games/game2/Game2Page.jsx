import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { ArrowRepeat, ArrowRightCircle, EmojiSmile, XCircle } from 'react-bootstrap-icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { createGame2Game } from './game2Phaser';
import { getLevelConfig } from './levelConfig';
import TherapeuticGameLayout from '../shared/TherapeuticGameLayout';

const buildSocketUrl = (baseUrl) => {
  if (!baseUrl) return undefined;
  return baseUrl.replace(/\/api\/?$/, '');
};

const Game2Page = () => {
  const { patientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const levelId = useMemo(() => {
    const raw = searchParams.get('level');
    const parsed = parseInt(raw || '1', 10);
    return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [searchParams]);

  const assetImages = useMemo(() => {
    const modules = import.meta.glob('../../assets/game2_*.{png,jpg,jpeg}', {
      eager: true,
      import: 'default'
    });
    const mapped = {};
    Object.entries(modules).forEach(([path, src]) => {
      const match = path.match(/game2_(.+)\.(png|jpe?g)$/i);
      if (match) {
        mapped[`mission_${match[1]}`] = src;
      }
    });
    return mapped;
  }, []);

  const storedImages = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`autisconnect_game2_images_${patientId}`) || '{}');
    } catch (err) {
      return {};
    }
  }, [patientId]);

  const missionImages = useMemo(() => ({
    ...assetImages,
    ...storedImages
  }), [assetImages, storedImages]);

  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const pendingEventsRef = useRef([]);
  const endedRef = useRef(false);

  const [status, setStatus] = useState('iniciando');
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [nextLevelCandidate, setNextLevelCandidate] = useState(null);
  const [restartKey, setRestartKey] = useState(0);
  const supportCards = useMemo(() => ([
    {
      label: 'Foco terapêutico',
      value: 'Autonomia funcional',
      description: 'Estimula independência em rotinas concretas de vida diária.'
    },
    {
      label: 'Experiência',
      value: 'Sequência prática',
      description: 'Cada missão reforça ordem correta, atenção e execução consistente.'
    },
    {
      label: 'Aplicação clínica',
      value: 'Treino cotidiano',
      description: 'Ideal para generalização de hábitos e ações do dia a dia.'
    }
  ]), []);

  const metricsRef = useRef({
    stepsTotal: 0,
    stepsCompleted: 0,
    stepsWithoutHelp: 0,
    wrongClicks: 0,
    wrongOrder: 0,
    helpUses: 0,
    interruptions: 0,
    missionDurationMs: null,
    missionCategory: null,
    missionId: null
  });

  const flushPendingEvents = useCallback(() => {
    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;

    if (!socket || !sessionId || pendingEventsRef.current.length === 0) return;

    const pending = [...pendingEventsRef.current];
    pendingEventsRef.current = [];

    pending.forEach((payload) => {
      const withSession = payload.sessionId
        ? payload
        : { ...payload, sessionId: sessionIdRef.current };
      if (withSession.sessionId) {
        socket.emit('game-event', withSession);
      }
    });
  }, []);

  const sendEvent = useCallback((event) => {
    if (!event || !event.eventType) return;

    const timestamp = typeof event.timestamp === 'number' ? event.timestamp : Date.now();
    const payload = {
      gameId: 'game2',
      sessionId: sessionIdRef.current,
      eventType: event.eventType,
      data: event.data || null,
      timestamp
    };

    const metrics = metricsRef.current;

    switch (event.eventType) {
      case 'trigger':
        if (event.data?.type === 'mission_start') {
          metrics.stepsTotal = event.data.stepsTotal || metrics.stepsTotal;
          metrics.missionCategory = event.data.category || metrics.missionCategory;
          metrics.missionId = event.data.missionId || metrics.missionId;
        }
        if (event.data?.type === 'interruption') {
          metrics.interruptions += 1;
        }
        if (event.data?.type === 'mission_complete') {
          metrics.missionDurationMs = event.data.durationMs || metrics.missionDurationMs;
        }
        break;
      case 'regulation_success':
        if (event.data?.type === 'step_complete') {
          metrics.stepsCompleted += 1;
          if (event.data?.withoutHelp) {
            metrics.stepsWithoutHelp += 1;
          }
        }
        break;
      case 'dysregulation':
        metrics.wrongClicks += 1;
        if (event.data?.wrongOrder) {
          metrics.wrongOrder += 1;
        }
        break;
      case 'strategy_choice':
        if (event.data?.strategy === 'help') {
          metrics.helpUses += 1;
        }
        break;
      case 'abandon':
        break;
      default:
        break;
    }

    const socket = socketRef.current;
    if (socket && socket.connected && payload.sessionId) {
      socket.emit('game-event', payload);
    } else {
      pendingEventsRef.current.push(payload);
    }
  }, []);

  const finalizeSession = useCallback(async ({ reason } = {}) => {
    if (endedRef.current) return;
    endedRef.current = true;

    if (reason === 'abandon') {
      sendEvent({ eventType: 'abandon', data: { reason: 'user_quit' } });
    }

    const metrics = metricsRef.current;
    const totalSteps = metrics.stepsTotal || metrics.stepsCompleted || 0;
    const successRate = totalSteps > 0
      ? Number(((metrics.stepsWithoutHelp / totalSteps) * 100).toFixed(2))
      : 0;

    const frustrationScore = Math.min(100, metrics.wrongClicks * 12 + metrics.interruptions * 15);
    const missionDurationSeconds = metrics.missionDurationMs
      ? Number((metrics.missionDurationMs / 1000).toFixed(1))
      : null;
    const engagementScore = Math.min(100, metrics.stepsCompleted * 15 + metrics.helpUses * 5);

    const payload = {
      sessionId: sessionIdRef.current,
      metrics: {
        levelId,
        successRate,
        levelProgress: [
          {
            levelNumber: levelId,
            strategiesUsed: {
              missionId: metrics.missionId,
              missionCategory: metrics.missionCategory,
              stepsTotal: totalSteps,
              stepsCompleted: metrics.stepsCompleted,
              stepsWithoutHelp: metrics.stepsWithoutHelp,
              helpUses: metrics.helpUses,
              wrongOrder: metrics.wrongOrder,
              interruptions: metrics.interruptions,
              frustrationScore
            },
            regulationTimeSeconds: missionDurationSeconds,
            dysregulations: metrics.wrongOrder,
            engagementScore
          }
        ]
      }
    };

    try {
      const levelConfig = getLevelConfig(levelId);
      const unlockThreshold = levelConfig.unlockThreshold ?? 70;
      const passed = reason !== 'abandon' && successRate >= unlockThreshold;
      const nextLevel = levelId + 1;

      if (passed && nextLevel <= 5) {
        payload.metrics.unlockedLevel = nextLevel;
      }

      if (payload.sessionId) {
        await api.post('/games/game2/end-session', payload);
      }

      if (passed && nextLevel <= 5) {
        const storageKey = `autisconnect_game2_unlocked_${patientId}`;
        const currentUnlocked = parseInt(localStorage.getItem(storageKey) || '1', 10);
        if (!Number.isNaN(currentUnlocked) && nextLevel > currentUnlocked) {
          localStorage.setItem(storageKey, String(nextLevel));
        }
        setStatus('aguardando');
        setStatusMessage(`Nível ${levelId} concluído com sucesso.`);
        setNextLevelCandidate(nextLevel);
        setShowAdvanceModal(true);
        return;
      }

      setStatus('finalizado');
      if (passed && nextLevel > 5) {
        setStatusMessage('Nível máximo concluído com sucesso.');
      } else if (reason === 'abandon') {
        setStatusMessage('Sessão encerrada.');
      } else {
        setStatusMessage(passed ? 'Nível concluído com sucesso.' : 'Sessão finalizada.');
      }
    } catch (err) {
      console.error('[GAME2] Erro ao finalizar sessão:', err);
      setError('Não foi possível salvar a sessão.');
    }
  }, [levelId, patientId, sendEvent]);

  const resetRunState = useCallback(() => {
    metricsRef.current = {
      stepsTotal: 0,
      stepsCompleted: 0,
      stepsWithoutHelp: 0,
      wrongClicks: 0,
      wrongOrder: 0,
      helpUses: 0,
      interruptions: 0,
      missionDurationMs: null,
      missionCategory: null,
      missionId: null
    };
    pendingEventsRef.current = [];
    sessionIdRef.current = null;
    endedRef.current = false;
    setStatus('iniciando');
    setError(null);
    setStatusMessage('');
    setShowAdvanceModal(false);
    setNextLevelCandidate(null);
  }, []);

  const handleAdvanceConfirm = useCallback(() => {
    if (!nextLevelCandidate) {
      setShowAdvanceModal(false);
      return;
    }
    setShowAdvanceModal(false);
    setStatus('avancando');
    setStatusMessage(`Indo para o nível ${nextLevelCandidate}...`);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('level', String(nextLevelCandidate));
    setSearchParams(nextParams);
  }, [nextLevelCandidate, searchParams, setSearchParams]);

  const handleRepeatLevel = useCallback(() => {
    setShowAdvanceModal(false);
    setStatus('reiniciando');
    setStatusMessage(`Repetindo nível ${levelId}...`);
    setRestartKey((value) => value + 1);
  }, [levelId]);

  const handleAdvanceCancel = useCallback(() => {
    setShowAdvanceModal(false);
    setNextLevelCandidate(null);
    setStatus('finalizado');
    setStatusMessage('Sessão finalizada.');
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    resetRunState();

    const game = createGame2Game(containerRef.current, { levelId, missionImages });
    gameRef.current = game;

    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, [levelId, resetRunState, restartKey]);

  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.registry.set('onEvent', sendEvent);
    gameRef.current.registry.set('onSessionComplete', finalizeSession);
    gameRef.current.registry.set('levelId', levelId);
  }, [sendEvent, finalizeSession, levelId]);

  useEffect(() => {
    const parsedPatientId = parseInt(patientId, 10);
    if (Number.isNaN(parsedPatientId) || parsedPatientId <= 0) {
      setError('patientId inválido');
      return undefined;
    }

    let isMounted = true;

    const startSession = async () => {
      try {
        setStatus('iniciando');
        const response = await api.post('/games/game2/start-session', {
          patientId: parsedPatientId,
          levelId,
          gameKey: 'game2'
        });

        if (!isMounted) return;

        sessionIdRef.current = response.data?.sessionId;
        setStatus('rodando');

        const socketUrl = buildSocketUrl(api.defaults.baseURL);
        socketRef.current = io(socketUrl, {
          transports: ['websocket']
        });

        socketRef.current.on('connect', flushPendingEvents);

        flushPendingEvents();
      } catch (err) {
        console.error('[GAME2] Erro ao iniciar sessão:', err);
        if (isMounted) {
          setError('Não foi possível iniciar o jogo.');
          setStatus('erro');
        }
      }
    };

    startSession();

    return () => {
      isMounted = false;
      if (!endedRef.current) {
        finalizeSession({ reason: 'abandon' });
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [patientId, levelId, sendEvent, finalizeSession, flushPendingEvents]);

  return (
    <TherapeuticGameLayout
      tone="autonomy"
      title="Autonomia na Vida Diária"
      subtitle="Sequências práticas do cotidiano para reforçar independência, atenção e execução funcional em um ambiente terapêutico seguro."
      patientId={patientId}
      levelId={levelId}
      maxLevel={5}
      status={status}
      error={error}
      statusMessage={statusMessage}
      onExit={() => navigate(-1)}
      stageTitle="Missões funcionais do dia a dia"
      stageDescription="Complete rotinas em ordem correta e no seu tempo, com coleta de eventos para análise do desempenho e do nível de ajuda."
      supportCards={supportCards}
      footer="Missão de autonomia: complete cada passo com foco em independência, organização e generalização de habilidades de vida diária."
    >
      <div ref={containerRef} className="ac-game-canvas-host" />

      <Modal show={showAdvanceModal} onHide={handleAdvanceCancel} centered className="ac-game-advance-modal">
        <Modal.Body>
          <div className="ac-game-advance-hero">
            <div className="ac-game-advance-icon">
              <EmojiSmile size={40} />
            </div>
            <h5>Excelente Trabalho!</h5>
            {nextLevelCandidate ? (
              <p>Você concluiu o nível {levelId} com sucesso. Pronto para o próximo desafio?</p>
            ) : (
              <p>Nível concluído. O que deseja fazer agora?</p>
            )}
          </div>
          <div className="ac-game-advance-actions">
            <Button variant="primary" onClick={handleAdvanceConfirm}>
              <ArrowRightCircle className="me-2" /> Avançar para o Nível {nextLevelCandidate}
            </Button>
            <Button variant="outline-primary" onClick={handleRepeatLevel}>
              <ArrowRepeat className="me-2" /> Praticar Novamente
            </Button>
            <Button variant="link" className="text-muted mt-2" onClick={handleAdvanceCancel}>
              <XCircle className="me-2" /> Encerrar Sessão
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </TherapeuticGameLayout>
  );
};

export default Game2Page;
