import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesOrders, deleteSalesOrder, convertToInvoice } from "../../api/sales_order";
import { format } from "date-fns";
import { toast } from "react-toastify";

export default function SalesOrderTable({ onEdit, onView, onDelete }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["salesOrders", search, page],
    queryFn: () => getSalesOrders({ search, page }),
  });

  if (error) {
    return <div className="text-red-500 text-center p-4">Error loading orders</div>;
  }

  const orders = Array.isArray(data) ? data : data?.data || data?.results || [];

  const handleConvert = async (orderId) => {
    if(!window.confirm("Convert this order to an Invoice?")) return;
    try {
        await convertToInvoice(orderId);
        toast.success("Order converted to Invoice!");
        queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    } catch (e) {
        toast.error("Failed to convert order");
    }
  }

  const filteredOrders = orders.filter(order => 
    order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white/5 backdrop-filter backdrop-blur-20 rounded-lg shadow p-6 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-4 pr-4 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-300 bg-white/10 text-white placeholder-white/70 w-64"
        />
      </div>

      <div className="overflow-x-auto">
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
                {filteredOrders.map(order => (
                    <tr key={order.id} className="bg-transparent border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{order.order_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">{format(new Date(order.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">{order.customer_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-cyan-400 font-bold">₹{Number(order.total_amount).toLocaleString()}</td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs ${order.status === 'Converted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {order.status || 'Pending'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                             <button onClick={() => onEdit(order)} className="text-purple-400 hover:text-purple-300">Edit</button>
                             <button onClick={() => handleConvert(order.id)} className="text-green-400 hover:text-green-300">Convert</button>
                             <button onClick={() => onDelete(order)} className="text-red-400 hover:text-red-300">Delete</button>
                        </td>
                    </tr>
                ))}
                {filteredOrders.length === 0 && (
                     <tr><td colSpan="6" className="text-center py-8 text-gray-500">No sales orders found</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
