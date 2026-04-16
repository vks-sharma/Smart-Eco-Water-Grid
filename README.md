# 🌊 Smart Eco-Water Grid

**AI-Powered Decentralised Water Management System**

> An intelligent, nature-based water grid that combines IoT sensors, AI-driven classification, and constructed wetlands to deliver real-time, affordable, and scalable water management — designed for the communities that need it most.

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![AI](https://img.shields.io/badge/AI-Rule--based%20Classifier-blueviolet)](/)
[![IoT](https://img.shields.io/badge/IoT-Sensor%20Simulation-orange)](/)
[![SDG 2](https://img.shields.io/badge/UN%20SDG-2%20Zero%20Hunger-F5A623)](https://sdgs.un.org/goals/goal2)
[![SDG 3](https://img.shields.io/badge/UN%20SDG-3%20Good%20Health-4CAF50)](https://sdgs.un.org/goals/goal3)
[![SDG 6](https://img.shields.io/badge/UN%20SDG-6%20Clean%20Water-0099CC)](https://sdgs.un.org/goals/goal6)
[![SDG 11](https://img.shields.io/badge/UN%20SDG-11%20Sustainable%20Cities-E67E22)](https://sdgs.un.org/goals/goal11)

---
## 🌐 Live Demo

🔗 **https://smart-eco-water-grid.onrender.com**

🚀 Explore the system in real time:
- View live IoT sensor data across multiple nodes  
- Click nodes on the deployment map to inspect readings  
- Observe AI-driven water quality classification and routing  

⚠️ Note: Data is generated using an integrated IoT simulation engine.

## Table of Contents

1. [The Problem](#the-problem)
2. [The Solution](#the-solution)
3. [Real-World Impact](#real-world-impact)
4. [Screenshots](#screenshots)
5. [How It Works](#how-it-works)
6. [System Architecture](#system-architecture)
7. [AI Decision Engine](#ai-decision-engine)
8. [Water Quality Thresholds](#water-quality-thresholds)
9. [API Reference](#api-reference)
10. [Project Structure](#project-structure)
11. [Getting Started](#getting-started)
12. [Tech Stack](#tech-stack)
13. [Innovation & Scalability](#innovation--scalability)
14. [Roadmap](#roadmap)
15. [SDG Alignment](#sdg-alignment)
16. [Contributing](#contributing)

---

## The Problem

**Water scarcity and food insecurity are two sides of the same crisis.**

Over **2 billion people** lack access to safe drinking water, and agriculture — which depends entirely on clean water — accounts for **70% of global freshwater use**. When water quality fails, so does crop irrigation, livestock health, food production, and ultimately, human health.

Conventional centralised sewage treatment plants (STPs) have failed to bridge this gap because they are:

- 💸 **Prohibitively expensive** to build and operate in rural or low-income regions
- 📉 **Impossible to monitor** — most rural systems operate with zero real-time data
- 📦 **Rigid and unscalable** — all-or-nothing infrastructure that cannot grow incrementally
- ⚡ **Energy-intensive** — dependent on chemicals, power grids, and centralised control
- 🦠 **Reactive, not preventive** — by the time water is tested, disease has already spread

The result is a compounding crisis: unsafe water causes waterborne diseases, unsafe water ruins crops, and the communities most affected are the least able to afford conventional solutions.

---

## The Solution

**Smart Eco-Water Grid** is a decentralised, AI-powered water management system that replaces the broken centralised model with a **living, self-monitoring network of constructed wetland nodes**.

Each node is a natural bio-filter (a constructed wetland) equipped with IoT sensors and connected to an AI brain that continuously classifies water quality and makes intelligent routing decisions — all in real time, at a fraction of conventional STP costs.

| Pillar | What It Does |
|---|---|
| 🌿 **Constructed Wetlands** | Nature-based bio-filtration — zero chemicals, low energy, low cost |
| 📡 **IoT Sensor Network** | Continuous monitoring of pH, turbidity, temperature, dissolved O₂, conductivity, and TDS |
| 🤖 **AI Classifier** | Automatically labels water as Safe / Moderate / Unsafe and triggers action |
| 🔄 **Smart Grid Routing** | Directs water flow to the nearest appropriate treatment or reuse destination |
| 📊 **Live Dashboard** | Real-time visualisation with alerts, deployment maps, and quality scores |
| ⚙️ **Admin Controls** | Operators can manually override routing and tune alert thresholds live |

**Result: ~80% cost reduction** compared to conventional STPs — deployable in any community, at any scale.

---

## Real-World Impact

### 🌾 Water Security Enables Food Security

Clean, safely routed water is the foundation of food security. This system directly supports agricultural irrigation by classifying water as safe for reuse or suitable for irrigation — reducing contamination of crops, protecting livestock, and enabling sustainable farming in water-stressed regions. Water that would otherwise be wasted or misused is intelligently redirected to where it can do the most good.

### 🏥 Preventing Disease Before It Spreads

By detecting unsafe water in real time and rerouting it before it reaches homes or fields, the system acts as an early-warning layer against cholera, typhoid, dysentery, and other waterborne diseases — preventing outbreaks rather than responding to them.

### 💰 Accessible to the Communities That Need It Most

The open-source stack and nature-based treatment approach means this system can be deployed with minimal capital, maintained with minimal expertise, and scaled without redesigning the whole infrastructure. It is not a solution for the few — it is built for the billions.

### 🌍 Scale

- **Target:** 2 billion+ people currently without safe water access
- **Cost reduction:** ~80% vs. centralised STPs
- **Deployment model:** Village → Town → City, one node at a time

---

## Screenshots

### 📊 Dashboard — Live Sensor Monitoring
Real-time readings across all 6 water quality parameters. The AI instantly classifies water status and surfaces a recommended action for operators.

<img width="1366" height="645" alt="WhatsApp Image 2026-04-14 at 12 50 27 (2)" src="https://github.com/user-attachments/assets/d57b4702-f6d4-4490-a989-a65f9a49639c" />


---

### 🗺️ Deployment Map — Node & Link Visualisation
An interactive map showing residential clusters (blue), wetland STPs (green/orange), and live water-flow links. Click any node to inspect its live sensor readings.

<img width="1366" height="649" alt="WhatsApp Image 2026-04-14 at 12 50 43" src="https://github.com/user-attachments/assets/3f9a9c72-ea14-4b92-a851-96f67133a6f8" />


---

### ⚙️ Deployment Panel — AI Recommendations & Link Controls
AI-generated capacity alerts (e.g. "Wetland STP 1: Flow 72% approaching capacity") alongside manual override controls for every flow link — Open, Throttle, or Stop.

<img width="1366" height="649" alt="WhatsApp Image 2026-04-14 at 12 50 27 (1)" src="https://github.com/user-attachments/assets/aa089cab-d91c-4193-8cc5-dc12f8531ac7" />


---

### 🔧 Settings — Alert Threshold Configuration
Admins can fine-tune the safe/moderate/unsafe thresholds for each sensor parameter live from the UI. Changes take effect immediately — no server restart required.

<img width="1366" height="645" alt="WhatsApp Image 2026-04-14 at 12 50 27" src="https://github.com/user-attachments/assets/be485e72-0bf3-4d17-a700-2df04700be7c" />

---

## How It Works

```
[Residential Clusters H1 / H2 / H3]
            │
            ▼  (wastewater output)
      [IoT Sensors] ──────────────────────────► [Node.js Backend API]
   pH · turbidity · temperature                          │
   dissolved O₂ · conductivity · TDS                    │
                                                         ▼
                                                  [AI Classifier]
                                                         │
                              ┌──────────────────────────┼──────────────────────────┐
                              ▼                          ▼                           ▼
                         ✅ SAFE                   ⚠️ MODERATE                 ❌ UNSAFE
                      Storage / Reuse               Crop Irrigation             Re-treatment
                              │                          │                           │
                              └──────────────────────────┴───────────────────────────┘
                                                         │
                                                         ▼
                                               [Live Dashboard]
                                    Operators monitor status, view alerts,
                                    override routing, adjust thresholds
```

Wastewater flows from residential clusters through IoT-monitored channels into constructed wetland nodes (W1, W2, W3). The AI engine evaluates each reading and routes water to the optimal destination — reuse, irrigation, or re-treatment — across the mesh network.

---

## System Architecture

### Node Topology

| Node ID | Type | Description |
|---|---|---|
| `H1` | House Cluster | Cluster A — residential wastewater source |
| `H2` | House Cluster | Cluster B — residential wastewater source |
| `H3` | House Cluster | Cluster C — residential wastewater source |
| `W1` | Wetland STP | Constructed wetland treatment node 1 |
| `W2` | Wetland STP | Constructed wetland treatment node 2 |
| `W3` | Wetland STP | Constructed wetland treatment node 3 |

### Flow Links

| Link | Route | Default Status |
|---|---|---|
| L1 | Cluster A → Wetland STP 1 | Open |
| L2 | Cluster B → Wetland STP 2 | Open |
| L3 | Cluster C → Wetland STP 2 | Open |
| L4 | Wetland STP 1 → Wetland STP 2 | Open |
| L5 | Wetland STP 2 → Wetland STP 3 | Open |

### Component Layers

```
┌─────────────────────────────────────────────────┐
│                  IoT Layer                      │
│  pH · Turbidity · Temp · DO · EC · TDS          │
│  (simulated; swap-in ready for ESP32 hardware)  │
└──────────────────────┬──────────────────────────┘
                       │ sensor readings
┌──────────────────────▼──────────────────────────┐
│          Backend — Node.js / Express            │
│  REST API · JWT Auth · Rate Limiting            │
│  Per-node 24h rolling history (288 readings)    │
└──────────────────────┬──────────────────────────┘
                       │ quality data
┌──────────────────────▼──────────────────────────┐
│             AI Decision Engine                  │
│  Rule-based classifier · Routing logic          │
│  Expandable to ML prediction models             │
└──────────────────────┬──────────────────────────┘
                       │ status + action
┌──────────────────────▼──────────────────────────┐
│             Frontend Dashboard                  │
│  Live charts · Deployment map · Alerts          │
│  Manual link controls · Admin settings          │
└─────────────────────────────────────────────────┘
```

---

## AI Decision Engine

The classifier in `ai/decision.js` evaluates **six water quality parameters** in parallel, applies a worst-case rule, and returns a status with a recommended action.

### Classification Logic

```
For each parameter in [pH, turbidity, temperature, dissolvedO₂, conductivity, TDS]:
  → Evaluate reading against configurable thresholds
  → Assign: safe | moderate | unsafe

Overall status = worst individual classification across all parameters
```

### Decision Table

| Status | Recommended Action | Meaning |
|---|---|---|
| ✅ **Safe** | `reuse` | All parameters within safe range — store or redistribute |
| ⚠️ **Moderate** | `irrigation` | Acceptable for non-potable use — route to crop fields |
| ❌ **Unsafe** | `re-treat` | One or more parameters critical — return to treatment cycle |

The AI also monitors node **capacity levels** and generates proactive alerts (e.g. "Wetland STP 1: Flow 72% approaching capacity") before overflow occurs.

---

## Water Quality Thresholds

Default thresholds — fully configurable via the Settings UI or `confg/thresholds.json` with **no server restart required**:

| Parameter | Unit | Safe | Moderate | Unsafe |
|---|---|---|---|---|
| **pH** | — | 6.5 – 8.5 | 6.0 – 6.49 | < 6.0 |
| **Turbidity** | NTU | ≤ 5 | 5.1 – 10 | > 10 |
| **Temperature** | °C | 15 – 28 | 10 – 14.9 | < 10 |
| **Dissolved O₂** | mg/L | 6.5 – 14 | 5.0 – 6.4 | < 5.0 |
| **Conductivity** | µS/cm | ≤ 500 | 501 – 1500 | > 1500 |
| **TDS** | mg/L | ≤ 500 | 501 – 1000 | > 1000 |

---

## API Reference

Base URL: `http://localhost:3000` (configurable via `PORT` environment variable)

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | None | Obtain a JWT token |

Include the token as `Authorization: Bearer <token>` on protected routes.

### Sensor Data

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/sensor-data` | Optional | Submit a sensor reading for a node |
| `GET` | `/latest-data` | None | Get the latest reading for all active nodes |

### Nodes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/nodes` | None | List all configured nodes and topology |
| `GET` | `/nodes/:nodeId` | None | Get a node's config and latest reading |
| `GET` | `/nodes/:nodeId/history?limit=N` | None | Get the last N readings (default 50, max 288) |

### Settings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/settings/thresholds` | None | Get current classification thresholds |
| `PUT` | `/settings/thresholds` | ✅ Required | Update thresholds (admin only) |

---

## Project Structure

```
Smart-Eco-Water-Grid/
│
├── server.js               # Application entry point & core routing logic
├── package.json
├── .env.example            # Environment variable template
│
├── ai/
│   ├── decision.js         # Water quality classification & routing engine
│   └── decision.test.js    # Unit tests for classifier logic
│
├── iot/
│   └── simulate.js         # Multi-node IoT sensor data simulator
│
├── routes/
│   ├── auth.js             # Login & JWT token issuance
│   ├── nodes.js            # Node data, history, and topology
│   └── settings.js         # Threshold read/write
│
├── middleware/
│   └── auth.js             # JWT verification middleware
│
├── frontend/
│   ├── index.html          # Dashboard shell
│   ├── styles.css          # UI styling
│   ├── app.js              # Core dashboard logic
│   ├── charts.js           # Real-time chart rendering
│   ├── nodePanel.js        # Per-node detail panel
│   ├── state.js            # Frontend state management
│   ├── auth.js             # Login UI
│   └── settings.js         # Threshold settings UI
│
└── confg/
    ├── nodes.json          # Grid topology (nodes + links)
    ├── thresholds.json     # Classification thresholds
    ├── users.json          # User credentials (bcrypt hashed)
    └── constants.js        # Shared constants
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (bundled with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Smart-Eco-Water-Grid.git
cd Smart-Eco-Water-Grid

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Open .env and set a strong JWT_SECRET
```

### Running the System

**Terminal 1 — Start the backend server:**
```bash
npm start
# ✅ Server running at http://localhost:3000
```

**Terminal 2 — Start the IoT data simulator:**
```bash
node iot/simulate.js
# ✅ Streaming simulated sensor readings from all configured nodes
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to access the live dashboard.

### Running Tests

```bash
node ai/decision.test.js
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port the server listens on |
| `JWT_SECRET` | *(required)* | Secret key used to sign JWT tokens |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Node.js + Express | Lightweight, event-driven — ideal for real-time sensor ingestion |
| **Authentication** | JWT + bcryptjs | Secure, stateless auth for admin operations |
| **Frontend** | HTML + CSS + Vanilla JS | Zero-dependency, fast-loading dashboard |
| **AI Engine** | Rule-based classifier | Deterministic, auditable, and easily upgradeable to ML |
| **IoT Simulation** | Node.js simulator | Realistic multi-node sensor stream; swap-in ready for ESP32 |
| **Rate Limiting** | express-rate-limit | Protection against sensor flooding and API abuse |
| **Config** | dotenv + JSON | Hot-reloadable thresholds, no restart needed |

---

## Innovation & Scalability

### Smart Eco-Water Grid vs. Conventional Systems

| Feature | Conventional STP | Smart Eco-Water Grid |
|---|---|---|
| **Cost** | Millions to build & maintain | Low-cost wetlands + open-source stack |
| **Monitoring** | Manual or none | Real-time, 24/7 IoT sensor network |
| **Decision-making** | Human-operated | AI-automated with operator override |
| **Scalability** | All-or-nothing | Add one node at a time |
| **Energy** | High (pumps, chemicals) | Minimal (gravity + nature) |
| **Failure mode** | Single point of failure | Distributed mesh — nodes reroute around failures |
| **Agricultural use** | Not optimised | Explicitly classifies water for safe irrigation |

### Interdisciplinary by Design

This project sits at the intersection of **environmental science**, **artificial intelligence**, **IoT engineering**, and **public health** — combining the best of each field into a single, deployable system.

### Open Source & Replicable

Every component is open-source and documented. A community in rural India, sub-Saharan Africa, or Southeast Asia can deploy this system using locally available materials for the wetlands and consumer-grade hardware for the sensors. The architecture is designed to work even in low-connectivity environments.

---

## Roadmap

| Phase | Timeline | Milestone |
|---|---|---|
| **Phase 1 — Prototype** | ✅ Now | Backend API, AI classifier, IoT simulator, and live dashboard complete |
| **Phase 2 — Pilot** | 6 months | Single-node deployment at a real rural community with physical sensors |
| **Phase 3 — Expand** | 1 year | Multi-node rollout with government and NGO partnerships |
| **Phase 4 — Scale** | 2+ years | Open-source release, global decentralised adoption |

### Upcoming Features

- 🤖 ML-based predictive water quality forecasting
- 📱 Mobile app with real-time push alerts for operators
- ☀️ Solar-powered node hardware reference design
- 🗺️ GIS-based dynamic routing and watershed mapping
- 🌐 Open API for smart city and government system integration

---

## SDG Alignment

Built to create **measurable real-world impact** across multiple UN Sustainable Development Goals:

| SDG | Goal | How Smart Eco-Water Grid Contributes |
|---|---|---|
| 🌱 **SDG 2** | Zero Hunger | Water classified as "moderate" is safely rerouted for crop irrigation, directly supporting food security and sustainable agriculture in water-stressed communities |
| 🏥 **SDG 3** | Good Health & Well-being | Real-time detection of unsafe water prevents waterborne disease outbreaks (cholera, typhoid, dysentery) before they reach populations |
| 🌊 **SDG 6** | Clean Water & Sanitation | Delivers affordable, decentralised, real-time water treatment to communities that cannot access conventional infrastructure |
| 🌆 **SDG 11** | Sustainable Cities & Communities | Modular node architecture scales from a single village to a full smart city without redesigning the system |

**Target beneficiary population:** The 2+ billion people globally without reliable access to safe drinking water.

---

## Current Status

| Component | Status |
|---|---|
| Backend API (Express + JWT) | ✅ Complete |
| AI water quality classifier | ✅ Active |
| Smart routing engine | ✅ Active |
| IoT sensor simulator | ✅ Running |
| Live frontend dashboard | ✅ Live |
| Deployment map with link controls | ✅ Live |
| Admin settings & threshold editor | ✅ Live |
| Physical hardware integration (ESP32) | 🔧 Planned — Phase 2 |
| ML-based predictive classifier | 🔧 Planned — Phase 3 |

---

## Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Author

**Vikas Kumar Sharma** — Developer & Researcher

*Building decentralised, nature-powered, AI-driven infrastructure for the communities that need it most.*

---

<div align="center">

**🌊 Smart Eco-Water Grid**

*AI + IoT + Nature — united for food security, clean water, and healthy communities*

`SDG 2` · `SDG 3` · `SDG 6` · `SDG 11`

</div>
