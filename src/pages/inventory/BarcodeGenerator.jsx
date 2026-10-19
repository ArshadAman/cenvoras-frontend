import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../api/inventory';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function BarcodeGenerator() {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(10);
    const printRef = useRef(null);

    const { data: productsData } = useQuery({
        queryKey: ['products', 'barcode-generator'],
        queryFn: () => getProducts({ page_size: 500 }),
    });
    const products = Array.isArray(productsData)
      ? productsData
      : productsData?.results || productsData?.data || [];

    const activeProduct = products.find(p => p.id === selectedProduct);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Barcodes_${format(new Date(), 'yyyy-MM-dd')}`,
    });

    return (
        <>
            <div className="p-6 md:p-10 space-y-8 animate-fade-up">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-2">Barcode Generator</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Generate and print barcode labels for your inventory items.</p>
                    </div>
                </div>

                <div className="bento-card p-6 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[250px]">
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Select Product</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="input-field w-full"
                        >
                            <option value="">-- Choose Product --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Number of Labels</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="input-field w-32"
                        />
                    </div>
                    <button 
                        onClick={handlePrint}
                        disabled={!activeProduct || quantity < 1}
                        className="btn-primary flex items-center gap-2 mb-1"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Print Labels
                    </button>
                </div>

                {activeProduct ? (
                    <div className="bento-card p-6">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Print Preview</h3>
                        
                        {/* Printable Area */}
                        <div className="bg-white rounded-xl p-4 text-black overflow-hidden relative border border-[var(--border-default)]">
                           <div ref={printRef} className="print-container bg-white">
                              <style>
                                  {`
                                    @media print {
                                        html, body {
                                            background-color: #ffffff !important;
                                            background: #ffffff !important;
                                            color: #000000 !important;
                                            margin: 0 !important;
                                            padding: 0 !important;
                                            -webkit-print-color-adjust: exact !important;
                                            print-color-adjust: exact !important;
                                        }
                                        .print-container {
                                            background-color: #ffffff !important;
                                            background: #ffffff !important;
                                            display: grid !important;
                                            grid-template-columns: repeat(3, 1fr) !important;
                                            gap: 8mm !important;
                                            padding: 10mm !important;
                                            width: 100% !important;
                                            box-sizing: border-box !important;
                                        }
                                        .label-card {
                                            page-break-inside: avoid !important;
                                            break-inside: avoid !important;
                                            background-color: #ffffff !important;
                                            background: #ffffff !important;
                                            border: 1px dashed #777777 !important;
                                            box-shadow: none !important;
                                            padding: 8px !important;
                                            text-align: center !important;
                                            height: 120px !important;
                                            display: flex !important;
                                            flex-direction: column !important;
                                            justify-content: center !important;
                                            align-items: center !important;
                                            color: #000000 !important;
                                        }
                                        .label-card * {
                                            color: #000000 !important;
                                        }
                                        @page { 
                                            size: A4 portrait; 
                                            margin: 0; 
                                        }
                                    }
                                  `}
                              </style>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Array.from({ length: quantity }).map((_, i) => (
                                    <div key={i} className="label-card border border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center bg-white shadow-sm">
                                        <div className="font-bold text-xs truncate w-full text-center text-black mb-1" title={activeProduct.name}>
                                            {activeProduct.name}
                                        </div>
                                        <div className="text-[11px] font-semibold text-gray-800 mb-1.5">MRP: {getCurrencySymbol()}{activeProduct.sale_price}</div>
                                        <div className="w-full flex justify-center scale-90 origin-top">
                                            <Barcode 
                                                value={String(activeProduct.barcode || activeProduct.meta?.barcode || activeProduct.item_code || activeProduct.id.split('-')[0].toUpperCase())}
                                                format="CODE128" 
                                                width={1.5} 
                                                height={40} 
                                                displayValue={true} 
                                                fontSize={11}
                                                background="transparent"
                                                lineColor="#000000"
                                            />
                                        </div>
                                    </div>
                                ))}
                              </div>
                           </div>
                        </div>
                    </div>
                ) : (
                    <div className="bento-card p-12 text-center text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)]">
                        <PrinterIcon className="w-12 h-12 mx-auto mb-4 opacity-50 text-[var(--text-muted)]" />
                        Select a product to preview labels.
                    </div>
                )}
            </div>
        </>
    );
}
