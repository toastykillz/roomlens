# Roomlens — AI Room Designer

Upload a photo of your room, enter dimensions, and get AI-powered 3D visualization + design suggestions.

## Stack
- **Frontend:** React + Vite + React Three Fiber (3D)
- **Backend:** Node.js + Express + Multer
- **AI:** Anthropic Claude (vision + text)

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

npm install
npm run dev
# Runs on http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

The frontend proxies `/api` requests to the backend automatically (configured in vite.config.js).

## API Endpoints

### POST /api/analyze
Analyzes a room photo + dimensions using Claude vision.

**Form data:**
- `photo` (file, optional) — room photo
- `length`, `width`, `height` — dimensions in feet
- `windows` — number of windows
- `roomType` — "Bedroom", "Living room", etc.

**Returns:**
```json
{
  "success": true,
  "analysis": {
    "style": "Scandinavian minimal",
    "palette": { "primary": "#...", "secondary": "#...", ... },
    "roomScore": 72,
    "primaryIssue": "Lack of natural light amplification",
    "suggestions": [...],
    "furniturePlacements": [...],
    "moodboard": { ... }
  }
}
```

### POST /api/furniture-suggestions
Get specific furniture recommendations for a style.

**Body:**
```json
{ "roomType": "Bedroom", "style": "Scandinavian minimal", "budget": "moderate" }
```

## Project Structure
```
roomlens/
├── backend/
│   ├── server.js          # Express server + Claude API calls
│   ├── .env.example       # Copy to .env and add API key
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                    # Root layout
    │   ├── components/
    │   │   ├── Sidebar.jsx            # Upload, dims, suggestions panel
    │   │   └── RoomViewer.jsx         # React Three Fiber 3D room
    │   ├── hooks/
    │   │   └── useRoomAnalysis.js     # API call hook
    │   └── index.css
    ├── index.html
    └── vite.config.js
```

## Extending the app

**Add furniture drag & drop:**
Use `@react-three/drei`'s `useDrag` or `DragControls` to let users reposition furniture pieces.

**Add save/share:**
Store analysis results in a database (Postgres + Prisma works well). Generate shareable links.

**Add AR preview:**
Use `@react-three/xr` for WebXR support to preview furniture in real space.
