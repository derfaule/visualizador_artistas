"use client";

import { useEffect, useRef } from "react";
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

interface NodeDatum {
  id: string;
  type: "band" | "member";
  name: string;
  bands: string[];
  x: number;
  y: number;
}

interface LinkDatum {
  source: NodeDatum;
  target: NodeDatum;
  bandId: string;
}

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
    ...bands.map((b, i) => {
      const angle = (i / bands.length) * Math.PI * 2;
      const radius = 300;
      return {
        id: `band::${b}`,
        type: "band" as const,
        name: b,
        bands: [b],
        x: Math.cos(angle) * radius + 500,
        y: Math.sin(angle) * radius + 500,
      };
    }),
    ...[...memberBandsMap.entries()].map(([m, mBands], i) => {
      const angle = (i / memberBandsMap.size) * Math.PI * 2;
      const radius = 150;
      return {
        id: `member::${m}`,
        type: "member" as const,
        name: m,
        bands: [...mBands],
        x: Math.cos(angle) * radius + 500,
        y: Math.sin(angle) * radius + 500,
      };
    }),
  ];

  const links: LinkDatum[] = [];
  memberBandsMap.forEach((mBands, member) => {
    const memberNode = nodes.find((n) => n.name === member);
    mBands.forEach((band) => {
      const bandNode = nodes.find((n) => n.name === band);
      if (memberNode && bandNode) {
        links.push({ source: memberNode, target: bandNode, bandId: band });
      }
    });
  });

  return { nodes, links, bandColor };
}

export default function NetworkGraph({ highlight, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const selectedRef = useRef(selected);
  const highlightRef = useRef(highlight);
  const onSelectRef = useRef(onSelect);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { highlightRef.current = highlight; }, [highlight]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Render static graph
  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const { nodes, links, bandColor } = buildGraphData();
    const { width, height } = container.getBoundingClientRect();

    // Clear previous content
    while (svg.lastChild) svg.removeChild(svg.lastChild);

    // Pan/zoom with vanilla JS
    let scale = 1, translateX = 0, translateY = 0;
    let isMouseDown = false, startX = 0, startY = 0;

    const root = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(root);

    // Render edges
    links.forEach((link) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(link.source.x));
      line.setAttribute("y1", String(link.source.y));
      line.setAttribute("x2", String(link.target.x));
      line.setAttribute("y2", String(link.target.y));
      line.setAttribute("stroke", bandColor.get(link.bandId) ?? "#94a3b8");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("opacity", "0.25");
      root.appendChild(line);
    });

    // Render member nodes
    nodes.filter((n) => n.type === "member").forEach((node) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      circle.setAttribute("r", String(node.bands.length > 1 ? 7 : 5));
      circle.setAttribute("fill", node.bands.length > 1 ? "#1e293b" : (bandColor.get(node.bands[0]) ?? "#e2e8f0"));
      circle.setAttribute("fill-opacity", String(node.bands.length > 1 ? 1 : 0.35));
      circle.setAttribute("stroke", node.bands.length > 1 ? "#6366f1" : (bandColor.get(node.bands[0]) ?? "#94a3b8"));
      circle.setAttribute("stroke-width", "1.5");
      circle.setAttribute("cursor", "pointer");
      circle.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const cur = selectedRef.current;
        onSelectRef.current?.(
          cur?.type === "member" && cur.id === node.name ? null : { type: "member", id: node.name }
        );
      });
      root.appendChild(circle);
    });

    // Render band nodes
    nodes.filter((n) => n.type === "band").forEach((node) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("cursor", "pointer");
      g.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const cur = selectedRef.current;
        onSelectRef.current?.(
          cur?.type === "band" && cur.id === node.name ? null : { type: "band", id: node.name }
        );
      });

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      circle.setAttribute("r", "24");
      circle.setAttribute("fill", bandColor.get(node.name) ?? "#6366f1");
      g.appendChild(circle);

      const lines = wrapLabel(node.name);
      lines.forEach((line, i) => {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(node.x));
        text.setAttribute("y", String(node.y + 30 + i * 13));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "9");
        text.setAttribute("font-weight", "600");
        text.setAttribute("fill", "#334155");
        text.setAttribute("pointer-events", "none");
        text.textContent = line;
        g.appendChild(text);
      });

      root.appendChild(g);
    });

    // Pan/zoom handlers
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      scale *= factor;
      scale = Math.max(0.04, Math.min(4, scale));
      root.setAttribute("transform", `translate(${translateX},${translateY}) scale(${scale})`);
    });

    svg.addEventListener("mousedown", (e) => {
      isMouseDown = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      svg.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      root.setAttribute("transform", `translate(${translateX},${translateY}) scale(${scale})`);
    });

    document.addEventListener("mouseup", () => {
      isMouseDown = false;
      svg.style.cursor = "grab";
    });

    svg.addEventListener("click", () => onSelectRef.current?.(null));

    // Apply styling on selection/highlight change
    const updateStyles = () => {
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

      root.querySelectorAll("circle").forEach((el) => {
        const nodeData = nodes.find((n) => n.x === Number(el.getAttribute("cx")) && n.y === Number(el.getAttribute("cy")));
        if (!nodeData) return;
        el.setAttribute("opacity", String(isLit(nodeData.type, nodeData.name) ? 1 : 0.08));
      });

      root.querySelectorAll("line").forEach((el) => {
        const opacity = !sel && !hl ? 0.25 : 0.04;
        el.setAttribute("opacity", String(opacity));
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      root.setAttribute("transform", `translate(${translateX},${translateY}) scale(${scale})`);
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      svg.style.cursor = "grab";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      updateStyles();
    };
  }, []);

  // Update styles when selection/highlight changes
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const root = svg.querySelector("g");
    if (!root) return;

    const { nodes } = buildGraphData();
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

    root.querySelectorAll("circle").forEach((el) => {
      const nodeData = nodes.find((n) => n.x === Number(el.getAttribute("cx")) && n.y === Number(el.getAttribute("cy")));
      if (!nodeData) return;
      el.setAttribute("opacity", String(isLit(nodeData.type, nodeData.name) ? 1 : 0.08));
    });

    root.querySelectorAll("line").forEach((el) => {
      const opacity = !sel && !hl ? 0.25 : 0.04;
      el.setAttribute("opacity", String(opacity));
    });
  }, [selected, highlight]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: "grab", background: "#fafaf9" }}
      />
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
