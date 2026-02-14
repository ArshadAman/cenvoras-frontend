import api from './api';

// AI Chat
export const askAI = (question) => api.post('/ai/chat/', { question });
