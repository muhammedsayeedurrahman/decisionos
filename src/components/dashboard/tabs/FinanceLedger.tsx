'use client';

import React from 'react';

export interface Asset {
  name: string;
  type: string;
  value: number;
  date: string;
}

interface StatItem {
  label: string;
  value: string;
  tone?: 'default' | 'alert';
}

interface FinanceLedgerProps {
  assets: Asset[];
  showType?: boolean;
  stats?: StatItem[];
}

export default function FinanceLedger({ assets, showType = false, stats }: FinanceLedgerProps) {
  return (
    <div className="w-full space-y-6 animate-fade-up">
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <p className="stat-eyebrow">{s.label}</p>
              <p className={`stat-value ${s.tone === 'alert' ? 'text-brand-red' : ''}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-lg overflow-x-auto">
        <table className="data-table min-w-[420px]">
          <thead>
            <tr>
              <th>Asset Name</th>
              {showType && <th>Type</th>}
              <th className="text-right">Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => (
              <tr key={idx}>
                <td className="font-bold dark:text-white">{asset.name}</td>
                {showType && <td className="font-mono text-zinc-500">{asset.type}</td>}
                <td className="text-right font-mono font-bold dark:text-zinc-300">${asset.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
