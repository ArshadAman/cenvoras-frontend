import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DeliveryChallanTable from "../components/sales/DeliveryChallanTable";
import SalesForm from "../components/sales/SalesForm";
import SalesDetailsModal from "../components/sales/SalesDetailsModal";
import { 
  PlusIcon, 
  TruckIcon, 
  ClockIcon, 
  DocumentCheckIcon, 
  CurrencyRupeeIcon 
} from "@heroicons/react/24/outline";
import { 
  getDeliveryChallans, 
  createDeliveryChallan, 
  updateDeliveryChallan, 
  getNextDeliveryChallanNumber 
} from "../api/delivery_challan";
import { getUserProfile } from "../api/users";
import { getCurrencySymbol } from "../utils/currency";

export default function DeliveryChallanList() {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editChallan, setEditChallan] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [challanPrefix, setChallanPrefix] = useState("DC-");

  // Fetch tenant profile for invoice/challan preview branding
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000,
  });

  const billingProfile = userProfile?.billing_profile || userProfile?.profile;
  const businessInfo = billingProfile
    ? {
        business_name: billingProfile.business_name,
        business_address: billingProfile.business_address,
        phone: billingProfile.phone,
        email: billingProfile.email,
        gstin: billingProfile.gstin,
        gem_id: billingProfile.gem_id,
        state: billingProfile.state,
        dl_number: billingProfile.dl_number,
        gin_number: billingProfile.gin_number,
      }
    : {};

  // Fetch summary stats
  const { data: challansData } = useQuery({
    queryKey: ["deliveryChallans"],
    queryFn: () => getDeliveryChallans({ page_size: 1000 }),
    staleTime: 60 * 1000,
  });

  const allChallans = Array.isArray(challansData)
    ? challansData
    : challansData?.data || challansData?.results || [];

  const totalCount = allChallans.length;
  const openCount = allChallans.filter(
    (c) => !c.is_billed && c.status !== "invoiced" && c.status !== "cancelled"
  ).length;
  const invoicedCount = allChallans.filter(
    (c) => c.is_billed || c.status === "invoiced"
  ).length;
  const totalValue = allChallans.reduce(
    (sum, c) => sum + Number(c.total_amount || 0),
    0
  );

  const handleEdit = (challan) => {
    setEditChallan(challan);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditChallan(null);
  };

  // Handle location state (e.g. view specific challan after conversion)
  useEffect(() => {
    if (location.state?.viewChallanId) {
      setShowDetails({ id: location.state.viewChallanId });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Intercept back button to dismiss overlays
  useEffect(() => {
    const isAnyOverlayOpen = showForm || showDetails;
    if (!isAnyOverlayOpen) return;

    const stateObj = { challanOverlayOpen: true };
    window.history.pushState(stateObj, "");

    const handlePopState = () => {
      setShowForm(false);
      setEditChallan(null);
      setShowDetails(null);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state && window.history.state.challanOverlayOpen) {
        window.history.back();
      }
    };
  }, [showForm, showDetails]);

  return (
    <>
      <div className="p-2 sm:p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 sm:px-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <TruckIcon className="w-8 h-8 text-cyan-400" />
              Delivery Challans
            </h1>
            <p className="text-gray-400 text-sm">
              Create and dispatch delivery notes, track transport & vehicles, and convert directly to sales invoices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-full sm:w-auto">
              <span className="text-xs text-gray-400 font-medium">PREFIX:</span>
              <input
                type="text"
                value={challanPrefix}
                onChange={(e) => setChallanPrefix(e.target.value.toUpperCase())}
                className="bg-transparent border-none text-white text-sm w-20 outline-none p-0 font-mono"
                maxLength={8}
              />
            </div>

            <button
              onClick={() => {
                setEditChallan(null);
                setShowForm(true);
              }}
              className="btn-primary text-sm py-2 px-4 shadow-lg shadow-cyan-500/20 flex-1 sm:flex-none flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4" /> New Challan
            </button>
          </div>
        </div>

        {/* Quick Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bento-card p-5 bg-gradient-to-br from-white/5 to-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Challans</span>
              <TruckIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalCount}</div>
            <div className="text-xs text-gray-500 mt-1">Recorded to date</div>
          </div>

          <div className="bento-card p-5 bg-gradient-to-br from-cyan-500/10 to-cyan-500/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Open / Dispatched</span>
              <ClockIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300">{openCount}</div>
            <div className="text-xs text-cyan-400/60 mt-1">Awaiting invoicing</div>
          </div>

          <div className="bento-card p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Invoiced</span>
              <DocumentCheckIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{invoicedCount}</div>
            <div className="text-xs text-emerald-400/60 mt-1">Billed into Sales Invoice</div>
          </div>

          <div className="bento-card p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Total Goods Value</span>
              <CurrencyRupeeIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">
              {getCurrencySymbol()}
              {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-purple-400/60 mt-1">Dispatched inventory value</div>
          </div>
        </div>

        {/* Challans Table */}
        <div className="bento-card p-3 sm:p-6">
          <div className="mb-6 flex items-center justify-between px-1 sm:px-0">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Delivery Challan Records</h2>
              <p className="text-xs text-gray-400">
                Track status, vehicle dispatches, items, and convert directly to sales invoices
              </p>
            </div>
          </div>

          <DeliveryChallanTable
            onEdit={handleEdit}
            onView={(challan) => setShowDetails(challan)}
            onConvertSuccess={(invoice) => {
              // Could open the new invoice preview if desired
            }}
          />
        </div>
      </div>

      {/* SalesForm as full Delivery Challan editor */}
      {showForm && (
        <SalesForm
          isOpen={showForm}
          onClose={handleCloseForm}
          editData={editChallan}
          invoicePrefix={challanPrefix}
          documentType="delivery_challan"
          createDocument={createDeliveryChallan}
          updateDocument={updateDeliveryChallan}
          getNextNumber={getNextDeliveryChallanNumber}
          finalSubmitStatus="open"
        />
      )}

      {/* SalesDetailsModal as multi-theme preview and pixel-perfect PDF generator */}
      {showDetails && (
        <SalesDetailsModal
          isOpen={!!showDetails}
          onClose={() => setShowDetails(null)}
          invoice={showDetails}
          businessInfo={businessInfo}
          documentType="delivery_challan"
        />
      )}
    </>
  );
}
