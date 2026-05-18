import GenogramTree from "@/components/GenogramTree";
import { PERIOD_COLORS, SECTIONS } from "@/lib/paniagua-data";

export default function PaniaguaPage() {
  return (
    <div
      style={{
        background: "#faf6ef",
        minHeight: "100%",
        padding: "32px 24px",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#3b2a10", letterSpacing: 1 }}>
          Árbol Genealógico
        </div>
        <div style={{ fontSize: 15, color: "#7a6040", marginTop: 4 }}>
          Banda Paniagua — La Loma
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          marginBottom: 40,
          padding: "12px 16px",
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #e0d4b8",
          boxShadow: "0 2px 8px #0001",
        }}
      >
        {Object.values(PERIOD_COLORS).map((p) => (
          <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <div
              style={{
                width: 20,
                height: 14,
                background: p.bg,
                border: `2px ${p.borderStyle} ${p.border}`,
                borderRadius: 3,
              }}
            />
            <span style={{ color: "#444" }}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Tree */}
      <GenogramTree sections={SECTIONS} />

      {/* Footer */}
      <div
        style={{
          marginTop: 32,
          padding: "14px 20px",
          background: "#fff8e8",
          border: "1px solid #e0c97a",
          borderRadius: 10,
          fontSize: 12,
          color: "#5a4010",
          lineHeight: 1.6,
        }}
      >
        <strong>Nota:</strong> Este genograma fue realizado con base en entrevistas a integrantes de
        la Banda Paniagua y pobladores de La Loma. Solo se incluyen descendientes con participación
        activa en la banda o recordados como músicos destacados. Las fechas entre paréntesis{" "}
        <em>(−XXXX)</em> indican año de muerte; las entre corchetes <em>[XX−XX]</em> indican años
        de actuación en la banda.
      </div>
    </div>
  );
}
