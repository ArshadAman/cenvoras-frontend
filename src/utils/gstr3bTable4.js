// GSTR-3B Table 4: every row of the current form, zero rows included, in form order.
// Keys follow the backend payload (billing/gst_views.py gstr3b_summary -> table_4_itc).
const OK = 'text-[var(--status-success)] font-medium';
const RED = 'text-[var(--status-danger)] font-medium';
const MUTED = 'text-[var(--text-secondary)]';

export function table4Rows(t4 = {}) {
  const a = t4.itc_available || {};
  const b = t4.itc_reversed || {};
  const d = t4.ineligible_itc || {};
  return [
    { key: 'A', header: true, label: '(A) ITC Available (whether in full or part)' },
    { key: 'A1', label: '(1) Import of goods', v: a.import_goods, tone: OK },
    { key: 'A2', label: '(2) Import of services', v: a.import_services, tone: OK },
    { key: 'A3', label: '(3) Inward supplies liable to reverse charge (other than 1 & 2 above)', v: a.inward_reverse_charge, tone: OK },
    { key: 'A4', label: '(4) Inward supplies from ISD', v: a.inward_isd, tone: OK },
    { key: 'A5', label: '(5) All other ITC', v: a.all_other_itc, tone: OK },
    { key: 'B', header: true, label: '(B) ITC Reversed' },
    { key: 'B1', label: '(1) As per rules 38, 42 & 43 of CGST Rules and section 17(5)', v: b.as_per_rules, tone: RED },
    { key: 'B2', label: '(2) Others', v: b.others, tone: RED },
    { key: 'C', total: true, label: '(C) Net ITC Available (A) – (B)', v: t4.net_itc_available, tone: 'text-[var(--status-success)] text-sm' },
    { key: 'D', header: true, label: '(D) Other Details' },
    { key: 'D1', label: '(1) ITC reclaimed which was reversed under Table 4(B)(2) in earlier tax period', v: d.itc_reclaimed, tone: MUTED },
    { key: 'D2', label: '(2) Ineligible ITC under section 16(4) & ITC restricted due to PoS rules', v: d.others, tone: MUTED },
  ];
}
