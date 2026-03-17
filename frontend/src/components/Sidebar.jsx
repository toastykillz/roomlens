import { useRef, useState } from "react";

const TAG_STYLES = {
  layout:  { bg: "#E6F1FB", color: "#0c447c" },
  decor:   { bg: "#EAF3DE", color: "#27500A" },
  lighting:{ bg: "#FAEEDA", color: "#633806" },
  storage: { bg: "#EEEDFE", color: "#3C3489" },
  color:   { bg: "#FBEAF0", color: "#72243E" },
};

const PRIORITY_STYLES = {
  high:   { bg: "#FCEBEB", color: "#791F1F" },
  medium: { bg: "#FAEEDA", color: "#633806" },
  low:    { bg: "#EAF3DE", color: "#27500A" },
};

function ColorSwatch({ hex, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: hex, border: "0.5px solid rgba(0,0,0,0.1)" }} />
      <span style={{ fontSize: 10, color: "#9b9890", fontFamily: "var(--mono)" }}>{hex}</span>
    </div>
  );
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

  function handleDim(k, v) {
    setDims(d => ({ ...d, [k]: v }));
  }

  function submit() {
    onAnalyze({ photo, ...dims, roomType });
  }

  return (
    <div style={{
      width: 320, flexShrink: 0, background: "#ffffff",
      borderRight: "0.5px solid rgba(0,0,0,0.08)",
      display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.3px" }}>
          room<span style={{ color: "#185FA5" }}>lens</span>
        </div>
        <div style={{ fontSize: 12, color: "#9b9890", marginTop: 2 }}>AI interior designer</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
        {/* Upload zone */}
        <div
          onClick={() => fileRef.current.click()}
          style={{
            border: preview ? "none" : "1.5px dashed rgba(0,0,0,0.15)",
            borderRadius: 12, marginBottom: 14, cursor: "pointer",
            overflow: "hidden", position: "relative",
            background: preview ? "none" : "#f8f7f4",
            minHeight: preview ? "auto" : 100,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 6, padding: preview ? 0 : "20px 16px",
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          {preview ? (
            <div style={{ position: "relative" }}>
              <img src={preview} alt="Room" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 10, display: "block" }} />
              <div style={{
                position: "absolute", inset: 0, borderRadius: 10,
                background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center",
                justifyContent: "center", opacity: 0, transition: "opacity 0.15s"
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <span style={{ color: "white", fontSize: 12, fontWeight: 500 }}>change photo</span>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 22 }}>📷</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1917" }}>Upload room photo</div>
              <div style={{ fontSize: 11, color: "#9b9890" }}>optional — improves analysis</div>
            </>
          )}
        </div>

        {/* Dimensions */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#9b9890", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>Room dimensions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            {[["length","Length (ft)"],["width","Width (ft)"],["height","Height (ft)"],["windows","Windows"]].map(([k,label]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: "#9b9890", marginBottom: 3 }}>{label}</div>
                <input type="number" value={dims[k]} onChange={e => handleDim(k, e.target.value)} />
              </div>
            ))}
          </div>
          <select value={roomType} onChange={e => setRoomType(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 6, background: "#fff", color: "#1a1917", marginBottom: 10 }}>
            {["Bedroom","Living room","Office / study","Dining room","Kids room"].map(t => <option key={t}>{t}</option>)}
          </select>

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%", padding: "10px 16px",
              background: loading ? "#9b9890" : "#185FA5",
              color: "white", fontSize: 14, fontWeight: 500,
              borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? loadingStep || "Analyzing..." : "Analyze room"}
          </button>
        </div>

        {/* Analysis results */}
        {analysis && (
          <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", paddingTop: 14, paddingBottom: 16 }}>
            {/* Score + style */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#9b9890", textTransform: "uppercase", letterSpacing: "0.5px" }}>Style detected</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1917" }}>{analysis.style}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#9b9890", textTransform: "uppercase", letterSpacing: "0.5px" }}>Room score</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: analysis.roomScore >= 70 ? "#3B6D11" : analysis.roomScore >= 50 ? "#854F0B" : "#A32D2D" }}>
                  {analysis.roomScore}<span style={{ fontSize: 12, fontWeight: 400, color: "#9b9890" }}>/100</span>
                </div>
              </div>
            </div>

            {/* Main issue */}
            {analysis.primaryIssue && (
              <div style={{ background: "#FAEEDA", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#633806" }}>
                ⚠ {analysis.primaryIssue}
              </div>
            )}

            {/* Palette */}
            {analysis.palette && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#9b9890", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Colour palette</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {Object.entries(analysis.palette).slice(0, 5).map(([k, hex]) => (
                    <ColorSwatch key={k} hex={hex} label={k} />
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div style={{ fontSize: 11, color: "#9b9890", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Suggestions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(analysis.suggestions || []).map((s, i) => {
                const tag = TAG_STYLES[s.category] || TAG_STYLES.decor;
                const pri = PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.medium;
                return (
                  <div key={i} style={{ background: "#f8f7f4", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1917" }}>{s.title}</div>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: pri.bg, color: pri.color, whiteSpace: "nowrap", flexShrink: 0 }}>{s.priority}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b6860", lineHeight: 1.5, marginBottom: 6 }}>{s.description}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: tag.bg, color: tag.color, fontWeight: 500 }}>{s.category}</span>
                      {s.estimatedCost && <span style={{ fontSize: 10, color: "#9b9890" }}>{s.estimatedCost}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Moodboard notes */}
            {analysis.moodboard && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: "#9b9890", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Moodboard notes</div>
                {[["Textures", analysis.moodboard.textureNotes], ["Lighting", analysis.moodboard.lightingNotes], ["Avoid", analysis.moodboard.avoidNotes]].map(([label, note]) => note && (
                  <div key={label} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#6b6860" }}>{label}: </span>
                    <span style={{ fontSize: 12, color: "#6b6860" }}>{note}</span>
                  </div>
                ))}
                {analysis.moodboard.keywords?.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                    {analysis.moodboard.keywords.map(k => (
                      <span key={k} style={{ fontSize: 11, padding: "3px 8px", background: "#EEEDFE", color: "#3C3489", borderRadius: 6 }}>{k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
