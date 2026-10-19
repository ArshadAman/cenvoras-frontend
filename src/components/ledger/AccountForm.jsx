import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { createAccount, updateAccount, getAccounts } from '../../api/ledger';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AccountSchema = Yup.object().shape({
  code: Yup.string()
    .required('Account code is required')
    .max(20, 'Account code must be 20 characters or less')
    .matches(/^[A-Za-z0-9\-_.]+$/, 'Account code can only contain letters, numbers, hyphens, underscores, and periods'),
  name: Yup.string()
    .required('Account name is required')
    .min(1, 'Account name is required')
    .max(100, 'Account name must be 100 characters or less'),
  account_type: Yup.string()
    .required('Account type is required')
    .oneOf(['asset', 'liability', 'equity', 'revenue', 'expense'], 'Invalid account type'),
  parent_account: Yup.string().nullable(),
  description: Yup.string().max(500, 'Description must be 500 characters or less'),
  is_active: Yup.boolean()
});

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset', description: 'Resources owned by the business' },
  { value: 'liability', label: 'Liability', description: 'Debts owed by the business' },
  { value: 'equity', label: 'Equity', description: 'Owner\'s stake in the business' },
  { value: 'revenue', label: 'Revenue', description: 'Income earned by the business' },
  { value: 'expense', label: 'Expense', description: 'Costs incurred by the business' }
];

export default function AccountForm({ 
  isOpen, 
  onClose, 
  editData = null,
  onSuccess 
}) {
  const queryClient = useQueryClient();
  
  // Fetch parent accounts for dropdown (excluding the current account if editing)
  const { data: accountsData } = useQuery({
    queryKey: ['accounts-for-parent'],
    queryFn: () => getAccounts({ page_size: 1000 }),
    enabled: Boolean(isOpen)
  });

  const parentAccounts = accountsData?.results?.filter(account => 
    account.id !== editData?.id && account.is_active
  ) || [];

  // Create account mutation
  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accounts']);
      toast.success('Account created successfully!');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to create account';
      toast.error(errorMessage);
    }
  });

  // Update account mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAccount(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accounts']);
      toast.success('Account updated successfully!');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update account';
      toast.error(errorMessage);
    }
  });

  const initialValues = {
    code: editData?.code || '',
    name: editData?.name || '',
    account_type: editData?.account_type || '',
    parent_account: editData?.parent_account || '',
    description: editData?.description || '',
    is_active: editData?.is_active !== undefined ? editData.is_active : true
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl animate-fade-up bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {editData ? 'Edit Account' : 'Create New Account'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {editData ? 'Update account information' : 'Add a new account to your chart of accounts'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 hover:bg-[var(--bg-surface)] rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={AccountSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                if (editData) {
                  await updateMutation.mutateAsync({ id: editData.id, data: values });
                } else {
                  await createMutation.mutateAsync(values);
                }
              } catch {
                // handled in onError
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-6">
                {/* Account Code and Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      Account Code *
                    </label>
                    <Field
                      name="code"
                      type="text"
                      placeholder="e.g., 1001, CASH, ACC-001"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium text-sm"
                    />
                    <ErrorMessage name="code" component="div" className="mt-1 text-sm text-[var(--status-danger)]" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      Account Name *
                    </label>
                    <Field
                      name="name"
                      type="text"
                      placeholder="e.g., Cash, Accounts Receivable"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium text-sm"
                    />
                    <ErrorMessage name="name" component="div" className="mt-1 text-sm text-[var(--status-danger)]" />
                  </div>
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Account Type *
                  </label>
                  <div className="relative">
                    <Field
                        as="select"
                        name="account_type"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all appearance-none font-medium text-sm"
                    >
                        <option value="">Select account type</option>
                        {ACCOUNT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label} - {type.description}
                        </option>
                        ))}
                    </Field>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--text-muted)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <ErrorMessage name="account_type" component="div" className="mt-1 text-sm text-[var(--status-danger)]" />
                </div>

                {/* Parent Account */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Parent Account
                  </label>
                  <div className="relative">
                    <Field
                        as="select"
                        name="parent_account"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all appearance-none font-medium text-sm"
                    >
                        <option value="">None (Top-level account)</option>
                        {parentAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                        </option>
                        ))}
                    </Field>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--text-muted)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Optional: Select a parent account to create a sub-account
                  </p>
                  <ErrorMessage name="parent_account" component="div" className="mt-1 text-sm text-[var(--status-danger)]" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    rows={3}
                    placeholder="Optional description of the account..."
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all resize-none font-medium text-sm"
                  />
                  <ErrorMessage name="description" component="div" className="mt-1 text-sm text-[var(--status-danger)]" />
                </div>

                {/* Active Status */}
                <div className="flex items-center p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
                  <Field
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    className="w-5 h-5 accent-[var(--accent-primary)] rounded"
                  />
                  <label htmlFor="is_active" className="ml-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none">
                    Active Account
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary text-sm px-6 py-2.5 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                    className="btn-primary text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-6 font-semibold rounded-xl"
                  >
                    {isSubmitting || createMutation.isPending || updateMutation.isPending
                      ? (editData ? 'Updating...' : 'Creating...')
                      : (editData ? 'Update Account' : 'Create Account')
                    }
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>,
    document.body
  );
}