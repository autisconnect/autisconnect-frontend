const STORAGE_KEY = 'ac-school-browser-camera-bindings-v1';

function readBindings() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeBindings(bindings) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings || {}));
}

export function getStoredSchoolCameraBinding(cameraId) {
  const bindings = readBindings();
  const key = String(cameraId || '');
  return key ? bindings[key] || null : null;
}

export function saveSchoolCameraBinding(cameraId, device) {
  if (!cameraId || !device?.deviceId) {
    return null;
  }

  const bindings = readBindings();
  const key = String(cameraId);
  const nextValue = {
    deviceId: device.deviceId,
    label: device.label || '',
    updatedAt: new Date().toISOString()
  };

  bindings[key] = nextValue;
  writeBindings(bindings);
  return nextValue;
}

export function clearSchoolCameraBinding(cameraId) {
  const bindings = readBindings();
  const key = String(cameraId || '');
  if (!key || !bindings[key]) {
    return;
  }

  delete bindings[key];
  writeBindings(bindings);
}

export async function listSchoolVideoDevices({ requestPermission = false } = {}) {
  if (!navigator?.mediaDevices?.enumerateDevices) {
    throw new Error('Este navegador nao suporta a listagem de dispositivos de video.');
  }

  let probeStream = null;

  try {
    if (requestPermission && navigator.mediaDevices.getUserMedia) {
      probeStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
      });
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`
      }));
  } finally {
    if (probeStream) {
      probeStream.getTracks().forEach((track) => track.stop());
    }
  }
}

export function resolvePreferredSchoolDeviceId(cameraId, devices = []) {
  const stored = getStoredSchoolCameraBinding(cameraId);
  if (stored?.deviceId && devices.some((device) => device.deviceId === stored.deviceId)) {
    return stored.deviceId;
  }

  if (devices.length === 1) {
    return devices[0].deviceId;
  }

  return '';
}
