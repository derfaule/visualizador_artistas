"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { DATA } from "@/lib/data";

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  type: "band" | "member";
  label: string;
  bands?: string[];
}

interface LinkDatum {
  source: string | NodeDatum;
  target: string | NodeDatum;
  role: string;
}

const BAND_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#3b82f6", "#84cc16",
  "#06b6d4", "#a855f7",
];

export default function NetworkGraph({ highlight }: { highlight?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const el = svgRef.current;
    const width = el.clientWidth || 900;
    const height = el.clientHeight || 600;

    d3.select(el).selectAll("*").remove();

    const bands = [...new Set(DATA.map((d) => d.band))];
    const bandColor = new Map(bands.map((b, i) => [b, BAND_COLORS[i % BAND_COLORS.length]]));

    // Build nodes
    const bandNodes: NodeDatum[] = bands.map((b) => ({ id: b, type: "band", label: b }));

    const memberMap = new Map<string, Set<string>>();
    DATA.forEach(({ band, member }) => {
      if (!memberMap.has(member)) memberMap.set(member, new Set());
      memberMap.get(member)!.add(band);
    });

    const memberNodes: NodeDatum[] = [...memberMap.entries()].map(([name, bs]) => ({
      id: name,
      type: "member",
      label: name,
      bands: [...bs],
    }));

    const nodes: NodeDatum[] = [...bandNodes, ...memberNodes];

    const links: LinkDatum[] = DATA.map(({ band, member, role }) => ({
      source: member,
      target: band,
      role,
    }));

    const svg = d3.select(el);

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", (e) => {
      g.attr("transform", e.transform.toString());
    });
    svg.call(zoom);

    const g = svg.append("g");

    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force("link", d3.forceLink<NodeDatum, LinkDatum>(links).id((d) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(28));

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => {
        const targetId = typeof d.target === "string" ? d.target : d.target.id;
        return bandColor.get(targetId) ?? "#ccc";
      })
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 1.5);

    const node = g
      .append("g")
      .selectAll<SVGGElement, NodeDatum>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, NodeDatum>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("circle")
      .attr("r", (d) => (d.type === "band" ? 18 : 8))
      .attr("fill", (d) => {
        if (d.type === "band") return bandColor.get(d.id) ?? "#999";
        // multi-band members get a gradient-like indicator
        return d.bands && d.bands.length > 1 ? "#1e293b" : "#94a3b8";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", (d) => {
        if (!highlight) return 1;
        return d.id.toLowerCase().includes(highlight.toLowerCase()) ||
          (d.type === "member" && d.bands?.some((b) => b.toLowerCase().includes(highlight.toLowerCase())))
          ? 1
          : 0.2;
      });

    node
      .append("text")
      .text((d) => (d.type === "band" ? d.label : d.label.split(" ")[0]))
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.type === "band" ? 32 : 20))
      .attr("font-size", (d) => (d.type === "band" ? "11px" : "9px"))
      .attr("fill", "#334155")
      .attr("pointer-events", "none");

    node.on("mouseenter", (event, d) => {
      const rect = el.getBoundingClientRect();
      const content =
        d.type === "band"
          ? `<strong>${d.label}</strong><br/>${DATA.filter((r) => r.band === d.id).length} members`
          : `<strong>${d.label}</strong><br/>${DATA.filter((r) => r.member === d.id)
              .map((r) => `${r.band} · ${r.role}`)
              .join("<br/>")}`;
      setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, content });
    });

    node.on("mouseleave", () => setTooltip(null));

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [highlight]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-white border border-border rounded-md shadow-lg px-3 py-2 text-xs max-w-[220px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
      <div className="absolute bottom-3 left-3 flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-slate-800" /> Multi-band musician
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-slate-400" /> Single band
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-indigo-500" /> Band
        </span>
      </div>
    </div>
  );
}
