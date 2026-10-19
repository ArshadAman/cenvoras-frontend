import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeamMembers, createTeamMember, deleteTeamMember, updateTeamMember } from '../../api/team';
import { getUserProfile } from '../../api/users';
import { UserPlusIcon, TrashIcon, ShieldCheckIcon, AdjustmentsHorizontalIcon, CurrencyDollarIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import useEscKey from '../../hooks/useEscStack';

const DEFAULT_PERMISSIONS = {
  sales: 'edit',
  purchases: 'edit',
  inventory: 'edit',
  financials: 'edit',
};

const EMPTY_TEAM_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  role: 'manager',
  permissions: { ...DEFAULT_PERMISSIONS },
};

export default function TeamSettings() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_TEAM_FORM, permissions: { ...DEFAULT_PERMISSIONS } });

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ ...EMPTY_TEAM_FORM, permissions: { ...DEFAULT_PERMISSIONS } });
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };
  useEscKey(closeModal, showAddModal, 10);

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getUserProfile
  });

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers
  });

  const teamMembersList = Array.isArray(teamMembers)
    ? teamMembers
    : teamMembers?.results || teamMembers?.data || [];

  const createMutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      await queryClient.refetchQueries({ queryKey: ['teamMembers'] });
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || err.response?.data?.password?.[0] || err.response?.data?.email?.[0] || 'Error adding team member');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTeamMember(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      await queryClient.refetchQueries({ queryKey: ['teamMembers'] });
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Error updating team member');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      await queryClient.refetchQueries({ queryKey: ['teamMembers'] });
    }
  });

  const profile = profileData?.profile || {};
  
  // Read dynamic limits directly from plan 
  const currentCount = teamMembersList.length;
  const maxLimit = Number(profile?.max_managers) || 0;
  const isVip = Boolean(
    profile?.is_lifetime_free
    || profileData?.subscription?.is_vip
    || (profile?.plan_name || '').toUpperCase().includes('VIP')
  );
  const planName = isVip
    ? 'VIP Lifetime'
    : (profile?.plan_name || 'Starter Plan');
  
  const canAddMore = maxLimit === -1 || currentCount < maxLimit;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      role: formData.role || 'manager',
      permissions: {
        ...DEFAULT_PERMISSIONS,
        ...(formData.permissions || {}),
      },
    };
    // Never send empty password on update
    if (isEditing && !payload.password) {
      delete payload.password;
    }
    if (isEditing) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (member) => {
    setEditingId(member.id);
    setIsEditing(true);
    setFormData({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: member.phone || '',
      password: '', // Leave blank unless changing
      role: member.role || 'manager',
      permissions: {
        ...DEFAULT_PERMISSIONS,
        ...(typeof member.permissions === 'object' && member.permissions !== null ? member.permissions : {}),
      },
    });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePermChange = (module, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: value
      }
    }));
  };

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Team & Roles</h1>
            <p className="text-[var(--text-secondary)]">Manage your team's access to Cenvora.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            disabled={!canAddMore}
            className={`btn-primary flex items-center gap-2 ${
              canAddMore 
                ? '' 
                : 'opacity-50 cursor-not-allowed pointer-events-none'
            }`}
          >
            <UserPlusIcon className="w-5 h-5" />
            Add Member
          </button>
        </div>

        {/* Quota Alert */}
        <div className="mb-8 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-sm mt-4 lg:mt-0">
            <div className="p-3 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
              <CurrencyDollarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-medium">Subscription Plan: <span className="text-[var(--accent-primary)] font-bold">{planName}</span></p>
              <p className="text-[var(--text-secondary)]">Limit: {maxLimit === -1 ? 'Unlimited' : maxLimit} Managers</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter">
              {currentCount} <span className="text-lg text-[var(--text-secondary)]">/ {maxLimit === -1 ? 'Unlimited' : maxLimit}</span>
            </p>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-1">Managers Used</p>
          </div>
        </div>

        {/* Team List */}
        <div className="bento-card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Name</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Email</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Role</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Joined</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-[var(--text-secondary)]">Loading team...</td></tr>
                ) : teamMembersList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <div className="w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlusIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                      </div>
                      <p className="text-[var(--text-primary)] font-medium mb-1">No team members yet</p>
                      <p className="text-sm text-[var(--text-secondary)] mb-4">Start creating managers to help run your business.</p>
                      {canAddMore && (
                        <button onClick={() => setShowAddModal(true)} className="text-[var(--accent-primary)] hover:underline text-sm font-medium">
                          + Invite your first member
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  teamMembersList.map((member) => (
                    <tr key={member.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-[var(--text-primary)] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center border border-[var(--accent-primary)]/30 text-xs font-bold">
                           {member.first_name?.[0] || member.email[0].toUpperCase()}
                        </div>
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{member.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">
                        {member.date_joined ? (() => {
                          try {
                            return new Intl.DateTimeFormat('en-GB', {
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }).format(new Date(member.date_joined));
                          } catch {
                            return new Date(member.date_joined).toLocaleDateString('en-IN');
                          }
                        })() : '-'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(member)} 
                          className="p-1.5 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 rounded-md transition-colors mr-2"
                          title="Edit Member"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)} 
                          className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-md transition-colors"
                          title="Remove Member"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bento-card !p-0 border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center sticky top-0 bg-[var(--bg-surface)]/95 backdrop-blur z-10">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                {isEditing ? <PencilSquareIcon className="w-6 h-6 text-[var(--accent-primary)]" /> : <UserPlusIcon className="w-6 h-6 text-[var(--accent-primary)]" />}
                {isEditing ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button type="button" onClick={closeModal} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">First Name</label>
                  <input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Last Name</label>
                  <input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email (Login)</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none disabled:opacity-50" disabled={isEditing} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{isEditing ? 'New Password (leave blank to keep)' : 'Temporary Password'}</label>
                  <input type="password" required={!isEditing} minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none" placeholder={isEditing ? '••••••••' : ''} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone</label>
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none">
                    <option value="manager" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Manager</option>
                    <option value="salesman" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Salesman</option>
                    <option value="accountant" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Accountant</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Setup */}
              <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                  Module Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {['sales', 'purchases', 'inventory', 'financials'].map((module) => {
                    const permValue = formData.permissions?.[module] || DEFAULT_PERMISSIONS[module] || 'edit';
                    return (
                    <div key={module} className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4">
                      <div className="font-medium text-[var(--text-primary)] capitalize mb-3 border-b border-[var(--border-subtle)] pb-2">{module} access</div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" checked={permValue === 'edit'} onChange={() => handlePermChange(module, 'edit')} className="w-4 h-4 text-[var(--accent-primary)] bg-[var(--bg-surface)] border-[var(--border-subtle)] focus:ring-[var(--accent-primary)]" />
                          <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Full Access (View, Create, Edit)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" checked={permValue === 'view'} onChange={() => handlePermChange(module, 'view')} className="w-4 h-4 text-[var(--accent-primary)] bg-[var(--bg-surface)] border-[var(--border-subtle)] focus:ring-[var(--accent-primary)]" />
                          <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">View Only (Read Only)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" checked={permValue === 'none'} onChange={() => handlePermChange(module, 'none')} className="w-4 h-4 text-[var(--accent-primary)] bg-[var(--bg-surface)] border-[var(--border-subtle)] focus:ring-[var(--accent-primary)]" />
                          <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">No Access (Hidden)</span>
                        </label>
                      </div>
                    </div>
                    );
                  })}
                  
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-subtle)]">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors">Cancel</button>
                <button type="submit" disabled={isEditing ? updateMutation.isPending : createMutation.isPending} className="btn-primary">
                  {isEditing 
                    ? (updateMutation.isPending ? 'Saving...' : 'Save Changes')
                    : (createMutation.isPending ? 'Creating...' : 'Create Member')
                  }
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
