"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const DATA = [
  { band: "Jazz Nicolás", member: "Nicolás Torres Baena", role: "Mandolina, Director", context: "1924 Formation" },
  { band: "Jazz Nicolás", member: "Enrique Castro", role: "Violín", context: "1924 Formation" },
  { band: "Jazz Nicolás", member: "Juan de Dios Durán", role: "Saxofón", context: "1924 Formation" },
  { band: "Jazz Nicolás", member: "Abel Arenas", role: "Guitarra, Cantante", context: "1937 Formation" },
  { band: "Jazz Nicolás", member: "Jorge Marín Vieco", role: "Saxofón", context: "1924 Formation" },
  { band: "Orquesta Tropical", member: "Nicolás Torres", role: "Pianista, Director", context: "1946 Formation" },
  { band: "Orquesta Tropical", member: "César Sepúlveda", role: "Trompeta", context: "1946 Formation" },
  { band: "Orquesta Tropical", member: "Gerardo Vélez", role: "Cantante romántico", context: "1946 Formation" },
  { band: "Orquesta Tropical", member: "Jaime Gallego", role: "Bajo", context: "1946 Formation" },
  { band: "Orquesta Swing Stars", member: "Jesús Rincón", role: "Piano", context: "c. 1949" },
  { band: "Orquesta Swing Stars", member: "César Sepúlveda", role: "Trompeta", context: "c. 1949" },
  { band: "Orquesta Swing Stars", member: "Jaime Gallego", role: "Contrabajo", context: "c. 1949" },
  { band: "Orquesta Swing Stars", member: "José Pérez Pérez", role: "Saxofón", context: "c. 1949" },
  { band: "Los Ases del Ritmo", member: "Arturo Zuluaga", role: "Cantante, Compositor, Líder", context: "Initial Formation" },
  { band: "Los Ases del Ritmo", member: "César Sepúlveda", role: "Trompeta", context: "Initial Formation" },
  { band: "Los Ases del Ritmo", member: "Nicolás Torres", role: "Piano", context: "Reinforcement" },
  { band: "Los Ases del Ritmo", member: "Ramón Paniagua", role: "Saxofón", context: "Initial Formation" },
  { band: "Orquesta Medellín", member: "Arturo Zuluaga", role: "Cantante", context: "General Formation" },
  { band: "Orquesta Medellín", member: "Fabio Bedoya", role: "Trompetista (Founder)", context: "General Formation" },
  { band: "Orquesta Medellín", member: "Ramón Paniagua", role: "Saxofón", context: "General Formation" },
  { band: "Los Caballeros del Ritmo", member: "Enrique Giraldo", role: "Saxofón, Director", context: "1950s" },
  { band: "Los Caballeros del Ritmo", member: "Abraham Sánchez", role: "Bajo", context: "1950s" },
  { band: "Los Caballeros del Ritmo", member: "Jorge Castrillón", role: "Saxofón", context: "1950s" },
  { band: "Orquesta Sonolux", member: "Álvaro Rojas", role: "Saxofón tenor", context: "1960–1962" },
  { band: "Orquesta Sonolux", member: "Manuel Cervantes", role: "Trompeta", context: "1960–1962" },
  { band: "Orquesta Sonolux", member: "Arsenio Montes", role: "Trombón", context: "1960–1962" },
  { band: "Orquesta Sonolux", member: "Luis Cataño", role: "Saxofón barítono", context: "1960–1962" },
];

const BAND_COLORS: Record<string, string> = {
  "Jazz Nicolás": "bg-blue-100 text-blue-800 border-blue-200",
  "Orquesta Tropical": "bg-orange-100 text-orange-800 border-orange-200",
  "Orquesta Swing Stars": "bg-purple-100 text-purple-800 border-purple-200",
  "Los Ases del Ritmo": "bg-green-100 text-green-800 border-green-200",
  "Orquesta Medellín": "bg-red-100 text-red-800 border-red-200",
  "Los Caballeros del Ritmo": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Orquesta Sonolux": "bg-pink-100 text-pink-800 border-pink-200",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedBand, setSelectedBand] = useState<string | null>(null);

  const bands = [...new Set(DATA.map((d) => d.band))];

  const filtered = DATA.filter((d) => {
    const matchesBand = selectedBand ? d.band === selectedBand : true;
    const matchesSearch =
      search === "" ||
      d.member.toLowerCase().includes(search.toLowerCase()) ||
      d.role.toLowerCase().includes(search.toLowerCase());
    return matchesBand && matchesSearch;
  });

  const groupedByBand = bands
    .filter((b) => !selectedBand || b === selectedBand)
    .map((band) => ({
      band,
      members: filtered.filter((d) => d.band === band),
    }))
    .filter((g) => g.members.length > 0);

  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visualizador de Artistas</h1>
          <p className="text-muted-foreground mt-1">Colombian music bands · members · instruments</p>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Search members or roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedBand === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBand(null)}
            >
              All Bands
            </Button>
            {bands.map((band) => (
              <Button
                key={band}
                variant={selectedBand === band ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBand(band === selectedBand ? null : band)}
              >
                {band}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {groupedByBand.map(({ band, members }) => (
            <Card key={band}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{band}</CardTitle>
                <CardDescription>{members[0]?.context}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {members.map((m, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">{m.member}</span>
                    <Badge className={`text-xs shrink-0 ${BAND_COLORS[band] ?? ""}`} variant="outline">
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {groupedByBand.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No results found.</p>
        )}
      </div>
    </main>
  );
}
