"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Node,
  type Edge,
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

function buildGraph(highlight?: string) {
  const bands = [...new Set(DATA.map((d) => d.band))];
  const bandColor = new Map(bands.map((b, i) => [b, BAND_COLORS[i % BAND_COLORS.length]]));

  const memberBands = new Map<string, string[]>();
  DATA.forEach(({ band, member }) => {
    if (!memberBands.has(member)) memberBands.set(member, []);
    memberBands.get(member)!.push(band);
  });

  const isHighlighted = (label: string) =>
    !highlight || label.toLowerCase().includes(highlight.toLowerCase());

  // Place bands in a circle, members around their band
  const bandNodes: Node[] = bands.map((band, i) => {
    const angle = (2 * Math.PI * i) / bands.length;
    const r = 380;
    const color = bandColor.get(band)!;
    return {
      id: `band::${band}`,
      position: { x: 500 + r * Math.cos(angle), y: 400 + r * Math.sin(angle) },
      data: { label: band },
      style: {
        background: color,
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "8px 14px",
        fontWeight: 700,
        fontSize: 12,
        opacity: isHighlighted(band) ? 1 : 0.2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        minWidth: 120,
        textAlign: "center" as const,
      },
    };
  });

  const memberNodes: Node[] = [...memberBands.entries()].map(([member, mBands], i) => {
    const primaryBand = mBands[0];
    const bNode = bandNodes.find((n) => n.id === `band::${primaryBand}`);
    const angle = (2 * Math.PI * i) / memberBands.size;
    const isMulti = mBands.length > 1;
    const x = (bNode?.position.x ?? 500) + (Math.random() - 0.5) * 120;
    const y = (bNode?.position.y ?? 400) + (Math.random() - 0.5) * 120;
    return {
      id: `member::${member}`,
      position: { x, y },
      data: { label: member },
      style: {
        background: isMulti ? "#1e293b" : "#f1f5f9",
        color: isMulti ? "#fff" : "#334155",
        border: isMulti ? "2px solid #6366f1" : "1.5px solid #cbd5e1",
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: 10,
        opacity: isHighlighted(member) ? 1 : 0.15,
        boxShadow: isMulti ? "0 0 0 3px #6366f133" : "none",
        whiteSpace: "nowrap" as const,
      },
    };
  });

  const edges: Edge[] = DATA.map(({ band, member, role }, i) => {
    const color = bandColor.get(band) ?? "#94a3b8";
    const lit = isHighlighted(member) || isHighlighted(band);
    return {
      id: `e-${i}`,
      source: `member::${member}`,
      target: `band::${band}`,
      label: role,
      style: { stroke: color, strokeWidth: lit ? 2 : 1, opacity: lit ? 0.7 : 0.1 },
      labelStyle: { fontSize: 8, fill: "#64748b" },
      labelBgStyle: { fill: "#fff", fillOpacity: 0.7 },
      animated: false,
    };
  });

  return { nodes: [...bandNodes, ...memberNodes], edges };
}

export default function NetworkGraph({ highlight }: { highlight?: string }) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(highlight),
    [highlight]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
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
