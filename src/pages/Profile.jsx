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
    gstin: '',
    gem_id: '',
    dl_number: ''
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
          gstin: profile.gstin || '',
          gem_id: profile.gem_id || '',
          dl_number: profile.dl_number || ''
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
      gstin: formData.gstin,
      gem_id: formData.gem_id,
      dl_number: formData.dl_number
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
        gstin: profile.gstin || '',
        gem_id: profile.gem_id || '',
        dl_number: profile.dl_number || ''
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

  const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Your Name';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
  const memberDays = userProfile?.account_stats?.days_since_signup || 0;
  const trialDays = userProfile?.account_stats?.trial_days_remaining ?? '-';
  const totalInvoices = userProfile?.account_stats?.total_invoices ?? 0;
  const roleLabel = isAdmin
    ? (userProfile?.profile?.business_name || 'Business Owner')
    : (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Team Member');

  return (
    <Layout onLogout={onLogout}>
      <div className="page-bg relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-0 top-52 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-8 lg:py-12">
          <div className="mx-auto max-w-7xl space-y-7">
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-500/20 ring-1 ring-white/20 md:h-20 md:w-20">
                    <span className="text-2xl font-semibold tracking-wide text-white md:text-3xl">{initials}</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">Profile Workspace</p>
                    <h1 className="mt-1 text-3xl font-semibold text-white md:text-4xl">{fullName}</h1>
                    <p className="mt-2 text-sm text-white/65">{roleLabel}</p>
                    {isAdmin && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85">
                        <ShieldCheckIcon className={`h-4 w-4 ${(userProfile?.profile?.plan_name || '').includes('Starter') ? 'text-amber-300' : 'text-emerald-300'}`} />
                        {userProfile?.profile?.plan_name || 'Plan'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <KeyIcon className="h-4 w-4 text-cyan-300" />
                    Change Password
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-7 xl:grid-cols-12">
              <aside className="space-y-6 xl:col-span-4">
                <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
                  <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-white">
                    <ChartBarIcon className="h-5 w-5 text-cyan-300" />
                    Account Signals
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Member Since</p>
                      <p className="mt-1 text-lg font-semibold text-white">{memberDays} days</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Trial Status</p>
                      <p className="mt-1 text-lg font-semibold text-white">{trialDays} days left</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Invoices Generated</p>
                      <p className="mt-1 text-lg font-semibold text-white">{totalInvoices}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
                  <h3 className="mb-4 text-base font-semibold text-white">Identity Snapshot</h3>
                  <div className="space-y-3 text-sm text-white/75">
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <EnvelopeIcon className="h-4 w-4 text-cyan-300" />
                      <span className="truncate">{formData.email || 'No email added'}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <PhoneIcon className="h-4 w-4 text-cyan-300" />
                      <span>{formData.phone || 'No phone added'}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <BuildingOfficeIcon className="h-4 w-4 text-cyan-300" />
                      <span className="truncate">{formData.business_name || 'No business name'}</span>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <MapPinIcon className="mt-0.5 h-4 w-4 text-cyan-300" />
                      <span className="line-clamp-3">{formData.business_address || 'No address added'}</span>
                    </div>
                  </div>
                </section>
              </aside>

              <section className="xl:col-span-8">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl md:p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Account Details</h2>
                      <p className="mt-1 text-sm text-white/55">Refined profile controls for daily operations and billing identity.</p>
                    </div>
                  </div>

                  <form id="profile-form" onSubmit={handleSubmit} className="space-y-7">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        <UserIcon className="h-4 w-4" />
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        <EnvelopeIcon className="h-4 w-4" />
                        Contact Details
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="name@example.com"
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        Business Information
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                          type="text"
                          name="business_name"
                          value={formData.business_name}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="Business name"
                        />
                        <input
                          type="text"
                          name="gstin"
                          value={formData.gstin}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="GSTIN"
                          maxLength={15}
                        />
                        <input
                          type="text"
                          name="gem_id"
                          value={formData.gem_id}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="GEM ID"
                        />
                        <input
                          type="text"
                          name="dl_number"
                          value={formData.dl_number}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="DL Number"
                        />
                      </div>
                      <textarea
                        name="business_address"
                        value={formData.business_address}
                        onChange={handleInputChange}
                        disabled={!isEditing || updateProfileMutation.isPending}
                        rows={4}
                        className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                        placeholder="Business address"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-6">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </section>
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