import React, { useState } from "react";
import { HelpCircle, Terminal, FileText, ChevronRight, Check } from "lucide-react";

export default function DocumentationTabs() {
  const [activeSubTab, setActiveSubTab] = useState<"user" | "dev">("user");

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 text-slate-200">
      
      {/* Tab Switcher Headers */}
      <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl self-start text-xs">
        <button
          onClick={() => setActiveSubTab("user")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${activeSubTab === "user" ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <HelpCircle className="w-4 h-4" /> User Guide
        </button>
        <button
          onClick={() => setActiveSubTab("dev")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${activeSubTab === "dev" ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <Terminal className="w-4 h-4" /> Developer Guide
        </button>
      </div>

      {activeSubTab === "user" ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur shadow-2xl space-y-6">
          
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">LEARNING PLATFORM MANUAL</span>
            <h3 className="text-xl font-semibold text-white">How To Use the Educational Simulations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-400 border-b border-indigo-500/15 pb-1 flex items-center gap-1.5Packed">
                <ChevronRight className="w-4 h-4" /> 
                1. Navigating Dijkstra Shortest Path
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">A.</span>
                  <span><strong>Select Endpoints:</strong> Use the Source & Destination dropdown elements to choose starting and terminating routers on the map topology.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">B.</span>
                  <span><strong>Interactive Dragging:</strong> Left-click any router node inside the SVG canvas and move your mouse to dynamically reposition the layout nodes.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">C.</span>
                  <span><strong>Custom Link Editing:</strong> Add nodes or modify link costs using the Interactive Graph Editor. Changes instantly trigger distance recalculations.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">D.</span>
                  <span><strong>Simulation Triggers:</strong> Use Step Mode ("Next" and "Back" buttons) to analyze intermediate priority queue choices, or enable "Auto Run" continuous calculation.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-emerald-400 border-b border-emerald-500/15 pb-1 flex items-center gap-1.5">
                <ChevronRight className="w-4 h-4" /> 
                2. Navigating Distance Vector Routing
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">A.</span>
                  <span><strong>Packet Visualization:</strong> Watch animated data packet markers travel of links during neighbor updates to represent vector transmissions.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">B.</span>
                  <span><strong>Interactive Link Failures:</strong> Force link failures on demand by clicking physical node connections, triggering recalculation vectors in real time!</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">C.</span>
                  <span><strong>Loop Protections:</strong> Enable or disable Split Horizon configurations and see how count-to-infinity loop bugs develop in physical network architectures!</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">D.</span>
                  <span><strong>Convergence Monitor:</strong> Check router routing tables live. When convergence occurs, a green state notification declares "Network Converged".</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 space-y-1 mt-4">
            <h5 className="font-bold text-slate-200">💡 Performance tip:</h5>
            <p>Adjust the speed delay sliders as needed. Lower delays (e.g. 500ms) yield speedy compilations, and higher values permit meticulous analysis of the state tables.</p>
          </div>

        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur shadow-2xl space-y-6">
          
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">ARCHITECTURAL SCHEMATICS</span>
            <h3 className="text-xl font-semibold text-white">Software Architecture & Engine Flows</h3>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-indigo-300">
              <span className="font-semibold text-white">Engine Specifications:</span>
              <ul className="list-disc list-inside space-y-1.5 mt-2.5 text-slate-300">
                <li><strong className="text-white">State Isolation:</strong> Full separation between topology model updates (nodes/links) and the simulation step compilation history buffer. This yields flawless step-back caching.</li>
                <li><strong className="text-white">Dynamic SVG Canvas:</strong> Coordinates rendering inside modular SVG structures with standard HTML event handles allowing instant click adjustments and coordinate recalculation triggers.</li>
                <li><strong className="text-white">Heuristics Loop:</strong> Custom Bellman-Ford processor simulating actual routing advertisements including Split Horizon masking and Poison Reverse priority updates.</li>
                <li><strong className="text-white">Offline Caching:</strong> Persistent state caching via React dynamic `localStorage` binds, preventing work loss. Registering high reliability progressive service workers for instant load times.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="font-bold text-slate-300 mb-2">Extension Points: Custom Algorithms</h4>
                <p className="text-slate-400 leading-relaxed">
                  The visualization engine exposes simple entry interfaces `computeDijkstraSteps` and `stepVectorExchange`. Developers can easily inherit properties to implement additional routing algorithms such as A* Pathfinding or Link-state flooding.
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="font-bold text-slate-300 mb-2">Accessibility-First Standards</h4>
                <p className="text-slate-400 leading-relaxed">
                  Compliant with accessibility guidelines: uses high contrast dark canvases, labeled buttons, keyboard navigation support, and colored indicators backed by clear text descriptions to ensure seamless accessibility for all learners.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
