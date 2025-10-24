import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { UserIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, MapPinIcon, EyeIcon, EyeSlashIcon, DocumentTextIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { getUserProfile, updateUserProfile } from '../api/users';

const Profile = ({ onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    business_name: '',
    business_address: '',
    gstin: '',
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  const queryClient = useQueryClient();

  // Add theme CSS
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .profile-bg {
        background: linear-gradient(135deg, #1a2341 0%, #2d3561 50%, #1a2341 100%);
        min-height: 100vh;
      }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
      }
      
      .glass-input {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      }
      
      .glass-input:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(127, 211, 247, 0.5);
        box-shadow: 0 0 20px rgba(127, 211, 247, 0.3);
      }
      
      .gradient-text {
        background: linear-gradient(-45deg, #7fd3f7, #b6e0f7, #eaf6fa, #7fd3f7);
        background-size: 400% 400%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

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
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      }));
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to update profile';
      toast.error(errorMessage);
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
    
    // Validate GSTIN format if provided
    if (formData.gstin && formData.gstin.length > 0) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gstin)) {
        toast.error('Please enter a valid GSTIN format (e.g., 29ABCDE1234F1Z5)');
        return;
      }
    }
    
    // Validate passwords if trying to change password
    if (formData.new_password || formData.confirm_new_password) {
      if (!formData.current_password) {
        toast.error('Current password is required to change password');
        return;
      }
      if (formData.new_password !== formData.confirm_new_password) {
        toast.error('New passwords do not match');
        return;
      }
      if (formData.new_password.length < 8) {
        toast.error('New password must be at least 8 characters long');
        return;
      }
    }

    // Validate email/password changes require current password
    const originalProfile = userProfile?.profile;
    if (originalProfile && (
      formData.email !== originalProfile.email
    )) {
      if (!formData.current_password) {
        toast.error('Current password is required to change email address');
        return;
      }
    }

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

    // Include password fields only if they're provided
    if (formData.current_password && formData.new_password) {
      updateData.current_password = formData.current_password;
      updateData.new_password = formData.new_password;
      updateData.confirm_new_password = formData.confirm_new_password;
    }

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
        gstin: profile.gstin || '',
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
    }
  };

  if (isLoading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="profile-bg">
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
        <div className="profile-bg">
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
      <div className="profile-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="glass-card p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold gradient-text mb-2">Profile Settings</h1>
                  <p className="text-white/70">Manage your account information and preferences</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              
              {/* Account Statistics */}
              {userProfile && userProfile.account_stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CalendarIcon className="w-5 h-5 text-cyan-400 mr-2" />
                      <span className="text-white/70 text-sm">Account Age</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{userProfile.account_stats.days_since_signup} days</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <ChartBarIcon className="w-5 h-5 text-cyan-400 mr-2" />
                      <span className="text-white/70 text-sm">Trial Remaining</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{userProfile.account_stats.trial_days_remaining} days</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DocumentTextIcon className="w-5 h-5 text-cyan-400 mr-2" />
                      <span className="text-white/70 text-sm">Total Invoices</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{userProfile.account_stats.total_invoices}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Subscription Status */}
            {userProfile && userProfile.profile && (
              <div className="glass-card p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Subscription Status</h3>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userProfile.profile.subscription_status === 'trial' 
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {userProfile.profile.subscription_status === 'trial' ? 'Trial' : 'Premium'}
                      </span>
                      {userProfile.profile.is_trial_active && (
                        <span className="text-white/70 text-sm">
                          Trial ends: {new Date(userProfile.profile.trial_ends_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/70">GST Invoice Generation</p>
                    <span className={`text-sm font-medium ${
                      userProfile.profile.can_generate_gst_invoice ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {userProfile.profile.can_generate_gst_invoice ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Form */}
            <div className="glass-card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2 text-cyan-400" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 glass-input rounded-lg text-white placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 glass-input rounded-lg text-white placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <EnvelopeIcon className="w-5 h-5 mr-2 text-cyan-400" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 glass-input rounded-lg text-white placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 glass-input rounded-lg text-white placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <BuildingOfficeIcon className="w-5 h-5 mr-2 text-cyan-400" />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 glass-input rounded-lg text-white placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your business name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        GSTIN (GST Identification Number)
                      </label>
                      <input
                        type="text"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 glass-input rounded-lg text-white placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your GSTIN (e.g., 29ABCDE1234F1Z5)"
                        maxLength={15}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Business Address
                      </label>
                      <textarea
                        name="business_address"
                        value={formData.business_address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-4 py-3 glass-input rounded-lg text-white placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                        placeholder="Enter your business address"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Change Section */}
                {isEditing && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <EyeIcon className="w-5 h-5 mr-2 text-cyan-400" />
                      Change Password (Optional)
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            name="current_password"
                            value={formData.current_password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 pr-12 glass-input rounded-lg text-white placeholder-white/50"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                          >
                            {showCurrentPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              name="new_password"
                              value={formData.new_password}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 pr-12 glass-input rounded-lg text-white placeholder-white/50"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                            >
                              {showNewPassword ? (
                                <EyeSlashIcon className="w-5 h-5" />
                              ) : (
                                <EyeIcon className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirm_new_password"
                              value={formData.confirm_new_password}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 pr-12 glass-input rounded-lg text-white placeholder-white/50"
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                            >
                              {showConfirmPassword ? (
                                <EyeSlashIcon className="w-5 h-5" />
                              ) : (
                                <EyeIcon className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition duration-300 border border-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;