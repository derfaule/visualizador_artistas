"use client";

import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DATA, normalizeBandName, isColombianBand } from "@/lib/data";
import type { SelectedNode } from "@/components/NetworkGraph";

const NetworkGraph = lazy(() => import("@/components/NetworkGraph"));
const DetailPanel = lazy(() => import("@/components/DetailPanel"));

const BAND_COLORS: Record<string, string> = {
  "Lira Unión": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Jazz Nicolás": "bg-blue-100 text-blue-800 border-blue-200",
  "Orquesta de Jorge Marín Vieco": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Orquesta Tropical": "bg-orange-100 text-orange-800 border-orange-200",
  "Orquesta Swing Stars": "bg-purple-100 text-purple-800 border-purple-200",
  "Orquesta Rítmica": "bg-teal-100 text-teal-800 border-teal-200",
  "Los Estudiantes": "bg-lime-100 text-lime-800 border-lime-200",
  "Orquesta Medellín": "bg-red-100 text-red-800 border-red-200",
  "Los Ases del Ritmo": "bg-green-100 text-green-800 border-green-200",
  "Los Caballeros del Ritmo": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Orquesta Sonolux": "bg-pink-100 text-pink-800 border-pink-200",
  "Los Ídolos": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  "Sexteto Miramar": "bg-rose-100 text-rose-800 border-rose-200",
  "Los Corraleros de Majagual": "bg-amber-100 text-amber-800 border-amber-200",
  "El Combo de las Estrellas": "bg-sky-100 text-sky-800 border-sky-200",
  "Los Diplomáticos": "bg-violet-100 text-violet-800 border-violet-200",
};

const colombianData = DATA.filter(isColombianBand);
const allBands = [...new Set(colombianData.map((d) => normalizeBandName(d.band).name))].sort();
const allMembers = [...new Set(colombianData.map((d) => d.member))].sort();

type View = "graph" | "cards";

function FilterSearch({
  onSelectBand,
  onSelectMember,
  onClear,
  selectedLabel,
}: {
  onSelectBand: (band: string) => void;
  onSelectMember: (member: string) => void;
  onClear: () => void;
  selectedLabel: string | null;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.toLowerCase();
  const matchBands = q ? allBands.filter((b) => b.toLowerCase().includes(q)) : allBands;
  const matchMembers = q ? allMembers.filter((m) => m.toLowerCase().includes(q)) : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectBand(band: string) {
    onSelectBand(band);
    setQuery("");
    setOpen(false);
  }

  function selectMember(member: string) {
    onSelectMember(member);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onClear();
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative w-64">
      {/* Input */}
      <div className="flex items-center h-8 rounded-md border border-input bg-background px-2 gap-1.5 focus-within:ring-1 focus-within:ring-ring">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {selectedLabel && !open ? (
          <span className="flex-1 text-sm truncate text-foreground">{selectedLabel}</span>
        ) : (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={selectedLabel ? selectedLabel : "Search bands or members…"}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
          />
        )}
        {selectedLabel && (
          <button
            onMouseDown={(e) => { e.preventDefault(); clear(); }}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
          {matchBands.length === 0 && matchMembers.length === 0 && (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">No results</div>
          )}

          {matchBands.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bands
              </div>
              {matchBands.map((band) => (
                <button
                  key={band}
                  onMouseDown={(e) => { e.preventDefault(); selectBand(band); }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  {band}
                </button>
              ))}
            </>
          )}

          {matchMembers.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-t mt-1">
                Members
              </div>
              {matchMembers.slice(0, 20).map((member) => (
                <button
                  key={member}
                  onMouseDown={(e) => { e.preventDefault(); selectMember(member); }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors text-muted-foreground"
                >
                  {member}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [view, setView] = useState<View>("graph");
  const [graphSelected, setGraphSelected] = useState<SelectedNode | null>(null);

  const filtered = colombianData.filter((d) => {
    const canonicalBand = normalizeBandName(d.band).name;
    return selectedBand ? canonicalBand === selectedBand : true;
  });

  const groupedByBand = allBands
    .filter((b) => !selectedBand || b === selectedBand)
    .map((band) => {
      const bandRows = filtered.filter((d) => normalizeBandName(d.band).name === band);
      const memberMap = new Map<string, { role: string; note: string | null }>();
      bandRows.forEach(({ member, role, band: rawBand }) => {
        const { note } = normalizeBandName(rawBand);
        if (!memberMap.has(member)) {
          memberMap.set(member, { role, note });
        } else {
          const e = memberMap.get(member)!;
          if (!e.role.includes(role)) e.role += ` / ${role}`;
          if (note && !e.note?.includes(note)) e.note = e.note ? `${e.note} · ${note}` : note;
        }
      });
      return { band, memberMap, context: bandRows[0]?.context };
    })
    .filter((g) => g.memberMap.size > 0);

  const selectedLabel = graphSelected
    ? graphSelected.id
    : selectedBand ?? null;

  function handleSelectBand(band: string) {
    setSelectedBand(band);
    setGraphSelected({ type: "band", id: band });
  }

  function handleSelectMember(member: string) {
    setSelectedBand(null);
    setGraphSelected({ type: "member", id: member });
  }

  function handleClear() {
    setSelectedBand(null);
    setGraphSelected(null);
  }

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="border-b px-4 py-2 flex items-center gap-3 shrink-0 bg-background">
        <div className="flex gap-1 shrink-0">
          <Button variant={view === "graph" ? "default" : "outline"} size="sm" onClick={() => setView("graph")}>
            Graph
          </Button>
          <Button variant={view === "cards" ? "default" : "outline"} size="sm" onClick={() => setView("cards")}>
            Cards
          </Button>
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        <FilterSearch
          onSelectBand={handleSelectBand}
          onSelectMember={handleSelectMember}
          onClear={handleClear}
          selectedLabel={selectedLabel}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {view === "graph" ? (
              <motion.div
                key="graph"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Loading graph…
                  </div>
                }>
                  <NetworkGraph
                    selected={graphSelected}
                    onSelect={(node) => {
                      setGraphSelected(node);
                      if (node?.type === "band") setSelectedBand(node.id);
                      else if (!node) { setSelectedBand(null); }
                    }}
                  />
                </Suspense>

                <AnimatePresence>
                  {graphSelected && (
                    <Suspense fallback={null}>
                      <DetailPanel
                        selected={graphSelected}
                        onClose={() => { setGraphSelected(null); setSelectedBand(null); }}
                        onSelect={(node) => {
                          setGraphSelected(node);
                          if (node.type === "band") setSelectedBand(node.id);
                        }}
                      />
                    </Suspense>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="cards"
                className="absolute inset-0 overflow-y-auto p-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                  {groupedByBand.map(({ band, memberMap, context }) => (
                    <Card
                      key={band}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectBand(band)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{band}</CardTitle>
                        <CardDescription className="text-xs">{context}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        {[...memberMap.entries()].map(([member, { role, note }]) => (
                          <div key={member} className="flex items-start justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium leading-snug truncate">{member}</span>
                              {note && <span className="text-xs text-muted-foreground italic">{note}</span>}
                            </div>
                            <Badge
                              className={`text-xs shrink-0 ${BAND_COLORS[band] ?? "bg-gray-100 text-gray-800"}`}
                              variant="outline"
                            >
                              {role}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                  {groupedByBand.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-12">
                      No results found.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
