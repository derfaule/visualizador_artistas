"use client";

import { useState } from "react";
import {
  PEOPLE,
  PERIOD_COLORS,
  childrenOf,
  spouseOf,
  type Person,
  type Section,
} from "@/lib/paniagua-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fy(year: number): string {
  return year >= 2000 ? String(year) : String(year).slice(-2);
}

function findPerson(id: string): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}

// ── PersonCard ────────────────────────────────────────────────────────────────

function PersonCard({ person }: { person: Person }) {
  const [hovered, setHovered] = useState(false);
  const p = PERIOD_COLORS[person.period];

  const activeStr =
    person.activeFrom != null
      ? `[${fy(person.activeFrom)}−${person.activeTo != null ? fy(person.activeTo) : "hoy"}]`
      : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: p.bg,
        border: `2px ${p.borderStyle} ${p.border}`,
        borderRadius: 6,
        padding: "6px 10px",
        minWidth: 110,
        maxWidth: 155,
        textAlign: "center",
        fontSize: 12,
        fontFamily: "Georgia, serif",
        cursor: "default",
        transition: "box-shadow 0.2s",
        boxShadow: hovered
          ? `0 0 0 3px ${p.border}44, 0 4px 16px #0002`
          : "0 1px 4px #0001",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>{person.name}</div>
      {person.died != null && (
        <div style={{ color: "#666", fontSize: 11 }}>(−{person.died})</div>
      )}
      {person.instruments && person.instruments.length > 0 && (
        <div style={{ color: p.border, fontStyle: "italic", fontSize: 11, marginTop: 2 }}>
          {person.instruments.join(", ")}
          {activeStr && (
            <span style={{ marginLeft: 4, color: "#888", fontStyle: "normal" }}>{activeStr}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── VLine ─────────────────────────────────────────────────────────────────────

function VLine() {
  return <div style={{ width: 1, background: "#bbb", height: 20, margin: "0 auto" }} />;
}

// ── TreeNode (recursive) ──────────────────────────────────────────────────────

function TreeNode({ personId }: { personId: string }) {
  const person = findPerson(personId);
  if (!person) return null;

  const spouse = spouseOf(personId);
  const kids = childrenOf(personId);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Person + optional spouse */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <PersonCard person={person} />
        {spouse && (
          <>
            <span style={{ fontFamily: "serif", fontSize: 16, color: "#888", fontWeight: 700 }}>
              =
            </span>
            <PersonCard person={spouse.person} />
            {spouse.notes && (
              <div style={{ fontSize: 10, color: "#888", fontStyle: "italic", maxWidth: 80 }}>
                ({spouse.notes})
              </div>
            )}
          </>
        )}
      </div>

      {/* Children */}
      {kids.length > 0 && (
        <>
          <VLine />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, position: "relative" }}>
            {kids.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: 1,
                  background: "#bbb",
                  width: "calc(100% - 60px)",
                }}
              />
            )}
            {kids.map((child) => (
              <div key={child.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <VLine />
                <TreeNode personId={child.id} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── GenogramTree (exported) ───────────────────────────────────────────────────

export default function GenogramTree({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: 48 }}>
          {section.title && (
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 14,
                color: "#7a5c1e",
                borderBottom: "1px solid #d4a843",
                paddingBottom: 4,
                marginBottom: 20,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {section.title}
            </div>
          )}
          <div style={{ overflowX: "auto", paddingBottom: 8 }}>
            <div
              style={{
                display: "flex",
                gap: 40,
                justifyContent: "center",
                alignItems: "flex-start",
                minWidth: "max-content",
                padding: "0 24px",
              }}
            >
              {section.rootIds.map((rootId) => (
                <TreeNode key={rootId} personId={rootId} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
