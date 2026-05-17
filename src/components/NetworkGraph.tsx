"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type NodeMouseHandler,
  addEdge,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DATA } from "@/lib/data";

const BAND_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#3b82f6", "#84cc16",
  "#06b6d4", "#a855f7", "#e11d48", "#0ea5e9",
];

export type SelectedNode =
  | { type: "band"; id: string }
  | { type: "member"; id: string };

interface Props {
  highlight?: string;
  selected?: SelectedNode | null;
  onSelect?: (node: SelectedNode | null) => void;
}

function buildGraph(highlight?: string, selected?: SelectedNode | null) {
  const bands = [...new Set(DATA.map((d) => d.band))];
  const bandColor = new Map(bands.map((b, i) => [b, BAND_COLORS[i % BAND_COLORS.length]]));

  const memberBands = new Map<string, string[]>();
  DATA.forEach(({ band, member }) => {
    if (!memberBands.has(member)) memberBands.set(member, []);
    memberBands.get(member)!.push(band);
  });

  // Determine which nodes are "active" (connected to selection)
  const activeBands = new Set<string>();
  const activeMembers = new Set<string>();

  if (selected?.type === "band") {
    activeBands.add(selected.id);
    DATA.filter((d) => d.band === selected.id).forEach((d) => activeMembers.add(d.member));
  } else if (selected?.type === "member") {
    activeMembers.add(selected.id);
    DATA.filter((d) => d.member === selected.id).forEach((d) => activeBands.add(d.band));
  }

  const hasSelection = !!selected;

  const isLit = (type: "band" | "member", id: string) => {
    if (!hasSelection && !highlight) return true;
    if (highlight) return id.toLowerCase().includes(highlight.toLowerCase());
    return type === "band" ? activeBands.has(id) : activeMembers.has(id);
  };

  const bandNodes = bands.map((band, i) => {
    const angle = (2 * Math.PI * i) / bands.length;
    const r = 380;
    const color = bandColor.get(band)!;
    const lit = isLit("band", band);
    const isSel = selected?.type === "band" && selected.id === band;
    return {
      id: `band::${band}`,
      position: { x: 500 + r * Math.cos(angle), y: 400 + r * Math.sin(angle) },
      data: { label: band },
      style: {
        background: lit ? color : "#e2e8f0",
        color: lit ? "#fff" : "#94a3b8",
        border: isSel ? `3px solid #fff` : "none",
        borderRadius: 10,
        padding: "8px 14px",
        fontWeight: 700,
        fontSize: 12,
        opacity: lit ? 1 : 0.25,
        boxShadow: isSel
          ? `0 0 0 4px ${color}, 0 4px 16px rgba(0,0,0,0.2)`
          : "0 2px 8px rgba(0,0,0,0.1)",
        minWidth: 120,
        textAlign: "center" as const,
        cursor: "pointer",
        transition: "all 0.15s",
      },
    };
  });

  const memberNodes = [...memberBands.entries()].map(([member, mBands]) => {
    const primaryBand = mBands[0];
    const bNode = bandNodes.find((n) => n.id === `band::${primaryBand}`);
    const isMulti = mBands.length > 1;
    const lit = isLit("member", member);
    const isSel = selected?.type === "member" && selected.id === member;
    const x = (bNode?.position.x ?? 500) + (Math.random() * 100 - 50);
    const y = (bNode?.position.y ?? 400) + (Math.random() * 100 - 50);
    return {
      id: `member::${member}`,
      position: { x, y },
      data: { label: member },
      style: {
        background: lit ? (isMulti ? "#1e293b" : "#f8fafc") : "#f1f5f9",
        color: lit ? (isMulti ? "#fff" : "#334155") : "#94a3b8",
        border: isSel
          ? "2px solid #6366f1"
          : isMulti
          ? "2px solid #6366f1"
          : "1.5px solid #cbd5e1",
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: 10,
        opacity: lit ? 1 : 0.2,
        boxShadow: isSel ? "0 0 0 3px #6366f166" : isMulti ? "0 0 0 2px #6366f122" : "none",
        whiteSpace: "nowrap" as const,
        cursor: "pointer",
        transition: "all 0.15s",
      },
    };
  });

  const edges = DATA.map(({ band, member, role }, i) => {
    const color = bandColor.get(band) ?? "#94a3b8";
    const lit =
      !hasSelection && !highlight
        ? true
        : highlight
        ? member.toLowerCase().includes(highlight.toLowerCase()) ||
          band.toLowerCase().includes(highlight.toLowerCase())
        : activeBands.has(band) && activeMembers.has(member);

    return {
      id: `e-${i}`,
      source: `member::${member}`,
      target: `band::${band}`,
      label: role,
      style: { stroke: lit ? color : "#e2e8f0", strokeWidth: lit ? 2 : 1, opacity: lit ? 0.8 : 0.2 },
      labelStyle: { fontSize: 8, fill: "#64748b" },
      labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
      labelShowBg: lit,
      animated: false,
    };
  });

  return { nodes: [...bandNodes, ...memberNodes], edges };
}

export default function NetworkGraph({ highlight, selected, onSelect }: Props) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(highlight, selected),
    [highlight, selected]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const [type, ...rest] = node.id.split("::");
      const id = rest.join("::");
      if (type === "band" || type === "member") {
        const next: SelectedNode = { type, id };
        const isSame = selected?.type === type && selected?.id === id;
        onSelect?.(isSame ? null : next);
      }
    },
    [selected, onSelect]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      onPaneClick={() => onSelect?.(null)}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.1}
      maxZoom={3}
      attributionPosition="bottom-right"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
      <Controls />
      <MiniMap
        nodeColor={(n) => {
          const s = n.style as React.CSSProperties | undefined;
          return typeof s?.background === "string" ? s.background : "#94a3b8";
        }}
        maskColor="rgba(255,255,255,0.7)"
      />
      <Panel position="bottom-left">
        <div className="flex gap-4 text-xs text-slate-500 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Band
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block border-2 border-indigo-400" /> Multi-band
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-100 inline-block border border-slate-300" /> Single band
          </span>
        </div>
      </Panel>
    </ReactFlow>
  );
}
