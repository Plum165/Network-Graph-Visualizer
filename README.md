# Network Graph Visualizer 🧪

An immersive, high-fidelity, and interactive educational platform visualizing **Dijkstra's Shortest Path Algorithm** and the **Distance Vector Routing Algorithm**. Styled with a stunning customizable theme selection workspace (5 elegant light themes and 5 deep dark themes), this tool is designed for university-level computer science, networking systems, and algorithms curriculum studies.

---

## 🛠 Project Structure

The project is structured modularly to guarantee extreme extensibility, high performance, type-safety, and offline availability:

```text
/
├── public/
│   └── sw.js                    # Service Worker caching assets for offline support (PWA)
├── src/
│   ├── components/
│   │   ├── DijkstraVisualizer.tsx       # Graph builder, SVG steps, & practice workspace
│   │   ├── DistanceVectorVisualizer.tsx # Network mesh builder, packet advertisements, & tables
│   │   ├── ComparisonSection.tsx        # Side-by-side performance & architecture metrics
│   │   └── DocumentationTabs.tsx        # Built-in User Guide & Developer Manual
│   ├── data/
│   │   └── lessons.ts           # Math formulations, explanations, and practice questions
│   ├── types.ts                 # Clean TypeScript global interfaces & states definition
│   ├── App.tsx                  # Global theme frame, navigation coordinator, and theme engine
│   ├── index.css                # Tailwind directives & 10 theme dynamic color bindings
│   └── main.tsx                 # Client-side mounting & initialization entry point
├── package.json                 # Project dependencies & scripts
├── metadata.json                # App identification properties
└── tsconfig.json                # TypeScript declarations
```

---

## 🧭 How the Algorithms and Visualizers Work

### 1. Dijkstra's Shortest Path Algorithm (Link-State)
Dijkstra's Algorithm is a **single-source shortest path algorithm** used to find the shortest routes from a designated source node to all other nodes in a weighted graph.

#### Behind the Scenes (The Mathematics)
1. **Initialization:**
   - Set the distance to the source node $S$ to `0` ($d[S] = 0$).
   - Set the distance to all other nodes $v$ to infinity ($d[v] = \infty$).
   - Add all nodes to a Priority Queue $Q$, sorted by their current tentative distance.
2. **Relaxation Loop:**
   - While $Q$ is not empty, extract the node $u$ with the minimum tentative distance ($d[u]$). Mark $u$ as "Visited" (closed set).
   - For each unvisited neighbor $v$ of $u$:
     - Calculate the tentative distance via $u$: $\text{temp} = d[u] + \text{weight}(u, v)$.
     - If $\text{temp} < d[v]$, update $d[v] = \text{temp}$ and record node $u$ as the predecessor of $v$.
3. **Termination:** The algorithm completes once all reachable nodes are visited, creating a shortest path spanning tree.

#### How to Use the Dijkstra Visualizer
* **Nodes & Edges Canvas:** Click anywhere on the dark grid to place a new router node. Drag a node to rearrange the topology.
* **Link Connections:** Use the "Add Edge" controls to establish high-fidelity directional or bi-directional connections and assign custom positive link weights.
* **Calculation Sandbox:** 
  - Trace state changes step-by-step using the **Next Step** and **Prev Step** progression buttons.
  - Watch nodes dynamic change states through the theme’s visual color cues: Unvisited (Idle), Queued (Frontier), Active (Currently Investigated), and Optimal Path (Final Backtrack).
  - Inspect the live Priority Queue table and distance logs updated in real-time alongside the active visual state.

---

### 2. Distance Vector Routing Protocol (Bellman-Ford Convergence)
Unlike link-state protocols where routers have a full view of the physical map, Distance Vector routing is a decentralized routing strategy where routers only converse with their immediate physical neighbors.

#### Behind the Scenes (The Bellman-Ford Equation)
Each router maintains a Routing Table mapping every possible destination node to its known minimum cost and the associated next-hop router.
* **Message Advertisements:** Every router periodically broadcasts its vector state (destination distances) to its neighbors:
  $$D_x(y) = \min_v \{ c(x,v) + D_v(y) \}$$
  Where $c(x,v)$ is the direct link cost to neighbor $v$, and $D_v(y)$ is neighbor $v$'s advertised cost to reach destination $y$.
* **Routing Convergence:** Routers iteratively receive vector advertisements from neighbors, recalculate local costs, and advertise any changes until no further updates occur (Network Converged).

#### Count-to-Infinity & Loop Remedies
When a database or physical cable link drops, Distance Vector protocols can develop catastrophic routing loops because routers may continue advertisement propagation based on stale neighbor vectors.
* **Count-to-Infinity:** Node A reaches Node C via Node B. If C fails, B doesn't know immediately and claims it can still reach C with a high weight. A updates to go through B, B goes through A, incrementing costs indefinitely until infinity cutoff is met.
* **Split Horizon Toggle:** Prevents a router from advertising a route back to the very neighbor it learned that route from. If Router B reaches Router C via Router A, Router B will *not* advertise its path to C back to Router A.
* **Poison Reverse Toggle:** Extends Split Horizon by actively advertising a route back to its origin neighbor as having an infinite cost ($\infty$), explicitly telling that neighbor the route is unreachable through this hop.

#### How to Use the Distance Vector Visualizer
* **Live Packet Simulation:** Click **Play Simulation** or trigger manual step cycles. Watch graphical "packet envelopes" fly across the network mesh as routers advertise their updating matrices.
* **Dynamic Failure Testing:** Click directly on a router node or an active edge link to simulate immediate line failure. Look at how routing tables dynamically compute alternate paths or trigger infinite counting mechanisms based on active preventative toggles.
* **Realtime Routing Tables:** Monitor detailed node routing tables updating on-the-fly, showcasing immediate convergence signals and path calculations.

---

## 🎨 Creative Aesthetics and Themes

We have fully decoupled style colors from standard static classes. The visualizer supports an extensive array of **10 highly curated visual themes** (5 Light Themes and 5 Dark Themes) to ensure optimum accessibility, high contrast, and eye safety during late-night study sessions.

### 5 Dark Modes
1. **Cosmic Slate (Default):** Classic deep charcoal canvas with high-contrast electric indigo accents and neon active states.
2. **Cyber Dark:** Immersive terminal theme utilizing cyan and teal borders on a pure black background.
3. **Solarized Abyss:** Soft desaturated petroleum green inspired by the popular Solarized color palette.
4. **Vampire Crimson:** Bold crimson tones paired with deep bordeaux backdrops for a unique night-mode vibe.
5. **Aura Orchid:** Vaporwave-esque dark violet atmosphere combining deep grape-toned interfaces with bright purple links.

### 5 Light Modes
1. **Classic Pure:** Sharp, high-contrast, modern clean white paper background styled with professional royal blue accents.
2. **Forest Moss:** Organic sage green and earth bio elements, comfortable for long readings.
3. **Warm Sand:** Terracotta and sepia theme delivering warm, relaxing screen radiation.
4. **Ocean Breeze:** Refreshing pale-blue and azure layout giving an elegant tech-studio feel.
5. **Sakura Pastel:** Delicate blush pink and soft spring-blossom tones for a playful, friendly layout.

Change themes instantly via the **Palette dropdown** located in the top-right header section of the application frame.

---

## 🔋 Progressive Web App (Offline Capabilities)

* **Robust Resource Caching:** Backed by an offline-ready Service Worker cache (`/public/sw.js`), ensuring the visualizers, lessons, interactive graph builders, and practice challenges load instantly even during transportation or offline university transit.
* **LocalStorage Bindings:** Automatically persists custom networks, node coordinates, edge configurations, and visual preferences directly in local browser states. Work is fully preserved across page reloads and browser sessions.

---

## 🎓 Academic Contributors

Project developed under the direction and educational specifications of:
* **Contributor / Architect:** Moegamat Samsodien (@2026)
