import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { getLedgerStats } from '../../api/ledger';
import { getCustomers } from '../../api/customers';
import { getSalesInvoices } from '../../api/sales';
import api from '../../api/api';
import Loader from '../Loader';
import {
  BanknotesIcon,
  DocumentTextIcon,
  WalletIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import useEscKey from '../../hooks/useEscStack';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

function asList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || data?.data || [];
}

function KpiDetailModal({ kind, onClose, customerFilter, stats }) {
  useEscKey(onClose, true, 20);
  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/billing/payments/').then(res => res.data),
    enabled: kind === 'payments',
  });
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ['salesInvoices', { customer: customerFilter || '' }],
    queryFn: () => getSalesInvoices(customerFilter ? { customer: customerFilter } : {}),
    enabled: kind === 'invoices',
  });
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enabled: kind === 'customers' || kind === 'balance',
  });

  const payments = asList(paymentsData).filter((p) => !customerFilter || String(p.customer) === String(customerFilter));
  const invoices = asList(invoicesData).filter((inv) => !customerFilter || String(inv.customer) === String(customerFilter) || String(inv.customer?.id) === String(customerFilter));
  const customers = asList(customersData).filter((c) => !customerFilter || String(c.id) === String(customerFilter));

  const title = {
    payments: 'Total Payments',
    invoices: 'Total Invoices',
    balance: 'Net Balance',
    customers: 'Active Customers',
  }[kind];

  const loading = (kind === 'payments' && loadingPayments)
    || (kind === 'invoices' && loadingInvoices)
    || ((kind === 'customers' || kind === 'balance') && loadingCustomers);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="py-10 flex justify-center"><Loader /></div>
          ) : kind === 'payments' ? (
            payments.length ? payments.map((p) => (
              <div key={p.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.customer_name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{p.date} · {(p.mode || '').replace('_', ' ')}{p.invoice_number ? ` · ${p.invoice_number}` : ' · Advance'}</div>
                </div>
                <div className="text-sm font-bold text-[var(--status-success)] shrink-0">{formatCurrency(p.amount)}</div>
              </div>
            )) : <p className="text-sm text-[var(--text-muted)] text-center py-8">No payments found.</p>
          ) : kind === 'invoices' ? (
            invoices.length ? invoices.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{inv.invoice_number}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{inv.customer_name || 'Customer'} · {inv.invoice_date}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(inv.total_amount)}</div>
                  <div className="text-xs text-[var(--text-muted)]">Paid {formatCurrency(inv.amount_paid)}</div>
                </div>
              </div>
            )) : <p className="text-sm text-[var(--text-muted)] text-center py-8">No invoices found.</p>
          ) : kind === 'customers' ? (
            customers.length ? customers.map((c) => (
              <div key={c.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.name}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{c.gstin || c.phone || c.email || '—'}</div>
                </div>
                <div className="text-sm font-bold text-[var(--status-warning)] shrink-0">{formatCurrency(c.current_balance)}</div>
              </div>
            )) : <p className="text-sm text-[var(--text-muted)] text-center py-8">No customers found.</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Outstanding receivables</span>
                <span className="font-mono font-bold">{formatCurrency(stats.outstanding_balance)}</span>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Invoice outstanding</span>
                <span className="font-mono font-bold">{formatCurrency(stats.invoice_outstanding_total)}</span>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Unapplied credits</span>
                <span className="font-mono font-bold">{formatCurrency(stats.unapplied_credits)}</span>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Ledger net (Dr − Cr)</span>
                <span className="font-mono font-bold">{formatCurrency(stats.net_balance)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const LedgerSummary = ({ dateFilter, customerFilter }) => {
  const [openKind, setOpenKind] = useState(null);
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
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-[var(--status-danger)]">Error loading summary</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{error?.message || 'Failed to fetch ledger statistics'}</p>
            <button onClick={() => refetch()} className="btn-secondary text-xs px-3 py-1.5 rounded-lg font-medium mt-3">Try Again</button>
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
    outstanding_balance: 0,
    unapplied_credits: 0,
    invoice_outstanding_total: 0,
  };

  const summaryCards = [
    { kind: 'payments', name: 'Total Payments', value: formatCurrency(stats.total_payments), icon: <BanknotesIcon className="w-6 h-6 text-[var(--accent-primary)]" /> },
    { kind: 'invoices', name: 'Total Invoices', value: formatCurrency(stats.total_invoices), icon: <DocumentTextIcon className="w-6 h-6 text-[var(--accent-primary)]" /> },
    { kind: 'balance', name: 'Net Balance', value: formatCurrency(stats.net_balance), icon: <WalletIcon className={`w-6 h-6 ${stats.net_balance >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`} /> },
    { kind: 'customers', name: 'Active Customers', value: stats.total_customers?.toString() || '0', icon: <UserGroupIcon className="w-6 h-6 text-[var(--accent-primary)]" /> },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((item) => (
          <button
            type="button"
            key={item.kind}
            onClick={() => setOpenKind(item.kind)}
            className="text-left bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 flex items-center shadow-lg transition-all hover:border-[var(--accent-primary)]/40 hover:scale-[1.01]"
          >
            <div className="flex-shrink-0 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              {item.icon}
            </div>
            <div className="ml-5 min-w-0">
              <dt className="text-xs font-semibold text-[var(--text-secondary)] truncate uppercase tracking-wider">
                {item.name}
              </dt>
              <dd className="mt-1 text-2xl font-bold text-[var(--text-primary)] font-mono truncate">
                {item.value}
              </dd>
            </div>
          </button>
        ))}
      </div>
      {openKind && (
        <KpiDetailModal
          kind={openKind}
          onClose={() => setOpenKind(null)}
          customerFilter={customerFilter}
          stats={stats}
        />
      )}
    </div>
  );
};

export default LedgerSummary;
