import { useRef, useState, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

const SCALE = 0.45;

// Invisible floor plane used only for raycasting drag position
function DragPlane({ planeRef }) {
  return (
    <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function Floor({ length, width }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.001, 0]}>
      <planeGeometry args={[length * SCALE, width * SCALE]} />
      <meshLambertMaterial color="#d4c9b0" />
    </mesh>
  );
}

function Walls({ length, width, height }) {
  const l = length * SCALE, w = width * SCALE, h = height * SCALE;
  return (
    <group>
      <mesh position={[0, h / 2, -w / 2]} receiveShadow>
        <planeGeometry args={[l, h]} />
        <meshLambertMaterial color="#f0ece4" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-l / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshLambertMaterial color="#ebe7df" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[l / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshLambertMaterial color="#e8e4dc" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Window({ length, height, width }) {
  const l = length * SCALE, h = height * SCALE, w = width * SCALE;
  return (
    <group>
      <mesh position={[l * 0.1, h * 0.65, -w / 2 + 0.01]}>
        <planeGeometry args={[l * 0.28, h * 0.38]} />
        <meshLambertMaterial color="#a8c8e8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function FurniturePiece({ piece, roomLength, roomWidth, selected, palette, onSelect, onDragStart, onDrag, onDragEnd, isDragging }) {
  const mesh = useRef();
  const { camera, gl } = useThree();
  const [hovered, setHovered] = useState(false);

  const l = roomLength * SCALE;
  const w = roomWidth * SCALE;
  const pw = (piece.width || 0.3) * l;
  const pd = (piece.depth || 0.25) * w;
  const ph = piece.name === "Bed" ? 0.4 : ["Desk", "Dresser", "Wardrobe"].includes(piece.name) ? 0.6 : 0.35;

  const color = piece.color || palette?.secondary || "#8b7355";
  const activeColor = selected
    ? "#185FA5"
    : isDragging
    ? "#378ADD"
    : hovered
    ? "#aaa99a"
    : color;

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
    onDragStart(piece.name, e);
    gl.domElement.style.cursor = "grabbing";
  }, [piece.name, onDragStart, gl]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!isDragging) onSelect(piece.name);
  }, [isDragging, piece.name, onSelect]);

  return (
    <group position={[piece.x3d ?? 0, 0, piece.z3d ?? 0]}>
      {/* Selection ring */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[Math.max(pw, pd) * 0.6, Math.max(pw, pd) * 0.7, 32]} />
          <meshBasicMaterial color="#185FA5" transparent opacity={0.5} />
        </mesh>
      )}
      <mesh
        ref={mesh}
        position={[0, ph / 2, 0]}
        rotation={[0, (piece.rotation || 0) * Math.PI / 180, 0]}
        castShadow
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); gl.domElement.style.cursor = "grab"; }}
        onPointerOut={() => { setHovered(false); gl.domElement.style.cursor = "default"; }}
      >
        <boxGeometry args={[pw, ph, pd]} />
        <meshLambertMaterial color={activeColor} />
      </mesh>
      {/* Label */}
      {(selected || hovered) && (
        <mesh position={[0, ph + 0.15, 0]}>
          <planeGeometry args={[0.6, 0.18]} />
          <meshBasicMaterial color="white" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function SceneContent({ dimensions, analysis, view, furniture, setFurniture, selected, setSelected }) {
  const { camera, gl, raycaster } = useThree();
  const planeRef = useRef();
  const orbitRef = useRef();
  const dragging = useRef(null); // { name, offset }
  const didDrag = useRef(false);
  const palette = analysis?.palette;
  const { length = 14, width = 11, height = 9 } = dimensions;
  const halfL = (length * SCALE) / 2;
  const halfW = (width * SCALE) / 2;

  const getRoomPos = useCallback((e) => {
    if (!planeRef.current) return null;
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(planeRef.current);
    return hits.length > 0 ? hits[0].point : null;
  }, [camera, gl, raycaster]);

  const handleDragStart = useCallback((name, e) => {
    if (orbitRef.current) orbitRef.current.enabled = false;
    didDrag.current = false;
    const pos = getRoomPos(e.nativeEvent);
    const piece = furniture.find(p => p.name === name);
    const offset = pos && piece ? { x: pos.x - piece.x3d, z: pos.z - piece.z3d } : { x: 0, z: 0 };
    dragging.current = { name, offset };

    const onMove = (ev) => {
      didDrag.current = true;
      const p = getRoomPos(ev);
      if (!p) return;
      setFurniture(prev => prev.map(piece => {
        if (piece.name !== dragging.current.name) return piece;
        const nx = Math.max(-halfL, Math.min(halfL, p.x - dragging.current.offset.x));
        const nz = Math.max(-halfW, Math.min(halfW, p.z - dragging.current.offset.z));
        return { ...piece, x3d: nx, z3d: nz };
      }));
    };

    const onUp = () => {
      dragging.current = null;
      if (orbitRef.current) orbitRef.current.enabled = true;
      gl.domElement.style.cursor = "default";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [furniture, getRoomPos, gl, halfL, halfW, setFurniture]);

  const handleSelect = useCallback((name) => {
    if (!didDrag.current) setSelected(s => s === name ? null : name);
  }, [setSelected]);

  const cameraPos = view === "top"
    ? [0, (height * SCALE) * 2.5, 0.001]
    : [length * SCALE * 1.1, height * SCALE * 0.9, width * SCALE * 1.4];

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPos} fov={50} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 12, 8]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} />
      <DragPlane planeRef={planeRef} />
      <Floor length={length} width={width} />
      <Walls length={length} width={width} height={height} />
      <Window length={length} height={height} width={width} />
      <gridHelper args={[length * SCALE, 10, "#cccccc", "#e0ddd8"]} position={[0, 0.02, 0]} />
      {furniture.map((piece) => (
        <FurniturePiece
          key={piece.name}
          piece={piece}
          roomLength={length}
          roomWidth={width}
          selected={selected === piece.name}
          palette={palette}
          onSelect={handleSelect}
          onDragStart={handleDragStart}
          isDragging={dragging.current?.name === piece.name}
        />
      ))}
      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        minDistance={3}
        maxDistance={20}
        maxPolarAngle={view === "top" ? 0.01 : Math.PI / 2.1}
      />
    </>
  );
}

export default function RoomViewer({ dimensions, analysis, view }) {
  const { length = 14, width = 11, height = 9 } = dimensions;
  const [selected, setSelected] = useState(null);

  // Initialize furniture with 3D world positions from AI fractions
  const [furniture, setFurniture] = useState([]);

  // Sync furniture when analysis changes
  useState(() => {
    if (!analysis?.furniturePlacements) return;
    const l = length * SCALE;
    const w = width * SCALE;
    setFurniture(
      analysis.furniturePlacements.map(p => ({
        ...p,
        x3d: (p.x - 0.5) * l,
        z3d: (p.z - 0.5) * w,
      }))
    );
  }, [analysis]);

  // Also update when analysis prop changes (initial load)
  const prevAnalysis = useRef(null);
  if (analysis !== prevAnalysis.current) {
    prevAnalysis.current = analysis;
    if (analysis?.furniturePlacements) {
      const l = length * SCALE;
      const w = width * SCALE;
      const next = analysis.furniturePlacements.map(p => ({
        ...p,
        x3d: (p.x - 0.5) * l,
        z3d: (p.z - 0.5) * w,
      }));
      // Only update if different to avoid infinite loop
      if (JSON.stringify(next.map(p => p.name)) !== JSON.stringify(furniture.map(p => p.name))) {
        // Can't call setState during render — use a timeout
        setTimeout(() => setFurniture(next), 0);
      }
    }
  }

  const selectedPiece = furniture.find(p => p.name === selected);

  const rotate = (name, deg) => {
    setFurniture(prev => prev.map(p => p.name === name ? { ...p, rotation: ((p.rotation || 0) + deg) % 360 } : p));
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas shadows style={{ background: "transparent" }}>
        <SceneContent
          dimensions={dimensions}
          analysis={analysis}
          view={view}
          furniture={furniture}
          setFurniture={setFurniture}
          selected={selected}
          setSelected={setSelected}
        />
      </Canvas>

      {/* Drag hint */}
      {furniture.length > 0 && !selected && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)",
          border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 8,
          padding: "5px 12px", fontSize: 12, color: "#6b6860", pointerEvents: "none"
        }}>
          drag furniture to rearrange · click to select
        </div>
      )}

      {/* Selected piece controls */}
      {selectedPiece && (
        <div style={{
          position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)",
          border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12,
          padding: "10px 16px", fontSize: 13, color: "#1a1917",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: 12
        }}>
          <span style={{ fontWeight: 500 }}>{selectedPiece.name}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => rotate(selected, -90)} style={{
              padding: "4px 10px", fontSize: 12, background: "#f4f2ee",
              border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 6, color: "#1a1917"
            }}>↺ rotate</button>
            <button onClick={() => rotate(selected, 90)} style={{
              padding: "4px 10px", fontSize: 12, background: "#f4f2ee",
              border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 6, color: "#1a1917"
            }}>↻ rotate</button>
          </div>
          <button onClick={() => setSelected(null)} style={{
            padding: "4px 10px", fontSize: 12, background: "none",
            border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 6, color: "#6b6860"
          }}>done</button>
        </div>
      )}
    </div>
  );
}
