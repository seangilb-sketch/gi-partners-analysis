"use client";

import { useState } from "react";
import {
  pitchbookPeers,
  pitchbookGI,
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
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : value >= 50
        ? "bg-[var(--color-gi-teal-light)] text-[var(--color-gi-navy)] border-[var(--color-gi-teal)]"
        : value >= 25
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-red-50 text-red-800 border-red-200";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {value.toFixed(0)}th percentile
    </span>
  );
}

function PeerContext({
  rows,
  giLabel,
}: {
  rows: { label: string; p25: string; median: string; p75: string; gi: string }[];
  giLabel?: string;
}) {
  return (
    <div className="bg-white rounded border border-[var(--color-gi-border)] p-6 mb-8">
      <h3 className="text-sm font-semibold text-[var(--color-gi-text)] uppercase tracking-widest mb-4 font-sans">
        Where GI Partners Sits Among Peers
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-gi-border)]">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-[var(--color-gi-muted)] uppercase tracking-wide">Metric</th>
              <th className="text-right py-2 px-4 text-xs font-semibold text-[var(--color-gi-muted)] uppercase tracking-wide">25th Percentile</th>
              <th className="text-right py-2 px-4 text-xs font-semibold text-[var(--color-gi-muted)] uppercase tracking-wide">Median (50th)</th>
              <th className="text-right py-2 px-4 text-xs font-semibold text-[var(--color-gi-muted)] uppercase tracking-wide">75th Percentile</th>
              <th className="text-right py-2 pl-4 text-xs font-bold text-[var(--color-gi-navy)] uppercase tracking-wide">{giLabel ?? "GI Partners"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[var(--color-gi-border)] last:border-0">
                <td className="py-2.5 pr-4 font-semibold text-[var(--color-gi-text)]">{r.label}</td>
                <td className="py-2.5 px-4 text-right tabular-nums text-[var(--color-gi-text-light)]">{r.p25}</td>
                <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-[var(--color-gi-text)]">{r.median}</td>
                <td className="py-2.5 px-4 text-right tabular-nums text-[var(--color-gi-text-light)]">{r.p75}</td>
                <td className="py-2.5 pl-4 text-right tabular-nums font-bold text-[var(--color-gi-navy)]">{r.gi}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    const cmp =
      typeof av === "string"
        ? (av as string).localeCompare(bv as string)
        : (av as number) - (bv as number);
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
      <div className="overflow-x-auto rounded border border-[var(--color-gi-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-gi-navy)] text-white">
              <th className="px-3 py-2.5 text-left text-xs font-semibold w-8">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-xs font-semibold cursor-pointer hover:bg-[#003558] transition-colors select-none tracking-wide ${col.align === "right" ? "text-right" : "text-left"}`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 opacity-80">{sortDir === "asc" ? "▲" : "▼"}</span>
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
                  className={`border-b border-[var(--color-gi-border)] transition-colors ${
                    isGI
                      ? "bg-[var(--color-gi-teal-light)] font-semibold"
                      : i % 2 === 0
                        ? "bg-white"
                        : "bg-[var(--color-gi-bg-alt)]"
                  } hover:bg-[#e8f4f6]`}
                >
                  <td className="px-3 py-2 text-xs text-[var(--color-gi-muted)]">
                    {page * pageSize + i + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 ${col.align === "right" ? "text-right tabular-nums" : ""} ${
                        isGI && col.key === "firm"
                          ? "text-[var(--color-gi-navy)] font-bold"
                          : ""
                      }`}
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
        <div className="flex items-center justify-between mt-4 text-sm text-[var(--color-gi-text-light)]">
          <span>
            Showing {page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-1.5 rounded border border-[var(--color-gi-border)] hover:border-[var(--color-gi-teal)] hover:text-[var(--color-gi-navy)] disabled:opacity-30 transition-colors text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-1.5 rounded border border-[var(--color-gi-border)] hover:border-[var(--color-gi-teal)] hover:text-[var(--color-gi-navy)] disabled:opacity-30 transition-colors text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded border border-[var(--color-gi-border)] px-5 py-5 hover:border-[var(--color-gi-teal)] transition-colors">
      <div className="text-[11px] text-[var(--color-gi-muted)] uppercase tracking-widest font-sans font-semibold">
        {label}
      </div>
      <div className="text-2xl font-bold text-[var(--color-gi-navy)] mt-2 font-sans">{value}</div>
      {sub && <div className="text-xs text-[var(--color-gi-text-light)] mt-1">{sub}</div>}
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
    <div className="bg-white rounded border border-[var(--color-gi-border)] px-6 py-5">
      <div className="text-[11px] text-[var(--color-gi-muted)] uppercase tracking-widest font-sans font-semibold">
        {label}
      </div>
      <div className="text-3xl font-bold text-[var(--color-gi-navy)] mt-2 font-sans">{value}</div>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-sm text-[var(--color-gi-text-light)]">
          Rank {rank} of {peerCount}
        </span>
        <PctileBadge value={pctile} />
      </div>
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<"pitchbook" | "composition">("pitchbook");

  const tabs = [
    { id: "pitchbook" as const, label: "AUM Efficiency", source: "PitchBook" },
    { id: "composition" as const, label: "Staff Composition", source: "Preqin" },
  ];

  return (
    <div className="min-h-screen">
      {/* Nav bar */}
      <header className="bg-[var(--color-gi-navy)] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-serif text-xl tracking-wide font-bold">GI Partners</div>
          <div className="text-xs text-[var(--color-gi-teal)] tracking-widest uppercase font-sans">
            Headcount Efficiency Analysis
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[var(--color-gi-navy)] text-white pb-12 pt-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-serif font-bold tracking-tight">
            Headcount Efficiency Benchmarking
          </h1>
          <p className="mt-3 text-[var(--color-gi-teal)] text-lg font-sans max-w-3xl">
            Peer analysis across PitchBook and Preqin datasets &mdash; US-based investment
            firms in comparable AUM and fundraising bands
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-6">
        {/* GI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          <MetricCard label="AUM" value={`$${fmt(pitchbookGI.aum)}M`} sub="Source: PitchBook Q1 2026" />
          <MetricCard label="10yr Raised" value="$7,494M" sub="Source: Preqin Q1 2025" />
          <MetricCard label="Inv. Professionals" value={`${pitchbookGI.headcount}`} sub="Source: PitchBook Q1 2026" />
          <MetricCard label="Total Staff" value={`${compositionGI.staffTotal}`} sub="Source: Preqin Q1 2025" />
          <MetricCard label="Active Portfolio" value={`${fmt(pitchbookGI.active)}`} sub="Source: PitchBook Q1 2026" />
          <MetricCard label="Total Investments" value={`${fmt(pitchbookGI.totalInv)}`} sub="Source: PitchBook Q1 2026" />
        </div>

        {/* Tabs — styled as obvious clickable buttons */}
        <div className="flex gap-3 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-6 py-3 rounded font-sans text-sm font-semibold tracking-wide transition-all ${
                activeTab === t.id
                  ? "bg-[var(--color-gi-navy)] text-white shadow-md"
                  : "bg-white text-[var(--color-gi-text-light)] border border-[var(--color-gi-border)] hover:border-[var(--color-gi-teal)] hover:text-[var(--color-gi-navy)] cursor-pointer"
              }`}
            >
              {t.label}
              <span className={`ml-2 text-xs font-normal ${activeTab === t.id ? "text-[var(--color-gi-teal)]" : "text-[var(--color-gi-muted)]"}`}>
                {t.source}
              </span>
            </button>
          ))}
        </div>

        {/* PitchBook Tab */}
        {activeTab === "pitchbook" && (
          <div>
            <div className="mb-6 p-5 bg-[var(--color-gi-bg-alt)] rounded border-l-4 border-[var(--color-gi-teal)]">
              <div className="text-sm text-[var(--color-gi-text-light)] leading-relaxed">
                <strong className="text-[var(--color-gi-text)]">Peer set:</strong>{" "}
                {pitchbookGI.peerCount} dedicated US investment firms (PE/Buyout, Infrastructure,
                Growth, RE, VC, Mezz, Debt, Impact) with AUM $10B&ndash;$100B and 20+ investment
                professionals. Excludes banks, hedge funds, asset managers, family offices,
                fund-of-funds, endowments.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

            <PeerContext
              rows={[
                {
                  label: "AUM per Head ($M)",
                  p25: `$${fmt(pitchbookGI.stats.aumPerHead.p25)}M`,
                  median: `$${fmt(pitchbookGI.stats.aumPerHead.median)}M`,
                  p75: `$${fmt(pitchbookGI.stats.aumPerHead.p75)}M`,
                  gi: `$${fmt(pitchbookGI.aumPerHead)}M`,
                },
                {
                  label: "Portcos per Head",
                  p25: fmt(pitchbookGI.stats.portcosPerHead.p25, 2),
                  median: fmt(pitchbookGI.stats.portcosPerHead.median, 2),
                  p75: fmt(pitchbookGI.stats.portcosPerHead.p75, 2),
                  gi: fmt(pitchbookGI.portcosPerHead, 2),
                },
              ]}
            />

            <h3 className="font-serif text-xl text-[var(--color-gi-navy)] mb-4">Full Peer Table</h3>
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

        {/* Composition Tab */}
        {activeTab === "composition" && (
          <div>
            <div className="mb-6 p-5 bg-[var(--color-gi-bg-alt)] rounded border-l-4 border-[var(--color-gi-teal)]">
              <div className="text-sm text-[var(--color-gi-text-light)] leading-relaxed">
                <strong className="text-[var(--color-gi-text)]">Peer set:</strong>{" "}
                {compositionGI.peerCount} US PE firms and fund managers ($5B&ndash;$25B raised over 10 years)
                with both total and investment staff counts reported. Excludes fund-of-funds, family offices, hedge funds.
                <br />
                <strong className="text-[var(--color-gi-text)]">Question:</strong> What share of
                GI&apos;s workforce is investment professionals vs. operations/support?
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <PositionCard
                label="Investment Staff %"
                value={`${compositionGI.invPct}%`}
                rank={compositionGI.invPctRank}
                peerCount={compositionGI.peerCount}
                pctile={compositionGI.invPctPctile}
              />
              <div className="bg-white rounded border border-[var(--color-gi-border)] px-6 py-5">
                <div className="text-[11px] text-[var(--color-gi-muted)] uppercase tracking-widest font-sans font-semibold">
                  Staff Breakdown
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-1 h-6 rounded overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-gi-navy)] rounded-l"
                      style={{ width: `${compositionGI.invPct}%` }}
                    />
                    <div
                      className="h-full bg-[var(--color-gi-teal)] rounded-r"
                      style={{ width: `${100 - compositionGI.invPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-[var(--color-gi-navy)] font-semibold">
                      Investment: {compositionGI.staffInv} ({compositionGI.invPct}%)
                    </span>
                    <span className="text-[var(--color-gi-teal)]">
                      Non-Inv: {compositionGI.nonInv} ({(100 - compositionGI.invPct).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded border border-[var(--color-gi-border)] px-6 py-5">
                <div className="text-[11px] text-[var(--color-gi-muted)] uppercase tracking-widest font-sans font-semibold">
                  Peer Distribution
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-gi-muted)]">25th Percentile</span>
                    <span className="tabular-nums">{compositionGI.stats.invPct.p25}%</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-[var(--color-gi-text)]">Median (50th)</span>
                    <span className="tabular-nums">{compositionGI.stats.invPct.median}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-gi-muted)]">75th Percentile</span>
                    <span className="tabular-nums">{compositionGI.stats.invPct.p75}%</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-gi-navy)] font-bold border-t border-[var(--color-gi-border)] pt-2">
                    <span>GI Partners</span>
                    <span className="tabular-nums">{compositionGI.invPct}%</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-serif text-xl text-[var(--color-gi-navy)] mb-4">Full Peer Table</h3>
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
      </main>

      {/* Footer */}
      <footer className="bg-[var(--color-gi-navy)] text-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-gi-teal)] mb-4 font-sans">
            Methodology
          </h3>
          <div className="text-xs text-white/60 space-y-2 leading-relaxed max-w-4xl">
            <p>
              <strong className="text-white/80">PitchBook analysis:</strong> Active Holding GP
              Investors, Q1 2026. AUM as reported. Investment professional count (not total staff).
              Peer set: US-headquartered, $10B&ndash;$100B AUM, 20+ professionals, dedicated
              investment firm types only.
            </p>
            <p>
              <strong className="text-white/80">Preqin analysis:</strong> Database of GPs, Q1 2025.
              &ldquo;Total funds raised (10yr)&rdquo; used as size proxy (not AUM). Staff counts
              include total and investment-specific. Peer set: US-headquartered, $5B&ndash;$25B
              raised, 10+ staff, PE firms and fund managers only.
            </p>
            <p>
              <strong className="text-white/80">Note on data differences:</strong> PitchBook reports
              GI Partners AUM at ~$34B with 80 investment professionals. Preqin reports $7.5B raised
              (10yr) with 150 total staff / 81 investment staff. The AUM vs. fundraising gap reflects
              legacy and recycled capital. Staff count differences reflect scope (investment-only vs.
              all employees).
            </p>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-xs text-white/30">
            Prepared for GI Partners. Data sources: PitchBook (Q1 2026), Preqin (Q1 2025).
          </div>
        </div>
      </footer>
    </div>
  );
}
