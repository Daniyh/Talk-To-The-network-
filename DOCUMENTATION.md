# RAN Optimization Dashboard
### AI-Powered Intent-Based Network Management for 5G Heterogeneous Networks

---

> **Abstract**
>
> The RAN Optimization Dashboard is a full-stack, AI-powered web application that brings the principles of Intent-Based Networking (IBN) to life in a 5G Radio Access Network (RAN) environment. Network engineers express their operational goals in plain natural language — such as *"Prioritize emergency communications at the central hospital now"* — and a four-stage autonomous AI pipeline transforms that intent into a structured, standards-compliant network optimization plan. The system analyzes real network KPIs drawn from a 6G Heterogeneous Network dataset, generates 3GPP Release 18 configurations, visualizes affected cells on an interactive topology map, and quantifies the performance improvement through before/after KPI comparisons. This document covers the theoretical foundations, system architecture, implementation details, dataset requirements, API specification, and deployment procedures.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Background and Theoretical Foundations](#2-background-and-theoretical-foundations)
   - 2.1 Telecommunications and the Evolution to 5G
   - 2.2 Radio Access Networks (RAN)
   - 2.3 Heterogeneous Networks (HetNet)
   - 2.4 Key Performance Indicators in RAN
   - 2.5 Intent-Based Networking (IBN)
   - 2.6 Agentic AI and Multi-Agent Systems
   - 2.7 Large Language Models in Network Management
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Setup and Installation](#6-setup-and-installation)
7. [Dataset Requirements](#7-dataset-requirements)
8. [AI Pipeline — The Four-Agent Crew](#8-ai-pipeline--the-four-agent-crew)
9. [API Reference](#9-api-reference)
10. [Frontend Pages](#10-frontend-pages)
11. [Deployment](#11-deployment)
12. [Environment Variables](#12-environment-variables)

---

> **Figure Guide**
>
> This document contains figure placeholders marked as `[FIGURE N]`. Each placeholder indicates exactly where a screenshot or diagram should be inserted. The corresponding image files should be placed in the `docs/figures/` directory at the project root. Replace each placeholder with:
> ```markdown
> ![Figure N: Caption](docs/figures/figN.png)
> ```

---

## 1. Introduction

The management of modern mobile networks is one of the most complex challenges in the telecommunications industry. A single 5G deployment may involve thousands of radio cells spread across a city, each continuously generating streams of performance data — throughput, latency, packet loss, signal quality — that operators must monitor and act upon in near real time. When a major event fills a stadium, when a hospital requires ultra-reliable low-latency communication for remote surgery, or when a factory floor deploys hundreds of IoT sensors simultaneously, the network must adapt dynamically and precisely.

Traditionally, this adaptation has required highly skilled radio frequency (RF) engineers to manually translate operational goals into low-level network configuration commands. This process is time-consuming, error-prone, and increasingly unsustainable as network density and complexity grow with each generation of wireless standards.

The **RAN Optimization Dashboard** addresses this challenge by combining two transformative technologies: **Intent-Based Networking**, which elevates the human-machine interface from command syntax to natural language goals, and **Agentic AI**, which deploys autonomous, specialized AI agents to reason over the intent and produce actionable network configurations grounded in real data.

The result is a system where a network engineer types a single sentence and receives, within seconds, a complete optimization plan — including the specific cells affected, the 3GPP-compliant configuration parameters, and a projected KPI improvement — visualized on an interactive network map.

> **[FIGURE 1]** — *Full dashboard overview: screenshot of the Network Monitor page (`/`) showing the live topology, KPI cards, and live chart side by side. Capture at `http://localhost:4000` with the dataset loaded.*
>
> `![Figure 1: RAN Optimization Dashboard — Network Monitor overview](docs/figures/fig1_dashboard_overview.png)`

---

## 2. Background and Theoretical Foundations

### 2.1 Telecommunications and the Evolution to 5G

Telecommunications — the transmission of information over distances using electronic means — has undergone rapid generational evolution over the past four decades. Each generation introduced not merely faster speeds, but fundamentally new use cases:

- **1G (1980s):** Analog voice communication. The first mobile phones.
- **2G (1990s):** Digital voice and SMS. Introduction of encryption and global roaming (GSM standard).
- **3G (2000s):** Mobile data. Web browsing, email, and video calling became possible on handheld devices.
- **4G LTE (2010s):** Broadband mobile internet. HD video streaming, app ecosystems, and the smartphone revolution.
- **5G (2020s):** The current generation, defined by three foundational pillars:
  - **eMBB (Enhanced Mobile Broadband):** Gigabit-class data rates for consumer applications.
  - **URLLC (Ultra-Reliable Low-Latency Communication):** Sub-millisecond latency for mission-critical applications such as autonomous vehicles and remote surgery.
  - **mMTC (Massive Machine-Type Communication):** Connectivity for billions of IoT devices with minimal power consumption.

The **3GPP (3rd Generation Partnership Project)** is the global standards body responsible for defining 5G specifications. Its releases — particularly Release 15 through Release 18 — specify everything from air interface numerology to network slicing architecture, and their parameters form the basis of the configuration outputs generated by this system.

> **[FIGURE 2]** — *5G three-slice architecture diagram: a horizontal bar divided into three labeled bands — eMBB (left, blue), URLLC (center, orange), mMTC (right, green) — each with example use cases listed below. Create as a simple diagram or use any publicly available 3GPP slice illustration.*
>
> `![Figure 2: 5G Network Slice Types — eMBB, URLLC, and mMTC](docs/figures/fig2_5g_slices.png)`

---

### 2.2 Radio Access Networks (RAN)

The Radio Access Network is the portion of a mobile network responsible for wirelessly connecting user devices (UEs — User Equipment) to the core network. It is the "last mile" of wireless connectivity, and it is where the majority of network optimization work takes place.

A RAN consists of **base stations** — known in 5G as **gNodeBs (gNBs)** — each managing one or more **radio cells**. Each cell covers a geographic area and handles the radio scheduling, beamforming, handover, and quality-of-service enforcement for all devices within its coverage zone. The performance of a cell is continuously measured through a rich set of KPIs, and operators must tune cell parameters — transmit power, bandwidth allocation, scheduling priority, MIMO configuration — to maintain service quality under constantly changing load conditions.

A key challenge in RAN management is the sheer scale of configuration space. A 5G gNB running **NR (New Radio)** numerology can support multiple **component carriers**, multiple **MIMO layers**, and multiple **network slices** simultaneously. Optimizing these dimensions for a specific operational goal requires deep domain expertise — precisely the expertise that this system encodes into its AI agents.

> **[FIGURE 3]** — *RAN architecture diagram: shows UEs connecting wirelessly to gNBs, which connect via fronthaul/backhaul to the 5G Core Network (5GC). A simple block diagram with arrows illustrating the signal path from device to core. Publicly available from 3GPP or O-RAN documentation.*
>
> `![Figure 3: 5G RAN Architecture — UE to gNB to 5G Core](docs/figures/fig3_ran_architecture.png)`

---

### 2.3 Heterogeneous Networks (HetNet)

A **Heterogeneous Network (HetNet)** is a deployment architecture that combines multiple tiers of base stations with different transmission powers, coverage areas, and roles within the same geographic area. Rather than relying solely on large, high-power macro cells, a HetNet deploys smaller cells — micro, pico, and femtocells — as a dense underlay to handle high-traffic hotspots and improve spatial reuse of spectrum.

The four cell types in this system reflect the standard HetNet hierarchy:

| Cell Type | Coverage | Typical Use Case |
|-----------|----------|-----------------|
| **Macro** | 1–35 km | Wide-area coverage, rural and suburban |
| **Micro** | 200 m–2 km | Urban coverage, moderate capacity |
| **Pico** | 10–200 m | Indoor/outdoor hotspots, shopping malls |
| **Femto** | <10 m | Enterprise buildings, home offices |

Managing a HetNet requires coordinating across all these tiers, ensuring that interference is controlled, load is balanced, and handovers are seamless — a task that becomes increasingly complex as cell density grows. The dataset powering this dashboard simulates exactly this multi-tier architecture, with 50 cells distributed across a representative urban coverage grid.

> **[FIGURE 4]** — *HetNet cell tier visualization: hover over any cell node on the Network Topology panel at `http://localhost:4000`. The tooltip shows cell type and health. Alternatively, take a screenshot of the network topology panel with a Macro cell hovered, clearly showing the size difference between Macro (large circle), Micro (medium), Pico (small), and Femto (tiny) nodes.*
>
> `![Figure 4: HetNet Topology — Multi-tier cell visualization with hover tooltip](docs/figures/fig4_hetnet_topology_hover.png)`

---

### 2.4 Key Performance Indicators in RAN

Network engineers assess cell health and network quality through a standardized set of Key Performance Indicators (KPIs). Understanding these metrics is essential to interpreting the system's outputs:

**Throughput (Mbps)** measures the volume of user data successfully transmitted per unit time. It is the most direct measure of user experience quality. In 5G eMBB scenarios, peak throughput targets exceed 1 Gbps, though real-world achieved throughput is typically lower due to channel conditions and load. Sustained throughput below 60 Mbps indicates significant degradation.

**Latency (ms)** is the round-trip delay experienced by a data packet traveling from a user device to a server and back. 5G URLLC targets sub-1 ms over-the-air latency for applications like industrial automation, autonomous driving, and telemedicine. End-to-end latency above 50 ms is considered a warning condition; above 80 ms indicates a critical service degradation.

**Resource Utilization (%)** represents the fraction of available radio resources — specifically Resource Blocks (RBs) in the 5G NR air interface — that are actively allocated. High utilization (above 85%) signals that a cell is approaching congestion and may begin dropping or degrading service for new users. Utilization monitoring is the primary trigger for capacity expansion decisions.

**Packet Loss Ratio** is the fraction of transmitted data packets that fail to be delivered. Packet loss directly degrades application performance — causing TCP retransmissions, video buffering, and voice call quality degradation. In well-functioning cells, packet loss should remain below 1%. Values above 5% indicate a serious problem in the radio channel or network infrastructure.

**Signal-to-Noise Ratio (SNR, dB)** measures the quality of the radio signal received at the user device, expressed as a logarithmic ratio of signal power to background noise. Higher SNR enables higher-order modulation schemes (e.g., 256-QAM instead of QPSK), which directly translate to higher spectral efficiency and throughput. SNR is primarily determined by the physical environment — distance from the base station, obstructions, and interference from neighboring cells.

**QoS Satisfaction** is a composite score measuring how well a cell meets its Quality of Service commitments across all active service types. In 5G, QoS is managed through the **5QI (5G QoS Identifier)** framework, which assigns standardized delay budgets, packet error rates, and priority levels to different traffic classes.

> **[FIGURE 5]** — *KPI Summary Cards: screenshot of the four KPI cards at the top of the Network Monitor page showing average Throughput, Latency, Resource Load, and cell health counts (Healthy / Warning / Critical). Capture from `http://localhost:4000`.*
>
> `![Figure 5: Network KPI Summary Cards — live average metrics across all 50 cells](docs/figures/fig5_kpi_cards.png)`

> **[FIGURE 6]** — *Live KPI Chart: screenshot of the Recharts time-series panel on the Network Monitor page, showing throughput, latency, or load over the last 20 polling ticks. Capture after waiting ~1 minute for data to accumulate.*
>
> `![Figure 6: Live KPI Time-Series Chart — rolling 20-tick network performance history](docs/figures/fig6_live_chart.png)`

---

### 2.5 Intent-Based Networking (IBN)

Intent-Based Networking is a network management paradigm that shifts the operator interface from imperative commands (*"set cell 12 transmit power to 43 dBm"*) to declarative goals (*"ensure reliable communications in the hospital zone"*). The network management system is then responsible for translating the operator's intent into the specific technical actions required to achieve it.

The IBN concept was formalized by the **IETF (Internet Engineering Task Force)** and further developed by the **TMForum** and **ETSI** for autonomous network management. It represents the foundational philosophy behind 6G's vision of **self-driving networks** — systems that can autonomously manage their own configuration, healing, and optimization.

The translation from intent to action involves several steps that this system implements directly:

1. **Intent Recognition** — parsing natural language to identify the operational goal, affected zone, urgency, and relevant network slice type
2. **Intent Validation** — checking that the requested goal is feasible given current network state
3. **Policy Generation** — translating the intent into specific network configuration parameters
4. **Execution and Verification** — applying the configuration and monitoring KPIs to confirm that the intent has been fulfilled

This system implements steps 1 through 3 fully through its AI agent pipeline, with step 4 represented by the before/after KPI comparison.

> **[FIGURE 7]** — *IBN workflow diagram: a horizontal flow with four labeled boxes connected by arrows: "Natural Language Intent" → "Intent Recognition (Agent 1)" → "Policy Generation (Agents 2–4)" → "Network Configuration + KPI Verification". Simple block diagram, can be drawn in any diagramming tool (draw.io, Figma, PowerPoint).*
>
> `![Figure 7: Intent-Based Networking Workflow — from natural language to network action](docs/figures/fig7_ibn_workflow.png)`

> **[FIGURE 8]** — *Intent submission form: screenshot of the Intent AI page (`http://localhost:4000/intent`) showing the text area with a sample intent typed in, and the history chips below. Capture before submitting.*
>
> `![Figure 8: Intent AI Page — natural language intent submission interface](docs/figures/fig8_intent_input.png)`

---

### 2.6 Agentic AI and Multi-Agent Systems

**Agentic AI** refers to AI systems that autonomously pursue goals by planning, making decisions, using tools, and executing multi-step tasks — moving beyond simple question-answering to actual problem-solving. Rather than generating a single static response, an agentic system reasons over a goal, breaks it into sub-tasks, calls external tools (such as databases or APIs), evaluates intermediate results, and iterates until the goal is achieved.

A **Multi-Agent System (MAS)** extends this concept by deploying multiple specialized agents, each with a focused role and a distinct set of capabilities, that collaborate to solve problems too complex for any single agent. This mirrors the way human organizations structure expertise — a hospital does not employ a single generalist; it has cardiologists, neurologists, radiologists, and surgeons, each contributing their specialized knowledge to a shared goal.

In this system, **CrewAI** is the orchestration framework that coordinates the four specialized agents. CrewAI implements a **sequential crew** model, where each agent receives the outputs of all previous agents as context — building a progressively richer understanding of the problem before producing its output. This design ensures that the final optimization recommendation is grounded in a complete picture: the understood intent, the planned configuration, and the observed network state.

The key properties that make this multi-agent design effective are:

- **Specialization:** Each agent is given a role description, backstory, and task prompt that focuses its reasoning on a specific domain (intent understanding, network planning, monitoring, optimization)
- **Context chaining:** Later agents receive the full structured outputs of earlier agents, allowing downstream reasoning to build on upstream knowledge
- **Tool use:** Agents can invoke external tools (in this case, the `NetworkDataReader` CSV tool) to ground their reasoning in real data rather than generating purely synthetic responses
- **Separation of concerns:** Failures in one agent can be handled gracefully without corrupting the outputs of others

> **[FIGURE 9]** — *Agent pipeline timeline: screenshot of the "Agent Pipeline" section inside the Intent Result Card after a successful intent submission. Shows the four numbered steps (Intent Parser → RAN Planner → Network Monitor → RAN Optimizer) each with a checkmark and summary sentence. Capture from `http://localhost:4000/intent` after submitting any intent.*
>
> `![Figure 9: Four-Agent Pipeline Timeline — sequential execution with per-agent summaries](docs/figures/fig9_agent_timeline.png)`

---

### 2.7 Large Language Models in Network Management

**Large Language Models (LLMs)** are transformer-based neural networks trained on massive corpora of text, enabling them to understand and generate human language with remarkable fluency and reasoning capability. Models like **Meta's Llama 3** — which powers this system — have been trained on hundreds of billions of tokens encompassing technical documentation, academic papers, code, and natural language, making them capable of understanding domain-specific concepts across telecommunications, networking, and systems engineering.

In the context of network management, LLMs offer several uniquely valuable capabilities:

- **Natural language understanding** — parsing the semantic intent behind free-form operator queries, including informal phrasing, domain jargon, and contextual references
- **Structured output generation** — producing well-formed JSON configurations that conform to complex schemas, effectively acting as a knowledge-grounded configuration generator
- **Technical reasoning** — applying domain knowledge about 3GPP standards, QoS frameworks, and network optimization principles to select appropriate parameter values
- **Adaptive behavior** — handling the full diversity of real-world intents without requiring explicit rule authorship for each scenario

This system accesses Llama 3.3 70B through **Groq's inference API**, which provides hardware-accelerated LLM inference with sub-second response times. The **LiteLLM** adapter layer within CrewAI normalizes API calls across different LLM providers, making the model backend interchangeable.

---

## 3. System Architecture

The system follows a clean client-server architecture with the AI processing fully encapsulated in the backend. The browser-based frontend handles all visualization and user interaction, communicating with the backend exclusively through a single REST API endpoint.

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                        │
│                                                              │
│  /              Network Monitor (live topology + KPIs)       │
│  /intent        Intent AI (submit intent → results)          │
│  /dataset       Dataset Manager (upload / inspect CSV)       │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP POST /api/intent
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Flask Backend (Python)                      │
│                                                              │
│  server.py  →  ran_crew.py  →  CrewAI Sequential Crew        │
│                                                              │
│  Agent 1: Intent Parser                                      │
│    NL text  →  structured intent JSON                        │
│                    ↓                                         │
│  Agent 2: RAN Planner                                        │
│    intent   →  3GPP Release 18 config JSON                   │
│                    ↓                                         │
│  Agent 3: Network Monitor                                    │
│    reads CSV (filtered by location zone) → KPI health JSON   │
│                    ↓                                         │
│  Agent 4: RAN Optimizer                                      │
│    selects action → before/after KPI measurements            │
│                                                              │
│  All agents use Groq Llama 3.3 70B via LiteLLM              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              6G HetNet Dataset (CSV)                         │
│  5,000 rows · 50 cells · Location_Tag per cell              │
│  Zones: hospital | stadium | factory | downtown | residential│
└─────────────────────────────────────────────────────────────┘
```

**Data flow for an intent submission:**

1. The engineer types a natural language intent in the browser and submits the form.
2. The frontend sends a `POST /api/intent` request to the Flask backend with the intent string.
3. The backend instantiates the CrewAI sequential crew and starts Agent 1.
4. Each agent executes in turn, passing its structured JSON output to the next agent as context.
5. Agents 3 and 4 additionally call the `NetworkDataReader` tool, which reads and filters the CSV dataset to retrieve real cell KPI data for the relevant location zone.
6. The backend assembles the four agent outputs into a single result object and returns it as a JSON response.
7. The frontend renders the result as an intent result card: banner, agent timeline, KPI comparison, configuration table, and highlighted topology.

The frontend also independently loads and processes the CSV dataset in the browser using PapaParse, enabling the Network Monitor page to display live-simulated topology and KPI data entirely client-side — without any additional backend calls.

> **[FIGURE 10]** — *End-to-end data flow diagram: a vertical sequence showing (1) Engineer types intent → (2) Browser POST request → (3) Flask server → (4) CrewAI Crew → (5) Agent 1–4 boxes in sequence → (6) CSV Dataset read → (7) JSON response → (8) Browser renders result card. Can be drawn as a swimlane or simple flow diagram.*
>
> `![Figure 10: End-to-End Intent Processing Data Flow](docs/figures/fig10_dataflow.png)`

---

## 4. Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Core language. Selected for its mature data science ecosystem and first-class support in CrewAI and LLM libraries. |
| **Flask** | 3.x | Lightweight WSGI web framework. Provides the REST API layer with minimal boilerplate. |
| **Flask-CORS** | 4.x | Enables Cross-Origin Resource Sharing so the Next.js frontend (running on a different port) can call the backend API. |
| **CrewAI** | 0.70+ | Multi-agent AI orchestration framework. Manages agent roles, tasks, tool use, and sequential crew execution. |
| **Groq API** | — | Cloud inference API providing hardware-accelerated access to the Llama 3.3 70B model. |
| **LiteLLM** | — | Universal LLM adapter used internally by CrewAI. Normalizes API calls across OpenAI, Groq, Anthropic, and other providers. |
| **pandas** | 2.x | DataFrame library used to load, filter, and sample rows from the CSV dataset inside the `csv_tool.py` tool. |
| **pydantic** | 2.x | Data validation library used to define and enforce the input schema for the `NetworkDataReader` tool. |
| **python-dotenv** | 1.x | Loads environment variables from a `.env` file, keeping secrets out of source code. |
| **gunicorn** | — | Production WSGI server used for Railway deployment, replacing the Flask development server. |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | React meta-framework with the App Router. Provides server-side rendering, file-based routing, and API proxy rewrites. |
| **TypeScript** | 5.x | Strongly typed superset of JavaScript. Catches schema mismatches at compile time, particularly important for the CSV-to-component data flow. |
| **Tailwind CSS** | 3.x | Utility-first CSS framework used throughout for consistent, responsive styling without custom CSS files. |
| **Recharts** | 2.x | React charting library built on D3. Used for the live KPI time-series chart on the Network Monitor page. |
| **PapaParse** | 5.x | High-performance CSV parser that runs entirely in the browser, enabling client-side dataset loading without a server round-trip. |
| **Lucide React** | 0.400+ | Icon library providing the consistent set of line icons used across the dashboard UI. |

### Deployment

| Service | Purpose |
|---------|---------|
| **Railway** | Cloud platform for deploying the Python/Flask backend. Auto-detects the `Procfile` and manages environment variables and scaling. |
| **Vercel** | Frontend hosting platform optimized for Next.js. Provides automatic deployments on every Git push, global CDN, and edge functions. |

---

## 5. Project Structure

```
ran-dashboard-backend/
│
├── server.py               # Flask app — routes, CORS, entry point
├── ran_crew.py             # CrewAI agents, tasks, pipeline logic
├── csv_tool.py             # Custom CrewAI tool for reading the dataset
├── fallbacks.py            # Rule-based fallback responses (no LLM)
├── download_dataset.py     # One-time script to download the CSV dataset
├── requirements.txt        # Python dependencies
├── Procfile                # gunicorn start command (Railway/Render)
├── railway.toml            # Railway deployment configuration
├── .env                    # Environment variables (not committed to git)
│
├── data/
│   └── 6G_HetNet_with_location.csv   # Main dataset (5,000 rows, 50 cells)
│
├── docs/
│   └── figures/            # Screenshots and diagrams for this document
│
└── frontend/
    ├── app/
    │   ├── layout.tsx          # Root layout — sidebar navigation, DatasetContext provider
    │   ├── page.tsx            # Network Monitor page (/)
    │   ├── intent/page.tsx     # Intent AI page (/intent)
    │   └── dataset/page.tsx    # Dataset Manager page (/dataset)
    │
    ├── components/
    │   ├── network/
    │   │   ├── NetworkTopology.tsx   # SVG cell topology with zone highlighting
    │   │   ├── KPICards.tsx          # Summary KPI stat cards
    │   │   └── LiveChart.tsx         # Real-time KPI line chart (Recharts)
    │   ├── intent/
    │   │   ├── IntentPanel.tsx       # Intent input form + submission history
    │   │   └── IntentResultCard.tsx  # Full structured result display
    │   └── dataset/
    │       └── DatasetManager.tsx    # CSV upload, validation, and metadata view
    │
    ├── hooks/
    │   ├── useDataset.ts       # CSV loading, PapaParse, DatasetContext
    │   └── useNetworkPoll.ts   # Simulated live KPI polling at ~3s intervals
    │
    ├── lib/
    │   ├── types.ts            # TypeScript interfaces: CellData, RawRow, IntentResult, …
    │   ├── network.ts          # buildCellIndex(), generateSnapshot(), computeSummary()
    │   └── api.ts              # processIntent() — POST /api/intent wrapper
    │
    └── public/
        └── data/
            └── 6G_HetNet_with_location.csv   # Dataset bundled for browser access
```

---

## 6. Setup and Installation

### Prerequisites

Before running the project, ensure the following are installed on your system:

- **Python 3.11 or higher** — the backend requires modern Python features including match statements and improved typing
- **Node.js 18 or higher** — required by Next.js 14
- **A Groq API key** — free to obtain at [https://console.groq.com](https://console.groq.com). Groq provides fast, free-tier access to Llama 3.3 70B

### Backend Setup

```bash
# Navigate to the project root
cd ran-dashboard-backend

# Install all Python dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file and add your Groq API key:
# GROQ_API_KEY=gsk_your_key_here

# Download the dataset (one-time operation)
python download_dataset.py

# Start the backend development server
python server.py
# The server starts at http://localhost:8000
# Verify with: GET http://localhost:8000/health
```

### Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# (Optional) Configure the backend URL for local development
# Create frontend/.env.local and add:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Start the Next.js development server
npm run dev -- --port 4000
# The frontend runs at http://localhost:4000
```

> **Note:** If ports 3000 or 3001 are already in use on your machine, use `--port 4000` or any available port as shown above.

---

## 7. Dataset Requirements

The dashboard is driven by a structured CSV dataset representing the state of the radio network. The system enforces strict column validation — both in the backend (Python, before LLM processing) and in the frontend (TypeScript, before visualization). A dataset missing any required column will be rejected with a descriptive error message. There is no silent fallback to synthetic or random data.

### Required Columns

| Column | Type | Description |
|--------|------|-------------|
| `Cell_ID` | integer | Unique identifier for each radio cell. Used as the primary key linking dataset rows to topology nodes. |
| `Cell_Type` | string | Cell tier in the HetNet hierarchy: `Macro`, `Micro`, `Pico`, or `Femto`. Determines visual size and link distance in the topology. |
| `Achieved_Throughput_Mbps` | float | Downlink throughput delivered to users in megabits per second. Primary measure of user experience quality. |
| `Network_Latency_ms` | float | Round-trip packet delay in milliseconds. Critical for latency-sensitive applications and URLLC slice assessment. |
| `Resource_Utilization` | float | Fraction of radio resource blocks currently allocated (0.0–1.0 or 0–100). Indicates cell load and congestion risk. |
| `Packet_Loss_Ratio` | float | Fraction of transmitted packets lost (0.0–1.0). High values indicate radio channel issues or overload. |
| `Signal_to_Noise_Ratio_dB` | float | Received signal quality in decibels. Determines the maximum achievable modulation order and spectral efficiency. |
| `Bandwidth_MHz` | float | Channel bandwidth assigned to the cell in megahertz. Directly determines the maximum available throughput capacity. |
| `Location_X` | float | X coordinate of the cell in the coverage grid (0–1000). Used to position the cell in the network topology visualization. |
| `Location_Y` | float | Y coordinate of the cell in the coverage grid (0–1000). Used together with Location_X for topology positioning and zone inference. |
| `Location_Tag` | string | Geographic zone label for the cell. **Required for location-aware intent routing.** Must be one of: `hospital`, `stadium`, `factory`, `downtown`, or `residential`. |

### Location Zone Mapping

The default 6G HetNet dataset assigns `Location_Tag` values based on each cell's X/Y coordinates within a 1000×1000 normalized coverage grid. This spatial partitioning reflects realistic urban deployment scenarios:

| Zone | X Range | Y Range | Network Use Case |
|------|---------|---------|-----------------|
| `hospital` | 0–350 | 0–350 | Ultra-reliable communications for medical devices, emergency services, and remote patient monitoring. Mapped to URLLC slice type. |
| `factory` | 650–1000 | 0–350 | Industrial IoT, robotic automation, and machine-to-machine communication. High device density, mMTC and URLLC mix. |
| `stadium` | 650–1000 | 650–1000 | Mass gatherings, live events, and entertainment venues with extreme concurrent user density. eMBB slice type. |
| `residential` | 0–350 | 650–1000 | Home broadband, consumer IoT, and suburban broadband services. Moderate density, eMBB. |
| `downtown` | 350–650 | 350–650 | Dense urban core with mixed traffic: pedestrian users, enterprise buildings, and small cell deployments. Mixed slice types. |

When a network engineer submits an intent referencing a specific location (e.g., *"hospital"*, *"stadium"*), the system's `_infer_location()` function maps intent keywords to the corresponding zone tag, and the `NetworkDataReader` tool filters the dataset to return only cells from that zone — ensuring that the KPI analysis reflects the actual conditions in the relevant geographic area.

> **[FIGURE 11]** — *Location zone map: a 1000×1000 grid divided into five colored quadrants/regions — hospital (top-left, red), factory (top-right, orange), stadium (bottom-right, blue), residential (bottom-left, green), downtown (center, yellow). Label each zone with its name and X/Y range. Draw using any diagramming tool.*
>
> `![Figure 11: Location Zone Map — 5-zone spatial partitioning of the 1000×1000 coverage grid](docs/figures/fig11_location_zones.png)`

> **[FIGURE 12]** — *Dataset Manager page: screenshot of `http://localhost:4000/dataset` showing the current dataset metadata panel (rows, cells, columns) and the CSV Format Requirements section listing all 11 required columns.*
>
> `![Figure 12: Dataset Manager — metadata view and column requirements](docs/figures/fig12_dataset_manager.png)`

---

## 8. AI Pipeline — The Four-Agent Crew

The AI pipeline is defined in `ran_crew.py` and orchestrated by CrewAI as a **sequential crew** — meaning each agent executes in order, and every agent's output is passed as context to the next. All four agents share the same underlying LLM: **Groq Llama 3.3 70B**, accessed via LiteLLM.

The pipeline is triggered by a single call to `run_pipeline(user_intent)` from `server.py`. If the LLM pipeline fails for any reason — API timeout, model error, or malformed output — the system gracefully falls back to `fallbacks.py`, a deterministic rule-based engine that produces valid (though simplified) results based on intent keyword matching. The frontend clearly labels fallback responses with a warning badge.

> **[FIGURE 13]** — *Full Intent Result Card: screenshot of `http://localhost:4000/intent` after submitting a hospital emergency intent. Capture the entire right panel showing the intent banner at the top, agent timeline, KPI cards, config table, and highlighted topology at the bottom.*
>
> `![Figure 13: Full Intent Result Card — complete AI pipeline output for a hospital emergency intent](docs/figures/fig13_intent_result_full.png)`

---

### Agent 1 — Intent Parser

**Role:** Senior Telecom Intent Analyst
**Input:** Raw natural language string from the engineer
**Output:** Structured JSON object representing the parsed intent

The Intent Parser is the entry point of the pipeline. Its responsibility is to transform the engineer's free-form text into a machine-readable intent structure that subsequent agents can reason over precisely. The agent classifies the intent into one of eight operational categories and maps it to the corresponding 3GPP network slice type:

| Intent Type | Description | Slice |
|-------------|-------------|-------|
| `emergency` | Medical, disaster response, or public safety | URLLC |
| `stadium_event` | Large venue, sports event, concert | eMBB |
| `iot_deployment` | Sensor networks, smart city infrastructure | mMTC |
| `industrial_iot` | Factory automation, robotics | mMTC / URLLC |
| `video_streaming` | High-bandwidth media delivery | eMBB |
| `smart_city` | Traffic, utilities, urban management | mMTC |
| `voice_priority` | VoIP, emergency calling | URLLC |
| `general_optimization` | Baseline performance improvement | eMBB |

The agent also extracts: affected location entities, urgency level, confidence score, and a concise human-readable summary of its interpretation.

> **[FIGURE 14]** — *Intent Banner: close-up screenshot of the colored intent summary banner at the top of the result card, showing the intent type badge, slice type (e.g., URLLC), zone (e.g., Hospital), confidence %, health score, and action label.*
>
> `![Figure 14: Intent Summary Banner — parsed intent type, slice, zone, and confidence](docs/figures/fig14_intent_banner.png)`

---

### Agent 2 — RAN Planner

**Role:** Expert 5G Network Configuration Architect
**Input:** Structured intent JSON from Agent 1
**Output:** Complete 3GPP Release 18 network configuration JSON

The RAN Planner translates the understood intent into specific, standards-compliant network configuration parameters. Drawing on its training knowledge of 3GPP specifications, the agent generates a multi-section configuration object covering:

- **Network Slice parameters:** slice type (SST), slice differentiator, priority, and preemption capability
- **QoS parameters:** 5QI identifier, Allocation and Retention Priority (ARP), Guaranteed Bit Rate (GBR), Maximum Bit Rate (MBR), and Packet Delay Budget (PDB)
- **RAN parameters:** NR numerology (subcarrier spacing), MIMO configuration (antenna layers), downlink/uplink scheduler type, and carrier aggregation settings

For example, an emergency intent at a hospital would produce a URLLC configuration with 5QI=1 (voice, GBR, 100 ms PDB), high ARP priority, URLLC-optimized numerology μ=3 (120 kHz subcarrier spacing for minimal latency), and a strict round-robin scheduler to ensure fairness under load.

> **[FIGURE 15]** — *Network Configuration Table: close-up screenshot of the "Network Configuration" section inside the result card, showing the grouped table rows for Network Slice, QoS Parameters, and RAN Configuration parameters with their generated values.*
>
> `![Figure 15: Generated 3GPP Network Configuration — slice, QoS, and RAN parameters](docs/figures/fig15_config_table.png)`

---

### Agent 3 — Network Monitor

**Role:** 5G Network Operations Center Analyst
**Input:** Intent context + location zone (inferred from intent keywords)
**Tool:** `NetworkDataReader` — reads a real row from the CSV filtered by `Location_Tag`
**Output:** KPI health assessment JSON with per-metric analysis and overall health score

The Network Monitor bridges the gap between the AI-generated plan and real network data. Rather than reasoning abstractly, this agent uses the `NetworkDataReader` tool to fetch actual KPI measurements from a real cell in the relevant location zone, then performs a structured health assessment against standard thresholds.

Location inference maps intent keywords to dataset zones before the tool call:

| Keywords in Intent | Inferred Zone |
|-------------------|---------------|
| "hospital", "emergency", "clinic", "ambulance", "medical" | `hospital` |
| "stadium", "concert", "festival", "match", "arena", "fans" | `stadium` |
| "factory", "manufacturing", "industrial", "robots", "robotics" | `factory` |
| "downtown", "city center", "CBD", "urban core" | `downtown` |
| "residential", "suburb", "home", "neighbourhood" | `residential` |

The health assessment evaluates each KPI against warning and critical thresholds, identifies specific violations, and computes a composite health score (0–100). A score above 75 is healthy; 50–75 is a warning; below 50 is critical.

---

### Agent 4 — RAN Optimizer

**Role:** Senior RAN Optimization Engineer
**Input:** All three previous agent outputs (intent, config, monitor)
**Tool:** `NetworkDataReader` (called twice — before and after optimization states)
**Output:** Selected optimization action with quantified before/after KPI measurements

The RAN Optimizer is the culminating agent of the pipeline. It synthesizes all prior knowledge — the intent, the recommended configuration, and the observed network state — to select the most appropriate optimization action and quantify its impact.

**Action selection logic:**

| Network Condition | Selected Action | Description |
|-------------------|----------------|-------------|
| Cell load > 80% with low throughput | `scale_bandwidth` | Activate additional carrier component or widen channel bandwidth |
| Cell load > 80% regardless | `activate_cell` | Bring an adjacent cell online to offload traffic |
| Latency or packet loss violations | `modify_qos` | Adjust QoS parameters — tighten delay budget, raise priority |
| Detected slice type mismatch | `adjust_priority` | Reconfigure slice parameters to match intent requirements |
| Health score > 85, all metrics healthy | `energy_saving` | Activate power-saving mode — reduce transmit power or sleep idle cells |

**Before/After KPI Measurement:**
The optimizer calls the `NetworkDataReader` tool twice — first requesting a cell in the current (potentially degraded) zone state, then requesting a cell in a healthy state as a proxy for the post-optimization condition. The percentage improvement for each metric is calculated as `|((after − before) / before)| × 100`, with the direction interpreted according to metric semantics (lower latency and loss are improvements; higher throughput and SNR are improvements).

> **[FIGURE 16]** — *KPI Before/After Comparison: close-up screenshot of the four KPI comparison cards inside the result card, showing Throughput, Latency, Resource Load, and Packet Loss each with a before value → after value and a green "Improved" percentage badge.*
>
> `![Figure 16: KPI Before/After Comparison — quantified optimization impact across four metrics](docs/figures/fig16_kpi_comparison.png)`

> **[FIGURE 17]** — *Affected Topology: close-up screenshot of the mini topology panel at the bottom of the result card, with hospital-zone cells fully lit and all other cells dimmed to ~15% opacity. The cyan-highlighted monitored cell should be visible with its extra glow ring.*
>
> `![Figure 17: Affected Network Topology — zone-highlighted cells with monitored cell in cyan](docs/figures/fig17_affected_topology.png)`

### Fallback Behavior

If any stage of the AI pipeline fails — due to LLM API unavailability, model timeout, rate limiting, or malformed output — the system catches the exception and invokes `fallbacks.py`. This rule-based engine applies keyword matching to the original intent string and returns a deterministic, pre-defined result structure. While less precise than the LLM-driven pipeline, fallback results are always structurally valid and usable. The frontend displays a clear **Fallback mode** warning badge when this occurs.

---

## 9. API Reference

The backend exposes two HTTP endpoints.

---

### GET /health

Returns the current server status, model configuration, and agent roster. Use this endpoint to verify that the backend is running and the Groq API key is configured before submitting intents.

**Response:**
```json
{
  "status": "ok",
  "service": "RAN Optimizer Backend (CrewAI)",
  "groq_configured": true,
  "model": "llama-3.3-70b-versatile",
  "agents": ["Intent Parser", "RAN Planner", "Network Monitor", "RAN Optimizer"]
}
```

---

### POST /api/intent

Runs the full four-agent AI pipeline for the submitted intent string. This is the primary endpoint used by the frontend. Processing time is typically 10–30 seconds depending on LLM response latency.

**Request body:**
```json
{
  "intent": "Prioritize emergency communications at the central hospital now"
}
```

**Response — successful AI run:**
```json
{
  "success": true,
  "result": {
    "intent":       { "intent_type": "emergency", "slice_type": "URLLC", ... },
    "config":       { "network_slice": { ... }, "qos_parameters": { ... }, "ran_config": { ... } },
    "monitor":      { "cell_id": 7, "location_tag": "hospital", "health_score": 52, ... },
    "optimization": { "action": "modify_qos", "before": { ... }, "after": { ... } }
  }
}
```

**Response — fallback (AI failed, rule-based result returned):**
```json
{
  "success": true,
  "result": { ... },
  "warning": "AI agents encountered an error (TimeoutError). Showing rule-based fallback."
}
```

**Response — request error:**
```json
{
  "success": false,
  "error": "Missing 'intent' field in request body"
}
```

---

## 10. Frontend Pages

The frontend is a Next.js 14 application using the App Router. It consists of three pages, accessible via the sidebar navigation.

### Network Monitor (`/`)

The Network Monitor page provides a continuously updated view of the entire radio network, simulating live operations center conditions. On each polling interval (~3 seconds), the frontend advances through the dataset rows per cell and applies small random jitter to KPI values, creating realistic variation without requiring backend calls.

The page presents four panels:

- **KPI Summary Cards** — four large cards showing network-wide averages for throughput, latency, and resource load, plus a cell health breakdown (healthy / warning / critical counts). Values update on every polling tick.
- **Network Topology** — an SVG-rendered map of all 50 cells positioned according to their CSV coordinates. Cell size reflects cell type (Macro largest, Femto smallest); cell color indicates health status (green / amber / red). Hovering any cell opens a detailed tooltip showing all KPIs, the location zone, and the health score. Cells in a highlighted zone glow while others fade.
- **Live Chart** — a Recharts time-series chart plotting the last 20 polling ticks for throughput, latency, or cell load (selectable). Gives engineers a quick visual sense of network trends and instability.
- **Cell Type Distribution** — a breakdown panel showing cell counts per type (Macro / Micro / Pico / Femto) with per-type health status bars.

> **[FIGURE 18]** — *Network Topology with tooltip: screenshot of the topology SVG panel with a cell hovered, showing the full tooltip (Cell ID, type, zone in cyan, health status, and all KPI values in the table). Best captured when a critical (red) or warning (amber) cell is hovered.*
>
> `![Figure 18: Network Topology — cell hover tooltip with location zone and full KPIs](docs/figures/fig18_topology_tooltip.png)`

---

### Intent AI (`/intent`)

The Intent AI page is the primary interface for submitting natural language network intents and reviewing the AI pipeline results. It is divided into two panels.

The **left panel** contains the intent submission form, including a multi-line text area pre-populated with sample intents (covering hospital emergency, stadium event, factory IoT, and downtown optimization scenarios) for rapid testing. It also maintains a history of the last four submitted intents, displayed as clickable chips for quick re-submission.

The **right panel** renders the `IntentResultCard` component, which presents the pipeline results in six structured sections:

1. **Intent Banner** — a color-coded header strip showing intent type, network slice type, inferred location zone, AI confidence score, network health score, and the selected optimization action.
2. **Agent Pipeline Timeline** — a vertical four-step timeline showing each agent's execution status with a checkmark and a one-sentence summary of its output.
3. **KPI Before/After Comparison** — four metric cards each showing the pre-optimization measured value, post-optimization projected value, percentage change, and an "Improved" or "Degraded" label.
4. **Network Configuration Table** — all generated configuration parameters grouped by category (Network Slice, QoS Parameters, RAN Configuration).
5. **Network Monitor Details** — raw KPI readings from the monitored cell, including any threshold violations.
6. **Affected Topology** — the SVG topology with the matched location zone highlighted and non-matching cells dimmed to 15% opacity, with the monitored cell rendered in cyan.

> **[FIGURE 19]** — *Intent AI page — full view: screenshot of `http://localhost:4000/intent` after a successful submission, showing both the left input panel and the right result card together, to convey the full two-panel layout.*
>
> `![Figure 19: Intent AI Page — full two-panel layout after intent submission](docs/figures/fig19_intent_page_full.png)`

---

### Dataset Manager (`/dataset`)

The Dataset Manager page allows engineers to inspect and replace the dataset that drives both the frontend visualizations and the backend AI analysis.

The page displays metadata about the currently loaded dataset: filename, number of rows, number of unique cells, source (default or uploaded), and a list of all detected columns. Engineers can upload a custom CSV file, which is validated client-side against the full list of required columns before being accepted. If any required column is missing, a specific error message names the missing column. Engineers can also revert to the default 6G HetNet dataset at any time with a single click.

> **[FIGURE 20]** — *Dataset validation error: if you want to demonstrate the validation, upload a CSV missing the `Location_Tag` column and capture the red error message that appears naming the missing column. Screenshot from `http://localhost:4000/dataset`.*
>
> `![Figure 20: Dataset Validation Error — missing column rejection with specific error message](docs/figures/fig20_dataset_validation_error.png)`

---

## 11. Deployment

### Backend — Railway

Railway is a cloud application platform that simplifies Python service deployment. The backend is deployed as a single-worker gunicorn server.

1. Push the `ran-dashboard-backend/` directory to a GitHub repository.
2. In Railway: **New Project** → **Deploy from GitHub repo**.
3. If deploying from a monorepo, set the Root Directory to `ran-dashboard-backend/`.
4. Add the environment variable: `GROQ_API_KEY = gsk_your_key_here`.
5. Railway auto-detects the `Procfile` and deploys automatically.

**Procfile:**
```
web: gunicorn server:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
```

The `--timeout 120` flag is essential — LLM pipeline calls can take 20–40 seconds and would time out under gunicorn's default 30-second worker timeout.

---

### Frontend — Vercel

Vercel is the recommended platform for Next.js deployments, offering automatic builds, global CDN distribution, and seamless integration with the App Router.

1. Push the `frontend/` directory to a GitHub repository (or include it as a subfolder in a monorepo).
2. In Vercel: **New Project** → connect your GitHub repository.
3. Set the **Root Directory** to `frontend/` if deploying from a monorepo.
4. Add the environment variable:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-railway-app.up.railway.app
   ```
5. Click **Deploy**. Vercel auto-detects Next.js and configures the build pipeline.

After deployment, every push to the main branch triggers an automatic redeploy on Vercel and Railway respectively.

---

## 12. Environment Variables

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `GROQ_API_KEY` | Backend | **Yes** | API key for Groq inference. Obtain free at [console.groq.com](https://console.groq.com). Without this key, all intent requests will fall back to the rule-based engine. |
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | Optional | Full URL of the deployed backend (e.g., `https://app.railway.app`). If omitted in development, the Next.js proxy rewrites `/api/*` requests to `localhost:8000`. Must be set in production deployments on Vercel. |
| `PORT` | Backend | Auto | Port number for the gunicorn server. Set automatically by Railway from its internal routing configuration. Do not set manually in production. |
| `FLASK_ENV` | Backend | Optional | Set to `development` to enable Flask's interactive debugger and auto-reload. Do **not** use in production — the debugger exposes an execution shell. |

---

## Figure Index

| Figure | Description | Source |
|--------|-------------|--------|
| Fig. 1 | Dashboard overview — Network Monitor page | Screenshot: `localhost:4000` |
| Fig. 2 | 5G three-slice architecture (eMBB / URLLC / mMTC) | Diagram |
| Fig. 3 | 5G RAN architecture — UE to gNB to 5G Core | Diagram |
| Fig. 4 | HetNet topology — multi-tier cell visualization with hover | Screenshot: `localhost:4000` |
| Fig. 5 | KPI Summary Cards — live network averages | Screenshot: `localhost:4000` |
| Fig. 6 | Live KPI Time-Series Chart | Screenshot: `localhost:4000` |
| Fig. 7 | IBN workflow diagram | Diagram |
| Fig. 8 | Intent submission form | Screenshot: `localhost:4000/intent` |
| Fig. 9 | Agent Pipeline Timeline | Screenshot: `localhost:4000/intent` (after submit) |
| Fig. 10 | End-to-end data flow diagram | Diagram |
| Fig. 11 | Location zone map — 5-zone spatial partitioning | Diagram |
| Fig. 12 | Dataset Manager page | Screenshot: `localhost:4000/dataset` |
| Fig. 13 | Full Intent Result Card | Screenshot: `localhost:4000/intent` (after submit) |
| Fig. 14 | Intent Summary Banner | Screenshot: close-up of result card |
| Fig. 15 | Generated Network Configuration Table | Screenshot: close-up of result card |
| Fig. 16 | KPI Before/After Comparison cards | Screenshot: close-up of result card |
| Fig. 17 | Affected Topology — zone highlighted | Screenshot: close-up of result card |
| Fig. 18 | Network Topology with hover tooltip | Screenshot: `localhost:4000` (cell hovered) |
| Fig. 19 | Intent AI page — full two-panel layout | Screenshot: `localhost:4000/intent` |
| Fig. 20 | Dataset validation error message | Screenshot: `localhost:4000/dataset` (upload invalid CSV) |

---

---

## References

[1] 3rd Generation Partnership Project (3GPP), "System Architecture for the 5G System (5GS)," Technical Specification TS 23.501, Release 18, Dec. 2023. [Online]. Available: https://www.3gpp.org/ftp/Specs/archive/23_series/23.501/

[2] 3rd Generation Partnership Project (3GPP), "Intent driven management services for mobile networks; Requirements," Technical Specification TS 28.312, Release 18, 2023. [Online]. Available: https://www.3gpp.org/ftp/Specs/archive/28_series/28.312/

[3] A. Clemm, L. Ciavaglia, L. Z. Granville, and J. Tantsura, "Intent-Based Networking — Concepts and Definitions," Internet Engineering Task Force (IETF), Request for Comments RFC 9315, Oct. 2022. [Online]. Available: https://datatracker.ietf.org/doc/rfc9315/

[4] J. G. Andrews, S. Buzzi, W. Choi, S. V. Hanly, A. Lozano, A. C. K. Soong, and J. C. Zhang, "What Will 5G Be?" *IEEE Journal on Selected Areas in Communications*, vol. 32, no. 6, pp. 1065–1082, Jun. 2014. DOI: 10.1109/JSAC.2014.2328098.

[5] A. Damnjanovic, J. Montojo, Y. Wei, T. Ji, T. Luo, M. Vajapeyam, T. Yoo, O. Song, and D. Malladi, "A Survey on 3GPP Heterogeneous Networks," *IEEE Wireless Communications*, vol. 18, no. 3, pp. 10–21, Jun. 2011. DOI: 10.1109/MWC.2011.5876496.

[6] AI @ Meta, "The Llama 3 Herd of Models," arXiv preprint arXiv:2407.21783, Jul. 2024. [Online]. Available: https://arxiv.org/abs/2407.21783

[7] M. Polese, L. Bonati, S. D'Oro, S. Basagni, and T. Melodia, "Understanding O-RAN: Architecture, Interfaces, Algorithms, Security, and Research Challenges," *IEEE Communications Surveys & Tutorials*, vol. 25, no. 2, pp. 1376–1411, Second Quarter 2023. DOI: 10.1109/COMST.2023.3239220.

[8] X. Foukas, G. Patounas, A. Elmokashfi, and M. K. Marina, "Network Slicing in 5G: Survey and Challenges," *IEEE Communications Magazine*, vol. 55, no. 5, pp. 94–100, May 2017. DOI: 10.1109/MCOM.2017.1600951.

[9] R. Li, Z. Zhao, X. Zhou, G. Ding, Y. Chen, Z. Wang, and H. Zhang, "Intelligent 5G: When Cellular Networks Meet Artificial Intelligence," *IEEE Wireless Communications*, vol. 24, no. 5, pp. 175–183, Oct. 2017. DOI: 10.1109/MWC.2017.1600304WC.

[10] J. Wei, X. Wang, D. Schuurmans, M. Bosma, F. Xia, E. Chi, Q. V. Le, and D. Zhou, "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 35, pp. 24824–24837, 2022.

[11] 3rd Generation Partnership Project (3GPP), "5G; NR; Physical Layer Procedures for Data," Technical Specification TS 38.214, Release 18, 2023. [Online]. Available: https://www.3gpp.org/ftp/Specs/archive/38_series/38.214/

[12] TMForum, "Autonomous Networks: Empowering Digital Transformation," Technical Report TR290, Version 2.0, TMForum, Morristown, NJ, USA, 2021. [Online]. Available: https://www.tmforum.org/resources/technical-report/tr290-autonomous-networks/

[13] A. Kaloxylos, "A Survey and an Analysis of Network Slicing in 5G Networks," *IEEE Communications Standards Magazine*, vol. 2, no. 1, pp. 60–65, Mar. 2018. DOI: 10.1109/MCOMSTD.2018.1700072.

[14] S. Andreev, O. Galinina, A. Pyattaev, M. Gerasimenko, T. Tirronen, J. Torsner, J. Sachs, M. Dohler, and Y. Koucheryavy, "Understanding the IoT Connectivity Landscape: A Contemporary M2M Radio Technology Roadmap," *IEEE Communications Magazine*, vol. 53, no. 9, pp. 32–40, Sep. 2015. DOI: 10.1109/MCOM.2015.7263370.

[15] CrewAI, Inc., "CrewAI: Framework for Orchestrating Role-Playing, Autonomous AI Agents," GitHub Repository, 2024. [Online]. Available: https://github.com/crewAIInc/crewAI

[16] Groq, Inc., "Groq LPU Inference Engine," Technical Overview, 2024. [Online]. Available: https://groq.com

[17] T. Wolf et al., "Transformers: State-of-the-Art Natural Language Processing," in *Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing: System Demonstrations (EMNLP)*, pp. 38–45, 2020. DOI: 10.18653/v1/2020.emnlp-demos.6.

[18] Vercel, Inc., "Next.js 14 Documentation," 2024. [Online]. Available: https://nextjs.org/docs

[19] W. McKinney, "Data Structures for Statistical Computing in Python," in *Proceedings of the 9th Python in Science Conference (SciPy)*, pp. 56–61, 2010.

[20] ETSI, "Experiential Networked Intelligence (ENI); ENI Architecture," ETSI GS ENI 005, V2.1.1, European Telecommunications Standards Institute, Jun. 2020. [Online]. Available: https://www.etsi.org/deliver/etsi_gs/ENI/001_099/005/02.01.01_60/gs_ENI005v020101p.pdf

---

*Documentation generated for the RAN Optimization Dashboard project. For issues or contributions, please refer to the project repository.*
