function openSchoolRouteInNewTab(path) {
  if (typeof window === 'undefined') {
    return;
  }

  window.open(path, '_blank', 'noopener,noreferrer');
}

export function openSchoolMonitoringCenterTab(filters = {}) {
  const search = new URLSearchParams();

  if (filters.locationId) {
    search.set('locationId', String(filters.locationId));
  }

  if (filters.classroomId) {
    search.set('classroomId', String(filters.classroomId));
  }

  if (filters.cameraStatus) {
    search.set('cameraStatus', String(filters.cameraStatus));
  }

  if (filters.sessionStatus) {
    search.set('sessionStatus', String(filters.sessionStatus));
  }

  const query = search.toString();
  openSchoolRouteInNewTab(`/school/monitoring/kiosk${query ? `?${query}` : ''}`);
}

export function openSchoolCameraMonitorTab(cameraId) {
  if (!cameraId) {
    return;
  }

  openSchoolRouteInNewTab(`/school/cameras/${cameraId}/monitor`);
}
