import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeamMembers, createTeamMember, deleteTeamMember, updateTeamMember } from '../../api/team';
import { getUserProfile } from '../../api/users';
import { UserPlusIcon, TrashIcon, ShieldCheckIcon, AdjustmentsHorizontalIcon, CurrencyDollarIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export default function TeamSettings() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'manager',
    permissions: {
      sales: 'edit',
      purchases: 'edit',
      inventory: 'edit',
      financials: 'edit'
    }
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries(['teamMembers']);
      setShowAddModal(false);
      setFormData({
        first_name: '', last_name: '', email: '', phone: '', password: '', role: 'manager',
        permissions: { sales: 'edit', purchases: 'edit', inventory: 'edit', financials: 'edit' }
      });
    },
    onError: (err) => {
      alert(err.response?.data?.detail || err.response?.data?.email?.[0] || 'Error adding team member');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTeamMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamMembers']);
      setShowAddModal(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        first_name: '', last_name: '', email: '', phone: '', password: '', role: 'manager',
        permissions: { sales: 'edit', purchases: 'edit', inventory: 'edit', financials: 'edit' }
      });
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Error updating team member');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries(['teamMembers']);
    }
  });

  const profile = profileData?.profile || {};
  
  // Read dynamic limits directly from plan 
  const currentCount = teamMembersList.length;
  const maxLimit = Number(profile?.max_managers) || 0;
  const planName = profile?.plan_name || 'Starter Plan';
  
  const canAddMore = maxLimit === -1 || currentCount < maxLimit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
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
      permissions: typeof member.permissions === 'object' && member.permissions !== null 
        ? member.permissions 
        : { sales: 'edit', purchases: 'edit', inventory: 'edit', financials: 'edit' }
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
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Team & Roles</h1>
            <p className="text-gray-400">Manage your team's access to Cenvoras.</p>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setFormData({
                first_name: '', last_name: '', email: '', phone: '', password: '', role: 'manager',
                permissions: { sales: 'edit', purchases: 'edit', inventory: 'edit', financials: 'edit' }
              });
              setShowAddModal(true);
            }}
            disabled={!canAddMore}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              canAddMore 
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <UserPlusIcon className="w-5 h-5" />
            Add Member
          </button>
        </div>

        {/* Quota Alert */}
        <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm mt-4 lg:mt-0">
            <div className={`p-3 rounded-xl ${planName.includes('Enterprise') || planName.includes('Pro') ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
              <CurrencyDollarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-medium">Subscription Plan: <span className="text-cyan-400 font-bold">{planName}</span></p>
              <p className="text-gray-400">Limit: {maxLimit === -1 ? 'Unlimited' : maxLimit} Managers</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white tracking-tighter">
              {currentCount} <span className="text-lg text-gray-500">/ {maxLimit === -1 ? 'Unlimited' : maxLimit}</span>
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Managers Used</p>
          </div>
        </div>

        {/* Team List */}
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Name</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Email</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Role</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Joined</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading team...</td></tr>
                ) : teamMembersList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlusIcon className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-white font-medium mb-1">No team members yet</p>
                      <p className="text-sm text-gray-500 mb-4">Start creating managers to help run your business.</p>
                      {canAddMore && (
                        <button onClick={() => setShowAddModal(true)} className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                          + Invite your first member
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  teamMembersList.map((member) => (
                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                           {member.first_name?.[0] || member.email[0].toUpperCase()}
                        </div>
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="p-4 text-sm text-gray-400">{member.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {member.date_joined ? new Date(member.date_joined).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(member)} 
                          className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors mr-2"
                          title="Edit Member"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)} 
                          className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111]/90 backdrop-blur z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {isEditing ? <PencilSquareIcon className="w-6 h-6 text-purple-400" /> : <UserPlusIcon className="w-6 h-6 text-purple-400" />}
                {isEditing ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                  <input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                  <input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email (Login)</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50" disabled={isEditing} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{isEditing ? 'New Password (leave blank to keep)' : 'Temporary Password'}</label>
                  <input type="password" required={!isEditing} minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500" placeholder={isEditing ? '••••••••' : ''} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500">
                    <option value="manager">Manager</option>
                    <option value="salesman">Salesman</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Setup */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-cyan-400" />
                  Module Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {['sales', 'purchases', 'inventory', 'financials'].map((module) => (
                    <div key={module} className="bg-white/5 border border-white/5 rounded-xl p-4">
                      <div className="font-medium text-white capitalize mb-3 border-b border-white/10 pb-2">{module} access</div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" checked={formData.permissions[module] === 'edit'} onChange={() => handlePermChange(module, 'edit')} className="w-4 h-4 text-purple-500 bg-black border-gray-600 focus:ring-purple-500 focus:ring-offset-black" />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Full Access (View, Create, Edit)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" checked={formData.permissions[module] === 'view'} onChange={() => handlePermChange(module, 'view')} className="w-4 h-4 text-purple-500 bg-black border-gray-600 focus:ring-purple-500 focus:ring-offset-black" />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">View Only (Read Only)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" checked={formData.permissions[module] === 'none'} onChange={() => handlePermChange(module, 'none')} className="w-4 h-4 text-purple-500 bg-black border-gray-600 focus:ring-purple-500 focus:ring-offset-black" />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">No Access (Hidden)</span>
                        </label>
                      </div>
                    </div>
                  ))}
                  
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={isEditing ? updateMutation.isPending : createMutation.isPending} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white transition-colors disabled:opacity-50">
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
