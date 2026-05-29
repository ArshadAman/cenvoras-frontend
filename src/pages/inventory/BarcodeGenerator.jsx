import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../api/inventory';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function BarcodeGenerator() {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(10);
    const printRef = useRef(null);

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: getProducts
    });

    const activeProduct = products?.find(p => p.id === selectedProduct);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Barcodes_${format(new Date(), 'yyyy-MM-dd')}`,
    });

    return (
        <>
            <div className="p-6 md:p-10 space-y-8 animate-fade-up border-white/5">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Barcode Generator</h1>
                        <p className="text-gray-400">Generate and print barcode labels for your inventory items.</p>
                    </div>
                </div>

                <div className="bento-card p-6 border border-white/10 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[250px]">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Select Product</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="input-field w-full"
                        >
                            <option value="">-- Choose Product --</option>
                            {products?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Number of Labels</label>
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
                    <div className="bento-card p-6 border border-white/10 bg-white/5">
                        <h3 className="text-lg font-medium text-white mb-4">Print Preview</h3>
                        
                        {/* Printable Area */}
                        <div className="bg-white rounded p-4 text-black overflow-hidden relative">
                           <div ref={printRef} className="print-container">
                              <style>
                                  {`
                                    @media print {
                                        .print-container {
                                            display: grid !important;
                                            grid-template-columns: repeat(3, 1fr) !important;
                                            gap: 10px !important;
                                            padding: 10mm;
                                        }
                                        .label-card {
                                            page-break-inside: avoid;
                                            border: 1px dashed #ccc;
                                            padding: 10px;
                                            text-align: center;
                                            height: 120px;
                                            display: flex;
                                            flex-direction: column;
                                            justify-content: center;
                                        }
                                        @page { size: A4; margin: 0; }
                                    }
                                  `}
                              </style>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Array.from({ length: quantity }).map((_, i) => (
                                    <div key={i} className="label-card border border-gray-200 rounded p-4 flex flex-col items-center justify-center bg-white shadow-sm">
                                        <div className="font-bold text-sm truncate w-full text-center text-gray-800 mb-1" title={activeProduct.name}>
                                            {activeProduct.name}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">MRP: {getCurrencySymbol()}{activeProduct.sale_price}</div>
                                        <div className="w-full flex justify-center scale-75 origin-top">
                                            <Barcode 
                                                value={activeProduct.id.split('-')[0].toUpperCase()} // Generate a short unique ID for barcode, as UUID is too long
                                                format="CODE128" 
                                                width={1.5} 
                                                height={40} 
                                                displayValue={true} 
                                                fontSize={12}
                                                background="transparent"
                                                lineColor="#000"
                                            />
                                        </div>
                                    </div>
                                ))}
                              </div>
                           </div>
                        </div>
                    </div>
                ) : (
                    <div className="bento-card p-12 text-center text-gray-500 border border-dashed border-white/10">
                        <PrinterIcon className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-600" />
                        Select a product to preview labels.
                    </div>
                )}
            </div>
        </>
    );
}
