import React from 'react';
import { useRegion } from '../hooks/useRegion';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export const InvoicePrintLayout: React.FC = () => {
  const { country, isVatRegistered, trn, gstin, formatCurrency } = useRegion();

  // Dummy Invoice Data
  const items: InvoiceItem[] = [
    { name: 'Product A', quantity: 2, price: 50, total: 100 },
    { name: 'Product B', quantity: 1, price: 150, total: 150 },
  ];
  
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  
  // Tax Engine Mirror
  let taxAmount = 0;
  let taxType = '';
  
  if (country === 'AE' && isVatRegistered) {
    taxAmount = subtotal * 0.05;
    taxType = 'VAT (5%) / ضريبة القيمة المضافة';
  } else if (country === 'IN' && gstin) {
    taxAmount = subtotal * 0.18;
    taxType = 'GST (18%)';
  }
  
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="w-full max-w-sm mx-auto bg-white text-black p-4 font-mono text-sm border-t-4 border-slate-900 shadow-2xl rounded-b-lg print:shadow-none print:border-none print:w-full print:p-0">
      
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">
          {country === 'AE' ? 'Tax Invoice / فاتورة ضريبية' : 'Tax Invoice'}
        </h1>
        <p className="text-lg font-semibold">CENVORA SUPERMART</p>
        <p className="text-xs mt-1">123 Main Street, Commerce City</p>
        
        {country === 'AE' && trn && (
          <p className="text-xs font-bold mt-2">TRN: {trn}</p>
        )}
        
        {country === 'IN' && gstin && (
          <p className="text-xs font-bold mt-2">GSTIN: {gstin}</p>
        )}
      </div>
      
      {/* Divider */}
      <div className="border-b-2 border-dashed border-slate-300 mb-4" />
      
      {/* Items Table */}
      <table className="w-full mb-4">
        <thead>
          <tr className="text-left border-b border-slate-200">
            <th className="pb-2">Item</th>
            <th className="pb-2 text-right">Qty</th>
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-2 pr-2">{item.name}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Divider */}
      <div className="border-b-2 border-dashed border-slate-300 mb-4" />
      
      {/* Totals */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        {taxAmount > 0 && (
          <div className="flex justify-between font-medium">
            <span>{taxType}</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-2 mt-2">
          <span>{country === 'AE' ? 'Total / الإجمالي' : 'Total'}</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center text-xs space-y-1">
        <p>Thank you for shopping with us!</p>
        <p>{new Date().toLocaleString()}</p>
      </div>

    </div>
  );
};
