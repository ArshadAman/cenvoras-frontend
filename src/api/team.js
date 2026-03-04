import api from './api';

export const getTeamMembers = () => api.get('/users/team/').then(res => res.data);
export const createTeamMember = (data) => api.post('/users/team/', data).then(res => res.data);
export const updateTeamMember = (id, data) => api.patch(`/users/team/${id}/`, data).then(res => res.data);
export const deleteTeamMember = (id) => api.delete(`/users/team/${id}/`);
