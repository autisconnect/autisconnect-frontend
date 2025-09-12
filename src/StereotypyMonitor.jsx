// Ficheiro: src/StereotypyMonitor.jsx (VERSÃO DE TESTE MÍNIMA)

import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

const StereotypyMonitor = () => {
    const videoRef = useRef(null);
    const detectorRef = useRef(null);
    const [status, setStatus] = useState('Aguardando inicialização...');

    // EFEITO 1: Carregar o modelo
    useEffect(() => {
        const initializeDetector = async () => {
            try {
                setStatus('Configurando backend...');
                await tf.setBackend('webgl');
                await tf.ready();
                
                setStatus(`Backend pronto: ${tf.getBackend()}. Carregando modelo...`);
                const model = poseDetection.SupportedModels.MoveNet;
                const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
                const detector = await poseDetection.createDetector(model, detectorConfig);
                
                detectorRef.current = detector;
                setStatus('Modelo carregado com sucesso!');
            } catch (err) {
                console.error(err);
                setStatus(`Erro ao carregar modelo: ${err.message}`);
            }
        };
        initializeDetector();
    }, []);

    // EFEITO 2: Controlar o loop de detecção
    useEffect(() => {
        let animationFrameId;

        const runDetectionLoop = async () => {
            const detector = detectorRef.current;
            const video = videoRef.current;

            if (detector && video && video.readyState === 4) {
                try {
                    const poses = await detector.estimatePoses(video);
                    if (poses && poses.length > 0) {
                        const keypointsCount = poses[0].keypoints.filter(k => k.score > 0.5).length;
                        setStatus(`Detecção OK! Pontos-chave visíveis: ${keypointsCount}`);
                    }
                } catch (e) {
                    console.error("ERRO DENTRO DO LOOP:", e);
                    setStatus(`Erro no loop de detecção: ${e.message}`);
                    return; // Para o loop em caso de erro
                }
            }
            animationFrameId = requestAnimationFrame(runDetectionLoop);
        };

        // Só inicia se o modelo estiver carregado e o botão for clicado
        if (status === 'Iniciando detecção...') {
            runDetectionLoop();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [status]);

    const handleStart = async () => {
        if (status !== 'Modelo carregado com sucesso!') return;
        try {
            setStatus('Iniciando webcam...');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    setStatus('Iniciando detecção...');
                };
            }
        } catch (err) {
            setStatus(`Erro ao iniciar webcam: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Teste de Isolamento TensorFlow.js</h1>
            <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc' }}>
                <strong>Status:</strong> <span style={{ color: status.includes('Erro') ? 'red' : 'green' }}>{status}</span>
            </div>
            <button onClick={handleStart} disabled={status !== 'Modelo carregado com sucesso!'}>
                Iniciar Detecção
            </button>
              

            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '500px', height: '375px', border: '1px solid black', marginTop: '10px' }}
            />
        </div>
    );
};

export default StereotypyMonitor;
