import React from 'react';
import { getCountryCode } from '../../../utils/currency';
import { posLabel } from '../../../utils/constants';

// Rule 46 (CGST Rules): place of supply with state name + code, and the delivery address
// where it differs from the place of supply (printed only if the template doesn't already show it).
export default function PlaceOfSupplyLine({ invoice = {}, showDelivery = false, className = 'text-xs mt-1' }) {
  if (getCountryCode() !== 'IN') return null;
  const label = posLabel(invoice.place_of_supply);
  if (!label) return null;
  const stateName = label.replace(/\s*\(\d+\)$/, '').toLowerCase();
  const del = String(invoice.delivery_address || '').trim();
  const differs = del && !del.toLowerCase().includes(stateName);
  return (
    <div className={className}>
      <p className="font-semibold">Place of Supply: {label}</p>
      {showDelivery && differs && (
        <p className="whitespace-pre-line"><span className="font-semibold">Delivery address:</span> {del}</p>
      )}
    </div>
  );
}
