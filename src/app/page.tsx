"use client";

import { useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DATA, normalizeBandName } from "@/lib/data";
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

type View = "graph" | "cards";

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [view, setView] = useState<View>("graph");
  const [graphSelected, setGraphSelected] = useState<SelectedNode | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const bands = [...new Set(DATA.map((d) => normalizeBandName(d.band).name))];

  const filtered = DATA.filter((d) => {
    const canonicalBand = normalizeBandName(d.band).name;
    const matchesBand = selectedBand ? canonicalBand === selectedBand : true;
    const matchesSearch =
      search === "" ||
      d.member.toLowerCase().includes(search.toLowerCase()) ||
      d.role.toLowerCase().includes(search.toLowerCase()) ||
      canonicalBand.toLowerCase().includes(search.toLowerCase());
    return matchesBand && matchesSearch;
  });

  const groupedByBand = bands
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

  const handleBandFilter = (band: string | null) => {
    setSelectedBand(band === selectedBand ? null : band);
    setGraphSelected(band && band !== selectedBand ? { type: "band", id: band } : null);
  };

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visualizador de Artistas</h1>
          <p className="text-muted-foreground text-sm">Colombian music bands · members · instruments</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "graph" ? "default" : "outline"} size="sm" onClick={() => setView("graph")}>
            Network Graph
          </Button>
          <Button variant={view === "cards" ? "default" : "outline"} size="sm" onClick={() => setView("cards")}>
            Cards
          </Button>
        </div>
      </div>

      {/* Body row */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-52 shrink-0 border-r flex flex-col bg-background">
          {/* Search – always visible */}
          <div className="p-3 border-b">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setGraphSelected(null); }}
              className="h-8 text-sm"
            />
          </div>

          {/* Bands toggle */}
          <button
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-b"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Bands
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform duration-200"
              style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {/* Band list – collapsed by default */}
          {filtersOpen && (
            <div className="overflow-y-auto flex-1 py-1">
              <button
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors ${selectedBand === null ? "font-semibold text-primary" : "text-foreground"}`}
                onClick={() => { setSelectedBand(null); setGraphSelected(null); }}
              >
                All bands
              </button>
              {bands.map((band) => (
                <button
                  key={band}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors truncate ${selectedBand === band ? "font-semibold text-primary bg-accent/50" : "text-foreground"}`}
                  onClick={() => handleBandFilter(band)}
                  title={band}
                >
                  {band}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
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
                    highlight={search || undefined}
                    selected={graphSelected}
                    onSelect={(node) => {
                      setGraphSelected(node);
                      if (node?.type === "band") setSelectedBand(node.id);
                      else if (!node) setSelectedBand(null);
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
                      onClick={() => handleBandFilter(band)}
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
