import apiClient from '../services/api';

const FACE_REFERENCE_REQUEST_TIMEOUT_MS = 12000;
const FACE_REFERENCE_CACHE_TTL_MS = 2500;
const faceReferenceCache = new Map();

function getFaceReferenceCacheKey(patientId) {
    return String(patientId);
}

function getCachedFaceReference(patientId) {
    const cacheEntry = faceReferenceCache.get(getFaceReferenceCacheKey(patientId));

    if (!cacheEntry?.data || cacheEntry.expiresAt <= Date.now()) {
        return null;
    }

    return cacheEntry.data;
}

function setCachedFaceReference(patientId, data) {
    faceReferenceCache.set(getFaceReferenceCacheKey(patientId), {
        data,
        promise: null,
        expiresAt: Date.now() + FACE_REFERENCE_CACHE_TTL_MS
    });

    return data;
}

export function resolveEmotionServiceErrorMessage(error, {
    timeoutMessage = 'A operacao demorou mais do que o esperado.',
    networkMessage = 'Nao foi possivel se conectar ao servidor no momento.',
    fallbackMessage = 'Nao foi possivel concluir a operacao solicitada.'
} = {}) {
    if (error?.code === 'ECONNABORTED') {
        return timeoutMessage;
    }

    if (!error?.response) {
        return networkMessage;
    }

    return error.response?.data?.error || error.message || fallbackMessage;
}

export async function fetchEmotionHistory(patientId) {
    if (!patientId) {
        return [];
    }

    const response = await apiClient.get(`/emotions/${patientId}`);
    return Array.isArray(response.data) ? response.data : [];
}

export async function saveEmotionRecord(payload) {
    return apiClient.post('/emotions', payload);
}

export async function fetchPatientFaceReference(patientId) {
    if (!patientId) {
        return { hasReference: false, patientId: null };
    }

    const cachedReference = getCachedFaceReference(patientId);

    if (cachedReference) {
        return cachedReference;
    }

    const cacheKey = getFaceReferenceCacheKey(patientId);
    const cacheEntry = faceReferenceCache.get(cacheKey);

    if (cacheEntry?.promise) {
        return cacheEntry.promise;
    }

    const requestPromise = apiClient.get(`/patients/${patientId}/face-reference`, {
        timeout: FACE_REFERENCE_REQUEST_TIMEOUT_MS
    })
        .then((response) => setCachedFaceReference(
            patientId,
            response.data || { hasReference: false, patientId }
        ))
        .catch((error) => {
            const activeEntry = faceReferenceCache.get(cacheKey);

            if (activeEntry?.promise === requestPromise) {
                faceReferenceCache.delete(cacheKey);
            }

            throw error;
        });

    faceReferenceCache.set(cacheKey, {
        data: cacheEntry?.data || null,
        promise: requestPromise,
        expiresAt: 0
    });

    return requestPromise;
}

export async function savePatientFaceReference(patientId, payload) {
    const response = await apiClient.put(`/patients/${patientId}/face-reference`, payload, {
        timeout: FACE_REFERENCE_REQUEST_TIMEOUT_MS
    });
    return setCachedFaceReference(patientId, response.data);
}

export async function deletePatientFaceReference(patientId) {
    const response = await apiClient.delete(`/patients/${patientId}/face-reference`, {
        timeout: FACE_REFERENCE_REQUEST_TIMEOUT_MS
    });
    setCachedFaceReference(patientId, {
        hasReference: false,
        patientId,
        descriptor: null,
        referenceImageData: null,
        captureMode: 'upload',
        faceConfidence: null,
        createdAt: null,
        updatedAt: null
    });

    return response.data;
}
