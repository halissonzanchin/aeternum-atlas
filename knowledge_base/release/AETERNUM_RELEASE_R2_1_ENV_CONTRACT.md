# Aeternum Atlas — Environment Variable Contract
**Release Phase**: `AETERNUM-RELEASE-R2.1-FASTTRACK`  
**Document Version**: `1.0.0`  
**Classification**: `DEPLOYMENT_SECURITY_CONTRACT`  

---

## 1. Project Reference Topology

| Environment | Purpose | Supabase Ref | Hostname | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Staging** | Safe pre-production validation & smoke testing | `hutohshswppahipgcwio` | `hutohshswppahipgcwio.supabase.co` | `INACTIVE` (Requires unpause/restore) |
| **Production** | Live institutional platform (STRICT LOCK) | `hyivyrietgjdazgizafp` | `hyivyrietgjdazgizafp.supabase.co` | `ACTIVE_HEALTHY` |

---

## 2. Frontend Client Variables (Vite Bundle)

All `VITE_*` variables are embedded into the client JavaScript bundle at build time. **Never place secrets in `VITE_*` variables.**

| Variable Name | Staging Value | Production Value | Classification | Description |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://hutohshswppahipgcwio.supabase.co` | `https://hyivyrietgjdazgizafp.supabase.co` | **Public** | Supabase REST/GraphQL gateway URL |
| `VITE_SUPABASE_ANON_KEY` | *(Staging project anon key)* | *(Production project anon key)* | **Public** | Supabase anonymous client API key with RLS enforcement |
| `VITE_ATLAS_AI_MODE` | `standby` | `standby` *(or `active` once verified)* | **Public** | Controls Atlas AI fallback. `standby` returns honest institutional maintenance text |
| `VITE_AETERNUM_VITA_PIPELINE` | `off` | `off` | **Public** | Disables LiveKit voice connection attempts; prevents WebSocket loops |
| `VITE_LIVEKIT_AGENT_NAME` | `aeternum-vita-voice` | `aeternum-vita-voice` | **Public** | Agent room identifier |
| `VITE_ATLAS_RUNTIME` | `cloud` | `cloud` | **Public** | Ensures application runs against cloud services, never localhost bridge |

---

## 3. Server & Edge Function Secrets (Supabase Vault / Secrets Store)

These values are configured **strictly** inside the Supabase Project Dashboard (`Settings > Edge Functions Secrets`) or deployment pipeline. **NEVER** add these variables to Vercel or local `.env` files.

| Secret Name | Supabase Location | Classification | Description |
| :--- | :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions / Backend Scripts | **Confidential** | Administrative service role bypassing RLS |
| `GEMINI_API_KEY` | Edge Function `ai-tutor` | **Confidential** | Google Gemini API key for embeddings |
| `LIVEKIT_URL` | Edge Function `voice-token` | **Confidential** | LiveKit Cloud WebSocket URL |
| `LIVEKIT_API_KEY` | Edge Function `voice-token` | **Confidential** | LiveKit API Key for room token generation |
| `LIVEKIT_API_SECRET` | Edge Function `voice-token` | **Confidential** | LiveKit secret for server-side JWT signing |
| `DEEPGRAM_API_KEY` | Backend Agent Runtime | **Confidential** | Deepgram Voice TTS engine key |
| `CARTESIA_API_KEY` | Backend Agent Runtime | **Confidential** | Cartesia Voice TTS engine key |

---

## 4. Vercel Staging Build Configuration

- **Framework**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: `20.x` or `22.x`
- **Environment Variables**: Configure the Staging values from Section 2 in Vercel Project Settings (`Environment: Preview / Development`).
