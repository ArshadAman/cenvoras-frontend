import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUnpaidPurchaseBills, createVendorPayment, getRule37Itc, applyRule37Itc } from "../api/purchase";
import { getAccounts } from "../api/ledger";
import { showErrorToast, showSuccessToast } from "../utils/toastUtils";
import { getCurrencySymbol, formatCurrency } from "../utils/currency";
import { cash40A3Warning } from "../utils/s40a3";
import useResizableColumns from "../hooks/useResizableColumns";
import { LIST_THEAD, LIST_TH } from "../components/common/tableHeaderClasses";

const UNPAID_COLUMN_WIDTHS = {
  bill: 160,
  vendor: 190,
  due: 130,
  days: 80,
  actions: 90,
};

const RULE37_COLUMN_WIDTHS = {
  bill: 160,
  vendor: 190,
  itc: 140,
  status: 120,
};

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
  const unpaidCols = useResizableColumns(
    "cenvoras_vendor_payments_unpaid_col_widths",
    UNPAID_COLUMN_WIDTHS
  );
  const rule37Cols = useResizableColumns(
    "cenvoras_vendor_payments_rule37_col_widths",
    RULE37_COLUMN_WIDTHS
  );

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
      return { rate: 0, tds: 0, taxable: 0, net: parseFloat(amount || 0), note: "" };
    }
    const payAmt = parseFloat(amount || 0);
    const due = parseFloat(selectedBill.balance_due || 0);
    const taxableBal = parseFloat(selectedBill.taxable_balance || due);
    const taxable = due > 0 ? (payAmt * taxableBal) / due : payAmt;
    // For 194C, prefer server preview on full balance; scale only when paying partial
    if (tdsSection === "194C") {
      const fullTds = parseFloat(selectedBill.tds_amount_194c || 0);
      const fullTaxable = parseFloat(selectedBill.taxable_balance || taxable);
      const rate = parseFloat(selectedBill.tds_rate_194c || 0);
      const thresholdMet = selectedBill.tds_threshold_met_194c !== false && fullTds > 0;
      let tdsRounded = 0;
      if (thresholdMet && fullTaxable > 0) {
        tdsRounded = Math.round((taxable / fullTaxable) * fullTds * 100) / 100;
      } else if (thresholdMet && rate > 0) {
        tdsRounded = Math.round(taxable * rate) / 100;
      }
      const note = !selectedBill.vendor_has_pan && thresholdMet
        ? "No PAN — Sec 206AA 20%"
        : !thresholdMet
          ? "Below 194C threshold (₹30k/payment or ₹1L/year)"
          : "";
      return {
        rate: thresholdMet ? rate : 0,
        tds: tdsRounded,
        taxable: Math.round(taxable * 100) / 100,
        net: Math.round((payAmt - tdsRounded) * 100) / 100,
        note,
      };
    }
    const rate = TDS_FIXED_RATES[tdsSection] || 0;
    const tds = Math.round(taxable * rate) / 100;
    const tdsRounded = Math.round(tds * 100) / 100;
    return {
      rate,
      tds: tdsRounded,
      taxable: Math.round(taxable * 100) / 100,
      net: Math.round((payAmt - tdsRounded) * 100) / 100,
      note: "",
    };
  }, [selectedBill, amount, tdsSection]);

  const selectedAcc = accounts.find((x) => String(x.id) === String(accountId));
  const bal = parseFloat(selectedAcc?.current_balance || 0);
  const requiredNet = tdsSection ? tdsPreview.net : parseFloat(amount || 0);
  const insufficient = selectedAcc && (bal < 0 || bal < requiredNet);
  const s40a3Warning = cash40A3Warning(selectedAcc, requiredNet);

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
    ? !selectedBill.vendor_has_pan
      ? "20% (no PAN)"
      : `${selectedBill.tds_rate_194c || (selectedBill.is_individual_or_huf ? "1" : "2")}% on taxable`
    : "1%/2% on taxable";

  return (
    <div className="p-6 space-y-8 text-[var(--text-primary)]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Vendor Payments</h1>
        <p className="text-sm text-[var(--text-secondary)]">Pay unpaid bills, optional TDS 194C/J/Q, and review Rule 37 ITC.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Unpaid Bills</h2>
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">Loading…</p>
        ) : (
          <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)] shadow-sm">
            <table className="w-full table-fixed divide-y divide-[var(--border-subtle)] text-sm">
              <colgroup>
                <col style={{ width: `${unpaidCols.colWidths.bill}px` }} />
                <col style={{ width: `${unpaidCols.colWidths.vendor}px` }} />
                <col style={{ width: `${unpaidCols.colWidths.due}px` }} />
                <col style={{ width: `${unpaidCols.colWidths.days}px` }} />
                <col style={{ width: `${unpaidCols.colWidths.actions}px` }} />
              </colgroup>
              <thead className={LIST_THEAD}>
                <tr>
                  <th className={LIST_TH}>
                    Bill
                    {unpaidCols.renderResizeHandle("bill")}
                  </th>
                  <th className={LIST_TH}>
                    Vendor
                    {unpaidCols.renderResizeHandle("vendor")}
                  </th>
                  <th className={LIST_TH}>
                    Due
                    {unpaidCols.renderResizeHandle("due")}
                  </th>
                  <th className={LIST_TH}>
                    Days
                    {unpaidCols.renderResizeHandle("days")}
                  </th>
                  <th className={LIST_TH}>
                    {unpaidCols.renderResizeHandle("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      {b.bill_number}
                      <div className="text-xs text-[var(--text-muted)]">{b.bill_date}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{b.vendor_name}</td>
                    <td className="px-4 py-3 font-mono text-[var(--text-primary)] font-semibold">{getCurrencySymbol()}{parseFloat(b.balance_due).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{b.days_outstanding}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => openPay(b)} className="btn-primary text-xs py-1.5 px-3">
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {!bills.length && (
                  <tr><td colSpan={5} className="px-4 py-6 text-[var(--text-muted)] text-center">No unpaid bills</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Rule 37 — ITC at risk (180+ days unpaid)</h2>
          <button type="button" onClick={applyRule37} className="px-3 py-1.5 rounded-xl bg-[var(--status-warning)]/15 text-[var(--status-warning)] text-xs font-semibold border border-[var(--status-warning)]/30 hover:bg-[var(--status-warning)]/25 transition-colors">
            Apply reversals
          </button>
        </div>
        <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)] shadow-sm">
            <table className="w-full table-fixed divide-y divide-[var(--border-subtle)] text-sm">
            <colgroup>
              <col style={{ width: `${rule37Cols.colWidths.bill}px` }} />
              <col style={{ width: `${rule37Cols.colWidths.vendor}px` }} />
              <col style={{ width: `${rule37Cols.colWidths.itc}px` }} />
              <col style={{ width: `${rule37Cols.colWidths.status}px` }} />
            </colgroup>
            <thead className={LIST_THEAD}>
              <tr>
                <th className={LIST_TH}>
                  Bill
                  {rule37Cols.renderResizeHandle("bill")}
                </th>
                <th className={LIST_TH}>
                  Vendor
                  {rule37Cols.renderResizeHandle("vendor")}
                </th>
                <th className={LIST_TH}>
                  ITC at risk
                  {rule37Cols.renderResizeHandle("itc")}
                </th>
                <th className={LIST_TH}>
                  Status
                  {rule37Cols.renderResizeHandle("status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {rule37.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                  <td className="px-4 py-3 text-[var(--text-primary)]">{r.bill_number}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{r.vendor_name}</td>
                  <td className="px-4 py-3 font-mono text-[var(--status-warning)] font-semibold">{getCurrencySymbol()}{parseFloat(r.itc_at_risk).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{r.already_reversed ? "Reversed" : "Pending"}</td>
                </tr>
              ))}
              {!rule37.length && (
                <tr><td colSpan={4} className="px-4 py-6 text-[var(--text-muted)] text-center">No Rule 37 candidates</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={submitPay} className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Pay {selectedBill.bill_number}</h3>
            <p className="text-xs text-[var(--text-secondary)]">Due {formatCurrency(selectedBill.balance_due)}</p>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Amount</label>
              <input required type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Bank / Cash account</label>
              <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {a.name} ({a.code}) — Bal: ₹{parseFloat(a.current_balance || 0).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">TDS section (optional; on taxable value ex-GST)</label>
              <select value={tdsSection} onChange={(e) => setTdsSection(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm">
                <option value="" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">None</option>
                <option value="194C" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">194C ({rate194cLabel})</option>
                <option value="194J" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">194J (10% on taxable)</option>
                <option value="194Q" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">194Q (0.1% on taxable)</option>
              </select>
            </div>
            {tdsSection && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs space-y-1">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Taxable base (ex-GST)</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">{formatCurrency(tdsPreview.taxable)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>TDS @ {tdsPreview.rate}%</span>
                  <span className="font-mono text-[var(--status-warning)] font-semibold">{formatCurrency(tdsPreview.tds)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-primary)] font-semibold pt-1 border-t border-[var(--border-subtle)]">
                  <span>Net payable from account</span>
                  <span className="font-mono text-[var(--status-success)] font-semibold">{formatCurrency(tdsPreview.net)}</span>
                </div>
                {tdsPreview.note ? (
                  <p className="text-[var(--status-warning)] pt-1 text-xs">{tdsPreview.note}</p>
                ) : null}
              </div>
            )}
            {s40a3Warning && (
              <p className="text-xs text-[var(--status-warning)]">{s40a3Warning}</p>
            )}
            {insufficient && (
              <p className="text-xs text-[var(--status-danger)]">
                Insufficient balance. Available ₹{bal.toLocaleString("en-IN")}, required ₹{requiredNet.toLocaleString("en-IN")}.{' '}
                <Link to="/integrations?tab=bank" className="underline text-[var(--accent-primary)]">
                  Add cash or extra money in Business Tools
                </Link>
                .
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSelectedBill(null)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={paying || insufficient} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {paying ? "Saving…" : "Confirm payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
