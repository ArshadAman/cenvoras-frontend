import React, { useState } from 'react';
import CustomerDetailsModal from '../customers/CustomerDetailsModal';
import VendorDetailsModal from '../vendors/VendorDetailsModal';

export default function PartyDetailsHost({ party, onClose }) {
  const hasCustomer = Boolean(party?.customer?.id);
  const hasVendor = Boolean(party?.vendor?.id);
  const [role, setRole] = useState(hasCustomer ? 'customer' : 'vendor');

  if (!hasCustomer && !hasVendor) return null;

  if (hasCustomer && hasVendor) {
    return (
      <>
        <div className="fixed inset-x-0 top-3 z-[10000] flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-1 shadow-xl">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${role === 'customer' ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]' : 'text-[var(--text-secondary)]'}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole('vendor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${role === 'vendor' ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]' : 'text-[var(--text-secondary)]'}`}
            >
              Vendor
            </button>
          </div>
        </div>
        {role === 'customer' ? (
          <CustomerDetailsModal isOpen onClose={onClose} customer={party.customer} />
        ) : (
          <VendorDetailsModal isOpen onClose={onClose} vendor={party.vendor} />
        )}
      </>
    );
  }

  if (hasCustomer) {
    return <CustomerDetailsModal isOpen onClose={onClose} customer={party.customer} />;
  }
  return <VendorDetailsModal isOpen onClose={onClose} vendor={party.vendor} />;
}
