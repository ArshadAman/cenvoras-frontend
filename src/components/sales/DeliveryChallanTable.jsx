import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDeliveryChallans, deleteDeliveryChallan, convertToInvoice } from "../../api/delivery_challan";
import { format } from "date-fns";
import { toast } from "react-toastify";

export default function DeliveryChallanTable({ onEdit, onView, onDelete }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["deliveryChallans", search, page],
    queryFn: () => getDeliveryChallans({ search, page }),
  });

  if (error) {
    return <div className="text-red-500 text-center p-4">Error loading challans</div>;
  }

  const challans = Array.isArray(data) ? data : data?.data || data?.results || [];

  const handleConvert = async (challanId) => {
    if(!window.confirm("Convert this Challan to an Invoice?")) return;
    try {
        await convertToInvoice(challanId);
        toast.success("Challan converted to Invoice!");
        queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
    } catch (e) {
        toast.error("Failed to convert challan");
    }
  }

  const filteredChallans = challans.filter(challan => 
    challan.challan_number?.toLowerCase().includes(search.toLowerCase()) ||
    challan.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white/5 backdrop-filter backdrop-blur-20 rounded-lg shadow p-6 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search challans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-4 pr-4 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-300 bg-white/10 text-white placeholder-white/70 w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Challan #</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
                {filteredChallans.map(challan => (
                    <tr key={challan.id} className="bg-transparent border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{challan.challan_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">{format(new Date(challan.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">{challan.customer_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">{challan.items?.length || 0}</td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs ${challan.status === 'Converted' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {challan.status || 'Open'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                             <button onClick={() => onEdit(challan)} className="text-blue-400 hover:text-blue-300">Edit</button>
                             <button onClick={() => handleConvert(challan.id)} className="text-green-400 hover:text-green-300">Convert</button>
                             <button onClick={() => onDelete(challan)} className="text-red-400 hover:text-red-300">Delete</button>
                        </td>
                    </tr>
                ))}
                {filteredChallans.length === 0 && (
                     <tr><td colSpan="6" className="text-center py-8 text-gray-500">No delivery challans found</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
