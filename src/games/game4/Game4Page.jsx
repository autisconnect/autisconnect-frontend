import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { ArrowRepeat, ArrowRightCircle, EmojiSmile, XCircle } from 'react-bootstrap-icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { createGame4Game } from './game4Phaser';
import { getLevelConfig } from './levelConfig';
import TherapeuticGameLayout from '../shared/TherapeuticGameLayout';

const buildSocketUrl = (baseUrl) => {
  if (!baseUrl) return undefined;
  return baseUrl.replace(/\/api\/?$/, '');
};

const Game4Page = () => {
  const { patientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const levelId = useMemo(() => {
    const raw = searchParams.get('level');
    const parsed = parseInt(raw || '1', 10);
    return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [searchParams]);

  const customRoutines = useMemo(() => {
    try {
      const raw = localStorage.getItem(`autisconnect_game4_routines_${patientId}`) || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }, [patientId]);

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
      value: 'Rotina previsível',
      description: 'Reforça organização temporal, sequência correta e antecipação de atividades.'
    },
    {
      label: 'Experiência',
      value: 'Sequência visual',
      description: 'As tarefas trabalham ordenação e consistência em cenários cotidianos.'
    },
    {
      label: 'Aplicação clínica',
      value: 'Autonomia estruturada',
      description: 'Ajuda a consolidar hábitos com maior previsibilidade e segurança.'
    }
  ]), []);

  const metricsRef = useRef({
    totalActivities: 0,
    attempts: 0,
    errors: 0,
    errorActivityCounts: {},
    routineType: null,
    routineId: null,
    activities: [],
    completionMs: null,
    sequenceCompleted: false
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
      gameId: 'game4',
      sessionId: sessionIdRef.current,
      eventType: event.eventType,
      data: event.data || null,
      timestamp
    };

    const metrics = metricsRef.current;

    switch (event.eventType) {
      case 'trigger':
        if (event.data?.type === 'routine_start') {
          metrics.totalActivities = event.data.activitiesCount || metrics.totalActivities;
          metrics.routineType = event.data.routineType || metrics.routineType;
          metrics.routineId = event.data.routineId || metrics.routineId;
          metrics.activities = Array.isArray(event.data.activities) ? event.data.activities : metrics.activities;
        }
        if (event.data?.type === 'routine_complete') {
          metrics.completionMs = event.data.durationMs || metrics.completionMs;
        }
        if (event.data?.type === 'card_placed') {
          metrics.attempts += 1;
        }
        break;
      case 'regulation_success':
        if (event.data?.type === 'routine_sequence_correct') {
          metrics.sequenceCompleted = true;
        }
        break;
      case 'dysregulation':
        metrics.errors += event.data?.incorrectCount || 1;
        if (event.data?.activityId) {
          const key = event.data.activityId;
          metrics.errorActivityCounts[key] = (metrics.errorActivityCounts[key] || 0) + 1;
        }
        if (Array.isArray(event.data?.incorrectActivityIds)) {
          event.data.incorrectActivityIds.forEach((activityId) => {
            if (!activityId) return;
            metrics.errorActivityCounts[activityId] = (metrics.errorActivityCounts[activityId] || 0) + 1;
          });
        }
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
    const totalActivities = metrics.totalActivities || (metrics.activities ? metrics.activities.length : 0) || 0;
    const attempts = metrics.attempts || totalActivities;
    const errors = metrics.errors || 0;
    const completedSuccessfully = reason !== 'abandon' && metrics.sequenceCompleted;
    const successRate = completedSuccessfully
      ? 100
      : (
        attempts > 0
          ? Number(((totalActivities / attempts) * 100).toFixed(2))
          : 0
      );

    const completionSeconds = metrics.completionMs
      ? Number((metrics.completionMs / 1000).toFixed(1))
      : null;

    const engagementScore = Math.min(100, Math.round(successRate));

    const payload = {
      sessionId: sessionIdRef.current,
      metrics: {
        levelId,
        successRate,
        levelProgress: [
          {
            levelNumber: levelId,
            strategiesUsed: {
              routineType: metrics.routineType,
              routineId: metrics.routineId,
              activities: metrics.activities,
              attempts,
              errors,
              errorActivityCounts: metrics.errorActivityCounts,
              completionTimeSeconds: completionSeconds
            },
            regulationTimeSeconds: completionSeconds,
            dysregulations: errors,
            engagementScore
          }
        ]
      }
    };

    try {
      const levelConfig = getLevelConfig(levelId);
      const unlockThreshold = levelConfig.unlockThreshold ?? 70;
      const passed = completedSuccessfully || (reason !== 'abandon' && successRate >= unlockThreshold);
      const nextLevel = levelId + 1;

      if (passed && nextLevel <= 3) {
        payload.metrics.unlockedLevel = nextLevel;
      }

      if (payload.sessionId) {
        await api.post('/games/game4/end-session', payload);
      }

      if (passed && nextLevel <= 3) {
        const storageKey = `autisconnect_game4_unlocked_${patientId}`;
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
      if (passed && nextLevel > 3) {
        setStatusMessage('Nível máximo concluído com sucesso.');
      } else if (reason === 'abandon') {
        setStatusMessage('Sessão encerrada.');
      } else {
        setStatusMessage(passed ? 'Nível concluído com sucesso.' : 'Sessão finalizada.');
      }
    } catch (err) {
      console.error('[GAME4] Erro ao finalizar sessão:', err);
      setError('Não foi possível salvar a sessão.');
    }
  }, [levelId, patientId, sendEvent]);

  const resetRunState = useCallback(() => {
    metricsRef.current = {
      totalActivities: 0,
      attempts: 0,
      errors: 0,
      errorActivityCounts: {},
      routineType: null,
      routineId: null,
      activities: [],
      completionMs: null,
      sequenceCompleted: false
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

    const game = createGame4Game(containerRef.current, { levelId, customRoutines });
    gameRef.current = game;

    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, [levelId, customRoutines, resetRunState, restartKey]);

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
        const response = await api.post('/games/game4/start-session', {
          patientId: parsedPatientId,
          levelId,
          gameKey: 'game4'
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
        console.error('[GAME4] Erro ao iniciar sessão:', err);
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
  }, [patientId, levelId, restartKey, sendEvent, finalizeSession, flushPendingEvents]);

  return (
    <TherapeuticGameLayout
      tone="routine"
      title="Construtor de Rotinas"
      subtitle="Organização previsível de atividades do dia para promover estrutura, antecipação e autonomia em experiências terapêuticas guiadas."
      patientId={patientId}
      levelId={levelId}
      maxLevel={3}
      status={status}
      error={error}
      statusMessage={statusMessage}
      onExit={() => navigate(-1)}
      stageTitle="Sequências visuais de rotina"
      stageDescription="Monte rotinas do dia a dia na ordem correta para reforçar previsibilidade, consistência e autonomia funcional."
      supportCards={supportCards}
      footer="Rotina previsível: organize as atividades do dia em ordem correta para aumentar previsibilidade, autonomia e segurança no cotidiano."
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

export default Game4Page;
