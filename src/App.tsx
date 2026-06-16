import React, { useState, useEffect } from "react";
import { BookOpen, Network, HelpCircle, Laptop, RefreshCw, Palette } from "lucide-react";
import DijkstraVisualizer from "./components/DijkstraVisualizer";
import DistanceVectorVisualizer from "./components/DistanceVectorVisualizer";
import ComparisonSection from "./components/ComparisonSection";
import DocumentationTabs from "./components/DocumentationTabs";

type TabType = "dijkstra" | "distance-vector" | "compare" | "docs";

interface ThemeOption {
  id: string;
  name: string;
  type: "light" | "dark";
  class: string;
}

const THEMES: ThemeOption[] = [
  // 5 Dark Themes
  { id: "cosmic-slate", name: "Cosmic Slate", type: "dark", class: "theme-cosmic-slate" },
  { id: "cyber-dark", name: "Cyber Dark", type: "dark", class: "theme-cyber-dark" },
  { id: "solarized-abyss", name: "Solarized Abyss", type: "dark", class: "theme-solarized-abyss" },
  { id: "vampire-crimson", name: "Vampire Crimson", type: "dark", class: "theme-vampire-crimson" },
  { id: "aura-orchid", name: "Aura Orchid", type: "dark", class: "theme-aura-orchid" },
  
  // 5 Light Themes
  { id: "classic-pure", name: "Classic Pure", type: "light", class: "theme-classic-pure" },
  { id: "forest-moss", name: "Forest Moss", type: "light", class: "theme-forest-moss" },
  { id: "warm-sand", name: "Warm Sand", type: "light", class: "theme-warm-sand" },
  { id: "ocean-breeze", name: "Ocean Breeze", type: "light", class: "theme-ocean-breeze" },
  { id: "sakura-pastel", name: "Sakura Pastel", type: "light", class: "theme-sakura-pastel" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dijkstra");
  const [isSwRegistered, setIsSwRegistered] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem("app_theme") || "cosmic-slate";
  });

  // Persist selected theme choice
  useEffect(() => {
    localStorage.setItem("app_theme", activeTheme);
  }, [activeTheme]);

  // Register a simple offline Service Worker to fulfill structural PWA demands
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => setIsSwRegistered(true))
        .catch((err) => console.log("SW registration bypassed: ", err));
    }
  }, []);

  const currentTheme = THEMES.find((t) => t.id === activeTheme) || THEMES[0];

  return (
    <div className={`min-h-screen theme-container ${currentTheme.class} flex flex-col font-sans antialiased selection:bg-indigo-600/30`}>
      
      {/* Global Header */}
      <header className="sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            N
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              Network Graph <span className="text-indigo-400">Visualizer</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-wide block mt-1">
              EDUCATIONAL NETWORK SIMULATOR
            </span>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex flex-wrap justify-center gap-1.5 p-1 rounded-xl border">
          <button
            onClick={() => setActiveTab("dijkstra")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "dijkstra"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            Dijkstra's Path
          </button>
          
          <button
            onClick={() => setActiveTab("distance-vector")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "distance-vector"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            Distance Vector
          </button>
          
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "compare"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            Algorithm Comparisons
          </button>
          
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "docs"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            Study Guide & Docs
          </button>
        </nav>

        {/* Beautiful Theme Selector replacing the PWA/Offline badges */}
        <div className="flex items-center gap-2 mt-4 md:mt-0 text-xs">
          <div className="flex items-center gap-2 bg-black/40 p-1.5 px-3 rounded-xl border border-white/5 shadow-sm">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mr-1">Theme:</span>
            <select
              value={activeTheme}
              onChange={(e) => setActiveTheme(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1 leading-tight"
            >
              <optgroup label="🌙 Dark Themes" className="bg-[#09090b] text-slate-200">
                {THEMES.filter((t) => t.type === "dark").map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="☀️ Light Themes" className="bg-[#09090b] text-slate-200">
                {THEMES.filter((t) => t.type === "light").map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

      </header>

      {/* Main Core Platform Window */}
      <main className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
        
        {/* Banner informing users about the sandbox persistence */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 px-5 bg-white/5 border border-white/10 rounded-2xl gap-3 backdrop-blur-md">
          <div className="flex gap-3 items-start sm:items-center">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Laptop className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Interactive Network Workspace Active</p>
              <p className="text-[11px] text-slate-400">All topologies, custom link weights, and calculation steps are cached locally in real-time.</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="self-start sm:self-auto text-[10px] font-mono hover:text-indigo-400 hover:bg-white/5 p-1.5 px-3 rounded-lg border border-white/5 transition-all flex items-center gap-1 text-slate-400"
          >
            <RefreshCw className="w-3 h-3" /> Clear Cached States
          </button>
        </div>

        {/* Active Simulation Component Switcher */}
        <div className="flex-1">
          {activeTab === "dijkstra" && <DijkstraVisualizer />}
          {activeTab === "distance-vector" && <DistanceVectorVisualizer />}
          {activeTab === "compare" && <ComparisonSection />}
          {activeTab === "docs" && <DocumentationTabs />}
        </div>

      </main>

      {/* Elegant Footer branding */}
      <footer className="py-6 mt-12 border-t border-white/10 bg-black/40 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 Network Graph Visualizer Educational Systems. @2026 Moegamat Samsodien</p>
      </footer>

    </div>
  );
}
