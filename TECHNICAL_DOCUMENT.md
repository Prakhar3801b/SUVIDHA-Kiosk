# SUVIDHA — Government Civic Utility Kiosk System
## Technical Architecture & Project Documentation

**Version:** 1.0 | **Date:** February 2026 | **Classification:** Project Report

---

# 1. PROJECT OVERVIEW

**SUVIDHA** (सुविधा) is a full-stack, bilingual, multi-kiosk civic services platform designed to modernize citizen-government interactions at the grassroots level. The system enables citizens to pay utility bills, apply for government services, and file grievances — all through a self-service touchscreen kiosk in their local municipal office.

The platform consists of five interconnected components:
- A **Kiosk Frontend** (Electron + React) deployed on physical kiosk PCs
- An **Admin Dashboard** (Electron + React) for municipal operators
- A **Cloud Backend API** (Node.js + Express) deployed on Railway
- A **Government Mock Server** simulating data exchange with state systems
- A **Local AI Server** (Python FastAPI + GPT-2) running on the Admin PC

---

# 2. SYSTEM ARCHITECTURE

## 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CITIZEN LAYER                         │
│    [Kiosk PC — Electron App / Web Browser]                   │
│     React 18 + Vite 5 + React Router + WebSocket Client      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS REST + WSS WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLOUD BACKEND (Railway)                     │
│              Node.js 20 + Express 4 + ws Library             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Payments │ │  Forms   │ │Complaints│ │   Admin API  │   │
│  │  Route   │ │  Route   │ │  Route   │ │    Route     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       WebSocket Hub — Broadcasts to Admin & Kiosk    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────────┬───────────────────────┘
           │ SQL (SSL)                │ HTTP Sync
           ▼                          ▼
┌──────────────────┐     ┌───────────────────────────────┐
│  Supabase Cloud  │     │  Govt Mock Server (Railway)   │
│  PostgreSQL DB   │     │  Node.js — Receives sync data │
│  10 Tables       │     │  from kiosks to govt systems  │
└──────────────────┘     └───────────────────────────────┘
           ▲
           │ ngrok Tunnel
┌──────────────────────────────────────────────────────────┐
│              ADMIN PC (Local Machine)                     │
│  ┌──────────────────────┐  ┌───────────────────────────┐ │
│  │  Admin Dashboard     │  │  AI Server (Python)       │ │
│  │  React + Electron    │  │  FastAPI + GPT-2 (HF)     │ │
│  │  WebSocket Client    │  │  Port 8001 → ngrok tunnel │ │
│  └──────────────────────┘  └───────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## 2.2 Communication Protocols

| Connection | Protocol | Purpose |
|---|---|---|
| Kiosk ↔ Backend | HTTPS REST | Transactions, bill submissions, form applications |
| Kiosk ↔ Backend | WSS WebSocket | Real-time hardware alerts, payment approvals |
| Admin ↔ Backend | HTTPS REST | Data queries, payment approvals |
| Admin ↔ Backend | WSS WebSocket | Live event feed, kiosk status updates |
| Backend ↔ Supabase | PostgreSQL SSL | All persistent data storage |
| Backend ↔ AI Server | HTTP via ngrok | English language AI queries |
| Backend ↔ Govt Server | HTTP | Batch sync of civic data |

---

# 3. TECHNOLOGY STACK

## 3.1 Frontend (Kiosk & Admin)

| Component | Technology | Version | Purpose |
|---|---|---|---|
| UI Framework | React | 18.2.0 | Component-based UI |
| Build Tool | Vite | 5.2.0 | Fast bundling and HMR |
| Routing | React Router DOM | 6.22.3 | Screen navigation |
| Desktop Shell | Electron | 30.0.0 | Kiosk desktop application |
| HTTP Client | Axios | 1.6.8 | REST API calls |
| Language Detection | Franc | 6.2.0 | Hindi/English detection |
| On-screen Keyboard | React Simple Keyboard | 3.7.91 | Touch input for kiosk |
| Styling | Vanilla CSS | — | Custom white/orange theme |
| Fonts | Google Fonts (Inter, Noto Sans Devanagari) | — | Bilingual typography |

## 3.2 Backend (Cloud)

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 20 LTS | Server runtime |
| Framework | Express | 4.x | REST API routing |
| WebSocket | ws | — | Real-time bidirectional events |
| Database Client | pg (node-postgres) | — | PostgreSQL queries |
| Validation | Joi | — | Request schema validation |
| Security | Helmet | — | HTTP security headers |
| Rate Limiting | express-rate-limit | — | DDoS/abuse protection |
| Environment | dotenv | — | Secrets management |
| Encryption | Node.js crypto (built-in) | — | AES-256-GCM encryption |

## 3.3 AI System

| Component | Technology | Purpose |
|---|---|---|
| Server Framework | Python FastAPI | REST endpoint for AI queries |
| ASGI Server | Uvicorn | Production-grade async server |
| AI Model | GPT-2 (HuggingFace) | English natural language responses |
| Hindi FAQ | JSON keyword matching | Instant Hindi query resolution |
| Voice Input | Web Speech API (SpeechRecognition) | Hindi + English voice queries |
| Tunnel | ngrok | Expose local AI to cloud backend |

## 3.4 Database & Infrastructure

| Service | Platform | Purpose |
|---|---|---|
| Database | Supabase (PostgreSQL) | Cloud-hosted relational database |
| Backend Hosting | Railway | Auto-scaling Node.js deployment |
| Mock Server Hosting | Railway | Government data endpoint |
| Frontend Hosting | Vercel | Global CDN for React apps |
| AI Tunnel | ngrok | Secure localhost tunnel |

---

# 4. DATABASE DESIGN

## 4.1 Schema Overview (10 Tables)

The database is structured across three migration files applied in order:

### Migration 1 — Core Tables (`001_init.sql`)

#### `kiosks`
Stores the registry of all physical kiosk machines.
| Column | Type | Description |
|---|---|---|
| id | VARCHAR | Unique kiosk identifier (e.g. KIOSK-1) |
| name | VARCHAR | Display name (e.g. Main Hall Kiosk) |
| location | VARCHAR | Physical location description |
| status | ENUM | online / offline / maintenance |
| last_heartbeat | TIMESTAMP | Last ping from the kiosk |
| created_at | TIMESTAMP | Registration time |

#### `transactions`
Master record — every action on a kiosk creates one row here.
| Column | Type | Description |
|---|---|---|
| id | UUID | Unique transaction ID |
| kiosk_id | VARCHAR (FK) | References kiosks.id |
| type | ENUM | bill_payment / form_application / complaint |
| status | ENUM | pending / completed / failed |
| completed_at | TIMESTAMP | When the action was finalized |

#### `bill_payments`
Records for all utility bill payments.
| Column | Type | Description |
|---|---|---|
| transaction_id | UUID (FK) | References transactions.id |
| bill_type | ENUM | electricity / gas / property_tax |
| account_number | VARCHAR | Citizen's utility account |
| amount | NUMERIC | Bill amount in INR |
| payment_method | ENUM | upi / cash |
| receipt_number | VARCHAR | Generated receipt (e.g. RCP-20260228-001) |

#### `form_applications`
Government form submissions.
| Column | Type | Description |
|---|---|---|
| transaction_id | UUID (FK) | References transactions.id |
| form_type | ENUM | gas_connection / driving_test / health_scheme / scholarship / property_registry |
| applicant_name | VARCHAR | Full name of citizen |
| mobile_no | VARCHAR | 10-digit mobile number |
| form_data | JSONB | Full form fields as flexible JSON |
| application_ref | VARCHAR | Generated reference number |

#### `complaints`
Citizen grievance records.
| Column | Type | Description |
|---|---|---|
| transaction_id | UUID (FK) | References transactions.id |
| complaint_id | VARCHAR | Generated ID (e.g. GRV-20260228-001) |
| mobile_no | VARCHAR | Complainant mobile |
| department | ENUM | electricity / gas / water / sanitation / roads / ration / other |
| description | TEXT | Full complaint text (min 10 chars) |
| input_method | ENUM | keyboard / voice |

#### `daily_receipt_counter`
Auto-incrementing counter per day for unique receipt numbers.

#### `physical_payment_approvals`
Cash payment workflow — kiosk generates a pending record, admin approves it.
| Column | Type | Description |
|---|---|---|
| transaction_id | UUID (FK) | References transactions.id |
| amount | NUMERIC | Cash amount to collect |
| status | ENUM | pending / approved / rejected |
| approved_by | VARCHAR | Admin who approved |
| approved_at | TIMESTAMP | Approval time |

### Migration 2 — Sync Queue (`002_queue.sql`)

#### `sync_queue`
Offline resilience buffer.
| Column | Type | Description |
|---|---|---|
| id | UUID | Queue entry ID |
| transaction_id | UUID (FK) | References transactions.id |
| payload | JSONB | Full data to sync to govt server |
| status | ENUM | pending / syncing / done / failed |
| retry_count | INT | Number of sync attempts |

### Migration 3 — Hardware & Govt (`003_kiosks_diagnostics.sql`)

#### `machine_diagnostics`
Hardware event log from each kiosk.
| Column | Type | Description |
|---|---|---|
| kiosk_id | VARCHAR (FK) | References kiosks.id |
| device | ENUM | printer / scanner |
| event_code | VARCHAR | e.g. paper_out, paper_jam, offline |
| severity | ENUM | info / warning / critical |

#### `govt_received_records`
Stores all data batches received by the government mock server.

## 4.2 Key Database Indexes
- `sync_queue.status` — fast filtering of pending items
- `sync_queue.created_at` — ordered processing
- `machine_diagnostics.kiosk_id` — per-kiosk hardware queries
- `govt_received_records.batch_id` — deduplication

---

# 5. SECURITY IMPLEMENTATION

## 5.1 Security Layers

| Layer | Mechanism | Implementation |
|---|---|---|
| **HTTP Headers** | Helmet middleware | Prevents XSS, clickjacking, MIME sniffing, sets strict CSP |
| **Rate Limiting** | express-rate-limit | 100 requests per 15 minutes per IP address |
| **Input Validation** | Joi schema validation | Every API endpoint validates all fields before processing |
| **Admin Authentication** | API Key header | All admin routes require `x-admin-key` header matching `ADMIN_API_KEY` |
| **Data Encryption** | AES-256-GCM | Sensitive payload encryption via `encryptionService.js` |
| **Database SSL** | Enforced TLS | All PostgreSQL connections use `ssl: { rejectUnauthorized: false }` |
| **Secrets Management** | Environment variables | All keys in `.env` files, never committed to version control |
| **CORS Policy** | Express CORS | Configurable origin whitelist on the backend |

## 5.2 Mobile Number Validation
All phone numbers must match Indian mobile number pattern: `/^[6-9]\d{9}$/` — starts with 6-9, exactly 10 digits.

## 5.3 Environment Variables (Never in Code)
```
DATABASE_URL      — Supabase PostgreSQL connection string
ADMIN_API_KEY     — Admin dashboard authentication key
GOVT_SERVER_URL   — Government mock server endpoint
AI_SERVER_URL     — ngrok tunnel URL to local AI server
```

---

# 6. REAL-TIME SYSTEM (WebSocket Hub)

## 6.1 Architecture

The WebSocket hub (`wsHub.js`) maintains two pools of connected clients:
- **Kiosk pool** — keyed by kiosk ID
- **Admin pool** — all connected admin dashboards

## 6.2 Event Types

| Event | Direction | Description |
|---|---|---|
| `kiosk_online` | Backend → Admin | Kiosk connected and active |
| `kiosk_offline` | Backend → Admin | Kiosk disconnected |
| `new_transaction` | Backend → Admin | Any new kiosk activity |
| `new_complaint` | Backend → Admin | Grievance filed |
| `new_application` | Backend → Admin | Form submitted |
| `physical_payment_pending` | Backend → Admin | Cash payment awaiting approval |
| `physical_payment_approved` | Backend → Kiosk | Admin approved cash payment |
| `hardware_critical` | Backend → Kiosk | Printer/scanner failure alert |
| `hardware_warning` | Backend → Admin | Hardware event log |

## 6.3 Heartbeat System
Kiosks send periodic heartbeat pings to the backend. If a heartbeat is missed, the backend marks the kiosk as `offline` and broadcasts to the admin dashboard — enabling real-time fleet monitoring across all kiosk PCs.

---

# 7. AI ASSISTANT SYSTEM

## 7.1 Architecture
The bilingual AI assistant uses a two-path approach based on automatic language detection:

```
User Voice Input (Hindi / English)
          │
    ┌─────▼─────┐
    │ Language  │
    │ Detection │  → Checks for Devanagari Unicode (U+0900–U+097F)
    └─────┬─────┘
          │
    ┌─────▼──────────────────────────────┐
    │  Hindi?                English?    │
    │     ↓                      ↓       │
    │ Keyword match         API call to  │
    │ hindi_faq.json        AI Server    │
    │ (instant, local)      (GPT-2)      │
    └────────────────────────────────────┘
```

## 7.2 Hindi FAQ System
- Keyword-based matcher against `hindi_faq.json`
- Covers: bill payments, forms, complaints, UPI, receipts, help queries
- Bilingual keys (Hindi script + romanized) for maximum coverage
- Zero latency — runs entirely client-side in the browser

## 7.3 English GPT-2 System
- FastAPI server runs locally on Admin PC (port 8001)
- Exposed via ngrok tunnel to the cloud backend
- Backend proxies English queries to `/ai/chat` endpoint
- HuggingFace GPT-2 model (~500MB, downloaded once)

## 7.4 Voice Input
- Uses Web Speech API (`SpeechRecognition`) built into Chrome/Edge
- Language set to `hi-IN` — supports both Hindi and English in same session
- Works in browser and Electron (Chromium engine)

---

# 8. KIOSK FEATURES

## 8.1 Service Modules

### Bill Payment Flow
1. Select bill type (Electricity / Gas / Property Tax)
2. Enter account number and mobile number
3. Backend fetches bill details from mock server
4. Choose payment method: **UPI** (QR code scan) or **Cash** (counter payment)
5. Receipt generated with unique number (`RCP-YYYYMMDD-SEQ`)

### Government Form Applications
Available forms:
- Gas Connection
- Driving Test Slot Booking
- Health Scheme Enrollment
- Scholarship Application
- Property Registry

### Grievance Filing (4-Step Flow)
1. Enter mobile number (validated Indian format)
2. Select department (Electricity / Gas / Water / Sanitation / Roads / Ration / Other)
3. Describe complaint — by typing or voice (Hindi/English)
4. Review and submit → generates complaint ID (`GRV-YYYYMMDD-SEQ`)

## 8.2 UX Features
- **Bilingual UI** — English and Hindi on all screens
- **Voice input** — 🎤 button for hands-free complaint filing
- **AI Assistant** — floating voice help button on home screen
- **90-second inactivity auto-reset** — returns to home screen automatically
- **Hardware warning banner** — shown when printer/scanner is offline
- **On-screen keyboard** — for touchscreen kiosk PCs

---

# 9. ADMIN DASHBOARD FEATURES

## 9.1 Panels

| Panel | Features |
|---|---|
| **Kiosk Fleet** | Live online/offline status for all kiosks, last heartbeat time |
| **Live Requests** | Real-time WebSocket event feed, transaction counter |
| **Maintenance** | Hardware diagnostics per kiosk, printer/scanner event log |
| **Physical Payments** | One-click cash payment approval, pending queue |
| **All Transactions** | Paginated transaction history across all kiosks |
| **Pending Applications** | All submitted government forms pending processing |

## 9.2 Real-Time Capabilities
- WebSocket-connected — updates without refresh
- Live counter badge on "Live Requests" tab
- Instant notification when kiosk goes online/offline

---

# 10. OFFLINE RESILIENCE

The `sync_queue` table provides offline durability:
- If the kiosk loses internet mid-transaction, data is queued locally
- When connectivity resumes, the backend automatically retries queued items
- Sync status tracked: `pending → syncing → done / failed`
- Each item retried up to N times with exponential backoff

---

# 11. DEPLOYMENT ARCHITECTURE

## 11.1 Cloud Services

| Service | Platform | URL Pattern |
|---|---|---|
| Backend API | Railway | `https://suvidha-backend.up.railway.app` |
| Govt Mock Server | Railway | `https://suvidha-mock.up.railway.app` |
| Kiosk Frontend | Vercel | `https://suvidha-kiosk.vercel.app` |
| Admin Dashboard | Vercel | `https://suvidha-admin.vercel.app` |
| Database | Supabase | `db.xxxx.supabase.co:5432` |
| AI Tunnel | ngrok | `https://xxxx.ngrok-free.app` |

## 11.2 Deployment Notes
- Railway auto-deploys on GitHub push via `Procfile`
- Vercel auto-deploys on GitHub push with `npm run build:web`
- `ELECTRON_SKIP_BINARY_DOWNLOAD=1` set on Vercel to exclude Electron binary
- All secrets injected via environment variables — zero hardcoded credentials

---

# 12. PROJECT QUALITY HIGHLIGHTS

| Quality | Detail |
|---|---|
| **Scalability** | Railway auto-scales; connection pool capped at 10 concurrent DB connections |
| **Resilience** | Offline sync queue, heartbeat monitoring, hardware alerts |
| **Security** | 6-layer security stack from headers to payload encryption |
| **Bilingual** | Full Hindi + English support in UI, voice input, and AI |
| **Real-time** | WebSocket hub enables sub-second event propagation |
| **Modularity** | Independent services (backend, mock server, AI) can scale separately |
| **Cross-platform** | Same frontend code runs as Electron app and web browser app |
| **Type Safety** | Joi validation on all API inputs with precise error messages |

---

*Document generated for SUVIDHA v1.0 — Government Civic Utility Kiosk System*
*Built with Node.js, React, PostgreSQL, Python FastAPI, GPT-2, Railway, Vercel, Supabase*
