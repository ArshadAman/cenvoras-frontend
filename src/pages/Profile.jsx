import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon, 
  MapPinIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { getUserProfile, updateUserProfile, changePassword } from '../api/users';
import { getUserRole } from '../utils/auth';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
      onClose();
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
    },
    onError: (error) => {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && !errorData.detail && !errorData.message) {
          Object.entries(errorData).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => toast.error(`${field}: ${msg}`));
            } else {
              toast.error(`${field}: ${messages}`);
            }
          });
        } else {
          const errorMessage = errorData.detail || errorData.message || 'Failed to change password';
          toast.error(errorMessage);
        }
      } else {
        toast.error('Network error. Please try again.');
      }
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!passwordData.current_password) {
      toast.error('Current password is required');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_new_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bento-card w-full max-w-md p-8 relative animate-fade-up shadow-2xl shadow-cyan-900/20">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <KeyIcon className="w-6 h-6 mr-2 text-cyan-400" />
          Change Password
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="current_password"
                value={passwordData.current_password}
                onChange={handleInputChange}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all pr-12"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="new_password"
                value={passwordData.new_password}
                onChange={handleInputChange}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all pr-12"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_new_password"
                value={passwordData.confirm_new_password}
                onChange={handleInputChange}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all pr-12"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-primary w-full shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Profile = ({ onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    business_name: '',
    business_address: '',
    gstin: ''
  });

  const queryClient = useQueryClient();
  const role = getUserRole();
  const isAdmin = role === 'admin';

  // Fetch user profile
  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile
  });

  // Update form data when user profile is loaded
  useEffect(() => {
    if (userProfile && userProfile.profile) {
      const profile = userProfile.profile;
      setFormData(prev => ({
        ...prev,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        business_name: profile.business_name || '',
        business_address: profile.business_address || '',
        gstin: profile.gstin || ''
      }));
    }
  }, [userProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: async (data) => {
      // Refetch the profile data to ensure we have the latest
      await queryClient.invalidateQueries(['userProfile']);
      await queryClient.refetchQueries(['userProfile']);
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    },
    onError: (error) => {
      // Handle different types of errors
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for field-specific errors
        if (typeof errorData === 'object' && !errorData.detail && !errorData.message) {
          // Display field-specific errors
          Object.entries(errorData).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => toast.error(`${field}: ${msg}`));
            } else {
              toast.error(`${field}: ${messages}`);
            }
          });
        } else {
          // Display general error message
          const errorMessage = errorData.detail || 
                              errorData.message || 
                              'Failed to update profile';
          toast.error(errorMessage);
        }
      } else {
        toast.error('Network error. Please check your connection and try again.');
      }
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format GSTIN to uppercase
    if (name === 'gstin') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting profile update...', formData);
    // Prepare data for submission
    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      business_name: formData.business_name,
      business_address: formData.business_address,
      gstin: formData.gstin
    };

    updateProfileMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
    if (userProfile && userProfile.profile) {
      const profile = userProfile.profile;
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        business_name: profile.business_name || '',
        business_address: profile.business_address || '',
        gstin: profile.gstin || ''
      });
    }
  };

  if (isLoading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="page-bg">
          <div className="container mx-auto px-4 py-8">
            <Loader />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout onLogout={onLogout}>
        <div className="page-bg">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Profile</h2>
                <p className="text-white/80">
                  {error.response?.data?.detail || 'Failed to load profile data'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="page-bg">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">Profile Settings</h1>
                <p className="text-white/60 text-lg">Manage your personal information and account preferences</p>
              </div>
              
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl border border-white/10 transition-all duration-300 flex items-center whitespace-nowrap"
              >
                <KeyIcon className="w-4 h-4 mr-2 text-cyan-400" />
                Change Password
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Profile Summary & Stats */}
              <div className="space-y-8">
                {/* Profile Summary Card */}
                <div className="bento-card p-8 text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-32 bg-white/5 opacity-50"></div>
                  
                  <div className="relative z-10 mt-4">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full p-1 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 ring-1 ring-white/10 shadow-2xl">
                      <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden">
                        <UserIcon className="w-16 h-16 text-gray-400 group-hover:text-white transition-colors duration-300" />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {userProfile?.profile?.first_name} {userProfile?.profile?.last_name}
                    </h2>
                    <p className="text-cyan-400 font-medium mb-4">
                      {isAdmin 
                        ? (userProfile?.profile?.business_name || 'Business Owner') 
                        : (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Team Member')
                      }
                    </p>
                    
                    {isAdmin && (
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <ShieldCheckIcon className={`w-5 h-5 mr-2 ${
                          (userProfile?.profile?.plan_name || '').includes('Starter') ? 'text-yellow-400' : 'text-green-400'
                        }`} />
                        <span className="text-white/90 font-medium">
                          {userProfile?.profile?.plan_name || 'Loading Plan...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Stats */}
                {userProfile?.account_stats && (
                  <div className="bento-card p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <ChartBarIcon className="w-5 h-5 mr-2 text-cyan-400" />
                      Account Overview
                    </h3>
                    <div className="space-y-4">
                      <div className="stat-card bg-[#111] border border-white/5 p-4 flex items-center justify-between rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mr-4 border border-blue-500/20">
                            <CalendarIcon className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Member Since</p>
                            <p className="text-white font-bold mt-0.5">{userProfile.account_stats.days_since_signup} days ago</p>
                          </div>
                        </div>
                      </div>

                      <div className="stat-card bg-[#111] border border-white/5 p-4 flex items-center justify-between rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mr-4 border border-green-500/20">
                            <SparklesIcon className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Trial Status</p>
                            <p className="text-white font-bold mt-0.5">{userProfile.account_stats.trial_days_remaining} days left</p>
                          </div>
                        </div>
                      </div>

                      <div className="stat-card bg-[#111] border border-white/5 p-4 flex items-center justify-between rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mr-4 border border-purple-500/20">
                            <DocumentTextIcon className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Total Invoices</p>
                            <p className="text-white font-bold mt-0.5">{userProfile.account_stats.total_invoices} generated</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <div className="bento-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white">Account Details</h3>
                    {isAdmin && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <SparklesIcon className="w-4 h-4 text-cyan-400" />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Info Section */}
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center border-b border-white/5 pb-2">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">First Name</label>
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            disabled={!isEditing || updateProfileMutation.isPending}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all disabled:opacity-50"
                            placeholder="Enter first name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Name</label>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            disabled={!isEditing || updateProfileMutation.isPending}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all disabled:opacity-50"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center border-b border-white/5 pb-2">
                        <EnvelopeIcon className="w-4 h-4 mr-2" />
                        Contact Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email Address</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!isEditing || updateProfileMutation.isPending}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all disabled:opacity-50"
                            placeholder="name@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing || updateProfileMutation.isPending}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all disabled:opacity-50"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Info Section */}
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center border-b border-white/5 pb-2">
                        <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                        Business Information
                      </h4>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Business Name</label>
                            <input
                              type="text"
                              name="business_name"
                              value={formData.business_name}
                              onChange={handleInputChange}
                              disabled={!isEditing || updateProfileMutation.isPending}
                              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all disabled:opacity-50"
                              placeholder="Your Business Name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">GSTIN</label>
                            <input
                              type="text"
                              name="gstin"
                              value={formData.gstin}
                              onChange={handleInputChange}
                              disabled={!isEditing || updateProfileMutation.isPending}
                              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all disabled:opacity-50"
                              placeholder="29ABCDE1234F1Z5"
                              maxLength={15}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Business Address</label>
                          <textarea
                            name="business_address"
                            value={formData.business_address}
                            onChange={handleInputChange}
                            disabled={!isEditing || updateProfileMutation.isPending}
                            rows={3}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all resize-none disabled:opacity-50"
                            placeholder="Full business address"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isAdmin && isEditing && (
                      <div className="flex items-center justify-end space-x-4 pt-6 mt-8 border-t border-white/10">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="px-6 py-3 rounded-xl text-gray-400 font-medium hover:text-white hover:bg-white/5 transition-all duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="btn-primary shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updateProfileMutation.isPending ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </span>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Password Modal */}
        <ChangePasswordModal 
          isOpen={isPasswordModalOpen} 
          onClose={() => setIsPasswordModalOpen(false)} 
        />
      </div>
    </Layout>
  );
};

export default Profile;