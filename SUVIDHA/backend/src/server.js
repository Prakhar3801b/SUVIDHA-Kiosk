require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const { setupWebSocket } = require('./websocket/wsHub');
const { runMigrations } = require('./db/migrations');
const rateLimiter = require('./middleware/rateLimiter');

// Routes
const paymentsRouter = require('./routes/payments');
const formsRouter = require('./routes/forms');
const complaintsRouter = require('./routes/complaints');
const adminRouter = require('./routes/admin');
const kiosksRouter = require('./routes/kiosks');
const aiRouter = require('./routes/ai');
const diagnosticsRouter = require('./routes/diagnostics');

const app = express();
const server = http.createServer(app);

// ─── Security Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' })); // locked to specific origins in prod
app.use(express.json({ limit: '1mb' }));
app.use(rateLimiter);

// ─── WebSocket Setup ───────────────────────────────────────────────
setupWebSocket(server);

// ─── Health Check ─────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── API Routes ────────────────────────────────────────────────────
app.use('/api/payments', paymentsRouter);
app.use('/api/forms', formsRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/kiosks', kiosksRouter);
app.use('/api/ai', aiRouter);
app.use('/api/diagnostics', diagnosticsRouter);

// ─── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const pool = require('./db/pool');

async function start() {
    // ── Explicit DB connection test ──────────────────────────────
    try {
        await pool.query('SELECT 1');
        console.log('✅ Database connected');
    } catch (err) {
        console.error('❌ Database connection FAILED:', err.message);
        console.error('   Check DATABASE_URL in Railway Variables.');
        // Do not exit — keep server alive so Railway logs stay visible
    }

    await runMigrations();
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ SUVIDHA Backend running on port ${PORT}`);
    });
}
start();
