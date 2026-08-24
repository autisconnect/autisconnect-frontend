import apiClient from '../services/api';

function resolveDownloadFilename(contentDisposition, fallback) {
  const header = `${contentDisposition || ''}`;
  const utf8Match = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = header.match(/filename\s*=\s*"([^"]+)"/i) || header.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return fallback;
}

function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchSchoolProfile() {
  const response = await apiClient.get('/school/profile');
  return response.data;
}

export async function updateSchoolProfile(payload) {
  const response = await apiClient.patch('/school/profile', payload);
  return response.data;
}

export async function fetchSchoolDashboard() {
  const response = await apiClient.get('/school/dashboard');
  return response.data;
}

export async function fetchSchoolTeam() {
  const response = await apiClient.get('/school/team');
  return response.data;
}

export async function createSchoolTeamMember(payload) {
  const response = await apiClient.post('/school/team', payload);
  return response.data;
}

export async function updateSchoolTeamMember(userId, payload) {
  const response = await apiClient.patch(`/school/team/${userId}`, payload);
  return response.data;
}

export async function fetchSchoolClassrooms() {
  const response = await apiClient.get('/school/classrooms');
  return response.data;
}

export async function fetchSchoolClassroomDetails(classroomId) {
  const response = await apiClient.get(`/school/classrooms/${classroomId}`);
  return response.data;
}

export async function createSchoolClassroom(payload) {
  const response = await apiClient.post('/school/classrooms', payload);
  return response.data;
}

export async function fetchSchoolLocations(params = {}) {
  const response = await apiClient.get('/school/locations', { params });
  return response.data;
}

export async function createSchoolLocation(payload) {
  const response = await apiClient.post('/school/locations', payload);
  return response.data;
}

export async function updateSchoolLocation(locationId, payload) {
  const response = await apiClient.patch(`/school/locations/${locationId}`, payload);
  return response.data;
}

export async function fetchSchoolCameras(params = {}) {
  const response = await apiClient.get('/school/cameras', { params });
  return response.data;
}

export async function fetchSchoolCameraDetails(cameraId) {
  const response = await apiClient.get(`/school/cameras/${cameraId}`);
  return response.data;
}

export async function createSchoolCamera(payload) {
  const response = await apiClient.post('/school/cameras', payload);
  return response.data;
}

export async function updateSchoolCamera(cameraId, payload) {
  const response = await apiClient.patch(`/school/cameras/${cameraId}`, payload);
  return response.data;
}

export async function testSchoolCamera(cameraId) {
  const response = await apiClient.post(`/school/cameras/${cameraId}/test`);
  return response.data;
}

export async function fetchSchoolStudents(params = {}) {
  const response = await apiClient.get('/school/students', { params });
  return response.data;
}

export async function fetchSchoolStudentDetails(patientId) {
  const response = await apiClient.get(`/school/students/${patientId}`);
  return response.data;
}

export async function fetchSchoolStudentFaceReference(patientId) {
  const response = await apiClient.get(`/school/students/${patientId}/face-reference`);
  return response.data;
}

export async function saveSchoolStudentFaceReference(patientId, payload) {
  const response = await apiClient.put(`/school/students/${patientId}/face-reference`, payload);
  return response.data;
}

export async function deleteSchoolStudentFaceReference(patientId) {
  const response = await apiClient.delete(`/school/students/${patientId}/face-reference`);
  return response.data;
}

export async function createSchoolPatientLink(payload) {
  const response = await apiClient.post('/school/patient-links', payload);
  return response.data;
}

export async function updateSchoolPatientLink(linkId, payload) {
  const response = await apiClient.patch(`/school/patient-links/${linkId}`, payload);
  return response.data;
}

export async function fetchSchoolMonitoringConfig(classroomId) {
  const response = await apiClient.get(`/school/classrooms/${classroomId}/monitoring-config`);
  return response.data;
}

export async function fetchSchoolMonitoringSessions(params = {}) {
  const response = await apiClient.get('/school/monitoring-sessions', { params });
  return response.data;
}

export async function fetchSchoolMonitoringSession(sessionId) {
  const response = await apiClient.get(`/school/monitoring-sessions/${sessionId}`);
  return response.data;
}

export async function fetchSchoolMonitoringSessionConfig(sessionId) {
  const response = await apiClient.get(`/school/monitoring-sessions/${sessionId}/config`);
  return response.data;
}

export async function createSchoolMonitoringSession(payload) {
  const response = await apiClient.post('/school/monitoring-sessions', payload);
  return response.data;
}

export async function updateSchoolMonitoringPatientStatus(sessionId, patients) {
  const response = await apiClient.patch(`/school/monitoring-sessions/${sessionId}/patient-status`, { patients });
  return response.data;
}

export async function pauseSchoolMonitoringSession(sessionId) {
  const response = await apiClient.patch(`/school/monitoring-sessions/${sessionId}/pause`);
  return response.data;
}

export async function resumeSchoolMonitoringSession(sessionId) {
  const response = await apiClient.patch(`/school/monitoring-sessions/${sessionId}/resume`);
  return response.data;
}

export async function endSchoolMonitoringSession(sessionId, payload = {}) {
  const response = await apiClient.patch(`/school/monitoring-sessions/${sessionId}/end`, payload);
  return response.data;
}

export async function createSchoolEmotionEvent(payload) {
  const response = await apiClient.post('/school/emotion-events', payload);
  return response.data;
}

export async function fetchSchoolEvents(params = {}) {
  const response = await apiClient.get('/school/events', { params });
  return response.data;
}

export async function fetchSchoolEmotionEvents(params = {}) {
  const response = await apiClient.get('/school/emotion-events', { params });
  return response.data;
}

export async function fetchSchoolEmotionEventDetails(eventId) {
  const response = await apiClient.get(`/school/emotion-events/${eventId}`);
  return response.data;
}

export async function createSchoolEventContext(payload) {
  const response = await apiClient.post('/school/event-contexts', payload);
  return response.data;
}

export async function fetchSchoolReports(params = {}) {
  const response = await apiClient.get('/school/reports', { params });
  return response.data;
}

export async function exportSchoolReportsPdf(params = {}) {
  const response = await apiClient.get('/school/reports/pdf', {
    params,
    responseType: 'blob'
  });

  const filename = resolveDownloadFilename(
    response.headers?.['content-disposition'],
    `autisconnect-school-reports-${new Date().toISOString().slice(0, 10)}.pdf`
  );

  triggerBlobDownload(new Blob([response.data], { type: 'application/pdf' }), filename);

  return {
    ok: true,
    filename
  };
}

export async function fetchSchoolMonitoringOverview() {
  const response = await apiClient.get('/school/monitoring/overview');
  return response.data;
}

export async function fetchSchoolMonitoringCentral(params = {}) {
  const response = await apiClient.get('/school/monitoring/central', { params });
  return response.data;
}

export async function startSchoolMonitoringCentralOperation(payload = {}) {
  const response = await apiClient.post('/school/monitoring/central/start', payload);
  return response.data;
}
