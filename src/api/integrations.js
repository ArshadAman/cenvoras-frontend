import api from './api';

// Notifications
export const sendInvoiceNotification = (data) => api.post('/integration/notifications/send/', data);
export const getNotificationLogs = () => api.get('/integration/notifications/logs/');
export const getNotificationTemplates = () => api.get('/integration/notifications/templates/');
export const createNotificationTemplate = (data) => api.post('/integration/notifications/templates/', data);

// Barcode
export const lookupBarcode = (barcode) => api.get(`/integration/barcode/${barcode}/`);

// Backup & Restore
export const exportData = () => api.get('/integration/backup/export/');
export const importData = (data) => api.post('/integration/backup/import/', data);

// API Keys
export const getApiKeys = () => api.get('/integration/api-keys/');
export const createApiKey = (data) => api.post('/integration/api-keys/', data);
export const deleteApiKey = (id) => api.delete(`/integration/api-keys/${id}/`);
