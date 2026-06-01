import api from './api';

// Get user profile
export const getUserProfile = async () => {
  const response = await api.get('/users/profile/');
  return response.data; // Returns the full response with profile, setup_progress, account_stats
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  const response = await api.put('/users/profile/update/', profileData);
  return response.data;
};

// Partially update user profile
export const patchUserProfile = async (profileData) => {
  const response = await api.patch('/users/profile/update/', profileData);
  return response.data;
};

// Setup user profile (for initial profile completion)
export const setupUserProfile = async (profileData) => {
  const response = await api.patch('/users/profile/setup/', profileData);
  return response.data;
};

// Change password
export const changePassword = async (passwordData) => {
  const response = await api.patch('/users/change-password/', passwordData);
  return response.data;
};

// Get user details
export const getUserDetails = async () => {
  const response = await api.get('/users/me/');
  return response.data;
};

export default {
  getUserProfile,
  updateUserProfile,
  patchUserProfile,
  setupUserProfile,
  changePassword,
  getUserDetails
};