import React, { useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editData ? 'Edit Account' : 'Create New Account'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {editData ? 'Update account information' : 'Add a new account to your chart of accounts'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            onSubmit={(values, { setSubmitting }) => {
              if (editData) {
                updateMutation.mutate({ id: editData.id, data: values });
              } else {
                createMutation.mutate(values);
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-6">
                {/* Account Code and Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Code *
                    </label>
                    <Field
                      name="code"
                      type="text"
                      placeholder="e.g., 1001, CASH, ACC-001"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <ErrorMessage name="code" component="div" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Name *
                    </label>
                    <Field
                      name="name"
                      type="text"
                      placeholder="e.g., Cash, Accounts Receivable"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <ErrorMessage name="name" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Type *
                  </label>
                  <Field
                    as="select"
                    name="account_type"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select account type</option>
                    {ACCOUNT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="account_type" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                {/* Parent Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Account
                  </label>
                  <Field
                    as="select"
                    name="parent_account"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">None (Top-level account)</option>
                    {parentAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </Field>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional: Select a parent account to create a sub-account
                  </p>
                  <ErrorMessage name="parent_account" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    rows={3}
                    placeholder="Optional description of the account..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  />
                  <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    name="is_active"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active Account
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || createMutation.isLoading || updateMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting || createMutation.isLoading || updateMutation.isLoading
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
    </div>
  );
}