import { useState, Suspense } from "react";
import Sidebar from "./components/Sidebar.jsx";
import RoomViewer from "./components/RoomViewer.jsx";
import { useRoomAnalysis } from "./hooks/useRoomAnalysis.js";

function Toolbar({ view, setView }) {
  const buttons = [
    { id: "3d", label: "3D model" },
    { id: "top", label: "Floor plan" },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "10px 16px",
      borderBottom: "0.5px solid rgba(0,0,0,0.08)",
      background: "#ffffff"
    }}>
      {buttons.map(b => (
        <button key={b.id} onClick={() => setView(b.id)} style={{
          padding: "4px 12px", fontSize: 13,
          background: view === b.id ? "#185FA5" : "transparent",
          color: view === b.id ? "white" : "#6b6860",
          border: `0.5px solid ${view === b.id ? "#185FA5" : "rgba(0,0,0,0.12)"}`,
          borderRadius: 6,
        }}>{b.label}</button>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 12, color: "#9b9890" }}>drag to orbit · scroll to zoom</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#9b9890" }}>
      <div style={{ fontSize: 48 }}>🏠</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "#6b6860" }}>Your room will appear here</div>
      <div style={{ fontSize: 13 }}>Enter dimensions and click Analyze room</div>
    </div>
  );
}

function LoadingState({ step }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
      <div style={{
        width: 40, height: 40, border: "2.5px solid rgba(0,0,0,0.08)",
        borderTopColor: "#185FA5", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <div style={{ fontSize: 13, color: "#6b6860" }}>{step}</div>
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        onAnalyze={handleAnalyze}
        loading={loading}
        loadingStep={loadingStep}
        analysis={analysis}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f4f2ee", overflow: "hidden" }}>
        <Toolbar view={view} setView={setView} />

        <div style={{ flex: 1, position: "relative" }}>
          {loading && <LoadingState step={loadingStep} />}
          {!loading && !analysis && !error && <EmptyState />}
          {error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ background: "#FCEBEB", borderRadius: 10, padding: "12px 20px", fontSize: 13, color: "#791F1F" }}>
                Error: {error}
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
