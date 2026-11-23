const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const TOKEN_KEY = 'nscet_ai_token';
const SESSION_KEY = 'nscet_ai_guest_session';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getGuestSessionToken() {
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

export async function apiRequest(path, { method = 'GET', body = null, isFormData = false } = {}) {
  const headers = {
    'x-session-token': getGuestSessionToken(),
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData && body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === null ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || `Request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  return data;
}

export const api = {
  health: () => apiRequest('/api/health'),

  // Auth
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload }),
  register: (payload) => apiRequest('/api/auth/register', { method: 'POST', body: payload }),
  me: () => apiRequest('/api/auth/me'),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),

  // Chat
  listConversations: () => apiRequest('/api/chat/conversations'),
  createConversation: (payload) => apiRequest('/api/chat/conversations', { method: 'POST', body: payload }),
  getConversationMessages: (id) => apiRequest(`/api/chat/conversations/${id}/messages`),
  clearConversation: (id) => apiRequest(`/api/chat/conversations/${id}/messages`, { method: 'DELETE' }),
  deleteConversation: (id) => apiRequest(`/api/chat/conversations/${id}`, { method: 'DELETE' }),
  askChatbot: (payload) => apiRequest('/api/chat/ask', { method: 'POST', body: payload }),

  // Feedback
  submitFeedback: (payload) => apiRequest('/api/feedback', { method: 'POST', body: payload }),
  listFeedback: () => apiRequest('/api/feedback'),

  // College, Departments, Academics, Placements, Faculty
  getCollegeProfile: () => apiRequest('/api/college/profile'),
  listDepartments: () => apiRequest('/api/college/departments'),
  getPlacements: () => apiRequest('/api/college/placements'),
  getStudentAcademics: () => apiRequest('/api/college/student-academics'),
  getFacultyResources: () => apiRequest('/api/college/faculty-resources'),
  generateFacultyDraft: (payload) =>
    apiRequest('/api/college/faculty-assistant/draft', { method: 'POST', body: payload }),

  // Admissions
  getAdmissionInfo: () => apiRequest('/api/admissions/info'),
  submitAdmissionEnquiry: (payload) =>
    apiRequest('/api/admissions/enquiries', { method: 'POST', body: payload }),
  listAdmissionEnquiries: (status = 'all') =>
    apiRequest(`/api/admissions/enquiries?status=${encodeURIComponent(status)}`),
  updateAdmissionEnquiry: (id, payload) =>
    apiRequest(`/api/admissions/enquiries/${id}`, { method: 'PATCH', body: payload }),

  // Documents (RAG)
  listDocuments: (category = '') =>
    apiRequest(`/api/documents${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  uploadDocument: (formData) =>
    apiRequest('/api/documents/upload', { method: 'POST', body: formData, isFormData: true }),
  replaceDocument: (id, formData) =>
    apiRequest(`/api/documents/${id}/replace`, { method: 'PUT', body: formData, isFormData: true }),
  deleteDocument: (id) => apiRequest(`/api/documents/${id}`, { method: 'DELETE' }),
  getDocumentChunks: (id) => apiRequest(`/api/documents/${id}/chunks`),
  searchDocuments: (payload) => apiRequest('/api/documents/search', { method: 'POST', body: payload }),

  // Admin
  getAdminAnalytics: () => apiRequest('/api/admin/analytics'),
  listUsers: () => apiRequest('/api/admin/users'),
  createUser: (payload) => apiRequest('/api/admin/users', { method: 'POST', body: payload }),
  updateUser: (id, payload) => apiRequest(`/api/admin/users/${id}`, { method: 'PATCH', body: payload }),
  listAuditLogs: () => apiRequest('/api/admin/audit-logs'),
};
