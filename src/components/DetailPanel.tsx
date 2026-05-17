"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DATA } from "@/lib/data";
import type { SelectedNode } from "@/components/NetworkGraph";

interface Props {
  selected: SelectedNode;
  onClose: () => void;
  onSelect: (node: SelectedNode) => void;
}

export default function DetailPanel({ selected, onClose, onSelect }: Props) {
  const isBand = selected.type === "band";

  const rows = isBand
    ? DATA.filter((d) => d.band === selected.id)
    : DATA.filter((d) => d.member === selected.id);

  const title = selected.id;
  const subtitle = isBand
    ? `${rows.length} member${rows.length !== 1 ? "s" : ""}`
    : `${[...new Set(rows.map((r) => r.band))].length} band${rows.length !== 1 ? "s" : ""}`;

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
            <CardTitle className="text-base leading-snug">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 -mr-2 -mt-1" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 overflow-y-auto pt-4 space-y-3">
          {isBand ? (
            // Band view: list members, click to select member
            rows.map((row, i) => (
              <button
                key={i}
                onClick={() => onSelect({ type: "member", id: row.member })}
                className="w-full text-left flex items-start justify-between gap-2 group rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {row.member}
                </span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {row.role}
                </Badge>
              </button>
            ))
          ) : (
            // Member view: list bands, click to select band
            rows.map((row, i) => (
              <button
                key={i}
                onClick={() => onSelect({ type: "band", id: row.band })}
                className="w-full text-left rounded-md px-2 py-2 hover:bg-accent transition-colors group space-y-0.5"
              >
                <div className="text-sm font-medium group-hover:text-primary transition-colors">
                  {row.band}
                </div>
                <div className="text-xs text-muted-foreground">{row.role}</div>
                <div className="text-xs text-muted-foreground italic">{row.context}</div>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
