import React, { useState, useEffect } from "react";
import { RouterNode, NetworkLink, RoutingTable, NetworkRoutingTables, DVUpdateMessage } from "../types";
import { Play, Pause, ChevronRight, RotateCcw, AlertTriangle, ToggleLeft, ToggleRight, CheckCircle2, Award, Zap, BookOpen, Ban } from "lucide-react";
import { dvRoutingLesson } from "../data/lessons";

export default function DistanceVectorVisualizer() {
  // Predefined routers
  const initialRouters: RouterNode[] = [
    { id: "R1", name: "Router 1", x: 100, y: 150, failed: false },
    { id: "R2", name: "Router 2", x: 260, y: 70, failed: false },
    { id: "R3", name: "Router 3", x: 260, y: 230, failed: false },
    { id: "R4", name: "Router 4", x: 420, y: 150, failed: false }
  ];

  const initialLinks: NetworkLink[] = [
    { id: "l1", source: "R1", target: "R2", cost: 2, failed: false },
    { id: "l2", source: "R1", target: "R3", cost: 5, failed: false },
    { id: "l3", source: "R2", target: "R3", cost: 1, failed: false },
    { id: "l4", source: "R2", target: "R4", cost: 4, failed: false },
    { id: "l5", source: "R3", target: "R4", cost: 2, failed: false }
  ];

  const [routers, setRouters] = useState<RouterNode[]>(() => {
    const cached = localStorage.getItem("dv_routers");
    return cached ? JSON.parse(cached) : initialRouters;
  });

  const [links, setLinks] = useState<NetworkLink[]>(() => {
    const cached = localStorage.getItem("dv_links");
    return cached ? JSON.parse(cached) : initialLinks;
  });

  // State persist
  useEffect(() => {
    localStorage.setItem("dv_routers", JSON.stringify(routers));
  }, [routers]);

  useEffect(() => {
    localStorage.setItem("dv_links", JSON.stringify(links));
  }, [links]);

  const [routingTables, setRoutingTables] = useState<NetworkRoutingTables>({});
  const [currentIteration, setCurrentIteration] = useState<number>(0);
  const [converged, setConverged] = useState<boolean>(false);
  
  // Custom user controls
  const [splitHorizon, setSplitHorizon] = useState<boolean>(true);
  const [poisonReverse, setPoisonReverse] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [updateInterval, setUpdateInterval] = useState<number>(1500); // ms
  const [messages, setMessages] = useState<DVUpdateMessage[]>([]);

  // Editing structures
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLinkCost, setEditingLinkCost] = useState<number>(5);

  const [customRouterName, setCustomRouterName] = useState<string>("");
  const [customLinkSource, setCustomLinkSource] = useState<string>("");
  const [customLinkTarget, setCustomLinkTarget] = useState<string>("");
  const [customLinkCost, setCustomLinkCost] = useState<number>(3);

  // Initialize Routing Tables
  useEffect(() => {
    resetExchange();
  }, [routers, links]);

  const resetExchange = () => {
    const initialTables: NetworkRoutingTables = {};
    
    // Fill basic nodes
    routers.forEach(r => {
      if (r.failed) return;
      const table: RoutingTable = {};
      
      routers.forEach(dest => {
        if (dest.failed) return;
        if (dest.id === r.id) {
          table[dest.id] = { destination: dest.id, cost: 0, nextHop: r.id };
        } else {
          // Check if direct link exists
          const edge = links.find(l => 
            !l.failed && 
            ((l.source === r.id && l.target === dest.id) || 
             (l.target === r.id && l.source === dest.id))
          );
          
          if (edge) {
            table[dest.id] = { destination: dest.id, cost: edge.cost, nextHop: dest.id };
          } else {
            table[dest.id] = { destination: dest.id, cost: Infinity, nextHop: null };
          }
        }
      });
      initialTables[r.id] = table;
    });

    setRoutingTables(initialTables);
    setCurrentIteration(0);
    setConverged(false);
    setMessages([]);
    setIsRunning(false);
  };

  // Run a single full step routing vector exchange between all neighboring active routers
  const stepVectorExchange = () => {
    if (converged || routers.every(r => r.failed)) return;

    let tablesChanged = false;
    const nextTables: NetworkRoutingTables = JSON.parse(JSON.stringify(routingTables));
    const activeMessages: DVUpdateMessage[] = [];

    // Map active routers
    const activeRouters = routers.filter(r => !r.failed);

    activeRouters.forEach(sender => {
      // Find direct neighbors
      const neighbors = activeRouters.filter(n => {
        if (n.id === sender.id) return false;
        return links.some(l => 
          !l.failed && 
          ((l.source === sender.id && l.target === n.id) || 
           (l.target === sender.id && l.source === n.id))
        );
      });

      neighbors.forEach(neighbor => {
        // Find link cost
        const link = links.find(l => 
          !l.failed && 
          ((l.source === sender.id && l.target === neighbor.id) || 
           (l.target === sender.id && l.source === neighbor.id))
        )!;

        // Clone sender's vector to prepare message vector advertisement
        const adTable: RoutingTable = {};
        
        Object.keys(routingTables[sender.id] || {}).forEach(dest => {
          const entry = routingTables[sender.id][dest];
          let costToSend = entry.cost;

          // Apply Split Horizon logic: Do not send route back if Next Hop matches neighbor
          if (splitHorizon && entry.nextHop === neighbor.id && dest !== neighbor.id) {
            costToSend = poisonReverse ? Infinity : -1; // -1 represents hiding entirely (not advertised)
          }

          if (costToSend !== -1) {
            adTable[dest] = {
              destination: dest,
              cost: costToSend,
              nextHop: null
            };
          }
        });

        // Push routing update advertisement packet trace
        activeMessages.push({
          id: `msg_${sender.id}_${neighbor.id}_${Date.now()}`,
          from: sender.id,
          to: neighbor.id,
          table: adTable,
          progress: 0
        });

        // Neighbor processes message (Bellman-Ford update integration)
        Object.keys(adTable).forEach(dest => {
          const advertisedCost = adTable[dest].cost;
          if (advertisedCost === -1) return; // skip hidden

          const currentEstimate = routingTables[neighbor.id]?.[dest]?.cost ?? Infinity;
          const viaSenderCost = advertisedCost + link.cost;

          // RIP max hop-bound is usually 16, representing infinity (count-to-infinity defense)
          const boundedCost = viaSenderCost >= 16 ? Infinity : viaSenderCost;

          // Update trigger: if cost is better, OR if the advertisement is from the existing next_hop
          const isFromNextHop = routingTables[neighbor.id]?.[dest]?.nextHop === sender.id;

          if (isFromNextHop || boundedCost < currentEstimate) {
            if (boundedCost !== currentEstimate || routingTables[neighbor.id]?.[dest]?.nextHop !== sender.id) {
              nextTables[neighbor.id][dest] = {
                destination: dest,
                cost: boundedCost === Infinity ? Infinity : boundedCost,
                nextHop: boundedCost === Infinity ? null : sender.id
              };
              tablesChanged = true;
            }
          }
        });
      });
    });

    // Handle Packet Delivery Animation Trigger
    setMessages(activeMessages);

    if (tablesChanged) {
      setRoutingTables(nextTables);
      setCurrentIteration(prev => prev + 1);
      setConverged(false);
    } else {
      setConverged(true);
      setIsRunning(false);
    }
  };

  // Continuous timer support
  useEffect(() => {
    let timerId: any = null;
    if (isRunning && !converged) {
      timerId = setInterval(() => {
        stepVectorExchange();
      }, updateInterval);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRunning, converged, routingTables, splitHorizon, poisonReverse, updateInterval]);

  // Animate packet message progress simply
  useEffect(() => {
    if (messages.length === 0) return;
    
    let frameId: any;
    const progressTicker = () => {
      setMessages(prev => {
        const next = prev.map(m => m.progress < 1 ? { ...m, progress: m.progress + 0.1 } : m);
        
        // Remove completed animations after a brief delay
        if (next.every(m => m.progress >= 1)) {
          return [];
        }
        return next;
      });
      frameId = requestAnimationFrame(progressTicker);
    };

    frameId = requestAnimationFrame(progressTicker);
    return () => cancelAnimationFrame(frameId);
  }, [routingTables]);

  // Fail/Restore interactive toggles
  const handleToggleRouterFail = (routerId: string) => {
    setRouters(prev => prev.map(r => r.id === routerId ? { ...r, failed: !r.failed } : r));
    // When a router fails, fail all links connected to it
    setLinks(prev => prev.map(l => {
      if (l.source === routerId || l.target === routerId) {
        return { ...l, failed: !routers.find(r => r.id === routerId)?.failed };
      }
      return l;
    }));
  };

  const handleToggleLinkFail = (linkId: string) => {
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, failed: !l.failed } : l));
  };

  const handleApplyLinkCost = () => {
    if (!editingLinkId) return;
    setLinks(prev => prev.map(l => l.id === editingLinkId ? { ...l, cost: editingLinkCost } : l));
    setEditingLinkId(null);
  };

  // Add Custom Elements to topology
  const handleCreateRouter = () => {
    const id = `R${routers.length + 1}`;
    const name = customRouterName.trim() || `Router ${routers.length + 1}`;
    
    const newRouter: RouterNode = {
      id,
      name,
      x: 150 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      failed: false
    };

    setRouters(prev => [...prev, newRouter]);
    setCustomRouterName("");
  };

  const handleCreateLink = () => {
    if (!customLinkSource || !customLinkTarget) return;
    if (customLinkSource === customLinkTarget) {
      alert("Cannot connect a router to itself!");
      return;
    }

    const exists = links.some(l => 
      (l.source === customLinkSource && l.target === customLinkTarget) ||
      (l.target === customLinkSource && l.source === customLinkTarget)
    );

    if (exists) {
      alert("A physical link already exists between these nodes.");
      return;
    }

    const newLink: NetworkLink = {
      id: `l_${customLinkSource}_${customLinkTarget}`,
      source: customLinkSource,
      target: customLinkTarget,
      cost: customLinkCost,
      failed: false
    };

    setLinks(prev => [...prev, newLink]);
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100">
      
      {/* SECTION HEADER THEORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-semibold tracking-tight text-white">{dvRoutingLesson.title}</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {dvRoutingLesson.whatIsIt}
          </p>

          <div className="mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-2">Distributed Bellman-Ford Principle</h4>
            <p className="text-sm font-mono text-indigo-200">
              {dvRoutingLesson.formula}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Each router calculates its shortest paths relying solely on local direct link costs plus vectors advertised by direct neighbors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1.5">Distributed Autonomy</h4>
              <p className="text-slate-400 leading-relaxed">{dvRoutingLesson.whyItMatters}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1.5">Standard Implementations</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                {dvRoutingLesson.whereUsed.map((use, idx) => (
                  <li key={idx}><span className="text-slate-300">{use}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Dynamic educational parameters toggler */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Mitigate Count-To-Infinity Loops</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Without protections, a broken link triggers circular routes. We can toggle split-horizon techniques to see how routes update instantly!
            </p>

            <div className="space-y-4">
              
              {/* Split Horizon Toggle */}
              <div 
                onClick={() => {
                  setSplitHorizon(!splitHorizon);
                  resetExchange();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:border-white/10 transition-all select-none"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-300">Split Horizon</h4>
                  <p className="text-[10px] text-slate-500">Don't share routes back to sender</p>
                </div>
                {splitHorizon ? (
                  <ToggleRight className="w-9 h-9 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-600" />
                )}
              </div>

              {/* Poison Reverse Toggle */}
              <div 
                onClick={() => {
                  setPoisonReverse(!poisonReverse);
                  resetExchange();
                }}
                className={`flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:border-white/10 transition-all select-none ${!splitHorizon ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-300">Poison Reverse</h4>
                  <p className="text-[10px] text-slate-500">Active advertisement of cost ∞</p>
                </div>
                {poisonReverse ? (
                  <ToggleRight className="w-9 h-9 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-600" />
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/15 text-[11px] text-slate-400/80 mt-4 leading-relaxed">
            ✏️ <strong>Interactive Tip:</strong> Try disabling <em>Split Horizon</em>, trigger a link failure (e.g., break R2-R4 link), and run updates to witness the classic metric infinity loop calculation!
          </div>
        </div>
      </div>

      {/* CORE SIMULATION GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Layout Side Panel controls */}
        <div className="xl:col-span-1 flex flex-col gap-6">

          {/* Stepper configurations */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Routing Exchange Engine
            </h3>

            {/* Convergence state indicator */}
            {converged ? (
              <div className="p-3 py-3 text-center bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex flex-col items-center gap-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Network Converged</span>
                <span className="text-[10px] text-slate-400">All local vectors are fully optimized.</span>
              </div>
            ) : (
              <div className="p-3 py-3 text-center bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono tracking-widest uppercase text-amber-400 animate-pulse">Running convergence</span>
                <span className="text-xs text-slate-300 font-semibold mt-1">Pending neighboring advertisement updates</span>
              </div>
            )}

            {/* Adjustable sliders */}
            <div className="space-y-3.5 pt-2 border-t border-white/5 text-xs">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Broadcast Interval Delay</span>
                  <span className="text-indigo-400">{updateInterval}ms</span>
                </div>
                <input 
                  type="range"
                  min={500}
                  max={3000}
                  step={250}
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Step triggers buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isRunning 
                      ? "bg-amber-600 text-white" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isRunning ? "Pause" : "Auto Broadcast"}
                </button>

                <button
                  onClick={resetExchange}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300"
                  title="Reset tables"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={stepVectorExchange}
                disabled={converged}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 rounded-lg text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>Trigger Manual Ad Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Topology Dynamic link modifiers */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">Topology Configuration</h3>
            
            {/* Create dynamic interface element */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500">Add physical Router</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. Router 5"
                  value={customRouterName}
                  onChange={(e) => setCustomRouterName(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 p-1.5 rounded-lg text-xs text-slate-200"
                />
                <button
                  onClick={handleCreateRouter}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 text-xs rounded-lg font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Link editor element */}
            <div className="pt-2 border-t border-white/5 space-y-2 text-xs">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Link cost Adjuster</label>
              
              <div className="space-y-1.5">
                {links.map(l => (
                  <div key={l.id} className="flex justify-between items-center p-2 rounded bg-black/20 border border-white/5">
                    <span className="font-mono text-[11px] text-slate-300">{l.source} ⬄ {l.target}</span>
                    
                    <div className="flex items-center gap-2">
                      {editingLinkId === l.id ? (
                        <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            min={1}
                            max={15}
                            value={editingLinkCost}
                            onChange={(e) => setEditingLinkCost(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-10 bg-black/40 border border-white/15 rounded text-center text-xs text-white"
                          />
                          <button 
                            onClick={handleApplyLinkCost}
                            className="bg-emerald-600 px-1.5 rounded text-[10px] text-white"
                          >
                            Set
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingLinkId(l.id);
                            setEditingLinkCost(l.cost);
                          }}
                          className="text-[10px] hover:text-indigo-400 bg-white/5 px-2 py-0.5 rounded text-slate-400"
                        >
                          Cost: {l.cost}
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleLinkFail(l.id)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${l.failed ? 'bg-red-500 text-white' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}
                        title="Fail/Restore Connection Link"
                      >
                        {l.failed ? "Off (Fail)" : "On (Up)"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Central Visualization Area: Ring coordinates Router topology with packet exchange animation */}
        <div className="xl:col-span-2 bg-black/30 border border-white/10 rounded-2xl relative flex flex-col min-h-[440px] overflow-hidden">
          
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-black/80 border border-white/10 p-2 px-3 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">Iteration count</span>
              <span className="text-lg font-mono font-bold text-white mt-1 block">
                {String(currentIteration).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 text-[11px] text-slate-400">
            <span className="bg-black/80 border border-white/10 p-1.5 px-2.5 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Click on routers or Link Up state to simulate failures dynamically!
            </span>
          </div>

          {/* SVG canvas mapping topological router vectors */}
          <div className="flex-1 bg-[radial-gradient(circle_at_center,_#11152a_0%,_#09090b_85%)] flex items-center justify-center p-4">
            <svg className="w-full h-[360px]" viewBox="0 0 520 300">
              
              {/* Draw topology links */}
              {links.map(link => {
                const s = routers.find(r => r.id === link.source)!;
                const t = routers.find(r => r.id === link.target)!;
                if (!s || !t) return null;

                return (
                  <g key={link.id}>
                    <line 
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={link.failed ? "#ef4444" : "#1e293b"}
                      strokeWidth={link.failed ? 2 : 3}
                      strokeDasharray={link.failed ? "4 4" : "none"}
                      className="transition-all"
                    />

                    {/* Cost sticker */}
                    {!link.failed && (
                      <g transform={`translate(${(s.x + t.x) / 2}, ${(s.y + t.y) / 2})`}>
                        <rect x="-10" y="-8" width="20" height="15" rx="3" fill="#030712" stroke="#1e293b" />
                        <text textAnchor="middle" dy="3.5" fontSize="9" fill="#94a3b8" fontFamily="monospace" fontWeight="bold">
                          {link.cost}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Draw animated update packet markers */}
              {messages.map((m) => {
                const s = routers.find(r => r.id === m.from)!;
                const t = routers.find(r => r.id === m.to)!;
                if (!s || !t) return null;

                // Derive interpolated position based on progression value (0 to 1)
                const packetX = s.x + (t.x - s.x) * m.progress;
                const packetY = s.y + (t.y - s.y) * m.progress;

                return (
                  <circle 
                    key={m.id}
                    cx={packetX}
                    cy={packetY}
                    r="5"
                    fill="#818cf8"
                    className="animate-pulse filter drop-shadow-[0_0_5px_#818cf8]"
                  />
                );
              })}

              {/* Draw routers nodes with interactive fail flag on click */}
              {routers.map(router => {
                return (
                  <g 
                    key={router.id}
                    transform={`translate(${router.x}, ${router.y})`}
                    className="cursor-pointer select-none group"
                    onClick={() => handleToggleRouterFail(router.id)}
                  >
                    {/* Ring glow indicators */}
                    <circle 
                      r="22"
                      fill={router.failed ? "#1f1212" : "#0d1127"}
                      stroke={router.failed ? "#ef4444" : "#4f46e5"}
                      strokeWidth={router.failed ? 2.5 : 2}
                      className="gnode-circle transition-colors group-hover:scale-110 duration-200"
                      data-node-id={router.id}
                      data-state={router.failed ? "failed" : "active"}
                    />

                    {/* Label inside R1, R2, etc */}
                    <text 
                      textAnchor="middle" 
                      dy="4" 
                      fontSize="10" 
                      fontWeight="bold" 
                      fill={router.failed ? "#f87171" : "#ffffff"}
                      className="gnode-text"
                      data-state={router.failed ? "failed" : "active"}
                    >
                      {router.id}
                    </text>

                    {/* Small tag tag specifying connection up/failed */}
                    {router.failed && (
                      <g transform="translate(0, 31)">
                        <rect x="-18" y="-7" width="36" height="13" rx="3" fill="#ef4444" />
                        <text textAnchor="middle" dy="2.5" fontSize="8" fill="#ffffff" fontWeight="extrabold">DOWN</text>
                      </g>
                    )}
                  </g>
                );
              })}

            </svg>
          </div>

          <div className="bg-black/60 border-t border-white/10 p-4 font-mono text-xs flex justify-between items-center">
            <span className="text-slate-500">Routing algorithm engine: Distance Vector</span>
            <span className="text-indigo-400 font-bold">&#123; Split Horizon: {splitHorizon ? 'ON' : 'OFF'} &#123;</span>
          </div>
        </div>

        {/* Right Panel: Selected router live tables layout lookup */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Active Router Tables</h3>
            
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {routers.map(router => {
                if (router.failed) {
                  return (
                    <div key={router.id} className="p-3 border border-red-500/10 rounded-xl bg-red-500/5 flex items-center gap-2 text-xs text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{router.name} (Down)</span>
                    </div>
                  );
                }

                const table = routingTables[router.id] || {};

                return (
                  <div key={router.id} className="p-3.5 border border-white/5 rounded-xl bg-black/40">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/5">
                      <span className="font-bold text-xs text-indigo-300">{router.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase font-mono tracking-wider">Tables Active</span>
                    </div>

                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="text-slate-500 uppercase text-[8px]">
                          <th className="p-1">Dest</th>
                          <th className="p-1">Cost</th>
                          <th className="p-1">Next</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {routers.filter(r => !r.failed).map(dest => {
                          const entry = table[dest.id];
                          const costDisplay = entry?.cost === Infinity ? "∞" : entry?.cost ?? "-";
                          const nextHopDisplay = entry?.nextHop ?? "-";

                          return (
                            <tr key={dest.id} className={dest.id === router.id ? 'opacity-40' : ''}>
                              <td className="p-1 font-bold">{dest.id}</td>
                              <td className="p-1 text-amber-400 font-bold">{costDisplay}</td>
                              <td className="p-1 font-semibold text-slate-400">{nextHopDisplay}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* NETWORKING INSIGHT PANEL THEORY */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h4 className="font-semibold text-white text-sm">Count-To-Infinity Scenario</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a link goes downstream completely, routers can start bouncing advertisements back and forth because they trust their neighbors' old routing updates. If Split Horizon is disabled, routers calculate: A can reach D via B, while B thinks it can reach D via A. They update vectors incrementally up to mathematical infinity loops.
            </p>
          </div>
          <div className="mt-4 p-2 bg-black/30 rounded-lg text-[10px] text-slate-500 font-mono text-center border border-white/5">
            RIP boundary limit: 15 hops (16 = absolute unreachable infinity value)
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h4 className="font-semibold text-white text-sm">Split Horizon Mitigation</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A straightforward routing logic design rule: If router A learns about a route to destination destination y through neighbor B, router A will never advertise that same y route vector back to B in subsequent updates. This stops simple two-node ping-pong routing loops instantly.
            </p>
          </div>
          <div className="mt-4 p-2 bg-black/30 rounded-lg text-[10px] text-slate-500 font-mono text-center border border-white/5">
            Table advertisement excludes recipient interface nodes.
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h4 className="font-semibold text-white text-sm">Poison Reverse Technique</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Poison Reverse is an active extension of split horizon. Instead of staying completely silent, router A actively advertises a cost of infinity (e.g. 16) for destination y back to router B. This explicitly declares the path unusable, forcing B to tear down loops immediately rather than letting outdated tables persist.
            </p>
          </div>
          <div className="mt-4 p-2 bg-black/30 rounded-lg text-[10px] text-slate-500 font-mono text-center border border-white/5">
            Vector table cost is set to infinity (16) on receipt.
          </div>
        </div>

      </div>

    </div>
  );
}
