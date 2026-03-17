import { useState, Suspense } from "react";
import Sidebar from "./components/Sidebar.jsx";
import RoomViewer from "./components/RoomViewer.jsx";
import { useRoomAnalysis } from "./hooks/useRoomAnalysis.js";

function Toolbar({ view, setView }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "10px 16px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "#111114",
    }}>
      {[["3d","3D model"],["top","Floor plan"]].map(([id, label]) => (
        <button key={id} onClick={() => setView(id)} style={{
          padding: "5px 12px", fontSize: 12, fontWeight: 500,
          background: view === id ? "rgba(79,142,247,0.15)" : "transparent",
          color: view === id ? "#4f8ef7" : "#55555f",
          border: `1px solid ${view === id ? "rgba(79,142,247,0.3)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 6,
        }}>{label}</button>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11, color: "#55555f" }}>drag to orbit · scroll to zoom</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14 }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🏠</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#8b8b9a", marginBottom: 4 }}>Your room will appear here</div>
        <div style={{ fontSize: 12, color: "#55555f" }}>Enter dimensions and click Analyze room</div>
      </div>
    </div>
  );
}

function LoadingState({ step }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
      <div style={{ position: "relative", width: 48, height: 48 }}>
        <div style={{ width: 48, height: 48, border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#4f8ef7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ position: "absolute", inset: 8, border: "2px solid rgba(255,255,255,0.03)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 1.2s linear infinite reverse" }} />
      </div>
      <div style={{ fontSize: 13, color: "#8b8b9a" }}>{step}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("3d");
  const [dimensions, setDimensions] = useState({ length: 14, width: 11, height: 9 });
  const { analysis, loading, error, loadingStep, analyze } = useRoomAnalysis();

  function handleAnalyze(params) {
    setDimensions({
      length: parseFloat(params.length) || 14,
      width: parseFloat(params.width) || 11,
      height: parseFloat(params.height) || 9,
    });
    analyze(params);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0a0b" }}>
      <Sidebar onAnalyze={handleAnalyze} loading={loading} loadingStep={loadingStep} analysis={analysis} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Toolbar view={view} setView={setView} />
        <div style={{ flex: 1, position: "relative", background: "#0d0d10" }}>
          {loading && <LoadingState step={loadingStep} />}
          {!loading && !analysis && !error && <EmptyState />}
          {error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: 10, padding: "12px 20px", fontSize: 13, color: "#f06060" }}>
                ⚠ {error}
              </div>
            </div>
          )}
          {!loading && analysis && (
            <Suspense fallback={<LoadingState step="Loading 3D viewer..." />}>
              <RoomViewer dimensions={dimensions} analysis={analysis} view={view} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
