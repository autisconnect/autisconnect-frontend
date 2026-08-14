export const EMOTION_TRANSLATIONS = {
    neutral: 'neutro',
    happy: 'feliz',
    sad: 'triste',
    angry: 'raiva',
    fearful: 'medo',
    disgusted: 'nojo',
    surprised: 'surpreso'
};

export const VALID_EMOTIONS = Object.keys(EMOTION_TRANSLATIONS);

export const EMOTION_COLORS = {
    neutral: '#6b7280',
    happy: '#0ea5e9',
    sad: '#2563eb',
    angry: '#ef4444',
    fearful: '#f97316',
    disgusted: '#a855f7',
    surprised: '#14b8a6',
    inconclusive: '#94a3b8'
};

export const DETECTION_CONFIG = {
    inferenceIntervalMs: 500,
    minFaceConfidence: 0.65,
    minEmotionConfidence: 0.3,
    minCandidateEmotionConfidence: 0.18,
    faceMatchThreshold: 0.68,
    softFaceMatchThreshold: 0.82,
    singleFaceFallbackThreshold: 1.05,
    faceMatchMargin: 0.04,
    bufferSize: 6,
    minStableSamples: 2,
    stableConsistencyThreshold: 0.5,
    stableDurationMs: 1200,
    persistenceIntervalMs: 4000,
    maxTargetLostFrames: 6,
    targetSwitchDistanceRatio: 0.22,
    targetAmbiguityThreshold: 0.08,
    maxLocalHistory: 100,
    sessionGapMs: 15 * 60 * 1000,
    defaultHistoricalDurationMs: 30 * 1000,
    retryDelayMs: 8000,
    maxRetryAttempts: 3,
    minFaceAreaRatio: 0.04,
    centerednessWarningThreshold: 0.35,
    brightnessWarningThreshold: 0.22
};

const POSITIVE_EMOTIONS = new Set(['happy', 'surprised']);
const DISCOMFORT_EMOTIONS = new Set(['sad', 'angry', 'fearful', 'disgusted']);

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function getEmotionLabel(emotionKey) {
    if (!emotionKey) {
        return 'análise inconclusiva';
    }

    return EMOTION_TRANSLATIONS[emotionKey] || emotionKey;
}

export function formatConfidence(value) {
    const numericValue = Number.isFinite(value) ? value : 0;
    return `${Math.round(clamp(numericValue, 0, 1) * 100)}%`;
}

export function formatDuration(durationMs) {
    const totalSeconds = Math.max(0, Math.floor((durationMs || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getFaceBoxMetrics(box, videoWidth, videoHeight) {
    const frameWidth = Math.max(videoWidth || 0, 1);
    const frameHeight = Math.max(videoHeight || 0, 1);
    const faceArea = Math.max(box.width * box.height, 0);
    const frameArea = frameWidth * frameHeight;
    const areaRatio = frameArea > 0 ? faceArea / frameArea : 0;
    const centerX = box.x + (box.width / 2);
    const centerY = box.y + (box.height / 2);
    const dx = Math.abs(centerX - (frameWidth / 2)) / (frameWidth / 2);
    const dy = Math.abs(centerY - (frameHeight / 2)) / (frameHeight / 2);
    const centeredness = clamp(1 - (Math.sqrt((dx ** 2) + (dy ** 2)) / Math.SQRT2), 0, 1);

    return {
        areaRatio,
        centeredness,
        centerX,
        centerY
    };
}

export function calculateFaceDistance(firstBox, secondBox) {
    if (!firstBox || !secondBox) {
        return Number.POSITIVE_INFINITY;
    }

    const firstCenterX = firstBox.x + (firstBox.width / 2);
    const firstCenterY = firstBox.y + (firstBox.height / 2);
    const secondCenterX = secondBox.x + (secondBox.width / 2);
    const secondCenterY = secondBox.y + (secondBox.height / 2);

    return Math.sqrt(((firstCenterX - secondCenterX) ** 2) + ((firstCenterY - secondCenterY) ** 2));
}

export function normalizeFaceDescriptor(input) {
    if (!Array.isArray(input) || input.length === 0) {
        return null;
    }

    const values = input.map((value) => Number(value));
    return values.some((value) => !Number.isFinite(value)) ? null : values;
}

function normalizeFaceDescriptorCollection(inputs = []) {
    if (!Array.isArray(inputs)) {
        return [];
    }

    return inputs
        .map((descriptor) => normalizeFaceDescriptor(descriptor))
        .filter(Boolean);
}

export function calculateDescriptorDistance(referenceDescriptor, candidateDescriptor) {
    const normalizedReference = normalizeFaceDescriptor(referenceDescriptor);
    const normalizedCandidate = normalizeFaceDescriptor(candidateDescriptor);

    if (!normalizedReference || !normalizedCandidate || normalizedReference.length !== normalizedCandidate.length) {
        return Number.POSITIVE_INFINITY;
    }

    const squaredDistance = normalizedReference.reduce((sum, value, index) => {
        const difference = value - normalizedCandidate[index];
        return sum + (difference ** 2);
    }, 0);

    return Math.sqrt(squaredDistance);
}

export function selectFaceByReference(detections = [], options = {}) {
    const {
        referenceDescriptor,
        referenceDescriptors,
        videoWidth,
        videoHeight,
        lastTargetBox,
        threshold = DETECTION_CONFIG.faceMatchThreshold,
        ambiguityMargin = DETECTION_CONFIG.faceMatchMargin
    } = options;

    const normalizedReferenceDescriptors = normalizeFaceDescriptorCollection(referenceDescriptors);
    const fallbackReferenceDescriptor = normalizeFaceDescriptor(referenceDescriptor);
    const activeReferenceDescriptors = normalizedReferenceDescriptors.length > 0
        ? normalizedReferenceDescriptors
        : (fallbackReferenceDescriptor ? [fallbackReferenceDescriptor] : []);

    if (activeReferenceDescriptors.length === 0) {
        return {
            selectedDetection: null,
            selectedIndex: -1,
            multipleFaces: Array.isArray(detections) && detections.length > 1,
            faceState: 'reference-required',
            metrics: null,
            matches: []
        };
    }

    if (!Array.isArray(detections) || detections.length === 0) {
        return {
            selectedDetection: null,
            selectedIndex: -1,
            multipleFaces: false,
            faceState: 'not-found',
            metrics: null,
            matches: []
        };
    }

    const matches = detections.map((detection, index) => {
        const box = detection?.detection?.box || { x: 0, y: 0, width: 0, height: 0 };
        const metrics = getFaceBoxMetrics(box, videoWidth, videoHeight);
        const descriptor = Array.isArray(detection?.descriptor)
            ? detection.descriptor
            : ArrayBuffer.isView(detection?.descriptor)
                ? Array.from(detection.descriptor)
                : null;
        const referenceDistances = activeReferenceDescriptors
            .map((activeReferenceDescriptor) => calculateDescriptorDistance(activeReferenceDescriptor, descriptor))
            .filter((distance) => Number.isFinite(distance));
        const matchDistance = referenceDistances.length > 0
            ? Math.min(...referenceDistances)
            : Number.POSITIVE_INFINITY;
        const trackingDistance = lastTargetBox ? calculateFaceDistance(box, lastTargetBox) : 0;

        return {
            index,
            box,
            descriptor,
            matchDistance,
            trackingDistance,
            faceConfidence: detection?.detection?.score || 0,
            ...metrics
        };
    });

    const confirmedMatches = matches
        .filter((candidate) => Number.isFinite(candidate.matchDistance) && candidate.matchDistance <= threshold)
        .sort((left, right) => {
            if (left.matchDistance !== right.matchDistance) {
                return left.matchDistance - right.matchDistance;
            }

            return left.trackingDistance - right.trackingDistance;
        });

    if (confirmedMatches.length === 0) {
        const bestApproximateMatch = [...matches]
            .filter((candidate) => Number.isFinite(candidate.matchDistance))
            .sort((left, right) => {
                if (left.matchDistance !== right.matchDistance) {
                    return left.matchDistance - right.matchDistance;
                }

                return left.trackingDistance - right.trackingDistance;
            })[0];
        const softThreshold = Math.max(threshold, DETECTION_CONFIG.softFaceMatchThreshold);
        const canUseApproximateMatch = bestApproximateMatch
            && bestApproximateMatch.matchDistance <= softThreshold
            && bestApproximateMatch.faceConfidence >= Math.max(0.35, DETECTION_CONFIG.minFaceConfidence - 0.18)
            && bestApproximateMatch.areaRatio >= Math.max(0.02, DETECTION_CONFIG.minFaceAreaRatio * 0.7);

        if (canUseApproximateMatch) {
            return {
                selectedDetection: detections[bestApproximateMatch.index],
                selectedIndex: bestApproximateMatch.index,
                multipleFaces: detections.length > 1,
                faceState: detections.length > 1 ? 'confirmed-multi-soft' : 'soft-confirmed',
                metrics: bestApproximateMatch,
                matches
            };
        }

        const canUseSingleFaceFallback = detections.length === 1
            && bestApproximateMatch
            && bestApproximateMatch.matchDistance <= DETECTION_CONFIG.singleFaceFallbackThreshold
            && bestApproximateMatch.faceConfidence >= Math.max(0.4, DETECTION_CONFIG.minFaceConfidence - 0.2)
            && bestApproximateMatch.areaRatio >= Math.max(0.02, DETECTION_CONFIG.minFaceAreaRatio * 0.65)
            && bestApproximateMatch.centeredness >= 0.2;

        if (canUseSingleFaceFallback) {
            return {
                selectedDetection: detections[bestApproximateMatch.index],
                selectedIndex: bestApproximateMatch.index,
                multipleFaces: false,
                faceState: 'single-face-fallback',
                metrics: bestApproximateMatch,
                matches
            };
        }

        return {
            selectedDetection: null,
            selectedIndex: -1,
            multipleFaces: detections.length > 1,
            faceState: 'unconfirmed',
            metrics: matches[0] || null,
            matches
        };
    }

    const bestMatch = confirmedMatches[0];
    const secondMatch = confirmedMatches[1];
    const ambiguous = secondMatch
        && Math.abs(bestMatch.matchDistance - secondMatch.matchDistance) < ambiguityMargin;

    if (ambiguous) {
        return {
            selectedDetection: null,
            selectedIndex: -1,
            multipleFaces: detections.length > 1,
            faceState: 'ambiguous-match',
            metrics: bestMatch,
            matches
        };
    }

    return {
        selectedDetection: detections[bestMatch.index],
        selectedIndex: bestMatch.index,
        multipleFaces: detections.length > 1,
        faceState: detections.length > 1 ? 'confirmed-multi' : 'confirmed',
        metrics: bestMatch,
        matches
    };
}

export function selectTargetFace(detections = [], options = {}) {
    const { videoWidth, videoHeight, lastTargetBox } = options;

    if (!Array.isArray(detections) || detections.length === 0) {
        return {
            selectedDetection: null,
            selectedIndex: -1,
            multipleFaces: false,
            faceState: 'not-found',
            metrics: null
        };
    }

    const candidates = detections.map((detection, index) => {
        const box = detection?.detection?.box || { x: 0, y: 0, width: 0, height: 0 };
        const metrics = getFaceBoxMetrics(box, videoWidth, videoHeight);
        const faceConfidence = detection?.detection?.score || 0;
        const sizeScore = clamp(metrics.areaRatio / 0.18, 0, 1);
        const baseScore = (faceConfidence * 0.35) + (metrics.centeredness * 0.4) + (sizeScore * 0.25);

        let distanceRatio = Number.POSITIVE_INFINITY;
        let trackingScore = baseScore;

        if (lastTargetBox) {
            const distance = calculateFaceDistance(box, lastTargetBox);
            const normalizer = Math.max(videoWidth || 0, videoHeight || 0, 1);
            distanceRatio = distance / normalizer;
            const proximityScore = clamp(1 - (distanceRatio / DETECTION_CONFIG.targetSwitchDistanceRatio), 0, 1);
            const sizeSimilarity = 1 - clamp(Math.abs(box.width - lastTargetBox.width) / Math.max(lastTargetBox.width || 1, 1), 0, 1);

            trackingScore = (faceConfidence * 0.25)
                + (metrics.centeredness * 0.15)
                + (sizeScore * 0.15)
                + (proximityScore * 0.35)
                + (sizeSimilarity * 0.1);
        }

        return {
            index,
            box,
            faceConfidence,
            baseScore,
            trackingScore,
            distanceRatio,
            ...metrics
        };
    });

    const multipleFaces = detections.length > 1;

    if (lastTargetBox) {
        const trackedCandidates = [...candidates].sort((left, right) => right.trackingScore - left.trackingScore);
        const bestTrackedFace = trackedCandidates[0];

        if (bestTrackedFace && bestTrackedFace.distanceRatio <= DETECTION_CONFIG.targetSwitchDistanceRatio) {
            return {
                selectedDetection: detections[bestTrackedFace.index],
                selectedIndex: bestTrackedFace.index,
                multipleFaces,
                faceState: multipleFaces ? 'tracked' : 'single-face',
                metrics: bestTrackedFace
            };
        }
    }

    const rankedCandidates = [...candidates].sort((left, right) => right.baseScore - left.baseScore);
    const bestFace = rankedCandidates[0];
    const secondBestFace = rankedCandidates[1];
    const ambiguous = multipleFaces
        && secondBestFace
        && (bestFace.baseScore - secondBestFace.baseScore < DETECTION_CONFIG.targetAmbiguityThreshold);

    if (ambiguous) {
        return {
            selectedDetection: null,
            selectedIndex: -1,
            multipleFaces: true,
            faceState: 'ambiguous',
            metrics: bestFace
        };
    }

    return {
        selectedDetection: detections[bestFace.index],
        selectedIndex: bestFace.index,
        multipleFaces,
        faceState: multipleFaces ? 'locked' : 'single-face',
        metrics: bestFace
    };
}

export function getDominantEmotion(expressions, minEmotionConfidence = DETECTION_CONFIG.minEmotionConfidence) {
    const entries = Object.entries(expressions || {}).filter(([emotionKey]) => VALID_EMOTIONS.includes(emotionKey));

    if (entries.length === 0) {
        return {
            key: null,
            candidateKey: null,
            label: 'análise inconclusiva',
            confidence: 0,
            expressions: expressions || {},
            inconclusive: true
        };
    }

    const [emotionKey, confidence] = entries.reduce((bestEntry, currentEntry) => (
        currentEntry[1] > bestEntry[1] ? currentEntry : bestEntry
    ));

    if (confidence < minEmotionConfidence) {
        return {
            key: null,
            candidateKey: emotionKey,
            label: 'análise inconclusiva',
            confidence,
            expressions: expressions || {},
            inconclusive: true
        };
    }

    return {
        key: emotionKey,
        candidateKey: emotionKey,
        label: getEmotionLabel(emotionKey),
        confidence,
        expressions: expressions || {},
        inconclusive: false
    };
}

export function updateEmotionBuffer(currentBuffer = [], nextEntry, bufferSize = DETECTION_CONFIG.bufferSize) {
    return [...currentBuffer, nextEntry].slice(-bufferSize);
}

export function calculateEmotionStability(buffer = [], config = DETECTION_CONFIG) {
    const recentEntries = buffer.slice(-config.bufferSize);
    const validEntries = recentEntries.filter((entry) => (entry?.key || entry?.candidateKey) && (entry?.confidence || 0) > 0);

    if (validEntries.length === 0) {
        return {
            key: null,
            label: 'Aguardando análise',
            confidence: 0,
            stable: false,
            consistency: 0,
            sampleCount: 0
        };
    }

    const groupedEntries = validEntries.reduce((accumulator, entry) => {
        const emotionKey = entry.key || entry.candidateKey;
        const current = accumulator[emotionKey] || { count: 0, confidenceSum: 0 };
        accumulator[emotionKey] = {
            count: current.count + 1,
            confidenceSum: current.confidenceSum + (entry.confidence || 0)
        };
        return accumulator;
    }, {});

    const dominantGroup = Object.entries(groupedEntries)
        .map(([emotionKey, value]) => ({
            emotionKey,
            count: value.count,
            averageConfidence: value.confidenceSum / Math.max(value.count, 1)
        }))
        .sort((left, right) => {
            if (right.count !== left.count) {
                return right.count - left.count;
            }

            return right.averageConfidence - left.averageConfidence;
        })[0];

    const consistency = dominantGroup.count / Math.max(validEntries.length, 1);
    const stable = dominantGroup.count >= config.minStableSamples
        && consistency >= config.stableConsistencyThreshold
        && dominantGroup.averageConfidence >= Math.min(config.minEmotionConfidence, config.minCandidateEmotionConfidence);

    return {
        key: stable ? dominantGroup.emotionKey : null,
        candidateKey: dominantGroup.emotionKey,
        label: stable ? getEmotionLabel(dominantGroup.emotionKey) : 'Estabilizando análise',
        confidence: dominantGroup.averageConfidence,
        stable,
        consistency,
        sampleCount: validEntries.length
    };
}

export function buildEmotionEvent({ emotionKey, startedAt, endedAt, confidenceSamples = [], source = 'session' }) {
    const startTimestamp = new Date(startedAt).toISOString();
    const endTimestamp = new Date(endedAt || startedAt).toISOString();
    const durationMs = Math.max(0, new Date(endTimestamp).getTime() - new Date(startTimestamp).getTime());
    const averageConfidence = confidenceSamples.length > 0
        ? confidenceSamples.reduce((sum, value) => sum + (value || 0), 0) / confidenceSamples.length
        : 0;

    return {
        id: `event-${emotionKey}-${new Date(startTimestamp).getTime()}`,
        emotion: emotionKey,
        label: getEmotionLabel(emotionKey),
        startedAt: startTimestamp,
        endedAt: endTimestamp,
        durationMs,
        durationSeconds: Math.round(durationMs / 1000),
        averageConfidence,
        source
    };
}

export function buildCompatibilityPayload(patientId, event) {
    return {
        patient_id: Number(patientId),
        emotion: event.emotion,
        timestamp: event.startedAt
    };
}

export function normalizeEmotionRecord(record) {
    const normalizedEmotion = String(record?.emotion || '').trim().toLowerCase();

    if (!VALID_EMOTIONS.includes(normalizedEmotion)) {
        return null;
    }

    const timestamp = new Date(record.timestamp);

    if (Number.isNaN(timestamp.getTime())) {
        return null;
    }

    const normalizedConfidence = Number(record.confidence ?? record.average_confidence ?? 0);
    const normalizedDuration = Number(record.durationMs ?? record.duration_ms ?? 0);

    return {
        id: record.id || `history-${normalizedEmotion}-${timestamp.getTime()}`,
        emotion: normalizedEmotion,
        label: getEmotionLabel(normalizedEmotion),
        timestamp: timestamp.toISOString(),
        confidence: clamp(Number.isFinite(normalizedConfidence) ? normalizedConfidence : 0, 0, 1),
        durationMs: Math.max(Number.isFinite(normalizedDuration) ? normalizedDuration : 0, 0),
        source: record.source || 'history'
    };
}

export function withInferredDurations(records = []) {
    const sortedRecords = [...records]
        .map(normalizeEmotionRecord)
        .filter(Boolean)
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));

    return sortedRecords.map((record, index) => {
        if (record.durationMs > 0) {
            return record;
        }

        const nextRecord = sortedRecords[index + 1];

        if (!nextRecord) {
            return {
                ...record,
                durationMs: DETECTION_CONFIG.defaultHistoricalDurationMs
            };
        }

        const gap = new Date(nextRecord.timestamp).getTime() - new Date(record.timestamp).getTime();
        const inferredDuration = gap > 0 && gap < DETECTION_CONFIG.sessionGapMs
            ? gap
            : DETECTION_CONFIG.defaultHistoricalDurationMs;

        return {
            ...record,
            durationMs: inferredDuration
        };
    });
}

export function calculateSessionMetrics(events = [], sessionMeta = {}) {
    if (!Array.isArray(events) || events.length === 0) {
        return {
            totalDurationMs: 0,
            averageConfidence: 0,
            predominantEmotion: null,
            predominantEmotionLabel: 'Aguardando análise',
            persistentChanges: 0,
            durationsByEmotion: {},
            percentagesByEmotion: {},
            positiveDurationMs: 0,
            neutralDurationMs: 0,
            discomfortDurationMs: 0,
            observedRange: null
        };
    }

    const durationsByEmotion = {};
    let totalDurationMs = 0;
    let weightedConfidenceSum = 0;

    events.forEach((event) => {
        const duration = Math.max(event.durationMs || 0, 1000);
        const currentDuration = durationsByEmotion[event.emotion] || 0;

        durationsByEmotion[event.emotion] = currentDuration + duration;
        totalDurationMs += duration;
        weightedConfidenceSum += (event.averageConfidence || 0) * duration;
    });

    const predominantEntry = Object.entries(durationsByEmotion).sort((left, right) => right[1] - left[1])[0];
    const averageConfidence = totalDurationMs > 0 ? weightedConfidenceSum / totalDurationMs : 0;
    const percentagesByEmotion = Object.entries(durationsByEmotion).reduce((accumulator, [emotionKey, duration]) => {
        accumulator[emotionKey] = totalDurationMs > 0 ? duration / totalDurationMs : 0;
        return accumulator;
    }, {});

    const positiveDurationMs = Object.entries(durationsByEmotion).reduce((sum, [emotionKey, duration]) => (
        POSITIVE_EMOTIONS.has(emotionKey) ? sum + duration : sum
    ), 0);

    const discomfortDurationMs = Object.entries(durationsByEmotion).reduce((sum, [emotionKey, duration]) => (
        DISCOMFORT_EMOTIONS.has(emotionKey) ? sum + duration : sum
    ), 0);

    return {
        totalDurationMs,
        averageConfidence,
        predominantEmotion: predominantEntry?.[0] || null,
        predominantEmotionLabel: predominantEntry ? getEmotionLabel(predominantEntry[0]) : 'Aguardando análise',
        persistentChanges: Math.max(events.length - 1, 0),
        durationsByEmotion,
        percentagesByEmotion,
        positiveDurationMs,
        neutralDurationMs: durationsByEmotion.neutral || 0,
        discomfortDurationMs,
        observedRange: {
            startedAt: sessionMeta.startedAt || events[0].startedAt,
            endedAt: sessionMeta.endedAt || events[events.length - 1].endedAt
        }
    };
}

export function groupRecordsIntoSessions(records = []) {
    const timedRecords = withInferredDurations(records);

    if (timedRecords.length === 0) {
        return [];
    }

    const sessions = [];
    let currentSession = null;

    timedRecords.forEach((record) => {
        const eventStartedAt = record.timestamp;
        const eventEndedAt = new Date(new Date(record.timestamp).getTime() + record.durationMs).toISOString();
        const nextEvent = buildEmotionEvent({
            emotionKey: record.emotion,
            startedAt: eventStartedAt,
            endedAt: eventEndedAt,
            confidenceSamples: [record.confidence],
            source: record.source
        });

        if (!currentSession) {
            currentSession = {
                id: `session-${new Date(record.timestamp).getTime()}`,
                startedAt: record.timestamp,
                endedAt: eventEndedAt,
                events: [nextEvent]
            };
            return;
        }

        const gap = new Date(record.timestamp).getTime() - new Date(currentSession.endedAt).getTime();

        if (gap > DETECTION_CONFIG.sessionGapMs) {
            sessions.push({
                ...currentSession,
                metrics: calculateSessionMetrics(currentSession.events, currentSession)
            });
            currentSession = {
                id: `session-${new Date(record.timestamp).getTime()}`,
                startedAt: record.timestamp,
                endedAt: eventEndedAt,
                events: [nextEvent]
            };
            return;
        }

        currentSession.events.push(nextEvent);
        currentSession.endedAt = eventEndedAt;
    });

    if (currentSession) {
        sessions.push({
            ...currentSession,
            metrics: calculateSessionMetrics(currentSession.events, currentSession)
        });
    }

    return sessions.sort((left, right) => new Date(right.startedAt) - new Date(left.startedAt));
}

export function generateSessionInsights(metrics) {
    if (!metrics || metrics.totalDurationMs === 0) {
        return [
            'Nenhuma sessão concluída ainda. Assim que o monitoramento gerar eventos estáveis, os insights aparecerão aqui.'
        ];
    }

    const predominantPercentage = metrics.predominantEmotion
        ? formatConfidence(metrics.percentagesByEmotion[metrics.predominantEmotion] || 0)
        : '0%';
    const goodConfidenceRatio = metrics.averageConfidence >= 0.8
        ? 'boa'
        : metrics.averageConfidence >= 0.65
            ? 'consistente'
            : 'moderada';
    const variabilityMessage = metrics.persistentChanges >= 4
        ? 'Foi observado aumento de variação facial durante a sessão.'
        : 'A expressão facial permaneceu relativamente estável durante a maior parte da sessão.';

    return [
        `${metrics.predominantEmotionLabel} permaneceu como indicador facial predominante durante ${predominantPercentage} da sessão.`,
        `${metrics.persistentChanges} alterações persistentes de expressão foram detectadas ao longo do monitoramento.`,
        `A confiança média das análises válidas foi ${formatConfidence(metrics.averageConfidence)} e se manteve ${goodConfidenceRatio}.`,
        variabilityMessage
    ];
}

export function calculateDetectionQuality({
    faceConfidence = 0,
    emotionConfidence = 0,
    areaRatio = 0,
    centeredness = 0,
    brightness = 0.5,
    lostFrames = 0
}) {
    const areaScore = clamp(areaRatio / 0.16, 0, 1);
    const brightnessScore = brightness < DETECTION_CONFIG.brightnessWarningThreshold
        ? brightness / DETECTION_CONFIG.brightnessWarningThreshold
        : 1;
    const lossPenalty = clamp(lostFrames * 0.05, 0, 0.3);
    const score = clamp(
        (faceConfidence * 0.3)
        + (emotionConfidence * 0.2)
        + (areaScore * 0.2)
        + (centeredness * 0.15)
        + (brightnessScore * 0.15)
        - lossPenalty,
        0,
        1
    );

    if (score >= 0.85) {
        return { score, label: 'Excelente', tone: 'excellent' };
    }

    if (score >= 0.68) {
        return { score, label: 'Boa', tone: 'good' };
    }

    if (score >= 0.5) {
        return { score, label: 'Regular', tone: 'regular' };
    }

    return { score, label: 'Ruim', tone: 'poor' };
}

export function buildPositioningWarnings({
    faceState,
    multipleFaces,
    selectedMetrics,
    brightness = 0.5,
    lostFrames = 0
}) {
    const warnings = [];

    if (multipleFaces) {
        warnings.push('Múltiplas faces detectadas. Continuamos acompanhando apenas a pessoa monitorada.');
    }

    if (faceState === 'ambiguous') {
        warnings.push('Face-alvo não confirmada. A análise fica inconclusiva até identificar a pessoa monitorada com segurança.');
    }

    if (lostFrames > 0) {
        warnings.push('Face monitorada temporariamente perdida.');
    }

    if (selectedMetrics?.areaRatio > 0 && selectedMetrics.areaRatio < DETECTION_CONFIG.minFaceAreaRatio) {
        warnings.push('Posicione o rosto mais próximo da câmera.');
    }

    if (selectedMetrics?.centeredness > 0 && selectedMetrics.centeredness < DETECTION_CONFIG.centerednessWarningThreshold) {
        warnings.push('Face parcialmente fora do quadro.');
    }

    if (brightness > 0 && brightness < DETECTION_CONFIG.brightnessWarningThreshold) {
        warnings.push('Iluminação insuficiente.');
    }

    return warnings;
}
