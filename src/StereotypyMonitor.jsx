// Ficheiro: src/StereotypyMonitor.jsx (VERSÃO FINAL E CORRIGIDA)

import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import logohori from './assets/logohoriz.jpg';
import { X } from 'react-bootstrap-icons';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { v4 as uuidv4 } from 'uuid';

const StereotypyMonitor = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const lastPoseRef = useRef(null); // <<<< MUDANÇA IMPORTANTE: Usando ref em vez de state

    const [patientId, setPatientId] = useState(null);
    const [detector, setDetector] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    
    const [detectedStereotypy, setDetectedStereotypy] = useState('Nenhuma');
    const [stereotypyLog, setStereotypyLog] = useState([]);
    const [stereotypyStartTime, setStereotypyStartTime] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const setup = async () => {
            const queryParams = new URLSearchParams(location.search);
            const id = queryParams.get('patientId');
            if (!id) {
                setError("ID do paciente não encontrado na URL.");
                setIsLoading(false);
                return;
            }
            setPatientId(id);

            try {
                await tf.setBackend('webgl');
                const model = poseDetection.SupportedModels.MoveNet;
                const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
                const poseDetector = await poseDetection.createDetector(model, detectorConfig);
                setDetector(poseDetector);
            } catch (err) {
                setError("Falha ao carregar modelo de IA.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        setup();
    }, [location]);

    const startDetection = async () => {
        if (!detector) {
            setError("Modelo de IA não carregado.");
            return;
        }
        setIsDetecting(true);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    if (canvasRef.current) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                    }
                    lastPoseRef.current = null; // Reseta a última pose
                    detectionIntervalRef.current = setInterval(detectStereotypies, 200);
                };
            }
        } catch (err) {
            setError("Não foi possível acessar a webcam.");
            setIsDetecting(false);
        }
    };

    const stopDetection = () => {
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
        setIsDetecting(false);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const detectStereotypies = async () => {
        if (!detector || !videoRef.current || videoRef.current.paused) return;
        const poses = await detector.estimatePoses(videoRef.current);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (poses && poses.length > 0) {
            drawKeypoints(poses[0].keypoints, ctx);
            analyzeMovement(poses[0].keypoints);
        }
    };

    const analyzeMovement = (keypoints) => {
        const now = Date.now();
        const currentPose = { timestamp: now, keypoints: keypointsToObject(keypoints) };
        
        let detectedType = 'Nenhuma';
        if (lastPoseRef.current) { // <<<< MUDANÇA IMPORTANTE: Lendo da ref
            const nose = currentPose.keypoints.nose;
            const lastNose = lastPoseRef.current.keypoints.nose;
            if (nose && lastNose && Math.abs(nose.y - lastNose.y) > 5) {
                detectedType = 'Balançar corpo';
            }
            const leftWrist = currentPose.keypoints.left_wrist;
            const lastLeftWrist = lastPoseRef.current.keypoints.left_wrist;
            if (leftWrist && lastLeftWrist && Math.abs(leftWrist.y - lastLeftWrist.y) > 10) {
                detectedType = 'Movimento de mãos';
            }
        }

        if (detectedType !== 'Nenhuma') {
            if (detectedStereotypy !== detectedType) {
                if (stereotypyStartTime) logStereotypy(now);
                setStereotypyStartTime(now);
                setDetectedStereotypy(detectedType);
            }
        } else {
            if (stereotypyStartTime) logStereotypy(now);
            setStereotypyStartTime(null);
            setDetectedStereotypy('Nenhuma');
        }
        lastPoseRef.current = currentPose; // <<<< MUDANÇA IMPORTANTE: Atualizando a ref
    };

    const logStereotypy = (endTime) => {
        const duration = (endTime - stereotypyStartTime) / 1000;
        if (duration < 0.5) return;
        const newLog = {
            id: uuidv4(),
            type: detectedStereotypy,
            duration: parseFloat(duration.toFixed(1)),
            score: (lastPoseRef.current?.keypoints?.nose?.score || 0.5).toFixed(2),
            context: 'Sessão de monitoramento',
            date: new Date(stereotypyStartTime).toISOString()
        };
        setStereotypyLog(prev => [newLog, ...prev]);
        saveDetectionToDB(newLog);
    };

    const saveDetectionToDB = async (detectionData) => {
        const token = localStorage.getItem('token');
        if (!token || !patientId) return;
        try {
            await axios.post('http://localhost:5000/api/stereotypies', {
                patient_id: patientId,
                ...detectionData
            }, { headers: { 'Authorization': `Bearer ${token}` } } );
        } catch (err) {
            console.error("Erro ao salvar detecção:", err);
            setError("Falha ao salvar detecção no servidor.");
        }
    };

    const keypointsToObject = (keypoints) => keypoints.reduce((acc, kp) => {
        if (kp.name) acc[kp.name] = { x: kp.x, y: kp.y, score: kp.score };
        return acc;
    }, {});

    const drawKeypoints = (keypoints, ctx) => {
        keypoints.forEach(keypoint => {
            if (keypoint.score > 0.3) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'aqua';
                ctx.fill();
            }
        });
    };

    return (
        <Container fluid className="py-4 stereotypy-monitor-page">
            <Row className="professional-header-row mb-4 align-items-center">
                <Col className="text-center">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                    <h1 className="professional-name mb-0 mt-2">Monitor de Estereotipias</h1>
                </Col>
                <Col xs="auto">
                    <Button 
                        variant="outline-primary" 
                        onClick={() => window.close()} 
                        className="back-button-standalone"
                    >
                        <X /> Sair
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {isLoading ? (
                <div className="text-center"><Spinner animation="border" /> <p>Carregando...</p></div>
            ) : (
                <Row>
                    <Col md={8}>
                        <Card className="mb-4">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                Detecção em Tempo Real
                                <Button variant={isDetecting ? "danger" : "success"} onClick={isDetecting ? stopDetection : startDetection} disabled={!detector}>
                                    {isDetecting ? "Parar Detecção" : "Iniciar Detecção"}
                                </Button>
                            </Card.Header>
                            <Card.Body className="text-center">
                                <div style={{ position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
                                    <video ref={videoRef} autoPlay muted playsInline width="640" height="480" style={{ borderRadius: '8px', backgroundColor: '#000' }} />
                                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="mb-4">
                            <Card.Header>Status da Detecção</Card.Header>
                            <Card.Body className="text-center">
                                <h4>Estereotipia Atual</h4>
                                <p className="h3">
                                    <Badge bg={detectedStereotypy !== 'Nenhuma' ? 'warning' : 'secondary'}>
                                        {detectedStereotypy}
                                    </Badge>
                                </p>
                            </Card.Body>
                        </Card>
                        <Card className="mb-4">
                            <Card.Header>Log da Sessão</Card.Header>
                            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {stereotypyLog.length > 0 ? (
                                    <Table striped bordered size="sm">
                                        <thead><tr><th>Tipo</th><th>Duração (s)</th></tr></thead>
                                        <tbody>
                                            {stereotypyLog.map(log => (
                                                <tr key={log.id}>
                                                    <td>{log.type}</td>
                                                    <td>{log.duration}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="text-muted">Nenhuma detecção registrada nesta sessão.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default StereotypyMonitor;
