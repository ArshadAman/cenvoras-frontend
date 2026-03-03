import React, { useState } from "react";
import Layout from "../../components/Layout";
import { useQuery } from "@tanstack/react-query";
import { getBalanceSheet } from "../../api/gst";
import { BuildingLibraryIcon, ScaleIcon, BanknotesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const today = new Date().toISOString().split('T')[0];
const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BalanceSheet() {
  const [asOf, setAsOf] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["balance-sheet", asOf],
    queryFn: () => getBalanceSheet(asOf),
  });

  const Section = ({ title, icon: Icon, color, items, total, extra }) => (
    <div className="bento-card p-0 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} /> {title}
        </h3>
        <span className={`text-lg font-bold ${color}`}>₹{fmt(total)}</span>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5 text-gray-400 text-xs uppercase">
            <th className="p-4 font-medium">Account</th>
            <th className="p-4 font-medium">Code</th>
            <th className="p-4 font-medium text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items?.length === 0 && !extra ? (
            <tr><td colSpan="3" className="p-4 text-center text-gray-500 text-sm">No entries</td></tr>
          ) : (
            <>
              {items?.map((item, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white text-sm">{item.name}</td>
                  <td className="p-4 text-gray-400 text-sm font-mono">{item.code}</td>
                  <td className={`p-4 text-right font-semibold text-sm ${color}`}>₹{fmt(item.amount)}</td>
                </tr>
              ))}
              {extra && (
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white text-sm italic">{extra.label}</td>
                  <td className="p-4 text-gray-400 text-sm font-mono">—</td>
                  <td className={`p-4 text-right font-semibold text-sm ${extra.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{fmt(extra.amount)}
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-6 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Balance Sheet</h1>
          <p className="text-gray-400 text-sm">Assets = Liabilities + Equity. Financial position at a point in time.</p>
        </div>

        {/* Date Filter */}
        <div className="bento-card p-4">
          <div className="flex items-end gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">As of Date</label>
              <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50" />
            </div>
            {data && (
              <div className="flex items-center gap-2 ml-auto">
                {data.is_balanced ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-sm">
                    <CheckCircleIcon className="w-4 h-4" /> Balanced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 text-sm">
                    <XCircleIcon className="w-4 h-4" /> Difference: ₹{fmt(data.difference)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="bento-card p-8 text-center text-gray-500">Loading...</div>
        ) : !data ? (
          <div className="bento-card p-8 text-center text-gray-500">No data available.</div>
        ) : (
          <>
            {/* Equation Card */}
            <div className="bento-card p-5 border border-white/10">
              <div className="flex items-center justify-center gap-4 flex-wrap text-center">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Assets</div>
                  <div className="text-xl font-bold text-blue-400">₹{fmt(data.assets?.total)}</div>
                </div>
                <div className="text-gray-500 text-2xl">=</div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Liabilities</div>
                  <div className="text-xl font-bold text-rose-400">₹{fmt(data.liabilities?.total)}</div>
                </div>
                <div className="text-gray-500 text-2xl">+</div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Equity</div>
                  <div className="text-xl font-bold text-emerald-400">₹{fmt(data.equity?.total)}</div>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section
                title="Assets"
                icon={BuildingLibraryIcon}
                color="text-blue-400"
                items={data.assets?.items}
                total={data.assets?.total}
              />
              <div className="space-y-6">
                <Section
                  title="Liabilities"
                  icon={ScaleIcon}
                  color="text-rose-400"
                  items={data.liabilities?.items}
                  total={data.liabilities?.total}
                />
                <Section
                  title="Equity"
                  icon={BanknotesIcon}
                  color="text-emerald-400"
                  items={data.equity?.items}
                  total={data.equity?.total}
                  extra={{ label: 'Retained Earnings (Net Profit)', amount: data.equity?.retained_earnings }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
