import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { ArrowRepeat, ArrowRightCircle, EmojiSmile, XCircle } from 'react-bootstrap-icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { createGame3Game } from './game3Phaser';
import { getLevelConfig } from './levelConfig';
import '../game1/game1.css';
import logoNovo from '../../assets/logonovo.png';

const buildSocketUrl = (baseUrl) => {
  if (!baseUrl) return undefined;
  return baseUrl.replace(/\/api\/?$/, '');
};

const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const Game3Page = () => {
  const { patientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const levelId = useMemo(() => {
    const raw = searchParams.get('level');
    const parsed = parseInt(raw || '1', 10);
    return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [searchParams]);

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
    totalSteps: 0,
    correctSteps: 0,
    wrongClicks: 0,
    hintsUsed: 0,
    planChangeCount: 0,
    adaptationStartAtMs: null,
    adaptationTimeMs: null,
    perseverationErrors: 0,
    impulseErrors: 0
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
      gameId: 'game3',
      sessionId: sessionIdRef.current,
      eventType: event.eventType,
      data: event.data || null,
      timestamp
    };

    const metrics = metricsRef.current;

    switch (event.eventType) {
      case 'trigger':
        if (event.data?.type === 'mission_start') {
          metrics.totalSteps = event.data.stepsTotal || metrics.totalSteps;
        }
        if (event.data?.type === 'plan_change') {
          metrics.planChangeCount += 1;
          metrics.adaptationStartAtMs = timestamp;
          metrics.adaptationTimeMs = null;
        }
        break;
      case 'regulation_success':
        if (event.data?.type === 'step_complete') {
          metrics.correctSteps += 1;
          if (metrics.adaptationStartAtMs && metrics.adaptationTimeMs === null) {
            metrics.adaptationTimeMs = timestamp - metrics.adaptationStartAtMs;
          }
        }
        break;
      case 'dysregulation':
        metrics.wrongClicks += 1;
        if (event.data?.perseveration) {
          metrics.perseverationErrors += 1;
        }
        if (event.data?.type === 'impulse_click') {
          metrics.impulseErrors += 1;
        }
        break;
      case 'strategy_choice':
        if (event.data?.strategy === 'hint') {
          metrics.hintsUsed += 1;
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
    const totalSteps = metrics.totalSteps || metrics.correctSteps || 0;
    const attempts = metrics.correctSteps + metrics.wrongClicks;
    const successRate = totalSteps > 0
      ? Number(((metrics.correctSteps / totalSteps) * 100).toFixed(2))
      : 0;

    const adaptationSeconds = metrics.adaptationTimeMs
      ? Number((metrics.adaptationTimeMs / 1000).toFixed(1))
      : null;

    const planningScore = successRate;
    const workingMemoryScore = clampScore(100 - metrics.hintsUsed * 15 - metrics.wrongClicks * 5);
    const flexibilityScore = clampScore(100 - (adaptationSeconds || 0) * 8 - metrics.perseverationErrors * 12);
    const inhibitionScore = clampScore(100 - metrics.impulseErrors * 18 - metrics.wrongClicks * 4);
    const engagementScore = clampScore(metrics.correctSteps * 12 - metrics.wrongClicks * 6 + 30);

    const payload = {
      sessionId: sessionIdRef.current,
      metrics: {
        levelId,
        successRate,
        levelProgress: [
          {
            levelNumber: levelId,
            strategiesUsed: {
              attempts,
              hintsUsed: metrics.hintsUsed,
              perseverationErrors: metrics.perseverationErrors,
              impulseErrors: metrics.impulseErrors,
              adaptationTimeSeconds: adaptationSeconds,
              planningScore,
              workingMemoryScore,
              flexibilityScore,
              inhibitionScore
            },
            regulationTimeSeconds: adaptationSeconds,
            dysregulations: metrics.wrongClicks,
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
        await api.post('/games/game3/end-session', payload);
      }

      if (passed && nextLevel <= 5) {
        const storageKey = `autisconnect_game3_unlocked_${patientId}`;
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
      if (passed && nextLevel > 5) {
        setStatusMessage('Nivel maximo concluido com sucesso.');
      } else if (reason === 'abandon') {
        setStatusMessage('Sessao encerrada.');
      } else {
        setStatusMessage(passed ? 'Nivel concluido com sucesso.' : 'Sessao finalizada.');
      }
    } catch (err) {
      console.error('[GAME3] Erro ao finalizar sessao:', err);
      setError('Nao foi possivel salvar a sessao.');
    }
  }, [levelId, patientId, sendEvent]);

  const resetRunState = useCallback(() => {
    metricsRef.current = {
      totalSteps: 0,
      correctSteps: 0,
      wrongClicks: 0,
      hintsUsed: 0,
      planChangeCount: 0,
      adaptationStartAtMs: null,
      adaptationTimeMs: null,
      perseverationErrors: 0,
      impulseErrors: 0
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

    const game = createGame3Game(containerRef.current, { levelId });
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
      setError('patientId invalido');
      return undefined;
    }

    let isMounted = true;

    const startSession = async () => {
      try {
        setStatus('iniciando');
        const response = await api.post('/games/game3/start-session', {
          patientId: parsedPatientId,
          levelId,
          gameKey: 'game3'
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
        console.error('[GAME3] Erro ao iniciar sessao:', err);
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
            <h1>Executive Function Builders</h1>
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
        <strong>Funcoes executivas:</strong> planejar, adaptar e inibir impulsos com apoio gradual.
        <br />
        Desenvolvido para treinar flexibilidade cognitiva e planejamento.
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

export default Game3Page;
