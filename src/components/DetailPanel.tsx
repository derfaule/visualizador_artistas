"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DATA, normalizeBandName } from "@/lib/data";
import type { SelectedNode } from "@/components/NetworkGraph";

interface Props {
  selected: SelectedNode;
  onClose: () => void;
  onSelect: (node: SelectedNode) => void;
}

export default function DetailPanel({ selected, onClose, onSelect }: Props) {
  const isBand = selected.type === "band";

  const rows = isBand
    ? DATA.filter((d) => normalizeBandName(d.band).name === selected.id)
    : DATA.filter((d) => d.member === selected.id);

  // Band view: group by member name, merge roles + collect formation notes
  type MemberEntry = { roles: string[]; notes: string[] };
  const memberGroups = new Map<string, MemberEntry>();
  if (isBand) {
    rows.forEach(({ member, role, band }) => {
      const { note } = normalizeBandName(band);
      if (!memberGroups.has(member)) memberGroups.set(member, { roles: [], notes: [] });
      const e = memberGroups.get(member)!;
      if (!e.roles.includes(role)) e.roles.push(role);
      if (note && !e.notes.includes(note)) e.notes.push(note);
    });
  }

  // Member view: group by canonical band name, merge roles + collect formation notes
  type BandEntry = { name: string; roles: string[]; notes: string[] };
  const bandGroups = new Map<string, BandEntry>();
  if (!isBand) {
    rows.forEach(({ band, role }) => {
      const { name, note } = normalizeBandName(band);
      if (!bandGroups.has(name)) bandGroups.set(name, { name, roles: [], notes: [] });
      const e = bandGroups.get(name)!;
      if (!e.roles.includes(role)) e.roles.push(role);
      if (note && !e.notes.includes(note)) e.notes.push(note);
    });
  }

  const memberCount = memberGroups.size;
  const bandCount = bandGroups.size;
  const subtitle = isBand
    ? `${memberCount} member${memberCount !== 1 ? "s" : ""}`
    : `${bandCount} band${bandCount !== 1 ? "s" : ""}`;

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="absolute top-0 right-0 h-full w-80 z-10 shadow-2xl"
    >
      <Card className="h-full rounded-none border-l border-t-0 border-b-0 border-r-0 flex flex-col">
        <CardHeader className="pb-3 flex-row items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className="mb-1 text-xs">
              {isBand ? "Band" : "Musician"}
            </Badge>
            <CardTitle className="text-base leading-snug">{selected.id}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 -mr-2 -mt-1" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 overflow-y-auto pt-4 space-y-3">
          {isBand ? (
            [...memberGroups.entries()].map(([member, { roles, notes }]) => (
              <button
                key={member}
                onClick={() => onSelect({ type: "member", id: member })}
                className="w-full text-left flex items-start justify-between gap-2 group rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {member}
                  </span>
                  {notes.length > 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      {notes.join(" · ")}
                    </span>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs shrink-0 max-w-[120px] truncate">
                  {roles.join(" / ")}
                </Badge>
              </button>
            ))
          ) : (
            [...bandGroups.values()].map(({ name, roles, notes }) => (
              <button
                key={name}
                onClick={() => onSelect({ type: "band", id: name })}
                className="w-full text-left rounded-md px-2 py-2 hover:bg-accent transition-colors group space-y-0.5"
              >
                <div className="text-sm font-medium group-hover:text-primary transition-colors">
                  {name}
                </div>
                <div className="text-xs text-muted-foreground">{roles.join(" / ")}</div>
                {notes.length > 0 && (
                  <div className="text-xs text-muted-foreground italic">{notes.join(" · ")}</div>
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
