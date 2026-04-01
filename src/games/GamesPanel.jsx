import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Controller } from 'react-bootstrap-icons';
import api from '../services/api';
import game1Cover from '../assets/game1.png';
import game2Cover from '../assets/game2.jpg';

const gamesCatalog = [
  {
    id: 'game1',
    name: 'Emotional Regulation Adventures',
    description: 'Treino de regulacao emocional em cenarios dinamicos.',
    status: 'ativo',
    level: 1,
    cover: game1Cover
  },
  {
    id: 'game2',
    name: 'Daily Life Quest',
    description: 'Missoes de autonomia e habilidades de vida diaria.',
    status: 'ativo',
    level: 1,
    cover: game2Cover
  }
];

const GamesPanel = ({ patientId }) => {
  const navigate = useNavigate();
  const [progressByGame, setProgressByGame] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(false);

  const getUnlockedLevelFromCache = (gameId) => {
    if (!patientId) return 1;
    const storageKey = `autisconnect_${gameId}_unlocked_${patientId}`;
    const raw = localStorage.getItem(storageKey) || '1';
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) return 1;
    return Math.min(parsed, 5);
  };

  useEffect(() => {
    if (!patientId) return;
    let isMounted = true;

    const loadProgress = async () => {
      try {
        setLoadingProgress(true);
        const gameIds = gamesCatalog.map((game) => game.id);
        const requests = gameIds.map((gameId) =>
          api.get(`/games/${gameId}/progress/${patientId}`, {
            params: { gameKey: gameId }
          })
        );

        const results = await Promise.allSettled(requests);
        if (!isMounted) return;

        const nextProgress = {};
        results.forEach((result, index) => {
          const gameId = gameIds[index];
          if (result.status === 'fulfilled') {
            const unlocked = result.value?.data?.unlockedLevel || 1;
            nextProgress[gameId] = unlocked;
            const storageKey = `autisconnect_${gameId}_unlocked_${patientId}`;
            localStorage.setItem(storageKey, String(unlocked));
          } else {
            nextProgress[gameId] = getUnlockedLevelFromCache(gameId);
          }
        });

        setProgressByGame((prev) => ({ ...prev, ...nextProgress }));
      } catch (error) {
        if (!isMounted) return;
        const fallbackProgress = {};
        gamesCatalog.forEach((game) => {
          fallbackProgress[game.id] = getUnlockedLevelFromCache(game.id);
        });
        setProgressByGame((prev) => ({ ...prev, ...fallbackProgress }));
      } finally {
        if (isMounted) {
          setLoadingProgress(false);
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const getUnlockedLevel = (gameId) => {
    return progressByGame[gameId] || getUnlockedLevelFromCache(gameId);
  };

  const handleStart = (game) => {
    if (!patientId) return;
    const level = Math.max(game.level || 1, getUnlockedLevel(game.id));
    navigate(`/games/${game.id}/${patientId}?level=${level}`);
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="fw-bold mb-1">Games Terapêuticos</h4>
          <p className="text-muted mb-0">Selecione um jogo para iniciar a sessão do paciente.</p>
        </div>
        <Controller size={28} className="text-primary" />
      </div>

      {loadingProgress && (
        <div className="text-muted mb-3 d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" /> Carregando progresso...
        </div>
      )}

      <Row className="g-3">
        {gamesCatalog.map((game) => {
          const unlockedLevel = getUnlockedLevel(game.id);

          return (
            <Col lg={6} key={game.id}>
              <Card className="demo-card h-100 shadow-sm border-0 overflow-hidden">
                <Card.Body>
                  <div className="image-container">
                    {game.cover ? (
                      <Card.Img variant="top" src={game.cover} alt={game.name} />
                    ) : (
                      <div className="image-placeholder">{game.name}</div>
                    )}
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="fw-bold mb-0">{game.name}</h5>
                    {game.status === 'ativo' ? (
                      <Badge bg="success">Disponível</Badge>
                    ) : (
                      <Badge bg="secondary">Em breve</Badge>
                    )}
                  </div>
                  <p className="text-muted">{game.description}</p>
                  <div className="text-muted mb-3">Nivel desbloqueado: {unlockedLevel}</div>
                  <Button
                    variant="primary"
                    disabled={game.status !== 'ativo'}
                    onClick={() => handleStart(game)}
                  >
                    Iniciar
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default GamesPanel;
