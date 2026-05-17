"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { DATA, normalizeBandName } from "@/lib/data";

export type SelectedNode = { type: "band" | "member"; id: string };

interface Props {
  highlight?: string;
  selected?: SelectedNode | null;
  onSelect?: (node: SelectedNode | null) => void;
}

const BAND_COLOR_LIST = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#3b82f6", "#84cc16",
  "#06b6d4", "#a855f7", "#e11d48", "#0ea5e9",
];

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  type: "band" | "member";
  name: string;
  bands: string[];
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  bandId: string;
}

// Split a band name into at most 2 lines of ≤14 chars each
function wrapLabel(name: string): string[] {
  if (name.length <= 14) return [name];
  const words = name.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= 14) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      else lines.push(w.slice(0, 14));
      cur = cur ? w : "";
      if (lines.length >= 2) { cur = ""; break; }
    }
  }
  if (cur && lines.length < 2) lines.push(cur);
  return lines;
}

function buildGraphData() {
  const bands = [...new Set(DATA.map((d) => normalizeBandName(d.band).name))];
  const bandColor = new Map(
    bands.map((b, i) => [b, BAND_COLOR_LIST[i % BAND_COLOR_LIST.length]])
  );

  const memberBandsMap = new Map<string, Set<string>>();
  DATA.forEach(({ band, member }) => {
    const { name } = normalizeBandName(band);
    if (!memberBandsMap.has(member)) memberBandsMap.set(member, new Set());
    memberBandsMap.get(member)!.add(name);
  });

  const nodes: NodeDatum[] = [
    ...bands.map((b) => ({ id: `band::${b}`, type: "band" as const, name: b, bands: [b] })),
    ...[...memberBandsMap.entries()].map(([m, mBands]) => ({
      id: `member::${m}`,
      type: "member" as const,
      name: m,
      bands: [...mBands],
    })),
  ];

  const links: LinkDatum[] = [];
  memberBandsMap.forEach((mBands, member) => {
    mBands.forEach((band) => {
      links.push({ source: `member::${member}` as unknown as NodeDatum, target: `band::${band}` as unknown as NodeDatum, bandId: band });
    });
  });

  return { nodes, links, bandColor };
}

export default function NetworkGraph({ highlight, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable refs so D3 callbacks never go stale without restarting the sim
  const selectedRef = useRef(selected);
  const highlightRef = useRef(highlight);
  const onSelectRef = useRef(onSelect);
  const applyStylesRef = useRef<(() => void) | null>(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { highlightRef.current = highlight; }, [highlight]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Re-style without touching the simulation
  useEffect(() => { applyStylesRef.current?.(); }, [selected, highlight]);

  // Build the graph once on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();
    const { nodes, links, bandColor } = buildGraphData();

    const svg = d3
      .select(el)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("cursor", "grab");

    // Zoom / pan
    const root = svg.append("g");
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.04, 4])
        .on("zoom", (ev) => {
          root.attr("transform", ev.transform);
          svg.style("cursor", ev.sourceEvent?.type === "mousedown" ? "grabbing" : "grab");
        })
    );

    svg.on("click", () => onSelectRef.current?.(null));

    // Simulation
    const sim = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance((l) => ((l.source as NodeDatum).bands?.length > 1 ? 90 : 50))
          .strength(0.6)
      )
      .force(
        "charge",
        d3.forceManyBody<NodeDatum>().strength((d) => (d.type === "band" ? -800 : -25))
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.04))
      .force(
        "collide",
        d3.forceCollide<NodeDatum>().radius((d) => (d.type === "band" ? 56 : 10)).strength(0.6)
      );

    // ── Edges ────────────────────────────────────────────────────────────────
    const linkSel = root
      .append("g")
      .selectAll<SVGLineElement, LinkDatum>("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1)
      .attr("stroke", (d) => bandColor.get(d.bandId) ?? "#94a3b8")
      .attr("opacity", 0.25);

    // ── Member nodes ─────────────────────────────────────────────────────────
    const memberSel = root
      .append("g")
      .selectAll<SVGCircleElement, NodeDatum>("circle")
      .data(nodes.filter((n) => n.type === "member"))
      .join("circle")
      .attr("r", (d) => (d.bands.length > 1 ? 7 : 5))
      .attr("fill", (d) => {
        if (d.bands.length > 1) return "#1e293b";
        const c = bandColor.get(d.bands[0]);
        return c ?? "#e2e8f0";
      })
      .attr("fill-opacity", (d) => (d.bands.length > 1 ? 1 : 0.35))
      .attr("stroke", (d) => {
        if (d.bands.length > 1) return "#6366f1";
        return bandColor.get(d.bands[0]) ?? "#94a3b8";
      })
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (ev, d) => {
        ev.stopPropagation();
        const id = d.name;
        const cur = selectedRef.current;
        onSelectRef.current?.(
          cur?.type === "member" && cur.id === id ? null : { type: "member", id }
        );
      });

    // ── Band nodes (<g> so we can attach text labels) ─────────────────────────
    const bandG = root
      .append("g")
      .selectAll<SVGGElement, NodeDatum>("g")
      .data(nodes.filter((n) => n.type === "band"))
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (ev, d) => {
        ev.stopPropagation();
        const id = d.name;
        const cur = selectedRef.current;
        onSelectRef.current?.(
          cur?.type === "band" && cur.id === id ? null : { type: "band", id }
        );
      });

    bandG
      .append("circle")
      .attr("r", 24)
      .attr("fill", (d) => bandColor.get(d.name) ?? "#6366f1")
      .attr("stroke", "none")
      .attr("stroke-width", 3);

    // Selection ring (invisible by default)
    bandG
      .append("circle")
      .attr("class", "ring")
      .attr("r", 28)
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("opacity", 0);

    // Text labels below each band circle
    bandG.each(function (d) {
      const g = d3.select(this);
      const lines = wrapLabel(d.name);
      lines.forEach((line, i) => {
        g.append("text")
          .text(line)
          .attr("text-anchor", "middle")
          .attr("x", 0)
          .attr("y", 30 + i * 13)
          .attr("font-size", 9)
          .attr("font-weight", "600")
          .attr("fill", "#334155")
          .attr("pointer-events", "none");
      });
    });

    // ── Drag ─────────────────────────────────────────────────────────────────
    const makeDrag = <T extends SVGElement>() =>
      d3
        .drag<T, NodeDatum>()
        .on("start", (ev, d) => {
          if (!ev.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (ev, d) => {
          d.fx = ev.x;
          d.fy = ev.y;
        })
        .on("end", (ev, d) => {
          if (!ev.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

    bandG.call(makeDrag<SVGGElement>());
    memberSel.call(makeDrag<SVGCircleElement>());

    // ── Tick ─────────────────────────────────────────────────────────────────
    sim.on("tick", () => {
      linkSel
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0);

      memberSel.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      bandG.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // ── Style updater (called on selected / highlight change) ─────────────────
    applyStylesRef.current = () => {
      const sel = selectedRef.current;
      const hl = highlightRef.current?.toLowerCase();

      const activeBands = new Set<string>();
      const activeMembers = new Set<string>();

      if (sel?.type === "band") {
        activeBands.add(sel.id);
        DATA.filter((d) => normalizeBandName(d.band).name === sel.id).forEach((d) =>
          activeMembers.add(d.member)
        );
      } else if (sel?.type === "member") {
        activeMembers.add(sel.id);
        DATA.filter((d) => d.member === sel.id).forEach((d) =>
          activeBands.add(normalizeBandName(d.band).name)
        );
      }

      const isLit = (type: "band" | "member", name: string) => {
        if (!sel && !hl) return true;
        if (hl) return name.toLowerCase().includes(hl);
        return type === "band" ? activeBands.has(name) : activeMembers.has(name);
      };

      // Bands
      bandG.attr("opacity", (d) => (isLit("band", d.name) ? 1 : 0.12));
      bandG.select<SVGCircleElement>(".ring").attr("opacity", (d) =>
        sel?.type === "band" && sel.id === d.name ? 1 : 0
      );

      // Members
      memberSel.attr("opacity", (d) => (isLit("member", d.name) ? 1 : 0.08));

      // Edges
      linkSel.attr("opacity", (d) => {
        const src = d.source as NodeDatum;
        const tgt = d.target as NodeDatum;
        if (!sel && !hl) return 0.25;
        if (hl)
          return src.name.toLowerCase().includes(hl) || tgt.name.toLowerCase().includes(hl)
            ? 0.6
            : 0.04;
        return activeBands.has(tgt.name) && activeMembers.has(src.name) ? 0.7 : 0.04;
      });
    };

    applyStylesRef.current();

    return () => {
      sim.stop();
      d3.select(el).selectAll("*").remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-slate-500 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-sm z-10 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-indigo-500 inline-block" /> Band
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block border border-indigo-400" /> Multi-band
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-200 inline-block border border-indigo-400" /> Member
        </span>
      </div>
    </div>
  );
}
