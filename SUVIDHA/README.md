# SUVIDHA — Government Civic Utility Kiosk System

> A full-stack, bilingual, multi-kiosk civic services platform with Electron frontends, Node.js cloud backend, Python AI server, and real-time admin dashboard.

---

## 🗂 Project Structure

```
SUVIDHA/
├── backend/               ← Node.js + Express (Railway)
├── govt_mock_server/      ← Mock Govt Endpoint (Railway)
├── frontend/
│   ├── kiosk/             ← Electron + React + Vite (Kiosk PC)
│   └── admin/             ← Electron + React + Vite (Admin PC)
├── ai_system/             ← Python FastAPI + GPT-2 (Admin PC)
├── database/
│   └── migrations/        ← SQL files (run on Supabase)
└── hardware/              ← Notes for printer/scanner drivers
```

---

## ⚡ Quick Start

### Step 1 — Prerequisites

Install the following before anything else:

| Tool | Version | Download |
|---|---|---|
| Node.js | v20 LTS | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| Git | Latest | https://git-scm.com |

Create free accounts on the following platforms:

| Platform | Purpose | URL |
|---|---|---|
| Supabase | PostgreSQL cloud database | https://supabase.com |
| Railway | Cloud hosting for backend services | https://railway.app |
| ngrok | Expose local AI server to the internet | https://ngrok.com |

---

## 🗄️ Step 2 — Database Setup (Supabase — Run Migrations)

This is the most critical setup step. All three migration files **must be run in order**.

### 2.1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **"New Project"** in the top left.
3. Fill in:
   - **Organization**: Select or create one (e.g. "SUVIDHA Org")
   - **Name**: `suvidha` (or any name you prefer)
   - **Database Password**: Set a strong password — **save this somewhere safe**, you'll need it later.
   - **Region**: Choose the region closest to you (e.g. South Asia → Singapore)
4. Click **"Create new project"** and wait 1–2 minutes for provisioning.

### 2.2 — Get Your Database Connection String

1. In your Supabase project, go to **Settings → Database** (left sidebar).
2. Scroll down to the **"Connection string"** section.
3. Click the **URI** tab and copy the connection string. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the password you set in Step 2.1.
5. Save this string — it will be used as `DATABASE_URL` in backend `.env` files.

> **⚠️ Important:** Never commit this string to Git. It grants full access to your database.

### 2.3 — Run Migration File 1: `001_init.sql` (Core Tables)

This file creates the main tables: `kiosks`, `transactions`, `bill_payments`, `form_applications`, `complaints`, `daily_receipt_counter`, and `physical_payment_approvals`.

**Steps:**
1. In your Supabase project, click **"SQL Editor"** in the left sidebar.
2. Click **"New query"** (top right of the editor).
3. Open `database/migrations/001_init.sql` from this project in any text editor.
4. Copy the **entire contents** of the file.
5. Paste it into the Supabase SQL Editor.
6. Click the **"Run" button** (or press `Ctrl+Enter` / `Cmd+Enter`).
7. You should see: `Success. No rows returned` at the bottom.

**Tables created by this file:**
- `kiosks` — Registry of all physical kiosk machines
- `transactions` — Master record for every kiosk activity (bill, form, complaint)
- `bill_payments` — Electricity, gas, property tax payment records
- `form_applications` — Government form submissions (gas connection, driving test, etc.)
- `complaints` — Citizen grievance/complaint records
- `daily_receipt_counter` — Auto-incrementing daily receipt number
- `physical_payment_approvals` — Cash payment approval workflow

### 2.4 — Run Migration File 2: `002_queue.sql` (Sync Queue)

This file creates the offline sync queue table that buffers data when the kiosk loses internet connectivity.

**Steps:**
1. In the SQL Editor, click **"New query"** to open a fresh editor tab.
2. Open `database/migrations/002_queue.sql` and copy its entire contents.
3. Paste into the editor and click **"Run"**.
4. You should see: `Success. No rows returned`.

**Tables and indexes created:**
- `sync_queue` — Holds pending transaction batches to be pushed to the government mock server
- Index on `status` column — for fast filtering by pending/syncing/done/failed
- Index on `created_at` column — for ordered processing

> **⚠️ Run this only after `001_init.sql` succeeds**, because `sync_queue` has a foreign key referencing `transactions`.

### 2.5 — Run Migration File 3: `003_kiosks_diagnostics.sql` (Hardware Diagnostics)

This file creates tables for logging printer/scanner hardware events from each kiosk, and the table used by the government mock server to record received data.

**Steps:**
1. In the SQL Editor, click **"New query"** again.
2. Open `database/migrations/003_kiosks_diagnostics.sql` and copy its entire contents.
3. Paste into the editor and click **"Run"**.
4. You should see: `Success. No rows returned`.

**Tables and indexes created:**
- `machine_diagnostics` — Hardware event log per kiosk (printer/scanner status, paper levels, jams, etc.)
- `govt_received_records` — Stores all data batches received by the government mock server
- Indexes on `kiosk_id`, `created_at`, `batch_id`, and `received_at` for performance

> **⚠️ Run this only after `002_queue.sql` succeeds**, because `machine_diagnostics` references `kiosks`.

### 2.6 — Verify the Migration

After running all three files, verify the tables were created:

1. In the SQL Editor, open a new query and run:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
2. You should see all 9 tables listed:
   - `bill_payments`
   - `complaints`
   - `daily_receipt_counter`
   - `form_applications`
   - `govt_received_records`
   - `kiosks`
   - `machine_diagnostics`
   - `physical_payment_approvals`
   - `sync_queue`
   - `transactions`

Alternatively, click **"Table Editor"** in the left sidebar to see all tables visually.

### 2.7 — Register Your First Kiosk

Before the backend can accept requests from a kiosk, the kiosk must exist in the `kiosks` table. Run this in the SQL Editor (adjust values as needed):

```sql
INSERT INTO kiosks (id, name, location, status)
VALUES
  ('KIOSK-1', 'Main Hall Kiosk', 'Ground Floor, Municipal Office', 'offline'),
  ('KIOSK-2', 'Counter 2 Kiosk', 'First Floor, Wing B', 'offline');
```

> Add one row per physical kiosk machine. The `id` must match exactly what you set in the kiosk frontend's `VITE_KIOSK_ID` environment variable.

---

## 🚂 Step 3 — Backend Deployment (Railway)

The main Node.js + Express API server is deployed to Railway. It connects to Supabase and exposes REST + WebSocket endpoints.

### 3.1 — Prepare the Backend Locally

```bash
cd backend
```

Create the `.env` file:
```bash
# On Windows:
copy NUL .env

# On Mac/Linux:
touch .env
```

Open `.env` and fill in the following values:

```env
# PostgreSQL connection string from Supabase (Step 2.2)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres

# A secret key used to authenticate admin dashboard requests
# Generate one: open a terminal and run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_API_KEY=your_generated_secret_key_here

# The public URL of the government mock server (set after Step 4)
GOVT_SERVER_URL=https://your-mock-server.railway.app

# The public URL of the AI server (set after Step 5 — ngrok)
AI_SERVER_URL=https://xxxx-xx-xx-xx.ngrok-free.app

# Port (Railway sets this automatically, but set it for local dev)
PORT=3000
```

Test the backend locally first:
```bash
npm install
npm start
```

You should see output like:
```
SUVIDHA Backend running on port 3000
Database connected
```

### 3.2 — Deploy to Railway

1. Go to [https://railway.app](https://railway.app) and sign in.
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Connect your GitHub account and select this repository.
4. When prompted to select the root directory, type `backend` (or configure it in Railway settings).
5. Railway will detect the `Procfile` and automatically run: `node src/index.js`

**Set environment variables in Railway:**
1. In your Railway project, click on the service → **"Variables"** tab.
2. Add each variable from your `.env` file above.
3. Click **"Deploy"** — Railway will restart the service with the new variables.

**Get your backend URL:**
- After deploy, Railway gives you a URL like `https://suvidha-backend.railway.app`
- This is your `VITE_BACKEND_URL` (used by frontend) and `GOVT_SERVER_URL` cross-reference.

---

## 🏛️ Step 4 — Government Mock Server (Railway)

The mock server simulates a government data endpoint that receives synced data from SUVIDHA kiosks.

### 4.1 — Prepare Locally

```bash
cd govt_mock_server
```

Create and fill `.env`:
```env
# Same Supabase connection string as backend
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres

PORT=3001
```

Test locally:
```bash
npm install
npm start
```

### 4.2 — Deploy to Railway (Separate Service)

1. In Railway, click **"New Service"** within the same project (or create a new project).
2. Deploy from the same GitHub repo, but set the root directory to `govt_mock_server`.
3. Set the `DATABASE_URL` environment variable in Railway.
4. After deploy, copy the public URL (e.g. `https://suvidha-mock.railway.app`).
5. Paste this URL as `GOVT_SERVER_URL` in your **backend** Railway service variables.

---

## 🤖 Step 5 — AI Server (Admin PC + ngrok)

The Python FastAPI server with the GPT-2 model runs **locally on the Admin PC** and is exposed to the internet via ngrok so the Railway backend can reach it.

### 5.1 — Install and Start the AI Server

```bash
cd ai_system
```

Create a Python virtual environment (recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies and download the model:
```bash
pip install -r requirements.txt
python download_model.py      # One-time setup — downloads GPT-2 model (~500 MB)
python model_server.py        # Starts the FastAPI server on port 8001
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### 5.2 — Expose the AI Server via ngrok

The AI server is on your local machine, so the Railway backend (in the cloud) cannot reach it directly. ngrok creates a public tunnel to your local port.

1. Sign up at [https://ngrok.com](https://ngrok.com) and install the CLI.
2. Authenticate ngrok (one-time):
   ```bash
   ngrok authtoken YOUR_NGROK_AUTHTOKEN
   ```
   (Find your token at https://dashboard.ngrok.com/get-started/your-authtoken)
3. In a **new terminal** (keep the AI server running in the first), run:
   ```bash
   ngrok http 8001
   ```
4. ngrok will display something like:
   ```
   Forwarding  https://abcd-1234-56-78.ngrok-free.app -> http://localhost:8001
   ```
5. Copy the `https://...ngrok-free.app` URL.

### 5.3 — Update Backend with the ngrok URL

1. Open Railway → backend service → **Variables**.
2. Update `AI_SERVER_URL` to your ngrok URL (e.g. `https://abcd-1234.ngrok-free.app`).
3. Click **"Deploy"** to restart the backend.

> **⚠️ Important:** The free ngrok URL changes every time you restart ngrok. You must update `AI_SERVER_URL` in Railway each session, or upgrade to a paid ngrok plan for a static domain.

---

## 💻 Step 6 — Kiosk Frontend Setup

The kiosk runs on a dedicated PC as an Electron desktop app.

### 6.1 — Configure Environment

```bash
cd frontend/kiosk
```

Create `.env`:
```env
# URL of your Railway backend (from Step 3.2)
VITE_BACKEND_URL=https://suvidha-backend.railway.app

# WebSocket URL of your Railway backend (replace https with wss)
VITE_WS_URL=wss://suvidha-backend.railway.app

# Must exactly match the kiosk ID you inserted into the database (Step 2.7)
VITE_KIOSK_ID=KIOSK-1

# Friendly display name for this kiosk
VITE_KIOSK_NAME=Main Hall Kiosk

# Physical location label
VITE_KIOSK_LOCATION=Ground Floor, Municipal Office
```

### 6.2 — Run the Kiosk

```bash
npm install

# Development mode (browser):
npm run dev          # Opens Vite dev server on http://localhost:5173

# Electron desktop app:
npm run electron     # Opens as a desktop window
```

---

## 🖥️ Step 7 — Admin Dashboard Setup

The admin dashboard also runs as an Electron app on a separate Admin PC.

### 7.1 — Configure Environment

```bash
cd frontend/admin
```

Create `.env`:
```env
# Same Railway backend URL
VITE_BACKEND_URL=https://suvidha-backend.railway.app

# WebSocket URL
VITE_WS_URL=wss://suvidha-backend.railway.app

# Must match ADMIN_API_KEY set in the backend .env (Step 3.1)
VITE_ADMIN_API_KEY=your_generated_secret_key_here
```

### 7.2 — Run the Admin Dashboard

```bash
npm install
npm run dev          # http://localhost:5174
```

---

## 🔑 Environment Variables Summary

| Service | Variable | Description |
|---|---|---|
| Backend | `DATABASE_URL` | Supabase PostgreSQL connection string |
| Backend | `ADMIN_API_KEY` | Secret key for admin API authentication |
| Backend | `GOVT_SERVER_URL` | Public URL of the govt mock server on Railway |
| Backend | `AI_SERVER_URL` | Public ngrok URL of the local AI server |
| Backend | `PORT` | Server port (Railway sets automatically) |
| Govt Mock | `DATABASE_URL` | Same Supabase connection string |
| Kiosk | `VITE_BACKEND_URL` | Backend Railway URL (`https://...`) |
| Kiosk | `VITE_WS_URL` | Backend Railway URL (`wss://...`) |
| Kiosk | `VITE_KIOSK_ID` | Unique kiosk ID — must match `kiosks` table |
| Kiosk | `VITE_KIOSK_NAME` | Display name for this kiosk |
| Kiosk | `VITE_KIOSK_LOCATION` | Physical location label |
| Admin | `VITE_BACKEND_URL` | Backend Railway URL (`https://...`) |
| Admin | `VITE_WS_URL` | Backend Railway URL (`wss://...`) |
| Admin | `VITE_ADMIN_API_KEY` | Must match backend `ADMIN_API_KEY` |

---

## 📋 Setup Checklist

Use this checklist when deploying SUVIDHA for the first time:

- [ ] Supabase project created
- [ ] `001_init.sql` run successfully (9 tables visible in Table Editor)
- [ ] `002_queue.sql` run successfully
- [ ] `003_kiosks_diagnostics.sql` run successfully
- [ ] Kiosk IDs inserted into `kiosks` table via SQL
- [ ] Backend `.env` filled and tested locally
- [ ] Backend deployed to Railway with all env variables set
- [ ] Govt mock server deployed to Railway
- [ ] `GOVT_SERVER_URL` updated in backend Railway variables
- [ ] AI server running locally (`python model_server.py`)
- [ ] ngrok tunnel active (`ngrok http 8001`)
- [ ] `AI_SERVER_URL` updated in backend Railway variables
- [ ] Kiosk `.env` configured with correct `VITE_KIOSK_ID`
- [ ] Admin `.env` configured with matching `VITE_ADMIN_API_KEY`
- [ ] Kiosk and admin frontends running and connected

---

## 📱 Kiosk Features
- **Bill Payments** — Electricity, Gas, Property Tax · UPI (QR) or Cash receipt
- **Government Forms** — Gas Connection, Driving Test, Health Scheme, Scholarship, Property Registry
- **Grievance** — 4-step complaint flow with voice input (Hindi + English)
- **Bilingual Voice AI** — 🎤 button, Devanagari detection → Hindi FAQ or GPT-2 English
- **90-second inactivity auto-reset** to home screen
- **Hardware warnings** — banner shown when printer/scanner offline

## 🖥 Admin Features
- **Kiosk Fleet** — Live online/offline status for all kiosks
- **Live Requests** — Real-time WebSocket event feed
- **Maintenance** — Hardware diagnostics per kiosk
- **Physical Payments** — One-click cash payment approval
- **All Transactions** — Complete history
- **Pending Applications** — All form submissions

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Kiosk & Admin UI | Electron 29 + React 18 + Vite 5 |
| Backend API | Node.js 20 + Express 4 |
| Real-time | WebSockets (`ws`) |
| Database | PostgreSQL (Supabase) |
| AI Server | Python FastAPI + GPT-2 (HuggingFace) |
| Deployment | Railway (backend) + ngrok (AI) |
| Security | helmet, express-rate-limit, AES-256-GCM, API key auth |
