import React, { useState } from "react";
import { CheckCircle2, ShieldQuestion, Shuffle, Sparkles, Network } from "lucide-react";

export default function ComparisonSection() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const comparisons = [
    {
      feature: "Algorithm Type",
      dij: "Link-State Algorithm (Global optimization)",
      dv: "Distance Vector Algorithm (Decentralized, local neighbors)",
      category: "core"
    },
    {
      feature: "Network Map Knowledge",
      dij: "Complete network topology known beforehand. Every router possesses a full map of all other routers and linking connections.",
      dv: "Decentralized. Routers only know physical neighbor connections and their advertised pathways. No nodes see the complete map.",
      category: "core"
    },
    {
      feature: "Underlying Equation",
      dij: "Dijkstra Equation: dist(v) = min(dist(v), dist(u) + w(u,v))",
      dv: "Bellman-Ford Equation: Dx(y) = min_v { c(x,v) + Dv(y) }",
      category: "math"
    },
    {
      feature: "Asymptotic Complexity",
      dij: "O((V + E) log V) with Min-Priority queues where V is routers and E is links.",
      dv: "O(V * E) iterations required to solve full network convergence.",
      category: "math"
    },
    {
      feature: "Convergence Speed",
      dij: "Near-instantaneous local computation once Dijkstra computes maps.",
      dv: "Slow convergence. Prone to routing loops and count-to-infinity problems during dynamic failure corrections.",
      category: "perf"
    },
    {
      feature: "Protocol Implementation",
      dij: "OSPF (Open Shortest Path First) & IS-IS",
      dv: "RIP (Routing Information Protocol) & EIGRP & BGP (Path Vector subclass)",
      category: "core"
    },
    {
      feature: "Resource Consumption",
      dij: "Higher CPU and memory requirement to continuously parse graph calculations locally.",
      dv: "Minimal CPU load. Light message-passing loops make it lightweight for smaller routers.",
      category: "perf"
    },
    {
      feature: "Routing Loop Propensity",
      dij: "Extremely low. Each router computes loop-free shortest trees locally based on validated maps.",
      dv: "High risk of transient routing loops. Requires Split Horizon & Poison Reverse heuristics.",
      category: "stability"
    }
  ];

  const filteredComparisons = activeCategory === "all" 
    ? comparisons 
    : comparisons.filter(c => c.category === activeCategory);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 text-slate-100">
      
      {/* Intro info box */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
        <div className="flex items-center gap-3 mb-3">
          <Network className="w-6 h-6 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Pathfinding Paradigms: Link-State vs. Distance Vector</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Interior Gateway Protocols (IGPs) fall strictly into these two design families. While Dijkstra (Link-State) emphasizes absolute map transparency to calculate clean trees, Distance Vector relies recursively on regional neighbors to pass vectors of computed destinations.
        </p>
      </div>

      {/* Categories filters */}
      <div className="flex gap-1.5 p-1 bg-black/40 border border-white/5 rounded-xl self-center text-xs">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${activeCategory === "all" ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          All Features
        </button>
        <button
          onClick={() => setActiveCategory("core")}
          className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${activeCategory === "core" ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Core Architecture
        </button>
        <button
          onClick={() => setActiveCategory("perf")}
          className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${activeCategory === "perf" ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Performance & Resources
        </button>
        <button
          onClick={() => setActiveCategory("math")}
          className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${activeCategory === "math" ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Mathematics & Complexity
        </button>
      </div>

      {/* Comparison table panel */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-white/10 text-white font-bold border-b border-white/10">
              <th className="p-4 w-40">Feature Metric</th>
              <th className="p-4 border-l border-white/10 bg-indigo-500/5">Link State (Dijkstra)</th>
              <th className="p-4 border-l border-white/10 bg-emerald-500/5">Distance Vector (Bellman-Ford)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {filteredComparisons.map((c, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-slate-200">{c.feature}</td>
                <td className="p-4 border-l border-white/10 leading-relaxed font-sans text-slate-300">
                  {c.dij}
                </td>
                <td className="p-4 border-l border-white/10 leading-relaxed font-sans text-slate-300">
                  {c.dv}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights panel summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-1">When to choose Dijkstra?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use Dijkstra (Link-State) in larger, hierarchically designed enterprise networks where links hold rich capacities, and loops are completely unacceptable. Absolute map transparency prevents convergence latency when nodes go offline.
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Shuffle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-1">When to choose Distance Vector?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use Distance Vector inside simpler corporate networks or decentralized autonomous contexts like the wide internet's Border Gateway Protocol (BGP). It scales easily because nodes only trade tables with immediate physical neighbors, staying completely lightweight.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
