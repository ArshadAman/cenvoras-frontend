import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLedgerStats } from '../../api/ledger';
import Loader from '../Loader';
import { 
  BanknotesIcon, 
  DocumentTextIcon, 
  WalletIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const LedgerSummary = ({ dateFilter, customerFilter }) => {
  const {
    data: statsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ledgerStats', {
      date_from: dateFilter?.startDate,
      date_to: dateFilter?.endDate,
      customer: customerFilter,
    }],
    queryFn: () => getLedgerStats({
      date_from: dateFilter?.startDate,
      date_to: dateFilter?.endDate,
      customer: customerFilter,
    }),
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-xl"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-3 bg-[var(--bg-primary)] rounded mb-2 w-1/2"></div>
                <div className="h-6 bg-[var(--bg-primary)] rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--status-danger)]/15 border border-[var(--status-danger)]/30 rounded-2xl p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-[var(--status-danger)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-[var(--status-danger)]">
              Error loading summary
            </h3>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">
              <p>{error?.message || 'Failed to fetch ledger statistics'}</p>
            </div>
            <div className="mt-3">
              <button
                onClick={() => refetch()}
                className="btn-secondary text-xs px-3 py-1.5 rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = statsData || {
    total_payments: 0,
    total_invoices: 0,
    net_balance: 0,
    total_customers: 0,
    recent_transactions: 0,
    average_payment: 0,
    largest_payment: 0,
    outstanding_balance: 0,
    overdue_invoices_count: 0,
    overdue_amount: 0,
    unapplied_credits: 0,
    unmapped_outstanding: 0,
    reconciliation_gap: 0
  };

  const summaryCards = [
    {
      name: 'Total Payments',
      value: formatCurrency(stats.total_payments),
      icon: <BanknotesIcon className="w-6 h-6 text-[var(--accent-primary)]" />,
    },
    {
      name: 'Total Invoices',
      value: formatCurrency(stats.total_invoices),
      icon: <DocumentTextIcon className="w-6 h-6 text-[var(--accent-primary)]" />,
    },
    {
      name: 'Net Balance',
      value: formatCurrency(stats.net_balance),
      icon: <WalletIcon className={`w-6 h-6 ${stats.net_balance >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`} />,
    },
    {
      name: 'Active Customers',
      value: stats.total_customers?.toString() || '0',
      icon: <UserGroupIcon className="w-6 h-6 text-[var(--accent-primary)]" />,
    }
  ];

  return (
    <div className="mb-8">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((item) => (
          <div key={item.name} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 flex items-center shadow-lg transition-colors">
            <div className="flex-shrink-0 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              {item.icon}
            </div>
            <div className="ml-5">
              <dt className="text-xs font-semibold text-[var(--text-secondary)] truncate uppercase tracking-wider">
                {item.name}
              </dt>
              <dd className="mt-1 text-2xl font-bold text-[var(--text-primary)] font-mono">
                {item.value}
              </dd>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LedgerSummary;