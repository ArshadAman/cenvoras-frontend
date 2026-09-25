import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesOrders, deleteSalesOrder } from "../../api/sales_order";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Pagination from "../common/Pagination";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import SalesOrderConvertModal from "./SalesOrderConvertModal";

export default function SalesOrderTable({ 
  onEdit, 
  onView, 
  onDelete, 
  initialSearch = "", 
  highlightedOrderId = null 
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(initialSearch || "");
  const [page, setPage] = useState(1);
  const [convertOrder, setConvertOrder] = useState(null);

  React.useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["salesOrders", search, page],
    queryFn: () => getSalesOrders({ search, page }),
  });

  if (error) {
    return <div className="text-red-500 text-center p-4">Error loading orders</div>;
  }

  const orders = Array.isArray(data) ? data : data?.results || data?.data || [];
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.current_page || page;

  const handleConvert = (order) => {
    setConvertOrder(order);
  };

  const filteredOrders = orders.filter(order => 
    order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    (order.customer_display_name || order.customer_name || '')?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="lg:bg-white/5 lg:backdrop-filter lg:backdrop-blur-20 rounded-lg lg:shadow p-0 lg:p-6 lg:border lg:border-white/10 bg-transparent border-none shadow-none backdrop-blur-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-4 lg:px-0 gap-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-4 pr-4 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-300 bg-white/10 text-white placeholder-white/70 w-64"
        />
      </div>

      <>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredOrders.map(order => {
                    const isHighlighted = highlightedOrderId && (String(order.id) === String(highlightedOrderId));
                    return (
                      <tr 
                        key={order.id} 
                        className={`border-b transition-colors ${
                          isHighlighted 
                            ? 'bg-purple-500/20 border-purple-500/40 ring-1 ring-purple-500/50' 
                            : 'bg-transparent border-white/5 hover:bg-white/5'
                        }`}
                      >
                          <td className="px-6 py-4 whitespace-nowrap text-white font-medium flex items-center gap-2">
                            <span>{order.order_number}</span>
                            {isHighlighted && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40 rounded-full">
                                Referenced
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-400">{format(new Date(order.date), 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">{order.customer_display_name || order.customer_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-cyan-400 font-bold">{getCurrencySymbol()}{Number(order.total_amount).toLocaleString()}</td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${
                                order.stage === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                order.stage === 'shipped' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 
                                order.stage === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }`}>
                                  {order.stage === 'shipped' ? 'Partially Shipped' : (order.stage || 'new')}
                              </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                               <button onClick={() => onView && onView(order)} className="text-blue-400 hover:text-blue-300" title="View Proforma Invoice">View</button>
                               <button onClick={() => onEdit(order)} className="text-purple-400 hover:text-purple-300">Edit</button>
                               {order.stage !== 'completed' && (
                                 <button onClick={() => handleConvert(order)} className="text-green-400 hover:text-green-300">Convert</button>
                               )}
                               <button onClick={() => onDelete(order)} className="text-red-400 hover:text-red-300">Delete</button>
                          </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                       <tr><td colSpan="6" className="text-center py-8 text-gray-500">No sales orders found</td></tr>
                  )}
              </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="lg:hidden space-y-3 px-2 mb-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10">
              No sales orders found.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isHighlighted = highlightedOrderId && (String(order.id) === String(highlightedOrderId));
              return (
              <div 
                key={order.id} 
                className={`backdrop-filter backdrop-blur-10 rounded-xl border p-3 transition-all duration-300 ${
                  isHighlighted 
                    ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span>{order.order_number}</span>
                      {isHighlighted && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40 rounded-full">
                          Referenced
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest font-black">
                      {(() => {
                        try {
                          return format(new Date(order.date), 'dd MMM, yyyy');
                        } catch (e) {
                          return order.date || '';
                        }
                      })()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-cyan-400">{getCurrencySymbol()}{Number(order.total_amount).toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5 mb-4">
                   <div>
                      <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Customer</div>
                      <div className="text-xs font-bold text-white truncate">{order.customer_display_name || order.customer_name}</div>
                   </div>
                    <div className="text-right">
                       <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</div>
                       <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                           order.stage === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                           order.stage === 'shipped' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 
                           order.stage === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                           'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                           {order.stage === 'shipped' ? 'Partially Shipped' : (order.stage || 'new')}
                       </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <button onClick={() => onView && onView(order)} className="flex-1 min-w-[60px] px-2 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">View</button>
                  <button onClick={() => onEdit(order)} className="flex-1 min-w-[60px] px-2 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">Edit</button>
                  {order.stage !== 'completed' && (
                    <button onClick={() => handleConvert(order)} className="flex-1 min-w-[60px] px-2 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">Convert</button>
                  )}
                  <button onClick={() => onDelete(order)} className="flex-1 min-w-[60px] px-2 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>
      </>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />

      {convertOrder && (
        <SalesOrderConvertModal
          isOpen={!!convertOrder}
          onClose={() => setConvertOrder(null)}
          order={convertOrder}
        />
      )}
    </div>
  );
}
