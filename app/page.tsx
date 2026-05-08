"use client";

import { useState } from "react";
import {
  pitchbookPeers,
  pitchbookGI,
  preqinPeers,
  preqinGI,
  compositionPeers,
  compositionGI,
} from "@/lib/data";

type SortDir = "asc" | "desc";

function fmt(v: number | null | undefined, decimals = 0): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function PctileBadge({ value }: { value: number }) {
  const color =
    value >= 75
      ? "bg-emerald-100 text-emerald-800"
      : value >= 50
        ? "bg-blue-100 text-blue-800"
        : value >= 25
          ? "bg-amber-100 text-amber-800"
          : "bg-red-100 text-red-800";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {value.toFixed(0)}th pctile
    </span>
  );
}

function StatBar({
  label,
  p25,
  median,
  p75,
  giValue,
  decimals = 0,
  prefix = "$",
  suffix = "M",
}: {
  label: string;
  p25: number;
  median: number;
  p75: number;
  giValue: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 text-slate-500 shrink-0">{label}</span>
      <div className="flex gap-4 font-mono text-xs">
        <span className="text-slate-400">p25: {prefix}{fmt(p25, decimals)}{suffix}</span>
        <span className="text-slate-600 font-semibold">med: {prefix}{fmt(median, decimals)}{suffix}</span>
        <span className="text-slate-400">p75: {prefix}{fmt(p75, decimals)}{suffix}</span>
        <span className="text-indigo-700 font-bold">GI: {prefix}{fmt(giValue, decimals)}{suffix}</span>
      </div>
    </div>
  );
}

function SortableTable<T extends Record<string, unknown>>({
  data,
  columns,
  highlightFirm,
  defaultSort,
  defaultDir = "desc",
}: {
  data: T[];
  columns: { key: string; label: string; align?: "left" | "right"; fmt?: (v: unknown) => string }[];
  highlightFirm?: string;
  defaultSort: string;
  defaultDir?: SortDir;
}) {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-8">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none ${col.align === "right" ? "text-right" : "text-left"}`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => {
              const isGI = highlightFirm && row.firm === highlightFirm;
              return (
                <tr
                  key={i}
                  className={`border-b border-slate-100 ${isGI ? "bg-indigo-50 font-semibold" : i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-100/80`}
                >
                  <td className="px-3 py-1.5 text-xs text-slate-400">{page * pageSize + i + 1}</td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-1.5 ${col.align === "right" ? "text-right font-mono" : ""} ${isGI && col.key === "firm" ? "text-indigo-700" : ""}`}
                    >
                      {col.fmt ? col.fmt(row[col.key]) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
          <span>
            Showing {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function PositionCard({
  label,
  value,
  rank,
  peerCount,
  pctile,
}: {
  label: string;
  value: string;
  rank: number;
  peerCount: number;
  pctile: number;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-indigo-700 mt-1">{value}</div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-slate-500">
          Rank {rank} of {peerCount}
        </span>
        <PctileBadge value={pctile} />
      </div>
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<"pitchbook" | "preqin" | "composition">("pitchbook");

  const tabs = [
    { id: "pitchbook" as const, label: "PitchBook — AUM Efficiency" },
    { id: "preqin" as const, label: "Preqin — Fundraising Efficiency" },
    { id: "composition" as const, label: "Preqin — Staff Composition" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          GI Partners: Headcount Efficiency Benchmarking
        </h1>
        <p className="text-slate-500 mt-2">
          Peer analysis across PitchBook and Preqin datasets &mdash; US-based investment firms in comparable AUM / fundraising bands
        </p>
      </div>

      {/* GI Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-3">GI Partners at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MetricCard label="AUM (PitchBook)" value={`$${fmt(pitchbookGI.aum)}M`} sub="As reported" />
          <MetricCard label="10yr Raised (Preqin)" value={`$${fmt(preqinGI.raised)}M`} sub="Last 10 years" />
          <MetricCard label="Inv. Professionals" value={`${pitchbookGI.headcount}`} sub="PitchBook" />
          <MetricCard label="Total Staff" value={`${preqinGI.staffTotal}`} sub="Preqin" />
          <MetricCard label="Active Portfolio" value={`${fmt(pitchbookGI.active)}`} sub="Companies" />
          <MetricCard label="Total Investments" value={`${fmt(pitchbookGI.totalInv)}`} sub="Lifetime" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* PitchBook Tab */}
      {activeTab === "pitchbook" && (
        <div>
          <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="text-sm text-indigo-900">
              <strong>Peer set:</strong> {pitchbookGI.peerCount} dedicated US investment firms (PE/Buyout, Infrastructure, Growth, RE, VC, Mezz, Debt, Impact) with AUM $10B&ndash;$100B and 20+ investment professionals.
              Excludes banks, hedge funds, asset managers, family offices, fund-of-funds, endowments.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <PositionCard
              label="AUM per Investment Professional"
              value={`$${fmt(pitchbookGI.aumPerHead)}M`}
              rank={pitchbookGI.aumPerHeadRank}
              peerCount={pitchbookGI.peerCount}
              pctile={pitchbookGI.aumPerHeadPctile}
            />
            <PositionCard
              label="Active Portcos per Professional"
              value={`${fmt(pitchbookGI.portcosPerHead, 2)}`}
              rank={pitchbookGI.portcosPerHeadRank ?? 0}
              peerCount={pitchbookGI.peerCount}
              pctile={pitchbookGI.portcosPerHeadPctile ?? 0}
            />
          </div>

          <div className="mb-6 space-y-2">
            <StatBar
              label="AUM / Head"
              p25={pitchbookGI.stats.aumPerHead.p25}
              median={pitchbookGI.stats.aumPerHead.median}
              p75={pitchbookGI.stats.aumPerHead.p75}
              giValue={pitchbookGI.aumPerHead}
            />
            <StatBar
              label="Portcos / Head"
              p25={pitchbookGI.stats.portcosPerHead.p25}
              median={pitchbookGI.stats.portcosPerHead.median}
              p75={pitchbookGI.stats.portcosPerHead.p75}
              giValue={pitchbookGI.portcosPerHead ?? 0}
              prefix=""
              suffix=""
              decimals={2}
            />
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-3">Full Peer Table</h3>
          <SortableTable
            data={pitchbookPeers as unknown as Record<string, unknown>[]}
            highlightFirm="GI Partners"
            defaultSort="aumPerHead"
            columns={[
              { key: "firm", label: "Firm" },
              { key: "type", label: "Type" },
              { key: "state", label: "State" },
              { key: "aum", label: "AUM ($M)", align: "right", fmt: (v) => fmt(v as number) },
              { key: "headcount", label: "HC", align: "right", fmt: (v) => fmt(v as number) },
              { key: "active", label: "Active", align: "right", fmt: (v) => fmt(v as number) },
              { key: "totalInv", label: "Total Inv", align: "right", fmt: (v) => fmt(v as number) },
              { key: "exits", label: "Exits", align: "right", fmt: (v) => fmt(v as number) },
              { key: "aumPerHead", label: "AUM/HC ($M)", align: "right", fmt: (v) => fmt(v as number, 1) },
              { key: "portcosPerHead", label: "Portcos/HC", align: "right", fmt: (v) => fmt(v as number, 2) },
            ]}
          />
        </div>
      )}

      {/* Preqin Tab */}
      {activeTab === "preqin" && (
        <div>
          <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="text-sm text-indigo-900">
              <strong>Peer set:</strong> {preqinGI.peerCount} US PE firms and fund managers with $5B&ndash;$25B raised in the last 10 years and 10+ staff.
              Excludes fund-of-funds, family offices, hedge funds, corporate investors.
              <br />
              <strong>Note:</strong> Preqin reports &ldquo;total funds raised (10yr)&rdquo; rather than AUM. GI Partners shows $7.5B raised vs. $34B AUM in PitchBook &mdash; the gap reflects legacy/recycled capital not captured in the 10-year window.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <PositionCard
              label="Raised per Total Staff"
              value={`$${fmt(preqinGI.raisedPerTotal)}M`}
              rank={preqinGI.raisedPerTotalRank}
              peerCount={preqinGI.peerCount}
              pctile={preqinGI.raisedPerTotalPctile}
            />
            <PositionCard
              label="Raised per Investment Staff"
              value={`$${fmt(preqinGI.raisedPerInv)}M`}
              rank={preqinGI.raisedPerInvRank}
              peerCount={preqinGI.peerCount}
              pctile={preqinGI.raisedPerInvPctile}
            />
          </div>

          <div className="mb-6 space-y-2">
            <StatBar
              label="Raised / Total Staff"
              p25={preqinGI.stats.raisedPerTotal.p25}
              median={preqinGI.stats.raisedPerTotal.median}
              p75={preqinGI.stats.raisedPerTotal.p75}
              giValue={preqinGI.raisedPerTotal}
            />
            <StatBar
              label="Raised / Inv Staff"
              p25={preqinGI.stats.raisedPerInv.p25}
              median={preqinGI.stats.raisedPerInv.median}
              p75={preqinGI.stats.raisedPerInv.p75}
              giValue={preqinGI.raisedPerInv}
            />
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-3">Full Peer Table</h3>
          <SortableTable
            data={preqinPeers as unknown as Record<string, unknown>[]}
            highlightFirm="GI Partners"
            defaultSort="raisedPerTotal"
            columns={[
              { key: "firm", label: "Firm" },
              { key: "type", label: "Type" },
              { key: "state", label: "State" },
              { key: "raised", label: "Raised ($M)", align: "right", fmt: (v) => fmt(v as number) },
              { key: "staffTotal", label: "Total Staff", align: "right", fmt: (v) => fmt(v as number) },
              { key: "staffInv", label: "Inv Staff", align: "right", fmt: (v) => fmt(v as number) },
              { key: "raisedPerTotal", label: "Raised/Staff ($M)", align: "right", fmt: (v) => fmt(v as number, 1) },
              { key: "raisedPerInv", label: "Raised/Inv ($M)", align: "right", fmt: (v) => fmt(v as number, 1) },
            ]}
          />
        </div>
      )}

      {/* Composition Tab */}
      {activeTab === "composition" && (
        <div>
          <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="text-sm text-indigo-900">
              <strong>Peer set:</strong> {compositionGI.peerCount} US PE firms and fund managers ($5B&ndash;$25B raised, 10yr) with both total and investment staff counts reported.
              <br />
              <strong>Question:</strong> What share of GI&apos;s workforce is investment professionals vs. operations/support?
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <PositionCard
              label="Investment Staff %"
              value={`${compositionGI.invPct}%`}
              rank={compositionGI.invPctRank}
              peerCount={compositionGI.peerCount}
              pctile={compositionGI.invPctPctile}
            />
            <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Staff Breakdown</div>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 bg-indigo-500 rounded"
                    style={{ width: `${compositionGI.invPct}%` }}
                  />
                  <div
                    className="h-4 bg-slate-300 rounded"
                    style={{ width: `${100 - compositionGI.invPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-indigo-600">Inv: {compositionGI.staffInv} ({compositionGI.invPct}%)</span>
                  <span className="text-slate-500">Non-Inv: {compositionGI.nonInv} ({(100 - compositionGI.invPct).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Peer Distribution</div>
              <div className="mt-2 space-y-1 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">p25</span>
                  <span>{compositionGI.stats.invPct.p25}%</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">Median</span>
                  <span>{compositionGI.stats.invPct.median}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">p75</span>
                  <span>{compositionGI.stats.invPct.p75}%</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-bold border-t border-slate-100 pt-1">
                  <span>GI Partners</span>
                  <span>{compositionGI.invPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-3">Full Peer Table</h3>
          <SortableTable
            data={compositionPeers as unknown as Record<string, unknown>[]}
            highlightFirm="GI Partners"
            defaultSort="invPct"
            columns={[
              { key: "firm", label: "Firm" },
              { key: "type", label: "Type" },
              { key: "state", label: "State" },
              { key: "raised", label: "Raised ($M)", align: "right", fmt: (v) => fmt(v as number) },
              { key: "staffTotal", label: "Total", align: "right", fmt: (v) => fmt(v as number) },
              { key: "staffInv", label: "Inv", align: "right", fmt: (v) => fmt(v as number) },
              { key: "nonInv", label: "Non-Inv", align: "right", fmt: (v) => fmt(v as number) },
              { key: "invPct", label: "Inv %", align: "right", fmt: (v) => `${fmt(v as number, 1)}%` },
            ]}
          />
        </div>
      )}

      {/* Methodology */}
      <div className="mt-12 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Methodology</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong>PitchBook analysis:</strong> Active Holding GP Investors, Q1 2026. AUM as reported. Investment professional count (not total staff). Peer set: US-headquartered, $10B&ndash;$100B AUM, 20+ professionals, dedicated investment firm types only.</p>
          <p><strong>Preqin analysis:</strong> Database of GPs, Q1 2025. &ldquo;Total funds raised (10yr)&rdquo; used as size proxy (not AUM). Staff counts include total and investment-specific. Peer set: US-headquartered, $5B&ndash;$25B raised, 10+ staff, PE firms and fund managers only.</p>
          <p><strong>Note on data differences:</strong> PitchBook reports GI Partners AUM at ~$34B with 80 investment professionals. Preqin reports $7.5B raised (10yr) with 150 total staff / 81 investment staff. The AUM vs. fundraising gap reflects legacy and recycled capital. Staff count differences reflect scope (investment-only vs. all employees).</p>
        </div>
      </div>
    </main>
  );
}
