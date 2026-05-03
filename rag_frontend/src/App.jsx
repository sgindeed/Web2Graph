import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";

const NODE_COLORS = {
  person:       { hex: "#ff4466", label: "Person",       glow: "rgba(255,68,102,0.6)"   },
  concept:      { hex: "#00eeff", label: "Concept",      glow: "rgba(0,238,255,0.6)"    },
  location:     { hex: "#bb44ff", label: "Location",     glow: "rgba(187,68,255,0.6)"   },
  organization: { hex: "#ffcc00", label: "Organization", glow: "rgba(255,204,0,0.6)"    },
  event:        { hex: "#ff8800", label: "Event",        glow: "rgba(255,136,0,0.6)"    },
  other:        { hex: "#778899", label: "Other",        glow: "rgba(119,136,153,0.6)"  },
};

const API_BASE_URL = "http://localhost:8000";
const WS_BASE_URL = "ws://localhost:8000";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cyan:    #00eeff;
    --cyan2:   #00c4d4;
    --bg0:     #04080f;
    --bg1:     #080d18;
    --bg2:     #0c1220;
    --bg3:     #111828;
    --bg4:     #161f30;
    --border:  rgba(0,238,255,0.12);
    --border2: rgba(0,238,255,0.25);
    --text1:   #e8f4ff;
    --text2:   #8aadcc;
    --text3:   #4a6a88;
    --font:    'JetBrains Mono', monospace;
  }

  html, body, #root { width:100%; height:100%; overflow:hidden; background:var(--bg0); font-family:var(--font); }

  .nis-root {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--bg0);
    color: var(--text1);
    font-family: var(--font);
    font-size: 13px;
  }

  .nis-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    pointer-events: none;
    z-index: 9999;
  }

  .panel-left {
    width: 380px;
    min-width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--bg1);
    position: relative;
    z-index: 10;
  }

  .panel-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .glass {
    background: rgba(8,13,24,0.7);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .nis-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .nis-logo {
    width: 32px; height: 32px;
    border: 1px solid var(--cyan);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    position: relative;
    box-shadow: 0 0 12px rgba(0,238,255,0.3);
  }

  .nis-logo svg { width: 18px; height: 18px; }

  .nis-title { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; color: var(--cyan); text-transform: uppercase; line-height: 1.2; }
  .nis-sub   { font-size: 10px; color: var(--text3); letter-spacing: 0.08em; }

  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 8px var(--cyan);
    animation: pulse-dot 2s ease-in-out infinite;
    margin-left: auto;
    flex-shrink: 0;
  }

  @keyframes pulse-dot {
    0%,100% { opacity:1; transform: scale(1); }
    50%      { opacity:0.4; transform: scale(0.8); }
  }

  .url-section {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .url-label { font-size: 9px; letter-spacing: 0.12em; color: var(--text3); text-transform: uppercase; margin-bottom: 6px; }

  .url-row { display: flex; gap: 6px; }

  .url-input {
    flex: 1;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 7px 10px;
    font-family: var(--font);
    font-size: 11px;
    color: var(--text1);
    outline: none;
    transition: border-color 0.2s;
  }
  .url-input:focus { border-color: var(--cyan2); }
  .url-input::placeholder { color: var(--text3); }

  .btn {
    padding: 7px 14px;
    background: transparent;
    border: 1px solid var(--border2);
    border-radius: 5px;
    font-family: var(--font);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--cyan);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    text-transform: uppercase;
  }
  .btn:hover { background: rgba(0,238,255,0.08); border-color: var(--cyan); box-shadow: 0 0 12px rgba(0,238,255,0.15); }
  .btn:active { transform: scale(0.97); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-primary {
    background: rgba(0,238,255,0.1);
    border-color: var(--cyan);
    box-shadow: 0 0 16px rgba(0,238,255,0.2);
  }
  .btn-primary:hover { background: rgba(0,238,255,0.2); box-shadow: 0 0 24px rgba(0,238,255,0.3); }

  .btn-sm { padding: 4px 10px; font-size: 9px; }

  .ws-status {
    display: flex; align-items: center; gap: 6px;
    margin-top: 6px;
    font-size: 9px; color: var(--text3);
  }
  .ws-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .ws-dot.connecting { background: #ffcc00; animation: pulse-dot 1s ease-in-out infinite; }
  .ws-dot.connected  { background: #00ff88; box-shadow: 0 0 6px #00ff88; }
  .ws-dot.idle       { background: var(--text3); }

  .progress-bar-wrap { height: 2px; background: var(--bg3); border-radius: 1px; margin-top: 6px; overflow: hidden; }
  .progress-bar-fill {
    height: 100%; border-radius: 1px;
    background: linear-gradient(90deg, var(--cyan2), var(--cyan));
    box-shadow: 0 0 8px var(--cyan);
    transition: width 0.3s ease;
  }

  .chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .chat-area::-webkit-scrollbar { width: 4px; }
  .chat-area::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .msg-wrap { display: flex; flex-direction: column; gap: 4px; }

  .msg-role {
    font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text3);
    padding: 0 4px;
  }

  .msg-bubble {
    padding: 10px 12px;
    border-radius: 6px;
    line-height: 1.6;
    font-size: 12px;
    max-width: 100%;
    word-break: break-word;
  }

  .msg-bubble.user {
    background: rgba(0,238,255,0.08);
    border: 1px solid rgba(0,238,255,0.2);
    color: var(--text1);
    align-self: flex-end;
    border-bottom-right-radius: 2px;
  }

  .msg-bubble.assistant {
    background: var(--bg3);
    border: 1px solid var(--border);
    color: var(--text2);
    align-self: flex-start;
    border-bottom-left-radius: 2px;
  }

  .msg-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }

  .msg-action-btn {
    padding: 3px 8px;
    background: rgba(0,238,255,0.05);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: var(--font);
    font-size: 9px;
    color: var(--cyan2);
    cursor: pointer;
    letter-spacing: 0.06em;
    transition: all 0.15s;
  }
  .msg-action-btn:hover { background: rgba(0,238,255,0.12); border-color: var(--cyan2); }

  .typing-indicator {
    display: flex; gap: 4px; align-items: center; padding: 10px 12px;
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 6px; width: fit-content;
  }
  .typing-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--cyan);
    animation: bounce 1.2s ease-in-out infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

  .chat-input-area {
    padding: 12px 14px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .chat-input {
    flex: 1;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 9px 12px;
    font-family: var(--font);
    font-size: 12px;
    color: var(--text1);
    outline: none;
    resize: none;
    min-height: 38px;
    max-height: 120px;
    transition: border-color 0.2s;
    line-height: 1.5;
  }
  .chat-input:focus { border-color: var(--cyan2); box-shadow: 0 0 8px rgba(0,238,255,0.08); }
  .chat-input::placeholder { color: var(--text3); }

  .send-btn {
    width: 38px; height: 38px;
    background: rgba(0,238,255,0.1);
    border: 1px solid var(--cyan);
    border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    box-shadow: 0 0 10px rgba(0,238,255,0.15);
  }
  .send-btn:hover { background: rgba(0,238,255,0.2); box-shadow: 0 0 18px rgba(0,238,255,0.3); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .send-btn svg { width: 14px; height: 14px; }

  .graph-header {
    position: absolute;
    top: 0; left: 0; right: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: linear-gradient(180deg, rgba(4,8,15,0.95) 60%, transparent);
    pointer-events: none;
  }

  .graph-header > * { pointer-events: auto; }

  .graph-stat {
    font-size: 10px; color: var(--text3); letter-spacing: 0.08em;
  }
  .graph-stat span { color: var(--cyan); font-weight: 600; }

  .divider-v { width: 1px; height: 16px; background: var(--border); flex-shrink: 0; }

  .legend {
    position: absolute;
    bottom: 16px; left: 16px;
    z-index: 20;
    background: rgba(8,13,24,0.85);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 12px;
    backdrop-filter: blur(10px);
  }
  .legend-title { font-size: 8px; letter-spacing: 0.15em; color: var(--text3); text-transform: uppercase; margin-bottom: 8px; }
  .legend-item { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; font-size: 10px; color: var(--text2); }
  .legend-item:last-child { margin-bottom: 0; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  .graph-controls {
    position: absolute;
    top: 56px; right: 16px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .toggle-btn {
    padding: 6px 10px;
    background: rgba(8,13,24,0.85);
    border: 1px solid var(--border);
    border-radius: 5px;
    font-family: var(--font);
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--text2);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    backdrop-filter: blur(8px);
    text-transform: uppercase;
  }
  .toggle-btn:hover { border-color: var(--border2); color: var(--text1); }
  .toggle-btn.active { border-color: var(--cyan); color: var(--cyan); background: rgba(0,238,255,0.08); box-shadow: 0 0 10px rgba(0,238,255,0.12); }

  .inspector {
    position: absolute;
    top: 56px; right: 16px;
    width: 260px;
    z-index: 30;
    background: rgba(8,13,24,0.92);
    border: 1px solid var(--border2);
    border-radius: 8px;
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,238,255,0.05);
    overflow: hidden;
    animation: slide-in 0.2s ease;
  }

  @keyframes slide-in { from { opacity:0; transform: translateX(10px); } to { opacity:1; transform: translateX(0); } }

  .inspector-header {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
  }
  .inspector-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .inspector-name { font-size: 12px; font-weight: 600; color: var(--text1); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .inspector-close {
    width: 20px; height: 20px;
    border: none; background: transparent;
    color: var(--text3); cursor: pointer; font-size: 14px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    border-radius: 3px; transition: all 0.15s;
  }
  .inspector-close:hover { color: var(--text1); background: var(--bg4); }

  .inspector-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

  .inspector-desc { font-size: 11px; color: var(--text2); line-height: 1.6; }

  .inspector-section-title { font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3); margin-bottom: 6px; }

  .inspector-prop { display: flex; justify-content: space-between; gap: 8px; font-size: 10px; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .inspector-prop-key { color: var(--text3); }
  .inspector-prop-val { color: var(--text2); text-align: right; }

  .inspector-rel { font-size: 10px; color: var(--text2); padding: 3px 6px; background: var(--bg4); border-radius: 3px; margin-bottom: 4px; display: flex; align-items: center; gap: 5px; }
  .inspector-rel-arrow { color: var(--cyan); opacity: 0.7; }

  .inspector-actions { display: flex; flex-direction: column; gap: 6px; }

  .graph-canvas { width: 100%; height: 100%; }

  .notif {
    position: absolute;
    bottom: 16px; right: 16px;
    background: rgba(0,238,255,0.08);
    border: 1px solid rgba(0,238,255,0.3);
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 10px;
    color: var(--cyan);
    z-index: 50;
    animation: notif-in 0.25s ease, notif-out 0.3s ease 2.7s forwards;
    box-shadow: 0 0 20px rgba(0,238,255,0.15);
    pointer-events: none;
    letter-spacing: 0.05em;
  }
  @keyframes notif-in  { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
  @keyframes notif-out { from { opacity:1; } to { opacity:0; } }

  * { scrollbar-width: thin; scrollbar-color: rgba(0,238,255,0.15) transparent; }

  .node-tooltip {
    position: absolute;
    background: rgba(8,13,24,0.92);
    border: 1px solid var(--border2);
    border-radius: 5px;
    padding: 6px 10px;
    font-size: 10px;
    color: var(--text1);
    pointer-events: none;
    z-index: 40;
    backdrop-filter: blur(8px);
    transition: opacity 0.15s;
  }
  .node-tooltip-type { font-size: 8px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.1em; }
`;

function useNotification() {
  const [notif, setNotif] = useState(null);
  const timer = useRef(null);
  const show = useCallback((msg) => {
    clearTimeout(timer.current);
    setNotif(null);
    setTimeout(() => {
      setNotif(msg);
      timer.current = setTimeout(() => setNotif(null), 3000);
    }, 10);
  }, []);
  return [notif, show];
}

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  const [selectedNode,   setSelectedNode]   = useState(null);
  const [hoveredNode,    setHoveredNode]    = useState(null);
  const [hoverPos,       setHoverPos]       = useState({ x: 0, y: 0 });
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);

  const [messages,   setMessages]   = useState([{ role: "assistant", text: "Neural Intelligence System online. Connect a URL to begin knowledge extraction." }]);
  const [chatInput,  setChatInput]  = useState("");
  const [typing,     setTyping]     = useState(false);

  const [url,        setUrl]        = useState("");
  const [wsStatus,   setWsStatus]   = useState("idle");
  const [wsProgress, setWsProgress] = useState(0);
  const [wsMsg,      setWsMsg]      = useState("");
  const [extracting, setExtracting] = useState(false);

  const [notif, showNotif] = useNotification();

  const graphRef      = useRef(null);
  const chatBottomRef = useRef(null);

  // --- COMPONENT-SCOPED THREE.JS ASSETS (Fixes WebGL HMR loss) ---
  const baseGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  const haloGeo = useMemo(() => new THREE.SphereGeometry(1.6, 16, 16), []);

  const matCache = useRef({});
  const getMat = useCallback((hex, opacity, isHalo = false) => {
    const key = `${hex}-${opacity}-${isHalo}`;
    if (!matCache.current[key]) {
      matCache.current[key] = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hex),
        transparent: true,
        opacity: opacity,
        side: isHalo ? THREE.BackSide : THREE.FrontSide,
        depthWrite: !isHalo,
        depthTest: !isHalo // Prevents halo from clipping
      });
    }
    return matCache.current[key];
  }, []);

  const spriteCache = useRef({});
  const getSprite = useCallback((text, color) => {
    const key = `${text}-${color}`;
    if (!spriteCache.current[key]) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const font = '24px "JetBrains Mono", monospace';
      ctx.font = font;
      
      const textWidth = ctx.measureText(text).width;
      canvas.width = Math.ceil(textWidth) + 16; 
      canvas.height = 36;

      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter; // Crucial for non-power-of-2 canvas
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false; 
      texture.needsUpdate = true;

      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false // Ensures label always renders on top
      });

      const scale = 0.15;
      spriteCache.current[key] = { mat, w: canvas.width * scale, h: canvas.height * scale };
    }
    return spriteCache.current[key];
  }, []);

  const highlightedIds = useMemo(() => {
    if (!selectedNode) return new Set();
    const s = new Set([selectedNode.id]);
    links.forEach(l => {
      const sid = typeof l.source === "object" ? l.source.id : l.source;
      const tid = typeof l.target === "object" ? l.target.id : l.target;
      if (sid === selectedNode.id) s.add(tid);
      if (tid === selectedNode.id) s.add(sid);
    });
    return s;
  }, [selectedNode, links]);

  const selectedRelations = useMemo(() => {
    if (!selectedNode) return [];
    return links.reduce((acc, l) => {
      const sid = typeof l.source === "object" ? l.source.id : l.source;
      const tid = typeof l.target === "object" ? l.target.id : l.target;
      if (sid === selectedNode.id) {
        const target = nodes.find(n => n.id === tid);
        if (target) acc.push({ dir: "out", label: l.label, other: target });
      } else if (tid === selectedNode.id) {
        const source = nodes.find(n => n.id === sid);
        if (source) acc.push({ dir: "in", label: l.label, other: source });
      }
      return acc;
    }, []);
  }, [selectedNode, links, nodes]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  const focusNode = useCallback((node) => {
    if (!graphRef.current || !node) return;
    const distance = 120;
    const nx = typeof node.x === "number" ? node.x : 0;
    const ny = typeof node.y === "number" ? node.y : 0;
    const nz = typeof node.z === "number" ? node.z : 0;
    graphRef.current.cameraPosition(
      { x: nx + distance * 0.5, y: ny + distance * 0.3, z: nz + distance },
      { x: nx, y: ny, z: nz },
      800
    );
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    focusNode(node);
  }, [focusNode]);

  const handleNodeHover = useCallback((node, prevNode, event) => {
    setHoveredNode(node || null);
    if (node && event) setHoverPos({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (hoveredNode) setHoverPos({ x: e.clientX, y: e.clientY });
  }, [hoveredNode]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setTyping(true);

    if (!url.trim()) {
        setMessages(prev => [...prev, { role: "assistant", text: "Please connect a URL first before querying." }]);
        setTyping(false);
        return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), query: text.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        const responseNodes = data.graph?.nodes || [];
        const actions = responseNodes.slice(0, 3).map(n => ({
          label: `Focus: ${n.label || n.name || n.id}`,
          node: n,
        }));

        setMessages(prev => [...prev, { role: "assistant", text: data.answer, actions }]);

        if (data.graph) {
          setNodes(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const additions = responseNodes.filter(n => !existingIds.has(n.id));
            return [...prev, ...additions];
          });
          
          setLinks(prev => {
             const existing = new Set(prev.map(l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                return `${sid}|${tid}`;
             }));
             const additions = (data.graph.edges || []).filter(l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                const key = `${sid}|${tid}`;
                if (existing.has(key)) return false;
                existing.add(key);
                return true;
             });
             return [...prev, ...additions];
          });
        }
      } else {
        setMessages(prev => [...prev, { role: "assistant", text: "Error: The backend failed to process the request." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: "Error: Could not connect to the backend server." }]);
    }

    setTyping(false);
  }, [url]);

  const handleChatKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput);
    }
  }, [chatInput, sendMessage]);

  const startExtraction = useCallback(() => {
    if (!url.trim() || extracting) return;
    setExtracting(true);
    setWsStatus("connecting");
    setWsProgress(0);
    setWsMsg("Initializing WebSocket...");
    showNotif("Connecting to extraction pipeline...");

    const ws = new WebSocket(`${WS_BASE_URL}/ws/extract`);

    ws.onopen = () => {
      setWsStatus("connected");
      ws.send(JSON.stringify({ url: url.trim() }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "status") {
        setWsMsg(data.message);
        setWsProgress(prev => Math.min(prev + 5, 95));
      } else if (data.type === "graph_update") {
        const newNodes = data.data.nodes || [];
        const newEdges = data.data.edges || [];

        setNodes(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const additions = newNodes.filter(n => !existingIds.has(n.id));
          return [...prev, ...additions];
        });
        
        setLinks(prev => {
           const existing = new Set(prev.map(l => {
              const sid = typeof l.source === 'object' ? l.source.id : l.source;
              const tid = typeof l.target === 'object' ? l.target.id : l.target;
              return `${sid}|${tid}`;
           }));
           const additions = newEdges.filter(l => {
              const sid = typeof l.source === 'object' ? l.source.id : l.source;
              const tid = typeof l.target === 'object' ? l.target.id : l.target;
              const key = `${sid}|${tid}`;
              if (existing.has(key)) return false;
              existing.add(key);
              return true;
           });
           return [...prev, ...additions];
        });
        
        showNotif(`Received graph update: ${newNodes.length} nodes added.`);
      } else if (data.type === "done") {
        setExtracting(false);
        setWsStatus("idle");
        setWsProgress(100);
        setWsMsg("");
        showNotif("Extraction complete.");
        ws.close();
      }
    };

    ws.onerror = () => {
      setWsStatus("idle");
      setExtracting(false);
      setWsMsg("WebSocket Error");
      showNotif("Extraction failed due to connection error.");
      ws.close();
    };

    ws.onclose = () => {
      setExtracting(false);
      if (wsStatus === "connected") setWsStatus("idle");
    };
  }, [url, extracting, showNotif, wsStatus]);

  const triggerDeepAnalysis = useCallback((node) => {
    const q = `Perform a deep analysis of "${node.label || node.name || node.id}" and its role in the knowledge graph. What patterns and implications can you identify?`;
    sendMessage(q);
  }, [sendMessage]);

  // --- MUTATION PATTERN (Prevents object creation loops) ---
  const nodeThreeObject = useCallback((node) => {
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlightedIds.has(node.id);
    const style = NODE_COLORS[node.type?.toLowerCase()] || NODE_COLORS.other;
    const size = isSelected ? 7 : isHighlighted ? 5 : 4;

    // Initialize node object ONLY ONCE per node
    if (!node.__customObj) {
      const group = new THREE.Group();
      
      const mesh = new THREE.Mesh(baseGeo, getMat(style.hex, 0.8, false));
      group.add(mesh);
      node.__mesh = mesh;

      const halo = new THREE.Mesh(haloGeo, getMat(style.hex, 0.1, true));
      group.add(halo);
      node.__halo = halo;

      const sprite = new THREE.Sprite();
      group.add(sprite);
      node.__sprite = sprite;

      node.__customObj = group;
    }

    // Update existing mesh properties without returning a new Group
    node.__mesh.scale.set(size, size, size);
    node.__mesh.material = getMat(style.hex, isSelected ? 1 : isHighlighted ? 0.9 : 0.8, false);

    if (isSelected || isHighlighted) {
      node.__halo.visible = true;
      node.__halo.scale.set(size, size, size);
      node.__halo.material = getMat(style.hex, isSelected ? 0.18 : 0.08, true);
    } else {
      node.__halo.visible = false;
    }

    // Fallback chain for data inconsistencies
    const displayText = node.label || node.name || node.id;
    
    if (showNodeLabels && displayText) {
      const labelText = String(displayText);
      const color = (isSelected || isHighlighted) ? style.hex : '#8aadcc';
      const info = getSprite(labelText, color);
      
      node.__sprite.visible = true;
      node.__sprite.material = info.mat;
      node.__sprite.scale.set(info.w, info.h, 1);
      node.__sprite.position.set(0, size + 3, 0);
    } else {
      node.__sprite.visible = false;
    }

    return node.__customObj;
  }, [selectedNode, highlightedIds, showNodeLabels, baseGeo, haloGeo, getMat, getSprite]);

  const linkColor = useCallback((link) => {
    const sid = typeof link.source === "object" ? link.source.id : link.source;
    const tid = typeof link.target === "object" ? link.target.id : link.target;
    if (selectedNode && (sid === selectedNode.id || tid === selectedNode.id)) {
      return "rgba(0,238,255,0.7)";
    }
    return "rgba(100,130,160,0.25)";
  }, [selectedNode]);

  const linkWidth = useCallback((link) => {
    const sid = typeof link.source === "object" ? link.source.id : link.source;
    const tid = typeof link.target === "object" ? link.target.id : link.target;
    if (selectedNode && (sid === selectedNode.id || tid === selectedNode.id)) return 2;
    return 0.8;
  }, [selectedNode]);

  const linkDirectionalParticles = useCallback((link) => {
    const sid = typeof link.source === "object" ? link.source.id : link.source;
    const tid = typeof link.target === "object" ? link.target.id : link.target;
    if (selectedNode && (sid === selectedNode.id || tid === selectedNode.id)) return 4;
    return 0;
  }, [selectedNode]);

  const linkDirectionalParticleColor = useCallback(() => "rgba(0,238,255,0.8)", []);
  const linkDirectionalParticleWidth = useCallback(() => 2, []);
  const linkDirectionalParticleSpeed = useCallback(() => 0.006, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="nis-root" onMouseMove={handleMouseMove}>

        <div className="panel-left">

          <div className="nis-header">
            <div className="nis-logo">
              <svg viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="3" fill="#00eeff" opacity="0.9"/>
                <circle cx="9" cy="2" r="1.5" fill="#00eeff" opacity="0.5"/>
                <circle cx="9" cy="16" r="1.5" fill="#00eeff" opacity="0.5"/>
                <circle cx="2" cy="9" r="1.5" fill="#00eeff" opacity="0.5"/>
                <circle cx="16" cy="9" r="1.5" fill="#00eeff" opacity="0.5"/>
                <line x1="9" y1="3.5" x2="9" y2="6" stroke="#00eeff" strokeWidth="0.8" opacity="0.4"/>
                <line x1="9" y1="12" x2="9" y2="14.5" stroke="#00eeff" strokeWidth="0.8" opacity="0.4"/>
                <line x1="3.5" y1="9" x2="6" y2="9" stroke="#00eeff" strokeWidth="0.8" opacity="0.4"/>
                <line x1="12" y1="9" x2="14.5" y2="9" stroke="#00eeff" strokeWidth="0.8" opacity="0.4"/>
              </svg>
            </div>
            <div>
              <div className="nis-title">Neural Intelligence</div>
              <div className="nis-sub">Knowledge Extraction System v2.4</div>
            </div>
            <div className="status-dot" />
          </div>

          <div className="url-section">
            <div className="url-label">Data Source URI</div>
            <div className="url-row">
              <input
                className="url-input"
                type="text"
                placeholder="https://example.com/article"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && startExtraction()}
              />
              <button
                className={`btn btn-primary`}
                onClick={startExtraction}
                disabled={extracting || !url.trim()}
              >
                {extracting ? "..." : "Extract"}
              </button>
            </div>

            <div className="ws-status">
              <div className={`ws-dot ${wsStatus}`} />
              <span>
                {wsStatus === "idle" ? "WebSocket idle" :
                 wsStatus === "connecting" ? "Connecting..." :
                 `Streaming — ${wsMsg}`}
              </span>
            </div>

            {extracting && (
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${wsProgress}%` }} />
              </div>
            )}
          </div>

          <div className="chat-area">
            {messages.map((msg, i) => (
              <div className="msg-wrap" key={i}>
                <div className="msg-role">{msg.role === "user" ? "// USER" : "// ASSISTANT"}</div>
                <div className={`msg-bubble ${msg.role}`}>{msg.text}</div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="msg-actions">
                    {msg.actions.map((a, j) => (
                      <button
                        key={j}
                        className="msg-action-btn"
                        onClick={() => {
                          setSelectedNode(a.node);
                          focusNode(a.node);
                        }}
                      >
                        ⬡ {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="msg-wrap">
                <div className="msg-role">// ASSISTANT</div>
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              className="chat-input"
              placeholder="Query the knowledge graph..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              rows={1}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage(chatInput)}
              disabled={typing || !chatInput.trim()}
            >
              <svg viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="#00eeff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="panel-right">

          <div className="graph-header">
            <div className="graph-stat">Nodes <span>{nodes.length}</span></div>
            <div className="divider-v" />
            <div className="graph-stat">Edges <span>{links.length}</span></div>
            <div className="divider-v" />
            <div className="graph-stat">Types <span>{Object.keys(NODE_COLORS).length}</span></div>
            {selectedNode && (
              <>
                <div className="divider-v" />
                <div className="graph-stat">Selected <span style={{ color: (NODE_COLORS[selectedNode.type?.toLowerCase()] || NODE_COLORS.other).hex }}>{selectedNode.label || selectedNode.name || selectedNode.id}</span></div>
              </>
            )}
          </div>

          {!selectedNode && (
            <div className="graph-controls">
              <button
                className={`toggle-btn ${showNodeLabels ? "active" : ""}`}
                onClick={() => setShowNodeLabels(v => !v)}
              >
                {showNodeLabels ? "✓" : "○"} Node Labels
              </button>
              <button
                className={`toggle-btn ${showEdgeLabels ? "active" : ""}`}
                onClick={() => setShowEdgeLabels(v => !v)}
              >
                {showEdgeLabels ? "✓" : "○"} Edge Labels
              </button>
              <button
                className="toggle-btn"
                onClick={() => graphRef.current?.zoomToFit(600, 80)}
              >
                ⊡ Fit View
              </button>
            </div>
          )}

          {selectedNode && (
            <div className="inspector">
              <div className="inspector-header">
                <div
                  className="inspector-type-dot"
                  style={{ background: (NODE_COLORS[selectedNode.type?.toLowerCase()] || NODE_COLORS.other).hex, boxShadow: `0 0 8px ${(NODE_COLORS[selectedNode.type?.toLowerCase()] || NODE_COLORS.other).glow}` }}
                />
                <div className="inspector-name" title={selectedNode.label || selectedNode.name || selectedNode.id}>
                  {selectedNode.label || selectedNode.name || selectedNode.id}
                </div>
                <button className="inspector-close" onClick={() => setSelectedNode(null)}>×</button>
              </div>

              <div className="inspector-body">
                {(selectedNode.desc || selectedNode.description) && (
                  <div className="inspector-desc">{selectedNode.desc || selectedNode.description}</div>
                )}

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: "3px", fontSize: "9px",
                    background: `${(NODE_COLORS[selectedNode.type?.toLowerCase()] || NODE_COLORS.other).hex}22`,
                    border: `1px solid ${(NODE_COLORS[selectedNode.type?.toLowerCase()] || NODE_COLORS.other).hex}55`,
                    color: (NODE_COLORS[selectedNode.type?.toLowerCase()] || NODE_COLORS.other).hex,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    {selectedNode.type || 'UNKNOWN'}
                  </span>
                  <span style={{ padding: "2px 8px", borderRadius: "3px", fontSize: "9px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#4a6a88", letterSpacing: "0.06em" }}>
                    {selectedRelations.length} links
                  </span>
                </div>

                {selectedNode.props && Object.keys(selectedNode.props).length > 0 && (
                  <div>
                    <div className="inspector-section-title">Properties</div>
                    {Object.entries(selectedNode.props).map(([k, v]) => (
                      <div className="inspector-prop" key={k}>
                        <span className="inspector-prop-key">{k}</span>
                        <span className="inspector-prop-val">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRelations.length > 0 && (
                  <div>
                    <div className="inspector-section-title">Relationships ({selectedRelations.length})</div>
                    <div style={{ maxHeight: "110px", overflowY: "auto" }}>
                      {selectedRelations.map((r, i) => (
                        <div
                          className="inspector-rel"
                          key={i}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedNode(r.other);
                            focusNode(r.other);
                          }}
                        >
                          <span className="inspector-rel-arrow">{r.dir === "out" ? "→" : "←"}</span>
                          <span style={{ color: "#4a6a88", fontSize: "9px", marginRight: "2px" }}>{r.label}</span>
                          <span style={{ color: (NODE_COLORS[r.other.type?.toLowerCase()] || NODE_COLORS.other).hex }}>{r.other.label || r.other.name || r.other.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="inspector-actions">
                  <button className="btn btn-sm" style={{ width: "100%" }} onClick={() => triggerDeepAnalysis(selectedNode)}>
                    ⬡ Deep Analysis Query
                  </button>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => { setShowNodeLabels(v => !v); }}>
                      {showNodeLabels ? "Hide" : "Show"} Labels
                    </button>
                    <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => graphRef.current?.zoomToFit(600, 80)}>
                      Fit View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ForceGraph3D
            ref={graphRef}
            graphData={graphData}
            backgroundColor="#04080f"
            showNavInfo={false}
            nodeThreeObject={nodeThreeObject}
            nodeThreeObjectExtend={false}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkOpacity={0.6}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={linkColor}
            linkDirectionalParticles={linkDirectionalParticles}
            linkDirectionalParticleColor={linkDirectionalParticleColor}
            linkDirectionalParticleWidth={linkDirectionalParticleWidth}
            linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
            enableNodeDrag={true}
            enableNavigationControls={true}
            warmupTicks={100}
            cooldownTicks={200}
          />

          <div className="legend">
            <div className="legend-title">Node Types</div>
            {Object.entries(NODE_COLORS).map(([type, { hex, label }]) => (
              <div className="legend-item" key={type}>
                <div className="legend-dot" style={{ background: hex, boxShadow: `0 0 5px ${hex}88` }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {notif && <div className="notif">{notif}</div>}

          {hoveredNode && (
            <div
              className="node-tooltip"
              style={{ 
                left: hoverPos.x + 14, 
                top: hoverPos.y - 10, 
                position: "fixed",
                maxWidth: "240px",
                whiteSpace: "normal" // Allows text wrapping for details
              }}
            >
              <div className="node-tooltip-type" style={{ color: (NODE_COLORS[hoveredNode.type?.toLowerCase()] || NODE_COLORS.other).hex }}>
                {hoveredNode.type || 'UNKNOWN TYPE'}
              </div>
              
              <div style={{ fontWeight: 600, fontSize: "11px", marginBottom: "4px" }}>
                {hoveredNode.label || hoveredNode.name || hoveredNode.id || "Unnamed Node"}
              </div>

              {(hoveredNode.desc || hoveredNode.description) && (
                <div style={{ fontSize: "9px", color: "var(--text2)", lineHeight: "1.4" }}>
                  {hoveredNode.desc || hoveredNode.description}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}