import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SalesOrderTable from "../components/sales/SalesOrderTable";
import SalesForm from "../components/sales/SalesForm";
import SalesDetailsModal from "../components/sales/SalesDetailsModal";
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  createSalesOrder, 
  deleteSalesOrder, 
  getNextSalesOrderNumber, 
  getSalesOrder, 
  updateSalesOrder 
} from "../api/sales_order";
import { getUserProfile, patchUserProfile } from "../api/users";

const DEFAULT_SALES_ORDER_PREFIX = 'SO';

const normalizePrefix = (value) => {
  return String(value ?? '').toUpperCase();
};

export default function SalesOrderList() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetOrderId = searchParams.get("orderId");
  const targetOrderNumber = searchParams.get("orderNumber");

  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [salesOrderPrefix, setSalesOrderPrefix] = useState(DEFAULT_SALES_ORDER_PREFIX);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000,
  });

  const saveSalesOrderPrefixMutation = useMutation({
    mutationFn: (prefix) => patchUserProfile({ sales_order_prefix: prefix }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const billingProfile = userProfile?.billing_profile || userProfile?.profile;
  const canEditPrefix = Boolean(
    userProfile?.profile?.id &&
    billingProfile?.id &&
    userProfile.profile.id === billingProfile.id
  );

  useEffect(() => {
    const dbPrefix = billingProfile?.sales_order_prefix;
    if (dbPrefix !== undefined && dbPrefix !== null) {
      setSalesOrderPrefix(normalizePrefix(dbPrefix));
    }
  }, [billingProfile?.sales_order_prefix]);

  const handlePrefixBlur = () => {
    const normalized = normalizePrefix(salesOrderPrefix);
    setSalesOrderPrefix(normalized);
    if (!canEditPrefix) return;
    if (normalized !== normalizePrefix(billingProfile?.sales_order_prefix || DEFAULT_SALES_ORDER_PREFIX)) {
      saveSalesOrderPrefixMutation.mutate(normalized);
    }
  };

  const businessInfo = billingProfile
    ? {
        business_name: billingProfile.business_name,
        business_address: billingProfile.business_address,
        phone: billingProfile.phone,
        email: billingProfile.email,
        gstin: billingProfile.gstin,
        pan_number: billingProfile.pan_number,
        gem_id: billingProfile.gem_id,
        dl_number: billingProfile.dl_number,
        state: billingProfile.state,
        city: billingProfile.city,
        country: billingProfile.country,
        trn: billingProfile.trn,
        bank_name: billingProfile.bank_name,
        bank_account_number: billingProfile.bank_account_number,
        bank_ifsc_code: billingProfile.bank_ifsc_code,
        bank_branch: billingProfile.bank_branch,
        bank_upi_id: billingProfile.bank_upi_id,
        bank_qr_code: billingProfile.bank_qr_code,
      }
    : {};

  // Auto-open referenced order if navigated from Delivery Challan
  useEffect(() => {
    if (!targetOrderId) return;
    let isMounted = true;

    getSalesOrder(targetOrderId)
      .then((order) => {
        if (isMounted && order) {
          setEditOrder(order);
          setShowForm(true);
          toast.info(`Opened referenced Sales Order #${order.order_number}`, { autoClose: 3000 });
        }
      })
      .catch((err) => {
        console.error("Failed to load referenced sales order:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [targetOrderId]);

  const deleteMutation = useMutation({
    mutationFn: deleteSalesOrder,
    onSuccess: () => {
      toast.success("Sales order deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete sales order");
    },
  });

  const handleEdit = (order) => {
    setEditOrder(order);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditOrder(null);
    if (searchParams.get("orderId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("orderId");
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleDelete = async (order) => {
    if (order.has_challans || order.has_invoices) {
      toast.error("Cannot delete Sales Order because a Delivery Challan or Sales Invoice has already been generated from it.");
      return;
    }
    if (!window.confirm(`Delete sales order ${order.order_number}?`)) return;
    await deleteMutation.mutateAsync(order.id);
  };

  return (
    <>
      <div className="p-2 sm:p-6 md:p-10 space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 sm:px-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Sales Orders</h1>
            <p className="text-[var(--text-secondary)] text-sm">Manage customer orders before invoicing.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 focus-within:border-[var(--accent-primary)] w-full sm:w-auto">
              <span className="text-xs text-[var(--text-secondary)] font-medium">PREFIX:</span>
              <input 
                type="text" 
                value={salesOrderPrefix}
                onChange={(e) => setSalesOrderPrefix(normalizePrefix(e.target.value))}
                onBlur={handlePrefixBlur}
                disabled={!canEditPrefix}
                className="bg-transparent border-none text-[var(--text-primary)] text-sm flex-1 sm:w-28 outline-none placeholder-[var(--text-muted)] focus:ring-0 p-0"
                placeholder="SO"
                maxLength={10}
                title={!canEditPrefix ? 'Sales Order prefix is managed by the main account.' : ''}
              />
            </div>
            <button
              onClick={() => {
                setEditOrder(null);
                setShowForm(true);
              }}
              className="btn-primary text-sm py-2 px-4 shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <PlusIcon className="w-4 h-4"/> New Order
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bento-card p-3 sm:p-6">
          <SalesOrderTable
            onEdit={handleEdit}
            onView={(order) => setViewOrder(order)}
            onDelete={handleDelete}
            initialSearch={targetOrderNumber || ""}
            highlightedOrderId={targetOrderId || null}
          />
        </div>

      </div>

      {/* Modals */}
      {showForm && (
        <SalesForm 
          isOpen={showForm} 
          onClose={handleCloseForm}
          editData={editOrder}
          invoicePrefix={salesOrderPrefix}
          documentType="sales_order"
          createDocument={createSalesOrder}
          updateDocument={(id, data) => updateSalesOrder(id, data)}
          getNextNumber={getNextSalesOrderNumber}
          finalSubmitStatus="new"
        />
      )}

      {viewOrder && (
        <SalesDetailsModal
          isOpen={!!viewOrder}
          onClose={() => setViewOrder(null)}
          invoice={viewOrder}
          businessInfo={businessInfo}
          documentType="proforma"
        />
      )}
    </>
  );
}
