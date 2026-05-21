import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Controller } from 'react-bootstrap-icons';
import api from '../services/api';

const gamesCatalog = [
  {
    id: 'game1',
    name: 'Emotional Regulation Adventures',
    description: 'Treino de regulação emocional em cenários dinâmicos.',
    status: 'ativo',
    level: 1
  }
];

const GamesPanel = ({ patientId }) => {
  const navigate = useNavigate();
  const [progressByGame, setProgressByGame] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(false);

  const getUnlockedLevelFromCache = (gameId) => {
    if (!patientId || gameId !== 'game1') return 1;
    const raw = localStorage.getItem(`autisconnect_game1_unlocked_${patientId}`) || '1';
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
        const response = await api.get(`/games/game1/progress/${patientId}`, {
          params: { gameKey: 'game1' }
        });

        if (!isMounted) return;

        const unlocked = response.data?.unlockedLevel || 1;
        setProgressByGame((prev) => ({ ...prev, game1: unlocked }));
        localStorage.setItem(`autisconnect_game1_unlocked_${patientId}`, String(unlocked));
      } catch (error) {
        if (!isMounted) return;
        const fallback = getUnlockedLevelFromCache('game1');
        setProgressByGame((prev) => ({ ...prev, game1: fallback }));
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
    if (gameId === 'game1') {
      return progressByGame.game1 || getUnlockedLevelFromCache('game1');
    }
    return 1;
  };

  const handleStart = (game) => {
    if (!patientId) return;
    const level = game.id === 'game1' ? Math.max(game.level || 1, getUnlockedLevel('game1')) : (game.level || 1);
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
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="fw-bold mb-0">{game.name}</h5>
                    {game.status === 'ativo' ? (
                      <Badge bg="success">Disponível</Badge>
                    ) : (
                      <Badge bg="secondary">Em breve</Badge>
                    )}
                  </div>
                  <p className="text-muted">{game.description}</p>
                  <div className="text-muted mb-3">Nível desbloqueado: {unlockedLevel}</div>
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
