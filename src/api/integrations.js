import api from './api';

// Email Notifications
export const sendCustomEmail = (data) => api.post('/integration/notifications/send-email/', data);
export const sendPaymentReminders = () => api.post('/integration/notifications/send-reminders/');
export const getNotificationLogs = () => api.get('/integration/notifications/logs/');
export const getNotificationTemplates = () => api.get('/integration/notifications/templates/');
export const createNotificationTemplate = (data) => api.post('/integration/notifications/templates/', data);

// Legacy generic send
export const sendInvoiceNotification = (data) => api.post('/integration/notifications/send/', data);

// Barcode
export const lookupBarcode = (barcode) => api.get(`/integration/barcode/${barcode}/`);

// Backup & Restore
export const exportData = (format = 'json') =>
	api.get(`/integration/backup/export/?format=${format}`, {
		responseType: format === 'csv' ? 'blob' : 'json',
	});

export const importData = (data, format = 'json') => {
	if (format === 'csv') {
		const formData = new FormData();
		formData.append('file', data);
		formData.append('format', 'csv');
		return api.post('/integration/backup/import/?format=csv', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
	}
	return api.post('/integration/backup/import/?format=json', data);
};

// API Keys (Coming Soon — endpoints kept for future use)
export const getApiKeys = () => api.get('/integration/api-keys/');
export const createApiKey = (data) => api.post('/integration/api-keys/', data);
export const deleteApiKey = (id) => api.delete(`/integration/api-keys/${id}/`);
