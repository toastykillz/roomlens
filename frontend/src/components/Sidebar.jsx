import { useRef, useState } from "react";

const TAG = {
  layout:   { bg: "rgba(79,142,247,0.12)",  color: "#4f8ef7" },
  decor:    { bg: "rgba(62,207,142,0.1)",   color: "#3ecf8e" },
  lighting: { bg: "rgba(245,166,35,0.1)",   color: "#f5a623" },
  storage:  { bg: "rgba(167,139,250,0.1)",  color: "#a78bfa" },
  color:    { bg: "rgba(240,96,96,0.1)",    color: "#f06060" },
};
const PRI = {
  high:   { color: "#f06060" },
  medium: { color: "#f5a623" },
  low:    { color: "#3ecf8e" },
};

function Label({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#55555f", marginBottom: 8 }}>{children}</div>;
}

export default function Sidebar({ onAnalyze, loading, loadingStep, analysis }) {
  const fileRef = useRef();
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dims, setDims] = useState({ length: "14", width: "11", height: "9", windows: "2" });
  const [roomType, setRoomType] = useState("Bedroom");

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: "#16161a",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      height: "100vh", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #4f8ef7, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⬡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.3px", color: "#f0f0f2" }}>roomlens</div>
            <div style={{ fontSize: 10, color: "#55555f", letterSpacing: "0.06em" }}>AI INTERIOR DESIGNER</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 20px" }}>
        {/* Upload */}
        <div
          onClick={() => fileRef.current.click()}
          style={{
            border: `1px dashed ${preview ? "transparent" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12, marginBottom: 16, cursor: "pointer", overflow: "hidden",
            background: preview ? "none" : "#18181d",
            minHeight: preview ? "auto" : 88,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 5, padding: preview ? 0 : "16px",
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          {preview ? (
            <div style={{ position: "relative", width: "100%" }}>
              <img src={preview} alt="Room" style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12, display: "block" }} />
              <div style={{
                position: "absolute", inset: 0, borderRadius: 12,
                background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center",
                justifyContent: "center", opacity: 0, transition: "opacity 0.15s", fontSize: 12, color: "white", fontWeight: 500,
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >change photo</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 22, opacity: 0.4 }}>📷</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#8b8b9a" }}>Upload room photo</div>
              <div style={{ fontSize: 11, color: "#55555f" }}>optional · improves accuracy</div>
            </>
          )}
        </div>

        {/* Dims */}
        <Label>Room dimensions</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          {[["length","Length (ft)"],["width","Width (ft)"],["height","Height (ft)"],["windows","Windows"]].map(([k, label]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: "#55555f", marginBottom: 4 }}>{label}</div>
              <input type="number" value={dims[k]} onChange={e => setDims(d => ({ ...d, [k]: e.target.value }))} />
            </div>
          ))}
        </div>

        <select value={roomType} onChange={e => setRoomType(e.target.value)} style={{ marginBottom: 14, background: "#18181d", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#f0f0f2", padding: "8px 28px 8px 10px", width: "100%", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b8b9a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", appearance: "none" }}>
          {["Bedroom","Living room","Office / study","Dining room","Kids room"].map(t => <option key={t}>{t}</option>)}
        </select>

        <button
          onClick={() => onAnalyze({ photo, ...dims, roomType })}
          disabled={loading}
          style={{
            width: "100%", padding: "10px",
            background: loading ? "#1f1f26" : "linear-gradient(135deg, #4f8ef7 0%, #6c63ff 100%)",
            color: loading ? "#55555f" : "white",
            fontSize: 13, fontWeight: 600, borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 20,
            boxShadow: loading ? "none" : "0 0 24px rgba(79,142,247,0.3)",
          }}
        >
          {loading ? loadingStep || "Analyzing..." : "Analyze room →"}
        </button>

        {/* Results */}
        {analysis && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "#55555f", letterSpacing: "0.06em", marginBottom: 3 }}>STYLE</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{analysis.style}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#55555f", letterSpacing: "0.06em", marginBottom: 3 }}>SCORE</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: analysis.roomScore >= 70 ? "#3ecf8e" : analysis.roomScore >= 50 ? "#f5a623" : "#f06060" }}>
                  {analysis.roomScore}<span style={{ fontSize: 11, fontWeight: 400, color: "#55555f" }}>/100</span>
                </div>
              </div>
            </div>

            <div style={{ height: 2, background: "#1f1f26", borderRadius: 99, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${analysis.roomScore}%`, background: analysis.roomScore >= 70 ? "#3ecf8e" : analysis.roomScore >= 50 ? "#f5a623" : "#f06060", borderRadius: 99 }} />
            </div>

            {analysis.primaryIssue && (
              <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 8, padding: "8px 10px", marginBottom: 14, fontSize: 11, color: "#f5a623" }}>
                ⚠ {analysis.primaryIssue}
              </div>
            )}

            {analysis.palette && (
              <div style={{ marginBottom: 16 }}>
                <Label>Colour palette</Label>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.values(analysis.palette).slice(0, 5).map((hex, i) => (
                    <div key={i} title={hex} style={{ width: 30, height: 30, borderRadius: 6, background: hex, border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} />
                  ))}
                </div>
              </div>
            )}

            <Label>Suggestions</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {(analysis.suggestions || []).map((s, i) => {
                const tag = TAG[s.category] || TAG.decor;
                const pri = PRI[s.priority] || PRI.medium;
                return (
                  <div key={i} style={{ background: "#18181d", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f2" }}>{s.title}</div>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: pri.color, flexShrink: 0, marginTop: 5 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#8b8b9a", lineHeight: 1.55, marginBottom: 6 }}>{s.description}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: tag.bg, color: tag.color, fontWeight: 600 }}>{s.category}</span>
                      {s.estimatedCost && <span style={{ fontSize: 10, color: "#55555f", fontFamily: "monospace" }}>{s.estimatedCost}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {analysis.moodboard?.keywords?.length > 0 && (
              <div>
                <Label>Mood keywords</Label>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {analysis.moodboard.keywords.map(k => (
                    <span key={k} style={{ fontSize: 10, padding: "3px 8px", background: "rgba(167,139,250,0.1)", color: "#a78bfa", borderRadius: 4, fontWeight: 500 }}>{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
