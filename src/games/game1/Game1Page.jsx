import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { ArrowRepeat, ArrowRightCircle, EmojiSmile, XCircle } from 'react-bootstrap-icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { createGame1Game } from './game1Phaser';
import { getLevelConfig } from './levelConfig';
import './game1.css';

// Importando o novo logo (ajustado para o caminho do projeto)
import logoNovo from '../../assets/logonovo.png';

const buildSocketUrl = (baseUrl) => {
  if (!baseUrl) return undefined;
  return baseUrl.replace(/\/api\/?$/, '');
};

const Game1Page = () => {
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
    triggerCount: 0,
    successCount: 0,
    dysregulations: 0,
    strategyCounts: {},
    regulationTimesMs: [],
    engagementClicks: 0,
    lastTriggerAtMs: null
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
      gameId: 'game1',
      sessionId: sessionIdRef.current,
      eventType: event.eventType,
      data: event.data || null,
      timestamp
    };

    const metrics = metricsRef.current;

    switch (event.eventType) {
      case 'trigger':
        metrics.triggerCount += 1;
        metrics.lastTriggerAtMs = timestamp;
        break;
      case 'strategy_choice': {
        metrics.engagementClicks += 1;
        const strategy = event.data?.strategy || 'desconhecida';
        metrics.strategyCounts[strategy] = (metrics.strategyCounts[strategy] || 0) + 1;
        break;
      }
      case 'regulation_success':
        metrics.successCount += 1;
        if (metrics.lastTriggerAtMs) {
          metrics.regulationTimesMs.push(timestamp - metrics.lastTriggerAtMs);
          metrics.lastTriggerAtMs = null;
        }
        break;
      case 'dysregulation':
        metrics.dysregulations += 1;
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
    const totalTriggers = metrics.triggerCount;
    const successRate = totalTriggers > 0
      ? Number(((metrics.successCount / totalTriggers) * 100).toFixed(2))
      : 0;

    const avgRegulationSeconds = metrics.regulationTimesMs.length > 0
      ? Number((metrics.regulationTimesMs.reduce((sum, value) => sum + value, 0) / metrics.regulationTimesMs.length / 1000).toFixed(1))
      : null;

    const engagementScore = Math.min(100, Math.round(metrics.engagementClicks * 10));

    const strategiesUsed = Object.keys(metrics.strategyCounts);

    const payload = {
      sessionId: sessionIdRef.current,
      metrics: {
        levelId,
        successRate,
        levelProgress: [
          {
            levelNumber: levelId,
            strategiesUsed,
            regulationTimeSeconds: avgRegulationSeconds,
            dysregulations: metrics.dysregulations,
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
        await api.post('/games/game1/end-session', payload);
      }

      if (passed && nextLevel <= 5) {
        const storageKey = `autisconnect_game1_unlocked_${patientId}`;
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
      console.error('[GAME1] Erro ao finalizar sessão:', err);
      setError('Não foi possível salvar a sessão.');
    }
  }, [levelId, patientId, sendEvent]);

  const resetRunState = useCallback(() => {
    metricsRef.current = {
      triggerCount: 0,
      successCount: 0,
      dysregulations: 0,
      strategyCounts: {},
      regulationTimesMs: [],
      engagementClicks: 0,
      lastTriggerAtMs: null
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

    const game = createGame1Game(containerRef.current, { levelId });
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
        const response = await api.post('/games/game1/start-session', {
          patientId: parsedPatientId,
          levelId,
          gameKey: 'game1'
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
        console.error('[GAME1] Erro ao iniciar sessão:', err);
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
    <div className="game1-page">
      <header className="game1-header">
        <div className="game1-logo-container">
          <img src={logoNovo} alt="AutisConnect Logo" className="game1-logo-img" />
          <div className="game1-header-info">
            <h1>Emotional Regulation Adventures</h1>
            <p>Paciente #{patientId} · Nível {levelId}</p>
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
        <strong>Estratégias de Regulação:</strong> Respiração Profunda, Pausa Sensorial e Reformulação Cognitiva. 
        <br />
        Desenvolvido com foco em inovação e acessibilidade cognitiva.
      </div>

      <Modal show={showAdvanceModal} onHide={handleAdvanceCancel} centered className="game1-advance-modal">
        <Modal.Body>
          <div className="game1-advance-hero">
            <div className="game1-advance-icon">
              <EmojiSmile size={40} />
            </div>
            <h5>Excelente Trabalho!</h5>
            {nextLevelCandidate ? (
              <p>Você concluiu o nível {levelId} com sucesso. Pronto para o próximo desafio?</p>
            ) : (
              <p>Nível concluído. O que deseja fazer agora?</p>
            )}
          </div>
          <div className="game1-advance-actions">
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
    </div>
  );
};

export default Game1Page;
