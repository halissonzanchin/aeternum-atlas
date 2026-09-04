# AETERNUM ATLAS & LOCAL ENVIRONMENT PORT REGISTRY
## Project Coexistence Governance

This document establishes the canonical local port assignments for development and QA across local services, preventing resource collision and ensuring safe coexistence with other running platforms (e.g., Prometheus).

### Canonical Local Port Registry

| Service Name | Port | Host | Protocol | Project Ownership | Notes / Invariants |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `PROMETHEUS_WEB` | **5173** | `127.0.0.1` | HTTP / Vite | **Prometheus** | Dedicated to Prometheus. NEVER occupy, steal, or kill. |
| `AETERNUM_WEB` | **5174** | `127.0.0.1` | HTTP / Vite | **Aeternum Atlas** | Frontend dev server (`--port 5174 --strictPort`). |
| `AETERNUM_SPEECH` | **8000** | `127.0.0.1` | HTTP | **Aeternum Speech** | FastSpeech2 / local speech services. |
| `AETERNUM_AI_GATEWAY` | **8081** | `127.0.0.1` | HTTP / Node | **Aeternum Vita** | AI Voice Gateway daemon (`AETERNUM_AI_GATEWAY_PORT=8081`). |
| `AETERNUM_OLLAMA` | **11434** | `127.0.0.1` | HTTP / Docker | **Aeternum Vita** | Ollama LLM runtime (NVIDIA GPU pass-through). |

### Process Safety & Coexistence Invariants
1. Never terminate a process solely because a desired port is occupied.
2. Positively verify PID, command line, working directory, and project identity before any process management action.
3. If an occupied port belongs to Prometheus, another repository, or an external application: **DO NOT TERMINATE IT**.
