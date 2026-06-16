/**
 * Types for Network Graph Visualizer
 */

export interface GNode {
  id: string; // E.g. "A", "B", "C"
  name: string;
  x: number;
  y: number;
}

export interface GEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  isDirected: boolean;
}

export interface DijkstraState {
  currentNodeId: string | null;
  visited: Set<string>;
  frontier: string[]; // Current queue of nodes to visit
  distances: Record<string, number>; // node -> shortest distance
  previous: Record<string, string | null>; // node -> previous node
  queue: Array<{ node: string; dist: number }>; // Priority priority queue representation
  stepHistory: Array<{
    currentNodeId: string | null;
    visited: Set<string>;
    distances: Record<string, number>;
    previous: Record<string, string | null>;
    queue: Array<{ node: string; dist: number }>;
    description: string;
  }>;
  currentStepIndex: number;
  finalPath: string[] | null;
}

// Distance Vector Types
export interface RouterNode {
  id: string;
  name: string;
  x: number;
  y: number;
  failed: boolean;
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  cost: number;
  failed: boolean;
}

export interface RoutingTableEntry {
  destination: string;
  cost: number;
  nextHop: string | null;
}

export type RoutingTable = Record<string, RoutingTableEntry>;

// Holds tables of all routers: Record<routerId, RoutingTable>
export type NetworkRoutingTables = Record<string, RoutingTable>;

export interface DVUpdateMessage {
  id: string;
  from: string;
  to: string;
  table: RoutingTable;
  progress: number; // 0 to 1 for packet animation
}

export interface DVState {
  routers: RouterNode[];
  links: NetworkLink[];
  routingTables: NetworkRoutingTables;
  history: Array<{
    routingTables: NetworkRoutingTables;
    description: string;
    iteration: number;
  }>;
  currentIteration: number;
  messages: DVUpdateMessage[];
  converged: boolean;
  splitHorizon: boolean;
  poisonReverse: boolean;
}
