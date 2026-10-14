import React, { useEffect, useMemo, useState } from "react";
import { getUnpaidPurchaseBills, createVendorPayment, getRule37Itc, applyRule37Itc } from "../api/purchase";
import { getAccounts } from "../api/ledger";
import { showErrorToast, showSuccessToast } from "../utils/toastUtils";
import { getCurrencySymbol, formatCurrency } from "../utils/currency";

const TDS_FIXED_RATES = {
  "194J": 10,
  "194Q": 0.1,
};

export default function VendorPayments() {
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [rule37, setRule37] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [tdsSection, setTdsSection] = useState("");
  const [paying, setPaying] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [b, a, r] = await Promise.all([
        getUnpaidPurchaseBills(),
        getAccounts({ account_type: "asset" }),
        getRule37Itc(),
      ]);
      setBills(b.results || []);
      const list = (a.results || a || []).filter((x) => {
        const code = String(x.code || "");
        const name = String(x.name || "").toLowerCase();
        return code === "1001" || code === "1002" || name.includes("bank") || name === "cash" || name.startsWith("cash ");
      });
      setAccounts(list);
      const bank = list.find((x) => String(x.code) === "1002");
      setAccountId(bank?.id || list[0]?.id || "");
      setRule37(r.results || []);
    } catch (err) {
      showErrorToast(err, "Failed to load vendor payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openPay = (bill) => {
    setSelectedBill(bill);
    setAmount(bill.balance_due);
    setTdsSection("");
  };

  const tdsPreview = useMemo(() => {
    if (!selectedBill || !tdsSection) {
      return { rate: 0, tds: 0, taxable: 0, net: parseFloat(amount || 0) };
    }
    const payAmt = parseFloat(amount || 0);
    const due = parseFloat(selectedBill.balance_due || 0);
    const taxableBal = parseFloat(selectedBill.taxable_balance || due);
    const taxable = due > 0 ? (payAmt * taxableBal) / due : payAmt;
    let rate = 0;
    if (tdsSection === "194C") {
      rate = parseFloat(selectedBill.tds_rate_194c || (selectedBill.is_individual_or_huf ? 1 : 2));
    } else {
      rate = TDS_FIXED_RATES[tdsSection] || 0;
    }
    const tds = Math.round(taxable * rate) / 100;
    const tdsRounded = Math.round(tds * 100) / 100;
    return {
      rate,
      tds: tdsRounded,
      taxable: Math.round(taxable * 100) / 100,
      net: Math.round((payAmt - tdsRounded) * 100) / 100,
    };
  }, [selectedBill, amount, tdsSection]);

  const selectedAcc = accounts.find((x) => String(x.id) === String(accountId));
  const bal = parseFloat(selectedAcc?.current_balance || 0);
  const requiredNet = tdsSection ? tdsPreview.net : parseFloat(amount || 0);
  const insufficient = selectedAcc && (bal < 0 || bal < requiredNet);

  const submitPay = async (e) => {
    e.preventDefault();
    if (!selectedBill || !accountId) return;
    if (insufficient) {
      showErrorToast(
        `Insufficient balance in ${selectedAcc.name}. Available ₹${bal.toLocaleString("en-IN")}, required ₹${requiredNet.toLocaleString("en-IN")}.`
      );
      return;
    }
    setPaying(true);
    try {
      await createVendorPayment({
        bill_id: selectedBill.id,
        amount,
        payment_account_id: accountId,
        mode: "bank_transfer",
        tds_section: tdsSection || undefined,
        tds_amount: tdsSection ? String(tdsPreview.tds) : undefined,
      });
      showSuccessToast("Vendor payment recorded");
      setSelectedBill(null);
      reload();
    } catch (err) {
      showErrorToast(err, "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const applyRule37 = async () => {
    try {
      const res = await applyRule37Itc({});
      showSuccessToast(`Applied Rule 37 on ${res.count || 0} bill(s)`);
      reload();
    } catch (err) {
      showErrorToast(err, "Rule 37 apply failed");
    }
  };

  const rate194cLabel = selectedBill
    ? `${selectedBill.tds_rate_194c || (selectedBill.is_individual_or_huf ? "1" : "2")}% on taxable`
    : "1%/2% on taxable";

  return (
    <div className="p-6 space-y-8 text-white">
      <div>
        <h1 className="text-2xl font-semibold">Vendor Payments</h1>
        <p className="text-sm text-gray-400">Pay unpaid bills, optional TDS 194C/J/Q, and review Rule 37 ITC.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Unpaid Bills</h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : (
          <div className="overflow-x-auto border border-white/10 rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-gray-400 text-left">
                <tr>
                  <th className="px-4 py-3">Bill</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} className="border-t border-white/5">
                    <td className="px-4 py-3">{b.bill_number}<div className="text-xs text-gray-500">{b.bill_date}</div></td>
                    <td className="px-4 py-3">{b.vendor_name}</td>
                    <td className="px-4 py-3 font-mono">{getCurrencySymbol()}{parseFloat(b.balance_due).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{b.days_outstanding}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => openPay(b)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-semibold">
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {!bills.length && (
                  <tr><td colSpan={5} className="px-4 py-6 text-gray-500">No unpaid bills</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Rule 37 — ITC at risk (180+ days unpaid)</h2>
          <button type="button" onClick={applyRule37} className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">
            Apply reversals
          </button>
        </div>
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3">Bill</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">ITC at risk</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rule37.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{r.bill_number}</td>
                  <td className="px-4 py-3">{r.vendor_name}</td>
                  <td className="px-4 py-3 font-mono">{getCurrencySymbol()}{parseFloat(r.itc_at_risk).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{r.already_reversed ? "Reversed" : "Pending"}</td>
                </tr>
              ))}
              {!rule37.length && (
                <tr><td colSpan={4} className="px-4 py-6 text-gray-500">No Rule 37 candidates</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={submitPay} className="w-full max-w-md bg-[#111116] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Pay {selectedBill.bill_number}</h3>
            <p className="text-xs text-gray-400">Due {formatCurrency(selectedBill.balance_due)}</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount</label>
              <input required type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bank / Cash account</label>
              <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code}) — Bal: ₹{parseFloat(a.current_balance || 0).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">TDS section (optional; on taxable value ex-GST)</label>
              <select value={tdsSection} onChange={(e) => setTdsSection(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <option value="">None</option>
                <option value="194C">194C ({rate194cLabel})</option>
                <option value="194J">194J (10% on taxable)</option>
                <option value="194Q">194Q (0.1% on taxable)</option>
              </select>
            </div>
            {tdsSection && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Taxable base (ex-GST)</span>
                  <span className="font-mono text-white">{formatCurrency(tdsPreview.taxable)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>TDS @ {tdsPreview.rate}%</span>
                  <span className="font-mono text-amber-300">{formatCurrency(tdsPreview.tds)}</span>
                </div>
                <div className="flex justify-between text-gray-300 font-semibold pt-1 border-t border-white/5">
                  <span>Net payable from account</span>
                  <span className="font-mono text-emerald-300">{formatCurrency(tdsPreview.net)}</span>
                </div>
              </div>
            )}
            {insufficient && (
              <p className="text-xs text-red-400">
                Insufficient balance. Available ₹{bal.toLocaleString("en-IN")}, required ₹{requiredNet.toLocaleString("en-IN")}.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSelectedBill(null)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              <button type="submit" disabled={paying || insufficient} className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-400 text-slate-950 disabled:opacity-50">
                {paying ? "Saving…" : "Confirm payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
