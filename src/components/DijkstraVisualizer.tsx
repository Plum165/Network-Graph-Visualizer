import React, { useState, useEffect, useRef } from "react";
import { GNode, GEdge } from "../types";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Plus, Trash2, Sliders, PlayCircle, HelpCircle, Check, MapPin, Eye, BookOpen } from "lucide-react";
import { dijkstraLesson, practiceQuestions } from "../data/lessons";

export default function DijkstraVisualizer() {
  // Predefined graph nodes
  const defaultNodes: GNode[] = [
    { id: "A", name: "Router A", x: 80, y: 150 },
    { id: "B", name: "Router B", x: 220, y: 70 },
    { id: "C", name: "Router C", x: 220, y: 230 },
    { id: "D", name: "Router D", x: 380, y: 70 },
    { id: "E", name: "Router E", x: 380, y: 230 },
    { id: "F", name: "Router F", x: 500, y: 150 }
  ];

  const defaultEdges: GEdge[] = [
    { id: "e1", source: "A", target: "B", weight: 4, isDirected: false },
    { id: "e2", source: "A", target: "C", weight: 7, isDirected: false },
    { id: "e3", source: "B", target: "C", weight: 2, isDirected: false },
    { id: "e4", source: "B", target: "D", weight: 5, isDirected: false },
    { id: "e5", source: "C", target: "D", weight: 1, isDirected: false },
    { id: "e6", source: "C", target: "E", weight: 8, isDirected: false },
    { id: "e7", source: "D", target: "E", weight: 3, isDirected: false },
    { id: "e8", source: "D", target: "F", weight: 6, isDirected: false },
    { id: "e9", source: "E", target: "F", weight: 2, isDirected: false }
  ];

  const [nodes, setNodes] = useState<GNode[]>(() => {
    const cached = localStorage.getItem("dijkstra_nodes");
    return cached ? JSON.parse(cached) : defaultNodes;
  });

  const [edges, setEdges] = useState<GEdge[]>(() => {
    const cached = localStorage.getItem("dijkstra_edges");
    return cached ? JSON.parse(cached) : defaultEdges;
  });

  // State persist
  useEffect(() => {
    localStorage.setItem("dijkstra_nodes", JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem("dijkstra_edges", JSON.stringify(edges));
  }, [edges]);

  // UI state
  const [startNode, setStartNode] = useState<string>("A");
  const [destNode, setDestNode] = useState<string>("F");
  const [animationSpeed, setAnimationSpeed] = useState<number>(1000); // ms per step
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  // Dijkstra compiled steps
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [finalPath, setFinalPath] = useState<string[] | null>(null);

  // Active inputs / editor values
  const [nodeInputId, setNodeInputId] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newEdgeSource, setNewEdgeSource] = useState<string>("");
  const [newEdgeTarget, setNewEdgeTarget] = useState<string>("");
  const [newEdgeWeight, setNewEdgeWeight] = useState<number>(5);
  const [newEdgeDirected, setNewEdgeDirected] = useState<boolean>(false);

  // Selected item inside practice questions state
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [predictorEndNode, setPredictorEndNode] = useState<string>("F");
  const [userPathPrediction, setUserPathPrediction] = useState<string>("");
  const [predictionFeedback, setPredictionFeedback] = useState<string>("");

  // Refs for tracking drag/drop of nodes in the SVG canvas workspace
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Recompute full steps when nodes, edges, or start/destination modifications take place
  useEffect(() => {
    recalculateSteps();
  }, [nodes, edges, startNode, destNode]);

  const recalculateSteps = () => {
    if (nodes.length === 0) return;
    
    // Safety check start node
    const validStart = nodes.some(n => n.id === startNode) ? startNode : nodes[0]?.id;
    if (validStart !== startNode) {
      setStartNode(validStart);
      return;
    }

    const calculated = computeDijkstraSteps(nodes, edges, validStart, destNode);
    setSteps(calculated.steps);
    setFinalPath(calculated.finalPath);
    setCurrentStepIndex(0);
  };

  // Dijkstra Step-By-Step Simulator Builder
  const computeDijkstraSteps = (
    graphNodes: GNode[], 
    graphEdges: GEdge[], 
    srcId: string, 
    terminalId: string
  ) => {
    const algorithmSteps: any[] = [];
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const visited = new Set<string>();
    
    // Init state
    graphNodes.forEach(node => {
      dist[node.id] = Infinity;
      prev[node.id] = null;
    });
    dist[srcId] = 0;

    let pq: Array<{ node: string; dist: number }> = [{ node: srcId, dist: 0 }];

    // Snapshot 0
    algorithmSteps.push({
      currentNodeId: null,
      visited: new Set(visited),
      distances: { ...dist },
      previous: { ...prev },
      queue: [...pq],
      description: `Starting path calculation from source ${srcId}. Marked path cost to ${srcId} as 0, and all other nodes to infinity (∞).`
    });

    while (pq.length > 0) {
      // Sort to mimic min-priority queue behavior
      pq.sort((x, y) => x.dist - y.dist);
      const current = pq.shift()!;
      const u = current.node;

      if (visited.has(u)) continue;

      // Unvisited current processing node selected
      visited.add(u);

      algorithmSteps.push({
        currentNodeId: u,
        visited: new Set(visited),
        distances: { ...dist },
        previous: { ...prev },
        queue: [...pq],
        description: `Inspecting Node ${u} from the priority queue because it has the absolute minimum tentative distance (${dist[u]}). Marked it as visited.`
      });

      // Find connections
      const localEdges = graphEdges.filter(e => {
        if (e.isDirected) {
          return e.source === u;
        } else {
          return e.source === u || e.target === u;
        }
      });

      for (const edge of localEdges) {
        // Find opposite vertex
        const v = edge.source === u ? edge.target : edge.source;
        if (visited.has(v)) continue;

        const currentWeight = edge.weight;
        const alternativeCost = dist[u] + currentWeight;

        if (alternativeCost < dist[v]) {
          const originalCost = dist[v];
          dist[v] = alternativeCost;
          prev[v] = u;

          // Push/Merge state in queue
          pq = pq.filter(item => item.node !== v);
          pq.push({ node: v, dist: alternativeCost });
          pq.sort((x, y) => x.dist - y.dist);

          algorithmSteps.push({
            currentNodeId: u,
            visited: new Set(visited),
            distances: { ...dist },
            previous: { ...prev },
            queue: [...pq],
            description: `Relaxed connection between ${u} and ${v} (weight: ${currentWeight}). New calculation: ${dist[u]} (dist ${u}) + ${currentWeight} = ${alternativeCost}. Since ${alternativeCost} is less than ${originalCost === Infinity ? 'infinity' : originalCost}, updated Route to ${v} through ${u}.`
          });
        }
      }
    }

    // Path tracing to destination
    let path: string[] | null = null;
    if (dist[terminalId] !== Infinity) {
      path = [];
      let temp: string | null = terminalId;
      while (temp !== null) {
        path.unshift(temp);
        temp = prev[temp];
      }
    }

    // Final outcome snapshot
    algorithmSteps.push({
      currentNodeId: null,
      visited: new Set(visited),
      distances: { ...dist },
      previous: { ...prev },
      queue: [],
      description: path 
        ? `Simulation completed successfully! Optimal pathway found: [ ${path.join(" ➔ ")} ] with a total cost of ${dist[terminalId]}.` 
        : `Dijkstra completed. Destination ${terminalId} is unreachable from Source ${srcId}.`
    });

    return { steps: algorithmSteps, finalPath: path };
  };

  // Navigation handlers
  const stepNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
    }
  };

  const stepBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const triggerReset = () => {
    setIsRunning(false);
    setCurrentStepIndex(0);
  };

  // Auto step timer
  useEffect(() => {
    let timerId: any = null;
    if (isRunning) {
      timerId = setInterval(() => {
        stepNext();
      }, animationSpeed);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRunning, currentStepIndex, steps, animationSpeed]);

  // SVG node interactions: Drag & Drop Position Updater
  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Scale viewport coordinates correctly
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x, y } : n));
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Simple Graph builders
  const handleAddNode = () => {
    const id = nodeInputId.trim().toUpperCase();
    if (!id) return;
    if (nodes.some(n => n.id === id)) {
      alert("Node ID already exists in this graph.");
      return;
    }
    const newNode: GNode = {
      id,
      name: `Router ${id}`,
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 200
    };
    setNodes(prev => [...prev, newNode]);
    setNodeInputId("");
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleAddEdge = () => {
    if (!newEdgeSource || !newEdgeTarget) return;
    if (newEdgeSource === newEdgeTarget) {
      alert("Source and target nodes cannot be the same.");
      return;
    }
    // Check if edge already exists
    const exists = edges.some(
      e => (e.source === newEdgeSource && e.target === newEdgeTarget) || 
           (!e.isDirected && e.source === newEdgeTarget && e.target === newEdgeSource)
    );
    if (exists) {
      alert("An link or edge already exists between these two routers.");
      return;
    }

    const newEdge: GEdge = {
      id: `e_${newEdgeSource}_${newEdgeTarget}_${Date.now()}`,
      source: newEdgeSource,
      target: newEdgeTarget,
      weight: newEdgeWeight,
      isDirected: newEdgeDirected
    };

    setEdges(prev => [...prev, newEdge]);
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  };

  const handleRestoreDefaultGraph = () => {
    setNodes(defaultNodes);
    setEdges(defaultEdges);
    setStartNode("A");
    setDestNode("F");
    setSelectedNodeId(null);
    setCurrentStepIndex(0);
  };

  // Interactive Predictor Section
  const handleCheckPrediction = () => {
    if (!nodes.some(n => n.id === predictorEndNode)) return;
    const calc = computeDijkstraSteps(nodes, edges, startNode, predictorEndNode);
    if (!calc.finalPath) {
      setPredictionFeedback("Calculated: There is no valid pathway between start and end!");
      return;
    }
    const realOptimalPathString = calc.finalPath.join("->").toUpperCase().replace(/\s/g, "");
    const userClean = userPathPrediction.toUpperCase().replace(/[\s->,➔]/g, "");

    if (userClean === realOptimalPathString) {
      setPredictionFeedback("🎉 Outstanding! Your predicted path is 100% accurate and yields the shortest distance!");
    } else {
      setPredictionFeedback(`❌ Incorrect. The actual optimal path to ${predictorEndNode} is: ${calc.finalPath.join(" ➔ ")} with a total cost of ${calc.steps[calc.steps.length - 1].distances[predictorEndNode]}. Keep learning and try again!`);
    }
  };

  // Rendering Helper to map values
  const currentStep = steps[currentStepIndex] || {
    currentNodeId: null,
    visited: new Set<string>(),
    distances: {},
    previous: {},
    queue: [],
    description: "Initialize variables."
  };

  const isOptimalEdge = (edge: GEdge) => {
    if (!finalPath) return false;
    // Check if edge elements are sequentially matching path list
    for (let i = 0; i < finalPath.length - 1; i++) {
      const u = finalPath[i];
      const v = finalPath[i + 1];
      if ((edge.source === u && edge.target === v) || 
          (!edge.isDirected && edge.source === v && edge.target === u)) {
        return true;
      }
    }
    return false;
  };

  // Determine SVG styling classes according to node execution status
  const getNodeColorClass = (nodeId: string) => {
    if (currentStep.currentNodeId === nodeId) {
      return {
        fill: "#1e1b4b",
        stroke: "#6366f1", // active indigo pulse
        strokeWidth: 3,
        glow: "drop-shadow-[0_0_12px_rgba(99,102,241,1)]"
      };
    }
    if (finalPath?.includes(nodeId) && currentStepIndex === steps.length - 1) {
      return {
        fill: "#064e3b", // solid emerald route
        stroke: "#10b981", 
        strokeWidth: 3,
        glow: "drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
      };
    }
    if (currentStep.visited.has(nodeId)) {
      return {
        fill: "#111827",
        stroke: "#4338ca", // visited indigo
        strokeWidth: 2,
        glow: ""
      };
    }
    if (currentStep.queue.some((item: any) => item.node === nodeId)) {
      return {
        fill: "#2d3748",
        stroke: "#eab308", // frontier yellow
        strokeWidth: 2,
        glow: "drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]"
      };
    }
    return {
      fill: "#09090b",
      stroke: "#4b5563", // unvisited border
      strokeWidth: 1.5,
      glow: ""
    };
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100">
      
      {/* SECTION HEADER THEORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-semibold tracking-tight text-white">{dijkstraLesson.title}</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {dijkstraLesson.whatIsIt}
          </p>
          
          <div className="mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-2">Relational Math Notation</h4>
            <p className="text-sm font-mono text-indigo-200">
              {dijkstraLesson.formula}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              At iteration steps, the shortest distance cost elements are dynamically adjusted by mapping neighbor values recursively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Why Does It Matter?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{dijkstraLesson.whyItMatters}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Real-World Application Protocols</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                {dijkstraLesson.whereUsed.map((use, idx) => (
                  <li key={idx}><span className="text-slate-300">{use}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Legend Panel & Fast Control */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide mb-4">Visual State Reference</h3>
            <ul className="space-y-3.5">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border border-gray-600 bg-black flex items-center justify-center text-[9px] font-mono text-gray-500">Un</span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-300">Unvisited Node</p>
                  <p className="text-[10px] text-slate-500">Starting state of routers on map</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border border-yellow-500 bg-yellow-500/10 flex items-center justify-center text-[10px] font-mono text-yellow-400 font-bold">Q</span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-300">Frontier Priority Queue</p>
                  <p className="text-[10px] text-slate-500">Discovered neighbors pending routing selection</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-indigo-400 bg-indigo-950 flex items-center justify-center text-[10px] font-mono text-indigo-300 font-bold">Cur</span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-300">Currently Processing</p>
                  <p className="text-[10px] text-slate-500">Smallest distance node extracted from Queue</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border border-indigo-600 bg-indigo-950/40 flex items-center justify-center text-[10px] font-mono text-indigo-400">Vis</span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-300">Visited Nodes</p>
                  <p className="text-[10px] text-slate-500">Shortest cost finalized permanently</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border border-emerald-500 bg-emerald-900 flex items-center justify-center text-[10px] font-mono text-emerald-400 font-bold">✔</span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-300">Shortest Path Component</p>
                  <p className="text-[10px] text-slate-500">Part of calculated path to destination</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2 mt-4 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Nodes:</span>
              <span className="font-bold text-white">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Edges:</span>
              <span className="font-bold text-white">{edges.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Control Column */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Quick Simulation Trigger Parameters */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Simulation Controls</h3>
            </div>

            {/* Start / Dest Dropdowns */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Source</label>
                <select 
                  className="bg-black/40 border border-white/10 p-2 rounded-lg text-slate-200 outline-none focus:border-indigo-500"
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.id} ({n.name})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Destination</label>
                <select 
                  className="bg-black/40 border border-white/10 p-2 rounded-lg text-slate-200 outline-none focus:border-indigo-500"
                  value={destNode}
                  onChange={(e) => setDestNode(e.target.value)}
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.id} ({n.name})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Speed selection */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Step Delay</span>
                <span className="text-indigo-400 font-semibold">{animationSpeed / 1000}s</span>
              </div>
              <input 
                type="range" 
                min={200} 
                max={3000} 
                step={200}
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Run states */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isRunning 
                      ? "bg-amber-600 text-white hover:bg-amber-700" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isRunning ? "Pause" : "Auto Run"}
                </button>
                
                <button
                  onClick={triggerReset}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-slate-300"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Step Forward / Backward */}
              <div className="flex gap-2">
                <button
                  onClick={stepBack}
                  disabled={currentStepIndex === 0}
                  className="flex-1 py-1.5 px-3 bg-white/5 disabled:opacity-30 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={stepNext}
                  disabled={currentStepIndex === steps.length - 1}
                  className="flex-1 py-1.5 px-3 bg-white/5 disabled:opacity-30 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Restore Preset Graph */}
            <button
              onClick={handleRestoreDefaultGraph}
              className="mt-1 w-full py-2 bg-slate-800 hover:bg-slate-700 text-[11px] font-mono tracking-wide rounded-lg text-slate-300 transition-colors border border-white/5"
            >
              Generate Example Graph
            </button>
          </div>

          {/* Interactive Graph Editing Panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Interactive Graph Editor
            </h3>
            
            {/* New Node Constructor */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Add Router Node</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. G"
                  value={nodeInputId}
                  onChange={(e) => setNodeInputId(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 p-1.5 rounded-lg text-xs text-slate-200 uppercase outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleAddNode}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* New Link/Edge Constructor */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Add Link/Edge</label>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px]">Source Node</span>
                  <select
                    value={newEdgeSource}
                    onChange={(e) => setNewEdgeSource(e.target.value)}
                    className="bg-black/40 border border-white/10 p-1 rounded-lg text-slate-200 outline-none"
                  >
                    <option value="">Select...</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.id}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px]">Target Node</span>
                  <select
                    value={newEdgeTarget}
                    onChange={(e) => setNewEdgeTarget(e.target.value)}
                    className="bg-black/40 border border-white/10 p-1 rounded-lg text-slate-200 outline-none"
                  >
                    <option value="">Select...</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 text-[10px]">Cost/Weight</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={newEdgeWeight}
                    onChange={(e) => setNewEdgeWeight(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-black/40 border border-white/10 p-1 rounded-lg text-slate-200 text-center outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="directed_cb"
                    checked={newEdgeDirected}
                    onChange={(e) => setNewEdgeDirected(e.target.checked)}
                    className="bg-black border-white/10 accent-indigo-500"
                  />
                  <label htmlFor="directed_cb" className="text-slate-400 text-[11px] select-none cursor-pointer">Directed</label>
                </div>
              </div>

              <button
                onClick={handleAddEdge}
                disabled={!newEdgeSource || !newEdgeTarget}
                className="w-full py-1.5 px-3 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold mt-2 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Link
              </button>
            </div>

            {/* Remove item options */}
            {nodes.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Active Element Pool</label>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {nodes.map(node => (
                    <div key={node.id} className="flex items-center justify-between text-xs bg-black/20 p-1 px-2 rounded border border-white/5">
                      <span className="text-slate-300 font-mono font-bold">{node.id} ({node.name})</span>
                      <button 
                        onClick={() => handleDeleteNode(node.id)}
                        className="text-red-400 hover:text-red-300 p-0.5"
                        title="Delete Router"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Central Visualization Area: SVG interactive canvas */}
        <div className="xl:col-span-2 bg-black/30 border border-white/10 rounded-2xl relative flex flex-col min-h-[450px] overflow-hidden">
          
          {/* Timeline counter block */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-black/75 border border-white/10 p-2.5 px-4 rounded-xl flex flex-col">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Iteration Node</span>
              <span className="text-xl font-mono font-bold text-white mt-1">
                {currentStep.currentNodeId ? currentStep.currentNodeId : "➔"}
              </span>
            </div>
            
            <div className="bg-black/75 border border-white/10 p-2.5 px-4 rounded-xl flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none text-right">Step</span>
              <span className="text-xl font-mono font-bold text-white mt-1 text-right">
                {String(currentStepIndex + 1).padStart(2, "0")} <span className="text-slate-600 text-[11px]">/ {steps.length}</span>
              </span>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={() => alert("Interactive Manual drag & drop: Click on nodes and slide your mouse/cursor to reorganize nodes inside the Canvas!")}
              className="bg-black/60 hover:bg-black/80 text-xs text-slate-400 hover:text-white border border-white/10 p-1.5 px-2.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Drag nodes to reposition
            </button>
          </div>

          {/* Canvas SVG Graph */}
          <div className="flex-1 bg-[radial-gradient(circle_at_center,_#121021_0%,_#09090b_85%)] flex items-center justify-center p-4">
            <svg 
              ref={canvasRef}
              className="w-full h-[360px] md:h-[400px] select-none"
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              <defs>
                {/* Arrow heads for directed links */}
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="30"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563" />
                </marker>
                
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="30"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
              </defs>

              {/* DRAW CONNECTIONS (EDGES) */}
              {edges.map((edge) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isActive = isOptimalEdge(edge) && currentStepIndex === steps.length - 1;
                const isVisitedNodeEdge = currentStep.visited.has(edge.source) && currentStep.visited.has(edge.target);

                return (
                  <g key={edge.id} className="transition-all duration-300">
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={
                        isActive 
                          ? "#10b981" // optimal path
                          : isVisitedNodeEdge
                          ? "#4a5168" // resolved
                          : "#334155" // default grey/dark
                      }
                      strokeWidth={isActive ? 4 : isVisitedNodeEdge ? 2 : 1.5}
                      markerEnd={edge.isDirected ? `url(#${isActive ? 'arrow-active' : 'arrow'})` : undefined}
                      className={isActive ? "stroke-dasharray-none" : undefined}
                    />

                    {/* Weight badge in the absolute midpoint */}
                    <g transform={`translate(${(sourceNode.x + targetNode.x) / 2}, ${(sourceNode.y + targetNode.y) / 2})`}>
                      <rect
                        x="-11"
                        y="-10"
                        width="22"
                        height="18"
                        rx="4"
                        fill="#0b0f19"
                        stroke={isActive ? "#10b981" : "#1e293b"}
                        strokeWidth={1}
                        className="transition-all"
                      />
                      <text
                        textAnchor="middle"
                        dy="3"
                        fill={isActive ? "#34d399" : "#94a3b8"}
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {edge.weight}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* DRAW ROUTERS (NODES) */}
              {nodes.map((node) => {
                const nodeStyle = getNodeColorClass(node.id);
                const cost = currentStep.distances[node.id];
                const prev = currentStep.previous[node.id];

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-move group"
                    onMouseDown={() => setDraggingNodeId(node.id)}
                  >
                    {/* Pulsing ring for selected active node */}
                    {currentStep.currentNodeId === node.id && (
                      <circle 
                        r="25"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        className="animate-ping opacity-60"
                      />
                    )}

                    {/* Base circle background shadow */}
                    <circle 
                      r="19" 
                      fill={nodeStyle.fill} 
                      stroke={nodeStyle.stroke} 
                      strokeWidth={nodeStyle.strokeWidth}
                      className={`gnode-circle transition-all duration-300 ${nodeStyle.glow}`}
                      data-node-id={node.id}
                      data-state={
                        currentStep.currentNodeId === node.id 
                          ? "active" 
                          : (finalPath?.includes(node.id) && currentStepIndex === steps.length - 1)
                          ? "path"
                          : currentStep.visited.has(node.id)
                          ? "visited"
                          : currentStep.queue.some((item: any) => item.node === node.id)
                          ? "queue"
                          : "unvisited"
                      }
                    />

                    {/* Node Identifier Letter */}
                    <text 
                      textAnchor="middle" 
                      dy="4" 
                      fill={
                        currentStep.currentNodeId === node.id 
                          ? "#ffffff" 
                          : nodeStyle.stroke === "#4b5563" 
                          ? "#94a3b8" 
                          : "#f8fafc"
                      }
                      fontSize="12" 
                      fontWeight="extrabold"
                      fontFamily="sans-serif"
                      className="gnode-text"
                      data-state={
                        currentStep.currentNodeId === node.id 
                          ? "active" 
                          : (finalPath?.includes(node.id) && currentStepIndex === steps.length - 1)
                          ? "path"
                          : currentStep.visited.has(node.id)
                          ? "visited"
                          : currentStep.queue.some((item: any) => item.node === node.id)
                          ? "queue"
                          : "unvisited"
                      }
                    >
                      {node.id}
                    </text>

                    {/* Small distance cost floating label */}
                    <g transform="translate(0, 31)">
                      <rect 
                        x="-20" 
                        y="-8" 
                        width="40" 
                        height="14" 
                        rx="3" 
                        fill="#030712" 
                        stroke="#1e293b" 
                        strokeWidth="0.5"
                      />
                      <text 
                        textAnchor="middle" 
                        fill={cost === Infinity ? "#ef4444" : "#a5b4fc"}
                        fontSize="9" 
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {cost === Infinity ? "∞" : `d:${cost}`}
                      </text>
                    </g>

                    {/* Hover info tooltip box */}
                    <title>{`${node.name}\nCost: ${cost === Infinity ? 'infinity' : cost}\nParent: ${prev || 'None'}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Stepper active walkthrough log explainers */}
          <div className="bg-black/60 border-t border-white/10 p-5 mt-auto">
            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Live Process Insight</h4>
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
              <p className="text-xs text-indigo-200/90 leading-relaxed font-sans min-h-[44px]">
                {currentStep.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Data Sidebar Panel */}
        <div className="xl:col-span-1 flex flex-col gap-6">

          {/* Priority Queue state component */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Min-Priority Queue (PQ)</h3>
            
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {currentStep.queue.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-black/20 text-slate-500 text-xs italic">
                  Queue Empty
                </div>
              ) : (
                currentStep.queue.map((item: any, idx: number) => (
                  <div 
                    key={item.node}
                    className={`flex justify-between items-center p-2 px-3 rounded-lg text-xs font-mono transition-all ${
                      idx === 0 
                        ? "bg-indigo-500/25 border border-indigo-500/40 text-indigo-100 font-bold" 
                        : "bg-white/5 border border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'}`}></span>
                      <span>Router {item.node}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${idx === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      DIST: {item.dist}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <p className="text-[10px] text-slate-500 mt-2.5 leading-relaxed">
              Dijkstra continuously extracts the top item (with the minimum cost metric) to lock in the optimal shortest destination routing.
            </p>
          </div>

          {/* Live routing and distance values lookup */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Distance & Predecessor Table</h3>
            
            <div className="rounded-xl border border-white/10 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-slate-400 font-semibold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="p-2 border-b border-white/10">Node</th>
                    <th className="p-2 border-b border-white/10">Distance</th>
                    <th className="p-2 border-b border-white/10">Previous</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                  {nodes.map((node) => {
                    const cost = currentStep.distances[node.id];
                    const prev = currentStep.previous[node.id];
                    const isCurrent = currentStep.currentNodeId === node.id;
                    const isVisited = currentStep.visited.has(node.id);

                    return (
                      <tr 
                        key={node.id} 
                        className={`transition-colors ${
                          isCurrent 
                            ? "bg-indigo-500/20 text-white font-bold" 
                            : isVisited 
                            ? "bg-white/[0.02] text-slate-200" 
                            : "text-slate-500"
                        }`}
                      >
                        <td className="p-2 flex items-center gap-1">
                          <span>{node.id}</span>
                          {isCurrent && <span className="text-[10px] text-indigo-400 font-sans italic font-normal">(curr)</span>}
                        </td>
                        <td className="p-2 font-bold">
                          {cost === Infinity ? (
                            <span className="text-red-400/80">∞</span>
                          ) : (
                            <span className="text-indigo-400">{cost}</span>
                          )}
                        </td>
                        <td className="p-2 italic text-slate-400">{prev || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-2 bg-black/20 rounded-lg text-[10px] text-slate-500 font-sans">
              * Infinity (∞) represents unreached routers waiting for relaxation.
            </div>
          </div>
        </div>
      </div>

      {/* PRACTICE EXERCISE WORKSPACE */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Practice prediction questions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
          <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            Concept Reinforcement Practice
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Test your understanding of Link-State state calculations using our built-in interactive questions.
          </p>

          <div className="space-y-4">
            {practiceQuestions.map((item, qIdx) => {
              const selectedOpt = practiceAnswers[item.id];
              return (
                <div key={item.id} className="p-4 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider">QUESTION {qIdx + 1}</span>
                  <p className="text-xs text-slate-200 mt-1 mb-3 font-medium">{item.question}</p>
                  
                  <div className="space-y-1.5 text-xs">
                    {item.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => setPracticeAnswers(prev => ({ ...prev, [item.id]: oIdx }))}
                        className={`w-full text-left p-2.5 px-3 rounded-lg border transition-all flex items-center justify-between ${
                          selectedOpt === oIdx 
                            ? "bg-indigo-600/20 border-indigo-500 text-white" 
                            : "bg-white/5 border-white/5 hover:border-white/10 text-slate-300"
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedOpt === oIdx && <Check className="w-4 h-4 text-indigo-400" />}
                      </button>
                    ))}
                  </div>

                  {selectedOpt !== undefined && (
                    <div className="mt-3">
                      <details className="text-xs bg-indigo-950/30 p-3 rounded-lg border border-indigo-500/20 cursor-pointer">
                        <summary className="font-semibold text-indigo-300">
                          {selectedOpt === item.answerIndex ? "🎉 Correct! View Explanation" : "❌ Incorrect. Click here to see why"}
                        </summary>
                        <p className="text-slate-300 mt-2 leading-relaxed">
                          {item.explanation}
                        </p>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prediction Simulator Sandbox */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Path Prediction Simulator Sandbox
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Build a graph, select start and destination parameters, then challenge yourself to write down the exact shortest path nodes list before calculating.
            </p>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-300 font-semibold">Predicted Destination Target Node:</span>
                  <select
                    value={predictorEndNode}
                    onChange={(e) => setPredictorEndNode(e.target.value)}
                    className="bg-black/40 border border-white/10 p-2 rounded-lg text-slate-200"
                  >
                    {nodes.filter(n => n.id !== startNode).map(n => (
                      <option key={n.id} value={n.id}>{n.id}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-300 font-semibold">Starting point is:</span>
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 rounded-lg">
                    Router Node {startNode}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-slate-300 font-semibold">Your Predicted Shortest Pathway:</span>
                <input
                  type="text"
                  placeholder="e.g. A -> C -> D -> F"
                  value={userPathPrediction}
                  onChange={(e) => setUserPathPrediction(e.target.value)}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-lg text-slate-200 outline-none text-sm placeholder:text-slate-600 font-mono"
                />
                <span className="text-[10px] text-slate-500 leading-none mt-0.5">
                  Format: Enter letters separated by arrows or commas {"(A->C->F)"}.
                </span>
              </div>

              <button
                onClick={handleCheckPrediction}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-lg"
              >
                Validate My Route Prediction
              </button>

              {predictionFeedback && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-1.5">Sandbox Evaluation:</h4>
                  <p className="text-slate-300 leading-relaxed font-sans">{predictionFeedback}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20 text-xs text-slate-400 mt-6 md:mt-0">
            <h4 className="font-bold text-indigo-300 mb-1">Dijkstra's Guarantee:</h4>
            <span>Once the algorithm sets a node as "visited", we are mathematically guaranteed to have discovered the absolute minimum cost path to that node. This is because we search out incrementally, expanding the closet points first.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
