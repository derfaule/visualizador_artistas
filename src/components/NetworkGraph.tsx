"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });
import { DATA, normalizeBandName, isColombianBand } from "@/lib/data";

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

interface GraphNode {
  id: string;
  type: "band" | "member";
  name: string;
  bands: string[];
  color: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  bandId: string;
  color: string;
}

function buildGraphData() {
  const colombianData = DATA.filter(isColombianBand);
  const bands = [...new Set(colombianData.map((d) => normalizeBandName(d.band).name))];
  const bandColor = new Map(
    bands.map((b, i) => [b, BAND_COLOR_LIST[i % BAND_COLOR_LIST.length]])
  );

  const memberBandsMap = new Map<string, Set<string>>();
  colombianData.forEach(({ band, member }) => {
    const { name } = normalizeBandName(band);
    if (!memberBandsMap.has(member)) memberBandsMap.set(member, new Set());
    memberBandsMap.get(member)!.add(name);
  });

  const nodes: GraphNode[] = [
    ...bands.map((b) => ({
      id: `band::${b}`,
      type: "band" as const,
      name: b,
      bands: [b],
      color: bandColor.get(b) ?? "#6366f1",
    })),
    ...[...memberBandsMap.entries()].map(([m, mBands]) => ({
      id: `member::${m}`,
      type: "member" as const,
      name: m,
      bands: [...mBands],
      color: mBands.size > 1
        ? "#1e293b"
        : (bandColor.get([...mBands][0]) ?? "#94a3b8"),
    })),
  ];

  const links: GraphLink[] = [];
  memberBandsMap.forEach((mBands, member) => {
    mBands.forEach((band) => {
      links.push({
        source: `member::${member}`,
        target: `band::${band}`,
        bandId: band,
        color: bandColor.get(band) ?? "#94a3b8",
      });
    });
  });

  return { nodes, links, bandColor };
}

export default function NetworkGraph({ highlight, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  const selectedRef = useRef(selected);
  const highlightRef = useRef(highlight);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { highlightRef.current = highlight; }, [highlight]);

  const { nodes, links, bandColor } = useMemo(() => buildGraphData(), []);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      setDims({ width: e.contentRect.width, height: e.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Zoom to fit once warm
  useEffect(() => {
    if (dims.width > 0) {
      setTimeout(() => fgRef.current?.zoomToFit(600, 40), 800);
    }
  }, [dims.width]);

  // Re-render canvas on selection/highlight change
  useEffect(() => { fgRef.current?.refresh?.(); }, [selected, highlight]);

  const getOpacity = useCallback((type: "band" | "member", name: string): number => {
    const sel = selectedRef.current;
    const hl = highlightRef.current?.toLowerCase();
    if (!sel && !hl) return 1;
    if (hl) return name.toLowerCase().includes(hl) ? 1 : 0.08;
    if (sel?.type === "band") {
      const activeBands = new Set([sel.id]);
      const activeMembers = new Set(
        DATA.filter((d) => normalizeBandName(d.band).name === sel.id).map((d) => d.member)
      );
      return type === "band" ? (activeBands.has(name) ? 1 : 0.1) : (activeMembers.has(name) ? 1 : 0.06);
    }
    if (sel?.type === "member") {
      const activeBands = new Set(
        DATA.filter((d) => d.member === sel.id).map((d) => normalizeBandName(d.band).name)
      );
      return type === "band" ? (activeBands.has(name) ? 1 : 0.1) : (name === sel.id ? 1 : 0.06);
    }
    return 1;
  }, []);

  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isBand = node.type === "band";
    const r = isBand ? 14 : node.bands.length > 1 ? 6 : 4;
    const opacity = getOpacity(node.type, node.name);
    const sel = selectedRef.current;
    const isSelected = sel?.type === node.type && sel.id === node.name;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (isBand) {
      // Selection ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      // Fill
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Label
      const fontSize = Math.max(9 / globalScale, 2.5);
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#334155";

      const words = node.name.split(/\s+/);
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const next = cur ? `${cur} ${w}` : w;
        if (next.length <= 14) { cur = next; }
        else { if (cur) lines.push(cur); cur = w; if (lines.length >= 1) { lines.push(cur.slice(0, 14)); cur = ""; break; } }
      }
      if (cur && lines.length < 2) lines.push(cur);

      lines.forEach((line, i) => {
        ctx.fillText(line, node.x!, node.y! + r + 2 + i * (fontSize + 1));
      });
    } else {
      // Member node
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.bands.length > 1 ? "#1e293b" : node.color;
      ctx.globalAlpha = opacity * (node.bands.length > 1 ? 1 : 0.5);
      ctx.fill();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = node.bands.length > 1 ? "#6366f1" : node.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }, [getOpacity]);

  const paintPointerArea = useCallback((node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
    const r = node.type === "band" ? 16 : 8;
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const getLinkOpacity = useCallback((link: GraphLink): number => {
    const sel = selectedRef.current;
    const hl = highlightRef.current?.toLowerCase();
    const src = link.source as GraphNode;
    const tgt = link.target as GraphNode;
    if (!sel && !hl) return 0.2;
    if (hl) return (src.name?.toLowerCase().includes(hl) || tgt.name?.toLowerCase().includes(hl)) ? 0.6 : 0.03;
    if (sel?.type === "band") {
      return tgt.name === sel.id ? 0.7 : 0.03;
    }
    if (sel?.type === "member") {
      return src.name === sel.id ? 0.7 : 0.03;
    }
    return 0.2;
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    const id = node.name;
    const type = node.type;
    const cur = selectedRef.current;
    onSelect?.(cur?.type === type && cur.id === id ? null : { type, id });
  }, [onSelect]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-50">
      {dims.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes: nodes as any, links: links as any }}
          width={dims.width}
          height={dims.height}
          backgroundColor="#f8fafc"
          nodeCanvasObject={paintNode as any}
          nodeCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={paintPointerArea as any}
          nodeLabel={(n: any) => n.name}
          linkColor={(l: any) => l.color}
          linkWidth={1}
          linkDirectionalParticles={0}
          warmupTicks={60}
          cooldownTicks={120}
          onNodeClick={handleNodeClick as any}
          onBackgroundClick={() => onSelect?.(null)}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-slate-500 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-sm pointer-events-none">
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
