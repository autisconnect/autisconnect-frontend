import { useEffect, useRef, useState } from 'react';
import {
  createSchoolEmotionEvent,
  updateSchoolMonitoringPatientStatus
} from './schoolApi';
import {
  DETECTION_CONFIG,
  calculateDescriptorDistance,
  calculateEmotionStability,
  getDominantEmotion,
  normalizeFaceDescriptor,
  updateEmotionBuffer
} from '../emotion-tracking/emotionUtils';

const DISCOMFORT_EMOTIONS = new Set(['sad', 'angry', 'fearful', 'disgusted']);

function createDefaultStudentState(student) {
  return {
    patientId: student.patientId,
    name: student.name,
    status: 'not_in_frame',
    identityConfidence: 0,
    emotion: null,
    emotionConfidence: 0,
    buffer: [],
    currentEvent: null,
    lastSeenAt: null,
    recognizedFrames: 0
  };
}

export default function useSchoolMonitoringEngine({ session, sessionConfig, camera, preferredDeviceId = '' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const streamStartTokenRef = useRef(0);
  const monitoringEnabledRef = useRef(false);
  const isInferenceRunningRef = useRef(false);
  const lastInferenceAtRef = useRef(0);
  const studentRuntimeRef = useRef({});
  const pendingEventQueueRef = useRef([]);
  const persistenceInFlightRef = useRef(false);
  const persistenceTimerRef = useRef(null);
  const trackingSyncInFlightRef = useRef(false);
  const trackingSyncTimerRef = useRef(null);

  const [stage, setStage] = useState('idle');
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [studentStates, setStudentStates] = useState([]);
  const [localEvents, setLocalEvents] = useState([]);
  const [syncWarning, setSyncWarning] = useState('');
  const [engineError, setEngineError] = useState('');
  const [engineInfo, setEngineInfo] = useState('');
  const [sessionClock, setSessionClock] = useState(Date.now());

  useEffect(() => {
    const nextRuntime = {};
    const patients = sessionConfig?.authorizedPatients || sessionConfig?.authorizedStudents || [];
    patients.forEach((student) => {
      nextRuntime[student.patientId] = createDefaultStudentState(student);
    });

    studentRuntimeRef.current = nextRuntime;
    setStudentStates(Object.values(nextRuntime));
    setLocalEvents([]);
  }, [sessionConfig]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSessionClock(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [session]);

  useEffect(() => () => {
    stopEngine({ finalizeEvents: false, stopStream: true });
    clearPersistenceTimer();
    clearTrackingSyncTimer();
  }, []);

  function clearPersistenceTimer() {
    if (persistenceTimerRef.current) {
      window.clearTimeout(persistenceTimerRef.current);
      persistenceTimerRef.current = null;
    }
  }

  function clearTrackingSyncTimer() {
    if (trackingSyncTimerRef.current) {
      window.clearTimeout(trackingSyncTimerRef.current);
      trackingSyncTimerRef.current = null;
    }
  }

  async function flushEventQueue() {
    if (persistenceInFlightRef.current || pendingEventQueueRef.current.length === 0) {
      return;
    }

    persistenceInFlightRef.current = true;
    clearPersistenceTimer();
    const nextItem = pendingEventQueueRef.current[0];

    try {
      const response = await createSchoolEmotionEvent(nextItem.payload);
      pendingEventQueueRef.current.shift();
      setLocalEvents((current) => current.map((item) => (
        item.id === nextItem.localEvent.id
          ? { ...item, persisted: true, id: response?.eventId || item.id }
          : item
      )));
      if (pendingEventQueueRef.current.length === 0) {
        setSyncWarning('');
      }
    } catch (error) {
      nextItem.attempts = (nextItem.attempts || 0) + 1;
      if (nextItem.attempts >= DETECTION_CONFIG.maxRetryAttempts) {
        pendingEventQueueRef.current.shift();
      }
      setSyncWarning('Alguns eventos ficaram na fila local e serao reenviados automaticamente.');
    } finally {
      persistenceInFlightRef.current = false;
      if (pendingEventQueueRef.current.length > 0) {
        persistenceTimerRef.current = window.setTimeout(() => {
          persistenceTimerRef.current = null;
          void flushEventQueue();
        }, DETECTION_CONFIG.retryDelayMs);
      }
    }
  }

  function enqueueEmotionEvent(localEvent, payload) {
    pendingEventQueueRef.current.push({
      localEvent,
      payload,
      attempts: 0
    });
    void flushEventQueue();
  }

  async function flushTrackingState() {
    if (trackingSyncInFlightRef.current || !session) {
      return;
    }

    trackingSyncInFlightRef.current = true;
    clearTrackingSyncTimer();

    try {
      const payload = Object.values(studentRuntimeRef.current).map((student) => ({
        patientId: student.patientId,
        trackingStatus: student.status
      }));

      if (payload.length > 0) {
        await updateSchoolMonitoringPatientStatus(session.id, payload);
      }
    } catch (error) {
      setSyncWarning('O status ao vivo da sessao nao pode ser sincronizado agora. Novas tentativas seguem em andamento.');
    } finally {
      trackingSyncInFlightRef.current = false;
    }
  }

  function scheduleTrackingStateSync() {
    if (!session) {
      return;
    }

    if (trackingSyncTimerRef.current) {
      return;
    }

    trackingSyncTimerRef.current = window.setTimeout(() => {
      trackingSyncTimerRef.current = null;
      void flushTrackingState();
    }, 3000);
  }

  async function loadModelsIfNeeded() {
    if (modelsReady) {
      return;
    }

    const tf = window.tf;
    const faceapi = window.faceapi;
    if (!tf || !faceapi) {
      throw new Error('As bibliotecas de IA nao foram carregadas nesta pagina.');
    }

    try {
      await tf.setBackend('webgl');
      await tf.ready();
    } catch (backendError) {
      await tf.setBackend('cpu');
      await tf.ready();
    }

    const modelsPath = '/models';
    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
    }
    if (!faceapi.nets.faceLandmark68Net.isLoaded) {
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
    }
    if (!faceapi.nets.faceExpressionNet.isLoaded) {
      await faceapi.nets.faceExpressionNet.loadFromUri(modelsPath);
    }
    if (!faceapi.nets.faceRecognitionNet.isLoaded) {
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);
    }

    setModelsReady(true);
  }

  async function startCameraStream() {
    if (streamRef.current) {
      return true;
    }

    const startToken = ++streamStartTokenRef.current;
    const videoConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 }
    };

    if (preferredDeviceId) {
      videoConstraints.deviceId = { exact: preferredDeviceId };
    } else {
      videoConstraints.facingMode = 'user';
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: videoConstraints
    });

    if (startToken !== streamStartTokenRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch (error) {
        const message = `${error?.message || ''}`.toLowerCase();
        const interrupted = message.includes('interrupted by a call to pause');
        if (interrupted || startToken !== streamStartTokenRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          if (videoRef.current?.srcObject === stream) {
            videoRef.current.srcObject = null;
          }
          streamRef.current = null;
          return false;
        }

        throw error;
      }
    }

    if (startToken !== streamStartTokenRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current?.srcObject === stream) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      return false;
    }

    setCameraReady(true);
    return true;
  }

  function stopCameraStream() {
    streamStartTokenRef.current += 1;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }

  function stopLoop() {
    monitoringEnabledRef.current = false;
    isInferenceRunningRef.current = false;
    lastInferenceAtRef.current = 0;

    if (loopRef.current) {
      window.cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
  }

  function drawMonitoringCanvas(detections = [], assignments = []) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const faceapi = window.faceapi;

    if (!canvas || !video || !faceapi) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      return;
    }

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((detection) => {
      const box = detection?.detection?.box;
      if (!box) return;
      context.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      context.lineWidth = 2;
      context.strokeRect(box.x, box.y, box.width, box.height);
      context.fillStyle = 'rgba(15, 23, 42, 0.65)';
      context.fillRect(box.x, Math.max(box.y - 24, 0), box.width, 22);
      context.fillStyle = '#f8fafc';
      context.font = '600 12px sans-serif';
      context.fillText('Face nao monitorada', box.x + 8, Math.max(box.y - 9, 14));
    });

    assignments.forEach((assignment) => {
      const box = assignment?.detection?.detection?.box;
      if (!box) return;
      context.strokeStyle = 'rgba(15, 118, 110, 0.9)';
      context.lineWidth = 3;
      context.strokeRect(box.x, box.y, box.width, box.height);
      context.fillStyle = 'rgba(15, 118, 110, 0.86)';
      context.fillRect(box.x, Math.max(box.y - 24, 0), box.width, 22);
      context.fillStyle = '#f8fafc';
      context.font = '600 12px sans-serif';
      context.fillText(assignment.student.name, box.x + 8, Math.max(box.y - 9, 14));
    });
  }

  function buildLocalEvent(student, runtime, endedAtIso) {
    if (!runtime.currentEvent) {
      return null;
    }

    const startedAtIso = runtime.currentEvent.startedAt;
    const durationMs = Math.max(0, new Date(endedAtIso).getTime() - new Date(startedAtIso).getTime());
    const confidenceSamples = runtime.currentEvent.confidenceSamples || [];
    const averageConfidence = confidenceSamples.length > 0
      ? confidenceSamples.reduce((sum, value) => sum + value, 0) / confidenceSamples.length
      : 0;
    const eventType = DISCOMFORT_EMOTIONS.has(runtime.currentEvent.emotionKey) && durationMs >= 5000
      ? 'persistent_change'
      : 'emotion_window';

    return {
      id: `${student.patientId}-${startedAtIso}`,
      eventType,
      patientId: student.patientId,
      patientName: student.name,
      dominantEmotion: runtime.currentEvent.emotionKey,
      previousEmotion: runtime.currentEvent.previousEmotion || null,
      averageConfidence,
      identityConfidence: runtime.identityConfidence || 0,
      startedAt: startedAtIso,
      endedAt: endedAtIso,
      durationMs,
      persisted: false
    };
  }

  function finalizeStudentEvent(student, runtime, endedAtIso) {
    const localEvent = buildLocalEvent(student, runtime, endedAtIso);
    if (!localEvent || !session) {
      runtime.currentEvent = null;
      return;
    }

    setLocalEvents((current) => [localEvent, ...current].slice(0, 80));
    enqueueEmotionEvent(localEvent, {
      sessionId: session.id,
      patientId: student.patientId,
      dominantEmotion: localEvent.dominantEmotion,
      previousEmotion: localEvent.previousEmotion,
      averageConfidence: localEvent.averageConfidence,
      identityConfidence: localEvent.identityConfidence,
      startedAt: localEvent.startedAt,
      endedAt: localEvent.endedAt,
      eventType: localEvent.eventType,
      source: 'school',
      metadata: {
        cameraId: camera?.id || null,
        cameraName: camera?.name || null,
        locationId: sessionConfig?.location?.id || null,
        locationName: sessionConfig?.location?.name || null,
        classroomId: sessionConfig?.classroom?.id || null,
        classroomName: sessionConfig?.classroom?.name || null
      }
    });

    runtime.currentEvent = null;
  }

  function updateStudentStates(assignments = [], allDetections = []) {
    const nowIso = new Date().toISOString();
    const assignedByPatientId = new Map(assignments.map((assignment) => [assignment.student.patientId, assignment]));
    const authorizedPatients = sessionConfig?.authorizedPatients || sessionConfig?.authorizedStudents || [];

    authorizedPatients.forEach((student) => {
      const runtime = studentRuntimeRef.current[student.patientId] || createDefaultStudentState(student);
      const assignment = assignedByPatientId.get(student.patientId);

      if (!assignment) {
        if (runtime.currentEvent && runtime.lastSeenAt) {
          const timeSinceSeen = Date.now() - new Date(runtime.lastSeenAt).getTime();
          if (timeSinceSeen > 3000) {
            finalizeStudentEvent(student, runtime, nowIso);
            runtime.emotion = null;
          }
        }

        runtime.status = runtime.lastSeenAt ? 'temporarily_lost' : 'not_in_frame';
        runtime.identityConfidence = 0;
        runtime.emotionConfidence = 0;
        studentRuntimeRef.current[student.patientId] = runtime;
        return;
      }

      const dominantEmotion = getDominantEmotion(assignment.detection.expressions, DETECTION_CONFIG.minCandidateEmotionConfidence);
      runtime.buffer = updateEmotionBuffer(runtime.buffer, {
        key: dominantEmotion.key,
        candidateKey: dominantEmotion.candidateKey,
        confidence: dominantEmotion.confidence,
        observedAt: nowIso
      });

      const stability = calculateEmotionStability(runtime.buffer);
      runtime.identityConfidence = assignment.identityConfidence;
      runtime.lastSeenAt = nowIso;
      runtime.recognizedFrames += 1;
      runtime.status = runtime.recognizedFrames > 2 ? 'tracking' : 'identified';

      if (stability.stable && stability.key) {
        if (!runtime.currentEvent || runtime.currentEvent.emotionKey !== stability.key) {
          if (runtime.currentEvent) {
            finalizeStudentEvent(student, runtime, nowIso);
          }

          runtime.currentEvent = {
            emotionKey: stability.key,
            previousEmotion: runtime.emotion,
            startedAt: nowIso,
            confidenceSamples: [stability.confidence]
          };
        } else {
          runtime.currentEvent.confidenceSamples.push(stability.confidence);
        }

        runtime.emotion = stability.key;
        runtime.emotionConfidence = stability.confidence;
      } else if (dominantEmotion.candidateKey) {
        runtime.emotion = dominantEmotion.candidateKey;
        runtime.emotionConfidence = dominantEmotion.confidence;
      }

      studentRuntimeRef.current[student.patientId] = runtime;
    });

    setStudentStates(
      authorizedPatients.map((student) => {
        const runtime = studentRuntimeRef.current[student.patientId] || createDefaultStudentState(student);
        return {
          patientId: student.patientId,
          name: student.name,
          status: runtime.status,
          identityConfidence: runtime.identityConfidence,
          emotion: runtime.emotion,
          emotionConfidence: runtime.emotionConfidence,
          lastSeenAt: runtime.lastSeenAt,
          referenceReady: student.referenceReady
        };
      })
    );

    scheduleTrackingStateSync();
    drawMonitoringCanvas(allDetections, assignments);
  }

  function buildAssignments(detections) {
    const availableStudents = (sessionConfig?.authorizedPatients || sessionConfig?.authorizedStudents || [])
      .filter((student) => student.referenceReady && normalizeFaceDescriptor(student.descriptor));
    const matchCandidates = [];

    detections.forEach((detection, detectionIndex) => {
      const descriptor = Array.isArray(detection?.descriptor)
        ? detection.descriptor
        : ArrayBuffer.isView(detection?.descriptor)
          ? Array.from(detection.descriptor)
          : null;

      if (!descriptor) {
        return;
      }

      availableStudents.forEach((student) => {
        const distance = calculateDescriptorDistance(student.descriptor, descriptor);
        const threshold = Math.max(student.matchThreshold || DETECTION_CONFIG.faceMatchThreshold, DETECTION_CONFIG.faceMatchThreshold);
        if (!Number.isFinite(distance) || distance > threshold) {
          return;
        }

        matchCandidates.push({
          detectionIndex,
          student,
          detection,
          distance,
          identityConfidence: Math.max(0, 1 - (distance / threshold))
        });
      });
    });

    matchCandidates.sort((left, right) => left.distance - right.distance);

    const usedDetections = new Set();
    const usedStudents = new Set();
    const assignments = [];

    matchCandidates.forEach((candidate) => {
      if (usedDetections.has(candidate.detectionIndex) || usedStudents.has(candidate.student.patientId)) {
        return;
      }

      usedDetections.add(candidate.detectionIndex);
      usedStudents.add(candidate.student.patientId);
      assignments.push(candidate);
    });

    return assignments;
  }

  async function runDetectionLoop() {
    if (!monitoringEnabledRef.current || !videoRef.current || !window.faceapi) {
      return;
    }

    const now = Date.now();
    if (isInferenceRunningRef.current || now - lastInferenceAtRef.current < 850) {
      loopRef.current = window.requestAnimationFrame(runDetectionLoop);
      return;
    }

    isInferenceRunningRef.current = true;
    lastInferenceAtRef.current = now;

    try {
      const faceapi = window.faceapi;
      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.45
          })
        )
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      const assignments = buildAssignments(detections || []);
      updateStudentStates(assignments, detections || []);
    } catch (error) {
      setSyncWarning('O monitoramento visual encontrou uma interrupcao temporaria. Novas tentativas seguem em andamento.');
    } finally {
      isInferenceRunningRef.current = false;
      if (monitoringEnabledRef.current) {
        loopRef.current = window.requestAnimationFrame(runDetectionLoop);
      }
    }
  }

  async function startEngine() {
    setEngineError('');
    setEngineInfo('');
    setSyncWarning('');

    if (!session) {
      setEngineError('Nenhuma sessao ativa foi carregada para este monitoramento.');
      return false;
    }

    if (!sessionConfig || (sessionConfig.authorizedPatients || []).length === 0) {
      setEngineError('Nenhum aluno autorizado ficou disponivel para esta sessao.');
      return false;
    }

    if ((camera?.streamType || camera?.stream_type) !== 'browser') {
      setStage('unsupported');
      setEngineInfo('Esta camera esta preparada para edge/gateway. Nesta V1, o processamento local completo fica disponivel para webcams do navegador.');
      return false;
    }

    setStage('starting');

    try {
      await loadModelsIfNeeded();
      const streamStarted = await startCameraStream();
      if (!streamStarted) {
        setStage('idle');
        return false;
      }
      monitoringEnabledRef.current = true;
      setStage('monitoring');
      setEngineInfo(
        (sessionConfig?.authorizedPatients || []).some((student) => student.referenceReady)
          ? 'Privacidade ativa. Somente alunos autorizados nesta sessao podem ser associados ao AutisConnect.'
          : 'Privacidade ativa. Nenhum descritor facial esta pronto para esta sessao; o monitoramento permanece contextual, sem associacao automatica de identidade.'
      );

      loopRef.current = window.requestAnimationFrame(runDetectionLoop);
      return true;
    } catch (error) {
      setStage('error');
      setEngineError(error.message || 'Nao foi possivel iniciar o motor local de monitoramento.');
      stopLoop();
      stopCameraStream();
      return false;
    }
  }

  function pauseEngine() {
    stopLoop();
    setStage('paused');
  }

  function resumeEngine() {
    monitoringEnabledRef.current = true;
    setStage('monitoring');
    loopRef.current = window.requestAnimationFrame(runDetectionLoop);
  }

  function finalizeOpenEvents() {
    const nowIso = new Date().toISOString();
    const authorizedPatients = sessionConfig?.authorizedPatients || sessionConfig?.authorizedStudents || [];
    authorizedPatients.forEach((student) => {
      const runtime = studentRuntimeRef.current[student.patientId];
      if (runtime?.currentEvent) {
        finalizeStudentEvent(student, runtime, nowIso);
      }
    });
  }

  function stopEngine(options = {}) {
    const { finalizeEvents = true, stopStream = true } = options;
    if (finalizeEvents) {
      finalizeOpenEvents();
    }
    stopLoop();
    if (stopStream) {
      stopCameraStream();
    }
    if (stage !== 'unsupported') {
      setStage('idle');
    }
  }

  return {
    videoRef,
    canvasRef,
    stage,
    cameraReady,
    modelsReady,
    studentStates,
    localEvents,
    syncWarning,
    engineError,
    engineInfo,
    sessionClock,
    startEngine,
    stopEngine,
    pauseEngine,
    resumeEngine
  };
}
