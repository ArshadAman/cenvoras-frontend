import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGeneralLedgerEntries } from '../../api/ledger';
import Loader from '../Loader';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { getAccounts } from '../../api/ledger';
import { subDays } from 'date-fns';
import { useLoadingPolicy } from '../../hooks/useLoadingPolicy';
import TableSkeleton from '../common/TableSkeleton';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { ArrowTopRightOnSquareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { downloadPartnerStatementPdf } from '../../api/ledger';
import { toast } from 'react-toastify';

const LedgerTable = ({ 
  onEdit, 
  onDelete, 
  selectedEntries = [], 
  onBulkSelect, 
  customerFilter = '', 
  vendorFilter = '',
  activeTab = 'customers',
  selectedPartnerName = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [viewEntry, setViewEntry] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  const itemsPerPage = 20;

  // Fetch accounts for filter dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts', { search: '', page: 1, page_size: 1000 }],
    queryFn: () => getAccounts({ search: '', page: 1, page_size: 1000 }),
  });

  const accounts = accountsData?.results || [];

  const receivableAccount = accounts.find(
    (account) => account.code === '1200' || /accounts?\s+receivable/i.test(account.name || '')
  );
  const payableAccount = accounts.find(
    (account) => account.code === '2001' || /accounts?\s+payable/i.test(account.name || '')
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab === 'customers' && receivableAccount?.id && !selectedAccount) {
      setSelectedAccount(receivableAccount.id);
    } else if (activeTab === 'vendors' && payableAccount?.id && !selectedAccount) {
      setSelectedAccount(payableAccount.id);
    } else if (activeTab === 'general' && (selectedAccount === receivableAccount?.id || selectedAccount === payableAccount?.id)) {
      setSelectedAccount('');
    }
  }, [activeTab, receivableAccount, payableAccount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedAccount, dateFilter.startDate, dateFilter.endDate, customerFilter, vendorFilter, activeTab]);

  const {
    data: ledgerData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['generalLedgerEntries', {
      description: debouncedSearchTerm,
      date_from: dateFilter?.startDate,
      date_to: dateFilter?.endDate,
      account: selectedAccount,
      customer: activeTab === 'customers' ? customerFilter : '',
      vendor: activeTab === 'vendors' ? vendorFilter : '',
      page: currentPage,
      page_size: itemsPerPage,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy
    }],
    queryFn: () => getGeneralLedgerEntries({
      description: debouncedSearchTerm,
      date_from: dateFilter?.startDate,
      date_to: dateFilter?.endDate,
      account: selectedAccount,
      customer: activeTab === 'customers' ? customerFilter : '',
      vendor: activeTab === 'vendors' ? vendorFilter : '',
      page: currentPage,
      page_size: itemsPerPage,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy
    }),
  });

  const ledgerEntries = ledgerData?.entries || [];
  const totalCount = ledgerData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const loadingPolicy = useLoadingPolicy(isLoading);

  const applyDatePreset = (preset) => {
    const today = new Date();
    let start, end;
    if (preset === 'today') {
      start = format(today, 'yyyy-MM-dd');
      end = format(today, 'yyyy-MM-dd');
    } else if (preset === 'this_month') {
      start = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
      end = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');
    } else if (preset === 'this_quarter') {
      const qMonth = Math.floor(today.getMonth() / 3) * 3;
      start = format(new Date(today.getFullYear(), qMonth, 1), 'yyyy-MM-dd');
      end = format(new Date(today.getFullYear(), qMonth + 3, 0), 'yyyy-MM-dd');
    } else if (preset === 'this_fy') {
      const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
      start = format(new Date(fyStartYear, 3, 1), 'yyyy-MM-dd');
      end = format(new Date(fyStartYear + 1, 2, 31), 'yyyy-MM-dd');
    } else if (preset === 'all_time') {
      start = '';
      end = '';
    }
    setDateFilter({ startDate: start, endDate: end });
  };

  const handleDownloadPdf = async () => {
    const partnerId = activeTab === 'vendors' ? vendorFilter : customerFilter;
    if (!partnerId) {
      toast.info("Please select a specific customer or vendor to download their statement PDF.");
      return;
    }
    try {
      setIsDownloadingPdf(true);
      await downloadPartnerStatementPdf({
        partner_type: activeTab === 'vendors' ? 'vendor' : 'customer',
        partner_id: partnerId,
        partner_name: selectedPartnerName,
        date_from: dateFilter?.startDate,
        date_to: dateFilter?.endDate,
      });
      toast.success("Statement PDF downloaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to download statement PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allEntryIds = ledgerEntries.map(entry => entry.id);
      onBulkSelect && onBulkSelect([...new Set([...selectedEntries, ...allEntryIds])]);
    } else {
      const currentPageIds = ledgerEntries.map(entry => entry.id);
      onBulkSelect && onBulkSelect(selectedEntries.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectEntry = (entryId, isSelected) => {
    if (isSelected) {
      onBulkSelect && onBulkSelect([...selectedEntries, entryId]);
    } else {
      onBulkSelect && onBulkSelect(selectedEntries.filter(id => id !== entryId));
    }
  };

  const isAllCurrentPageSelected = ledgerEntries.length > 0 && 
    ledgerEntries.every(entry => selectedEntries.includes(entry.id));

  const isSomeCurrentPageSelected = ledgerEntries.some(entry => selectedEntries.includes(entry.id));

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-500 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4 text-cyan-400 ml-1 inline" /> : 
      <ChevronDownIcon className="w-4 h-4 text-cyan-400 ml-1 inline" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return '-';
    }
  };

  if (loadingPolicy.visible) {
    return (
      <div className="bento-card p-4">
        {loadingPolicy.shouldShowProgress ? (
          <div className="flex justify-center items-center h-48">
            <Loader />
          </div>
        ) : (
          <TableSkeleton rows={8} columns={7} />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-red-500/20 p-3 rounded-full mb-3">
            <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Error loading entries
          </h3>
          <p className="text-sm text-red-300 mb-4">
            {error?.message || 'Failed to fetch ledger data'}
          </p>
          <button
            onClick={() => refetch()}
            className="btn-secondary text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6">
        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="border border-white/20 rounded-xl px-3.5 py-2 text-sm bg-white/5 backdrop-filter backdrop-blur-10 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 min-w-[220px]"
              placeholder="Search descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {activeTab === 'general' && (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="border border-white/20 rounded-xl px-3.5 py-2 text-sm bg-[#151515] text-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-transparent text-white text-xs px-2 py-1 outline-none cursor-pointer"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-transparent text-white text-xs px-2 py-1 outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => {
                 setSearchTerm('');
                 if (activeTab === 'customers') setSelectedAccount(receivableAccount?.id || '');
                 else if (activeTab === 'vendors') setSelectedAccount(payableAccount?.id || '');
                 else setSelectedAccount('');
                 setDateFilter({
                   startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                   endDate: format(new Date(), 'yyyy-MM-dd')
                 });
              }}
              className="px-3 py-2 bg-white/5 text-gray-300 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition text-xs font-semibold"
            >
              Reset
            </button>
          </div>

          {/* Quick Date Presets & PDF Download */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => applyDatePreset('this_month')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                This Month
              </button>
              <button
                onClick={() => applyDatePreset('this_quarter')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                Quarter
              </button>
              <button
                onClick={() => applyDatePreset('this_fy')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                This FY
              </button>
              <button
                onClick={() => applyDatePreset('all_time')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                All
              </button>
            </div>

            {(customerFilter || vendorFilter) && (
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition text-xs font-bold disabled:opacity-50"
                title="Download Vector PDF Statement"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span>{isDownloadingPdf ? 'Generating...' : 'Statement PDF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Ledger KPI Balance Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Opening Balance</div>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-1 flex items-center gap-1.5">
              <span>{formatCurrency(ledgerData?.opening_balance || 0)}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ledgerData?.opening_balance_type === 'Dr' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                {ledgerData?.opening_balance_type || 'Dr'}
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Period Debits (Dr)</div>
            <div className="text-base sm:text-lg font-bold font-mono text-rose-400 mt-1">
              {formatCurrency(ledgerData?.period_debit_total || 0)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Period Credits (Cr)</div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-1">
              {formatCurrency(ledgerData?.period_credit_total || 0)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Closing Balance</div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-300 mt-1 flex items-center gap-1.5">
              <span>{formatCurrency(ledgerData?.closing_balance || 0)}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ledgerData?.closing_balance_type === 'Dr' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                {ledgerData?.closing_balance_type || 'Dr'}
              </span>
            </div>
          </div>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/5 p-4 rounded-full inline-block mb-4">
               <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
            </div>
            <h3 className="mt-2 text-lg font-bold text-white">No ledger entries</h3>
            <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
              No entries found matching your criteria. Try adjusting your filters or record a new transaction.
            </p>
          </div>
        ) : (
          <>
            {/* Table for desktop, Cards for mobile */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {onBulkSelect && (
                      <th scope="col" className="relative px-6 py-4">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/30 text-[#7fd3f7] focus:ring-[#7fd3f7] bg-white/10"
                          checked={isAllCurrentPageSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeCurrentPageSelected && !isAllCurrentPageSelected;
                          }}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      Date {getSortIcon('date')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('account_name')}
                    >
                      Account / Entity {getSortIcon('account_name')}
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Reference
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('debit')}
                    >
                      Debit (Dr) {getSortIcon('debit')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('credit')}
                    >
                      Credit (Cr) {getSortIcon('credit')}
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Running Balance
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th scope="col" className="relative px-6 py-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="backdrop-filter backdrop-blur-10 bg-transparent divide-y divide-white/10">
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/10 transition-colors">
                      {onBulkSelect && (
                        <td className="relative px-6 py-4 whitespace-nowrap text-sm text-white">
                          <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/30 text-[#7fd3f7] focus:ring-[#7fd3f7] bg-white/10 backdrop-filter backdrop-blur-10"
                            checked={selectedEntries.includes(entry.id)}
                            onChange={(e) => handleSelectEntry(entry.id, e.target.checked)}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-lg font-mono">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white drop-shadow-lg">
                          {entry.customer_name ? entry.customer_name : (entry.vendor_name ? entry.vendor_name : `${entry.account_code || ''} ${entry.account_name || ''}`)}
                        </div>
                        <div className="text-xs text-cyan-300 capitalize">
                          {entry.account_name} ({entry.account_type})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {entry.sales_invoice ? (
                          <Link to="/sales" className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium inline-flex items-center gap-1" title="View Sales Invoices">
                            <span>{entry.reference || entry.sales_invoice_number || 'Invoice'}</span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          </Link>
                        ) : entry.purchase_bill ? (
                          <Link to="/purchases" className="text-orange-400 hover:text-orange-300 hover:underline font-medium inline-flex items-center gap-1" title="View Purchase Bills">
                            <span>{entry.reference || entry.purchase_bill_number || 'Bill'}</span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="font-mono text-gray-300">{entry.reference || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        <button
                          onClick={() => setViewEntry(entry)}
                          className="text-left group"
                          title="Click for full details"
                        >
                          <div className="max-w-xs truncate group-hover:text-cyan-300 transition-colors underline-offset-2 group-hover:underline drop-shadow-lg" title={entry.description}>
                            {entry.description || 'General Ledger Entry'}
                          </div>
                          <div className="text-xs text-cyan-300">
                            <span>Created: {formatDate(entry.created_at)}</span>
                            {entry.entry_number && (
                              <span className="ml-2">Entry #{entry.entry_number}</span>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className={`drop-shadow-lg font-mono font-bold text-base ${entry.debit > 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className={`drop-shadow-lg font-mono font-bold text-base ${entry.credit > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="font-mono font-bold text-white flex items-center justify-end gap-1.5">
                          <span>{formatCurrency(entry.running_balance || 0)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${entry.running_balance_type === 'Dr' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                            {entry.running_balance_type || 'Dr'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {entry.sales_invoice_number && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            📄 Sales #{entry.sales_invoice_number}
                          </span>
                        )}
                        {entry.purchase_bill_number && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            🧾 Purchase #{entry.purchase_bill_number}
                          </span>
                        )}
                        {entry.payment && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            💳 Payment
                          </span>
                        )}
                        {!entry.sales_invoice_number && !entry.purchase_bill_number && !entry.payment && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            📝 Manual Entry
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setViewEntry(entry)}
                          className="text-gray-400 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-white/5 transition"
                          title="View Details"
                        >
                          <DocumentTextIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-4">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 animate-pulse">
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/10 rounded mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                  </div>
                ))
              ) : (
                ledgerEntries.map((entry, index) => (
                  <div key={entry.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedEntries.includes(entry.id)}
                          onChange={(e) => {
                            const newSelected = e.target.checked
                              ? [...selectedEntries, entry.id]
                              : selectedEntries.filter(id => id !== entry.id);
                            onBulkSelect(newSelected);
                          }}
                          className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                        />
                        <div>
                          <div className="text-base font-bold text-white">
                            {entry.customer_name || entry.vendor_name || entry.account_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {formatDate(entry.date)} &bull; {entry.reference || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-gray-300">
                        <span>Account:</span>
                        <span className="font-medium text-white">{entry.account_name}</span>
                      </div>

                      <div className="flex justify-between items-start text-gray-300">
                        <span>Description:</span>
                        <span className="font-medium text-white text-right max-w-[200px] truncate">{entry.description || '-'}</span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span className="text-gray-400">Transaction:</span>
                        <span className="font-mono font-bold text-sm">
                          {entry.debit > 0 ? (
                            <span className="text-rose-400">Dr {formatCurrency(entry.debit)}</span>
                          ) : (
                            <span className="text-emerald-400">Cr {formatCurrency(entry.credit)}</span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span className="text-gray-400">Running Balance:</span>
                        <span className="font-mono font-bold text-white text-sm flex items-center gap-1">
                          <span>{formatCurrency(entry.running_balance || 0)}</span>
                          <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${entry.running_balance_type === 'Dr' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {entry.running_balance_type || 'Dr'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-end">
                      <button
                        onClick={() => setViewEntry(entry)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* No data message for mobile */}
              {!isLoading && ledgerEntries.length === 0 && (
                <div className="p-8 text-center text-white/80">
                  <p>No ledger entries found.</p>
                  <p className="text-sm mt-2">
                    Click "Record Payment" to create your first ledger entry.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-t border-white/10 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing{' '}
                      <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {' '}to{' '}
                      <span className="font-bold text-white">
                        {Math.min(currentPage * itemsPerPage, totalCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-bold text-white">{totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/10 bg-white/5 text-sm font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = index + 1;
                        } else if (currentPage <= 3) {
                          pageNum = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + index;
                        } else {
                          pageNum = currentPage - 2 + index;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/10 bg-white/5 text-sm font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* Entry Detail Modal */}
    {viewEntry && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewEntry(null)} />
        <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl animate-fade-up overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <DocumentTextIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Entry Details</h2>
                {viewEntry.entry_number && <p className="text-xs text-gray-400">Entry #{viewEntry.entry_number}</p>}
              </div>
            </div>
            <button onClick={() => setViewEntry(null)} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Date</div>
                <div className="text-white font-medium">{formatDate(viewEntry.date)}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Reference</div>
                <div className="text-white font-medium">{viewEntry.reference || '—'}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 col-span-2">
                <div className="text-xs text-gray-500 mb-1">Account</div>
                <div className="text-white font-medium">{viewEntry.account_code} - {viewEntry.account_name}</div>
                <div className="text-xs text-cyan-300 capitalize mt-0.5">{viewEntry.account_type}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 col-span-2">
                <div className="text-xs text-gray-500 mb-1">Description</div>
                <div className="text-white text-sm leading-relaxed">{viewEntry.description || 'General Ledger Entry'}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Debit</div>
                <div className={`font-bold text-xl ${viewEntry.debit > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {viewEntry.debit > 0 ? formatCurrency(viewEntry.debit) : '—'}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Credit</div>
                <div className={`font-bold text-xl ${viewEntry.credit > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                  {viewEntry.credit > 0 ? formatCurrency(viewEntry.credit) : '—'}
                </div>
              </div>
            </div>

            {/* Source Links */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-xs text-gray-500 mb-2">Source Document</div>
              <div className="flex flex-wrap gap-2">
                {viewEntry.sales_invoice_number && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    📄 Sales Invoice #{viewEntry.sales_invoice_number}
                  </span>
                )}
                {viewEntry.purchase_bill_number && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    🧾 Purchase Bill #{viewEntry.purchase_bill_number}
                  </span>
                )}
                {!viewEntry.sales_invoice_number && !viewEntry.purchase_bill_number && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20">
                    📝 Manual Entry
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>);
};

export default LedgerTable;