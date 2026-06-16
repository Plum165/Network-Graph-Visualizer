/**
 * Educational lessons data for Dijkstra and Distance Vector routing.
 */

export interface LessonContent {
  title: string;
  whatIsIt: string;
  whyItMatters: string;
  whereUsed: string[];
  formula: string;
  insights: Array<{ title: string; desc: string }>;
}

export const dijkstraLesson: LessonContent = {
  title: "Dijkstra's Shortest Path Algorithm",
  whatIsIt: "Dijkstra's Shortest Path Algorithm is a foundational computer science procedure designed by Edsger W. Dijkstra in 1956. Starting from a source node in a weighted graph, it systematically calculates the absolute shortest distance to every other accessible node. The algorithm acts greedily: at each step, it selects the unvisited node with the lowest tentative path cost, locks in its distance, and relaxes its outgoing edges to see if simpler paths are available.",
  whyItMatters: "Navigating networks efficiently of any magnitude is crucial. Computing the least-cost path ensures communication packets, physical transport vehicles, and system connections perform with minimal latency and maximal throughput. Without optimized pathfinding, networks collapse under backpressure, congested bottlenecks, and excessive route latency.",
  whereUsed: [
    "GPS & Geographic Navigation Systems (Google Maps, OSRM)",
    "Link-State Routing Protocols (OSPF, IS-IS in enterprise networks)",
    "In-game Pathfinding Modules (A* is a heuristic-driven extension of Dijkstra)",
    "Logistics and Supply Chain Routing Systems"
  ],
  formula: "Distance(v) = \\min(Distance(v), Distance(u) + Weight(u, v))",
  insights: [
    {
      title: "The Greedy Strategy",
      desc: "By taking the minimum estimated distance node, Dijkstra guarantees that if edge weights are non-negative, the distance to that node is optimal and will never need to be re-evaluated. This creates incredibly stable convergence characteristics."
    },
    {
      title: "Non-Negative Constraint",
      desc: "Dijkstra's algorithm cannot handle negative edge weights. If a negative cycle exists, a greedy path would infinitely traverse that cycle to reduce cost, triggering incorrect local minima. For negative weights, the Bellman-Ford or Floyd-Warshall algorithms are required."
    }
  ]
};

export const dvRoutingLesson: LessonContent = {
  title: "Distance Vector Routing Algorithm",
  whatIsIt: "Distance Vector Routing is a decentralized, distributed routing algorithm where nodes do not have complete map visibility. Instead, routers maintain a local 'Routing Table' indicating the cost to reach all other destination nodes, alongside the 'next hop' neighbor used for transmission. Neighboring routers periodically advertise their entire local table to one another. Using the Bellman-Ford principle, routers integrate neighbors' updates to dynamically learn of improved routes.",
  whyItMatters: "In a global, dynamic network like the early Internet, a single central authority cannot maintain or compute graph coordinates. Distance Vector enables distributed autonomy. Every router only needs to talk with its direct physical neighbors, yet the entire internet network organically converges on optimal transport lines.",
  whereUsed: [
    "Routing Information Protocol (RIP & RIPv2 in corporate intranets)",
    "BGP (Border Gateway Protocol relies on Path Vector, derived from DV)",
    "Cisco's proprietary EIGRP (Enhanced Interior Gateway Routing Protocol)",
    "Ad-Hoc Wireless Sensor Routing Protocols"
  ],
  formula: "D_x(y) = \\min_v \\{ c(x,v) + D_v(y) \\}",
  insights: [
    {
      title: "Distributed Bellman-Ford Principle",
      desc: "Each node x calculates the shortest path cost to destination y by considering the cost of reaching neighbor v plus neighbor v's advertised cost to y. Node x simply selects the minimum over all its neighbors."
    },
    {
      title: "Count-To-Infinity Problem",
      desc: "If a link fails, routers with outdated table entries can pass circular advertisements (e.g., A tells B it has a path, B tells A it can reach via A). This causes the reported distance to increment by step increments infinitely unless bounded. A maximum metric threshold is commonly set (e.g., 16 hops for RIP)."
    },
    {
      title: "Split Horizon & Poison Reverse",
      desc: "Two crucial mitigation mechanisms. Split Horizon prevents a router from advertising a route back to the very neighbor it learned it from. Poison Reverse actively advertises a cost of infinity (16) back to that neighbor to immediately break routing loops."
    }
  ]
};

export interface PracticeExercise {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export const practiceQuestions: PracticeExercise[] = [
  {
    id: "p1",
    question: "Why does Dijkstra's algorithm fail to compute shortest paths correctly in the presence of negative edge weights?",
    options: [
      "Negative edges render the graphs cyclic under all circumstances",
      "The greedy assumption fails because visiting a node with a larger tentative distance might lead through a highly negative edge to an overall shorter path later",
      "Dijkstra's algorithm relies on distance metric values computed via floating-point arithmetic which does not support negative numbers",
      "Priority queues are strictly restricted from containing key-value nodes that evaluate to negative numbers"
    ],
    answerIndex: 1,
    explanation: "Dijkstra operates on the greedy design that once a node is visited, its shortest distance is finalized. This is true if weights are non-negative. However, if a negative edge exists, a longer path (say, cost 10) might later take a negative edge (say, cost -15) resulting in a smaller total cost (cost -5) than the greedily finalized shortest path (say, cost 2)."
  },
  {
    id: "p2",
    question: "Suppose router A receives routing advertisements from B. B claims it can reach destination D with a cost of 3. If A is connected to B via a link of cost 4, what is A's calculated path cost to D through B?",
    options: [
      "Cost = 4 (A simply forwards using A's link cost directly)",
      "Cost = 3 (A inherits neighbor's absolute cost)",
      "Cost = 7 (A's cost to B + B's cost to D)",
      "Cost = 1 (A subtracts neighbor's advertisement from its own link cost)"
    ],
    answerIndex: 2,
    explanation: "According to the Bellman-Ford equation, the total cost for A to reach D via neighbor B is computed as cost(A, B) + cost(B, D) which is 4 + 3 = 7."
  },
  {
    id: "p3",
    question: "How does the 'Poison Reverse' technique improve upon 'Split Horizon' in preventing routing loops?",
    options: [
      "Poison Reverse locks all interfaces during change detections to fully halt routing update broadcasts for 30 seconds",
      "Instead of saying nothing (Split Horizon), Poison Reverse actively advertises an infinite cost (e.g., infinity = 16) back to the neighbor to immediately declare the path invalid",
      "Poison Reverse reverses the direction of data packets to ensure they are sent back to the primary sender node",
      "It automatically doubles the cost of the link during any link failure event"
    ],
    answerIndex: 1,
    explanation: "Split Horizon simply does not share the route back. Poison Reverse goes a step further by actively advertising a cost of infinity. This makes sure that the neighbor learns that the route is unreachable through this router, breaking potential routing loops instantly rather than waiting for route timers to expire."
  }
];
