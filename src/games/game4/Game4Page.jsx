import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { ArrowRepeat, ArrowRightCircle, EmojiSmile, XCircle } from 'react-bootstrap-icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { createGame4Game } from './game4Phaser';
import { getLevelConfig } from './levelConfig';
import '../game1/game1.css';
import logoNovo from '../../assets/logonovo.png';

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
        setStatusMessage(`Nivel ${levelId} concluido com sucesso.`);
        setNextLevelCandidate(nextLevel);
        setShowAdvanceModal(true);
        return;
      }

      setStatus('finalizado');
      if (passed && nextLevel > 3) {
        setStatusMessage('Nivel maximo concluido com sucesso.');
      } else if (reason === 'abandon') {
        setStatusMessage('Sessao encerrada.');
      } else {
        setStatusMessage(passed ? 'Nivel concluido com sucesso.' : 'Sessao finalizada.');
      }
    } catch (err) {
      console.error('[GAME4] Erro ao finalizar sessao:', err);
      setError('Nao foi possivel salvar a sessao.');
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
    setStatusMessage(`Indo para o nivel ${nextLevelCandidate}...`);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('level', String(nextLevelCandidate));
    setSearchParams(nextParams);
  }, [nextLevelCandidate, searchParams, setSearchParams]);

  const handleRepeatLevel = useCallback(() => {
    setShowAdvanceModal(false);
    setStatus('reiniciando');
    setStatusMessage(`Repetindo nivel ${levelId}...`);
    setRestartKey((value) => value + 1);
  }, [levelId]);

  const handleAdvanceCancel = useCallback(() => {
    setShowAdvanceModal(false);
    setNextLevelCandidate(null);
    setStatus('finalizado');
    setStatusMessage('Sessao finalizada.');
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
      setError('patientId invalido');
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
        console.error('[GAME4] Erro ao iniciar sessao:', err);
        if (isMounted) {
          setError('Nao foi possivel iniciar o jogo.');
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
    <div className="game1-page">
      <header className="game1-header">
        <div className="game1-logo-container">
          <img src={logoNovo} alt="AutisConnect Logo" className="game1-logo-img" />
          <div className="game1-header-info">
            <h1>Routine Builder</h1>
            <p>Paciente #{patientId} - Nivel {levelId}</p>
          </div>
        </div>
        <div className="game1-status-bar">
          <div className="game1-status-badge">{status}</div>
          <button type="button" className="game1-back" onClick={() => navigate(-1)}>
            Sair do Jogo
          </button>
        </div>
      </header>

      {error && <div className="game1-error">{error}</div>}
      {statusMessage && <div className="game1-status-message">{statusMessage}</div>}

      <div ref={containerRef} className="game1-canvas" />

      <div className="game1-footer">
        <strong>Rotina previsivel:</strong> organize as atividades do dia em ordem correta.
        <br />
        Desenvolvido para aumentar previsibilidade e autonomia.
      </div>

      <Modal show={showAdvanceModal} onHide={handleAdvanceCancel} centered className="game1-advance-modal">
        <Modal.Body>
          <div className="game1-advance-hero">
            <div className="game1-advance-icon">
              <EmojiSmile size={40} />
            </div>
            <h5>Excelente Trabalho!</h5>
            {nextLevelCandidate ? (
              <p>Voce concluiu o nivel {levelId} com sucesso. Pronto para o proximo desafio?</p>
            ) : (
              <p>Nivel concluido. O que deseja fazer agora?</p>
            )}
          </div>
          <div className="game1-advance-actions">
            <Button variant="primary" onClick={handleAdvanceConfirm}>
              <ArrowRightCircle className="me-2" /> Avancar para o Nivel {nextLevelCandidate}
            </Button>
            <Button variant="outline-primary" onClick={handleRepeatLevel}>
              <ArrowRepeat className="me-2" /> Praticar Novamente
            </Button>
            <Button variant="link" className="text-muted mt-2" onClick={handleAdvanceCancel}>
              <XCircle className="me-2" /> Encerrar Sessao
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Game4Page;
